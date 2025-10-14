'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Settings,
  Building2,
  User,
  Bell,
  Shield,
  Key,
  CreditCard,
  Mail,
  Globe,
  Save,
  Check
} from 'lucide-react'

export default function SettingsPage() {
  const supabase = createClientComponentClient()
  const [activeTab, setActiveTab] = useState('organization')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  const [organizationData, setOrganizationData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    gstin: '',
    pan: '',
    website: ''
  })

  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: ''
  })

  const [notificationSettings, setNotificationSettings] = useState({
    email_invoices: true,
    email_payments: true,
    email_payroll: true,
    email_whatsapp: true,
    sms_notifications: false,
    push_notifications: true
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Load profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile) {
        setProfileData({
          first_name: profile.first_name || '',
          last_name: profile.last_name || '',
          email: user.email || '',
          phone: profile.phone || '',
          role: profile.role || 'user'
        })
      }

      // Load organization
      const { data: orgMember } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single()

      if (orgMember) {
        const { data: org } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', orgMember.organization_id)
          .single()

        if (org) {
          setOrganizationData({
            name: org.name || '',
            email: org.email || '',
            phone: org.phone || '',
            address: org.address || '',
            city: org.city || '',
            state: org.state || '',
            pincode: org.pincode || '',
            gstin: org.gstin || '',
            pan: org.pan || '',
            website: org.website || ''
          })
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  const handleSaveOrganization = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: orgMember } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single()

      if (orgMember) {
        const { error } = await supabase
          .from('organizations')
          .update(organizationData)
          .eq('id', orgMember.organization_id)

        if (error) throw error
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (error) {
      console.error('Error saving organization:', error)
      alert('Error saving settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          phone: profileData.phone
        })
        .eq('id', user.id)

      if (error) throw error
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Error saving profile')
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'organization', label: 'Organization', icon: Building2 },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'integrations', label: 'Integrations', icon: Globe }
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Manage your account and preferences</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-4">
                <nav className="space-y-1">
                  {tabs.map((tab) => {
                    const Icon = tab.icon
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                          activeTab === tab.id
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="text-sm font-medium">{tab.label}</span>
                      </button>
                    )
                  })}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{tabs.find(t => t.id === activeTab)?.label}</span>
                  {saved && (
                    <span className="flex items-center gap-2 text-sm text-green-600">
                      <Check className="h-4 w-4" />
                      Saved successfully!
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activeTab === 'organization' && (
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Organization Name *
                        </label>
                        <input
                          type="text"
                          value={organizationData.name}
                          onChange={(e) => setOrganizationData({...organizationData, name: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email *
                        </label>
                        <input
                          type="email"
                          value={organizationData.email}
                          onChange={(e) => setOrganizationData({...organizationData, email: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone
                        </label>
                        <input
                          type="tel"
                          value={organizationData.phone}
                          onChange={(e) => setOrganizationData({...organizationData, phone: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Website
                        </label>
                        <input
                          type="url"
                          value={organizationData.website}
                          onChange={(e) => setOrganizationData({...organizationData, website: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address
                      </label>
                      <textarea
                        value={organizationData.address}
                        onChange={(e) => setOrganizationData({...organizationData, address: e.target.value})}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          City
                        </label>
                        <input
                          type="text"
                          value={organizationData.city}
                          onChange={(e) => setOrganizationData({...organizationData, city: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          State
                        </label>
                        <input
                          type="text"
                          value={organizationData.state}
                          onChange={(e) => setOrganizationData({...organizationData, state: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Pincode
                        </label>
                        <input
                          type="text"
                          value={organizationData.pincode}
                          onChange={(e) => setOrganizationData({...organizationData, pincode: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          GSTIN
                        </label>
                        <input
                          type="text"
                          value={organizationData.gstin}
                          onChange={(e) => setOrganizationData({...organizationData, gstin: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          PAN
                        </label>
                        <input
                          type="text"
                          value={organizationData.pan}
                          onChange={(e) => setOrganizationData({...organizationData, pan: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <Button onClick={handleSaveOrganization} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                      <Save className="h-4 w-4 mr-2" />
                      {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                )}

                {activeTab === 'profile' && (
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          First Name *
                        </label>
                        <input
                          type="text"
                          value={profileData.first_name}
                          onChange={(e) => setProfileData({...profileData, first_name: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Last Name *
                        </label>
                        <input
                          type="text"
                          value={profileData.last_name}
                          onChange={(e) => setProfileData({...profileData, last_name: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email *
                        </label>
                        <input
                          type="email"
                          value={profileData.email}
                          disabled
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                        />
                        <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone
                        </label>
                        <input
                          type="tel"
                          value={profileData.phone}
                          onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Role
                      </label>
                      <input
                        type="text"
                        value={profileData.role}
                        disabled
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      />
                    </div>

                    <Button onClick={handleSaveProfile} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                      <Save className="h-4 w-4 mr-2" />
                      {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                )}

                {activeTab === 'notifications' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Email Notifications</h3>
                      <div className="space-y-4">
                        {[
                          { key: 'email_invoices', label: 'Invoice notifications', description: 'Get notified when invoices are created or paid' },
                          { key: 'email_payments', label: 'Payment notifications', description: 'Get notified about payment status updates' },
                          { key: 'email_payroll', label: 'Payroll notifications', description: 'Get notified about payroll processing' },
                          { key: 'email_whatsapp', label: 'WhatsApp notifications', description: 'Get notified about WhatsApp campaigns' }
                        ].map((item) => (
                          <div key={item.key} className="flex items-start justify-between p-4 border border-gray-200 rounded-lg">
                            <div>
                              <p className="font-medium text-gray-900">{item.label}</p>
                              <p className="text-sm text-gray-600">{item.description}</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={notificationSettings[item.key as keyof typeof notificationSettings] as boolean}
                                onChange={(e) => setNotificationSettings({...notificationSettings, [item.key]: e.target.checked})}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-4">Other Notifications</h3>
                      <div className="space-y-4">
                        {[
                          { key: 'sms_notifications', label: 'SMS notifications', description: 'Receive important updates via SMS' },
                          { key: 'push_notifications', label: 'Push notifications', description: 'Receive browser push notifications' }
                        ].map((item) => (
                          <div key={item.key} className="flex items-start justify-between p-4 border border-gray-200 rounded-lg">
                            <div>
                              <p className="font-medium text-gray-900">{item.label}</p>
                              <p className="text-sm text-gray-600">{item.description}</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={notificationSettings[item.key as keyof typeof notificationSettings] as boolean}
                                onChange={(e) => setNotificationSettings({...notificationSettings, [item.key]: e.target.checked})}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <Save className="h-4 w-4 mr-2" />
                      Save Preferences
                    </Button>
                  </div>
                )}

                {activeTab === 'security' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Change Password</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Current Password
                          </label>
                          <input
                            type="password"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            New Password
                          </label>
                          <input
                            type="password"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Confirm New Password
                          </label>
                          <input
                            type="password"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <Button className="bg-blue-600 hover:bg-blue-700">
                          <Key className="h-4 w-4 mr-2" />
                          Update Password
                        </Button>
                      </div>
                    </div>

                    <div className="border-t pt-6">
                      <h3 className="text-lg font-semibold mb-4">Two-Factor Authentication</h3>
                      <p className="text-gray-600 mb-4">Add an extra layer of security to your account</p>
                      <Button variant="outline">
                        <Shield className="h-4 w-4 mr-2" />
                        Enable 2FA
                      </Button>
                    </div>
                  </div>
                )}

                {activeTab === 'billing' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Current Plan</h3>
                      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200">
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-2xl font-bold text-gray-900">Professional Plan</h4>
                              <p className="text-gray-600 mt-1">Unlimited users and features</p>
                            </div>
                            <div className="text-right">
                              <p className="text-3xl font-bold text-blue-600">₹2,999</p>
                              <p className="text-sm text-gray-600">/month</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-4">Payment Method</h3>
                      <div className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <CreditCard className="h-8 w-8 text-gray-600" />
                            <div>
                              <p className="font-medium">•••• •••• •••• 4242</p>
                              <p className="text-sm text-gray-600">Expires 12/25</p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm">Change</Button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-4">Billing History</h3>
                      <div className="space-y-2">
                        {[
                          { date: '01 Oct 2025', amount: '₹2,999', status: 'Paid' },
                          { date: '01 Sep 2025', amount: '₹2,999', status: 'Paid' },
                          { date: '01 Aug 2025', amount: '₹2,999', status: 'Paid' }
                        ].map((invoice, i) => (
                          <div key={i} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                            <div>
                              <p className="font-medium">{invoice.date}</p>
                              <p className="text-sm text-gray-600">Monthly subscription</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">{invoice.amount}</p>
                              <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                                {invoice.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'integrations' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Connected Integrations</h3>
                      <div className="space-y-4">
                        {[
                          { name: 'WhatsApp Business', description: 'Send messages and campaigns', connected: true, icon: MessageSquare },
                          { name: 'Google My Business', description: 'Manage business listings', connected: false, icon: Globe },
                          { name: 'Facebook & Instagram', description: 'Social media marketing', connected: false, icon: Share2 },
                          { name: 'Payment Gateway', description: 'Accept online payments', connected: true, icon: CreditCard }
                        ].map((integration, i) => {
                          const Icon = integration.icon
                          return (
                            <div key={i} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                  <Icon className="h-6 w-6 text-gray-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">{integration.name}</p>
                                  <p className="text-sm text-gray-600">{integration.description}</p>
                                </div>
                              </div>
                              <Button
                                variant={integration.connected ? 'outline' : 'default'}
                                className={integration.connected ? '' : 'bg-blue-600 hover:bg-blue-700'}
                              >
                                {integration.connected ? 'Disconnect' : 'Connect'}
                              </Button>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    <div className="border-t pt-6">
                      <h3 className="text-lg font-semibold mb-4">API Access</h3>
                      <p className="text-gray-600 mb-4">Generate API keys to integrate with external systems</p>
                      <Button variant="outline">
                        <Key className="h-4 w-4 mr-2" />
                        Generate API Key
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

// Missing imports for integrations tab
import { MessageSquare, Share2 } from 'lucide-react'