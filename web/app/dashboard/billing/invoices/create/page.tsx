'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { 
  Plus, 
  Trash2, 
  Save,
  Send,
  ArrowLeft,
  Calculator
} from 'lucide-react'

interface Customer {
  id: string
  name: string
  email: string
  gstin: string
}

interface Product {
  id: string
  name: string
  selling_price: number
  tax_rate: number
  hsn_code: string
  unit: string
}

interface InvoiceItem {
  id: string
  product_id: string
  item_name: string
  description: string
  hsn_code: string
  quantity: number
  unit: string
  rate: number
  discount_percent: number
  discount_amount: number
  taxable_amount: number
  tax_rate: number
  tax_amount: number
  total_amount: number
}

export default function CreateInvoicePage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)

  // Invoice data
  const [invoiceType, setInvoiceType] = useState('sales')
  const [customerId, setCustomerId] = useState('')
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0])
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
  const [referenceNumber, setReferenceNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [termsConditions, setTermsConditions] = useState('')

  // Items
  const [items, setItems] = useState<InvoiceItem[]>([{
    id: '1',
    product_id: '',
    item_name: '',
    description: '',
    hsn_code: '',
    quantity: 1,
    unit: 'pcs',
    rate: 0,
    discount_percent: 0,
    discount_amount: 0,
    taxable_amount: 0,
    tax_rate: 18,
    tax_amount: 0,
    total_amount: 0
  }])

  // Additional charges
  const [shippingCharges, setShippingCharges] = useState(0)
  const [otherCharges, setOtherCharges] = useState(0)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [roundOff, setRoundOff] = useState(0)

  useEffect(() => {
    loadCustomers()
    loadProducts()
  }, [])

  const loadCustomers = async () => {
    try {
      const { data: profile } = await supabase.from('profiles').select('id').single()
      const { data: orgMember } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', profile?.id)
        .single()

      const { data, error } = await supabase
        .from('billing_customers')
        .select('id, name, email, gstin')
        .eq('organization_id', orgMember?.organization_id)
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setCustomers(data || [])
    } catch (error) {
      console.error('Error loading customers:', error)
    }
  }

  const loadProducts = async () => {
    try {
      const { data: profile } = await supabase.from('profiles').select('id').single()
      const { data: orgMember } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', profile?.id)
        .single()

      const { data, error } = await supabase
        .from('billing_products')
        .select('id, name, selling_price, tax_rate, hsn_code, unit')
        .eq('organization_id', orgMember?.organization_id)
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Error loading products:', error)
    }
  }

  const handleProductSelect = (index: number, productId: string) => {
    const product = products.find(p => p.id === productId)
    if (!product) return

    const newItems = [...items]
    newItems[index] = {
      ...newItems[index],
      product_id: productId,
      item_name: product.name,
      hsn_code: product.hsn_code,
      unit: product.unit,
      rate: product.selling_price,
      tax_rate: product.tax_rate
    }
    setItems(newItems)
    calculateItemTotal(index, newItems)
  }

  const calculateItemTotal = (index: number, currentItems = items) => {
    const item = currentItems[index]
    const baseAmount = item.quantity * item.rate
    const discountAmt = item.discount_percent > 0 
      ? (baseAmount * item.discount_percent / 100) 
      : item.discount_amount
    const taxableAmt = baseAmount - discountAmt
    const taxAmt = taxableAmt * item.tax_rate / 100
    const totalAmt = taxableAmt + taxAmt

    const newItems = [...currentItems]
    newItems[index] = {
      ...item,
      discount_amount: discountAmt,
      taxable_amount: taxableAmt,
      tax_amount: taxAmt,
      total_amount: totalAmt
    }
    setItems(newItems)
  }

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
    calculateItemTotal(index, newItems)
  }

  const addItem = () => {
    setItems([...items, {
      id: Date.now().toString(),
      product_id: '',
      item_name: '',
      description: '',
      hsn_code: '',
      quantity: 1,
      unit: 'pcs',
      rate: 0,
      discount_percent: 0,
      discount_amount: 0,
      taxable_amount: 0,
      tax_rate: 18,
      total_amount: 0
    }])
  }

  const removeItem = (index: number) => {
    if (items.length === 1) return
    setItems(items.filter((_, i) => i !== index))
  }

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.taxable_amount, 0)
    const taxAmount = items.reduce((sum, item) => sum + item.tax_amount, 0)
    const total = subtotal + taxAmount + shippingCharges + otherCharges - discountAmount + roundOff
    
    return {
      subtotal,
      taxAmount,
      total,
      balance: total
    }
  }

  const handleSaveInvoice = async (status: 'draft' | 'sent') => {
    if (!customerId) {
      alert('Please select a customer')
      return
    }

    if (items.length === 0 || !items[0].item_name) {
      alert('Please add at least one item')
      return
    }

    setLoading(true)
    try {
      const { data: profile } = await supabase.from('profiles').select('id').single()
      const { data: orgMember } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', profile?.id)
        .single()

      const totals = calculateTotals()

      // Generate invoice number
      const invoiceNumber = `INV-${Date.now()}`

      // Create invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('billing_invoices')
        .insert({
          organization_id: orgMember?.organization_id,
          invoice_type: invoiceType,
          invoice_number: invoiceNumber,
          invoice_date: invoiceDate,
          due_date: dueDate,
          customer_id: customerId,
          subtotal: totals.subtotal,
          discount_amount: discountAmount,
          tax_amount: totals.taxAmount,
          shipping_charges: shippingCharges,
          other_charges: otherCharges,
          round_off: roundOff,
          total_amount: totals.total,
          balance_amount: totals.balance,
          status: status,
          payment_status: 'unpaid',
          reference_number: referenceNumber,
          notes: notes,
          terms_conditions: termsConditions,
          created_by: profile?.id
        })
        .select()
        .single()

      if (invoiceError) throw invoiceError

      // Create invoice items
      const itemsToInsert = items.map(item => ({
        invoice_id: invoice.id,
        product_id: item.product_id || null,
        item_name: item.item_name,
        description: item.description,
        hsn_code: item.hsn_code,
        quantity: item.quantity,
        unit: item.unit,
        rate: item.rate,
        discount_percent: item.discount_percent,
        discount_amount: item.discount_amount,
        taxable_amount: item.taxable_amount,
        tax_rate: item.tax_rate,
        tax_amount: item.tax_amount,
        total_amount: item.total_amount
      }))

      const { error: itemsError } = await supabase
        .from('billing_invoice_items')
        .insert(itemsToInsert)

      if (itemsError) throw itemsError

      alert(`Invoice ${status === 'draft' ? 'saved' : 'created and sent'} successfully!`)
      router.push('/dashboard/billing/invoices')
    } catch (error) {
      console.error('Error saving invoice:', error)
      alert('Failed to save invoice')
    } finally {
      setLoading(false)
    }
  }

  const totals = calculateTotals()
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create Invoice</h1>
              <p className="text-gray-600 mt-1">Generate a new invoice</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={() => handleSaveInvoice('draft')}
              disabled={loading}
              variant="outline"
            >
              <Save className="h-4 w-4 mr-2" />
              Save as Draft
            </Button>
            <Button 
              onClick={() => handleSaveInvoice('sent')}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Send className="h-4 w-4 mr-2" />
              Save & Send
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Invoice Details */}
            <Card>
              <CardHeader>
                <CardTitle>Invoice Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Invoice Type *</label>
                    <select
                      value={invoiceType}
                      onChange={(e) => setInvoiceType(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="sales">Sales Invoice</option>
                      <option value="purchase">Purchase Invoice</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Customer *</label>
                    <select
                      value={customerId}
                      onChange={(e) => setCustomerId(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Customer</option>
                      {customers.map(customer => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name} {customer.gstin && `(${customer.gstin})`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Invoice Date *</label>
                    <input
                      type="date"
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Due Date *</label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Reference #</label>
                    <input
                      type="text"
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                      placeholder="PO-123"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Items */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Items</CardTitle>
                  <Button onClick={addItem} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div key={item.id} className="p-4 border border-gray-200 rounded-lg space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 space-y-3">
                          {/* Product Selection */}
                          <div>
                            <select
                              value={item.product_id}
                              onChange={(e) => handleProductSelect(index, e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Select Product or Enter Manually</option>
                              {products.map(product => (
                                <option key={product.id} value={product.id}>
                                  {product.name} - {formatCurrency(product.selling_price)}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Manual Entry */}
                          {!item.product_id && (
                            <input
                              type="text"
                              value={item.item_name}
                              onChange={(e) => updateItem(index, 'item_name', e.target.value)}
                              placeholder="Item name"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          )}

                          {/* Description */}
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => updateItem(index, 'description', e.target.value)}
                            placeholder="Description (optional)"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />

                          {/* Quantity, Rate, Tax */}
                          <div className="grid grid-cols-5 gap-2">
                            <input
                              type="number"
                              step="0.01"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                              placeholder="Qty"
                              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <input
                              type="number"
                              step="0.01"
                              value={item.rate}
                              onChange={(e) => updateItem(index, 'rate', parseFloat(e.target.value) || 0)}
                              placeholder="Rate"
                              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <input
                              type="number"
                              step="0.01"
                              value={item.discount_percent}
                              onChange={(e) => updateItem(index, 'discount_percent', parseFloat(e.target.value) || 0)}
                              placeholder="Disc %"
                              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <input
                              type="number"
                              step="0.01"
                              value={item.tax_rate}
                              onChange={(e) => updateItem(index, 'tax_rate', parseFloat(e.target.value) || 0)}
                              placeholder="Tax %"
                              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-semibold text-right">
                              {formatCurrency(item.total_amount)}
                            </div>
                          </div>
                        </div>

                        {items.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(index)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Any additional notes..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Terms & Conditions</label>
                  <textarea
                    value={termsConditions}
                    onChange={(e) => setTermsConditions(e.target.value)}
                    rows={3}
                    placeholder="Payment terms and conditions..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Invoice Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax Amount:</span>
                    <span className="font-medium">{formatCurrency(totals.taxAmount)}</span>
                  </div>
                </div>

                <div className="pt-4 border-t space-y-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Shipping Charges</label>
                    <input
                      type="number"
                      step="0.01"
                      value={shippingCharges}
                      onChange={(e) => setShippingCharges(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Other Charges</label>
                    <input
                      type="number"
                      step="0.01"
                      value={otherCharges}
                      onChange={(e) => setOtherCharges(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Discount</label>
                    <input
                      type="number"
                      step="0.01"
                      value={discountAmount}
                      onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Round Off</label>
                    <input
                      type="number"
                      step="0.01"
                      value={roundOff}
                      onChange={(e) => setRoundOff(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
                    <span className="text-2xl font-bold text-blue-600">{formatCurrency(totals.total)}</span>
                  </div>
                </div>

                <div className="pt-4 border-t space-y-2">
                  <Button 
                    onClick={() => handleSaveInvoice('draft')}
                    disabled={loading}
                    variant="outline"
                    className="w-full"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save as Draft
                  </Button>
                  <Button 
                    onClick={() => handleSaveInvoice('sent')}
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Save & Send
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
