'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Plus, 
  Search, 
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Calendar,
  Filter,
  Eye,
  Trash2
} from 'lucide-react'

interface Payment {
  id: string
  payment_type: string
  payment_date: string
  customer: {
    name: string
  }
  amount: number
  payment_method: string
  reference_number: string
  notes: string
  created_at: string
}

export default function PaymentsPage() {
  const supabase = createClientComponentClient()
  const [payments, setPayments] = useState<Payment[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)

  const [formData, setFormData] = useState({
    payment_type: 'received',
    payment_date: new Date().toISOString().split('T')[0],
    customer_id: '',
    invoice_id: '',
    amount: 0,
    payment_method: 'cash',
    bank_name: '',
    transaction_id: '',
    cheque_number: '',
    cheque_date: '',
    reference_number: '',
    notes: ''
  })

  useEffect(() => {
    loadPayments()
    loadCustomers()
    loadInvoices()
  }, [])

  const loadPayments = async () => {
    setLoading(true)
    try {
      const { data: profile } = await supabase.from('profiles').select('id').single()
      const { data: orgMember } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', profile?.id)
        .single()

      const { data, error } = await supabase
        .from('billing_payments')
        .select('*, customer:billing_customers(name)')
        .eq('organization_id', orgMember?.organization_id)
        .order('payment_date', { ascending: false })

      if (error) throw error
      setPayments(data || [])
    } catch (error) {
      console.error('Error loading payments:', error)
    } finally {
      setLoading(false)
    }
  }

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
        .select('id, name, current_balance')
        .eq('organization_id', orgMember?.organization_id)
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setCustomers(data || [])
    } catch (error) {
      console.error('Error loading customers:', error)
    }
  }

  const loadInvoices = async () => {
    try {
      const { data: profile } = await supabase.from('profiles').select('id').single()
      const { data: orgMember } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', profile?.id)
        .single()

      const { data, error } = await supabase
        .from('billing_invoices')
        .select('id, invoice_number, balance_amount, customer_id')
        .eq('organization_id', orgMember?.organization_id)
        .gt('balance_amount', 0)
        .order('invoice_date', { ascending: false })

      if (error) throw error
      setInvoices(data || [])
    } catch (error) {
      console.error('Error loading invoices:', error)
    }
  }

  const handleCreatePayment = async () => {
    if (!formData.customer_id || formData.amount <= 0) {
      alert('Please select customer and enter amount')
      return
    }

    try {
      const { data: profile } = await supabase.from('profiles').select('id').single()
      const { data: orgMember } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', profile?.id)
        .single()

      const { error } = await supabase
        .from('billing_payments')
        .insert({
          organization_id: orgMember?.organization_id,
          ...formData,
          created_by: profile?.id
        })

      if (error) throw error

      // Update invoice if selected
      if (formData.invoice_id) {
        const invoice = invoices.find(inv => inv.id === formData.invoice_id)
        if (invoice) {
          const newPaidAmount = formData.amount
          const newBalance = Math.max(0, invoice.balance_amount - formData.amount)
          
          await supabase
            .from('billing_invoices')
            .update({
              paid_amount: supabase.rpc('increment', { x: newPaidAmount }),
              balance_amount: newBalance,
              payment_status: newBalance === 0 ? 'paid' : 'partial'
            })
            .eq('id', formData.invoice_id)
        }
      }

      alert('Payment recorded successfully!')
      setShowCreateModal(false)
      resetForm()
      loadPayments()
      loadInvoices()
    } catch (error) {
      console.error('Error creating payment:', error)
      alert('Failed to record payment')
    }
  }

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm('Are you sure you want to delete this payment?')) return

    try {
      const { error } = await supabase
        .from('billing_payments')
        .delete()
        .eq('id', paymentId)

      if (error) throw error
      loadPayments()
    } catch (error) {
      console.error('Error deleting payment:', error)
      alert('Failed to delete payment')
    }
  }

  const resetForm = () => {
    setFormData({
      payment_type: 'received',
      payment_date: new Date().toISOString().split('T')[0],
      customer_id: '',
      invoice_id: '',
      amount: 0,
      payment_method: 'cash',
      bank_name: '',
      transaction_id: '',
      cheque_number: '',
      cheque_date: '',
      reference_number: '',
      notes: ''
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.reference_number?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = filterType === 'all' || payment.payment_type === filterType

    return matchesSearch && matchesType
  })

  const stats = {
    totalReceived: payments
      .filter(p => p.payment_type === 'received')
      .reduce((sum, p) => sum + Number(p.amount), 0),
    totalPaid: payments
      .filter(p => p.payment_type === 'paid')
      .reduce((sum, p) => sum + Number(p.amount), 0),
    totalPayments: payments.length,
    thisMonth: payments.filter(p => {
      const paymentDate = new Date(p.payment_date)
      const now = new Date()
      return paymentDate.getMonth() === now.getMonth() && 
             paymentDate.getFullYear() === now.getFullYear()
    }).length
  }

  const customerInvoices = formData.customer_id 
    ? invoices.filter(inv => inv.customer_id === formData.customer_id)
    : []

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-600 mt-1">Track payments received and made</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setShowCreateModal(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Record Payment
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Received</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalReceived)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(stats.totalPaid)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Cash Flow</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(stats.totalReceived - stats.totalPaid)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.thisMonth}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by customer or reference..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="received">Received</option>
              <option value="paid">Paid</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Payments List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading payments...</div>
          ) : filteredPayments.length === 0 ? (
            <div className="p-8 text-center">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No payments found</h3>
              <p className="text-gray-600 mb-4">Record your first payment</p>
              <Button onClick={() => setShowCreateModal(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Record Payment
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(payment.payment_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          payment.payment_type === 'received' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {payment.payment_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payment.customer?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-semibold ${
                          payment.payment_type === 'received' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {payment.payment_type === 'received' ? '+' : '-'}
                          {formatCurrency(Number(payment.amount))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                          {payment.payment_method}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payment.reference_number || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeletePayment(payment.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Payment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>Record Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Type *</label>
                  <select
                    value={formData.payment_type}
                    onChange={(e) => setFormData({...formData, payment_type: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="received">Payment Received</option>
                    <option value="paid">Payment Made</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Date *</label>
                  <input
                    type="date"
                    value={formData.payment_date}
                    onChange={(e) => setFormData({...formData, payment_date: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Customer *</label>
                <select
                  value={formData.customer_id}
                  onChange={(e) => setFormData({...formData, customer_id: e.target.value, invoice_id: ''})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Customer</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} - Balance: {formatCurrency(customer.current_balance)}
                    </option>
                  ))}
                </select>
              </div>

              {customerInvoices.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Link to Invoice (Optional)</label>
                  <select
                    value={formData.invoice_id}
                    onChange={(e) => {
                      const invoice = customerInvoices.find(inv => inv.id === e.target.value)
                      setFormData({
                        ...formData, 
                        invoice_id: e.target.value,
                        amount: invoice ? invoice.balance_amount : formData.amount
                      })
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Invoice</option>
                    {customerInvoices.map(invoice => (
                      <option key={invoice.id} value={invoice.id}>
                        {invoice.invoice_number} - Due: {formatCurrency(invoice.balance_amount)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value) || 0})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method *</label>
                  <select
                    value={formData.payment_method}
                    onChange={(e) => setFormData({...formData, payment_method: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="cash">Cash</option>
                    <option value="bank">Bank Transfer</option>
                    <option value="upi">UPI</option>
                    <option value="card">Card</option>
                    <option value="cheque">Cheque</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {(formData.payment_method === 'bank' || formData.payment_method === 'upi') && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name</label>
                    <input
                      type="text"
                      value={formData.bank_name}
                      onChange={(e) => setFormData({...formData, bank_name: e.target.value})}
                      placeholder="HDFC Bank"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Transaction ID</label>
                    <input
                      type="text"
                      value={formData.transaction_id}
                      onChange={(e) => setFormData({...formData, transaction_id: e.target.value})}
                      placeholder="TXN123456"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              {formData.payment_method === 'cheque' && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cheque Number</label>
                    <input
                      type="text"
                      value={formData.cheque_number}
                      onChange={(e) => setFormData({...formData, cheque_number: e.target.value})}
                      placeholder="123456"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cheque Date</label>
                    <input
                      type="date"
                      value={formData.cheque_date}
                      onChange={(e) => setFormData({...formData, cheque_date: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reference Number</label>
                <input
                  type="text"
                  value={formData.reference_number}
                  onChange={(e) => setFormData({...formData, reference_number: e.target.value})}
                  placeholder="REF-123"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={3}
                  placeholder="Additional notes..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <Button onClick={() => { setShowCreateModal(false); resetForm(); }} variant="outline" className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleCreatePayment} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Record Payment
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

function X(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  )
}
