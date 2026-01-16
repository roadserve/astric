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

async function runOrg(supabase: any, orgId: string, login: string, password: string) {
  const BATCH_SIZE = 50

  const { data: keywordsAll, error: kwErr } = await supabase
    .from("rank_keywords")
    .select("id, keyword, location_name, language_code, gmb_location_id, created_at, location:gmb_locations(id, location_name, lat, lng)")
    .eq("organization_id", orgId)
    .eq("is_active", true)
    .eq("is_scheduled", true)
    .order("created_at", { ascending: false })
    .limit(1000)

  if (kwErr) throw kwErr
  if (!keywordsAll || keywordsAll.length === 0) return { orgId, skipped: true, reason: "no_keywords" }

  // Pick keywords with oldest (or missing) last fetched_at to avoid re-running the same newest rows forever.
  const { data: pts, error: ptErr } = await supabase
    .from("rank_points")
    .select("rank_keyword_id, fetched_at")
    .eq("organization_id", orgId)
    .order("fetched_at", { ascending: false })
    .limit(20000)
  if (ptErr) throw ptErr

  const latestFetched: Record<string, number> = {}
  for (const p of pts || []) {
    const kid = String(p?.rank_keyword_id || "")
    if (!kid) continue
    if (latestFetched[kid]) continue
    const ts = p?.fetched_at ? new Date(p.fetched_at).getTime() : 0
    latestFetched[kid] = ts || 0
  }

  const keywords = (keywordsAll as any[])
    .slice()
    .sort((a: any, b: any) => {
      const aTs = latestFetched[String(a.id)] || 0
      const bTs = latestFetched[String(b.id)] || 0
      if (aTs !== bTs) return aTs - bTs
      const ac = a?.created_at ? new Date(a.created_at).getTime() : 0
      const bc = b?.created_at ? new Date(b.created_at).getTime() : 0
      return ac - bc
    })
    .slice(0, BATCH_SIZE)

  const { data: runRow, error: runErr } = await supabase
    .from("rank_runs")
    .insert({ organization_id: orgId, run_type: "keyword", status: "processing", total_tasks: keywords.length })
    .select("*")
    .single()
  if (runErr) throw runErr

  let ok = 0
  let failed = 0
  const errors: any[] = []

  for (const kw of keywords) {
    try {
      const loc = kw.location
      const hasGps = loc?.lat != null && loc?.lng != null
      const task: any = {
        keyword: kw.keyword,
        language_code: kw.language_code || "en",
        zoom: "15z",
        search_this_area: true,
        search_places: true,
      }
      if (hasGps) task.location_coordinate = `${loc.lat},${loc.lng},200`
      else if (kw.location_name) task.location_name = kw.location_name
      else task.location_name = "Mumbai,Maharashtra,India"

      const resp = await fetch("https://api.dataforseo.com/v3/serp/google/maps/live/advanced", {
        method: "POST",
        headers: { Authorization: basicAuth(login, password), "Content-Type": "application/json" },
        body: JSON.stringify([task]),
      })
      const txt = await resp.text()
      if (!resp.ok) throw new Error(`${resp.status} ${resp.statusText}: ${txt}`)
      const df = txt ? JSON.parse(txt) : {}
      const items = pickItems(df)

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

      await supabase.from("rank_points").insert({
        organization_id: orgId,
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

  await supabase
    .from("rank_runs")
    .update({
      status: failed ? "failed" : "completed",
      successful_tasks: ok,
      failed_tasks: failed,
      error_details: errors.length ? errors : null,
      completed_at: new Date().toISOString(),
    })
    .eq("id", runRow.id)

  return { orgId, run_id: runRow.id, ok, failed }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  let step = "init"
  try {
    step = "auth_service_role"
    const authHeader = req.headers.get("Authorization") || ""
    const serviceRoleKey = (Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "").trim()
    if (!serviceRoleKey || !authHeader.includes(serviceRoleKey)) {
      // This job is intended to be called by cron with service role.
      return new Response(JSON.stringify({ error: "Forbidden", step }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    step = "load_env"
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
    const login = (Deno.env.get("DATAFORSEO_LOGIN") ?? "").trim()
    const password = (Deno.env.get("DATAFORSEO_PASSWORD") ?? "").trim()
    if (!login || !password) {
      return new Response(JSON.stringify({ error: "Missing DataForSEO credentials", step }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    step = "list_orgs"
    const { data: orgRows, error: orgErr } = await supabase
      .from("rank_keywords")
      .select("organization_id")
      .eq("is_active", true)
      .eq("is_scheduled", true)
      .limit(500)
    if (orgErr) throw orgErr
    const orgIds = Array.from(new Set((orgRows || []).map((r: any) => r.organization_id))).slice(0, 50)

    const results: any[] = []
    for (const orgId of orgIds) {
      results.push(await runOrg(supabase, orgId, login, password))
    }

    return new Response(JSON.stringify({ success: true, orgs: orgIds.length, results }), {
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

