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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)

    if (!user) {
      throw new Error('Unauthorized')
    }

    // Get user's organization
    const { data: orgMember } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (!orgMember) {
      throw new Error('Organization not found')
    }

    // Get WhatsApp credentials from database (per organization)
    const { data: whatsappAccount, error: accountError } = await supabase
      .from('whatsapp_accounts')
      .select('phone_number_id, access_token')
      .eq('organization_id', orgMember.organization_id)
      .eq('status', 'active')
      .single()

    // Fallback to environment variables if database doesn't have credentials
    let whatsappToken = whatsappAccount?.access_token || Deno.env.get('WHATSAPP_ACCESS_TOKEN')
    let phoneNumberId = whatsappAccount?.phone_number_id || Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')

    if (!whatsappToken || !phoneNumberId) {
      throw new Error('WhatsApp credentials not configured. Please add credentials in Settings.')
    }

    // Get business profile
    const profileResponse = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/whatsapp_business_profile?fields=about,address,description,email,profile_picture_url,websites,vertical`,
      {
        headers: {
          'Authorization': `Bearer ${whatsappToken}`,
        },
      }
    )

    const profileData = await profileResponse.json()

    // Get phone number info
    const phoneResponse = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}?fields=display_phone_number,verified_name,quality_rating,messaging_limit_tier`,
      {
        headers: {
          'Authorization': `Bearer ${whatsappToken}`,
        },
      }
    )

    const phoneData = await phoneResponse.json()

    return new Response(
      JSON.stringify({
        success: true,
        profile: profileData.data?.[0] || {},
        phone_number: phoneData
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error getting profile:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
