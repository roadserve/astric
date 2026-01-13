import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Message {
  role: 'user' | 'assistant'
  content: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { message, context = 'general', messages = [] } = await req.json()

    if (!message && messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get Google AI API key from environment
    const GOOGLE_AI_KEY = Deno.env.get('GOOGLE_AI_API_KEY')
    
    if (!GOOGLE_AI_KEY) {
      return new Response(
        JSON.stringify({ error: 'Google AI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Fetch relevant data if MY FNG context - CONVERSATIONAL FLOW
    let contextData = ''
    let conversationStep = 'initial' // initial, got_pincode, got_car
    
    if (context === 'my_fng_support') {
      const messageLower = message.toLowerCase()
      const messageText = message.trim()
      
      // Detect pincode (6 digits)
      const pincodeMatch = messageText.match(/\b\d{6}\b/)
      const hasPincode = pincodeMatch !== null
      
      // Detect car model mentions
      const carMakes = ['maruti', 'suzuki', 'hyundai', 'honda', 'tata', 'mahindra', 'kia', 'toyota', 
                        'volkswagen', 'skoda', 'renault', 'nissan', 'ford', 'chevrolet', 'mg', 'jeep']
      const hasCarMention = carMakes.some(make => messageLower.includes(make))
      
      // Check conversation history to determine step
      const conversationHistory = messages || []
      const lastMessages = conversationHistory.slice(-4) // Last 4 messages
      
      let userGavePincode = false
      let userGaveCar = false
      let extractedPincode = ''
      let extractedZone = ''
      
      // Check if user previously gave pincode
      for (const msg of lastMessages) {
        if (msg.role === 'user') {
          const prevPincodeMatch = msg.content.match(/\b\d{6}\b/)
          if (prevPincodeMatch) {
            userGavePincode = true
            extractedPincode = prevPincodeMatch[0]
          }
          const prevCarMention = carMakes.some(make => msg.content.toLowerCase().includes(make))
          if (prevCarMention) {
            userGaveCar = true
          }
        }
      }
      
      // Current message has pincode
      if (hasPincode) {
        userGavePincode = true
        extractedPincode = pincodeMatch[0]
        conversationStep = 'got_pincode'
      }
      
      // Current message has car mention
      if (hasCarMention) {
        userGaveCar = true
        conversationStep = userGavePincode ? 'got_car' : 'got_car_first'
      }
      
      // STEP 1: User gave pincode - Show workshops and ask for car
      if (userGavePincode && !userGaveCar && extractedPincode) {
        // Find workshops for this pincode
        const { data: workshops } = await supabaseClient
          .from('workshop')
          .select('*')
          .eq('status', 1)
          .ilike('pincode', `%${extractedPincode}%`)
          .limit(5)
        
        if (workshops && workshops.length > 0) {
          contextData += '\n\n=== WORKSHOPS NEAR YOUR PINCODE ===\n'
          workshops.forEach((w: any) => {
            contextData += `\n📍 ${w.workshop_name}\n`
            contextData += `Address: ${w.address}\n`
            contextData += `Zone: ${w.zone}\n`
            contextData += '---\n'
            if (!extractedZone && w.zone) {
              extractedZone = w.zone
            }
          })
          contextData += '\n[INSTRUCTION: After showing workshops, ASK the user which car they have. Example: "Aapke paas kaun si car hai? (Example: Maruti Swift, Hyundai i20, Honda City, etc.)"]\n'
        } else {
          contextData += '\n[INSTRUCTION: Pincode provided but no workshop found. Politely inform and ask to try nearby pincode or call support.]\n'
        }
      }
      
      // STEP 2: User gave both pincode and car - Show pricing
      else if (userGavePincode && userGaveCar && extractedPincode) {
        // Find zone for pincode
        const { data: workshopForZone } = await supabaseClient
          .from('workshop')
          .select('zone')
          .eq('status', 1)
          .ilike('pincode', `%${extractedPincode}%`)
          .limit(1)
          .single()
        
        if (workshopForZone) {
          extractedZone = workshopForZone.zone
        }
        
        // Extract car make from message
        let detectedMake = ''
        for (const make of carMakes) {
          if (messageLower.includes(make)) {
            detectedMake = make
            break
          }
        }
        
        // Query pricing for this zone and car
        let pricingQuery = supabaseClient
          .from('pricing')
          .select('*')
        
        if (extractedZone) {
          pricingQuery = pricingQuery.eq('zone', extractedZone)
        }
        
        if (detectedMake) {
          pricingQuery = pricingQuery.ilike('make', `%${detectedMake}%`)
        }
        
        const { data: pricing } = await pricingQuery.limit(10)
        
        if (pricing && pricing.length > 0) {
          contextData += '\n\n=== SERVICE PRICING FOR YOUR CAR ===\n'
          contextData += `Zone: ${extractedZone || 'Your area'}\n`
          contextData += `Pincode: ${extractedPincode}\n\n`
          
          // Group by service name
          const grouped: any = {}
          pricing.forEach((p: any) => {
            const serviceName = p.service_name || 'Service'
            if (!grouped[serviceName]) {
              grouped[serviceName] = []
            }
            grouped[serviceName].push(p)
          })
          
          Object.keys(grouped).forEach(serviceName => {
            contextData += `\n🔧 ${serviceName}:\n`
            grouped[serviceName].forEach((p: any) => {
              if (p.make && p.model_name) {
                contextData += `  • ${p.make} ${p.model_name}`
              } else if (p.vehicle_class) {
                contextData += `  • ${p.vehicle_class}`
              }
              if (p.price) contextData += ` - ₹${p.price}`
              contextData += '\n'
            })
          })
          contextData += '\n---\n[INSTRUCTION: After showing pricing, ask if they want to book a service or have any questions.]\n'
        } else {
          contextData += '\n[INSTRUCTION: No pricing data found. Mention that service expert will provide exact quote on callback. Ask if they want to book.]\n'
        }
      }
      
      // STEP 0: Initial conversation - Ask for pincode
      else {
        // Check if it's a general FAQ question
        const { data: faqs } = await supabaseClient
          .from('faq')
          .select('*')
          .eq('status', 1)
          .limit(15)
        
        if (faqs && faqs.length > 0) {
          const relevantFaqs = faqs.filter((faq: any) => {
            const q = (faq.question || '').toLowerCase()
            const a = (faq.answer || '').toLowerCase()
            return messageLower.split(' ').some(word => 
              word.length > 3 && (q.includes(word) || a.includes(word))
            )
          }).slice(0, 3)
          
          if (relevantFaqs.length > 0) {
            contextData += '\n\n=== RELEVANT FAQs ===\n'
            relevantFaqs.forEach((faq: any) => {
              contextData += `\nQ: ${faq.question}\n`
              contextData += `A: ${faq.answer}\n`
              contextData += '---\n'
            })
          }
        }
        
        contextData += '\n[INSTRUCTION: After greeting/answering FAQ, ALWAYS ask for their pincode to show nearby workshops and pricing. Example: "Aapka pincode kya hai? (6 digit number)"]\n'
      }
    }
    
    // System prompt based on context
    let systemPrompt = ''
    
    if (context === 'my_fng_support') {
      // MY FNG specific prompt with conversational flow
      systemPrompt = `You are an intelligent AI assistant for MY FNG, Mumbai's most trusted multi-brand car service platform.

CONVERSATIONAL FLOW - FOLLOW THESE STEPS:

STEP 1 - GREETING & ASK PINCODE:
- When user first messages (hello, hi, etc.), greet them warmly
- If they ask a general FAQ, answer it
- ALWAYS end by asking for their pincode (6 digits)
- Example: "Namaste! MY FNG mein aapka swagat hai. Main aapki madad ke liye yaha hoon. Aapka pincode kya hai?"

STEP 2 - SHOW WORKSHOPS & ASK CAR:
- When user provides pincode, you will get workshop data
- Show them nearby workshops with addresses
- Then ASK which car they have
- Example: "Aapke area mein yeh workshops hain. Aapke paas kaun si car hai? (Jaise: Maruti Swift, Hyundai i20, Honda City)"

STEP 3 - SHOW PRICING:
- When user tells car model, you will get pricing data
- Show them service pricing for their car and zone
- Ask if they want to book a service
- Example: "Yeh raha aapki car ka service pricing. Kya aap service book karna chahenge?"

IMPORTANT RULES:
- Be friendly and conversational in Hindi/Hinglish
- Don't show any database data until user gives pincode
- Always follow the 3-step flow: Pincode → Workshop + Car → Pricing
- Use emojis: 📍 for workshops, 🔧 for services, 💰 for pricing
- Be helpful and guide them through each step

OUR USPs:
✅ Free pickup & drop
✅ OEM/OES genuine parts
✅ 1-month/1000km warranty
✅ Same-day service
✅ Photo/video proof

Here is the current conversation data:
${contextData}`
    } else {
      // Default CRM assistant prompt
      systemPrompt = `You are an intelligent AI assistant for a CRM system. You help with:
- Business operations (invoices, billing, payments)
- Customer management
- Sales analysis and insights
- Payroll and HR management
- WhatsApp marketing campaigns
- Report generation
- Business analytics

Provide helpful, concise, and actionable responses. Use bullet points and emojis where appropriate.
When discussing financial data, use Indian Rupee (₹) format.
Be professional yet friendly.

Context: ${context}`
    }

    // Build conversation history for Gemini
    // Add system prompt as first message
    const conversationHistory = [
      {
        role: 'user',
        parts: [{ text: systemPrompt }]
      },
      {
        role: 'model',
        parts: [{ text: 'Understood. I am ready to assist you with your CRM and business operations.' }]
      }
    ]

    // Add previous messages
    messages.forEach((msg: Message) => {
      conversationHistory.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      })
    })

    // Add current message
    conversationHistory.push({
      role: 'user',
      parts: [{ text: message }]
    })

    // Prepare request for Gemini API
    const geminiPayload = {
      contents: conversationHistory,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    }

    // Call Gemini API
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_AI_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(geminiPayload),
      }
    )

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.text()
      console.error('Gemini API error:', errorData)
      throw new Error(`Gemini API error: ${geminiResponse.status}`)
    }

    const geminiData = await geminiResponse.json()
    
    // Extract AI response
    const aiReply = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 
                    'I apologize, but I encountered an error processing your request.'

    // Log AI interaction
    try {
      await supabaseClient
        .from('ai_tasks')
        .insert({
          organization_id: req.headers.get('X-Organization-ID') || null,
          task_type: 'chat_completion',
          input_data: { 
            message,
            context,
            conversation_length: messages.length
          },
          output_data: { 
            reply: aiReply,
            model: 'gemini-1.5-flash'
          },
          status: 'completed',
          completed_at: new Date().toISOString()
        })
    } catch (logError) {
      console.error('Failed to log AI task:', logError)
      // Don't fail the request if logging fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        reply: aiReply,
        model: 'gemini-1.5-flash',
        usage: {
          prompt_tokens: geminiData.usageMetadata?.promptTokenCount || 0,
          completion_tokens: geminiData.usageMetadata?.candidatesTokenCount || 0,
          total_tokens: geminiData.usageMetadata?.totalTokenCount || 0
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in ai_chat:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

