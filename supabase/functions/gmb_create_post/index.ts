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
    const { 
      organization_id,
      post_id,
      location_ids 
    } = await req.json()

    if (!organization_id || !post_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get post details
    const { data: post, error: postError } = await supabaseClient
      .from('gmb_posts')
      .select('*')
      .eq('id', post_id)
      .eq('organization_id', organization_id)
      .single()

    if (postError || !post) {
      throw new Error(`Post not found: ${postError?.message}`)
    }

    // Get target locations
    const targetLocationIds = location_ids || post.target_locations
    
    const { data: locations, error: locationsError } = await supabaseClient
      .from('gmb_locations')
      .select('*, gmb_account:gmb_accounts(*)')
      .in('id', targetLocationIds)
      .eq('organization_id', organization_id)

    if (locationsError) {
      throw new Error(`Failed to get locations: ${locationsError.message}`)
    }

    let successCount = 0
    let failCount = 0
    const errors = []

    // Create post on each location
    for (const location of locations || []) {
      try {
        const accessToken = location.gmb_account.access_token

        // Prepare post payload
        const postPayload = {
          languageCode: 'en',
          summary: post.title || post.content.substring(0, 100),
          callToAction: post.call_to_action ? {
            actionType: post.call_to_action,
            url: post.action_url,
          } : undefined,
          media: post.media_urls?.map(url => ({
            mediaFormat: 'PHOTO',
            sourceUrl: url,
          })),
        }

        // Add type-specific fields
        if (post.post_type === 'EVENT' && post.event_details) {
          postPayload.event = {
            title: post.event_details.title,
            schedule: {
              startDate: post.event_details.start_date,
              endDate: post.event_details.end_date,
            },
          }
        } else if (post.post_type === 'OFFER' && post.offer_details) {
          postPayload.offer = {
            couponCode: post.offer_details.coupon_code,
            redeemOnlineUrl: post.offer_details.redeem_url,
            termsConditions: post.offer_details.terms,
          }
        } else {
          postPayload.topicType = 'STANDARD'
        }

        // Create post via Google My Business API
        const createResponse = await fetch(
          `https://mybusiness.googleapis.com/v4/accounts/${location.gmb_account.account_id}/locations/${location.location_id}/localPosts`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(postPayload),
          }
        )

        if (createResponse.ok) {
          successCount++
        } else {
          const errorText = await createResponse.text()
          failCount++
          errors.push({
            location_id: location.id,
            location_name: location.location_name,
            error: errorText,
          })
        }

      } catch (error) {
        failCount++
        errors.push({
          location_id: location.id,
          location_name: location.location_name,
          error: error.message,
        })
      }
    }

    // Update post status
    await supabaseClient
      .from('gmb_posts')
      .update({
        status: failCount === 0 ? 'published' : 'failed',
        published_at: new Date().toISOString(),
      })
      .eq('id', post_id)

    return new Response(
      JSON.stringify({
        success: true,
        post_id,
        total_locations: targetLocationIds.length,
        successful_posts: successCount,
        failed_posts: failCount,
        errors: errors,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in gmb_create_post:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
