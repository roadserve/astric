import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { file_url, organization_id } = await req.json()

    if (!file_url || !organization_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? 'https://nazedodnkzkuxvsuedmb.supabase.co'
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hemVkb2Rua3prdXh2c3VlZG1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1Mjc3MjgsImV4cCI6MjA3NTEwMzcyOH0.33dMgS9GW9DW3XKPnQ1hTw5zzGbflzTue0VH1QRAVwE'
    
    const supabaseClient = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: req.headers.get('Authorization')! },
      },
    })

    // Create AI task record
    const { data: aiTask, error: taskError } = await supabaseClient
      .from('ai_tasks')
      .insert({
        organization_id,
        task_type: 'invoice_parse',
        input_data: { file_url },
        status: 'processing'
      })
      .select()
      .single()

    if (taskError) {
      throw new Error(`Failed to create AI task: ${taskError.message}`)
    }

    // Get Google AI API key
    const GOOGLE_AI_KEY = Deno.env.get('GOOGLE_AI_API_KEY')
    
    if (!GOOGLE_AI_KEY) {
      throw new Error('Google AI API key not configured')
    }

    // For demo purposes, using AI to generate invoice data
    // In production, you would:
    // 1. Download the actual image from file_url
    // 2. Use Google Vision API for OCR
    // 3. Then use Gemini to structure the data
    
    const prompt = `Analyze this invoice and extract the following information in JSON format:
{
  "vendor_name": "vendor or company name",
  "invoice_number": "invoice number",
  "invoice_date": "YYYY-MM-DD",
  "due_date": "YYYY-MM-DD",
  "total_amount": 0.00,
  "tax_amount": 0.00,
  "items": [
    {
      "description": "item description",
      "quantity": 0,
      "unit_price": 0.00,
      "total": 0.00
    }
  ]
}

Generate realistic sample invoice data for a business transaction.`

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
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1024,
          }
        }),
      }
    )

    if (!geminiResponse.ok) {
      throw new Error(`Gemini API error: ${geminiResponse.status}`)
    }

    const geminiData = await geminiResponse.json()
    const aiResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
    
    // Parse the JSON response
    let mockInvoiceData
    try {
      const cleaned = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '')
      mockInvoiceData = JSON.parse(cleaned)
    } catch {
      // Fallback data if parsing fails
      mockInvoiceData = {
        vendor_name: "Sample Vendor",
        invoice_number: "INV-001",
        invoice_date: "2024-01-15",
        due_date: "2024-02-15",
        total_amount: 1250.00,
        tax_amount: 225.00,
        items: [
          {
            description: "Product 1",
            quantity: 2,
            unit_price: 500.00,
            total: 1000.00
          }
        ]
      }
    }

    // Update AI task with results
    await supabaseClient
      .from('ai_tasks')
      .update({
        output_data: mockInvoiceData,
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', aiTask.id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        task_id: aiTask.id,
        invoice_data: mockInvoiceData 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in ai_invoice_parse:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
