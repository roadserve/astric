'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { 
  Save,
  Upload,
  Phone,
  Mail,
  MapPin,
  Globe,
  Building,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Users,
  MessageSquare,
  Shield,
  Key,
  Loader2,
  PlayCircle,
  CheckCircle2,
  XCircle
} from 'lucide-react'

interface BusinessProfile {
  about: string
  address: string
  description: string
  email: string
  profile_picture_url: string
  vertical: string
  websites: string[]
  messaging_product: string
}

interface PhoneNumber {
  id: string
  display_phone_number: string
  verified_name: string
  quality_rating: string
  messaging_limit_tier: string
}

export default function SettingsPage() {
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testingConnection, setTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'not_tested' | 'testing' | 'success' | 'failed'>('not_tested')
  
  // WhatsApp Credentials
  const [phoneNumberId, setPhoneNumberId] = useState('')
  const [businessAccountId, setBusinessAccountId] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [webhookVerifyToken, setWebhookVerifyToken] = useState('')
  const [hasCredentials, setHasCredentials] = useState(false)
  
  // Business Profile
  const [businessName, setBusinessName] = useState('')
  const [about, setAbout] = useState('')
  const [address, setAddress] = useState('')
  const [description, setDescription] = useState('')
  const [email, setEmail] = useState('')
  const [website1, setWebsite1] = useState('')
  const [website2, setWebsite2] = useState('')
  const [vertical, setVertical] = useState('')
  const [profilePicture, setProfilePicture] = useState<File | null>(null)
  const [profilePictureUrl, setProfilePictureUrl] = useState('')

  // Phone Number Info
  const [phoneNumber, setPhoneNumber] = useState<PhoneNumber | null>(null)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setLoading(true)
    try {
      // Load WhatsApp credentials from database
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: orgMember } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single()

      if (orgMember) {
        const { data: account } = await supabase
          .from('whatsapp_accounts')
          .select('*')
          .eq('organization_id', orgMember.organization_id)
          .single()

        if (account) {
          setPhoneNumberId(account.phone_number_id || '')
          setBusinessAccountId(account.business_account_id || '')
          setAccessToken(account.access_token || '')
          setWebhookVerifyToken(account.webhook_verify_token || '')
          setHasCredentials(true)
        }
      }

      // Load business profile from WhatsApp API via Edge Function (if credentials exist)
      if (hasCredentials || phoneNumberId) {
        try {
      const { data, error } = await supabase.functions.invoke('whatsapp_get_profile')
      
          if (!error && data) {
      if (data.profile) {
        setBusinessName(data.profile.verified_name || '')
        setAbout(data.profile.about || '')
        setAddress(data.profile.address || '')
        setDescription(data.profile.description || '')
        setEmail(data.profile.email || '')
        setWebsite1(data.profile.websites?.[0] || '')
        setWebsite2(data.profile.websites?.[1] || '')
        setVertical(data.profile.vertical || '')
        setProfilePictureUrl(data.profile.profile_picture_url || '')
      }

      if (data.phone_number) {
        setPhoneNumber(data.phone_number)
            }
          }
        } catch (error) {
          console.log('Profile not loaded (credentials may not be set)')
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const websites = [website1, website2].filter(w => w.trim())

      const profileData: any = {
        about: about.substring(0, 139), // Max 139 chars
        address,
        description: description.substring(0, 256), // Max 256 chars
        email,
        vertical,
        websites
      }

      // Upload profile picture if selected
      if (profilePicture) {
        const fileExt = profilePicture.name.split('.').pop()
        const fileName = `profile_${Date.now()}.${fileExt}`
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('whatsapp-media')
          .upload(fileName, profilePicture)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('whatsapp-media')
          .getPublicUrl(fileName)

        profileData.profile_picture_handle = publicUrl
      }

      // Update via Edge Function
      const { data, error } = await supabase.functions.invoke('whatsapp_update_profile', {
        body: profileData
      })

      if (error) throw error

      alert('Profile updated successfully!')
      loadSettings()
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const testConnection = async () => {
    if (!phoneNumberId || !accessToken) {
      alert('Please enter Phone Number ID and Access Token first')
      return
    }

    setTestingConnection(true)
    setConnectionStatus('testing')

    try {
      // Test by fetching business profile
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${phoneNumberId}/whatsapp_business_profile`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        setConnectionStatus('success')
        alert('✅ Connection successful! Your credentials are valid.')
      } else {
        const errorData = await response.json()
        setConnectionStatus('failed')
        alert('❌ Connection failed: ' + (errorData.error?.message || 'Invalid credentials'))
      }
    } catch (error: any) {
      setConnectionStatus('failed')
      alert('❌ Connection failed: ' + error.message)
    } finally {
      setTestingConnection(false)
    }
  }

  const saveCredentials = async () => {
    if (!phoneNumberId || !businessAccountId || !accessToken) {
      alert('Please fill all required fields')
      return
    }

    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('Please login first')
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

      // Save to database
      const { error } = await supabase
        .from('whatsapp_accounts')
        .upsert({
          organization_id: orgMember.organization_id,
          phone_number_id: phoneNumberId,
          business_account_id: businessAccountId,
          access_token: accessToken, // TODO: Encrypt this in production
          webhook_verify_token: webhookVerifyToken || `token_${Date.now()}`,
          phone_number: phoneNumberId, // Will be updated from API
          display_name: 'WhatsApp Business',
          is_verified: true,
          status: 'active'
        }, {
          onConflict: 'organization_id,phone_number_id'
        })

      if (error) throw error

      setHasCredentials(true)
      alert('✅ Credentials saved successfully!')
      loadSettings() // Reload to get profile data
    } catch (error: any) {
      console.error('Error saving credentials:', error)
      alert('Failed to save credentials: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleProfilePictureSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB')
      return
    }

    setProfilePicture(file)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setProfilePictureUrl(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const verticals = [
    { value: 'AUTOMOTIVE', label: 'Automotive' },
    { value: 'BEAUTY', label: 'Beauty, Spa & Salon' },
    { value: 'APPAREL', label: 'Clothing & Apparel' },
    { value: 'EDU', label: 'Education' },
    { value: 'ENTERTAIN', label: 'Entertainment' },
    { value: 'EVENT_PLAN', label: 'Event Planning & Service' },
    { value: 'FINANCE', label: 'Finance & Banking' },
    { value: 'GROCERY', label: 'Grocery & Food' },
    { value: 'GOVT', label: 'Government' },
    { value: 'HOTEL', label: 'Hotel & Lodging' },
    { value: 'HEALTH', label: 'Medical & Health' },
    { value: 'NONPROFIT', label: 'Non-profit' },
    { value: 'PROF_SERVICES', label: 'Professional Services' },
    { value: 'RETAIL', label: 'Shopping & Retail' },
    { value: 'TRAVEL', label: 'Travel & Transportation' },
    { value: 'RESTAURANT', label: 'Restaurant' },
    { value: 'OTHER', label: 'Other' }
  ]

  const getQualityBadge = (rating: string) => {
    const badges = {
      GREEN: { color: 'bg-green-100 text-green-800', label: 'High Quality' },
      YELLOW: { color: 'bg-yellow-100 text-yellow-800', label: 'Medium Quality' },
      RED: { color: 'bg-red-100 text-red-800', label: 'Low Quality' },
      UNKNOWN: { color: 'bg-gray-100 text-gray-800', label: 'Unknown' }
    }
    
    const badge = badges[rating as keyof typeof badges] || badges.UNKNOWN

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
        {badge.label}
      </span>
    )
  }

  const getTierBadge = (tier: string) => {
    const tiers: any = {
      'TIER_1K': { label: '1,000/day', color: 'bg-blue-100 text-blue-800' },
      'TIER_10K': { label: '10,000/day', color: 'bg-purple-100 text-purple-800' },
      'TIER_100K': { label: '100,000/day', color: 'bg-indigo-100 text-indigo-800' },
      'UNLIMITED': { label: 'Unlimited', color: 'bg-green-100 text-green-800' }
    }

    const badge = tiers[tier] || { label: tier, color: 'bg-gray-100 text-gray-800' }

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
        {badge.label}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">WhatsApp Settings</h1>
        <p className="text-gray-600 mt-1">Manage your WhatsApp Business Profile and phone number</p>
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            Loading settings...
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {/* WhatsApp API Credentials */}
          <Card className="border-2 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-blue-600" />
                WhatsApp API Credentials
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Connect your WhatsApp Business Account:</strong> Enter your Meta WhatsApp API credentials to start sending messages.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={phoneNumberId}
                    onChange={(e) => setPhoneNumberId(e.target.value)}
                    placeholder="123456789012345"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Found in Meta Developers → WhatsApp → API Setup
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Account ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={businessAccountId}
                    onChange={(e) => setBusinessAccountId(e.target.value)}
                    placeholder="123456789012345"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Found in Meta Developers → WhatsApp → API Setup
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Access Token <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder="EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Create a permanent token in Meta Business Settings → System Users
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Webhook Verify Token (Optional)
                </label>
                <input
                  type="text"
                  value={webhookVerifyToken}
                  onChange={(e) => setWebhookVerifyToken(e.target.value)}
                  placeholder="your_custom_token"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use this token when configuring webhook in Meta
                </p>
              </div>

              {/* Connection Test */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Test Connection</h3>
                  {connectionStatus === 'success' && (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  )}
                  {connectionStatus === 'failed' && (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Verify your credentials before saving:
                </p>
                <Button
                  onClick={testConnection}
                  disabled={testingConnection || !phoneNumberId || !accessToken}
                  variant="outline"
                  className="w-full"
                >
                  {testingConnection ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Testing Connection...
                    </>
                  ) : connectionStatus === 'success' ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                      Connection Successful
                    </>
                  ) : connectionStatus === 'failed' ? (
                    <>
                      <XCircle className="h-4 w-4 mr-2 text-red-600" />
                      Connection Failed - Try Again
                    </>
                  ) : (
                    <>
                      <PlayCircle className="h-4 w-4 mr-2" />
                      Test Connection
                    </>
                  )}
                </Button>
              </div>

              {/* Save Button */}
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={saveCredentials}
                  disabled={saving || !phoneNumberId || !businessAccountId || !accessToken}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Credentials
                    </>
                  )}
                </Button>
                {hasCredentials && (
                  <Link href="/dashboard/whatsapp/setup">
                    <Button variant="outline">
                      Setup Guide
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Phone Number Info */}
          {phoneNumber && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Phone Number Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <Phone className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Phone Number</p>
                        <p className="text-lg font-semibold">{phoneNumber.display_phone_number}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Building className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Display Name</p>
                        <p className="text-lg font-semibold">{phoneNumber.verified_name}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Quality Rating</p>
                      {getQualityBadge(phoneNumber.quality_rating)}
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Messaging Limit</p>
                      {getTierBadge(phoneNumber.messaging_limit_tier)}
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Quality Rating Impact</p>
                      <p>Your quality rating affects your messaging limits. Maintain high quality by:</p>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Sending messages only to opted-in users</li>
                        <li>Using approved templates</li>
                        <li>Responding to customer messages quickly</li>
                        <li>Avoiding spam or promotional content</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Business Profile */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Business Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Picture */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Profile Picture</label>
                <div className="flex items-center gap-4">
                  {profilePictureUrl ? (
                    <img
                      src={profilePictureUrl}
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <label className="cursor-pointer">
                    <div className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                      <Upload className="h-4 w-4 inline mr-2" />
                      Upload Photo
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureSelect}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-2">Square image, max 5MB (JPEG or PNG)</p>
              </div>

              {/* Business Name (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Name (Display Name)
                </label>
                <input
                  type="text"
                  value={businessName}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Contact WhatsApp support to change your display name
                </p>
              </div>

              {/* About */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  About (max 139 characters)
                </label>
                <textarea
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  placeholder="A brief description of your business"
                  rows={2}
                  maxLength={139}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <p className="text-xs text-gray-500 mt-1">{about.length} / 139 characters</p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (max 256 characters)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed description of your business"
                  rows={4}
                  maxLength={256}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <p className="text-xs text-gray-500 mt-1">{description.length} / 256 characters</p>
              </div>

              {/* Industry */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
                <select
                  value={vertical}
                  onChange={(e) => setVertical(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select industry...</option>
                  {verticals.map((v) => (
                    <option key={v.value} value={v.value}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Contact Info */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="h-4 w-4 inline mr-1" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@business.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="h-4 w-4 inline mr-1" />
                    Address
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="123 Main St, City, Country"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              {/* Websites */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Globe className="h-4 w-4 inline mr-1" />
                  Websites (max 2)
                </label>
                <div className="space-y-2">
                  <input
                    type="url"
                    value={website1}
                    onChange={(e) => setWebsite1(e.target.value)}
                    placeholder="https://www.example.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <input
                    type="url"
                    value={website2}
                    onChange={(e) => setWebsite2(e.target.value)}
                    placeholder="https://shop.example.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-4 border-t">
                <Button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="w-full md:w-auto bg-green-600 hover:bg-green-700 px-8"
                >
                  {saving ? (
                    <>Saving...</>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Profile
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <p>
                    <strong>Complete your profile</strong> to build trust with customers. 
                    Include a clear profile picture, description, and contact information.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <p>
                    <strong>Keep it professional</strong>. Your profile represents your business 
                    and appears when customers message you.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <p>
                    <strong>Changes may take time</strong>. Profile updates are usually reflected 
                    within a few minutes, but can take up to 24 hours.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}