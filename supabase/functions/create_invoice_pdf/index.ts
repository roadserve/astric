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
    const { invoice_id, organization_id } = await req.json()

    if (!invoice_id || !organization_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
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

    // Get invoice details with related data
    const { data: invoice, error: invoiceError } = await supabaseClient
      .from('invoices')
      .select(`
        *,
        customer:customers(*),
        items:invoice_items(*),
        organization:organizations(*)
      `)
      .eq('id', invoice_id)
      .eq('organization_id', organization_id)
      .single()

    if (invoiceError || !invoice) {
      throw new Error(`Invoice not found: ${invoiceError?.message}`)
    }

    // TODO: Implement actual PDF generation
    // This would typically involve:
    // 1. Use a PDF library like jsPDF, PDFKit, or Puppeteer
    // 2. Create a professional invoice template
    // 3. Fill in the invoice data
    // 4. Generate the PDF buffer
    // 5. Upload to Supabase Storage
    // 6. Return the public URL

    // For now, we'll create a simple HTML template and return it
    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${invoice.invoice_number}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
          .company-info { float: right; text-align: right; }
          .invoice-details { margin-bottom: 20px; }
          .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .items-table th { background-color: #f2f2f2; }
          .totals { float: right; width: 300px; }
          .total-row { font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>INVOICE</h1>
          <div class="company-info">
            <h3>${invoice.organization?.name || 'Your Company'}</h3>
            <p>${invoice.organization?.address || 'Company Address'}</p>
            <p>GSTIN: ${invoice.organization?.gstin || 'N/A'}</p>
          </div>
        </div>
        
        <div class="invoice-details">
          <p><strong>Invoice Number:</strong> ${invoice.invoice_number}</p>
          <p><strong>Invoice Date:</strong> ${invoice.invoice_date}</p>
          <p><strong>Due Date:</strong> ${invoice.due_date || 'N/A'}</p>
          ${invoice.customer ? `
            <p><strong>Bill To:</strong></p>
            <p>${invoice.customer.name}</p>
            <p>${invoice.customer.address || ''}</p>
            <p>GSTIN: ${invoice.customer.gstin || 'N/A'}</p>
          ` : ''}
        </div>
        
        <table class="items-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items?.map(item => `
              <tr>
                <td>${item.description}</td>
                <td>${item.quantity}</td>
                <td>₹${item.unit_price}</td>
                <td>₹${item.line_total}</td>
              </tr>
            `).join('') || ''}
          </tbody>
        </table>
        
        <div class="totals">
          <p>Subtotal: ₹${invoice.subtotal}</p>
          <p>Tax: ₹${invoice.tax_amount || 0}</p>
          <p>Discount: ₹${invoice.discount_amount || 0}</p>
          <p class="total-row">Total: ₹${invoice.total_amount}</p>
        </div>
        
        ${invoice.notes ? `<div style="margin-top: 40px;"><strong>Notes:</strong><br>${invoice.notes}</div>` : ''}
        ${invoice.terms ? `<div style="margin-top: 20px;"><strong>Terms:</strong><br>${invoice.terms}</div>` : ''}
      </body>
      </html>
    `

    // For now, we'll return the HTML template
    // In production, you would generate a PDF and upload it to storage
    const pdfUrl = `data:text/html;base64,${btoa(htmlTemplate)}`

    return new Response(
      JSON.stringify({ 
        success: true, 
        invoice_id,
        pdf_url: pdfUrl,
        html_template: htmlTemplate
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in create_invoice_pdf:', error)
    
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
