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
    const { organization_id, location_ids, update_fields } = await req.json()
    if (!organization_id || !Array.isArray(location_ids) || location_ids.length === 0 || !update_fields) {
      return new Response(JSON.stringify({ error: "Missing required parameters", step }), {
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
    if (memberErr) throw memberErr
    if (!member) {
      return new Response(JSON.stringify({ error: "Forbidden", step }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // only allow whitelisted local fields
    const allowed = [
      "appointment_link",
      "menu_link",
      "chat_link",
      "social_links",
      "opening_date",
      "additional_categories",
    ]

    const payload: Record<string, unknown> = {}
    for (const k of allowed) {
      if (Object.prototype.hasOwnProperty.call(update_fields, k)) {
        payload[k] = update_fields[k]
      }
    }
    if (Object.keys(payload).length === 0) {
      return new Response(JSON.stringify({ error: "No supported fields in update_fields", step }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }
    payload["last_synced_at"] = new Date().toISOString()

    step = "create_bulk_update_record"
    const { data: bulkUpdate, error: bulkErr } = await supabaseAdminClient
      .from("gmb_bulk_updates")
      .insert({
        organization_id,
        update_type: "local_fields",
        update_data: payload,
        target_locations: location_ids,
        total_locations: location_ids.length,
        status: "processing",
        created_by: userData.user.id,
      })
      .select("*")
      .single()
    if (bulkErr) throw bulkErr

    step = "update_locations"
    const { error: updErr } = await supabaseAdminClient
      .from("gmb_locations")
      .update(payload)
      .eq("organization_id", organization_id)
      .in("id", location_ids)
    if (updErr) throw updErr

    step = "finalize_bulk_update"
    await supabaseAdminClient
      .from("gmb_bulk_updates")
      .update({
        status: "completed",
        successful_updates: location_ids.length,
        failed_updates: 0,
        completed_at: new Date().toISOString(),
      })
      .eq("id", bulkUpdate.id)

    return new Response(JSON.stringify({ success: true, bulk_update_id: bulkUpdate.id }), {
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

