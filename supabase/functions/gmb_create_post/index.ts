import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function renderTemplate(input: any, vars: Record<string, string>): string {
  const s = String(input ?? '')
  if (!s) return ''
  return s.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_m, keyRaw) => {
    const key = String(keyRaw || '').toLowerCase()
    return vars[key] ?? ''
  })
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
    const { 
      organization_id,
      post_id,
      location_ids 
    } = await req.json()

    if (!organization_id || !post_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters', step }),
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

    // Get post details
    step = 'fetch_post'
    const { data: post, error: postError } = await supabaseAdminClient
      .from('gmb_posts')
      .select('*')
      .eq('id', post_id)
      .eq('organization_id', organization_id)
      .single()

    if (postError || !post) {
      throw new Error(`Post not found: ${postError?.message}`)
    }

    // Org variables (best-effort)
    let orgName: string | null = null
    try {
      const { data: orgRow } = await supabaseAdminClient
        .from('organizations')
        .select('name')
        .eq('id', organization_id)
        .maybeSingle()
      orgName = orgRow?.name ?? null
    } catch (_e) {
      orgName = null
    }

    // Get target locations
    const targetLocationIds = location_ids || post.target_locations
    
    step = 'fetch_locations'
    const { data: locations, error: locationsError } = await supabaseAdminClient
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
        step = 'refresh_token'
        const accessToken = await refreshAccessTokenIfNeeded(supabaseAdminClient, location.gmb_account)

        const addrObj = location?.address || {}
        const addr =
          addrObj?.formattedAddress ||
          (Array.isArray(addrObj?.addressLines) ? addrObj.addressLines.filter(Boolean).join(', ') : '') ||
          ''

        const vars: Record<string, string> = {
          // workshop/org
          workshop_name: String(orgName || location?.location_name || ''),
          organization_name: String(orgName || location?.location_name || ''),

          // location
          location_name: String(location?.location_name || ''),
          city: String(addrObj?.locality || ''),
          state: String(addrObj?.administrativeArea || addrObj?.regionCode || ''),
          postal_code: String(addrObj?.postalCode || ''),
          address: String(addr || ''),
          category: String(location?.category || ''),
          phone: String(location?.phone || ''),
          website: String(location?.website || ''),
        }

        const renderedTitle = renderTemplate(post.title, vars)
        const renderedContent = renderTemplate(post.content, vars)
        const renderedActionUrl = renderTemplate(post.action_url, vars)

        // Prepare post payload
        const postPayload: any = {
          languageCode: 'en',
          summary: (renderedContent || renderedTitle || '').substring(0, 1500),
          callToAction: post.call_to_action ? {
            actionType: post.call_to_action,
            url: renderedActionUrl || post.action_url,
          } : undefined,
          media: post.media_urls?.map(url => ({
            mediaFormat: 'PHOTO',
            sourceUrl: url,
          })),
        }

        // Add type-specific fields
        if (post.post_type === 'EVENT' && post.event_details) {
          postPayload.event = {
            title: renderTemplate(post.event_details.title, vars),
            schedule: {
              startDate: post.event_details.start_date,
              endDate: post.event_details.end_date,
            },
          }
        } else if (post.post_type === 'OFFER' && post.offer_details) {
          postPayload.offer = {
            couponCode: renderTemplate(post.offer_details.coupon_code, vars),
            redeemOnlineUrl: renderTemplate(post.offer_details.redeem_url, vars),
            termsConditions: renderTemplate(post.offer_details.terms, vars),
          }
        } else {
          postPayload.topicType = 'STANDARD'
        }

        // Create post via Google My Business API
        step = 'create_post_google'
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

        const respText = await createResponse.text()
        const respJson = respText ? (() => { try { return JSON.parse(respText) } catch { return { raw: respText } } })() : null

        if (createResponse.ok) {
          successCount++
          if (Array.isArray(targetLocationIds) && targetLocationIds.length === 1 && respJson?.name) {
            try {
              await supabaseAdminClient
                .from('gmb_posts')
                .update({ google_post_name: respJson.name })
                .eq('id', post_id)
            } catch (e) {
              console.warn('Failed to update gmb_posts google_post_name:', e?.message || String(e))
            }
          }
          // Store per-location publication result (best-effort)
          try {
            await supabaseAdminClient
              .from('gmb_post_publications')
              .upsert({
                organization_id,
                post_id,
                gmb_location_id: location.id,
                google_post_name: respJson?.name ?? null,
                status: 'published',
                error_text: null,
                raw_response: respJson,
              }, { onConflict: 'post_id,gmb_location_id' })
          } catch (e) {
            console.warn('Failed to store gmb_post_publications (success):', e?.message || String(e))
          }
        } else {
          failCount++
          const errorText = typeof respText === 'string' ? respText : String(respText)
          errors.push({
            location_id: location.id,
            location_name: location.location_name,
            error: errorText,
          })

          // Store per-location publication result (best-effort)
          try {
            await supabaseAdminClient
              .from('gmb_post_publications')
              .upsert({
                organization_id,
                post_id,
                gmb_location_id: location.id,
                google_post_name: respJson?.name ?? null,
                status: 'failed',
                error_text: errorText,
                raw_response: respJson,
              }, { onConflict: 'post_id,gmb_location_id' })
          } catch (e) {
            console.warn('Failed to store gmb_post_publications (failure):', e?.message || String(e))
          }
        }

      } catch (error) {
        failCount++
        errors.push({
          location_id: location.id,
          location_name: location.location_name,
          error: error.message,
        })

        // Store per-location publication result (best-effort)
        try {
          await supabaseAdminClient
            .from('gmb_post_publications')
            .upsert({
              organization_id,
              post_id,
              gmb_location_id: location.id,
              google_post_name: null,
              status: 'failed',
              error_text: error?.message || String(error),
              raw_response: null,
            }, { onConflict: 'post_id,gmb_location_id' })
        } catch (e) {
          console.warn('Failed to store gmb_post_publications (exception):', e?.message || String(e))
        }
      }
    }

    // Update post status
    step = 'update_post_status'
    await supabaseAdminClient
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
        details: error.message,
        step,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
