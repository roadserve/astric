import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Handle GET request for webhook verification (WhatsApp & Instagram)
    if (req.method === 'GET') {
      const url = new URL(req.url)
      const mode = url.searchParams.get('hub.mode')
      const token = url.searchParams.get('hub.verify_token')
      const challenge = url.searchParams.get('hub.challenge')

      const verifyToken = Deno.env.get('WEBHOOK_VERIFY_TOKEN') || 'your_verify_token_here'

      if (mode === 'subscribe' && token === verifyToken) {
        console.log('Webhook verified successfully')
        return new Response(challenge, {
          status: 200,
          headers: { 'Content-Type': 'text/plain' }
        })
      }

      return new Response('Forbidden', { status: 403 })
    }

    // Handle POST request for webhook events
    if (req.method === 'POST') {
      const payload = await req.json()
      console.log('Webhook received:', JSON.stringify(payload, null, 2))

      // Determine webhook source
      const isWhatsApp = payload.object === 'whatsapp_business_account'
      const isInstagram = payload.object === 'instagram'
      const isFacebook = payload.object === 'page'

      // Process WhatsApp webhooks
      if (isWhatsApp) {
        await processWhatsAppWebhook(payload, supabase)
      }

      // Process Instagram webhooks
      if (isInstagram) {
        await processInstagramWebhook(payload, supabase)
      }

      // Process Facebook webhooks
      if (isFacebook) {
        await processFacebookWebhook(payload, supabase)
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    return new Response('Method not allowed', { status: 405 })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})

async function processWhatsAppWebhook(payload: any, supabase: any) {
  try {
    for (const entry of payload.entry || []) {
      for (const change of entry.changes || []) {
        const value = change.value

        // Handle incoming messages
        if (value.messages) {
          for (const message of value.messages) {
            await handleIncomingMessage(message, value.metadata, supabase)
          }
        }

        // Handle message status updates
        if (value.statuses) {
          for (const status of value.statuses) {
            await handleMessageStatus(status, supabase)
          }
        }

        // Handle account updates
        if (change.field === 'account_update') {
          await handleAccountUpdate(value, supabase)
        }

        // Handle template status updates
        if (change.field === 'message_template_status_update') {
          await handleTemplateStatusUpdate(value, supabase)
        }
      }
    }
  } catch (error) {
    console.error('Error processing WhatsApp webhook:', error)
  }
}

async function handleIncomingMessage(message: any, metadata: any, supabase: any) {
  try {
    const phoneNumber = message.from
    const messageId = message.id
    const timestamp = new Date(parseInt(message.timestamp) * 1000)

    // Find or create contact
    let contact = await supabase
      .from('whatsapp_contacts')
      .select('*')
      .eq('phone_number', phoneNumber)
      .single()

    if (!contact.data) {
      const { data: newContact } = await supabase
        .from('whatsapp_contacts')
        .insert({
          phone_number: phoneNumber,
          name: message.profile?.name || phoneNumber,
        })
        .select()
        .single()
      
      contact = { data: newContact }
    }

    // Find or create conversation
    let conversation = await supabase
      .from('whatsapp_conversations')
      .select('*')
      .eq('contact_id', contact.data.id)
      .eq('status', 'open')
      .single()

    if (!conversation.data) {
      const { data: newConversation } = await supabase
        .from('whatsapp_conversations')
        .insert({
          contact_id: contact.data.id,
          phone_number_id: metadata.phone_number_id,
          status: 'open',
          last_message_at: timestamp,
        })
        .select()
        .single()
      
      conversation = { data: newConversation }
    } else {
      // Update conversation
      await supabase
        .from('whatsapp_conversations')
        .update({
          last_message_at: timestamp,
          unread_count: (conversation.data.unread_count || 0) + 1,
        })
        .eq('id', conversation.data.id)
    }

    // Extract message content based on type
    let messageContent: any = {
      type: message.type,
      direction: 'inbound',
      status: 'received',
      whatsapp_message_id: messageId,
    }

    switch (message.type) {
      case 'text':
        messageContent.content = message.text.body
        break
      case 'image':
      case 'video':
      case 'audio':
      case 'document':
        messageContent.media_url = message[message.type].id // Media ID from WhatsApp
        messageContent.media_mime_type = message[message.type].mime_type
        messageContent.content = message[message.type].caption || ''
        break
      case 'location':
        messageContent.content = JSON.stringify({
          latitude: message.location.latitude,
          longitude: message.location.longitude,
          name: message.location.name,
          address: message.location.address,
        })
        break
      case 'contacts':
        messageContent.content = JSON.stringify(message.contacts)
        break
      case 'interactive':
        if (message.interactive.type === 'button_reply') {
          messageContent.content = message.interactive.button_reply.title
          messageContent.metadata = { button_id: message.interactive.button_reply.id }
        } else if (message.interactive.type === 'list_reply') {
          messageContent.content = message.interactive.list_reply.title
          messageContent.metadata = { 
            list_id: message.interactive.list_reply.id,
            description: message.interactive.list_reply.description 
          }
        }
        break
      case 'button':
        messageContent.content = message.button.text
        messageContent.metadata = { button_payload: message.button.payload }
        break
    }

    // Save message to database
    await supabase
      .from('whatsapp_messages')
      .insert({
        conversation_id: conversation.data.id,
        ...messageContent,
        sent_at: timestamp,
      })

    console.log(`Saved incoming message ${messageId} from ${phoneNumber}`)
  } catch (error) {
    console.error('Error handling incoming message:', error)
  }
}

async function handleMessageStatus(status: any, supabase: any) {
  try {
    const messageId = status.id
    const newStatus = status.status // sent, delivered, read, failed
    const timestamp = new Date(parseInt(status.timestamp) * 1000)

    // Update message status
    const { data: message } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .eq('whatsapp_message_id', messageId)
      .single()

    if (message) {
      await supabase
        .from('whatsapp_messages')
        .update({
          status: newStatus,
          delivered_at: newStatus === 'delivered' ? timestamp : message.delivered_at,
          read_at: newStatus === 'read' ? timestamp : message.read_at,
        })
        .eq('id', message.id)

      // Log status change
      await supabase
        .from('whatsapp_message_status_log')
        .insert({
          message_id: message.id,
          status: newStatus,
          timestamp: timestamp,
          error_code: status.errors?.[0]?.code,
          error_message: status.errors?.[0]?.title,
        })

      console.log(`Updated message ${messageId} status to ${newStatus}`)
    }
  } catch (error) {
    console.error('Error handling message status:', error)
  }
}

async function handleAccountUpdate(value: any, supabase: any) {
  try {
    console.log('Account update received:', value)
    
    // Handle phone number changes, display name updates, etc.
    if (value.phone_number) {
      await supabase
        .from('whatsapp_business_profiles')
        .update({
          display_name: value.display_name,
          quality_rating: value.quality_rating,
          messaging_limit_tier: value.messaging_limit_tier,
        })
        .eq('phone_number_id', value.phone_number_id)
    }
  } catch (error) {
    console.error('Error handling account update:', error)
  }
}

async function handleTemplateStatusUpdate(value: any, supabase: any) {
  try {
    const templateName = value.message_template_name
    const event = value.event // APPROVED, REJECTED, PAUSED, DISABLED
    const reason = value.reason

    console.log(`Template ${templateName} status: ${event}`)

    // Update template status in database
    const statusMap: any = {
      APPROVED: 'approved',
      REJECTED: 'rejected',
      PAUSED: 'paused',
      DISABLED: 'disabled',
      PENDING: 'pending',
    }

    await supabase
      .from('whatsapp_templates')
      .update({
        status: statusMap[event] || 'pending',
        rejection_reason: event === 'REJECTED' ? reason : null,
        quality_score: value.quality_score,
      })
      .eq('name', templateName)

    console.log(`Updated template ${templateName} to ${statusMap[event]}`)
  } catch (error) {
    console.error('Error handling template status update:', error)
  }
}

async function processInstagramWebhook(payload: any, supabase: any) {
  try {
    console.log('Instagram webhook:', JSON.stringify(payload, null, 2))
    
    for (const entry of payload.entry || []) {
      // Handle Instagram messages
      if (entry.messaging) {
        for (const event of entry.messaging) {
          console.log('Instagram message event:', event)
          // Process Instagram direct messages
        }
      }

      // Handle Instagram comments
      if (entry.changes) {
        for (const change of entry.changes) {
          if (change.field === 'comments') {
            console.log('Instagram comment:', change.value)
            // Process Instagram comments
          }
        }
      }
    }
  } catch (error) {
    console.error('Error processing Instagram webhook:', error)
  }
}

async function processFacebookWebhook(payload: any, supabase: any) {
  try {
    console.log('Facebook webhook:', JSON.stringify(payload, null, 2))
    
    for (const entry of payload.entry || []) {
      // Handle Facebook messages
      if (entry.messaging) {
        for (const event of entry.messaging) {
          console.log('Facebook message event:', event)
          // Process Facebook Messenger messages
        }
      }

      // Handle Facebook feed changes
      if (entry.changes) {
        for (const change of entry.changes) {
          console.log('Facebook change:', change)
          // Process Facebook page changes
        }
      }
    }
  } catch (error) {
    console.error('Error processing Facebook webhook:', error)
  }
}