'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  Calendar,
  BarChart3,
  PieChart,
  Receipt
} from 'lucide-react'

export default function ReportsPage() {
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('this_month')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const [stats, setStats] = useState({
    sales: { total: 0, count: 0, paid: 0, unpaid: 0 },
    purchases: { total: 0, count: 0, paid: 0, unpaid: 0 },
    payments: { received: 0, made: 0, net: 0 },
    expenses: { total: 0, count: 0 },
    outstanding: { receivable: 0, payable: 0 },
    profit: 0
  })

  useEffect(() => {
    loadReports()
  }, [dateRange, startDate, endDate])

  const loadReports = async () => {
    setLoading(true)
    try {
      const { data: profile } = await supabase.from('profiles').select('id').single()
      const { data: orgMember } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', profile?.id)
        .single()

      const orgId = orgMember?.organization_id

      // Get date range
      const { start, end } = getDateRange()

      // Load invoices
      const { data: invoices } = await supabase
        .from('billing_invoices')
        .select('*')
        .eq('organization_id', orgId)
        .gte('invoice_date', start)
        .lte('invoice_date', end)

      // Load payments
      const { data: payments } = await supabase
        .from('billing_payments')
        .select('*')
        .eq('organization_id', orgId)
        .gte('payment_date', start)
        .lte('payment_date', end)

      // Load expenses
      const { data: expenses } = await supabase
        .from('billing_expenses')
        .select('*')
        .eq('organization_id', orgId)
        .gte('expense_date', start)
        .lte('expense_date', end)

      // Calculate stats
      const salesInvoices = invoices?.filter(inv => inv.invoice_type === 'sales') || []
      const purchaseInvoices = invoices?.filter(inv => inv.invoice_type === 'purchase') || []

      const salesTotal = salesInvoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0)
      const salesPaid = salesInvoices.reduce((sum, inv) => sum + Number(inv.paid_amount), 0)
      const salesUnpaid = salesTotal - salesPaid

      const purchaseTotal = purchaseInvoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0)
      const purchasePaid = purchaseInvoices.reduce((sum, inv) => sum + Number(inv.paid_amount), 0)
      const purchaseUnpaid = purchaseTotal - purchasePaid

      const paymentsReceived = payments?.filter(p => p.payment_type === 'received')
        .reduce((sum, p) => sum + Number(p.amount), 0) || 0
      const paymentsMade = payments?.filter(p => p.payment_type === 'paid')
        .reduce((sum, p) => sum + Number(p.amount), 0) || 0

      const expensesTotal = expenses?.reduce((sum, exp) => sum + Number(exp.total_amount), 0) || 0

      const profit = salesTotal - purchaseTotal - expensesTotal

      setStats({
        sales: {
          total: salesTotal,
          count: salesInvoices.length,
          paid: salesPaid,
          unpaid: salesUnpaid
        },
        purchases: {
          total: purchaseTotal,
          count: purchaseInvoices.length,
          paid: purchasePaid,
          unpaid: purchaseUnpaid
        },
        payments: {
          received: paymentsReceived,
          made: paymentsMade,
          net: paymentsReceived - paymentsMade
        },
        expenses: {
          total: expensesTotal,
          count: expenses?.length || 0
        },
        outstanding: {
          receivable: salesUnpaid,
          payable: purchaseUnpaid
        },
        profit
      })
    } catch (error) {
      console.error('Error loading reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDateRange = () => {
    const now = new Date()
    let start = ''
    let end = now.toISOString().split('T')[0]

    if (dateRange === 'custom') {
      start = startDate
      end = endDate
    } else if (dateRange === 'today') {
      start = end
    } else if (dateRange === 'this_week') {
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - now.getDay())
      start = weekStart.toISOString().split('T')[0]
    } else if (dateRange === 'this_month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    } else if (dateRange === 'this_quarter') {
      const quarter = Math.floor(now.getMonth() / 3)
      start = new Date(now.getFullYear(), quarter * 3, 1).toISOString().split('T')[0]
    } else if (dateRange === 'this_year') {
      start = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0]
    }

    return { start, end }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  const reportTypes = [
    {
      title: 'Sales Report',
      description: 'Detailed sales invoice report',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Purchase Report',
      description: 'Purchase invoice summary',
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      title: 'Payment Report',
      description: 'Payment received and made',
      icon: DollarSign,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Outstanding Report',
      description: 'Receivables and payables',
      icon: FileText,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'Expense Report',
      description: 'Business expenses breakdown',
      icon: Receipt,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Profit & Loss',
      description: 'P&L statement',
      icon: BarChart3,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    },
    {
      title: 'GST Report',
      description: 'GST summary for filing',
      icon: PieChart,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50'
    },
    {
      title: 'Customer Statement',
      description: 'Customer-wise statement',
      icon: FileText,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">Financial reports and insights</p>
        </div>
      </div>

      {/* Date Range Filter */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="today">Today</option>
                <option value="this_week">This Week</option>
                <option value="this_month">This Month</option>
                <option value="this_quarter">This Quarter</option>
                <option value="this_year">This Year</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {dateRange === 'custom' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </>
            )}

            <Button onClick={loadReports} className="bg-blue-600 hover:bg-blue-700">
              <Calendar className="h-4 w-4 mr-2" />
              Apply Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.sales.total)}</div>
            <p className="text-xs text-gray-500 mt-1">{stats.sales.count} invoices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(stats.purchases.total)}</div>
            <p className="text-xs text-gray-500 mt-1">{stats.purchases.count} invoices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Cash Flow</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(stats.payments.net)}</div>
            <p className="text-xs text-gray-500 mt-1">
              Received: {formatCurrency(stats.payments.received)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit</CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(stats.profit)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Expenses: {formatCurrency(stats.expenses.total)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Sales Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Sales:</span>
              <span className="font-semibold text-green-600">{formatCurrency(stats.sales.total)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Paid Amount:</span>
              <span className="font-semibold text-green-600">{formatCurrency(stats.sales.paid)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Outstanding:</span>
              <span className="font-semibold text-orange-600">{formatCurrency(stats.sales.unpaid)}</span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t">
              <span className="text-gray-600">Total Invoices:</span>
              <span className="font-semibold">{stats.sales.count}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Purchase Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Purchases:</span>
              <span className="font-semibold text-red-600">{formatCurrency(stats.purchases.total)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Paid Amount:</span>
              <span className="font-semibold text-red-600">{formatCurrency(stats.purchases.paid)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Outstanding:</span>
              <span className="font-semibold text-orange-600">{formatCurrency(stats.purchases.unpaid)}</span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t">
              <span className="text-gray-600">Total Invoices:</span>
              <span className="font-semibold">{stats.purchases.count}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Types */}
      <Card>
        <CardHeader>
          <CardTitle>Available Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {reportTypes.map((report, index) => {
              const Icon = report.icon
              return (
                <div
                  key={index}
                  className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className={`w-12 h-12 ${report.bgColor} rounded-lg flex items-center justify-center mb-3`}>
                    <Icon className={`h-6 w-6 ${report.color}`} />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{report.title}</h3>
                  <p className="text-sm text-gray-600 mb-3">{report.description}</p>
                  <Button variant="outline" size="sm" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Generate
                  </Button>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
