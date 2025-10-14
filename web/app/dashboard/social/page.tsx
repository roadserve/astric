'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Facebook,
  Instagram,
  TrendingUp,
  Users,
  MessageCircle,
  Heart,
  Share2,
} from 'lucide-react'

interface SocialAccount {
  id: string
  platform: string
  account_name: string
  account_id: string
  is_active: boolean
  created_at: string
}

interface SocialPost {
  id: string
  platform: string
  content: string
  media_urls: string[]
  scheduled_at: string
  status: string
  created_at: string
}

export default function SocialMediaDashboardPage() {
  const supabase = createClientComponentClient()
  const [accounts, setAccounts] = useState<SocialAccount[]>([])
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      // Load social accounts
      const { data: accountsData } = await supabase
        .from('social_media_accounts')
        .select('*')
        .eq('is_active', true)

      setAccounts(accountsData || [])

      // Load social posts
      const { data: postsData } = await supabase
        .from('social_media_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      setPosts(postsData || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConnectFacebook = async () => {
    try {
      setLoading(true)

      // Get user and organization
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

      // Construct Facebook OAuth URL
      const clientId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID
      const redirectUri = `${window.location.origin}/dashboard/social/callback`
      const scope = [
        'pages_show_list',
        'pages_read_engagement',
        'pages_manage_posts',
        'instagram_basic',
        'instagram_content_publish'
      ].join(',')

      // Store organization ID in session
      sessionStorage.setItem('social_org_id', profile.organization_id)

      const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent(scope)}&` +
        `state=${profile.organization_id}`

      window.location.href = authUrl
    } catch (error) {
      console.error('Error connecting Facebook:', error)
      alert('Failed to connect Facebook')
    } finally {
      setLoading(false)
    }
  }

  const handleConnectInstagram = async () => {
    try {
      setLoading(true)

      // Get user and organization
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

      // Check if Facebook is connected
      const { data: fbAccount } = await supabase
        .from('social_media_accounts')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .eq('platform', 'facebook')
        .eq('is_active', true)
        .single()

      if (!fbAccount) {
        alert('Please connect Facebook first. Instagram requires a Facebook Business account.')
        return
      }

      // Fetch Instagram accounts linked to Facebook Page
      setLoading(true)
      const { data, error } = await supabase.functions.invoke('social_connect', {
        body: {
          platform: 'instagram',
          facebook_account_id: fbAccount.id,
          organization_id: profile.organization_id,
        }
      })

      if (error) {
        console.error('Instagram connection error:', error)
        alert('Failed to connect Instagram. Make sure your Facebook Page is linked to an Instagram Business account.')
        return
      }

      alert('Instagram connected successfully!')
      loadData() // Reload data
    } catch (error) {
      console.error('Error connecting Instagram:', error)
      alert('Failed to connect Instagram')
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnect = async (accountId: string) => {
    if (!confirm('Are you sure you want to disconnect this account?')) {
      return
    }

    try {
      setLoading(true)

      const { error } = await supabase
        .from('social_media_accounts')
        .update({ is_active: false })
        .eq('id', accountId)

      if (error) {
        console.error('Disconnect error:', error)
        alert('Failed to disconnect account')
        return
      }

      alert('Account disconnected successfully!')
      loadData() // Reload data
    } catch (error) {
      console.error('Error disconnecting:', error)
      alert('Failed to disconnect account')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Social Media Management</h1>
          <p className="text-gray-600 mt-1">
            Connect and manage your Facebook & Instagram accounts
          </p>
        </div>
        {accounts.length > 0 && (
          <div className="flex gap-2">
            <Button onClick={handleConnectInstagram} disabled={loading}>
              <Instagram className="mr-2 h-4 w-4" />
              Add Instagram
            </Button>
          </div>
        )}
      </div>

      {/* Connect Accounts */}
      {accounts.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Connect Your Social Media Accounts</CardTitle>
            <CardDescription>
              Get started by connecting your Facebook and Instagram business accounts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Facebook */}
              <Card className="border-2 border-blue-100 hover:border-blue-300 transition-colors">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Facebook className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Facebook</CardTitle>
                      <CardDescription>Connect your Facebook Page</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={handleConnectFacebook}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={loading}
                  >
                    <Facebook className="mr-2 h-4 w-4" />
                    Connect Facebook
                  </Button>
                </CardContent>
              </Card>

              {/* Instagram */}
              <Card className="border-2 border-pink-100 hover:border-pink-300 transition-colors">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-pink-100 rounded-lg">
                      <Instagram className="h-6 w-6 text-pink-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Instagram</CardTitle>
                      <CardDescription>Connect your Instagram Business</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={handleConnectInstagram}
                    className="w-full bg-pink-600 hover:bg-pink-700"
                    disabled={loading}
                  >
                    <Instagram className="mr-2 h-4 w-4" />
                    Connect Instagram
                  </Button>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Connected Accounts */}
      {accounts.length > 0 && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Followers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">Across all platforms</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0%</div>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{posts.length}</div>
                <p className="text-xs text-muted-foreground">Published posts</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Likes</CardTitle>
                <Heart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">Per post</p>
              </CardContent>
            </Card>
          </div>

          {/* Connected Accounts List */}
          <Card>
            <CardHeader>
              <CardTitle>Connected Accounts</CardTitle>
              <CardDescription>Manage your connected social media accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {accounts.map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      {account.platform === 'facebook' ? (
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Facebook className="h-5 w-5 text-blue-600" />
                        </div>
                      ) : (
                        <div className="p-2 bg-pink-100 rounded-lg">
                          <Instagram className="h-5 w-5 text-pink-600" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{account.account_name}</p>
                        <p className="text-sm text-gray-500 capitalize">{account.platform}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-green-600 font-medium">Connected</span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDisconnect(account.id)}
                        disabled={loading}
                      >
                        Disconnect
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Posts */}
          {posts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Posts</CardTitle>
                <CardDescription>Your latest social media posts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {posts.map((post) => (
                    <div key={post.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm text-gray-600 mb-2">{post.content}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span className="capitalize">{post.platform}</span>
                            <span>•</span>
                            <span>{new Date(post.created_at).toLocaleDateString()}</span>
                            <span>•</span>
                            <span className="capitalize">{post.status}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}