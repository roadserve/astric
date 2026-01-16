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
    const {
      organization_id,
      only,
      post_id,
      posts_limit,
      posts_before,
    } = await req.json()
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
      .select("id, role")
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

    const isOrgAdmin = member?.role === "owner" || member?.role === "manager"

    step = "fetch_accounts"
    let allowedAccountIds: string[] | null = null
    if (!isOrgAdmin) {
      step = "fetch_user_account_connections"
      const { data: connections, error: connErr } = await supabaseAdminClient
        .from("gmb_account_connections")
        .select("gmb_account_id")
        .eq("organization_id", organization_id)
        .eq("user_id", userData.user.id)

      if (connErr) {
        return new Response(
          JSON.stringify({ error: "Failed to fetch account connections", details: connErr.message, step }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
      }

      allowedAccountIds = (connections ?? []).map((c: any) => c.gmb_account_id).filter(Boolean)
    }

    let accountsQuery = supabaseAdminClient
      .from("gmb_accounts")
      .select("id, organization_id, connected_by, account_name, account_id, is_active, last_synced_at, created_at")
      .eq("organization_id", organization_id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (!isOrgAdmin) {
      if (!allowedAccountIds || allowedAccountIds.length === 0) {
        // no connected accounts for this user
        accountsQuery = accountsQuery.in("id", ["00000000-0000-0000-0000-000000000000"])
      } else {
        accountsQuery = accountsQuery.in("id", allowedAccountIds)
      }
    }

    const { data: accounts, error: accountsErr } = await accountsQuery

    if (accountsErr) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch accounts", details: accountsErr.message, step }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const accountIds = (accounts ?? []).map((a: any) => a.id).filter(Boolean)

    step = "fetch_locations"
    let locationsQuery = supabaseAdminClient
      .from("gmb_locations")
      .select("*, gmb_account:gmb_accounts(id, account_name, account_id)")
      .eq("organization_id", organization_id)
      .order("created_at", { ascending: false })

    if (!isOrgAdmin) {
      if (accountIds.length === 0) {
        // No accounts connected by this user => no locations.
        locationsQuery = locationsQuery.in("gmb_account_id", ["00000000-0000-0000-0000-000000000000"])
      } else {
        locationsQuery = locationsQuery.in("gmb_account_id", accountIds)
      }
    }

    const { data: locations, error: locErr } = await locationsQuery

    if (locErr) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch locations", details: locErr.message, step }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const locationIds = (locations ?? []).map((l: any) => l.id).filter(Boolean)
    const locationIdSet = new Set(locationIds)

    const onlyMode = typeof only === "string" ? only : null
    const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n))
    const rawPostsLimit = Number(posts_limit || 0)
    const postsLimit = clamp(rawPostsLimit || (onlyMode === "posts" ? 200 : 200), 1, 500)

    step = "fetch_posts"
    let postsQuery = supabaseAdminClient
      .from("gmb_posts")
      .select("id, organization_id, title, content, call_to_action, action_url, media_urls, post_type, target_locations, status, scheduled_at, published_at, created_at, updated_at, google_post_name")
      .eq("organization_id", organization_id)
      .order("created_at", { ascending: false })
      .limit(postsLimit)

    if (posts_before) {
      // Keyset pagination for "Load more" in UI.
      postsQuery = postsQuery.lt("created_at", posts_before)
    }

    const { data: posts, error: postsErr } = await postsQuery

    if (postsErr) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch posts", details: postsErr.message, step }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const filteredPosts = !isOrgAdmin
      ? (posts ?? []).filter((p: any) => {
        const targets: string[] = Array.isArray(p?.target_locations) ? p.target_locations : []
        return targets.some((id) => locationIdSet.has(id))
      })
      : (posts ?? [])

    if (onlyMode === "post_details") {
      if (!post_id) {
        return new Response(
          JSON.stringify({ error: "Missing post_id", step }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
      }

      step = "fetch_post_details"
      const { data: post, error: postErr } = await supabaseAdminClient
        .from("gmb_posts")
        .select("id, organization_id, title, content, call_to_action, action_url, media_urls, post_type, target_locations, status, scheduled_at, published_at, created_at, updated_at, google_post_name")
        .eq("organization_id", organization_id)
        .eq("id", post_id)
        .maybeSingle()

      if (postErr) {
        return new Response(
          JSON.stringify({ error: "Failed to fetch post", details: postErr.message, step }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
      }

      if (!post) {
        return new Response(
          JSON.stringify({ post: null, post_publications: [], location_name_by_id: {} }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
      }

      // If not admin, ensure this user is allowed to see this post (must target at least one allowed location).
      if (!isOrgAdmin) {
        const targets: string[] = Array.isArray((post as any)?.target_locations) ? (post as any).target_locations : []
        const allowed = targets.some((id) => locationIdSet.has(id))
        if (!allowed) {
          return new Response(
            JSON.stringify({ error: "Forbidden", details: "Not allowed to access this post", step }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          )
        }
      }

      step = "fetch_post_publications_for_post"
      const { data: pubs, error: pubErr } = await supabaseAdminClient
        .from("gmb_post_publications")
        .select("id, post_id, gmb_location_id, google_post_name, status, error_text, created_at")
        .eq("organization_id", organization_id)
        .eq("post_id", post_id)
        .order("created_at", { ascending: false })
        .limit(5000)

      if (pubErr) {
        return new Response(
          JSON.stringify({ error: "Failed to fetch post publications", details: pubErr.message, step }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
      }

      const locMap: Record<string, string> = {}
      for (const l of locations ?? []) {
        if (l?.id && l?.location_name) locMap[String(l.id)] = String(l.location_name)
      }

      return new Response(
        JSON.stringify({
          post,
          post_publications: pubs ?? [],
          location_name_by_id: locMap,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    if (onlyMode === "posts") {
      step = "fetch_post_publications_for_posts"
      const postIds = (filteredPosts ?? []).map((p: any) => p?.id).filter(Boolean)

      let postPublications: any[] = []
      if (postIds.length) {
        const { data: pubs, error: pubErr } = await supabaseAdminClient
          .from("gmb_post_publications")
          .select("id, post_id, gmb_location_id, google_post_name, status, error_text, created_at")
          .eq("organization_id", organization_id)
          .in("post_id", postIds)
          .order("created_at", { ascending: false })
          .limit(2000)

        if (pubErr) {
          return new Response(
            JSON.stringify({ error: "Failed to fetch post publications", details: pubErr.message, step }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          )
        }

        postPublications = pubs ?? []
      }

      const nextPostsBefore =
        filteredPosts && filteredPosts.length
          ? (filteredPosts[filteredPosts.length - 1] as any)?.created_at ?? null
          : null

      return new Response(
        JSON.stringify({
          posts: filteredPosts,
          post_publications: postPublications,
          next_posts_before: nextPostsBefore,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    step = "fetch_post_templates"
    const { data: postTemplates, error: tplErr } = await supabaseAdminClient
      .from("gmb_post_templates")
      .select("id, name, content, title, call_to_action, action_url, media_urls, post_type, event_details, offer_details, is_active, created_at, updated_at")
      .eq("organization_id", organization_id)
      .order("created_at", { ascending: false })
      .limit(200)

    if (tplErr) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch post templates", details: tplErr.message, step }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    step = "fetch_post_publications"
    const { data: postPublications, error: pubErr } = await supabaseAdminClient
      .from("gmb_post_publications")
      .select("id, post_id, gmb_location_id, google_post_name, status, error_text, created_at")
      .eq("organization_id", organization_id)
      .order("created_at", { ascending: false })
      .limit(2000)

    if (pubErr) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch post publications", details: pubErr.message, step }),
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

    const filteredReviews = !isOrgAdmin
      ? (reviews ?? []).filter((r: any) => locationIdSet.has(r?.gmb_location_id))
      : (reviews ?? [])

    step = "fetch_insights"
    const since = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
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

    const filteredInsights = !isOrgAdmin
      ? (insights ?? []).filter((i: any) => locationIdSet.has(i?.gmb_location_id))
      : (insights ?? [])

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

    const filteredSearchKeywords = !isOrgAdmin
      ? (searchKeywords ?? []).filter((k: any) => locationIdSet.has(k?.gmb_location_id))
      : (searchKeywords ?? [])

    step = "fetch_qna_requests"
    const { data: qnaRequests, error: qnaErr } = await supabaseAdminClient
      .from("gmb_qna_requests")
      .select("id, gmb_location_id, status, created_at, answered_at")
      .eq("organization_id", organization_id)
      .order("created_at", { ascending: false })
      .limit(500)

    if (qnaErr) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch Q&A", details: qnaErr.message, step }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const filteredQna = !isOrgAdmin
      ? (qnaRequests ?? []).filter((q: any) => !q?.gmb_location_id || locationIdSet.has(q.gmb_location_id))
      : (qnaRequests ?? [])

    step = "fetch_media_assets"
    const { data: mediaAssets, error: mediaErr } = await supabaseAdminClient
      .from("gmb_media_assets")
      .select("gmb_location_id, category, created_at")
      .eq("organization_id", organization_id)
      .order("created_at", { ascending: false })
      .limit(1000)

    if (mediaErr) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch media assets", details: mediaErr.message, step }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const filteredMediaAssets = !isOrgAdmin
      ? (mediaAssets ?? []).filter((m: any) => locationIdSet.has(m?.gmb_location_id))
      : (mediaAssets ?? [])

    step = "fetch_bulk_updates"
    const { data: bulkUpdates, error: bulkErr } = await supabaseAdminClient
      .from("gmb_bulk_updates")
      .select("id, update_type, status, total_locations, successful_updates, failed_updates, created_at, completed_at, target_locations")
      .eq("organization_id", organization_id)
      .order("created_at", { ascending: false })
      .limit(50)

    if (bulkErr) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch bulk updates", details: bulkErr.message, step }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const filteredBulkUpdates = !isOrgAdmin
      ? (bulkUpdates ?? [])
        .filter((b: any) => {
          const targets: string[] = Array.isArray(b?.target_locations) ? b.target_locations : []
          return targets.length === 0 || targets.some((id) => locationIdSet.has(id))
        })
        .map((b: any) => {
          // keep response shape stable (UI doesn't need target_locations)
          const { target_locations, ...rest } = b ?? {}
          return rest
        })
      : (bulkUpdates ?? []).map((b: any) => {
        const { target_locations, ...rest } = b ?? {}
        return rest
      })

    const filteredPostPublications = !isOrgAdmin
      ? (postPublications ?? []).filter((p: any) => locationIdSet.has(p?.gmb_location_id))
      : (postPublications ?? [])

    const safeStr = (v: any) => String(v || "").trim()
    const maxDate = (rows: any[], key: string) => {
      let latest: string | null = null
      for (const r of rows || []) {
        const v = r?.[key]
        if (!v) continue
        const ts = new Date(v).toISOString()
        if (!latest || ts > latest) latest = ts
      }
      return latest
    }

    const totalLocations = (locations ?? []).length
    const locationsList = locations ?? []
    const countMissing = (fn: (l: any) => boolean) => locationsList.filter((l) => fn(l)).length
    const missingPhone = countMissing((l) => !safeStr(l?.phone))
    const missingWebsite = countMissing((l) => !safeStr(l?.website))
    const missingDescription = countMissing((l) => !safeStr(l?.description))
    const missingHours = countMissing((l) => !l?.hours || (typeof l.hours === "object" && Object.keys(l.hours || {}).length === 0))
    const missingSpecialHours = countMissing((l) => !l?.special_hours || (typeof l.special_hours === "object" && Object.keys(l.special_hours || {}).length === 0))
    const missingServiceArea = countMissing((l) => !l?.service_area || (typeof l.service_area === "object" && Object.keys(l.service_area || {}).length === 0))
    const missingOpenInfo = countMissing((l) => !l?.open_info || (typeof l.open_info === "object" && Object.keys(l.open_info || {}).length === 0))
    const missingPhotos = countMissing((l) => {
      const p = l?.photos
      if (!p) return true
      if (Array.isArray(p)) return p.length === 0
      if (typeof p === "object") return Object.keys(p).length === 0
      return true
    })
    const missingLogo = countMissing((l) => !safeStr(l?.logo_url))
    const missingCover = countMissing((l) => !safeStr(l?.cover_photo_url))
    const missingVideos = countMissing((l) => {
      const v = l?.videos
      if (!v) return true
      if (Array.isArray(v)) return v.length === 0
      return false
    })
    const unverifiedCount = countMissing((l) => !l?.is_verified)
    const unpublishedCount = countMissing((l) => !l?.is_published)
    const criticalMissingCount = countMissing((l) => !safeStr(l?.phone) || !safeStr(l?.website))

    const locationsFixNext = locationsList
      .map((l) => {
        const missing: string[] = []
        if (!safeStr(l?.phone)) missing.push("phone")
        if (!safeStr(l?.website)) missing.push("website")
        if (!safeStr(l?.description)) missing.push("description")
        if (!l?.hours || (typeof l.hours === "object" && Object.keys(l.hours || {}).length === 0)) missing.push("hours")
        if (!l?.special_hours || (typeof l.special_hours === "object" && Object.keys(l.special_hours || {}).length === 0)) missing.push("special_hours")
        if (!l?.service_area || (typeof l.service_area === "object" && Object.keys(l.service_area || {}).length === 0)) missing.push("service_area")
        if (!l?.open_info || (typeof l.open_info === "object" && Object.keys(l.open_info || {}).length === 0)) missing.push("open_info")
        if (!l?.photos || (Array.isArray(l.photos) ? l.photos.length === 0 : Object.keys(l.photos || {}).length === 0)) missing.push("photos")
        if (!safeStr(l?.logo_url)) missing.push("logo")
        if (!safeStr(l?.cover_photo_url)) missing.push("cover")
        return {
          id: l?.id,
          location_name: l?.location_name,
          missing,
          missing_count: missing.length,
        }
      })
      .sort((a, b) => b.missing_count - a.missing_count)
      .slice(0, 10)

    const insightsTotals = (rows: any[]) => {
      const totals: Record<string, number> = {}
      for (const r of rows || []) {
        const k = r?.metric_type
        const v = Number(r?.metric_value || 0)
        if (!k) continue
        totals[k] = (totals[k] || 0) + v
      }
      const impressions =
        (totals["BUSINESS_IMPRESSIONS_DESKTOP_MAPS"] || 0) +
        (totals["BUSINESS_IMPRESSIONS_MOBILE_MAPS"] || 0) +
        (totals["BUSINESS_IMPRESSIONS_DESKTOP_SEARCH"] || 0) +
        (totals["BUSINESS_IMPRESSIONS_MOBILE_SEARCH"] || 0)
      return {
        impressions,
        websiteClicks: totals["WEBSITE_CLICKS"] || 0,
        calls: totals["CALL_CLICKS"] || 0,
        directions: totals["BUSINESS_DIRECTION_REQUESTS"] || 0,
      }
    }

    const now = Date.now()
    const last30 = new Date(now - 30 * 24 * 60 * 60 * 1000)
    const prev30 = new Date(now - 60 * 24 * 60 * 60 * 1000)
    const currentInsights = filteredInsights.filter((i: any) => new Date(i.date) >= last30)
    const previousInsights = filteredInsights.filter((i: any) => new Date(i.date) < last30 && new Date(i.date) >= prev30)
    const currentTotals = insightsTotals(currentInsights)
    const previousTotals = insightsTotals(previousInsights)

    const totalReviews = filteredReviews.length
    const unreplied = filteredReviews.filter((r: any) => !r?.is_replied).length
    const ratingSum = filteredReviews.reduce((acc: number, r: any) => acc + (Number(r?.rating || 0)), 0)
    const avgRating = totalReviews ? Math.round((ratingSum / totalReviews) * 100) / 100 : 0
    const negativeReviews = filteredReviews.filter((r: any) => Number(r?.rating || 0) <= 2).length
    const responseRate = totalReviews ? Math.round((1 - unreplied / totalReviews) * 1000) / 10 : 0

    const locationsNeedingReplies = (() => {
      const map: Record<string, { id: string; location_name: string; count: number }> = {}
      for (const r of filteredReviews) {
        if (r?.is_replied) continue
        const id = r?.gmb_location_id
        if (!id) continue
        if (!map[id]) {
          map[id] = { id, location_name: r?.location?.location_name || "—", count: 0 }
        }
        map[id].count += 1
      }
      return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 10)
    })()

    const keywordMonthLatest = filteredSearchKeywords.reduce((max: string | null, r: any) => {
      const m = r?.month
      if (!m) return max
      return !max || String(m) > String(max) ? String(m) : max
    }, null)
    const keywordImpressionsMap: Record<string, number> = {}
    for (const r of filteredSearchKeywords) {
      if (keywordMonthLatest && String(r?.month) !== String(keywordMonthLatest)) continue
      const k = safeStr(r?.keyword)
      if (!k) continue
      keywordImpressionsMap[k] = (keywordImpressionsMap[k] || 0) + Number(r?.impressions || 0)
    }
    const topKeywords = Object.entries(keywordImpressionsMap)
      .map(([keyword, impressions]) => ({ keyword, impressions }))
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 10)

    const keywordLocationsSet = new Set(filteredSearchKeywords.map((r: any) => r?.gmb_location_id).filter(Boolean))
    const keywordGaps = locationsList
      .filter((l: any) => !keywordLocationsSet.has(l?.id))
      .map((l: any) => ({ id: l?.id, location_name: l?.location_name }))

    const postPubStats = (() => {
      let ok = 0
      let failed = 0
      const reasonMap: Record<string, number> = {}
      for (const p of filteredPostPublications) {
        if (p?.status === "published") ok += 1
        if (p?.status === "failed") failed += 1
        if (p?.status === "failed" && p?.error_text) {
          const key = String(p.error_text).slice(0, 120)
          reasonMap[key] = (reasonMap[key] || 0) + 1
        }
      }
      const rate = ok + failed ? Math.round((ok / (ok + failed)) * 1000) / 10 : 0
      const reasons = Object.entries(reasonMap)
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
      return { ok, failed, rate, reasons }
    })()

    const mediaCoverage = {
      logo: totalLocations - missingLogo,
      cover: totalLocations - missingCover,
      photos: totalLocations - missingPhotos,
      videos: totalLocations - missingVideos,
    }

    const insightsPayload = {
      freshness: {
        locations: maxDate(locationsList, "last_synced_at"),
        reviews: maxDate(filteredReviews, "review_date"),
        insights: maxDate(filteredInsights, "date"),
        keywords: keywordMonthLatest,
        media_assets: maxDate(filteredMediaAssets, "created_at"),
        posts: maxDate(filteredPosts, "created_at"),
        post_publications: maxDate(filteredPostPublications, "created_at"),
        qna: maxDate(filteredQna, "created_at"),
      },
      coverage: {
        total_locations: totalLocations,
        missing: {
          phone: missingPhone,
          website: missingWebsite,
          description: missingDescription,
          hours: missingHours,
          special_hours: missingSpecialHours,
          service_area: missingServiceArea,
          open_info: missingOpenInfo,
          photos: missingPhotos,
          logo: missingLogo,
          cover: missingCover,
          videos: missingVideos,
        },
      },
      quality: {
        unverified: unverifiedCount,
        unpublished: unpublishedCount,
        missing_critical: criticalMissingCount,
        fix_next: locationsFixNext,
      },
      demand: {
        latest_month: keywordMonthLatest,
        top_keywords: topKeywords,
        keyword_gaps: keywordGaps,
      },
      performance: {
        current_30d: currentTotals,
        previous_30d: previousTotals,
      },
      reviews: {
        total: totalReviews,
        avg_rating: avgRating,
        response_rate: responseRate,
        unreplied,
        negative_share: totalReviews ? Math.round((negativeReviews / totalReviews) * 1000) / 10 : 0,
        locations_needing_replies: locationsNeedingReplies,
      },
      posts: {
        templates: (postTemplates ?? []).length,
        total: (filteredPosts ?? []).length,
        drafts: (filteredPosts ?? []).filter((p: any) => p?.status === "draft").length,
        scheduled: (filteredPosts ?? []).filter((p: any) => p?.status === "scheduled").length,
        published: (filteredPosts ?? []).filter((p: any) => p?.status === "published").length,
        failed: (filteredPosts ?? []).filter((p: any) => p?.status === "failed").length,
        publish_success_rate: postPubStats.rate,
        failure_reasons: postPubStats.reasons,
      },
      media: {
        coverage: mediaCoverage,
      },
      qna: {
        total: filteredQna.length,
        open: filteredQna.filter((q: any) => q?.status === "open").length,
        answered: filteredQna.filter((q: any) => q?.status === "answered").length,
        closed: filteredQna.filter((q: any) => q?.status === "closed").length,
      },
    }

    return new Response(
      JSON.stringify({
        success: true,
        accounts: accounts ?? [],
        locations: locations ?? [],
        posts: filteredPosts,
        post_templates: postTemplates ?? [],
        post_publications: filteredPostPublications,
        reviews: filteredReviews,
        insights: filteredInsights,
        search_keywords_monthly: filteredSearchKeywords,
        bulk_updates: filteredBulkUpdates,
        insights_payload: insightsPayload,
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

