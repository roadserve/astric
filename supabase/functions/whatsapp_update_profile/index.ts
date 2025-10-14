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

    const profileData = await req.json()
    console.log('Updating profile:', JSON.stringify(profileData, null, 2))

    // Update business profile
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/whatsapp_business_profile`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${whatsappToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          ...profileData
        }),
      }
    )

    const data = await response.json()
    console.log('WhatsApp API response:', data)

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to update profile')
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Profile updated successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error updating profile:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
