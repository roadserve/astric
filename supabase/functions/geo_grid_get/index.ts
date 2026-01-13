import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  let step = "init"
  try {
    step = "parse_request"
    const { organization_id, run_id, mode } = await req.json()
    if (!organization_id) {
      return new Response(JSON.stringify({ error: "Missing organization_id", step }), {
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

    // mode:
    // - "runs" (default): latest geo_grid_runs
    // - "points": geo_grid_points for run_id
    const requestedMode = (mode || (run_id ? "points" : "runs")) as string

    if (requestedMode === "points") {
      if (!run_id) {
        return new Response(JSON.stringify({ error: "Missing run_id", step }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
      }

      step = "fetch_points"
      const { data: points, error } = await supabaseAdminClient
        .from("geo_grid_points")
        .select("*")
        .eq("organization_id", organization_id)
        .eq("geo_grid_run_id", run_id)
        .order("grid_y", { ascending: true })
        .order("grid_x", { ascending: true })
        .limit(400)
      if (error) throw error

      return new Response(JSON.stringify({ success: true, points: points ?? [] }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    step = "fetch_runs"
    const { data: runs, error } = await supabaseAdminClient
      .from("geo_grid_runs")
      .select("*")
      .eq("organization_id", organization_id)
      .order("created_at", { ascending: false })
      .limit(50)
    if (error) throw error

    return new Response(JSON.stringify({ success: true, runs: runs ?? [] }), {
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

