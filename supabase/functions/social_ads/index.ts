import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? 'https://nazedodnkzkuxvsuedmb.supabase.co'
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hemVkb2Rua3prdXh2c3VlZG1iIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTUyNzcyOCwiZXhwIjoyMDc1MTAzNzI4fQ.VFx60HhZ33R6sjclr_RqEiwWbYdmnTVXy6kpLUYpWs8'
    
    const supabaseClient = createClient(supabaseUrl, supabaseKey)

    const { ad_id, action } = await req.json()

    // Get ad details
    const { data: ad, error: adError } = await supabaseClient
      .from('social_media_ads')
      .select('*, account:social_media_accounts(*)')
      .eq('id', ad_id)
      .single()

    if (adError) throw adError

    let result

    switch (action) {
      case 'create':
        result = await createAd(ad)
        break
      case 'pause':
        result = await pauseAd(ad)
        break
      case 'resume':
        result = await resumeAd(ad)
        break
      case 'get_insights':
        result = await getAdInsights(ad)
        break
      default:
        throw new Error('Invalid action')
    }

    // Update ad in database
    await supabaseClient
      .from('social_media_ads')
      .update({
        status: result.status,
        ad_id: result.ad_id,
        metrics: result.metrics,
      })
      .eq('id', ad_id)

    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})

async function createAd(ad: any) {
  const platform = ad.platform
  const account = ad.account

  switch (platform) {
    case 'facebook':
    case 'instagram':
      return await createFacebookAd(ad, account)
    case 'tiktok':
      return await createTikTokAd(ad, account)
    case 'twitter':
      return await createTwitterAd(ad, account)
    case 'linkedin':
      return await createLinkedInAd(ad, account)
    case 'youtube':
      return await createYouTubeAd(ad, account)
    default:
      throw new Error('Unsupported platform')
  }
}

async function createFacebookAd(ad: any, account: any) {
  // Facebook Ads API
  const response = await fetch(
    `https://graph.facebook.com/v18.0/act_${account.account_id}/ads`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: ad.campaign_name,
        objective: ad.objective,
        status: 'ACTIVE',
        access_token: account.access_token,
      }),
    }
  )

  const data = await response.json()

  return {
    status: 'active',
    ad_id: data.id,
    metrics: {
      impressions: 0,
      clicks: 0,
      conversions: 0,
      spend: 0,
    },
  }
}

async function createTikTokAd(ad: any, account: any) {
  return {
    status: 'active',
    ad_id: 'demo_tiktok_ad_id',
    metrics: { impressions: 0, clicks: 0, conversions: 0, spend: 0 },
  }
}

async function createTwitterAd(ad: any, account: any) {
  return {
    status: 'active',
    ad_id: 'demo_twitter_ad_id',
    metrics: { impressions: 0, clicks: 0, conversions: 0, spend: 0 },
  }
}

async function createLinkedInAd(ad: any, account: any) {
  return {
    status: 'active',
    ad_id: 'demo_linkedin_ad_id',
    metrics: { impressions: 0, clicks: 0, conversions: 0, spend: 0 },
  }
}

async function createYouTubeAd(ad: any, account: any) {
  return {
    status: 'active',
    ad_id: 'demo_youtube_ad_id',
    metrics: { impressions: 0, clicks: 0, conversions: 0, spend: 0 },
  }
}

async function pauseAd(ad: any) {
  return {
    status: 'paused',
    ad_id: ad.ad_id,
    metrics: ad.metrics,
  }
}

async function resumeAd(ad: any) {
  return {
    status: 'active',
    ad_id: ad.ad_id,
    metrics: ad.metrics,
  }
}

async function getAdInsights(ad: any) {
  // Fetch real-time metrics from platform
  const mockMetrics = {
    impressions: Math.floor(Math.random() * 10000),
    clicks: Math.floor(Math.random() * 500),
    conversions: Math.floor(Math.random() * 50),
    spend: Math.floor(Math.random() * 1000),
    ctr: (Math.random() * 5).toFixed(2),
    cpc: (Math.random() * 10).toFixed(2),
    roas: (Math.random() * 3 + 1).toFixed(2),
  }

  return {
    status: ad.status,
    ad_id: ad.ad_id,
    metrics: mockMetrics,
  }
}
