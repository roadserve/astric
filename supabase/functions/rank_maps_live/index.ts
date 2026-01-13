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
    const { tasks } = await req.json()
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing tasks[]", step }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    if (tasks.length > 50) {
      return new Response(
        JSON.stringify({ error: "Too many tasks (max 50)", step }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    step = "load_env"
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

    step = "call_dataforseo"
    const resp = await fetch("https://api.dataforseo.com/v3/serp/google/maps/live/advanced", {
      method: "POST",
      headers: {
        Authorization: basicAuth(login, password),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(tasks),
    })

    const text = await resp.text()
    if (!resp.ok) {
      return new Response(
        JSON.stringify({ error: "DataForSEO request failed", details: `${resp.status} ${resp.statusText}: ${text}`, step }),
        { status: resp.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    let json: any = {}
    try {
      json = text ? JSON.parse(text) : {}
    } catch {
      json = { raw: text }
    }

    return new Response(JSON.stringify({ success: true, provider: "dataforseo", response: json }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: "Internal server error", details: err?.message || String(err), step }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})

