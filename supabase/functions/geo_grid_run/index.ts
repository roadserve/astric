import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

function basicAuth(login: string, password: string) {
  return "Basic " + btoa(`${login}:${password}`)
}

function pickItems(df: any): any[] {
  const tasks = df?.tasks
  if (!Array.isArray(tasks) || tasks.length === 0) return []
  const r0 = tasks[0]?.result
  const res0 = Array.isArray(r0) && r0.length ? r0[0] : null
  const items = res0?.items
  return Array.isArray(items) ? items : []
}

function kmToLatDegrees(km: number) {
  return km / 111.0
}

function kmToLngDegrees(km: number, lat: number) {
  const denom = 111.0 * Math.cos((lat * Math.PI) / 180)
  return denom ? km / denom : km / 111.0
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  let step = "init"
  try {
    step = "parse_request"
    const { organization_id, gmb_location_id, keyword, grid_size, step_km, center_lat, center_lng } = await req.json()
    if (!organization_id || !keyword) {
      return new Response(JSON.stringify({ error: "Missing required parameters", step }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    step = "check_auth_header"
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized", step }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
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
    const { data: member } = await supabaseAdminClient
      .from("organization_members")
      .select("id")
      .eq("organization_id", organization_id)
      .eq("user_id", userData.user.id)
      .eq("is_active", true)
      .maybeSingle()
    if (!member) {
      return new Response(JSON.stringify({ error: "Forbidden", step }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    step = "load_env"
    const login = (Deno.env.get("DATAFORSEO_LOGIN") ?? "").trim()
    const password = (Deno.env.get("DATAFORSEO_PASSWORD") ?? "").trim()
    if (!login || !password) {
      return new Response(JSON.stringify({ error: "Missing DataForSEO credentials", step }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    step = "load_center"
    let centerLat = Number(center_lat)
    let centerLng = Number(center_lng)
    let targetTitle = ""

    if (gmb_location_id) {
      const { data: loc } = await supabaseAdminClient
        .from("gmb_locations")
        .select("id, location_name, lat, lng")
        .eq("organization_id", organization_id)
        .eq("id", gmb_location_id)
        .maybeSingle()
      if (loc) {
        targetTitle = String(loc.location_name || "").trim().toLowerCase()
        if (!Number.isFinite(centerLat)) centerLat = Number(loc.lat)
        if (!Number.isFinite(centerLng)) centerLng = Number(loc.lng)
      }
    }

    if (!Number.isFinite(centerLat) || !Number.isFinite(centerLng)) {
      return new Response(JSON.stringify({ error: "Missing center coordinates (lat/lng). Sync locations or pass center_lat/center_lng.", step }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const gs = Math.max(3, Math.min(15, Number(grid_size) || 7))
    const stepKm = Math.max(0.25, Math.min(10, Number(step_km) || 1.0))
    const half = Math.floor(gs / 2)

    step = "create_run"
    const { data: runRow, error: runErr } = await supabaseAdminClient
      .from("geo_grid_runs")
      .insert({
        organization_id,
        gmb_location_id: gmb_location_id || null,
        keyword,
        grid_size: gs,
        step_km: stepKm,
        center_lat: centerLat,
        center_lng: centerLng,
        status: "processing",
        total_points: gs * gs,
      })
      .select("*")
      .single()
    if (runErr) throw runErr

    let ok = 0
    let failed = 0
    const errors: any[] = []

    let gridY = 0
    for (let y = -half; y <= half; y++) {
      let gridX = 0
      for (let x = -half; x <= half; x++) {
        const lat = centerLat + kmToLatDegrees(y * stepKm)
        const lng = centerLng + kmToLngDegrees(x * stepKm, centerLat)
        try {
          step = "call_dataforseo"
          const task: any = {
            keyword,
            language_code: "en",
            zoom: "15z",
            search_this_area: true,
            search_places: true,
            location_coordinate: `${lat},${lng},200`,
          }

          const resp = await fetch("https://api.dataforseo.com/v3/serp/google/maps/live/advanced", {
            method: "POST",
            headers: { Authorization: basicAuth(login, password), "Content-Type": "application/json" },
            body: JSON.stringify([task]),
          })
          const txt = await resp.text()
          if (!resp.ok) throw new Error(`${resp.status} ${resp.statusText}: ${txt}`)
          const df = txt ? JSON.parse(txt) : {}
          const items = pickItems(df)

          let rankPos: number | null = null
          let foundTitle: string | null = null
          let foundPlaceId: string | null = null
          if (targetTitle) {
            for (const it of items) {
              const title = String(it?.title || it?.name || "").trim()
              if (title && title.toLowerCase() === targetTitle) {
                rankPos = Number(it?.rank_group || it?.rank_absolute || it?.rank || null) || null
                foundTitle = title
                foundPlaceId = it?.place_id || it?.placeId || null
                break
              }
            }
          }

          await supabaseAdminClient.from("geo_grid_points").insert({
            organization_id,
            geo_grid_run_id: runRow.id,
            gmb_location_id: gmb_location_id || null,
            grid_x: gridX,
            grid_y: gridY,
            lat,
            lng,
            rank_position: rankPos,
            found_title: foundTitle,
            found_place_id: foundPlaceId,
            provider: "dataforseo",
            raw: df,
          })
          ok++
        } catch (e: any) {
          failed++
          errors.push({ lat, lng, error: e?.message || String(e) })
        }
        gridX++
      }
      gridY++
    }

    step = "finalize_run"
    const status = ok > 0 ? (failed > 0 ? "partial" : "completed") : failed > 0 ? "failed" : "completed"
    await supabaseAdminClient
      .from("geo_grid_runs")
      .update({
        status,
        successful_points: ok,
        failed_points: failed,
        error_details: errors.length ? errors.slice(0, 50) : null,
        completed_at: new Date().toISOString(),
      })
      .eq("id", runRow.id)

    return new Response(JSON.stringify({ success: true, run_id: runRow.id, ok, failed, status, errors_sample: errors.slice(0, 3) }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: "Internal server error", details: err?.message || String(err), step }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})

