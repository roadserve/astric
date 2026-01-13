import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function refreshAccessTokenIfNeeded(
  supabaseClient: any,
  account: any
): Promise<string> {
  const accessToken = account?.access_token
  if (!accessToken) throw new Error('Missing access token for GMB account')

  const expiresAt = account?.token_expires_at ? new Date(account.token_expires_at).getTime() : null
  const needsRefresh = expiresAt ? expiresAt - Date.now() < 60_000 : false
  if (!needsRefresh) return accessToken

  const refreshToken = account?.refresh_token
  const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID')
  const googleClientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')

  // If we can't refresh, fall back to the existing token (might still work).
  if (!refreshToken || !googleClientId || !googleClientSecret) return accessToken

  const body = new URLSearchParams({
    client_id: googleClientId,
    client_secret: googleClientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  })

  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  if (!resp.ok) {
    const t = await resp.text()
    console.error('Failed to refresh Google token:', t)
    return accessToken
  }

  const tokens = await resp.json()
  const newAccessToken = tokens.access_token || accessToken
  const newExpiresAt = tokens.expires_in
    ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
    : account?.token_expires_at

  await supabaseClient
    .from('gmb_accounts')
    .update({
      access_token: newAccessToken,
      token_expires_at: newExpiresAt,
      last_synced_at: new Date().toISOString(),
    })
    .eq('id', account.id)

  return newAccessToken
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  let step = 'init'
  try {
    step = 'parse_request'
    const { organization_id } = await req.json()

    if (!organization_id) {
      return new Response(
        JSON.stringify({ error: 'Missing organization_id', step }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    step = 'check_auth_header'
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: 'Missing Authorization header', step }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    step = 'create_clients'
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    const supabaseUserClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const supabaseAdminClient = createClient(supabaseUrl, serviceRoleKey || anonKey)

    step = 'get_user'
    const { data: userData, error: userErr } = await supabaseUserClient.auth.getUser()
    if (userErr || !userData?.user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: userErr?.message, step }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    step = 'verify_membership'
    const { data: member, error: memberErr } = await supabaseAdminClient
      .from('organization_members')
      .select('id')
      .eq('organization_id', organization_id)
      .eq('user_id', userData.user.id)
      .eq('is_active', true)
      .maybeSingle()

    if (memberErr) {
      return new Response(
        JSON.stringify({ error: 'Failed to verify membership', details: memberErr.message, step }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!member) {
      return new Response(
        JSON.stringify({ error: 'Forbidden', details: 'Not a member of this org', step }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get all active GMB locations for the organization
    step = 'fetch_locations'
    const { data: locations, error: locationsError } = await supabaseAdminClient
      .from('gmb_locations')
      .select('*, gmb_account:gmb_accounts(*)')
      .eq('organization_id', organization_id)
      .eq('gmb_account.is_active', true)

    if (locationsError) {
      throw new Error(`Failed to get locations: ${locationsError.message}`)
    }

    let totalReviews = 0
    let upsertedReviews = 0
    const perLocation: any[] = []

    for (const location of locations || []) {
      try {
        step = 'refresh_token'
        const accessToken = await refreshAccessTokenIfNeeded(supabaseAdminClient, location.gmb_account)

        // Fetch reviews from Google
        step = 'fetch_reviews_google'
        const reviewsResponse = await fetch(
          `https://mybusiness.googleapis.com/v4/accounts/${location.gmb_account.account_id}/locations/${location.location_id}/reviews`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        )

        if (!reviewsResponse.ok) {
          const errorText = await reviewsResponse.text()
          perLocation.push({
            location_id: location.id,
            location_name: location.location_name,
            status: reviewsResponse.status,
            error: errorText,
          })
          continue
        }

        const reviewsData = await reviewsResponse.json()
        const reviews = reviewsData.reviews || []
        perLocation.push({
          location_id: location.id,
          location_name: location.location_name,
          fetched_reviews: reviews.length,
        })

        for (const review of reviews) {
          // Insert or update review
          step = 'upsert_review'
          const { error: reviewError } = await supabaseAdminClient
            .from('gmb_reviews')
            .upsert({
              gmb_location_id: location.id,
              organization_id,
              review_id: review.reviewId,
              reviewer_name: review.reviewer?.displayName || 'Anonymous',
              reviewer_photo_url: review.reviewer?.profilePhotoUrl,
              rating: review.starRating === 'FIVE' ? 5 :
                      review.starRating === 'FOUR' ? 4 :
                      review.starRating === 'THREE' ? 3 :
                      review.starRating === 'TWO' ? 2 : 1,
              comment: review.comment,
              review_reply: review.reviewReply?.comment,
              review_date: review.createTime,
              reply_date: review.reviewReply?.updateTime,
              is_replied: !!review.reviewReply,
              raw_review: review ?? null,
            }, {
              onConflict: 'gmb_location_id,review_id'
            })

          if (!reviewError) {
            upsertedReviews++
          }
          totalReviews++
        }

      } catch (error) {
        console.error(`Error syncing reviews for location ${location.location_name}:`, error)
        perLocation.push({
          location_id: location.id,
          location_name: location.location_name,
          error: error?.message || String(error),
        })
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        total_reviews: totalReviews,
        upserted_reviews: upsertedReviews,
        locations_synced: locations?.length || 0,
        locations: perLocation,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in gmb_sync_reviews:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message,
        step,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
