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
  account: any
): Promise<string> {
  const accessToken = account?.access_token
  if (!accessToken) throw new Error("Missing access token for GMB account")

  const expiresAt = account?.token_expires_at ? new Date(account.token_expires_at).getTime() : null
  const needsRefresh = expiresAt ? expiresAt - Date.now() < 60_000 : false
  if (!needsRefresh) return accessToken

  const refreshToken = account?.refresh_token
  const googleClientId = (Deno.env.get("GOOGLE_CLIENT_ID") ?? "").trim()
  const googleClientSecret = (Deno.env.get("GOOGLE_CLIENT_SECRET") ?? "").trim()
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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  let step = "init"
  const startedAt = Date.now()
  const maxRunMs = 45_000
  try {
    step = "parse_request"
    const { organization_id, gmb_location_id } = await req.json()
    if (!organization_id) {
      return new Response(
        JSON.stringify({ error: "Missing organization_id", step }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    step = "check_auth_header"
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized", details: "Missing Authorization header", step }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    step = "create_clients"
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    const serviceRoleKey = (Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "").trim()

    const supabaseUserClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const supabaseAdminClient = createClient(supabaseUrl, serviceRoleKey || anonKey)

    step = "get_user"
    const { data: userData, error: userErr } = await supabaseUserClient.auth.getUser()
    if (userErr || !userData?.user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized", details: userErr?.message, step }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
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
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }
    if (!member) {
      return new Response(
        JSON.stringify({ error: "Forbidden", details: "Not a member of this org", step }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    step = "fetch_locations"
    let locQuery = supabaseAdminClient
      .from("gmb_locations")
      .select("id, location_id, location_name, organization_id, gmb_account:gmb_accounts(id, account_id, access_token, refresh_token, token_expires_at, is_active)")
      .eq("organization_id", organization_id)

    if (gmb_location_id) locQuery = locQuery.eq("id", gmb_location_id)

    const { data: locs, error: locErr } = await locQuery
    if (locErr) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch locations", details: locErr.message, step }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const results: any[] = []
    let totalUpserted = 0

    for (const loc of locs || []) {
      if (Date.now() - startedAt > maxRunMs) break
      const account = (loc as any).gmb_account
      if (!account || account?.is_active === false) continue

      try {
        step = "refresh_token"
        const token = await refreshAccessTokenIfNeeded(supabaseAdminClient, account)

        const accountId = String(account?.account_id || "")
        const locationId = String((loc as any).location_id || "")
        if (!accountId || !locationId) throw new Error("Missing account_id or location_id")

        step = "list_posts"
        const url = new URL(`https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/localPosts`)
        url.searchParams.set("pageSize", "100")
        const resp = await fetchWithTimeout(url.toString(), {
          headers: { Authorization: `Bearer ${token}` },
        }, 15_000)
        const bodyText = await resp.text()
        let json: any = {}
        try {
          json = bodyText ? JSON.parse(bodyText) : {}
        } catch {
          json = { raw: bodyText }
        }

        // Store response for audit/debug (best-effort) - INCLUDING failures
        try {
          await supabaseAdminClient.from("gmb_insights_fetches").insert({
            organization_id,
            gmb_location_id: loc.id,
            kind: "local_posts",
            request: { url: url.toString(), pageSize: 100 },
            response: {
              ok: resp.ok,
              status: resp.status,
              body: json,
            },
            fetched_at: new Date().toISOString(),
          })
        } catch (e) {
          console.warn("Failed to store gmb_insights_fetches (posts):", e?.message || String(e))
        }

        if (!resp.ok) throw new Error(`${resp.status} ${resp.statusText}: ${bodyText}`)

        const posts = Array.isArray(json.localPosts) ? json.localPosts : []

        let perLocUpserted = 0
        for (const p of posts) {
          const googlePostName = p?.name ?? null
          const callToAction = p?.callToAction?.actionType ?? null
          const actionUrl = p?.callToAction?.url ?? null
          const postType = p?.event?.title ? "EVENT" : p?.offer?.couponCode ? "OFFER" : "STANDARD"
          const title = p?.summary ?? p?.event?.title ?? null
          const content = p?.summary ?? ""
          const state = String(p?.state || "").toUpperCase()
          // Our UI expects: draft/scheduled/published/failed
          const status =
            state === "LIVE"
              ? "published"
              : state === "REJECTED"
                ? "failed"
                : state === "PENDING" || state === "PROCESSING"
                  ? "scheduled"
                  : "draft"

          const { data: upData, error: upErr } = await supabaseAdminClient
            .from("gmb_posts")
            .upsert(
              {
                organization_id,
                title,
                content,
                call_to_action: callToAction,
                action_url: actionUrl,
                media_urls: Array.isArray(p?.media) ? p.media.map((m: any) => m?.googleUrl).filter(Boolean) : null,
                post_type: postType,
                event_details: p?.event ?? null,
                offer_details: p?.offer ?? null,
                target_locations: [loc.id],
                status,
                scheduled_at: p?.scheduledEvent?.startTime ?? null,
                // Use updateTime when present; fallback to createTime
                published_at: p?.updateTime ?? p?.createTime ?? null,
                created_by: userData.user.id,
                google_post_name: googlePostName,
                raw_post: p ?? null,
              },
              { onConflict: "organization_id,google_post_name" }
            )
            // Force PostgREST to return representation so we can audit success/ids
            .select("id, created_at")

          if (upErr) {
            // Log upsert failures so Freshness issues are diagnosable
            try {
              await supabaseAdminClient.from("gmb_insights_fetches").insert({
                organization_id,
                gmb_location_id: loc.id,
                kind: "local_posts_upsert_error",
                request: { google_post_name: googlePostName },
                response: { error: upErr },
                fetched_at: new Date().toISOString(),
              })
            } catch {
              // ignore
            }
          } else {
            perLocUpserted++
            totalUpserted++
            // Best-effort success log (helps debug "silent no-insert" cases)
            try {
              await supabaseAdminClient.from("gmb_insights_fetches").insert({
                organization_id,
                gmb_location_id: loc.id,
                kind: "local_posts_upsert_ok",
                request: { google_post_name: googlePostName },
                response: {
                  row: Array.isArray(upData) ? upData[0] ?? null : upData ?? null,
                  state,
                  mapped_status: status,
                },
                fetched_at: new Date().toISOString(),
              })
            } catch {
              // ignore
            }
          }
        }

        results.push({
          gmb_location_id: loc.id,
          location_name: (loc as any).location_name,
          upserted: perLocUpserted,
          fetched: posts.length,
        })
      } catch (e: any) {
        // Also log unexpected per-location exceptions for later verification
        try {
          await supabaseAdminClient.from("gmb_insights_fetches").insert({
            organization_id,
            gmb_location_id: loc.id,
            kind: "local_posts_error",
            request: { step },
            response: { error: e?.message || String(e) },
            fetched_at: new Date().toISOString(),
          })
        } catch {
          // ignore
        }
        results.push({
          gmb_location_id: loc.id,
          location_name: (loc as any).location_name,
          error: e?.message || String(e),
          step,
        })
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        upserted: totalUpserted,
        locations: results,
        partial: Date.now() - startedAt > maxRunMs,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: "Internal server error", details: err?.message || String(err), step }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
