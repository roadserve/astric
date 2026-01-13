import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  })

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

function ymdToParts(ymd: string) {
  const [y, m, d] = ymd.split("-").map((x) => Number(x))
  return { year: y, month: m, day: d }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  let step = "init"
  try {
    step = "parse_request"
    const { organization_id, days = 30 } = await req.json()
    if (!organization_id) {
      return new Response(
        JSON.stringify({ error: "Missing organization_id", step }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      )
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
      return new Response(
        JSON.stringify({ error: "Unauthorized", details: userErr?.message, step }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
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
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      )
    }

    if (!member) {
      return new Response(
        JSON.stringify({ error: "Forbidden", details: "Not a member of this org", step }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      )
    }

    step = "fetch_locations"
    const { data: locations, error: locErr } = await supabaseAdminClient
      .from("gmb_locations")
      .select("id, organization_id, location_id, location_name, gmb_account:gmb_accounts(id, account_id, access_token, refresh_token, token_expires_at, is_active)")
      .eq("organization_id", organization_id)
      .eq("gmb_account.is_active", true)

    if (locErr) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch locations", details: locErr.message, step }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      )
    }

    const safeDays = Math.max(1, Math.min(Number(days) || 30, 90))
    const end = new Date()
    const start = new Date(Date.now() - safeDays * 24 * 60 * 60 * 1000)
    const endYmd = end.toISOString().slice(0, 10)
    const startYmd = start.toISOString().slice(0, 10)

    const metrics = [
      // Updated metric names (GBP Performance API)
      "WEBSITE_CLICKS",
      "CALL_CLICKS",
      "BUSINESS_DIRECTION_REQUESTS",
      "BUSINESS_IMPRESSIONS_DESKTOP_MAPS",
      "BUSINESS_IMPRESSIONS_MOBILE_MAPS",
      "BUSINESS_IMPRESSIONS_DESKTOP_SEARCH",
      "BUSINESS_IMPRESSIONS_MOBILE_SEARCH",
    ]

    let totalPointsUpserted = 0
    const perLocation: any[] = []

    for (const loc of locations || []) {
      const account = (loc as any).gmb_account
      if (!account) continue

      try {
        step = "refresh_token"
        const accessToken = await refreshAccessTokenIfNeeded(supabaseAdminClient, account)

        step = "fetch_performance"
        const url = new URL(
          `https://businessprofileperformance.googleapis.com/v1/locations/${loc.location_id}:fetchMultiDailyMetricsTimeSeries`,
        )
        for (const m of metrics) url.searchParams.append("dailyMetrics", m)
        url.searchParams.set("dailyRange.start_date.year", String(ymdToParts(startYmd).year))
        url.searchParams.set("dailyRange.start_date.month", String(ymdToParts(startYmd).month))
        url.searchParams.set("dailyRange.start_date.day", String(ymdToParts(startYmd).day))
        url.searchParams.set("dailyRange.end_date.year", String(ymdToParts(endYmd).year))
        url.searchParams.set("dailyRange.end_date.month", String(ymdToParts(endYmd).month))
        url.searchParams.set("dailyRange.end_date.day", String(ymdToParts(endYmd).day))

        const resp = await fetch(url.toString(), {
          headers: { Authorization: `Bearer ${accessToken}` },
        })

        if (!resp.ok) {
          const t = await resp.text()
          perLocation.push({
            location_id: loc.id,
            location_name: loc.location_name,
            error: t,
            status: resp.status,
          })
          continue
        }

        const data = await resp.json()

        // Store raw response for audit/debug (best-effort; do not fail sync if insert fails)
        try {
          await supabaseAdminClient.from("gmb_insights_fetches").insert({
            organization_id,
            gmb_location_id: loc.id,
            kind: "multi_daily_metrics",
            request: {
              url: url.toString(),
              metrics,
              start: startYmd,
              end: endYmd,
              days: safeDays,
            },
            response: data,
          })
        } catch (e) {
          console.warn("Failed to store gmb_insights_fetches:", e?.message || String(e))
        }

        const multi = data?.multiDailyMetricTimeSeries ?? []

        let upserts = 0
        for (const m of multi) {
          const dailySeries = m?.dailyMetricTimeSeries ?? []
          if (!Array.isArray(dailySeries)) continue

          for (const series of dailySeries) {
            const metricType = series?.dailyMetric ?? null
            const points =
              series?.timeSeries?.datedValues ??
              series?.timeSeries?.datedValue ?? // defensive
              series?.timeSeries ??
              []
            if (!metricType || !Array.isArray(points)) continue

            for (const p of points) {
              const dateObj = p?.date
              const rawValue =
                p?.value?.intValue ??
                p?.value?.value ??
                p?.value
              if (!dateObj || (typeof rawValue !== "string" && typeof rawValue !== "number")) continue

              const y = String(dateObj.year).padStart(4, "0")
              const m2 = String(dateObj.month).padStart(2, "0")
              const d = String(dateObj.day).padStart(2, "0")
              const date = `${y}-${m2}-${d}`
              const metric_value = Number(rawValue)
              if (!Number.isFinite(metric_value)) continue

              const { error: upErr } = await supabaseAdminClient
                .from("gmb_insights")
                .upsert(
                  {
                    gmb_location_id: loc.id,
                    organization_id,
                    metric_type: metricType,
                    metric_value,
                    date,
                  },
                  { onConflict: "gmb_location_id,metric_type,date" },
                )

              if (!upErr) {
                upserts++
                totalPointsUpserted++
              }
            }
          }
        }

        perLocation.push({
          location_id: loc.id,
          location_name: loc.location_name,
          upserted: upserts,
        })
      } catch (e: any) {
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
        days: safeDays,
        total_points_upserted: totalPointsUpserted,
        locations: perLocation,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: "Internal server error", details: err?.message || String(err), step }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  }
})

