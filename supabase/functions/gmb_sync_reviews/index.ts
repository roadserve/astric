import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { organization_id } = await req.json()

    if (!organization_id) {
      return new Response(
        JSON.stringify({ error: 'Missing organization_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Get all active GMB locations for the organization
    const { data: locations, error: locationsError } = await supabaseClient
      .from('gmb_locations')
      .select('*, gmb_account:gmb_accounts(*)')
      .eq('organization_id', organization_id)
      .eq('gmb_account.is_active', true)

    if (locationsError) {
      throw new Error(`Failed to get locations: ${locationsError.message}`)
    }

    let totalReviews = 0
    let newReviews = 0

    for (const location of locations || []) {
      try {
        const accessToken = location.gmb_account.access_token

        // Fetch reviews from Google
        const reviewsResponse = await fetch(
          `https://mybusiness.googleapis.com/v4/accounts/${location.gmb_account.account_id}/locations/${location.location_id}/reviews`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        )

        if (reviewsResponse.ok) {
          const reviewsData = await reviewsResponse.json()
          const reviews = reviewsData.reviews || []

          for (const review of reviews) {
            // Insert or update review
            const { error: reviewError } = await supabaseClient
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
              }, {
                onConflict: 'gmb_location_id,review_id'
              })

            if (!reviewError) {
              newReviews++
            }
            totalReviews++
          }
        }

      } catch (error) {
        console.error(`Error syncing reviews for location ${location.location_name}:`, error)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        total_reviews: totalReviews,
        new_reviews: newReviews,
        locations_synced: locations?.length || 0,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in gmb_sync_reviews:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
