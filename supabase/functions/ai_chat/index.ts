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

    // System prompt based on context
    const systemPrompt = `You are an intelligent AI assistant for a CRM system. You help with:
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

