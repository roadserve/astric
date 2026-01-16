import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

async function fetchWithTimeout(input: string | URL, init: RequestInit = {}, timeoutMs = 15_000) {
  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(input, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(t)
  }
}

async function refreshAccessTokenIfNeeded(
  supabaseAdminClient: any,
  account: any,
): Promise<string> {
  const accessToken = account?.access_token
  if (!accessToken) throw new Error("Missing access token for GMB account")

  const expiresAt = account?.token_expires_at ? new Date(account.token_expires_at).getTime() : null
  const needsRefresh = expiresAt ? expiresAt - Date.now() < 60_000 : false
  if (!needsRefresh) return accessToken

  const refreshToken = account?.refresh_token
  const googleClientId = (Deno.env.get("GOOGLE_CLIENT_ID") ?? "").trim()
  const googleClientSecret = (Deno.env.get("GOOGLE_CLIENT_SECRET") ?? "").trim()

  // If we can't refresh, fall back to the existing token (might still work).
  if (!refreshToken || !googleClientId || !googleClientSecret) return accessToken

  const body = new URLSearchParams({
    client_id: googleClientId,
    client_secret: googleClientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  })

  const resp = await fetchWithTimeout("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  }, 12_000)

  if (!resp.ok) {
    const t = await resp.text()
    console.error("Failed to refresh Google token:", t)
    return accessToken
  }

  const tokens = await resp.json()
  const newAccessToken = tokens.access_token || accessToken
  const newExpiresAt = tokens.expires_in
    ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
    : account?.token_expires_at

  await supabaseAdminClient
    .from("gmb_accounts")
    .update({
      access_token: newAccessToken,
      token_expires_at: newExpiresAt,
      last_synced_at: new Date().toISOString(),
    })
    .eq("id", account.id)

  return newAccessToken
}

function monthStart(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1))
}

function addMonths(d: Date, months: number) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + months, 1))
}

function ym01(d: Date) {
  const y = String(d.getUTCFullYear()).padStart(4, "0")
  const m = String(d.getUTCMonth() + 1).padStart(2, "0")
  return `${y}-${m}-01`
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  let step = "init"
  const startedAt = Date.now()
  const maxRunMs = 45_000 // keep under platform timeouts
  try {
    step = "parse_request"
    const { organization_id, months = 3, gmb_location_id, location_ids } = await req.json()
    if (!organization_id) {
      return new Response(JSON.stringify({ error: "Missing organization_id", step }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    step = "check_auth_header"
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized", details: "Missing Authorization header", step }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      )
    }

    step = "create_clients"
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""

    const supabaseUserClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const supabaseAdminClient = createClient(supabaseUrl, serviceRoleKey || anonKey)

    step = "get_user"
    const { data: userData, error: userErr } = await supabaseUserClient.auth.getUser()
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized", details: userErr?.message, step }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    step = "verify_membership"
    const { data: member, error: memberErr } = await supabaseAdminClient
      .from("organization_members")
      .select("id")
      .eq("organization_id", organization_id)
      .eq("user_id", userData.user.id)
      .eq("is_active", true)
      .maybeSingle()

    if (memberErr) {
      return new Response(
        JSON.stringify({ error: "Failed to verify membership", details: memberErr.message, step }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      )
    }
    if (!member) {
      return new Response(JSON.stringify({ error: "Forbidden", details: "Not a member of this org", step }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    step = "fetch_locations"
    let locationsQuery = supabaseAdminClient
      .from("gmb_locations")
      .select("id, organization_id, location_id, location_name, gmb_account:gmb_accounts(id, account_id, access_token, refresh_token, token_expires_at, is_active)")
      .eq("organization_id", organization_id)

    if (gmb_location_id) {
      locationsQuery = locationsQuery.eq("id", gmb_location_id)
    } else if (Array.isArray(location_ids) && location_ids.length) {
      locationsQuery = locationsQuery.in("id", location_ids)
    }

    const { data: locations, error: locErr } = await locationsQuery

    if (locErr) {
      return new Response(JSON.stringify({ error: "Failed to fetch locations", details: locErr.message, step }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const safeMonths = Math.max(1, Math.min(Number(months) || 3, 12))
    const endMonth = monthStart(new Date()) // current month start (UTC)
    const startMonth = addMonths(endMonth, -(safeMonths - 1))

    const perLocation: any[] = []
    let totalRowsUpserted = 0

    for (const loc of locations || []) {
      const account = (loc as any).gmb_account
      if (!account) continue
      if (account?.is_active === false) continue
      if (Date.now() - startedAt > maxRunMs) break

      try {
        step = "refresh_token"
        const accessToken = await refreshAccessTokenIfNeeded(supabaseAdminClient, account)

        let upserts = 0
        // Fetch each month separately so we can store true monthly rows.
        for (let mi = 0; mi < safeMonths; mi++) {
          if (Date.now() - startedAt > maxRunMs) break
          const mStart = addMonths(startMonth, mi)
          const month = ym01(mStart)

          let pageToken: string | null = null
          let page = 0
          for (;;) {
            if (Date.now() - startedAt > maxRunMs) break
            step = "fetch_search_keywords"
            const url = new URL(
              `https://businessprofileperformance.googleapis.com/v1/locations/${loc.location_id}/searchkeywords/impressions/monthly`,
            )
            // IMPORTANT: request a single month (start==end) to avoid ambiguous aggregation.
            url.searchParams.set("monthlyRange.startMonth.year", String(mStart.getUTCFullYear()))
            url.searchParams.set("monthlyRange.startMonth.month", String(mStart.getUTCMonth() + 1))
            url.searchParams.set("monthlyRange.endMonth.year", String(mStart.getUTCFullYear()))
            url.searchParams.set("monthlyRange.endMonth.month", String(mStart.getUTCMonth() + 1))
            if (pageToken) url.searchParams.set("pageToken", pageToken)

            const resp = await fetchWithTimeout(url.toString(), {
              headers: { Authorization: `Bearer ${accessToken}` },
            }, 15_000)

            const bodyText = await resp.text()
            let data: any = {}
            try {
              data = bodyText ? JSON.parse(bodyText) : {}
            } catch {
              data = { raw: bodyText }
            }

            // Store response for audit/debug (best-effort) - INCLUDING failures
            try {
              await supabaseAdminClient.from("gmb_insights_fetches").insert({
                organization_id,
                gmb_location_id: loc.id,
                kind: "search_keywords_monthly",
                request: { url: url.toString(), months: safeMonths, month, page },
                response: {
                  ok: resp.ok,
                  status: resp.status,
                  body: data,
                },
              })
            } catch (e) {
              console.warn("Failed to store gmb_insights_fetches (search keywords):", e?.message || String(e))
            }

            if (!resp.ok) {
              perLocation.push({
                location_id: loc.id,
                location_name: loc.location_name,
                month,
                status: resp.status,
                error: typeof data === "object" ? JSON.stringify(data) : String(data),
              })
              break
            }

            const rows = data?.searchKeywordsCounts ?? data?.searchKeywordCounts ?? []
            const rowsToUpsert: Array<any> = []
            if (Array.isArray(rows)) {
              for (const r of rows) {
                const keyword = String(r?.searchKeyword ?? r?.keyword ?? "").trim()
                const v = r?.insightsValue?.value ?? r?.insightsValue?.intValue ?? null
                const th = r?.insightsValue?.threshold ?? null
                const impressions = Number(v ?? th ?? 0)
                if (!keyword) continue
                if (!Number.isFinite(impressions)) continue
                rowsToUpsert.push({
                  organization_id,
                  gmb_location_id: loc.id,
                  month,
                  keyword,
                  impressions,
                  raw: r ?? null,
                })
              }
            }

            step = "upsert_keywords_batch"
            const chunkSize = 500
            for (let i = 0; i < rowsToUpsert.length; i += chunkSize) {
              if (Date.now() - startedAt > maxRunMs) break
              const chunk = rowsToUpsert.slice(i, i + chunkSize)
              const { error: upErr } = await supabaseAdminClient
                .from("gmb_search_keywords_monthly")
                .upsert(chunk, { onConflict: "gmb_location_id,month,keyword" })
              if (upErr) throw upErr
              upserts += chunk.length
              totalRowsUpserted += chunk.length
            }

            pageToken = data?.nextPageToken ?? null
            page += 1
            if (!pageToken) break
            // avoid infinite loops
            if (page > 25) break
          }
        }

        perLocation.push({
          location_id: loc.id,
          location_name: loc.location_name,
          upserted: upserts,
        })
      } catch (e: any) {
        // Also log unexpected per-location exceptions for later verification
        try {
          await supabaseAdminClient.from("gmb_insights_fetches").insert({
            organization_id,
            gmb_location_id: loc.id,
            kind: "search_keywords_monthly",
            request: { error_step: step, note: "exception" },
            response: {
              ok: false,
              status: null,
              exception: e?.message || String(e),
            },
          })
        } catch {
          // ignore
        }
        perLocation.push({
          location_id: loc.id,
          location_name: loc.location_name,
          error: e?.message || String(e),
        })
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        months: safeMonths,
        total_rows_upserted: totalRowsUpserted,
        locations: perLocation,
        partial: Date.now() - startedAt > maxRunMs,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  } catch (err: any) {
    return new Response(JSON.stringify({ error: "Internal server error", details: err?.message || String(err), step }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})

