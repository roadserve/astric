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
    const { authorization_code, organization_id } = await req.json()

    if (!authorization_code || !organization_id) {
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

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: authorization_code,
        client_id: Deno.env.get('GOOGLE_CLIENT_ID'),
        client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET'),
        redirect_uri: Deno.env.get('GOOGLE_REDIRECT_URI'),
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange authorization code')
    }

    const tokens = await tokenResponse.json()

    // Get account information using Business Profile API
    const accountsResponse = await fetch(
      'https://mybusinessbusinessinformation.googleapis.com/v1/accounts',
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
      throw new Error(`Failed to fetch GMB accounts: ${accountsResponse.status} - ${errorText}`)
    }

    const accountsData = await accountsResponse.json()
    const accounts = accountsData.accounts || []
    
    console.log('Found accounts:', accounts.length)

    // Store GMB accounts
    const savedAccounts = []

    for (const account of accounts) {
      const { data: gmbAccount, error } = await supabaseClient
        .from('gmb_accounts')
        .upsert({
          organization_id,
          account_name: account.accountName,
          account_id: account.name.split('/').pop(),
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
          is_active: true,
          last_synced_at: new Date().toISOString(),
        }, {
          onConflict: 'organization_id,account_id'
        })
        .select()
        .single()

      if (error) {
        console.error('Error saving GMB account:', error)
        continue
      }

      // Fetch locations for this account
      const locationsResponse = await fetch(
        `https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations`,
        {
          headers: {
            'Authorization': `Bearer ${tokens.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (locationsResponse.ok) {
        const locationsData = await locationsResponse.json()
        const locations = locationsData.locations || []

        for (const location of locations) {
          await supabaseClient
            .from('gmb_locations')
            .upsert({
              gmb_account_id: gmbAccount.id,
              organization_id,
              location_name: location.title,
              location_id: location.name.split('/').pop(),
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

        savedAccounts.push({
          account_id: gmbAccount.id,
          account_name: account.accountName,
          locations_count: locations.length,
        })
      }
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
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
