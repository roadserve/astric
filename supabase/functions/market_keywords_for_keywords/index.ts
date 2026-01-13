import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

function basicAuth(login: string, password: string) {
  return "Basic " + btoa(`${login}:${password}`)
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  let step = "init"
  try {
    step = "parse_request"
    const { location_code, keywords } = await req.json()
    if (!location_code || !Array.isArray(keywords) || keywords.length === 0) {
      return new Response(JSON.stringify({ error: "Missing location_code or keywords[]", step }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const login = (Deno.env.get("DATAFORSEO_LOGIN") ?? "").trim()
    const password = (Deno.env.get("DATAFORSEO_PASSWORD") ?? "").trim()
    if (!login || !password) {
      return new Response(JSON.stringify({ error: "Missing DataForSEO credentials", step }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    step = "call_dataforseo"
    const task = [{ location_code: Number(location_code), keywords: keywords.slice(0, 50) }]
    const resp = await fetch("https://api.dataforseo.com/v3/keywords_data/google_ads/keywords_for_keywords/live", {
      method: "POST",
      headers: { Authorization: basicAuth(login, password), "Content-Type": "application/json" },
      body: JSON.stringify(task),
    })

    const text = await resp.text()
    if (!resp.ok) {
      return new Response(JSON.stringify({ error: "DataForSEO request failed", details: `${resp.status} ${resp.statusText}: ${text}`, step }), {
        status: resp.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const json = text ? JSON.parse(text) : {}
    return new Response(JSON.stringify({ success: true, provider: "dataforseo", response: json }), {
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

