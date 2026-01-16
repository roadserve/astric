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

  let step = 'init'
  try {
    step = 'parse_request'
    const { authorization_code, organization_id, redirect_uri } = await req.json()

    if (!authorization_code || !organization_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    step = 'load_google_oauth_env'
    const googleClientId = (Deno.env.get('GOOGLE_CLIENT_ID') ?? '').trim()
    const googleClientSecret = (Deno.env.get('GOOGLE_CLIENT_SECRET') ?? '').trim()
    const googleRedirectUri = (redirect_uri || Deno.env.get('GOOGLE_REDIRECT_URI') || '').trim()

    if (!googleClientId || !googleClientSecret || !googleRedirectUri) {
      return new Response(
        JSON.stringify({
          error: 'Missing Google OAuth configuration',
          details:
            'Please set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI in Supabase Edge Function secrets.',
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    step = 'check_auth_header'
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          error: 'Unauthorized',
          details: 'Missing Authorization header when calling gmb_connect.',
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    step = 'create_supabase_clients'
    // Use user-scoped client only to identify the caller.
    const supabaseUserClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    // Use service role for DB writes (avoids RLS blocking token storage),
    // but only AFTER verifying user is an active org member.
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabaseAdminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      serviceRoleKey || (Deno.env.get('SUPABASE_ANON_KEY') ?? '')
    )

    step = 'get_caller_user'
    const { data: userData, error: userErr } = await supabaseUserClient.auth.getUser()
    if (userErr || !userData?.user) {
      return new Response(
        JSON.stringify({
          error: 'Unauthorized',
          details: userErr?.message || 'Could not resolve user from JWT.',
          step,
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    step = 'verify_org_membership'
    const { data: orgMember, error: orgErr } = await supabaseAdminClient
      .from('organization_members')
      .select('id')
      .eq('organization_id', organization_id)
      .eq('user_id', userData.user.id)
      .eq('is_active', true)
      .maybeSingle()

    if (orgErr) {
      return new Response(
        JSON.stringify({
          error: 'Failed to verify organization membership',
          details: orgErr.message,
          step,
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!orgMember) {
      return new Response(
        JSON.stringify({
          error: 'Forbidden',
          details: 'User is not an active member of this organization.',
          step,
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Exchange authorization code for access token
    // Google expects application/x-www-form-urlencoded (not JSON).
    step = 'google_token_exchange'
    const tokenBody = new URLSearchParams({
      code: authorization_code,
      client_id: googleClientId,
      client_secret: googleClientSecret,
      redirect_uri: googleRedirectUri,
      grant_type: 'authorization_code',
    })

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenBody,
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('Google token exchange failed:', errorText)
      return new Response(
        JSON.stringify({
          error: 'Failed to exchange authorization code',
          details: `${tokenResponse.status} - ${errorText}`,
          step,
          debug: {
            client_id: googleClientId,
            redirect_uri: googleRedirectUri,
            client_secret_format_ok: googleClientSecret.startsWith('GOCSPX-'),
            client_secret_length: googleClientSecret.length,
            hint:
              'This often happens when the authorization code was created using a different OAuth client_id than the one used for token exchange. Ensure NEXT_PUBLIC_GOOGLE_CLIENT_ID (web) matches GOOGLE_CLIENT_ID (Supabase secrets), then start a fresh Connect flow to get a new code.',
          },
        }),
        { status: tokenResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const tokens = await tokenResponse.json()
    if (!tokens?.access_token) {
      return new Response(
        JSON.stringify({
          error: 'Google token exchange returned no access_token',
          details: JSON.stringify(tokens),
          step,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get account information using Business Profile Account Management API
    step = 'fetch_gbp_accounts'
    const accountsResponse = await fetch(
      'https://mybusinessaccountmanagement.googleapis.com/v1/accounts',
      {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!accountsResponse.ok) {
      const errorText = await accountsResponse.text()
      console.error('GMB API Error:', errorText)
      // Try to introspect the access token scopes for easier debugging.
      let tokenInfo: any = null
      try {
        const ti = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(tokens.access_token)}`)
        const tiText = await ti.text()
        try {
          tokenInfo = JSON.parse(tiText)
        } catch {
          tokenInfo = { raw: tiText }
        }
      } catch {
        // ignore
      }
      return new Response(
        JSON.stringify({
          error: 'Failed to fetch GMB accounts',
          details: `${accountsResponse.status} - ${errorText}`,
          token_info: tokenInfo,
          step,
        }),
        {
          status: accountsResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const accountsData = await accountsResponse.json()
    const accounts = accountsData.accounts || []
    
    console.log('Found accounts:', accounts.length)
    if (!Array.isArray(accounts)) {
      return new Response(
        JSON.stringify({
          error: 'Unexpected accounts response from Google',
          details: JSON.stringify(accountsData),
          step,
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Store GMB accounts
    const savedAccounts: Array<{
      account_db_id: string
      account_id: string
      account_name: string
      locations_count: number
      locations_error?: string
    }> = []
    const upsertErrors: Array<{ account: any; error: string }> = []

    for (const account of accounts) {
      step = 'upsert_gmb_account'
      const upsertPayload: Record<string, unknown> = {
        organization_id,
        connected_by: userData.user.id,
        account_name: account.accountName || account.account_name || account.name,
        account_id: String(account.name || '').includes('/') ? String(account.name).split('/').pop() : account.accountId || account.account_id,
        access_token: tokens.access_token,
        token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        is_active: true,
        last_synced_at: new Date().toISOString(),
      }

      // Google may not always return refresh_token on subsequent consent.
      // If it's missing, don't overwrite existing refresh_token.
      if (tokens.refresh_token) {
        upsertPayload.refresh_token = tokens.refresh_token
      }

      if (!upsertPayload.account_id) {
        console.error('Skipping account with missing id:', account)
        upsertErrors.push({ account, error: 'Missing account_id in Google response' })
        continue
      }

      const { data: gmbAccount, error } = await supabaseAdminClient
        .from('gmb_accounts')
        .upsert(upsertPayload, {
          onConflict: 'organization_id,account_id'
        })
        .select()
        .single()

      if (error) {
        console.error('Error saving GMB account:', error)
        console.error('Upsert payload:', upsertPayload)
        upsertErrors.push({ account, error: error.message })
        continue
      }

      // Link this connected account to the current user (many-to-many)
      try {
        await supabaseAdminClient
          .from('gmb_account_connections')
          .upsert(
            {
              organization_id,
              gmb_account_id: gmbAccount.id,
              user_id: userData.user.id,
            },
            { onConflict: 'gmb_account_id,user_id' }
          )
      } catch (e) {
        // non-fatal: account is saved, but user-scoped listing may be incomplete
        console.error('Failed to upsert gmb_account_connections:', e)
      }

      // Fetch locations for this account
      step = 'fetch_locations'
      const locationsResponse = await fetch(
        `https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations`,
        {
          headers: {
            'Authorization': `Bearer ${tokens.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      let locationsCount = 0
      let locationsError: string | undefined

      if (locationsResponse.ok) {
        const locationsData = await locationsResponse.json()
        const locations = locationsData.locations || []
        locationsCount = Array.isArray(locations) ? locations.length : 0

        for (const location of locations || []) {
          step = 'upsert_location'
          await supabaseAdminClient
            .from('gmb_locations')
            .upsert({
              gmb_account_id: gmbAccount.id,
              organization_id,
              location_name: location.title,
              location_id: String(location.name || '').includes('/') ? String(location.name).split('/').pop() : location.locationId || location.location_id,
              store_code: location.storeCode,
              address: location.address,
              phone: location.phoneNumbers?.primaryPhone,
              website: location.websiteUri,
              category: location.categories?.primaryCategory?.displayName,
              description: location.profile?.description,
              hours: location.regularHours,
              attributes: location.attributes,
              is_verified: location.metadata?.mapsUri ? true : false,
              is_published: true,
              last_synced_at: new Date().toISOString(),
            }, {
              onConflict: 'gmb_account_id,location_id'
            })
        }
      } else {
        locationsError = await locationsResponse.text()
        console.error('Locations fetch failed:', locationsError)
      }

      // Always report the account as connected once upsert succeeded.
      savedAccounts.push({
        account_db_id: gmbAccount.id,
        account_id: String(upsertPayload.account_id),
        account_name: String(upsertPayload.account_name),
        locations_count: locationsCount,
        ...(locationsError ? { locations_error: locationsError } : {}),
      })
    }

    if (savedAccounts.length === 0) {
      return new Response(
        JSON.stringify({
          error: 'No accounts were saved',
          details: 'Google returned 0 accounts for this Google login, or all account upserts failed.',
          google_accounts_count: Array.isArray(accounts) ? accounts.length : null,
          upsert_errors: upsertErrors.slice(0, 3),
          step,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        accounts: savedAccounts,
        message: 'GMB accounts connected successfully',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in gmb_connect:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error?.message || String(error),
        step,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
