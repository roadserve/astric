import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  let step = "init"
  try {
    step = "parse_request"
    const { organization_id } = await req.json()
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
    const { data: accounts, error: accountsErr } = await supabaseAdminClient
      .from("gmb_accounts")
      .select("id, organization_id, account_name, account_id, is_active, last_synced_at, created_at")
      .eq("organization_id", organization_id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (accountsErr) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch accounts", details: accountsErr.message, step }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    step = "fetch_locations"
    const { data: locations, error: locErr } = await supabaseAdminClient
      .from("gmb_locations")
      .select("*, gmb_account:gmb_accounts(id, account_name, account_id)")
      .eq("organization_id", organization_id)
      .order("created_at", { ascending: false })

    if (locErr) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch locations", details: locErr.message, step }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    step = "fetch_posts"
    const { data: posts, error: postsErr } = await supabaseAdminClient
      .from("gmb_posts")
      .select("id, organization_id, title, content, call_to_action, action_url, media_urls, post_type, target_locations, status, scheduled_at, published_at, created_at, updated_at")
      .eq("organization_id", organization_id)
      .order("created_at", { ascending: false })
      .limit(50)

    if (postsErr) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch posts", details: postsErr.message, step }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    step = "fetch_reviews"
    const { data: reviews, error: reviewsErr } = await supabaseAdminClient
      .from("gmb_reviews")
      .select("id, gmb_location_id, organization_id, review_id, reviewer_name, reviewer_photo_url, rating, comment, review_reply, review_date, reply_date, is_replied, created_at, updated_at, location:gmb_locations(id, location_name, location_id)")
      .eq("organization_id", organization_id)
      .order("review_date", { ascending: false })
      .limit(200)

    if (reviewsErr) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch reviews", details: reviewsErr.message, step }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    step = "fetch_insights"
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const sinceIso = since.toISOString().slice(0, 10) // YYYY-MM-DD
    const { data: insights, error: insightsErr } = await supabaseAdminClient
      .from("gmb_insights")
      .select("gmb_location_id, organization_id, metric_type, metric_value, date, location:gmb_locations(id, location_name)")
      .eq("organization_id", organization_id)
      .gte("date", sinceIso)
      .order("date", { ascending: true })

    if (insightsErr) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch insights", details: insightsErr.message, step }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    step = "fetch_search_keywords_monthly"
    const { data: searchKeywords, error: kwErr } = await supabaseAdminClient
      .from("gmb_search_keywords_monthly")
      .select("gmb_location_id, organization_id, month, keyword, impressions")
      .eq("organization_id", organization_id)
      .order("month", { ascending: false })
      .limit(500)

    if (kwErr) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch search keywords", details: kwErr.message, step }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    step = "fetch_bulk_updates"
    const { data: bulkUpdates, error: bulkErr } = await supabaseAdminClient
      .from("gmb_bulk_updates")
      .select("id, update_type, status, total_locations, successful_updates, failed_updates, created_at, completed_at")
      .eq("organization_id", organization_id)
      .order("created_at", { ascending: false })
      .limit(50)

    if (bulkErr) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch bulk updates", details: bulkErr.message, step }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        accounts: accounts ?? [],
        locations: locations ?? [],
        posts: posts ?? [],
        reviews: reviews ?? [],
        insights: insights ?? [],
        search_keywords_monthly: searchKeywords ?? [],
        bulk_updates: bulkUpdates ?? [],
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

