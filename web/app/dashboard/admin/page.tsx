'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Shield,
  Users,
  Settings,
  Database,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Server,
  HardDrive,
  Cpu,
  Zap
} from 'lucide-react'

export default function AdminPortalPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [checkingAccess, setCheckingAccess] = useState(true)
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalOrganizations: 0,
    totalInvoices: 0,
    totalRevenue: 0,
    systemHealth: 'healthy',
    apiCalls: 0,
    storageUsed: 0
  })

  useEffect(() => {
    checkAdminAccess()
  }, [])

  const checkAdminAccess = async () => {
    setCheckingAccess(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      console.log('Checking admin access for user:', user.id)

      // First, check if user is a system admin
      const { data: systemAdmin, error: systemAdminError } = await supabase
        .from('system_admins')
        .select('id, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle()

      if (systemAdmin) {
        console.log('✅ System Admin (Level 1) - Full access granted')
        setIsAdmin(true)
        loadAdminStats()
        setCheckingAccess(false)
        return
      }

      // Level 2: Customer Interface - Redirect to customer dashboard
      console.log('❌ Not a system admin - Redirecting to customer dashboard')
      router.push('/dashboard')
    } catch (error) {
      console.error('Error checking admin access:', error)
      setIsAdmin(false)
    } finally {
      setCheckingAccess(false)
    }
  }

  const loadAdminStats = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Check if user is system admin
      const { data: systemAdmin } = await supabase
        .from('system_admins')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle()

      // Load users (all profiles for system admin)
      const { data: profiles } = await supabase.from('profiles').select('id, created_at')
      
      // Load organizations (all for system admin, filtered for org admin)
      let organizationsQuery = supabase.from('organizations').select('id')
      
      // If not system admin, only show their organization
      if (!systemAdmin) {
        const { data: orgMember } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', user.id)
          .maybeSingle()
        
        if (orgMember) {
          organizationsQuery = organizationsQuery.eq('id', orgMember.organization_id)
        }
      }
      
      const { data: organizations } = await organizationsQuery
      
      // Load invoices (all for system admin, filtered for org admin)
      let invoicesQuery = supabase.from('billing_invoices').select('total_amount, organization_id')
      
      if (!systemAdmin) {
        const { data: orgMember } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', user.id)
          .maybeSingle()
        
        if (orgMember) {
          invoicesQuery = invoicesQuery.eq('organization_id', orgMember.organization_id)
        }
      }
      
      const { data: invoices } = await invoicesQuery
      
      const totalRevenue = invoices?.reduce((sum, inv) => sum + Number(inv.total_amount), 0) || 0
      
      // Calculate active users (created in last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const activeUsers = profiles?.filter(p => new Date(p.created_at) > thirtyDaysAgo).length || 0

      setStats({
        totalUsers: profiles?.length || 0,
        activeUsers,
        totalOrganizations: organizations?.length || 0,
        totalInvoices: invoices?.length || 0,
        totalRevenue,
        systemHealth: 'healthy',
        apiCalls: 125847,
        storageUsed: 2.4
      })
    } catch (error) {
      console.error('Error loading admin stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }


  // Show loading state while checking access
  if (checkingAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking access permissions...</p>
        </div>
      </div>
    )
  }

  // Show access denied if not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
              <p className="text-gray-600 mb-6">
                You don't have permission to access the Admin Portal. This area is restricted to administrators only.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-yellow-800">
                  <strong>Required Role:</strong> Owner or Manager
                </p>
              </div>
              <Button 
                onClick={() => router.push('/dashboard')}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl flex items-center justify-center">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Overview</h1>
              <p className="text-gray-600">System administration and monitoring</p>
            </div>
          </div>
        </div>

        {/* Overview Content */}
        <>
            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-4 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalUsers}</div>
                  <p className="text-xs text-gray-500 mt-1">{stats.activeUsers} active</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Organizations</CardTitle>
                  <Shield className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalOrganizations}</div>
                  <p className="text-xs text-gray-500 mt-1">Active accounts</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalRevenue)}</div>
                  <p className="text-xs text-gray-500 mt-1">{stats.totalInvoices} invoices</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">System Health</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">Healthy</div>
                  <p className="text-xs text-gray-500 mt-1">All systems operational</p>
                </CardContent>
              </Card>
            </div>

            {/* System Metrics */}
            <div className="grid gap-6 md:grid-cols-2 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-600" />
                    API Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-gray-600">API Calls (24h)</span>
                        <span className="text-sm font-semibold">{stats.apiCalls.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-gray-600">Avg Response Time</span>
                        <span className="text-sm font-semibold">145ms</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: '90%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-gray-600">Success Rate</span>
                        <span className="text-sm font-semibold">99.8%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: '99.8%' }}></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HardDrive className="h-5 w-5 text-purple-600" />
                    Storage & Resources
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-gray-600">Storage Used</span>
                        <span className="text-sm font-semibold">{stats.storageUsed} GB / 10 GB</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: '24%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-gray-600">CPU Usage</span>
                        <span className="text-sm font-semibold">35%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '35%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-gray-600">Memory Usage</span>
                        <span className="text-sm font-semibold">2.1 GB / 4 GB</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-orange-600 h-2 rounded-full" style={{ width: '52.5%' }}></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { action: 'New user registered', user: 'john@example.com', time: '2 minutes ago', type: 'success' },
                    { action: 'Invoice created', user: 'ABC Corp', time: '15 minutes ago', type: 'info' },
                    { action: 'Payroll processed', user: 'XYZ Ltd', time: '1 hour ago', type: 'success' },
                    { action: 'WhatsApp campaign sent', user: 'Marketing Team', time: '2 hours ago', type: 'info' },
                    { action: 'Failed login attempt', user: 'unknown@test.com', time: '3 hours ago', type: 'warning' }
                  ].map((activity, i) => (
                    <div key={i} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          activity.type === 'success' ? 'bg-green-500' :
                          activity.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                        }`}></div>
                        <div>
                          <p className="font-medium text-gray-900">{activity.action}</p>
                          <p className="text-sm text-gray-600">{activity.user}</p>
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">{activity.time}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
      </div>
    </div>
  )
}
