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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const today = new Date().toISOString().split('T')[0]

    // Get all active organizations
    const { data: organizations, error: orgError } = await supabaseClient
      .from('organizations')
      .select('*')
      .eq('subscription_status', 'active')

    if (orgError) {
      throw new Error(`Failed to get organizations: ${orgError.message}`)
    }

    const usageSummary = []

    for (const org of organizations || []) {
      // Count invoices
      const { count: invoiceCount } = await supabaseClient
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', org.id)
        .gte('created_at', today)

      // Count WhatsApp messages sent
      const { data: campaigns } = await supabaseClient
        .from('whatsapp_campaigns')
        .select('sent_count')
        .eq('organization_id', org.id)
        .gte('sent_at', today)

      const whatsappCount = campaigns?.reduce((sum, c) => sum + (c.sent_count || 0), 0) || 0

      // Count AI tasks
      const { count: aiTaskCount } = await supabaseClient
        .from('ai_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', org.id)
        .gte('created_at', today)

      // Count employees
      const { count: employeeCount } = await supabaseClient
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', org.id)
        .eq('is_active', true)

      // Calculate usage charges based on tier
      let charges = 0
      const tier = org.subscription_tier || 'free'

      if (tier === 'free') {
        // Free tier limits: 10 invoices, 50 WhatsApp, 10 AI tasks
        charges += Math.max(0, (invoiceCount || 0) - 10) * 5 // ₹5 per extra invoice
        charges += Math.max(0, whatsappCount - 50) * 1 // ₹1 per extra message
        charges += Math.max(0, (aiTaskCount || 0) - 10) * 10 // ₹10 per extra AI task
      } else if (tier === 'basic') {
        // Basic tier: ₹499/month + usage above limits
        charges = 499
        charges += Math.max(0, (invoiceCount || 0) - 100) * 3
        charges += Math.max(0, whatsappCount - 500) * 0.5
        charges += Math.max(0, (aiTaskCount || 0) - 100) * 5
      } else if (tier === 'premium') {
        // Premium tier: ₹1499/month, unlimited usage
        charges = 1499
      }

      // Insert usage tracking
      await supabaseClient
        .from('usage_tracking')
        .insert([
          {
            organization_id: org.id,
            feature: 'invoices',
            usage_count: invoiceCount || 0,
            usage_date: today,
            metadata: { tier, charges: Math.max(0, (invoiceCount || 0) - 10) * 5 }
          },
          {
            organization_id: org.id,
            feature: 'whatsapp_messages',
            usage_count: whatsappCount,
            usage_date: today,
            metadata: { tier, charges: Math.max(0, whatsappCount - 50) * 1 }
          },
          {
            organization_id: org.id,
            feature: 'ai_tasks',
            usage_count: aiTaskCount || 0,
            usage_date: today,
            metadata: { tier, charges: Math.max(0, (aiTaskCount || 0) - 10) * 10 }
          },
          {
            organization_id: org.id,
            feature: 'employees',
            usage_count: employeeCount || 0,
            usage_date: today,
            metadata: { tier }
          },
        ])

      usageSummary.push({
        organization_id: org.id,
        organization_name: org.name,
        tier,
        invoices: invoiceCount || 0,
        whatsapp_messages: whatsappCount,
        ai_tasks: aiTaskCount || 0,
        employees: employeeCount || 0,
        daily_charges: charges,
      })
    }

    return new Response(
      JSON.stringify({
        success: true,
        date: today,
        organizations_processed: organizations?.length || 0,
        usage_summary: usageSummary,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in usage_billing_job:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
