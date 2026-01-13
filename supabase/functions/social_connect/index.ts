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

    const { platform, authorization_code, organization_id, facebook_account_id } = await req.json()
    
    // For Instagram, we need facebook_account_id
    if (platform === 'instagram' && !facebook_account_id) {
      throw new Error('Instagram connection requires facebook_account_id')
    }
    
    // For other platforms, we need authorization_code
    if (platform !== 'instagram' && (!authorization_code || !organization_id)) {
      throw new Error('Missing required parameters: authorization_code and organization_id')
    }

    // Exchange code for access token (platform-specific)
    let accountData
    
    switch (platform) {
      case 'facebook':
        accountData = await connectFacebookInstagram(authorization_code)
        break
      case 'instagram':
        // Get Facebook account to fetch Instagram
        const { data: fbAccount } = await supabaseClient
          .from('social_media_accounts')
          .select('*')
          .eq('id', facebook_account_id)
          .single()
        
        if (!fbAccount) {
          throw new Error('Facebook account not found')
        }
        
        accountData = await connectInstagram(fbAccount.access_token, organization_id)
        break
      case 'tiktok':
        accountData = await connectTikTok(authorization_code)
        break
      case 'twitter':
        accountData = await connectTwitter(authorization_code)
        break
      case 'linkedin':
        accountData = await connectLinkedIn(authorization_code)
        break
      case 'youtube':
        accountData = await connectYouTube(authorization_code)
        break
      default:
        throw new Error('Unsupported platform')
    }

    // Check if account already exists
    const { data: existingAccount } = await supabaseClient
      .from('social_media_accounts')
      .select('*')
      .eq('organization_id', organization_id)
      .eq('platform', platform)
      .eq('account_id', accountData.id)
      .single()

    let data
    if (existingAccount) {
      // Update existing account
      const { data: updated, error: updateError } = await supabaseClient
        .from('social_media_accounts')
        .update({
          account_name: accountData.name,
          access_token: accountData.access_token,
          refresh_token: accountData.refresh_token,
          token_expires_at: accountData.expires_at,
          profile_picture_url: accountData.profile_picture,
          followers_count: accountData.followers_count,
          metadata: accountData.metadata,
          is_active: true,
        })
        .eq('id', existingAccount.id)
        .select()
        .single()

      if (updateError) throw updateError
      data = updated
    } else {
      // Insert new account
      const { data: inserted, error: insertError } = await supabaseClient
        .from('social_media_accounts')
        .insert({
          organization_id,
          platform,
          account_name: accountData.name,
          account_id: accountData.id,
          access_token: accountData.access_token,
          refresh_token: accountData.refresh_token,
          token_expires_at: accountData.expires_at,
          profile_picture_url: accountData.profile_picture,
          followers_count: accountData.followers_count,
          metadata: accountData.metadata,
        })
        .select()
        .single()

      if (insertError) throw insertError
      data = inserted
    }

    return new Response(
      JSON.stringify({ success: true, account: data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})

async function connectFacebookInstagram(code: string) {
  // Facebook/Instagram OAuth flow
  const clientId = Deno.env.get('FACEBOOK_APP_ID')
  const clientSecret = Deno.env.get('FACEBOOK_APP_SECRET')
  const redirectUri = Deno.env.get('FACEBOOK_REDIRECT_URI') || 'http://localhost:3000/dashboard/social/callback'

  console.log('Exchanging Facebook code for token...')

  // Exchange code for token
  const tokenResponse = await fetch(
    `https://graph.facebook.com/v18.0/oauth/access_token?` +
    `client_id=${clientId}&` +
    `client_secret=${clientSecret}&` +
    `code=${code}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}`
  )

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text()
    console.error('Facebook token error:', errorText)
    throw new Error(`Failed to exchange code for token: ${tokenResponse.status} - ${errorText}`)
  }

  const tokenData = await tokenResponse.json()
  console.log('Token received, fetching profile...')

  // Get user profile and pages
  const profileResponse = await fetch(
    `https://graph.facebook.com/v18.0/me?fields=id,name,picture&access_token=${tokenData.access_token}`
  )

  if (!profileResponse.ok) {
    const errorText = await profileResponse.text()
    console.error('Facebook profile error:', errorText)
    throw new Error(`Failed to fetch profile: ${profileResponse.status} - ${errorText}`)
  }

  const profileData = await profileResponse.json()

  // Get pages managed by user
  const pagesResponse = await fetch(
    `https://graph.facebook.com/v18.0/me/accounts?access_token=${tokenData.access_token}`
  )

  let pageData = null
  if (pagesResponse.ok) {
    const pagesData = await pagesResponse.json()
    if (pagesData.data && pagesData.data.length > 0) {
      pageData = pagesData.data[0] // Use first page
      console.log('Found page:', pageData.name)
    }
  }

  return {
    id: pageData?.id || profileData.id,
    name: pageData?.name || profileData.name,
    access_token: pageData?.access_token || tokenData.access_token,
    refresh_token: null,
    expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days
    profile_picture: profileData.picture?.data?.url,
    followers_count: 0,
    metadata: { profile: profileData, page: pageData },
  }
}

async function connectInstagram(facebookAccessToken: string, organizationId: string) {
  console.log('Fetching Instagram account linked to Facebook Page...')

  // Get Instagram Business Account ID from Facebook Page
  const pageResponse = await fetch(
    `https://graph.facebook.com/v18.0/me/accounts?access_token=${facebookAccessToken}`
  )

  if (!pageResponse.ok) {
    throw new Error('Failed to fetch Facebook pages')
  }

  const pageData = await pageResponse.json()
  
  if (!pageData.data || pageData.data.length === 0) {
    throw new Error('No Facebook pages found')
  }

  const page = pageData.data[0]
  const pageAccessToken = page.access_token

  // Get Instagram Business Account connected to this page
  const igResponse = await fetch(
    `https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${pageAccessToken}`
  )

  if (!igResponse.ok) {
    throw new Error('Failed to fetch Instagram account. Make sure your Facebook Page is connected to an Instagram Business account.')
  }

  const igData = await igResponse.json()

  if (!igData.instagram_business_account) {
    throw new Error('No Instagram Business account linked to this Facebook Page. Please connect your Instagram Business account in Facebook settings.')
  }

  const igAccountId = igData.instagram_business_account.id

  // Get Instagram account details
  const igDetailsResponse = await fetch(
    `https://graph.facebook.com/v18.0/${igAccountId}?fields=id,username,name,profile_picture_url,followers_count&access_token=${pageAccessToken}`
  )

  if (!igDetailsResponse.ok) {
    throw new Error('Failed to fetch Instagram account details')
  }

  const igDetails = await igDetailsResponse.json()

  console.log('Instagram account found:', igDetails.username)

  return {
    id: igDetails.id,
    name: igDetails.name || igDetails.username,
    access_token: pageAccessToken,
    refresh_token: null,
    expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days
    profile_picture: igDetails.profile_picture_url,
    followers_count: igDetails.followers_count || 0,
    metadata: { instagram: igDetails, facebook_page: page },
  }
}

async function connectTikTok(code: string) {
  // TikTok OAuth flow
  return {
    id: 'demo_tiktok_id',
    name: 'Demo TikTok Account',
    access_token: 'demo_token',
    refresh_token: 'demo_refresh',
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    profile_picture: null,
    followers_count: 0,
    metadata: {},
  }
}

async function connectTwitter(code: string) {
  // Twitter/X OAuth flow
  return {
    id: 'demo_twitter_id',
    name: 'Demo Twitter Account',
    access_token: 'demo_token',
    refresh_token: 'demo_refresh',
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    profile_picture: null,
    followers_count: 0,
    metadata: {},
  }
}

async function connectLinkedIn(code: string) {
  // LinkedIn OAuth flow
  return {
    id: 'demo_linkedin_id',
    name: 'Demo LinkedIn Account',
    access_token: 'demo_token',
    refresh_token: 'demo_refresh',
    expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    profile_picture: null,
    followers_count: 0,
    metadata: {},
  }
}

async function connectYouTube(code: string) {
  // YouTube OAuth flow
  return {
    id: 'demo_youtube_id',
    name: 'Demo YouTube Channel',
    access_token: 'demo_token',
    refresh_token: 'demo_refresh',
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    profile_picture: null,
    followers_count: 0,
    metadata: {},
  }
}
