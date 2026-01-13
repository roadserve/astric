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
  const tasks = df?.tasks || df?.response?.tasks
  if (!Array.isArray(tasks) || tasks.length === 0) return []
  // common: tasks[0].result[0].items
  const r0 = tasks[0]?.result
  const res0 = Array.isArray(r0) && r0.length ? r0[0] : null
  const items = res0?.items
  if (Array.isArray(items)) return items
  // fallback: look for any array called items
  for (const t of tasks) {
    const r = Array.isArray(t?.result) && t.result.length ? t.result[0] : null
    if (Array.isArray(r?.items)) return r.items
  }
  return []
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  let step = "init"
  try {
    step = "parse_request"
    const { organization_id, keyword_ids } = await req.json()
    if (!organization_id) {
      return new Response(JSON.stringify({ error: "Missing organization_id", step }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    step = "check_auth_header"
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized", details: "Missing Authorization header", step }), {
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
    const { data: member, error: memberErr } = await supabaseAdminClient
      .from("organization_members")
      .select("id")
      .eq("organization_id", organization_id)
      .eq("user_id", userData.user.id)
      .eq("is_active", true)
      .maybeSingle()

    if (memberErr) {
      return new Response(JSON.stringify({ error: "Failed to verify membership", details: memberErr.message, step }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }
    if (!member) {
      return new Response(JSON.stringify({ error: "Forbidden", details: "Not a member of this org", step }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    step = "load_provider_env"
    const login = (Deno.env.get("DATAFORSEO_LOGIN") ?? "").trim()
    const password = (Deno.env.get("DATAFORSEO_PASSWORD") ?? "").trim()
    if (!login || !password) {
      return new Response(
        JSON.stringify({
          error: "Missing DataForSEO credentials",
          details: "Set DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD in Supabase Edge Function secrets.",
          step,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    step = "fetch_keywords"
    let query = supabaseAdminClient
      .from("rank_keywords")
      .select("id, keyword, location_name, language_code, gmb_location_id, location:gmb_locations(id, location_name, lat, lng)")
      .eq("organization_id", organization_id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(50)

    if (Array.isArray(keyword_ids) && keyword_ids.length) {
      query = query.in("id", keyword_ids.slice(0, 50))
    }

    const { data: keywords, error: kwErr } = await query
    if (kwErr) throw kwErr

    if (!keywords || keywords.length === 0) {
      return new Response(JSON.stringify({ success: true, message: "No active keywords to run" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    step = "create_run"
    const { data: runRow, error: runErr } = await supabaseAdminClient
      .from("rank_runs")
      .insert({
        organization_id,
        run_type: "keyword",
        status: "processing",
        total_tasks: keywords.length,
      })
      .select("*")
      .single()
    if (runErr) throw runErr

    let ok = 0
    let failed = 0
    const errors: any[] = []

    for (const kw of keywords) {
      try {
        step = "call_dataforseo"
        const locationName = kw.location_name || ""
        const loc = kw.location
        const hasGps = loc?.lat != null && loc?.lng != null
        const task: any = {
          keyword: kw.keyword,
          language_code: kw.language_code || "en",
          zoom: "15z",
          search_this_area: true,
          search_places: true,
        }
        if (hasGps) {
          // radius in millimeters; 200mm is DataForSEO minimum range sample usage.
          task.location_coordinate = `${loc.lat},${loc.lng},200`
        } else if (locationName) {
          task.location_name = locationName
        } else {
          // fallback to a generic default to avoid hard failure
          task.location_name = "Mumbai,Maharashtra,India"
        }

        const resp = await fetch("https://api.dataforseo.com/v3/serp/google/maps/live/advanced", {
          method: "POST",
          headers: {
            Authorization: basicAuth(login, password),
            "Content-Type": "application/json",
          },
          body: JSON.stringify([task]),
        })
        const txt = await resp.text()
        if (!resp.ok) throw new Error(`${resp.status} ${resp.statusText}: ${txt}`)
        const df = txt ? JSON.parse(txt) : {}
        const items = pickItems(df)

        // attempt to find our location in the results
        const targetTitle = String(loc?.location_name || "").trim().toLowerCase()
        let rankPos: number | null = null
        let foundTitle: string | null = null
        let foundPlaceId: string | null = null
        for (const it of items) {
          const title = String(it?.title || it?.name || "").trim()
          const titleLc = title.toLowerCase()
          if (targetTitle && titleLc === targetTitle) {
            rankPos = Number(it?.rank_group || it?.rank_absolute || it?.rank || null) || null
            foundTitle = title
            foundPlaceId = it?.place_id || it?.placeId || null
            break
          }
        }

        await supabaseAdminClient.from("rank_points").insert({
          organization_id,
          rank_run_id: runRow.id,
          rank_keyword_id: kw.id,
          gmb_location_id: kw.gmb_location_id || null,
          rank_position: rankPos,
          found_title: foundTitle,
          found_place_id: foundPlaceId,
          provider: "dataforseo",
          raw: df,
        })

        ok++
      } catch (e: any) {
        failed++
        errors.push({ rank_keyword_id: kw.id, error: e?.message || String(e) })
      }
    }

    step = "finalize_run"
    await supabaseAdminClient
      .from("rank_runs")
      .update({
        status: failed ? "failed" : "completed",
        successful_tasks: ok,
        failed_tasks: failed,
        error_details: errors.length ? errors : null,
        completed_at: new Date().toISOString(),
      })
      .eq("id", runRow.id)

    return new Response(
      JSON.stringify({ success: true, run_id: runRow.id, ok, failed, errors: errors.slice(0, 10) }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: "Internal server error", details: err?.message || String(err), step }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})

