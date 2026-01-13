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
      .select('id, phone_number_id, access_token')
      .eq('organization_id', orgMember.organization_id)
      .eq('status', 'active')
      .maybeSingle()
    
    if (accountError) {
      console.error('Error fetching WhatsApp account:', accountError)
      throw new Error('Failed to fetch WhatsApp credentials: ' + accountError.message)
    }

    // Fallback to environment variables if database doesn't have credentials
    let whatsappToken = whatsappAccount?.access_token || Deno.env.get('WHATSAPP_ACCESS_TOKEN')
    let phoneNumberId = whatsappAccount?.phone_number_id || Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')

    if (!whatsappToken || !phoneNumberId) {
      throw new Error('WhatsApp credentials not configured. Please add credentials in Settings.')
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

    // Get WhatsApp account ID first (needed for contact/conversation)
    const whatsappAccountId = whatsappAccount?.id || (await supabase
      .from('whatsapp_accounts')
      .select('id')
      .eq('organization_id', orgMember.organization_id)
      .eq('status', 'active')
      .maybeSingle()).data?.id

    if (!whatsappAccountId) {
      throw new Error('WhatsApp account not found. Please add credentials in Settings.')
    }

    // Prepare message content for database (before API call)
    let messageContent = ''
    let mediaUrl: string | null = null
    let mediaMimeType: string | null = null

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

    // Send message via WhatsApp Cloud API (do this first for faster response)
    const startTime = Date.now()
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
    const apiTime = Date.now() - startTime
    console.log('WhatsApp API response:', {
      success: whatsappResponse.ok,
      whatsappMessageId: whatsappData.messages?.[0]?.id,
      recipient: phone_number,
      apiTime: `${apiTime}ms`
    })

    if (!whatsappResponse.ok) {
      console.error('WhatsApp API error:', whatsappData)
      throw new Error(whatsappData.error?.message || whatsappData.error?.error_user_msg || 'Failed to send message')
    }

    // Get WhatsApp message ID immediately
    const whatsappMessageId = whatsappData.messages?.[0]?.id || null

    // Find or create contact and conversation in parallel (optimization)
    const [contactResult, conversationResult] = await Promise.all([
      // Find or create contact
      (async () => {
        const { data: existingContact } = await supabase
          .from('whatsapp_contacts')
          .select('*')
          .eq('phone_number', phone_number)
          .eq('organization_id', orgMember.organization_id)
          .maybeSingle()

        if (existingContact) {
          return existingContact.id
        }

        const { data: newContact, error: contactError } = await supabase
          .from('whatsapp_contacts')
          .insert({
            organization_id: orgMember.organization_id,
            phone_number: phone_number,
            name: phone_number,
          })
          .select()
          .single()
        
        if (contactError || !newContact) {
          console.error('Error creating contact:', contactError)
          throw new Error('Failed to create contact: ' + (contactError?.message || 'Unknown error'))
        }
        
        return newContact.id
      })(),
      // Find existing conversation (we'll create if needed after getting contact)
      supabase
        .from('whatsapp_conversations')
        .select('*')
        .eq('organization_id', orgMember.organization_id)
        .eq('status', 'active')
        .maybeSingle()
    ])

    const contactId = await contactResult
    
    // Now find or create conversation with contact ID
    const { data: existingConversation } = await supabase
      .from('whatsapp_conversations')
      .select('*')
      .eq('contact_id', contactId)
      .eq('organization_id', orgMember.organization_id)
      .eq('status', 'active')
      .maybeSingle()

    let conversationId: string
    if (existingConversation) {
      conversationId = existingConversation.id
    } else {
      const { data: newConversation, error: convError } = await supabase
        .from('whatsapp_conversations')
        .insert({
          organization_id: orgMember.organization_id,
          whatsapp_account_id: whatsappAccountId,
          contact_id: contactId,
          status: 'active',
          last_message_at: new Date().toISOString(),
        })
        .select()
        .single()
      
      if (convError || !newConversation) {
        console.error('Error creating conversation:', convError)
        throw new Error('Failed to create conversation: ' + (convError?.message || 'Unknown error'))
      }
      
      conversationId = newConversation.id
    }


    // Check if message already exists (frontend might have inserted it optimistically)
    // Look for recent message with same content in same conversation (within last 10 seconds)
    const tenSecondsAgo = new Date(Date.now() - 10000).toISOString()
    const { data: existingMessage } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('content', messageContent)
      .eq('direction', 'outbound')
      .eq('status', 'pending')
      .gte('created_at', tenSecondsAgo)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    let savedMessage = null

    if (existingMessage) {
      // Update existing message instead of creating duplicate
      console.log('Updating existing message instead of creating duplicate:', existingMessage.id)
      const { data: updatedMessage, error: updateError } = await supabase
        .from('whatsapp_messages')
        .update({
          message_id: whatsappMessageId,
          whatsapp_message_id: whatsappMessageId,
          status: 'sent',
          sent_at: new Date().toISOString(),
          media_url: mediaUrl || existingMessage.media_url,
          media_mime_type: mediaMimeType || existingMessage.media_mime_type,
          metadata: type === 'interactive' ? interactive : (type === 'template' ? template : existingMessage.metadata)
        })
        .eq('id', existingMessage.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating message:', updateError)
      } else {
        savedMessage = updatedMessage
      }
    } else {
      // Insert new message if doesn't exist
      const { data: insertedMessage, error: insertError } = await supabase
      .from('whatsapp_messages')
      .insert({
          organization_id: orgMember.organization_id,
          conversation_id: conversationId,
          whatsapp_account_id: whatsappAccountId,
          contact_id: contactId,
          message_id: whatsappMessageId,
          whatsapp_message_id: whatsappMessageId,
          direction: 'outbound',
        type: type,
        content: messageContent,
        media_url: mediaUrl,
        media_mime_type: mediaMimeType,
          status: 'sent',
        sent_at: new Date().toISOString(),
          metadata: type === 'interactive' ? interactive : (type === 'template' ? template : null)
      })
      .select()
      .single()

      if (insertError) {
        console.error('Error saving message:', insertError)
        // Don't throw error here, message was sent successfully
      } else {
        savedMessage = insertedMessage
      }
    }

    // Return response immediately (don't wait for status log)
    const messageData = savedMessage as any
    const responseData = {
      success: true,
      message_id: whatsappMessageId, // WhatsApp message ID for status tracking
      saved_message_id: messageData?.id, // Database message ID
      status: 'sent'
    }

    // Log status in background (don't wait)
    if (savedMessage) {
      const messageData = savedMessage as any
      supabase
        .from('whatsapp_message_status_log')
        .insert({
          message_id: messageData.id,
          status: 'sent',
          timestamp: new Date().toISOString()
        })
        .then(() => {
          console.log('Status logged successfully')
        })
        .catch((err) => {
          console.error('Error logging status:', err)
        })
    }

    const totalTime = Date.now() - startTime
    console.log(`✅ Message sent successfully in ${totalTime}ms`)

    return new Response(
      JSON.stringify(responseData),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error sending message:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: error instanceof Error ? error.stack : undefined
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})