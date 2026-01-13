import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
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
    const { conversation_id, intent, customer_message, language = 'en' } = await req.json()

    if (!conversation_id || !customer_message) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get Google AI API key
    const GOOGLE_AI_KEY = Deno.env.get('GOOGLE_AI_API_KEY')
    
    if (!GOOGLE_AI_KEY) {
      throw new Error('Google AI API key not configured')
    }

    // Determine intent if not provided
    let detectedIntent = intent
    if (!detectedIntent) {
      const message = customer_message.toLowerCase()
      
      if (message.includes('hello') || message.includes('hi') || message.includes('नमस्ते')) {
        detectedIntent = 'greeting'
      } else if (message.includes('product') || message.includes('उत्पाद') || message.includes('price') || message.includes('कीमत')) {
        detectedIntent = 'product_inquiry'
      } else if (message.includes('order') || message.includes('ऑर्डर') || message.includes('delivery') || message.includes('डिलीवरी')) {
        detectedIntent = 'order_status'
      } else if (message.includes('payment') || message.includes('भुगतान') || message.includes('pay') || message.includes('paid')) {
        detectedIntent = 'payment_inquiry'
      } else if (message.includes('problem') || message.includes('issue') || message.includes('complaint') || message.includes('समस्या') || message.includes('शिकायत')) {
        detectedIntent = 'complaint'
      } else if (message.includes('offer') || message.includes('discount') || message.includes('ऑफर') || message.includes('छूट')) {
        detectedIntent = 'festive_offer'
      } else if (message.includes('thank') || message.includes('thanks') || message.includes('धन्यवाद')) {
        detectedIntent = 'thanks'
      } else {
        detectedIntent = 'greeting'
      }
    }

    // Create prompt for Gemini
    const systemPrompt = `You are a customer service AI for a business. Generate a professional, friendly reply to a customer's message.

Intent: ${detectedIntent}
Language: ${language === 'hi' ? 'Hindi' : 'English'}
Customer Message: "${customer_message}"

Generate 3 different reply options (short, medium, and detailed).
Format as JSON: { "short": "...", "medium": "...", "detailed": "..." }`

    // Call Gemini API
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_AI_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [{ text: systemPrompt }]
          }],
          generationConfig: {
            temperature: 0.8,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 512,
          }
        }),
      }
    )

    if (!geminiResponse.ok) {
      throw new Error(`Gemini API error: ${geminiResponse.status}`)
    }

    const geminiData = await geminiResponse.json()
    const aiResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || ''

    // Try to parse JSON response, fallback to text
    let suggestedReply = ''
    let alternatives = []

    try {
      const parsed = JSON.parse(aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, ''))
      suggestedReply = parsed.medium || parsed.short || aiResponse
      alternatives = [parsed.short, parsed.medium, parsed.detailed].filter(Boolean)
    } catch {
      suggestedReply = aiResponse
      alternatives = [aiResponse]
    }

    // Create AI task record
    await supabaseClient
      .from('ai_tasks')
      .insert({
        organization_id: req.headers.get('X-Organization-ID'),
        task_type: 'reply_suggest',
        input_data: { 
          conversation_id, 
          customer_message,
          intent: detectedIntent,
          language 
        },
        output_data: { 
          suggested_reply: suggestedReply,
          detected_intent: detectedIntent,
          alternatives 
        },
        status: 'completed',
        completed_at: new Date().toISOString()
      })

    return new Response(
      JSON.stringify({
        success: true,
        suggested_reply: suggestedReply,
        detected_intent: detectedIntent,
        alternatives,
        language,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in ai_reply_suggest:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
