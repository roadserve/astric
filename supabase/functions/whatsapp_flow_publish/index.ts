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

    const { flow_id, action } = await req.json()

    // Get WhatsApp credentials
    const whatsappToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN')
    const wabaId = Deno.env.get('WHATSAPP_BUSINESS_ACCOUNT_ID')

    if (!whatsappToken || !wabaId) {
      throw new Error('WhatsApp credentials not configured')
    }

    // Get flow from database
    const { data: flow, error: flowError } = await supabase
      .from('whatsapp_flows')
      .select('*')
      .eq('id', flow_id)
      .single()

    if (flowError || !flow) {
      throw new Error('Flow not found')
    }

    if (action === 'publish') {
      // Create flow on WhatsApp
      const flowPayload = {
        name: flow.name,
        categories: ['LEAD_GENERATION'],
        ...flow.flow_json
      }

      console.log('Publishing flow to WhatsApp:', JSON.stringify(flowPayload, null, 2))

      const response = await fetch(
        `https://graph.facebook.com/v18.0/${wabaId}/flows`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${whatsappToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(flowPayload),
        }
      )

      const data = await response.json()
      console.log('WhatsApp API response:', data)

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to publish flow')
      }

      // Update flow with WhatsApp flow ID
      await supabase
        .from('whatsapp_flows')
        .update({
          whatsapp_flow_id: data.id,
          status: 'pending',
          published_at: new Date().toISOString()
        })
        .eq('id', flow_id)

      return new Response(
        JSON.stringify({
          success: true,
          whatsapp_flow_id: data.id,
          message: 'Flow published successfully'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    } else if (action === 'update') {
      // Update flow on WhatsApp
      if (!flow.whatsapp_flow_id) {
        throw new Error('Flow not published to WhatsApp yet')
      }

      const flowPayload = flow.flow_json

      const response = await fetch(
        `https://graph.facebook.com/v18.0/${flow.whatsapp_flow_id}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${whatsappToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(flowPayload),
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error?.message || 'Failed to update flow')
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Flow updated successfully'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    } else if (action === 'delete') {
      // Delete flow from WhatsApp
      if (!flow.whatsapp_flow_id) {
        throw new Error('Flow not published to WhatsApp yet')
      }

      const response = await fetch(
        `https://graph.facebook.com/v18.0/${flow.whatsapp_flow_id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${whatsappToken}`,
          },
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error?.message || 'Failed to delete flow')
      }

      // Update flow status in database
      await supabase
        .from('whatsapp_flows')
        .update({
          status: 'deleted',
          deleted_at: new Date().toISOString()
        })
        .eq('id', flow_id)

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Flow deleted successfully'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    } else if (action === 'get_responses') {
      // Get flow responses from database
      const { data: responses, error: responsesError } = await supabase
        .from('whatsapp_flow_responses')
        .select('*')
        .eq('flow_id', flow_id)
        .order('created_at', { ascending: false })

      if (responsesError) throw responsesError

      return new Response(
        JSON.stringify({
          success: true,
          responses: responses || []
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    throw new Error('Invalid action')
  } catch (error) {
    console.error('Error managing flow:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
