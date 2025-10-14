'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  BarChart3,
  DollarSign,
  Receipt,
  Users,
  TrendingUp,
  Clock,
  MessageSquare,
  Bot,
  Building2,
} from 'lucide-react'

export default function DashboardPage() {
  const supabase = createClientComponentClient()
  const [stats, setStats] = useState({
    totalInvoices: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    pendingAmount: 0,
    recentInvoices: [],
  })
  const [showOrgSetup, setShowOrgSetup] = useState(false)
  const [orgFormData, setOrgFormData] = useState({
    name: '',
    email: '',
    phone: '',
    website: '',
    gstin: ''
  })

  useEffect(() => {
    checkOrganization()
    loadDashboardData()
  }, [])

  const checkOrganization = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Check if user is system admin (they don't need an org)
      const { data: systemAdmin } = await supabase
        .from('system_admins')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle()

      if (systemAdmin) return // System admins don't need org

      // Check if user has an organization
      const { data: orgMember } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!orgMember) {
        // Get user's profile data to pre-fill the form
        const { data: profile } = await supabase
          .from('profiles')
          .select('email, phone')
          .eq('id', user.id)
          .single()

        if (profile) {
          setOrgFormData({
            ...orgFormData,
            email: profile.email || '',
            phone: profile.phone || ''
          })
        }

        // User doesn't have an organization, show setup modal
        setShowOrgSetup(true)
      }
    } catch (error) {
      console.error('Error checking organization:', error)
    }
  }

  const handleCreateOrganization = async () => {
    if (!orgFormData.name.trim()) {
      alert('Organization name is required')
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Create organization
      const { data: newOrg, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: orgFormData.name,
          email: orgFormData.email,
          phone: orgFormData.phone,
          website: orgFormData.website,
          gstin: orgFormData.gstin,
          subscription_tier: 'free',
          subscription_status: 'active'
        })
        .select()
        .single()

      if (orgError) throw orgError

      // Add user as owner of the organization
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: newOrg.id,
          user_id: user.id,
          role: 'owner',
          is_active: true
        })

      if (memberError) throw memberError

      alert('Organization created successfully!')
      setShowOrgSetup(false)
      // Reload dashboard data without full page reload
      loadDashboardData()
    } catch (error: any) {
      console.error('Error creating organization:', error)
      alert('Failed to create organization: ' + error.message)
    }
  }

  const loadDashboardData = async () => {
    try {
      // Get current user's organization
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Mock data for now - replace with actual queries
      setStats({
        totalInvoices: 12,
        totalRevenue: 125000,
        totalCustomers: 45,
        pendingAmount: 15000,
        recentInvoices: [],
      })
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back!
          </h1>
          <p className="text-gray-600">
            Here's what's happening with your business today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                +20.1% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Invoices
              </CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalInvoices}</div>
              <p className="text-xs text-muted-foreground">
                +2 since last week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Customers
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCustomers}</div>
              <p className="text-xs text-muted-foreground">
                +5 new this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Amount
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.pendingAmount.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                From 3 invoices
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Recent Activity */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Recent Invoices</CardTitle>
              <CardDescription>Your latest billing activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between border-b pb-4">
                    <div>
                      <p className="font-medium">Invoice INV-2024-00{i}</p>
                      <p className="text-sm text-gray-500">Customer Name {i}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₹{(25000 * i).toLocaleString()}</p>
                      <p className="text-sm text-gray-500">
                        {i === 1 ? 'Paid' : i === 2 ? 'Sent' : 'Overdue'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full justify-start" variant="outline">
                <Receipt className="mr-2 h-4 w-4" />
                Create Invoice
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Users className="mr-2 h-4 w-4" />
                Add Customer
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <MessageSquare className="mr-2 h-4 w-4" />
                Send Campaign
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <BarChart3 className="mr-2 h-4 w-4" />
                View Reports
              </Button>
            </CardContent>
          </Card>

          {/* Sales Chart Placeholder */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Revenue Overview</CardTitle>
              <CardDescription>Monthly revenue for the last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end justify-around space-x-2">
                {[40, 60, 45, 70, 55, 80].map((height, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-blue-600 rounded-t"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
              <div className="flex justify-around mt-2 text-sm text-gray-500">
                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month) => (
                  <span key={month}>{month}</span>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* AI Insights */}
          <Card>
            <CardHeader>
              <CardTitle>AI Insights</CardTitle>
              <CardDescription>Powered by AI Copilot</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-2">
                  <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Revenue is up 20%</p>
                    <p className="text-xs text-gray-500">Compared to last month</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <Clock className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">3 overdue invoices</p>
                    <p className="text-xs text-gray-500">Send reminders now</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <MessageSquare className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Good time for a campaign</p>
                    <p className="text-xs text-gray-500">Based on customer engagement</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Organization Setup Modal */}
        {showOrgSetup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">Welcome! Let's set up your organization</h3>
                    <p className="text-sm text-gray-600 font-normal mt-1">
                      Please provide your organization details to get started
                    </p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Organization Name *
                    </label>
                    <input
                      type="text"
                      value={orgFormData.name}
                      onChange={(e) => setOrgFormData({ ...orgFormData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter your organization name"
                      autoFocus
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={orgFormData.email}
                        onChange={(e) => setOrgFormData({ ...orgFormData, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        placeholder="organization@example.com"
                        autoComplete="email"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={orgFormData.phone}
                        onChange={(e) => setOrgFormData({ ...orgFormData, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        placeholder="+91 1234567890"
                        autoComplete="tel"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Website (Optional)
                      </label>
                      <input
                        type="url"
                        value={orgFormData.website}
                        onChange={(e) => setOrgFormData({ ...orgFormData, website: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        GSTIN (Optional)
                      </label>
                      <input
                        type="text"
                        value={orgFormData.gstin}
                        onChange={(e) => setOrgFormData({ ...orgFormData, gstin: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="22AAAAA0000A1Z5"
                      />
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> You will be assigned as the owner of this organization with full access to all features.
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t">
                  <Button
                    onClick={handleCreateOrganization}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6"
                  >
                    Create Organization & Get Started
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
