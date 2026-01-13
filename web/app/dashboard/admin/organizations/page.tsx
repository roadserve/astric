'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Building2,
  Users,
  DollarSign,
  Plus,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  TrendingUp
} from 'lucide-react'

export default function OrganizationsPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [organizations, setOrganizations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isSystemAdmin, setIsSystemAdmin] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedOrg, setSelectedOrg] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    website: '',
    gstin: '',
    subscription_tier: 'free',
    subscription_status: 'active'
  })

  useEffect(() => {
    checkAccessAndLoadData()
  }, [])

  const checkAccessAndLoadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Check if user is system admin
      const { data: systemAdmin } = await supabase
        .from('system_admins')
        .select('id, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle()

      if (!systemAdmin) {
        // Check if org admin
        const { data: orgMember } = await supabase
          .from('organization_members')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle()

        if (orgMember?.role !== 'owner' && orgMember?.role !== 'manager') {
          router.push('/dashboard')
          return
        }
      }

      setIsSystemAdmin(!!systemAdmin)
      await loadOrganizations(!!systemAdmin, user.id)
    } catch (error) {
      console.error('Error checking access:', error)
      router.push('/dashboard')
    }
  }

  const loadOrganizations = async (isSystemAdmin: boolean, userId: string) => {
    setLoading(true)
    try {
      let orgsQuery = supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false })

      // If not system admin, only show their organization
      if (!isSystemAdmin) {
        const { data: orgMember } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', userId)
          .maybeSingle()

        if (orgMember) {
          orgsQuery = orgsQuery.eq('id', orgMember.organization_id)
        }
      }

      const { data: orgsData, error } = await orgsQuery

      if (error) {
        console.error('Error loading organizations:', error)
        return
      }

      // Load member counts and stats for each organization
      const orgsWithStats = await Promise.all(
        (orgsData || []).map(async (org) => {
          // Get member count
          const { count: memberCount } = await supabase
            .from('organization_members')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', org.id)

          // Get customer count
          const { count: customerCount } = await supabase
            .from('billing_customers')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', org.id)

          // Get total revenue
          const { data: invoices } = await supabase
            .from('billing_invoices')
            .select('total_amount')
            .eq('organization_id', org.id)

          const totalRevenue = invoices?.reduce((sum, inv) => sum + Number(inv.total_amount), 0) || 0

          return {
            ...org,
            memberCount: memberCount || 0,
            customerCount: customerCount || 0,
            totalRevenue
          }
        })
      )

      setOrganizations(orgsWithStats)
    } catch (error) {
      console.error('Error loading organizations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddOrganization = () => {
    setSelectedOrg(null)
    setFormData({
      name: '',
      email: '',
      phone: '',
      website: '',
      gstin: '',
      subscription_tier: 'free',
      subscription_status: 'active'
    })
    setShowAddModal(true)
  }

  const handleEditOrganization = (org: any) => {
    setSelectedOrg(org)
    setFormData({
      name: org.name || '',
      email: org.email || '',
      phone: org.phone || '',
      website: org.website || '',
      gstin: org.gstin || '',
      subscription_tier: org.subscription_tier || 'free',
      subscription_status: org.subscription_status || 'active'
    })
    setShowEditModal(true)
  }

  const handleCreateOrganization = async () => {
    if (!formData.name.trim()) {
      alert('Organization name is required')
      return
    }

    try {
      const { error } = await supabase
        .from('organizations')
        .insert({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          website: formData.website,
          gstin: formData.gstin,
          subscription_tier: formData.subscription_tier,
          subscription_status: formData.subscription_status
        })

      if (error) throw error

      alert('Organization created successfully!')
      setShowAddModal(false)
      checkAccessAndLoadData()
    } catch (error: any) {
      console.error('Error creating organization:', error)
      alert('Failed to create organization: ' + error.message)
    }
  }

  const handleSaveOrganization = async () => {
    if (!selectedOrg) return

    try {
      const { error } = await supabase
        .from('organizations')
        .update({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          website: formData.website,
          gstin: formData.gstin,
          subscription_tier: formData.subscription_tier,
          subscription_status: formData.subscription_status,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedOrg.id)

      if (error) throw error

      alert('Organization updated successfully!')
      setShowEditModal(false)
      checkAccessAndLoadData()
    } catch (error: any) {
      console.error('Error updating organization:', error)
      alert('Failed to update organization: ' + error.message)
    }
  }

  const handleDeleteOrganization = async (orgId: string, orgName: string) => {
    if (!confirm(`Are you sure you want to delete "${orgName}"? This will delete all associated data including users, customers, and invoices. This action cannot be undone.`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', orgId)

      if (error) throw error

      alert('Organization deleted successfully')
      checkAccessAndLoadData()
    } catch (error: any) {
      console.error('Error deleting organization:', error)
      alert('Failed to delete organization: ' + error.message)
    }
  }

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
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Organizations</h1>
            <p className="text-gray-600 mt-1">
              {isSystemAdmin ? 'Manage all organizations in the system' : 'Manage your organization'}
            </p>
          </div>
          {isSystemAdmin && (
            <Button 
              onClick={handleAddOrganization}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Organization
            </Button>
          )}
        </div>

        {/* Organizations List */}
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading organizations...</p>
            </div>
          ) : organizations.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No organizations found</h3>
                  <p className="text-gray-600">Get started by creating your first organization</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {organizations.map((org) => (
                <Card key={org.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                          <Building2 className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{org.name}</CardTitle>
                          <p className="text-sm text-gray-500 mt-1">
                            {org.subscription_tier || 'free'} plan
                          </p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        org.subscription_status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {org.subscription_status || 'active'}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Stats */}
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Users className="h-4 w-4" />
                          <span>Members</span>
                        </div>
                        <span className="text-sm font-semibold">{org.memberCount}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Users className="h-4 w-4" />
                          <span>Customers</span>
                        </div>
                        <span className="text-sm font-semibold">{org.customerCount}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <DollarSign className="h-4 w-4" />
                          <span>Revenue</span>
                        </div>
                        <span className="text-sm font-semibold text-green-600">
                          {formatCurrency(org.totalRevenue)}
                        </span>
                      </div>
                    </div>

                    {/* Contact Info */}
                    {(org.email || org.phone) && (
                      <div className="border-t pt-3 mb-4">
                        {org.email && (
                          <p className="text-xs text-gray-600">📧 {org.email}</p>
                        )}
                        {org.phone && (
                          <p className="text-xs text-gray-600 mt-1">📞 {org.phone}</p>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => router.push(`/dashboard/admin/users?org=${org.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      {isSystemAdmin && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditOrganization(org)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteOrganization(org.id, org.name)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>

                    {/* Created Date */}
                    <p className="text-xs text-gray-400 mt-3 text-center">
                      Created {new Date(org.created_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Edit Organization Modal */}
        {showEditModal && selectedOrg && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-6 w-6 text-blue-600" />
                    <h3 className="text-xl font-bold">Edit Organization</h3>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowEditModal(false)}
                  >
                    ✕
                  </Button>
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
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter organization name"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="email@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="+91 1234567890"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Website
                      </label>
                      <input
                        type="url"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        GSTIN
                      </label>
                      <input
                        type="text"
                        value={formData.gstin}
                        onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="22AAAAA0000A1Z5"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Subscription Tier
                      </label>
                      <select
                        value={formData.subscription_tier}
                        onChange={(e) => setFormData({ ...formData, subscription_tier: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="free">Free</option>
                        <option value="basic">Basic</option>
                        <option value="professional">Professional</option>
                        <option value="enterprise">Enterprise</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        value={formData.subscription_status}
                        onChange={(e) => setFormData({ ...formData, subscription_status: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="suspended">Suspended</option>
                        <option value="trial">Trial</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6 pt-6 border-t">
                  <Button
                    onClick={handleSaveOrganization}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    Save Changes
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Add Organization Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-6 w-6 text-blue-600" />
                    <h3 className="text-xl font-bold">Add New Organization</h3>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddModal(false)}
                  >
                    ✕
                  </Button>
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
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter organization name"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="email@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="+91 1234567890"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Website
                      </label>
                      <input
                        type="url"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        GSTIN
                      </label>
                      <input
                        type="text"
                        value={formData.gstin}
                        onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="22AAAAA0000A1Z5"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Subscription Tier
                      </label>
                      <select
                        value={formData.subscription_tier}
                        onChange={(e) => setFormData({ ...formData, subscription_tier: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="free">Free</option>
                        <option value="basic">Basic</option>
                        <option value="professional">Professional</option>
                        <option value="enterprise">Enterprise</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        value={formData.subscription_status}
                        onChange={(e) => setFormData({ ...formData, subscription_status: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="suspended">Suspended</option>
                        <option value="trial">Trial</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6 pt-6 border-t">
                  <Button
                    onClick={handleCreateOrganization}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    Create Organization
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1"
                  >
                    Cancel
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
