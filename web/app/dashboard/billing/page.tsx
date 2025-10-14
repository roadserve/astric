'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { 
  FileText,
  Users,
  Package,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Receipt,
  CreditCard,
  ShoppingCart,
  FileSpreadsheet,
  PlusCircle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'

interface DashboardStats {
  totalSales: number
  totalPurchases: number
  totalReceivables: number
  totalPayables: number
  totalInvoices: number
  totalCustomers: number
  totalProducts: number
  recentInvoices: any[]
  recentPayments: any[]
}

export default function BillingDashboard() {
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)

  useEffect(() => {
    loadDashboardStats()
  }, [])

  const loadDashboardStats = async () => {
    setLoading(true)
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .single()

      const { data: orgMember } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', profile?.id)
        .single()

      // Get invoice stats
      const { data: invoices } = await supabase
        .from('billing_invoices')
        .select('*')
        .eq('organization_id', orgMember?.organization_id)

      const salesInvoices = invoices?.filter(i => i.invoice_type === 'sales') || []
      const purchaseInvoices = invoices?.filter(i => i.invoice_type === 'purchase') || []

      const totalSales = salesInvoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0)
      const totalPurchases = purchaseInvoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0)
      const totalReceivables = salesInvoices.reduce((sum, inv) => sum + Number(inv.balance_amount), 0)
      const totalPayables = purchaseInvoices.reduce((sum, inv) => sum + Number(inv.balance_amount), 0)

      // Get customer count
      const { count: customerCount } = await supabase
        .from('billing_customers')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgMember?.organization_id)

      // Get product count
      const { count: productCount } = await supabase
        .from('billing_products')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgMember?.organization_id)

      // Get recent invoices
      const { data: recentInvoices } = await supabase
        .from('billing_invoices')
        .select('*, customer:billing_customers(name)')
        .eq('organization_id', orgMember?.organization_id)
        .order('created_at', { ascending: false })
        .limit(5)

      // Get recent payments
      const { data: recentPayments } = await supabase
        .from('billing_payments')
        .select('*, customer:billing_customers(name)')
        .eq('organization_id', orgMember?.organization_id)
        .order('created_at', { ascending: false })
        .limit(5)

      setStats({
        totalSales,
        totalPurchases,
        totalReceivables,
        totalPayables,
        totalInvoices: invoices?.length || 0,
        totalCustomers: customerCount || 0,
        totalProducts: productCount || 0,
        recentInvoices: recentInvoices || [],
        recentPayments: recentPayments || []
      })
    } catch (error) {
      console.error('Error loading dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const quickActions = [
    { label: 'New Invoice', icon: FileText, href: '/dashboard/billing/invoices/create', color: 'bg-blue-500' },
    { label: 'New Customer', icon: Users, href: '/dashboard/billing/customers/create', color: 'bg-green-500' },
    { label: 'New Product', icon: Package, href: '/dashboard/billing/products/create', color: 'bg-purple-500' },
    { label: 'Record Payment', icon: CreditCard, href: '/dashboard/billing/payments/create', color: 'bg-orange-500' },
  ]

  const modules = [
    { label: 'Invoices', icon: FileText, href: '/dashboard/billing/invoices', count: stats?.totalInvoices },
    { label: 'Customers', icon: Users, href: '/dashboard/billing/customers', count: stats?.totalCustomers },
    { label: 'Products', icon: Package, href: '/dashboard/billing/products', count: stats?.totalProducts },
    { label: 'Payments', icon: CreditCard, href: '/dashboard/billing/payments', count: null },
    { label: 'Quotations', icon: FileSpreadsheet, href: '/dashboard/billing/quotations', count: null },
    { label: 'Expenses', icon: Receipt, href: '/dashboard/billing/expenses', count: null },
    { label: 'Reports', icon: TrendingUp, href: '/dashboard/billing/reports', count: null },
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Billing & Invoicing</h1>
        <p className="text-gray-600 mt-1">Manage your business finances</p>
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            Loading dashboard...
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {quickActions.map((action) => {
                  const Icon = action.icon
                  return (
                    <Link key={action.label} href={action.href}>
                      <div className="flex flex-col items-center p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all cursor-pointer">
                        <div className={`${action.color} p-3 rounded-full mb-3`}>
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">{action.label}</span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                <ArrowUpRight className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(stats?.totalSales || 0)}
                </div>
                <p className="text-xs text-gray-500 mt-1">Revenue from sales</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
                <ArrowDownRight className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(stats?.totalPurchases || 0)}
                </div>
                <p className="text-xs text-gray-500 mt-1">Expenses from purchases</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Receivables</CardTitle>
                <DollarSign className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(stats?.totalReceivables || 0)}
                </div>
                <p className="text-xs text-gray-500 mt-1">Amount to receive</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Payables</CardTitle>
                <DollarSign className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency(stats?.totalPayables || 0)}
                </div>
                <p className="text-xs text-gray-500 mt-1">Amount to pay</p>
              </CardContent>
            </Card>
          </div>

          {/* Modules Grid */}
          <Card>
            <CardHeader>
              <CardTitle>Billing Modules</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {modules.map((module) => {
                  const Icon = module.icon
                  return (
                    <Link key={module.label} href={module.href}>
                      <div className="p-6 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all cursor-pointer">
                        <Icon className="h-8 w-8 text-blue-600 mb-3" />
                        <h3 className="font-semibold text-gray-900 mb-1">{module.label}</h3>
                        {module.count !== null && module.count !== undefined && (
                          <p className="text-sm text-gray-500">{module.count} total</p>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Recent Invoices */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Invoices</CardTitle>
                  <Link href="/dashboard/billing/invoices">
                    <Button variant="ghost" size="sm">View All</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {stats?.recentInvoices && stats.recentInvoices.length > 0 ? (
                  <div className="space-y-3">
                    {stats.recentInvoices.map((invoice) => (
                      <div key={invoice.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{invoice.invoice_number}</p>
                          <p className="text-sm text-gray-500">{invoice.customer?.name || 'N/A'}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            {formatCurrency(Number(invoice.total_amount))}
                          </p>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            invoice.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                            invoice.payment_status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {invoice.payment_status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">No invoices yet</p>
                )}
              </CardContent>
            </Card>

            {/* Recent Payments */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Payments</CardTitle>
                  <Link href="/dashboard/billing/payments">
                    <Button variant="ghost" size="sm">View All</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {stats?.recentPayments && stats.recentPayments.length > 0 ? (
                  <div className="space-y-3">
                    {stats.recentPayments.map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{payment.customer?.name || 'N/A'}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(payment.payment_date).toLocaleDateString()} • {payment.payment_method}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${
                            payment.payment_type === 'received' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {payment.payment_type === 'received' ? '+' : '-'}
                            {formatCurrency(Number(payment.amount))}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">No payments yet</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6 text-sm">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">1. Add Customers</h4>
                  <p className="text-gray-600">Start by adding your customers and suppliers to the system.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">2. Add Products</h4>
                  <p className="text-gray-600">Create your product/service catalog with pricing and tax details.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">3. Create Invoices</h4>
                  <p className="text-gray-600">Generate professional invoices and track payments easily.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}