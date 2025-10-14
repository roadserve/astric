'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Building2,
  MapPin,
  Edit,
  RefreshCw,
  Star,
  TrendingUp,
  Plus,
} from 'lucide-react'

interface GmbAccount {
  id: string
  account_name: string
  is_active: boolean
  created_at: string
}

interface GmbLocation {
  id: string
  location_name: string
  address: string
  phone: string
  website: string
  description: string
  gmb_account_id: string
  is_active: boolean
  created_at: string
  gmb_account?: GmbAccount
}

export default function GmbDashboardPage() {
  const supabase = createClientComponentClient()
  const [accounts, setAccounts] = useState<GmbAccount[]>([])
  const [locations, setLocations] = useState<GmbLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLocations, setSelectedLocations] = useState<string[]>([])
  const [bulkUpdateType, setBulkUpdateType] = useState('description')
  const [updateData, setUpdateData] = useState({
    description: '',
    phone: '',
    website: '',
  })

  useEffect(() => {
    loadGmbData()
  }, [])

  const loadGmbData = async () => {
    try {
      // Load GMB accounts
      const { data: accountsData } = await supabase
        .from('gmb_accounts')
        .select('*')
        .eq('is_active', true)

      setAccounts(accountsData || [])

      // Load GMB locations
      const { data: locationsData } = await supabase
        .from('gmb_locations')
        .select('*, gmb_account:gmb_accounts(*)')

      setLocations(locationsData || [])
    } catch (error) {
      console.error('Error loading GMB data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConnectGoogle = async () => {
    try {
      setLoading(true)
      
      // Get current user and organization
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('Please login first')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

      if (!profile?.organization_id) {
        alert('Organization not found. Please complete your profile.')
        return
      }

      // Start OAuth flow
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
      const redirectUri = `${window.location.origin}/dashboard/gmb/callback`
      const scope = [
        'https://www.googleapis.com/auth/business.manage',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
      ].join(' ')
      
      // Store organization_id in session for callback
      sessionStorage.setItem('gmb_org_id', profile.organization_id)
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=code&` +
        `scope=${encodeURIComponent(scope)}&` +
        `access_type=offline&` +
        `prompt=consent&` +
        `state=${profile.organization_id}`

      window.location.href = authUrl
    } catch (error) {
      console.error('Error starting OAuth:', error)
      alert('Failed to connect Google account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleBulkUpdate = async () => {
    if (selectedLocations.length === 0) {
      alert('Please select at least one location')
      return
    }

    setLoading(true)

    try {
      const { data, error } = await supabase.functions.invoke('gmb_bulk_update', {
        body: {
          organization_id: 'org-id', // TODO: Get from context
          update_type: bulkUpdateType,
          update_data: updateData,
          location_ids: selectedLocations,
        },
      })

      if (error) throw error

      alert(`Successfully updated ${data.successful_updates} locations!`)
      setSelectedLocations([])
      loadGmbData()
    } catch (error) {
      console.error('Error performing bulk update:', error)
      alert('Failed to update locations')
    } finally {
      setLoading(false)
    }
  }

  const toggleLocationSelection = (locationId: string) => {
    setSelectedLocations(prev =>
      prev.includes(locationId)
        ? prev.filter(id => id !== locationId)
        : [...prev, locationId]
    )
  }

  const selectAllLocations = () => {
    if (selectedLocations.length === locations.length) {
      setSelectedLocations([])
    } else {
      setSelectedLocations(locations.map(l => l.id))
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Google My Business Management
          </h1>
          <p className="text-gray-600">
            Manage all your business profiles from one place
          </p>
        </div>

        {/* Connected Accounts */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Connected Accounts
                </CardTitle>
                <CardDescription>
                  {accounts.length} Google account(s) connected
                </CardDescription>
              </div>
              <Button onClick={handleConnectGoogle}>
                <Plus className="h-4 w-4 mr-2" />
                Connect Account
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {accounts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No accounts connected yet</p>
                <p className="text-sm">Connect your Google account to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {accounts.map((account: any) => (
                  <div key={account.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{account.account_name}</p>
                      <p className="text-sm text-gray-500">
                        Last synced: {new Date(account.last_synced_at).toLocaleString()}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Sync
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bulk Update Section */}
        {locations.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                Bulk Update Profiles
              </CardTitle>
              <CardDescription>
                Update multiple locations at once
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Update Type */}
              <div>
                <Label>What do you want to update?</Label>
                <select
                  className="w-full mt-2 p-2 border rounded-md"
                  value={bulkUpdateType}
                  onChange={(e) => setBulkUpdateType(e.target.value)}
                >
                  <option value="description">Business Description</option>
                  <option value="phone">Phone Number</option>
                  <option value="website">Website URL</option>
                  <option value="hours">Business Hours</option>
                  <option value="attributes">Business Attributes</option>
                </select>
              </div>

              {/* Update Fields */}
              <div>
                <Label>New Information</Label>
                {bulkUpdateType === 'description' && (
                  <Textarea
                    className="mt-2"
                    placeholder="Enter business description..."
                    rows={5}
                    value={updateData.description}
                    onChange={(e) => setUpdateData({ ...updateData, description: e.target.value })}
                  />
                )}
                {bulkUpdateType === 'phone' && (
                  <Input
                    className="mt-2"
                    placeholder="+91 9876543210"
                    value={updateData.phone}
                    onChange={(e) => setUpdateData({ ...updateData, phone: e.target.value })}
                  />
                )}
                {bulkUpdateType === 'website' && (
                  <Input
                    className="mt-2"
                    placeholder="https://example.com"
                    value={updateData.website}
                    onChange={(e) => setUpdateData({ ...updateData, website: e.target.value })}
                  />
                )}
              </div>

              {/* Location Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Select Locations ({selectedLocations.length} selected)</Label>
                  <Button variant="ghost" size="sm" onClick={selectAllLocations}>
                    {selectedLocations.length === locations.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>
                <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
                  {locations.map((location: any) => (
                    <label
                      key={location.id}
                      className="flex items-center p-3 hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        className="mr-3"
                        checked={selectedLocations.includes(location.id)}
                        onChange={() => toggleLocationSelection(location.id)}
                      />
                      <div className="flex-1">
                        <p className="font-medium">{location.location_name}</p>
                        <p className="text-sm text-gray-500">{location.address?.addressLines?.[0]}</p>
                      </div>
                      <MapPin className="h-4 w-4 text-gray-400" />
                    </label>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <Button
                className="w-full"
                onClick={handleBulkUpdate}
                disabled={selectedLocations.length === 0 || loading}
              >
                {loading ? 'Updating...' : `Update ${selectedLocations.length} Location(s)`}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Locations Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {locations.map((location: any) => (
            <Card key={location.id}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {location.location_name}
                </CardTitle>
                <CardDescription>
                  {location.category}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-600">{location.address?.addressLines?.[0]}</p>
                  {location.phone && <p>📞 {location.phone}</p>}
                  {location.website && (
                    <a href={location.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      🌐 Visit Website
                    </a>
                  )}
                  <div className="flex items-center gap-2 mt-4">
                    {location.is_verified && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                        Verified
                      </span>
                    )}
                    {location.is_published && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        Published
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {locations.length === 0 && !loading && (
          <Card>
            <CardContent className="text-center py-12">
              <MapPin className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">No Locations Found</h3>
              <p className="text-gray-600 mb-4">
                Connect your Google account to import your business locations
              </p>
              <Button onClick={handleConnectGoogle}>
                Connect Google Account
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
