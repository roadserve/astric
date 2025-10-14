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

    const { account_id, date_range } = await req.json()

    // Get account details
    const { data: account, error: accountError } = await supabaseClient
      .from('social_media_accounts')
      .select('*')
      .eq('id', account_id)
      .single()

    if (accountError) throw accountError

    // Fetch analytics from platform
    const analytics = await fetchPlatformAnalytics(account, date_range)

    // Store analytics in database
    const { data, error } = await supabaseClient
      .from('social_media_analytics')
      .upsert({
        organization_id: account.organization_id,
        account_id: account.id,
        platform: account.platform,
        date: new Date().toISOString().split('T')[0],
        ...analytics,
      })
      .select()
      .single()

    if (error) throw error

    // Generate AI insights
    const insights = await generateInsights(analytics, account.platform)

    // Store insights
    await supabaseClient
      .from('social_media_insights')
      .insert({
        organization_id: account.organization_id,
        account_id: account.id,
        platform: account.platform,
        insight_type: 'audience',
        data: analytics,
        recommendations: insights.recommendations,
      })

    return new Response(
      JSON.stringify({ success: true, analytics: data, insights }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})

async function fetchPlatformAnalytics(account: any, dateRange: string) {
  // Fetch real analytics from platform APIs
  // For now, return mock data
  return {
    followers_count: Math.floor(Math.random() * 10000) + 1000,
    following_count: Math.floor(Math.random() * 1000),
    posts_count: Math.floor(Math.random() * 100) + 10,
    engagement_rate: (Math.random() * 10).toFixed(2),
    reach: Math.floor(Math.random() * 50000),
    impressions: Math.floor(Math.random() * 100000),
    profile_visits: Math.floor(Math.random() * 5000),
    website_clicks: Math.floor(Math.random() * 1000),
    metrics: {
      likes: Math.floor(Math.random() * 5000),
      comments: Math.floor(Math.random() * 500),
      shares: Math.floor(Math.random() * 200),
      saves: Math.floor(Math.random() * 300),
    },
  }
}

async function generateInsights(analytics: any, platform: string) {
  const recommendations = []

  // Engagement rate analysis
  if (analytics.engagement_rate < 2) {
    recommendations.push('Your engagement rate is below average. Try posting more interactive content.')
  } else if (analytics.engagement_rate > 5) {
    recommendations.push('Great engagement rate! Keep up the good work.')
  }

  // Posting frequency
  if (analytics.posts_count < 10) {
    recommendations.push('Increase posting frequency to 3-5 times per week for better reach.')
  }

  // Best time to post
  recommendations.push(`Best time to post on ${platform}: 10 AM - 2 PM on weekdays`)

  // Content recommendations
  recommendations.push('Video content gets 2x more engagement than images. Try posting more videos.')

  return {
    recommendations,
    score: Math.floor(analytics.engagement_rate * 10),
    trend: analytics.followers_count > 1000 ? 'growing' : 'stable',
  }
}
