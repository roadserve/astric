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

      console.log('Webhook verification request:', { mode, token: token?.substring(0, 10) + '...', challenge })

      if (mode !== 'subscribe') {
        console.error('Invalid mode:', mode)
        return new Response('Invalid mode', { status: 400 })
      }

      if (!token) {
        console.error('No verify token provided')
        return new Response('Verify token required', { status: 400 })
      }

      // PRIORITY: Get token from database first (per organization)
      // Fallback to environment variable only if database doesn't have it
      let verifyToken: string | null = null
      
      // Get token from database (any account with token, prioritize active)
      const { data: account, error: dbError } = await supabase
        .from('whatsapp_accounts')
        .select('webhook_verify_token, status')
        .not('webhook_verify_token', 'is', null)
        .order('status', { ascending: true }) // Active accounts first
        .limit(1)
        .maybeSingle()
      
      if (dbError) {
        console.error('Database error fetching token:', dbError)
      } else {
        console.log('Database query result:', { 
          found: !!account, 
          hasToken: !!account?.webhook_verify_token,
          tokenLength: account?.webhook_verify_token?.length 
        })
      }
      
      if (account?.webhook_verify_token) {
        verifyToken = account.webhook_verify_token.trim()
        console.log('Token found in database:', verifyToken.substring(0, 15) + '...', 'Length:', verifyToken.length)
      } else {
        // Fallback to environment variable
        const envToken = Deno.env.get('WEBHOOK_VERIFY_TOKEN')
        if (envToken) {
          verifyToken = envToken.trim()
          console.log('Token found in environment:', verifyToken.substring(0, 15) + '...', 'Length:', verifyToken.length)
        } else {
          console.log('No token found in database or environment')
        }
      }

      if (!verifyToken) {
        console.error('No verify token found in database or environment')
        return new Response('Verify token not configured', { status: 500 })
      }

      // Compare tokens (trim whitespace and case-insensitive comparison)
      const receivedToken = token.trim()
      const expectedToken = verifyToken.trim()
      const tokenMatch = receivedToken === expectedToken
      
      if (tokenMatch) {
        console.log('Webhook verified successfully!')
        return new Response(challenge, {
          status: 200,
          headers: { 'Content-Type': 'text/plain' }
        })
      }

      console.error('Webhook verification failed:', { 
        mode, 
        tokenMatch: false,
        expectedTokenLength: expectedToken?.length,
        receivedTokenLength: receivedToken?.length,
        expectedToken: expectedToken,
        receivedToken: receivedToken
      })
      return new Response('Forbidden - Token mismatch', { status: 403 })
    }

    // Handle POST request for webhook events
    if (req.method === 'POST') {
      const payload = await req.json()
      
      console.log('🔔 ========== WEBHOOK RECEIVED ==========')
      console.log('📦 Payload object:', payload.object)
      console.log('📦 Full payload:', JSON.stringify(payload, null, 2))
      console.log('🔔 ======================================')

      // Determine webhook source
      const isWhatsApp = payload.object === 'whatsapp_business_account'
      const isInstagram = payload.object === 'instagram'
      const isFacebook = payload.object === 'page'

      console.log('🔍 Webhook type detection:', {
        isWhatsApp,
        isInstagram,
        isFacebook,
        object: payload.object
      })

      // Process WhatsApp webhooks
      if (isWhatsApp) {
        console.log('✅ Processing WhatsApp webhook...')
        await processWhatsAppWebhook(payload, supabase)
      } else if (isInstagram) {
        console.log('✅ Processing Instagram webhook...')
        await processInstagramWebhook(payload, supabase)
      } else if (isFacebook) {
        console.log('✅ Processing Facebook webhook...')
        await processFacebookWebhook(payload, supabase)
      } else {
        console.log('⚠️ Unknown webhook type:', payload.object)
        console.log('📋 Payload structure:', {
          hasEntry: !!payload.entry,
          entryCount: payload.entry?.length || 0,
          firstEntry: payload.entry?.[0] || null
        })
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
    console.log('📨 Processing WhatsApp webhook...')
    console.log('📊 Entry count:', payload.entry?.length || 0)
    
    if (!payload.entry || payload.entry.length === 0) {
      console.log('⚠️ No entries in webhook payload')
      return
    }

    for (const entry of payload.entry || []) {
      console.log('📝 Processing entry:', {
        id: entry.id,
        changesCount: entry.changes?.length || 0
      })
      
      for (const change of entry.changes || []) {
        const value = change.value
        const field = change.field

        console.log('🔍 Processing webhook field:', field)
        console.log('📋 Change value keys:', Object.keys(value || {}))
        console.log('📋 Full value object:', JSON.stringify(value, null, 2))

        // Handle incoming messages
        if (value.messages && Array.isArray(value.messages)) {
          console.log(`📨 Found ${value.messages.length} message(s) in webhook`)
          for (const message of value.messages) {
            await handleIncomingMessage(message, value.metadata, supabase)
          }
        }

        // Handle message status updates
        // Status updates come in the same webhook as messages, in the statuses array
        if (value.statuses && Array.isArray(value.statuses)) {
          console.log(`📊 ✅ FOUND ${value.statuses.length} STATUS UPDATE(S) IN WEBHOOK!`)
          for (const status of value.statuses) {
            console.log('📊 Status update details:', JSON.stringify(status, null, 2))
            await handleMessageStatus(status, supabase)
          }
        } else {
          console.log('⚠️ No statuses array found in webhook payload')
          console.log('📋 Available keys in value:', Object.keys(value || {}))
          
          // Check if statuses might be nested elsewhere
          if (value.messaging_product) {
            console.log('📋 Messaging product:', value.messaging_product)
          }
          if (value.metadata) {
            console.log('📋 Metadata:', JSON.stringify(value.metadata, null, 2))
          }
        }
        
        // Also check for status in the value object directly (some webhook formats)
        if (value.status && !value.statuses) {
          console.log('📊 Processing single status update from value object')
          await handleMessageStatus(value.status, supabase)
        }

        // Handle different webhook fields based on change.field
        switch (field) {
          case 'messages':
            // Already handled above
            break

          case 'message_status':
            // Already handled above via statuses
            break

          case 'account_update':
            await handleAccountUpdate(value, supabase)
            break

          case 'account_alerts':
            await handleAccountAlerts(value, supabase)
            break

          case 'account_review_update':
            await handleAccountReviewUpdate(value, supabase)
            break

          case 'account_settings_update':
            await handleAccountSettingsUpdate(value, supabase)
            break

          case 'automatic_events':
            await handleAutomaticEvents(value, supabase)
            break

          case 'business_capability_update':
            await handleBusinessCapabilityUpdate(value, supabase)
            break

          case 'business_status_update':
            await handleBusinessStatusUpdate(value, supabase)
            break

          case 'calls':
            await handleCalls(value, supabase)
            break

          case 'flows':
            await handleFlows(value, supabase)
            break

          case 'group_lifecycle_update':
            await handleGroupLifecycleUpdate(value, supabase)
            break

          case 'group_participants_update':
            await handleGroupParticipantsUpdate(value, supabase)
            break

          case 'group_settings_update':
            await handleGroupSettingsUpdate(value, supabase)
            break

          case 'group_status_update':
            await handleGroupStatusUpdate(value, supabase)
            break

          case 'history':
            await handleHistory(value, supabase)
            break

          case 'message_template_status_update':
          await handleTemplateStatusUpdate(value, supabase)
            break

          case 'message_template_components_update':
            await handleTemplateComponentsUpdate(value, supabase)
            break

          case 'message_template_quality_update':
            await handleTemplateQualityUpdate(value, supabase)
            break

          case 'partner_solutions':
            await handlePartnerSolutions(value, supabase)
            break

          case 'payment_configuration_update':
            await handlePaymentConfigurationUpdate(value, supabase)
            break

          case 'phone_number_name_update':
            await handlePhoneNumberNameUpdate(value, supabase)
            break

          case 'phone_number_quality_update':
            await handlePhoneNumberQualityUpdate(value, supabase)
            break

          case 'security':
            await handleSecurity(value, supabase)
            break

          case 'smb_app_state_sync':
            await handleSmbAppStateSync(value, supabase)
            break

          case 'smb_message_echoes':
            await handleSmbMessageEchoes(value, supabase)
            break

          case 'template_category_update':
            await handleTemplateCategoryUpdate(value, supabase)
            break

          case 'template_correct_category_detection':
            await handleTemplateCorrectCategoryDetection(value, supabase)
            break

          case 'tracking_events':
            await handleTrackingEvents(value, supabase)
            break

          case 'user_preferences':
            await handleUserPreferences(value, supabase)
            break

          default:
            console.log('Unhandled webhook field:', field, value)
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
    const phoneNumberId = metadata.phone_number_id

    console.log('Handling incoming message:', { phoneNumber, messageId, phoneNumberId })

    // Get WhatsApp account from phone_number_id
    // Try exact match first, then try any active account (for test webhooks)
    let whatsappAccount = null
    let accountError = null

    // First try: Exact phone_number_id match
    const { data: exactMatch, error: exactError } = await supabase
      .from('whatsapp_accounts')
      .select('id, organization_id, phone_number_id')
      .eq('phone_number_id', phoneNumberId)
      .eq('status', 'active')
      .maybeSingle()

    if (exactMatch) {
      whatsappAccount = exactMatch
      console.log('Found WhatsApp account by exact phone_number_id match:', phoneNumberId)
    } else if (exactError) {
      accountError = exactError
      console.error('Error fetching WhatsApp account:', exactError)
    } else {
      // Second try: Any active account (for test webhooks with different phone_number_id)
      console.log('No exact match for phone_number_id:', phoneNumberId, '- Trying any active account')
      const { data: anyActive, error: anyError } = await supabase
        .from('whatsapp_accounts')
        .select('id, organization_id, phone_number_id')
        .eq('status', 'active')
        .limit(1)
        .maybeSingle()

      if (anyActive) {
        whatsappAccount = anyActive
        console.log('Using any active WhatsApp account for test webhook:', anyActive.phone_number_id)
      } else if (anyError) {
        accountError = anyError
        console.error('Error fetching any active WhatsApp account:', anyError)
      }
    }

    if (accountError) {
      console.error('Error fetching WhatsApp account:', accountError)
      throw accountError
    }

    if (!whatsappAccount) {
      console.error('WhatsApp account not found for phone_number_id:', phoneNumberId)
      console.error('No active WhatsApp accounts found in database')
      throw new Error('WhatsApp account not found')
    }

    const organizationId = whatsappAccount.organization_id
    const whatsappAccountId = whatsappAccount.id

    console.log('Found WhatsApp account:', { organizationId, whatsappAccountId })

    // Find or create contact (with organization_id)
    const { data: existingContact } = await supabase
      .from('whatsapp_contacts')
      .select('*')
      .eq('phone_number', phoneNumber)
      .eq('organization_id', organizationId)
      .maybeSingle()

    let contactId: string
    if (existingContact) {
      contactId = existingContact.id
    } else {
      const { data: newContact, error: contactError } = await supabase
        .from('whatsapp_contacts')
        .insert({
          organization_id: organizationId,
          whatsapp_account_id: whatsappAccountId,
          phone_number: phoneNumber,
          name: message.profile?.name || phoneNumber,
        })
        .select()
        .single()
      
      if (contactError || !newContact) {
        console.error('Error creating contact:', contactError)
        throw new Error('Failed to create contact: ' + (contactError?.message || 'Unknown error'))
      }

      contactId = newContact.id
    }

    // Find or create conversation
    const { data: existingConversation } = await supabase
      .from('whatsapp_conversations')
      .select('*')
      .eq('contact_id', contactId)
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .maybeSingle()

    let conversationId: string
    if (existingConversation) {
      conversationId = existingConversation.id
      // Update conversation
      await supabase
        .from('whatsapp_conversations')
        .update({
          last_message_at: timestamp,
          unread_count: (existingConversation.unread_count || 0) + 1,
        })
        .eq('id', conversationId)
    } else {
      const { data: newConversation, error: convError } = await supabase
        .from('whatsapp_conversations')
        .insert({
          organization_id: organizationId,
          whatsapp_account_id: whatsappAccountId,
          contact_id: contactId,
          status: 'active',
          last_message_at: timestamp,
        })
        .select()
        .single()
      
      if (convError || !newConversation) {
        console.error('Error creating conversation:', convError)
        throw new Error('Failed to create conversation: ' + (convError?.message || 'Unknown error'))
      }

      conversationId = newConversation.id
    }

    // Extract message content based on type
    let messageContent: any = {
      type: message.type,
      direction: 'inbound',
      status: 'pending', // Use 'pending' instead of 'received' (database constraint)
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
    console.log('Saving message to database:', {
      organizationId,
      conversationId,
      whatsappAccountId,
      contactId,
      messageId,
      phoneNumber,
      content: messageContent.content,
      type: messageContent.type
    })

    const { data: savedMessage, error: saveError } = await supabase
      .from('whatsapp_messages')
      .insert({
        organization_id: organizationId,
        conversation_id: conversationId,
        whatsapp_account_id: whatsappAccountId,
        contact_id: contactId,
        message_id: messageId,
        whatsapp_message_id: messageId,
        ...messageContent,
        status: 'pending', // Inbound messages use 'pending' status
        sent_at: timestamp.toISOString(),
      })
      .select()
      .single()

    if (saveError) {
      console.error('❌ Error saving message:', saveError)
      console.error('Error details:', JSON.stringify(saveError, null, 2))
      throw saveError
    }

    console.log(`✅ Saved incoming message ${messageId} from ${phoneNumber}`, { 
      savedMessageId: savedMessage?.id,
      conversationId: savedMessage?.conversation_id,
      organizationId: savedMessage?.organization_id
    })
  } catch (error) {
    console.error('Error handling incoming message:', error)
  }
}

async function handleMessageStatus(status: any, supabase: any) {
  try {
    const whatsappMessageId = status.id // WhatsApp's message ID (e.g., "wamid.xxx")
    const recipientId = status.recipient_id // Phone number
    const newStatus = status.status // sent, delivered, read, failed
    const timestamp = status.timestamp ? new Date(parseInt(status.timestamp) * 1000) : new Date()

    console.log('📨 Handling message status update:', { 
      whatsappMessageId, 
      recipientId, 
      newStatus, 
      timestamp: timestamp.toISOString(),
      fullStatus: JSON.stringify(status, null, 2)
    })

    if (!whatsappMessageId) {
      console.error('❌ No WhatsApp message ID in status update')
      return
    }

    // Find message by WhatsApp message ID (check both fields)
    // Try message_id first, then whatsapp_message_id
    let message = null
    let findError = null

    // First try: message_id field
    const { data: msg1, error: err1 } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .eq('message_id', whatsappMessageId)
      .maybeSingle()

    if (msg1) {
      message = msg1
      console.log('✅ Found message by message_id field')
    } else if (err1) {
      findError = err1
    }

    // Second try: whatsapp_message_id field
    if (!message) {
      const { data: msg2, error: err2 } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('whatsapp_message_id', whatsappMessageId)
        .maybeSingle()

      if (msg2) {
        message = msg2
        console.log('✅ Found message by whatsapp_message_id field')
      } else if (err2 && !findError) {
        findError = err2
      }
    }

    // Third try: Search by recipient phone number and recent timestamp (fallback)
    if (!message && recipientId) {
      const { data: recentMessages } = await supabase
        .from('whatsapp_messages')
        .select('*, contact:whatsapp_contacts(phone_number)')
        .eq('direction', 'outbound')
        .order('created_at', { ascending: false })
        .limit(10)

      if (recentMessages) {
        // Find message where contact phone matches recipient
        for (const msg of recentMessages) {
          if (msg.contact && msg.contact.phone_number === recipientId) {
            // Check if this could be the message (within last 5 minutes)
            const msgTime = new Date(msg.created_at)
            const timeDiff = Math.abs(timestamp.getTime() - msgTime.getTime())
            if (timeDiff < 5 * 60 * 1000) { // 5 minutes
              message = msg
              console.log('✅ Found message by recipient and timestamp match')
              break
            }
          }
        }
      }
    }

    if (findError) {
      console.error('❌ Error finding message:', findError)
      return
    }

    if (!message) {
      console.log(`⚠️ Message not found for WhatsApp ID: ${whatsappMessageId}, recipient: ${recipientId}`)
      // Log recent messages for debugging
      const { data: recent } = await supabase
        .from('whatsapp_messages')
        .select('id, message_id, whatsapp_message_id, created_at, direction')
        .order('created_at', { ascending: false })
        .limit(5)
      console.log('Recent messages:', recent)
      return
    }

    const messageData = message as any // Type assertion for database row

    console.log('Found message to update:', { 
      messageId: messageData.id, 
      currentStatus: messageData.status,
      newStatus 
    })

    // Prepare update data
    const updateData: any = {
      status: newStatus
    }

    // Set timestamps based on status
    if (newStatus === 'delivered' && !messageData.delivered_at) {
      updateData.delivered_at = timestamp.toISOString()
    }
    if (newStatus === 'read' && !messageData.read_at) {
      updateData.read_at = timestamp.toISOString()
    }
    if (newStatus === 'failed') {
      updateData.failed_at = timestamp.toISOString()
      updateData.error_code = status.errors?.[0]?.code
      updateData.error_message = status.errors?.[0]?.title || status.errors?.[0]?.message
    }

    // Update message status
    const { error: updateError } = await supabase
      .from('whatsapp_messages')
      .update(updateData)
      .eq('id', messageData.id)

    if (updateError) {
      console.error('Error updating message status:', updateError)
      return
    }

      // Log status change
    try {
      await supabase
        .from('whatsapp_message_status_log')
        .insert({
          message_id: messageData.id,
          status: newStatus,
          timestamp: timestamp.toISOString(),
          error_code: status.errors?.[0]?.code,
          error_message: status.errors?.[0]?.title || status.errors?.[0]?.message,
        })
    } catch (logError) {
      console.error('Error logging status:', logError)
      // Don't fail if logging fails
    }

    console.log(`✅ Updated message ${whatsappMessageId} (DB ID: ${messageData.id}) status to ${newStatus}`)
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

// Handler functions for all webhook fields
async function handleAccountAlerts(value: any, supabase: any) {
  console.log('Account alerts:', JSON.stringify(value, null, 2))
  // Log account alerts to database if needed
}

async function handleAccountReviewUpdate(value: any, supabase: any) {
  console.log('Account review update:', JSON.stringify(value, null, 2))
  // Handle account review updates
}

async function handleAccountSettingsUpdate(value: any, supabase: any) {
  console.log('Account settings update:', JSON.stringify(value, null, 2))
  // Handle account settings updates
}

async function handleAutomaticEvents(value: any, supabase: any) {
  console.log('Automatic events:', JSON.stringify(value, null, 2))
  // Handle automatic events
}

async function handleBusinessCapabilityUpdate(value: any, supabase: any) {
  console.log('Business capability update:', JSON.stringify(value, null, 2))
  // Handle business capability updates
}

async function handleBusinessStatusUpdate(value: any, supabase: any) {
  console.log('Business status update:', JSON.stringify(value, null, 2))
  // Handle business status updates
}

async function handleCalls(value: any, supabase: any) {
  console.log('Calls:', JSON.stringify(value, null, 2))
  // Handle call events
}

async function handleFlows(value: any, supabase: any) {
  console.log('Flows:', JSON.stringify(value, null, 2))
  // Handle WhatsApp Flows events
}

async function handleGroupLifecycleUpdate(value: any, supabase: any) {
  console.log('Group lifecycle update:', JSON.stringify(value, null, 2))
  // Handle group lifecycle updates
}

async function handleGroupParticipantsUpdate(value: any, supabase: any) {
  console.log('Group participants update:', JSON.stringify(value, null, 2))
  // Handle group participants updates
}

async function handleGroupSettingsUpdate(value: any, supabase: any) {
  console.log('Group settings update:', JSON.stringify(value, null, 2))
  // Handle group settings updates
}

async function handleGroupStatusUpdate(value: any, supabase: any) {
  console.log('Group status update:', JSON.stringify(value, null, 2))
  // Handle group status updates
}

async function handleHistory(value: any, supabase: any) {
  console.log('History:', JSON.stringify(value, null, 2))
  // Handle history events
}

async function handleTemplateComponentsUpdate(value: any, supabase: any) {
  console.log('Template components update:', JSON.stringify(value, null, 2))
  // Handle template components updates
}

async function handleTemplateQualityUpdate(value: any, supabase: any) {
  console.log('Template quality update:', JSON.stringify(value, null, 2))
  // Handle template quality updates
}

async function handlePartnerSolutions(value: any, supabase: any) {
  console.log('Partner solutions:', JSON.stringify(value, null, 2))
  // Handle partner solutions events
}

async function handlePaymentConfigurationUpdate(value: any, supabase: any) {
  console.log('Payment configuration update:', JSON.stringify(value, null, 2))
  // Handle payment configuration updates
}

async function handlePhoneNumberNameUpdate(value: any, supabase: any) {
  console.log('Phone number name update:', JSON.stringify(value, null, 2))
  // Update phone number display name in database
  try {
    if (value.display_phone_number && value.verified_name) {
      await supabase
        .from('whatsapp_accounts')
        .update({ display_name: value.verified_name })
        .eq('phone_number', value.display_phone_number)
    }
  } catch (error) {
    console.error('Error updating phone number name:', error)
  }
}

async function handlePhoneNumberQualityUpdate(value: any, supabase: any) {
  console.log('Phone number quality update:', JSON.stringify(value, null, 2))
  // Update phone number quality rating in database
  try {
    if (value.display_phone_number && value.quality_rating) {
      await supabase
        .from('whatsapp_accounts')
        .update({ quality_rating: value.quality_rating })
        .eq('phone_number', value.display_phone_number)
    }
  } catch (error) {
    console.error('Error updating phone number quality:', error)
  }
}

async function handleSecurity(value: any, supabase: any) {
  console.log('Security event:', JSON.stringify(value, null, 2))
  // Handle security events
}

async function handleSmbAppStateSync(value: any, supabase: any) {
  console.log('SMB app state sync:', JSON.stringify(value, null, 2))
  // Handle SMB app state sync
}

async function handleSmbMessageEchoes(value: any, supabase: any) {
  console.log('SMB message echoes:', JSON.stringify(value, null, 2))
  // Handle SMB message echoes
}

async function handleTemplateCategoryUpdate(value: any, supabase: any) {
  console.log('Template category update:', JSON.stringify(value, null, 2))
  // Handle template category updates
}

async function handleTemplateCorrectCategoryDetection(value: any, supabase: any) {
  console.log('Template correct category detection:', JSON.stringify(value, null, 2))
  // Handle template category detection
}

async function handleTrackingEvents(value: any, supabase: any) {
  console.log('Tracking events:', JSON.stringify(value, null, 2))
  // Handle tracking events
}

async function handleUserPreferences(value: any, supabase: any) {
  console.log('User preferences:', JSON.stringify(value, null, 2))
  // Handle user preferences updates
}