import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export async function OPTIONS() {
  return new Response('ok', { headers: corsHeaders })
}

export async function POST(req: NextRequest) {
  try {
    const { message, messages = [] } = await req.json()

    if (!message && messages.length === 0) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        { status: 500, headers: corsHeaders }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Query relevant data from Supabase tables based on user message
    const relevantContext = await getRelevantContext(supabase, message)

    // Get Google AI API key using your custom variable name
    const GOOGLE_AI_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY
    
    // Debug: Log if key exists
    console.log('🔑 NEXT_PUBLIC_GOOGLE_API_KEY found:', !!GOOGLE_AI_KEY)
    if (GOOGLE_AI_KEY) {
      console.log('🔑 Key length:', GOOGLE_AI_KEY.length)
    }
    
    if (!GOOGLE_AI_KEY) {
      console.error('❌ NEXT_PUBLIC_GOOGLE_API_KEY not found in environment variables')
      return NextResponse.json(
        { error: 'Google AI API key not configured. Please set NEXT_PUBLIC_GOOGLE_API_KEY in your .env.local file.' },
        { status: 500, headers: corsHeaders }
      )
    }

    // Build system prompt with context from database
    const systemPrompt = `You are an intelligent AI assistant for MY FNG, Mumbai's most trusted multi-brand car service platform.
You help users with information about:
- Workshop locations and addresses across Mumbai, Pune, Thane, and Palghar (50+ A-grade workshops)
- Service centers by zone (Mumbai, RO Mumbai, Pune)
- Pincode coverage and nearby workshop locations
- Service pricing for different car models and service types
- Car service packages (General, Premium, Platinum)
- Frequently asked questions about our services

Here is relevant information from our database:

${relevantContext}

IMPORTANT INSTRUCTIONS:
- Provide helpful, concise, and accurate responses based on this information
- When sharing workshop locations, include full address and pincode coverage
- When discussing pricing, specify the car model and service type
- If pricing varies by zone or model, mention that the service expert will confirm exact pricing
- Always maintain transparency about our services and warranty
- Be professional yet friendly. Use emojis appropriately (📍 for locations, 💰 for pricing, 🔧 for services)
- Support both English and Hindi/Hinglish queries
- If the question is not covered in the provided data, politely guide them to contact our service expert

Remember: We offer free pickup & drop, OEM/OES genuine parts, 1-month/1000km warranty, and same-day service.`

    // Build conversation history for Gemini
    const conversationHistory = [
      {
        role: 'user',
        parts: [{ text: systemPrompt }]
      },
      {
        role: 'model',
        parts: [{ text: 'Hello! I am your Astric.ai assistant. I can help you with information about our workshops, pricing, and answer your questions. How can I assist you today?' }]
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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GOOGLE_AI_KEY}`,
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

    return NextResponse.json(
      {
        success: true,
        reply: aiReply,
        model: 'gemini-1.5-flash',
        usage: {
          prompt_tokens: geminiData.usageMetadata?.promptTokenCount || 0,
          completion_tokens: geminiData.usageMetadata?.candidatesTokenCount || 0,
          total_tokens: geminiData.usageMetadata?.totalTokenCount || 0
        }
      },
      { status: 200, headers: corsHeaders }
    )

  } catch (error: any) {
    console.error('Error in chat API:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error.message 
      },
      { status: 500, headers: corsHeaders }
    )
  }
}

// Function to get relevant context from Supabase tables
async function getRelevantContext(supabase: any, message: string): Promise<string> {
  let context = ''
  const messageLower = message.toLowerCase()

  try {
    // Check if query is about workshops or locations
    if (messageLower.includes('workshop') || messageLower.includes('location') || messageLower.includes('address') || 
        messageLower.includes('where') || messageLower.includes('near') || messageLower.includes('zone') ||
        messageLower.includes('mumbai') || messageLower.includes('pune') || messageLower.includes('thane') ||
        messageLower.includes('garage') || messageLower.includes('service center')) {
      
      // Check if user is asking about a specific zone or area
      let query = supabase.from('workshop').select('*')
      
      // Filter by zone if mentioned
      if (messageLower.includes('mumbai') && !messageLower.includes('ro mumbai')) {
        query = query.eq('zone', 'Mumbai')
      } else if (messageLower.includes('ro mumbai')) {
        query = query.eq('zone', 'RO Mumbai')
      } else if (messageLower.includes('pune')) {
        query = query.eq('zone', 'Pune')
      }
      
      // Check for specific location/area mentions
      const areas = ['andheri', 'thane', 'kalyan', 'mulund', 'borivali', 'malad', 'kandivali', 
                     'panvel', 'vasai', 'virar', 'dombivali', 'hadapsar', 'wakad', 'baner',
                     'ghatkopar', 'dadar', 'wadala', 'nerul', 'khopoli', 'badlapur', 'nashik',
                     'kharadi', 'katraj', 'pimple', 'viman nagar', 'lohegaon']
      const mentionedArea = areas.find(area => messageLower.includes(area))
      if (mentionedArea) {
        query = query.ilike('workshop_name', `%${mentionedArea}%`)
      }
      
      const { data: workshops, error } = await query.eq('status', 1).limit(15)
      
      if (!error && workshops && workshops.length > 0) {
        context += '\n\n=== WORKSHOPS/LOCATIONS ===\n'
        workshops.forEach((workshop: any) => {
          context += `\n📍 ${workshop.workshop_name}\n`
          if (workshop.address) context += `Address: ${workshop.address}\n`
          if (workshop.zone) context += `Zone: ${workshop.zone}\n`
          if (workshop.pincode) context += `Pincodes Covered: ${workshop.pincode}\n`
          if (workshop.group_id) context += `WhatsApp Group: ${workshop.group_id}\n`
          if (workshop.lat && workshop.lng) context += `Coordinates: ${workshop.lat}, ${workshop.lng}\n`
          context += '---\n'
        })
      }
    }

    // Check if query is about pricing
    if (messageLower.includes('price') || messageLower.includes('pricing') || messageLower.includes('cost') || 
        messageLower.includes('rate') || messageLower.includes('charge') || messageLower.includes('kharcha') ||
        messageLower.includes('service price') || messageLower.includes('kitna') || messageLower.includes('package')) {
      
      // Build pricing query
      let pricingQuery = supabase.from('pricing').select('*')
      
      // Filter by zone if mentioned
      if (messageLower.includes('mumbai') && !messageLower.includes('ro mumbai')) {
        pricingQuery = pricingQuery.eq('zone', 'Mumbai')
      } else if (messageLower.includes('ro mumbai')) {
        pricingQuery = pricingQuery.eq('zone', 'RO Mumbai')
      } else if (messageLower.includes('pune')) {
        pricingQuery = pricingQuery.eq('zone', 'Pune')
      }
      
      // Check for car make/model mentions
      const carMakes = ['maruti', 'suzuki', 'hyundai', 'honda', 'tata', 'mahindra', 'kia', 'toyota', 
                        'volkswagen', 'skoda', 'renault', 'nissan', 'ford', 'chevrolet', 'bmw', 'audi', 'mercedes']
      const mentionedMake = carMakes.find(make => messageLower.includes(make))
      if (mentionedMake) {
        pricingQuery = pricingQuery.ilike('make', `%${mentionedMake}%`)
      }
      
      // Check for service type mentions
      const services = ['service', 'repair', 'maintenance', 'oil change', 'brake', 'clutch', 
                       'ac', 'suspension', 'denting', 'painting', 'washing', 'cleaning']
      const mentionedService = services.find(service => messageLower.includes(service))
      if (mentionedService) {
        pricingQuery = pricingQuery.ilike('service_name', `%${mentionedService}%`)
      }
      
      const { data: pricing, error } = await pricingQuery.limit(20)
      
      if (!error && pricing && pricing.length > 0) {
        context += '\n\n=== PRICING INFORMATION ===\n'
        
        // Group by service type for better presentation
        const groupedPricing: any = {}
        pricing.forEach((item: any) => {
          const serviceName = item.service_name || 'General Service'
          if (!groupedPricing[serviceName]) {
            groupedPricing[serviceName] = []
          }
          groupedPricing[serviceName].push(item)
        })
        
        Object.keys(groupedPricing).forEach(serviceName => {
          context += `\n💰 ${serviceName}:\n`
          groupedPricing[serviceName].forEach((item: any) => {
            if (item.make && item.model_name) {
              context += `  • ${item.make} ${item.model_name}`
            } else if (item.vehicle_class) {
              context += `  • ${item.vehicle_class}`
            }
            if (item.price) context += ` - ₹${item.price}`
            if (item.zone) context += ` (${item.zone})`
            context += '\n'
          })
          context += '---\n'
        })
      }
    }

    // Always search FAQs for relevant answers
    const { data: faqs, error: faqError } = await supabase
      .from('faq')
      .select('*')
      .limit(20)
    
    if (!faqError && faqs && faqs.length > 0) {
      // Filter FAQs based on message keywords
      const relevantFaqs = faqs.filter((faq: any) => {
        const question = (faq.question || '').toLowerCase()
        const answer = (faq.answer || '').toLowerCase()
        return question.includes(messageLower) || 
               answer.includes(messageLower) ||
               messageLower.split(' ').some(word => 
                 word.length > 3 && (question.includes(word) || answer.includes(word))
               )
      })

      if (relevantFaqs.length > 0) {
        context += '\n\n=== FREQUENTLY ASKED QUESTIONS ===\n'
        relevantFaqs.slice(0, 5).forEach((faq: any) => {
          context += `\nQ: ${faq.question || 'N/A'}\n`
          context += `A: ${faq.answer || 'N/A'}\n`
          context += '---\n'
        })
      } else {
        // Include some general FAQs if no specific match
        context += '\n\n=== GENERAL FAQs ===\n'
        faqs.slice(0, 5).forEach((faq: any) => {
          context += `\nQ: ${faq.question || 'N/A'}\n`
          context += `A: ${faq.answer || 'N/A'}\n`
          context += '---\n'
        })
      }
    }

    // If no specific context found, get general information
    if (!context) {
      context = '\n\n=== GENERAL INFORMATION ===\n'
      context += 'Astric.ai is a business automation platform that helps SMEs automate workflows, manage CRM, and scale operations.\n'
      context += 'For specific questions about workshops, pricing, or other topics, please provide more details.\n'
    }

  } catch (error) {
    console.error('Error fetching context from database:', error)
    context = '\n\nNote: Some database information may be temporarily unavailable.\n'
  }

  return context
}

