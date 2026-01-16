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

function publicObjectUrl(supabaseUrl: string, bucket: string, path: string) {
  const base = supabaseUrl.replace(/\/+$/, "")
  return `${base}/storage/v1/object/public/${bucket}/${path}`
}

function safeMediaId(m: any) {
  const name = String(m?.name || "")
  const tail = name.includes("/") ? name.split("/").pop() : name
  return (tail || "").replace(/[^a-zA-Z0-9_-]/g, "") || `media_${Math.random().toString(36).slice(2)}`
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
  const maxRunMs = 50_000
  try {
    step = "parse_request"
    const {
      organization_id,
      gmb_location_id,
      download = false,
      max_download_per_location = 3,
      download_limits = null,
    } = await req.json()
    if (!organization_id) {
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

    step = "fetch_locations"
    let locQuery = supabaseAdminClient
      .from("gmb_locations")
      .select("id, location_id, location_name, organization_id, gmb_account_id, gmb_account:gmb_accounts(id, account_id, access_token, refresh_token, token_expires_at, is_active)")
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
    let totalDownloaded = 0

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

        let pageToken: string | null = null
        let page = 0
        let perLocUpserted = 0
        let perLocDownloaded = 0
        const perLocDownloadedByCategory: Record<string, number> = {
          logo: 0,
          cover: 0,
          profile: 0,
          additional: 0,
        }
        const defaultCategoryLimits: Record<string, number> = {
          logo: 1,
          cover: 1,
          profile: 1,
          additional: 1,
        }
        const categoryLimits: Record<string, number> = {
          ...defaultCategoryLimits,
          ...(typeof download_limits === "object" && download_limits ? download_limits : {}),
        }
        const perLocErrors: string[] = []

        // Collect representative urls for convenience fields
        let logoUrl: string | null = null
        let coverUrl: string | null = null
        const photosForField: any[] = []
        const videosForField: any[] = []

        for (;;) {
          if (Date.now() - startedAt > maxRunMs) break
          step = "list_media"
          const url = new URL(`https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/media`)
          url.searchParams.set("pageSize", "250")
          if (pageToken) url.searchParams.set("pageToken", pageToken)

          const resp = await fetchWithTimeout(url.toString(), {
            headers: { Authorization: `Bearer ${token}` },
          }, 15_000)
          const bodyText = await resp.text()
          if (!resp.ok) throw new Error(`${resp.status} ${resp.statusText}: ${bodyText}`)

          const json = bodyText ? JSON.parse(bodyText) : {}
          const mediaItems = Array.isArray(json.mediaItems) ? json.mediaItems : Array.isArray(json.media) ? json.media : []

          for (const m of mediaItems) {
            const googleName = m?.name || null
            const googleUrl = m?.googleUrl || m?.mediaUrl || null
            const sourceUrl = m?.sourceUrl || null
            const mediaFormat = m?.mediaFormat || "PHOTO"
            const category = m?.locationAssociation?.category || null

            let storedUrl: string | null = null
            let storedPath: string | null = null

            if (download && mediaFormat === "PHOTO" && googleUrl) {
              // Download only a few per location to control costs/time.
              // Prefer LOGO/COVER/PROFILE categories, then fall back to first photos.
              const preferred = ["LOGO", "COVER", "PROFILE"]
              const normalizedCategory = String(category || "ADDITIONAL").toLowerCase()
              const categoryKey = ["logo", "cover", "profile"].includes(normalizedCategory)
                ? normalizedCategory
                : "additional"
              const categoryLimit = Number(categoryLimits[categoryKey] ?? defaultCategoryLimits[categoryKey] ?? 0)
              const shouldDownload =
                perLocDownloaded < Number(max_download_per_location) &&
                perLocDownloadedByCategory[categoryKey] < categoryLimit &&
                (
                  preferred.includes(String(category || "").toUpperCase()) ||
                  (perLocDownloaded < 1 && !logoUrl && !coverUrl)
                )

              if (shouldDownload) {
                try {
                  step = "download_media"
                  const mediaId = safeMediaId(m)
                  storedPath = `${organization_id}/${loc.id}/${String(category || "PHOTO").toLowerCase()}/${mediaId}.jpg`
                  let imgResp = await fetchWithTimeout(String(googleUrl), {}, 15_000)
                  if (!imgResp.ok) {
                    // Some URLs may require auth; retry with Bearer token.
                    imgResp = await fetchWithTimeout(
                      String(googleUrl),
                      { headers: { Authorization: `Bearer ${token}` } },
                      15_000
                    )
                  }
                  if (imgResp.ok) {
                    const contentType = imgResp.headers.get("content-type") || "image/jpeg"
                    const buf = await imgResp.arrayBuffer()
                    const { error: upErr } = await supabaseAdminClient
                      .storage
                      .from("gmb_media")
                      .upload(storedPath, new Blob([buf], { type: contentType }), {
                        contentType,
                        upsert: false,
                      })
                    if (!upErr) {
                      storedUrl = publicObjectUrl(supabaseUrl, "gmb_media", storedPath)
                  perLocDownloaded++
                  perLocDownloadedByCategory[categoryKey]++
                  totalDownloaded++
                    }
                  }
                } catch {
                  // ignore download errors
                }
              }
            }

            const finalUrl = storedUrl || sourceUrl || googleUrl
            if (mediaFormat === "PHOTO") {
              if (!logoUrl && String(category || "").toUpperCase() === "LOGO" && finalUrl) logoUrl = finalUrl
              if (!coverUrl && String(category || "").toUpperCase() === "COVER" && finalUrl) coverUrl = finalUrl
              if (photosForField.length < 20 && finalUrl) photosForField.push({ category, url: finalUrl })
            } else if (mediaFormat === "VIDEO") {
              if (videosForField.length < 10 && googleUrl) videosForField.push({ category, url: googleUrl })
            }

            // Upsert asset row (requires unique index)
            step = "upsert_media_asset"
            const payload: any = {
              organization_id,
              gmb_location_id: loc.id,
              google_media_name: googleName,
              media_format: mediaFormat,
              category,
              source_url: storedUrl || sourceUrl || null,
              google_url: googleUrl,
              width: m?.dimensions?.widthPx ?? null,
              height: m?.dimensions?.heightPx ?? null,
              metadata: { ...m, storage_path: storedPath },
            }

            const { error: insErr } = await supabaseAdminClient
              .from("gmb_media_assets")
              .upsert(payload, { onConflict: "organization_id,gmb_location_id,google_media_name" })

            if (insErr) {
              const msg = insErr?.message || String(insErr)
              // Capture only a small sample of errors for response/debugging
              if (perLocErrors.length < 3) perLocErrors.push(msg)

              // Common failure: ON CONFLICT doesn't match a unique constraint.
              // In that case, fall back to plain insert so at least we store something.
              if (msg.includes("no unique or exclusion constraint") || msg.includes("there is no unique")) {
                const { error: fbErr } = await supabaseAdminClient
                  .from("gmb_media_assets")
                  .insert(payload)
                if (!fbErr) {
                  perLocUpserted++
                  totalUpserted++
                } else if (perLocErrors.length < 3) {
                  perLocErrors.push(fbErr?.message || String(fbErr))
                }
              }
            } else {
              perLocUpserted++
              totalUpserted++
            }
          }

          pageToken = json?.nextPageToken ?? null
          page += 1
          if (!pageToken || page > 10) break
        }

        // Update convenience fields on location (best-effort)
        try {
          step = "update_location_media_fields"
          await supabaseAdminClient
            .from("gmb_locations")
            .update({
              logo_url: logoUrl,
              cover_photo_url: coverUrl,
              photos: photosForField.length ? photosForField : null,
              videos: videosForField.length ? videosForField : null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", loc.id)
        } catch {
          // ignore
        }

        results.push({
          gmb_location_id: loc.id,
          location_name: (loc as any).location_name,
          upserted: perLocUpserted,
          downloaded: perLocDownloaded,
          ...(perLocErrors.length ? { errors_sample: perLocErrors } : {}),
        })
      } catch (e: any) {
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
        downloaded: totalDownloaded,
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

