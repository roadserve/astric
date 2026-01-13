import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Test 1: Check if API key exists
    const GOOGLE_AI_KEY = Deno.env.get('GOOGLE_AI_API_KEY')
    
    if (!GOOGLE_AI_KEY) {
      return new Response(
        JSON.stringify({ 
          error: 'API key not found',
          test: 'FAILED',
          message: 'GOOGLE_AI_API_KEY environment variable is not set'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Test 2: Check API key format
    const keyPreview = GOOGLE_AI_KEY.substring(0, 10) + '...'
    
    // Test 3: Try calling Google AI API
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_AI_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: 'Say hello in a friendly way' }]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 100,
          }
        }),
      }
    )

    const responseText = await geminiResponse.text()
    
    if (!geminiResponse.ok) {
      return new Response(
        JSON.stringify({ 
          test: 'FAILED',
          error: 'Google AI API call failed',
          status: geminiResponse.status,
          keyPreview: keyPreview,
          response: responseText
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const geminiData = JSON.parse(responseText)
    const aiReply = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'No response'

    return new Response(
      JSON.stringify({
        test: 'SUCCESS',
        message: 'Google AI API is working correctly!',
        keyPreview: keyPreview,
        aiReply: aiReply,
        fullResponse: geminiData
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        test: 'ERROR',
        error: error.message,
        stack: error.stack
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

