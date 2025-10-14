import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const whatsappToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN')
    const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')

    if (!whatsappToken || !phoneNumberId) {
      throw new Error('WhatsApp credentials not configured')
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
