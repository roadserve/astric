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

    const payload = await req.json()
    console.log('Send message request:', JSON.stringify(payload, null, 2))

    const {
      phone_number,
      type,
      text,
      image,
      video,
      audio,
      document,
      location,
      contacts,
      interactive,
      template
    } = payload

    // Get WhatsApp credentials
    const whatsappToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN')
    const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')

    if (!whatsappToken || !phoneNumberId) {
      throw new Error('WhatsApp credentials not configured')
    }

    // Build WhatsApp API message payload
    const messagePayload: any = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: phone_number,
      type: type
    }

    // Add message content based on type
    switch (type) {
      case 'text':
        messagePayload.text = {
          preview_url: text.preview_url !== false,
          body: text.body
        }
        break

      case 'image':
        messagePayload.image = {
          link: image.link,
          caption: image.caption
        }
        break

      case 'video':
        messagePayload.video = {
          link: video.link,
          caption: video.caption
        }
        break

      case 'audio':
        messagePayload.audio = {
          link: audio.link
        }
        break

      case 'document':
        messagePayload.document = {
          link: document.link,
          caption: document.caption,
          filename: document.filename
        }
        break

      case 'location':
        messagePayload.location = {
          latitude: location.latitude,
          longitude: location.longitude,
          name: location.name,
          address: location.address
        }
        break

      case 'contacts':
        messagePayload.contacts = contacts
        break

      case 'interactive':
        messagePayload.interactive = interactive
        break

      case 'template':
        messagePayload.template = template
        break

      default:
        throw new Error(`Unsupported message type: ${type}`)
    }

    // Send message via WhatsApp Cloud API
    const whatsappResponse = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${whatsappToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messagePayload),
      }
    )

    const whatsappData = await whatsappResponse.json()
    console.log('WhatsApp API response:', whatsappData)

    if (!whatsappResponse.ok) {
      throw new Error(whatsappData.error?.message || 'Failed to send message')
    }

    // Find or create contact
    const { data: orgMember } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    let contact = await supabase
      .from('whatsapp_contacts')
      .select('*')
      .eq('phone_number', phone_number)
      .eq('organization_id', orgMember?.organization_id)
      .single()

    if (!contact.data) {
      const { data: newContact } = await supabase
        .from('whatsapp_contacts')
        .insert({
          organization_id: orgMember?.organization_id,
          phone_number: phone_number,
          name: phone_number,
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
          phone_number_id: phoneNumberId,
          status: 'open',
          last_message_at: new Date().toISOString(),
        })
        .select()
        .single()
      
      conversation = { data: newConversation }
    }

    // Save message to database
    let messageContent = ''
    let mediaUrl = null
    let mediaMimeType = null

    switch (type) {
      case 'text':
        messageContent = text.body
        break
      case 'image':
        messageContent = image.caption || ''
        mediaUrl = image.link
        mediaMimeType = 'image/jpeg'
        break
      case 'video':
        messageContent = video.caption || ''
        mediaUrl = video.link
        mediaMimeType = 'video/mp4'
        break
      case 'audio':
        mediaUrl = audio.link
        mediaMimeType = 'audio/mpeg'
        break
      case 'document':
        messageContent = document.caption || ''
        mediaUrl = document.link
        mediaMimeType = 'application/pdf'
        break
      case 'location':
        messageContent = JSON.stringify(location)
        break
      case 'contacts':
        messageContent = JSON.stringify(contacts)
        break
      case 'interactive':
        messageContent = interactive.body?.text || ''
        break
      case 'template':
        messageContent = `Template: ${template.name}`
        break
    }

    const { data: savedMessage, error: saveError } = await supabase
      .from('whatsapp_messages')
      .insert({
        conversation_id: conversation.data.id,
        type: type,
        content: messageContent,
        direction: 'outbound',
        status: 'sent',
        whatsapp_message_id: whatsappData.messages[0].id,
        media_url: mediaUrl,
        media_mime_type: mediaMimeType,
        sent_at: new Date().toISOString(),
        metadata: type === 'interactive' ? interactive : null
      })
      .select()
      .single()

    if (saveError) {
      console.error('Error saving message:', saveError)
    }

    // Log status
    if (savedMessage) {
      await supabase
        .from('whatsapp_message_status_log')
        .insert({
          message_id: savedMessage.id,
          status: 'sent',
          timestamp: new Date().toISOString()
        })
    }

    return new Response(
      JSON.stringify({
        success: true,
        message_id: whatsappData.messages[0].id,
        saved_message_id: savedMessage?.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error sending message:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})