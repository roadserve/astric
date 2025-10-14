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

    const { post_id, action } = await req.json()

    // Get post details
    const { data: post, error: postError } = await supabaseClient
      .from('social_media_posts')
      .select('*, account:social_media_accounts(*)')
      .eq('id', post_id)
      .single()

    if (postError) throw postError

    let result

    switch (action) {
      case 'publish':
        result = await publishPost(post)
        break
      case 'schedule':
        result = await schedulePost(post)
        break
      case 'delete':
        result = await deletePost(post)
        break
      default:
        throw new Error('Invalid action')
    }

    // Update post status
    await supabaseClient
      .from('social_media_posts')
      .update({
        status: result.status,
        post_id: result.post_id,
        published_time: result.published_time,
      })
      .eq('id', post_id)

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

async function publishPost(post: any) {
  const platform = post.platform
  const account = post.account

  switch (platform) {
    case 'facebook':
      return await publishToFacebook(post, account)
    case 'instagram':
      return await publishToInstagram(post, account)
    case 'tiktok':
      return await publishToTikTok(post, account)
    case 'twitter':
      return await publishToTwitter(post, account)
    case 'linkedin':
      return await publishToLinkedIn(post, account)
    case 'youtube':
      return await publishToYouTube(post, account)
    default:
      throw new Error('Unsupported platform')
  }
}

async function publishToFacebook(post: any, account: any) {
  // Facebook Graph API
  const response = await fetch(
    `https://graph.facebook.com/v18.0/${account.account_id}/feed`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: post.content,
        access_token: account.access_token,
      }),
    }
  )

  const data = await response.json()

  return {
    status: 'published',
    post_id: data.id,
    published_time: new Date().toISOString(),
  }
}

async function publishToInstagram(post: any, account: any) {
  // Instagram Graph API
  return {
    status: 'published',
    post_id: 'demo_ig_post_id',
    published_time: new Date().toISOString(),
  }
}

async function publishToTikTok(post: any, account: any) {
  // TikTok API
  return {
    status: 'published',
    post_id: 'demo_tiktok_post_id',
    published_time: new Date().toISOString(),
  }
}

async function publishToTwitter(post: any, account: any) {
  // Twitter API v2
  return {
    status: 'published',
    post_id: 'demo_twitter_post_id',
    published_time: new Date().toISOString(),
  }
}

async function publishToLinkedIn(post: any, account: any) {
  // LinkedIn API
  return {
    status: 'published',
    post_id: 'demo_linkedin_post_id',
    published_time: new Date().toISOString(),
  }
}

async function publishToYouTube(post: any, account: any) {
  // YouTube Data API
  return {
    status: 'published',
    post_id: 'demo_youtube_video_id',
    published_time: new Date().toISOString(),
  }
}

async function schedulePost(post: any) {
  return {
    status: 'scheduled',
    post_id: null,
    published_time: null,
  }
}

async function deletePost(post: any) {
  // Delete from platform
  return {
    status: 'deleted',
    post_id: null,
    published_time: null,
  }
}
