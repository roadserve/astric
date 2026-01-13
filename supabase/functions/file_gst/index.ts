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
    const { period, organization_id } = await req.json()

    if (!period || !organization_id) {
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

    // Parse period (e.g., "2024-01" for January 2024)
    const [year, month] = period.split('-')
    const startDate = new Date(year, parseInt(month) - 1, 1)
    const endDate = new Date(year, parseInt(month), 0)

    // Get organization details
    const { data: org, error: orgError } = await supabaseClient
      .from('organizations')
      .select('*')
      .eq('id', organization_id)
      .single()

    if (orgError || !org) {
      throw new Error(`Organization not found: ${orgError?.message}`)
    }

    // Get invoices for the period
    const { data: invoices, error: invoicesError } = await supabaseClient
      .from('invoices')
      .select('*, customer:customers(*), items:invoice_items(*)')
      .eq('organization_id', organization_id)
      .gte('invoice_date', startDate.toISOString())
      .lte('invoice_date', endDate.toISOString())
      .neq('status', 'cancelled')

    if (invoicesError) {
      throw new Error(`Failed to get invoices: ${invoicesError.message}`)
    }

    // Calculate GST summary
    let totalSales = 0
    let totalGST = 0
    let totalCGST = 0
    let totalSGST = 0
    let totalIGST = 0

    const gstDetails = invoices?.map(invoice => {
      const invoiceTotal = invoice.total_amount
      const taxAmount = invoice.tax_amount
      
      totalSales += invoiceTotal
      totalGST += taxAmount

      // Determine if IGST or CGST+SGST based on state
      const isInterState = org.address?.state !== invoice.customer?.address?.state
      
      if (isInterState) {
        totalIGST += taxAmount
        return {
          invoice_number: invoice.invoice_number,
          invoice_date: invoice.invoice_date,
          customer_name: invoice.customer?.name,
          customer_gstin: invoice.customer?.gstin,
          taxable_value: invoiceTotal - taxAmount,
          igst: taxAmount,
          cgst: 0,
          sgst: 0,
          total: invoiceTotal,
        }
      } else {
        const cgst = taxAmount / 2
        const sgst = taxAmount / 2
        totalCGST += cgst
        totalSGST += sgst
        
        return {
          invoice_number: invoice.invoice_number,
          invoice_date: invoice.invoice_date,
          customer_name: invoice.customer?.name,
          customer_gstin: invoice.customer?.gstin,
          taxable_value: invoiceTotal - taxAmount,
          igst: 0,
          cgst: cgst,
          sgst: sgst,
          total: invoiceTotal,
        }
      }
    }) || []

    // Generate GSTR-1 format data
    const gstr1Data = {
      gstin: org.gstin,
      fp: period, // filing period
      gt: totalSales,
      cur_gt: totalSales,
      b2b: gstDetails.filter(d => d.customer_gstin), // B2B invoices
      b2cl: gstDetails.filter(d => !d.customer_gstin && d.total > 250000), // B2C Large
      b2cs: gstDetails.filter(d => !d.customer_gstin && d.total <= 250000), // B2C Small
    }

    // Generate GSTR-3B format data
    const gstr3bData = {
      gstin: org.gstin,
      ret_period: period,
      outward_supplies: {
        taxable_value: totalSales - totalGST,
        integrated_tax: totalIGST,
        central_tax: totalCGST,
        state_ut_tax: totalSGST,
      },
      total_tax: {
        integrated_tax: totalIGST,
        central_tax: totalCGST,
        state_ut_tax: totalSGST,
        cess: 0,
      },
    }

    // Validate GST data
    const validationIssues = []
    
    for (const invoice of invoices || []) {
      // Check for missing GSTIN in B2B transactions
      if (invoice.total_amount > 250000 && !invoice.customer?.gstin) {
        validationIssues.push({
          type: 'missing_gstin',
          invoice_number: invoice.invoice_number,
          message: 'Customer GSTIN is required for invoices above ₹2.5L',
        })
      }

      // Check for invalid tax rates
      for (const item of invoice.items || []) {
        if (![0, 5, 12, 18, 28].includes(item.tax_rate)) {
          validationIssues.push({
            type: 'invalid_tax_rate',
            invoice_number: invoice.invoice_number,
            item: item.description,
            tax_rate: item.tax_rate,
            message: 'Invalid GST rate detected',
          })
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        period,
        summary: {
          total_sales: totalSales,
          total_gst: totalGST,
          total_cgst: totalCGST,
          total_sgst: totalSGST,
          total_igst: totalIGST,
          invoice_count: invoices?.length || 0,
        },
        gstr1: gstr1Data,
        gstr3b: gstr3bData,
        validation_issues: validationIssues,
        details: gstDetails,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in file_gst:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
