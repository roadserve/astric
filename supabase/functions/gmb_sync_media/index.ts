import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  let step = "init"
  try {
    step = "parse_request"
    const { organization_id, gmb_location_id } = await req.json()
    if (!organization_id || !gmb_location_id) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters", step }),
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

    step = "fetch_location"
    const { data: loc, error: locErr } = await supabaseAdminClient
      .from("gmb_locations")
      .select("id, location_id, organization_id, gmb_account:gmb_accounts(id, account_id, access_token, refresh_token, token_expires_at)")
      .eq("organization_id", organization_id)
      .eq("id", gmb_location_id)
      .maybeSingle()

    if (locErr || !loc) {
      return new Response(
        JSON.stringify({ error: "Location not found", details: locErr?.message, step }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    step = "refresh_token"
    const token = await refreshAccessTokenIfNeeded(supabaseAdminClient, loc.gmb_account)

    const accountId = String(loc.gmb_account?.account_id || "")
    const locationId = String(loc.location_id || "")
    if (!accountId || !locationId) throw new Error("Missing account_id or location_id")

    step = "list_media"
    const url = `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/media`
    const resp = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const bodyText = await resp.text()
    if (!resp.ok) throw new Error(`${resp.status} ${resp.statusText}: ${bodyText}`)

    const json = bodyText ? JSON.parse(bodyText) : {}
    const mediaItems = Array.isArray(json.mediaItems) ? json.mediaItems : Array.isArray(json.media) ? json.media : []

    let upserted = 0
    for (const m of mediaItems) {
      const googleName = m?.name || null
      const googleUrl = m?.googleUrl || m?.mediaUrl || null
      await supabaseAdminClient.from("gmb_media_assets").insert({
        organization_id,
        gmb_location_id: loc.id,
        google_media_name: googleName,
        media_format: m?.mediaFormat || "PHOTO",
        category: m?.locationAssociation?.category || null,
        source_url: null,
        google_url: googleUrl,
        width: m?.dimensions?.widthPx ?? null,
        height: m?.dimensions?.heightPx ?? null,
        metadata: m,
      })
      upserted++
    }

    return new Response(
      JSON.stringify({ success: true, upserted, total: mediaItems.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: "Internal server error", details: err?.message || String(err), step }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})

