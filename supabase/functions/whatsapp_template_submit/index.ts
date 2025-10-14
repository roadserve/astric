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

    const { template_id, action } = await req.json()

    // Get WhatsApp credentials
    const whatsappToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN')
    const wabaId = Deno.env.get('WHATSAPP_BUSINESS_ACCOUNT_ID')

    if (!whatsappToken || !wabaId) {
      throw new Error('WhatsApp credentials not configured')
    }

    // Get template from database
    const { data: template, error: templateError } = await supabase
      .from('whatsapp_templates')
      .select('*')
      .eq('id', template_id)
      .single()

    if (templateError || !template) {
      throw new Error('Template not found')
    }

    if (action === 'submit') {
      // Submit template to WhatsApp for approval
      const templatePayload = {
        name: template.name,
        language: template.language,
        category: template.category,
        components: template.components.components
      }

      console.log('Submitting template to WhatsApp:', JSON.stringify(templatePayload, null, 2))

      const response = await fetch(
        `https://graph.facebook.com/v18.0/${wabaId}/message_templates`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${whatsappToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(templatePayload),
        }
      )

      const data = await response.json()
      console.log('WhatsApp API response:', data)

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to submit template')
      }

      // Update template with WhatsApp template ID
      await supabase
        .from('whatsapp_templates')
        .update({
          whatsapp_template_id: data.id,
          status: 'pending',
          submitted_at: new Date().toISOString()
        })
        .eq('id', template_id)

      return new Response(
        JSON.stringify({
          success: true,
          whatsapp_template_id: data.id,
          message: 'Template submitted for approval'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    } else if (action === 'delete') {
      // Delete template from WhatsApp
      if (!template.whatsapp_template_id) {
        throw new Error('Template not submitted to WhatsApp yet')
      }

      const response = await fetch(
        `https://graph.facebook.com/v18.0/${wabaId}/message_templates?name=${template.name}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${whatsappToken}`,
          },
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error?.message || 'Failed to delete template')
      }

      // Update template status in database
      await supabase
        .from('whatsapp_templates')
        .update({
          status: 'deleted',
          deleted_at: new Date().toISOString()
        })
        .eq('id', template_id)

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Template deleted'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    } else if (action === 'check_status') {
      // Check template status from WhatsApp
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${wabaId}/message_templates?name=${template.name}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${whatsappToken}`,
          },
        }
      )

      const data = await response.json()
      console.log('Template status:', data)

      if (data.data && data.data.length > 0) {
        const whatsappTemplate = data.data[0]
        
        // Update template status in database
        await supabase
          .from('whatsapp_templates')
          .update({
            status: whatsappTemplate.status.toLowerCase(),
            quality_score: whatsappTemplate.quality_score?.score,
            rejection_reason: whatsappTemplate.rejected_reason
          })
          .eq('id', template_id)

        return new Response(
          JSON.stringify({
            success: true,
            status: whatsappTemplate.status,
            quality_score: whatsappTemplate.quality_score,
            rejection_reason: whatsappTemplate.rejected_reason
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )
      }

      return new Response(
        JSON.stringify({
          success: false,
          message: 'Template not found on WhatsApp'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        }
      )
    }

    throw new Error('Invalid action')
  } catch (error) {
    console.error('Error managing template:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
