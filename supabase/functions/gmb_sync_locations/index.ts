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
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  let step = "init"
  try {
    step = "parse_request"
    const { organization_id, account_db_id } = await req.json()
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

    step = "fetch_accounts"
    let accountsQuery = supabaseAdminClient
      .from("gmb_accounts")
      .select("*")
      .eq("organization_id", organization_id)
      .eq("is_active", true)

    if (account_db_id) {
      accountsQuery = accountsQuery.eq("id", account_db_id)
    }

    const { data: accounts, error: accountsErr } = await accountsQuery
    if (accountsErr) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch accounts", details: accountsErr.message, step }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    let totalLocations = 0
    const perAccount: Array<{ account_db_id: string; locations: number; error?: string }> = []

    // Business Information API requires a valid readMask for list locations.
    // IMPORTANT: Field names must match the API's Location schema.
    // `storefrontAddress` is the correct field (not `address`).
    const readMask =
      "name,title,storeCode,storefrontAddress,phoneNumbers,websiteUri,categories,profile,regularHours,metadata,latlng"

    // Best-effort enrichment: fetch a fuller single-location payload and store it as raw JSON.
    // We keep this conservative to avoid breaking sync if Google rejects any field in readMask.
    const fullReadMaskCandidates = [
      "name,title,storeCode,storefrontAddress,phoneNumbers,websiteUri,categories,profile,regularHours,specialHours,serviceArea,metadata,latlng,openInfo,labels",
      readMask,
    ]

    // Also fetch v4 location state to match GBP UI (Verified / Unverified / Pending edits etc).
    // v1 Business Information API doesn't reliably expose verification fields.
    const v4ReadMask = "locationState,metadata,openInfo"

    for (const acc of accounts || []) {
      try {
        step = "refresh_token_if_needed"
        const token = await refreshAccessTokenIfNeeded(supabaseAdminClient, acc)

        step = "list_locations"
        let pageToken: string | undefined
        let accountLocations = 0

        // account_id is numeric string; API expects accounts/{accountId}
        const parent = `accounts/${acc.account_id}`

        while (true) {
          const url = new URL(`https://mybusinessbusinessinformation.googleapis.com/v1/${parent}/locations`)
          url.searchParams.set("readMask", readMask)
          url.searchParams.set("pageSize", "100")
          if (pageToken) url.searchParams.set("pageToken", pageToken)

          const resp = await fetch(url.toString(), {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          })

          if (!resp.ok) {
            const txt = await resp.text()
            throw new Error(`${resp.status} - ${txt}`)
          }

          const json = await resp.json()
          const locations = Array.isArray(json.locations) ? json.locations : []

          for (const location of locations) {
            step = "upsert_location"
            const locationId = String(location.name || "").includes("/")
              ? String(location.name).split("/").pop()
              : location.locationId || location.location_id

            if (!locationId) continue

            // Try to fetch a fuller payload for this location (best-effort).
            let rawLocationFull: any = null
            let rawLocationV4: any = null
            const resourceName = typeof location?.name === "string" ? location.name : null // e.g. "locations/123"
            if (resourceName) {
              for (const mask of fullReadMaskCandidates) {
                try {
                  step = "get_location_full"
                  const getUrl = new URL(`https://mybusinessbusinessinformation.googleapis.com/v1/${resourceName}`)
                  getUrl.searchParams.set("readMask", mask)
                  const getResp = await fetch(getUrl.toString(), {
                    headers: {
                      Authorization: `Bearer ${token}`,
                      "Content-Type": "application/json",
                    },
                  })
                  if (!getResp.ok) {
                    // If the mask is invalid, try the next one.
                    continue
                  }
                  rawLocationFull = await getResp.json()
                  break
                } catch {
                  // keep trying other masks
                }
              }
            }

            // v4 location state (best-effort)
            try {
              step = "get_location_state_v4"
              const v4Url = new URL(
                `https://mybusiness.googleapis.com/v4/accounts/${acc.account_id}/locations/${locationId}`,
              )
              v4Url.searchParams.set("readMask", v4ReadMask)
              const v4Resp = await fetch(v4Url.toString(), {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
              })
              if (v4Resp.ok) {
                rawLocationV4 = await v4Resp.json()
              }
            } catch {
              // ignore
            }

            const v4State = rawLocationV4?.locationState || null
            const computedIsVerified =
              typeof v4State?.isVerified === "boolean"
                ? v4State.isVerified
                : location.metadata?.mapsUri
                  ? true
                  : false
            const computedIsPublished =
              typeof v4State?.isPublished === "boolean"
                ? v4State.isPublished
                : true

            await supabaseAdminClient
              .from("gmb_locations")
              .upsert(
                {
                  gmb_account_id: acc.id,
                  organization_id,
                  location_name: location.title,
                  location_id: locationId,
                  store_code: location.storeCode,
                  address: location.storefrontAddress ?? location.address,
                  phone: location.phoneNumbers?.primaryPhone,
                  website: location.websiteUri,
                  category: location.categories?.primaryCategory?.displayName,
                  categories_json: location.categories ?? null,
                  additional_categories: Array.isArray(location.categories?.additionalCategories)
                    ? location.categories.additionalCategories.map((c: any) => c?.displayName).filter(Boolean)
                    : null,
                  description: location.profile?.description,
                  hours: location.regularHours,
                  attributes: location.attributes,
                  lat: location.latlng?.latitude ?? null,
                  lng: location.latlng?.longitude ?? null,
                  is_verified: computedIsVerified,
                  is_published: computedIsPublished,
                  raw_location: location ?? null,
                  raw_location_full: rawLocationV4 || rawLocationFull
                    ? { v1: rawLocationFull, v4: rawLocationV4 }
                    : null,
                  last_synced_at: new Date().toISOString(),
                },
                { onConflict: "gmb_account_id,location_id" }
              )
          }

          accountLocations += locations.length
          totalLocations += locations.length
          pageToken = json.nextPageToken
          if (!pageToken) break
        }

        perAccount.push({ account_db_id: acc.id, locations: accountLocations })
      } catch (e: any) {
        perAccount.push({ account_db_id: acc.id, locations: 0, error: e?.message || String(e) })
      }
    }

    return new Response(
      JSON.stringify({ success: true, total_locations: totalLocations, accounts: perAccount }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: "Internal server error", details: err?.message || String(err), step }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})

