'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Users,
  Plus,
  Edit,
  Trash2,
  Shield,
  Lock,
  Unlock,
  Mail,
  Check,
  X,
  Settings as SettingsIcon
} from 'lucide-react'

const MODULES = [
  { id: 'dashboard', name: 'Dashboard', icon: '📊' },
  { id: 'billing', name: 'Billing System', icon: '💰' },
  { id: 'payroll', name: 'Payroll Management', icon: '💼' },
  { id: 'whatsapp_crm', name: 'WhatsApp CRM', icon: '💬' },
  { id: 'social_media', name: 'Social Media', icon: '📱' },
  { id: 'gmb', name: 'Google My Business', icon: '🏢' },
  { id: 'analytics', name: 'Analytics', icon: '📈' },
  { id: 'customers', name: 'Customers', icon: '👥' },
  { id: 'products', name: 'Products', icon: '📦' },
  { id: 'attendance', name: 'Attendance', icon: '📅' },
  { id: 'ai_copilot', name: 'AI Copilot', icon: '🤖' },
  { id: 'settings', name: 'Settings', icon: '⚙️' }
]

const PERMISSION_LEVELS = [
  { value: 'none', label: 'No Access', color: 'bg-gray-100 text-gray-800' },
  { value: 'view', label: 'View Only', color: 'bg-blue-100 text-blue-800' },
  { value: 'edit', label: 'View & Edit', color: 'bg-green-100 text-green-800' },
  { value: 'full', label: 'Full Access', color: 'bg-purple-100 text-purple-800' }
]

export default function AdminUsersPage() {
  const supabase = createClientComponentClient()
  const [users, setUsers] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteFullName, setInviteFullName] = useState('')
  const [inviteRole, setInviteRole] = useState<'owner' | 'manager' | 'accountant' | 'hr' | 'staff'>('staff')
  const [inviteOrganizations, setInviteOrganizations] = useState<Array<{ id: string; name: string }>>([])
  const [inviteOrganizationId, setInviteOrganizationId] = useState<string>('')
  const [inviteMode, setInviteMode] = useState<'invite' | 'create_with_password'>('invite')
  const [tempPassword, setTempPassword] = useState('')
  const [tempPasswordConfirm, setTempPasswordConfirm] = useState('')
  const [inviting, setInviting] = useState(false)
  const [showPermissionsModal, setShowPermissionsModal] = useState(false)
  const [showEditRoleModal, setShowEditRoleModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [userPermissions, setUserPermissions] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'users' | 'customers'>('users')
  const [newRole, setNewRole] = useState<string>('')
  const [isSystemAdmin, setIsSystemAdmin] = useState(false)

  useEffect(() => {
    checkSystemAdminAndLoad()
  }, [])

  const checkSystemAdminAndLoad = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: systemAdmin } = await supabase
        .from('system_admins')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle()

      setIsSystemAdmin(!!systemAdmin)
      // Load org choices for invite (supports multi-org users & system admins)
      try {
        const { data: orgsFromMembership } = await supabase
          .from('organization_members')
          .select('organization_id, organizations(name)')
          .eq('user_id', user.id)

        const normalized = (orgsFromMembership || [])
          .map((m: any) => ({
            id: String(m.organization_id),
            name: String(m.organizations?.name || m.organization_id),
          }))
          .filter((o: any) => o.id)

        let list = normalized

        if (!list.length && systemAdmin) {
          const { data: allOrgs } = await supabase.from('organizations').select('id,name').order('created_at', { ascending: false })
          list = (allOrgs || []).map((o: any) => ({ id: String(o.id), name: String(o.name || o.id) }))
        }

        setInviteOrganizations(list)
        if (!inviteOrganizationId && list.length === 1) setInviteOrganizationId(list[0].id)
      } catch {
        // ignore - invite will still work for single-org non-admins
      }
      loadUsers()
      loadCustomers()
    } catch (error) {
      console.error('Error checking system admin:', error)
    }
  }

  const loadUsers = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.error('No user logged in')
        return
      }

      // Check if user is system admin
      const { data: systemAdmin } = await supabase
        .from('system_admins')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle()

      let membersQuery = supabase
        .from('organization_members')
        .select(`
          id,
          user_id,
          organization_id,
          role,
          is_active,
          joined_at,
          profiles!inner (
            id,
            email,
            full_name,
            avatar_url
          )
        `)

      // If not system admin, filter by their organization
      if (!systemAdmin) {
        const { data: orgMember } = await supabase
          .from('organization_members')
          .select('organization_id, role')
          .eq('user_id', user.id)
          .single()

        if (!orgMember) {
          console.error('No organization found')
          return
        }

        // Check if current user is admin (owner or manager)
        if (orgMember.role !== 'owner' && orgMember.role !== 'manager') {
          console.error('Access denied. Admin privileges required.')
          return
        }

        membersQuery = membersQuery.eq('organization_id', orgMember.organization_id)
      }

      // Load users
      const { data: members, error } = await membersQuery

      if (error) {
        console.error('Error loading users:', error)
        return
      }

      // Transform data to match expected structure
      const transformedMembers = members?.map(m => ({
        ...m,
        user: m.profiles
      })) || []

      setUsers(transformedMembers)
    } catch (error: any) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCustomers = async () => {
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

      let customersQuery = supabase
        .from('billing_customers')
        .select('*')
        .order('created_at', { ascending: false })

      // If not system admin, filter by their organization
      if (!systemAdmin) {
        const { data: orgMember } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', user.id)
          .single()

        if (!orgMember) return

        customersQuery = customersQuery.eq('organization_id', orgMember.organization_id)
      }

      const { data: customersData, error } = await customersQuery

      if (error) {
        console.error('Error loading customers:', error)
        return
      }

      setCustomers(customersData || [])
    } catch (error) {
      console.error('Error loading customers:', error)
    }
  }

  const loadUserPermissions = async (userId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: orgMember } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single()

      if (!orgMember) return

      // Load user's module permissions
      const { data: permissions, error } = await supabase
        .from('user_module_permissions')
        .select('*')
        .eq('organization_id', orgMember.organization_id)
        .eq('user_id', userId)

      if (error) {
        console.error('Error loading permissions:', error)
        return
      }

      // Convert to object for easy access
      const permissionsObj: any = {}
      permissions?.forEach(p => {
        permissionsObj[p.module] = {
          permission_level: p.permission_level,
          is_enabled: p.is_enabled
        }
      })

      // Set default permissions for modules without explicit permissions
      MODULES.forEach(module => {
        if (!permissionsObj[module.id]) {
          permissionsObj[module.id] = {
            permission_level: 'none',
            is_enabled: false
          }
        }
      })

      setUserPermissions(permissionsObj)
    } catch (error) {
      console.error('Error loading permissions:', error)
    }
  }

  const handleManagePermissions = async (user: any) => {
    setSelectedUser(user)
    await loadUserPermissions(user.user_id)
    setShowPermissionsModal(true)
  }

  const handlePermissionChange = (moduleId: string, level: string) => {
    setUserPermissions({
      ...userPermissions,
      [moduleId]: {
        permission_level: level,
        is_enabled: level !== 'none'
      }
    })
  }

  const handleSavePermissions = async () => {
    if (!selectedUser) return

    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('Please log in')
        return
      }

      const { data: orgMember } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single()

      if (!orgMember) {
        alert('Organization not found')
        return
      }

      // Delete existing permissions
      const { error: deleteError } = await supabase
        .from('user_module_permissions')
        .delete()
        .eq('organization_id', orgMember.organization_id)
        .eq('user_id', selectedUser.user_id)

      if (deleteError) {
        console.error('Error deleting old permissions:', deleteError)
      }

      // Insert new permissions (including 'none' permissions for tracking)
      const permissionsToInsert = Object.entries(userPermissions)
        .map(([module, perm]: any) => ({
          organization_id: orgMember.organization_id,
          user_id: selectedUser.user_id,
          module,
          permission_level: perm.permission_level,
          is_enabled: perm.permission_level !== 'none',
          granted_by: user.id
        }))

      if (permissionsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('user_module_permissions')
          .insert(permissionsToInsert)

        if (insertError) {
          console.error('Insert error:', insertError)
          throw insertError
        }
      }

      alert('Permissions updated successfully!')
      setShowPermissionsModal(false)
      loadUsers()
    } catch (error: any) {
      console.error('Error saving permissions:', error)
      alert('Failed to update permissions: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('organization_members')
        .update({ is_active: !currentStatus })
        .eq('user_id', userId)

      if (error) throw error
      loadUsers()
    } catch (error) {
      console.error('Error toggling user status:', error)
      alert('Failed to update user status')
    }
  }

  const handleEditRole = (member: any) => {
    setSelectedUser(member)
    setNewRole(member.role)
    setShowEditRoleModal(true)
  }

  const handleSaveRole = async () => {
    if (!selectedUser) return

    try {
      const { error } = await supabase
        .from('organization_members')
        .update({ role: newRole })
        .eq('id', selectedUser.id)

      if (error) throw error

      alert('User role updated successfully!')
      setShowEditRoleModal(false)
      loadUsers()
    } catch (error: any) {
      console.error('Error updating role:', error)
      alert('Failed to update role: ' + error.message)
    }
  }

  const handleDeleteUser = async (userId: string, userName: string, orgId: string) => {
    const confirmMessage = isSystemAdmin
      ? `Are you sure you want to remove ${userName} from their organization? This will remove all their access.`
      : `Are you sure you want to remove ${userName} from the organization?`

    if (!confirm(confirmMessage)) return

    try {
      const { error } = await supabase
        .from('organization_members')
        .delete()
        .eq('user_id', userId)
        .eq('organization_id', orgId)

      if (error) throw error
      
      alert('User removed successfully!')
      loadUsers()
    } catch (error: any) {
      console.error('Error deleting user:', error)
      alert('Failed to remove user: ' + error.message)
    }
  }

  const getPermissionBadge = (level: string) => {
    const perm = PERMISSION_LEVELS.find(p => p.value === level)
    return perm || PERMISSION_LEVELS[0]
  }

  const handleInviteUser = async () => {
    const email = inviteEmail.trim().toLowerCase()
    if (!email) {
      alert('Please enter an email')
      return
    }
    if (inviteMode === 'create_with_password') {
      if (!tempPassword || tempPassword.length < 8) {
        alert('Password must be at least 8 characters')
        return
      }
      if (tempPassword !== tempPasswordConfirm) {
        alert('Password confirmation does not match')
        return
      }
    }
    setInviting(true)
    try {
      const res = await fetch('/api/admin/users/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          role: inviteRole,
          full_name: inviteFullName.trim() || null,
          organization_id: inviteOrganizationId || null,
          mode: inviteMode,
          password: inviteMode === 'create_with_password' ? tempPassword : null,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.error || 'Invite failed')

      if (inviteMode === 'create_with_password') {
        alert('User created with temporary password. Ask them to change it after first login (Settings → Security).')
      } else {
        alert(json?.invited ? 'Invite sent successfully!' : 'User added to organization successfully!')
      }
      setShowInviteModal(false)
      setInviteEmail('')
      setInviteFullName('')
      setInviteRole('staff')
      setInviteMode('invite')
      setTempPassword('')
      setTempPasswordConfirm('')
      if (inviteOrganizations.length === 1) setInviteOrganizationId(inviteOrganizations[0].id)
      await loadUsers()
    } catch (e: any) {
      alert(e?.message || 'Failed to invite user')
    } finally {
      setInviting(false)
    }
  }

  const generateTempPassword = () => {
    // simple generator: 14 chars, includes upper/lower/digits
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
    let out = ''
    for (let i = 0; i < 14; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)]
    setTempPassword(out)
    setTempPasswordConfirm(out)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-1">Manage users and their module access permissions</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowInviteModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Invite User
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            onClick={() => setActiveTab('users')}
            variant={activeTab === 'users' ? 'default' : 'outline'}
            className={activeTab === 'users' ? 'bg-blue-600' : ''}
          >
            <Users className="h-4 w-4 mr-2" />
            Organization Users ({users.length})
          </Button>
          <Button
            onClick={() => setActiveTab('customers')}
            variant={activeTab === 'customers' ? 'default' : 'outline'}
            className={activeTab === 'customers' ? 'bg-blue-600' : ''}
          >
            <Users className="h-4 w-4 mr-2" />
            Customers ({customers.length})
          </Button>
        </div>

        {/* Users List */}
        {activeTab === 'users' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Organization Users
              </CardTitle>
            </CardHeader>
            <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading users...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No users found</h3>
                <p className="text-gray-600">Invite users to your organization</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((member) => (
                      <tr key={member.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                                {member.user?.full_name?.[0]?.toUpperCase() || 'U'}
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {member.user?.full_name || 'Unknown User'}
                              </div>
                              <div className="text-sm text-gray-500">{member.user?.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            member.role === 'owner' || member.role === 'manager'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {member.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            member.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {member.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(member.joined_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleManagePermissions(member)}
                              title="Manage Permissions"
                            >
                              <Shield className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditRole(member)}
                              title="Edit Role"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleUserStatus(member.user_id, member.is_active)}
                              title={member.is_active ? 'Deactivate' : 'Activate'}
                            >
                              {member.is_active ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                            </Button>
                            {(member.role !== 'owner' || isSystemAdmin) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteUser(member.user_id, member.user?.full_name || member.user?.email, member.organization_id)}
                                title="Remove User"
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
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
        )}

        {/* Customers List */}
        {activeTab === 'customers' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Customers
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading customers...</p>
                </div>
              ) : customers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No customers found</h3>
                  <p className="text-gray-600">Add customers to your organization</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {customers.map((customer) => (
                        <tr key={customer.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-green-600 flex items-center justify-center text-white font-bold">
                                  {customer.name?.[0]?.toUpperCase() || 'C'}
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {customer.name}
                                </div>
                                {customer.company_name && (
                                  <div className="text-sm text-gray-500">{customer.company_name}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              customer.customer_type === 'customer'
                                ? 'bg-blue-100 text-blue-800'
                                : customer.customer_type === 'supplier'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}>
                              {customer.customer_type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{customer.phone || 'N/A'}</div>
                            <div className="text-sm text-gray-500">{customer.email || ''}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`text-sm font-medium ${
                              customer.current_balance > 0
                                ? 'text-red-600'
                                : customer.current_balance < 0
                                ? 'text-green-600'
                                : 'text-gray-900'
                            }`}>
                              ₹{Math.abs(customer.current_balance || 0).toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              {customer.current_balance > 0 ? 'Receivable' : customer.current_balance < 0 ? 'Payable' : 'Cleared'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              customer.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {customer.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.location.href = `/dashboard/billing/customers`}
                                title="View Details"
                              >
                                <Edit className="h-4 w-4" />
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
        )}

        {/* Invite User Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden">
              <CardHeader className="border-b sticky top-0 bg-white z-10">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="h-6 w-6 text-blue-600" />
                    <div>
                      <h3 className="text-xl font-bold">Invite user</h3>
                      <p className="text-sm text-gray-600 font-normal mt-1">Add user + set access.</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setShowInviteModal(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-72px)]">
                <div className="rounded-xl border bg-gray-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">Account setup</div>
                      <div className="mt-1 text-xs text-gray-600">
                        {inviteMode === 'invite'
                          ? 'User receives email to set password.'
                          : 'Admin sets a temporary password; user changes it after first login.'}
                      </div>
                    </div>
                    <div className="inline-flex rounded-lg bg-white p-1 border border-gray-200">
                      <button
                        type="button"
                        className={
                          'px-3 py-1.5 text-sm font-medium rounded-md transition ' +
                          (inviteMode === 'invite' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100')
                        }
                        onClick={() => setInviteMode('invite')}
                        disabled={inviting}
                      >
                        Invite email
                      </button>
                      <button
                        type="button"
                        className={
                          'px-3 py-1.5 text-sm font-medium rounded-md transition ' +
                          (inviteMode === 'create_with_password' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100')
                        }
                        onClick={() => setInviteMode('create_with_password')}
                        disabled={inviting}
                      >
                        Temp password
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {inviteOrganizations.length > 1 || isSystemAdmin ? (
                    <div className="md:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Organization *</label>
                      <select
                        value={inviteOrganizationId}
                        onChange={(e) => setInviteOrganizationId(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select organization…</option>
                        {inviteOrganizations.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.name}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">Pick where to add this user.</p>
                    </div>
                  ) : null}

                  <div className={(inviteOrganizations.length > 1 || isSystemAdmin) ? 'md:col-span-1' : 'md:col-span-2'}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as any)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="owner">Owner</option>
                      <option value="manager">Manager</option>
                      <option value="accountant">Accountant</option>
                      <option value="hr">HR</option>
                      <option value="staff">Staff</option>
                    </select>
                  </div>
                </div>

                {inviteMode === 'create_with_password' ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="md:col-span-1">
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">Temporary password *</label>
                        <div className="flex gap-2">
                          <Button type="button" size="sm" variant="outline" onClick={generateTempPassword} disabled={inviting}>
                            Generate
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(tempPassword || '')
                                alert('Copied password')
                              } catch {
                                alert('Copy failed')
                              }
                            }}
                            disabled={inviting || !tempPassword}
                          >
                            Copy
                          </Button>
                        </div>
                      </div>
                      <input
                        type="text"
                        value={tempPassword}
                        onChange={(e) => setTempPassword(e.target.value)}
                        placeholder="Minimum 8 characters"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                      />
                      <p className="text-xs text-gray-500 mt-1">Share this password securely with the user.</p>
                    </div>
                    <div className="md:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Confirm password *</label>
                      <input
                        type="text"
                        value={tempPasswordConfirm}
                        onChange={(e) => setTempPasswordConfirm(e.target.value)}
                        placeholder="Confirm password"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                      />
                    </div>
                  </div>
                ) : null}

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full name (optional)</label>
                    <input
                      type="text"
                      value={inviteFullName}
                      onChange={(e) => setInviteFullName(e.target.value)}
                      placeholder="Full name"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-1">
                  <Button variant="outline" className="flex-1" onClick={() => setShowInviteModal(false)} disabled={inviting}>
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    onClick={handleInviteUser}
                    disabled={
                      inviting ||
                      !inviteEmail.trim() ||
                      ((inviteOrganizations.length > 1 || isSystemAdmin) && !inviteOrganizationId) ||
                      (inviteMode === 'create_with_password' &&
                        (!tempPassword || tempPassword.length < 8 || tempPassword !== tempPasswordConfirm))
                    }
                  >
                    {inviting ? 'Working…' : inviteMode === 'create_with_password' ? 'Create user' : 'Send invite'}
                  </Button>
                </div>

                {/* Legacy layout kept below (no-op) */}
                <div className="hidden">
                    <Button
                      type="button"
                      size="sm"
                      variant={inviteMode === 'invite' ? 'default' : 'outline'}
                      className={inviteMode === 'invite' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                      onClick={() => setInviteMode('invite')}
                      disabled={inviting}
                    >
                      Send invite email
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={inviteMode === 'create_with_password' ? 'default' : 'outline'}
                      className={inviteMode === 'create_with_password' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                      onClick={() => setInviteMode('create_with_password')}
                      disabled={inviting}
                    >
                      Temporary password
                    </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Permissions Modal */}
        {showPermissionsModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className="h-6 w-6 text-blue-600" />
                    <div>
                      <h3 className="text-xl font-bold">Manage Module Permissions</h3>
                      <p className="text-sm text-gray-600 font-normal">
                        {selectedUser.user?.full_name} ({selectedUser.user?.email})
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPermissionsModal(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Permission Levels:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {PERMISSION_LEVELS.map(level => (
                        <div key={level.value} className={`px-3 py-2 rounded-lg text-sm font-medium ${level.color}`}>
                          {level.label}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {MODULES.map(module => {
                      const currentPerm = userPermissions[module.id]?.permission_level || 'none'
                      const isEnabled = userPermissions[module.id]?.is_enabled !== false

                      return (
                        <div
                          key={module.id}
                          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{module.icon}</span>
                            <div>
                              <h4 className="font-semibold text-gray-900">{module.name}</h4>
                              <p className="text-sm text-gray-600">Module ID: {module.id}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <select
                              value={currentPerm}
                              onChange={(e) => handlePermissionChange(module.id, e.target.value)}
                              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              {PERMISSION_LEVELS.map(level => (
                                <option key={level.value} value={level.value}>
                                  {level.label}
                                </option>
                              ))}
                            </select>
                            <div className={`w-4 h-4 rounded-full ${
                              currentPerm !== 'none' ? 'bg-green-500' : 'bg-gray-300'
                            }`}></div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="flex gap-3 pt-4 border-t">
                    <Button
                      onClick={() => setShowPermissionsModal(false)}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSavePermissions}
                      disabled={saving}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      {saving ? 'Saving...' : 'Save Permissions'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Edit Role Modal */}
        {showEditRoleModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Edit className="h-6 w-6 text-blue-600" />
                    <div>
                      <h3 className="text-xl font-bold">Edit User Role</h3>
                      <p className="text-sm text-gray-600 font-normal mt-1">
                        {selectedUser.user?.full_name || selectedUser.user?.email}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowEditRoleModal(false)}
                  >
                    ✕
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Role
                    </label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="owner">Owner</option>
                      <option value="manager">Manager</option>
                      <option value="accountant">Accountant</option>
                      <option value="hr">HR</option>
                      <option value="staff">Staff</option>
                      <option value="customer">Customer</option>
                    </select>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> Role changes will take effect immediately. 
                      {newRole === 'owner' || newRole === 'manager' ? ' This role will have admin portal access.' : ''}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 mt-6 pt-6 border-t">
                  <Button
                    onClick={handleSaveRole}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    Save Role
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowEditRoleModal(false)}
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
