'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Plus,
  Send,
  Users,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  Edit,
  Trash2,
  Calendar,
  TrendingUp
} from 'lucide-react'
import Link from 'next/link'

interface Campaign {
  id: string
  name: string
  template_name: string
  message_content: string
  status: string
  scheduled_at?: string
  sent_at?: string
  total_recipients: number
  sent_count: number
  delivered_count: number
  read_count: number
  created_at: string
}

export default function CampaignsPage() {
  const supabase = createClientComponentClient()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCampaigns()
  }, [])

  const loadCampaigns = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('whatsapp_campaigns')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setCampaigns(data || [])
    } catch (error) {
      console.error('Error loading campaigns:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSendCampaign = async (campaignId: string) => {
    if (!confirm('Send this campaign now?')) return

    try {
      const { error } = await supabase.functions.invoke('whatsapp_send', {
        body: {
          campaign_id: campaignId,
          action: 'send_campaign'
        }
      })

      if (error) throw error
      alert('Campaign sent successfully!')
      loadCampaigns()
    } catch (error) {
      console.error('Error sending campaign:', error)
      alert('Failed to send campaign')
    }
  }

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return

    try {
      const { error } = await supabase
        .from('whatsapp_campaigns')
        .delete()
        .eq('id', campaignId)

      if (error) throw error
      loadCampaigns()
    } catch (error) {
      console.error('Error deleting campaign:', error)
      alert('Failed to delete campaign')
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: { color: 'bg-gray-100 text-gray-800', icon: Clock, label: 'Draft' },
      scheduled: { color: 'bg-blue-100 text-blue-800', icon: Calendar, label: 'Scheduled' },
      sending: { color: 'bg-yellow-100 text-yellow-800', icon: Send, label: 'Sending' },
      sent: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Sent' },
      failed: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Failed' }
    }
    
    const badge = badges[status as keyof typeof badges] || badges.draft
    const Icon = badge.icon

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="h-3 w-3" />
        {badge.label}
      </span>
    )
  }

  const stats = {
    total: campaigns.length,
    sent: campaigns.filter(c => c.status === 'sent').length,
    scheduled: campaigns.filter(c => c.status === 'scheduled').length,
    draft: campaigns.filter(c => c.status === 'draft').length,
    totalRecipients: campaigns.reduce((sum, c) => sum + (c.total_recipients || 0), 0),
    totalSent: campaigns.reduce((sum, c) => sum + (c.sent_count || 0), 0)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Campaigns</h1>
          <p className="text-gray-600 mt-1">Manage your WhatsApp broadcast campaigns</p>
        </div>
        <Link href="/dashboard/whatsapp/send">
          <Button className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
            <Plus className="h-4 w-4" />
            Create Campaign
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sent</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.sent}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.scheduled}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recipients</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.totalRecipients.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns List */}
      <div className="grid gap-6">
        {loading ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              Loading campaigns...
            </CardContent>
          </Card>
        ) : campaigns.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Send className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No campaigns yet</h3>
              <p className="text-gray-600 mb-4">Create your first broadcast campaign to reach your customers</p>
              <Link href="/dashboard/whatsapp/send">
                <Button className="bg-green-600 hover:bg-green-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Campaign
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          campaigns.map((campaign) => {
            const deliveryRate = campaign.sent_count > 0
              ? ((campaign.delivered_count / campaign.sent_count) * 100).toFixed(1)
              : 0
            const readRate = campaign.delivered_count > 0
              ? ((campaign.read_count / campaign.delivered_count) * 100).toFixed(1)
              : 0

            return (
              <Card key={campaign.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{campaign.name}</h3>
                        {getStatusBadge(campaign.status)}
                      </div>

                      <p className="text-gray-600 mb-4">{campaign.message_content.substring(0, 150)}...</p>

                      {/* Campaign Stats */}
                      <div className="grid md:grid-cols-5 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Recipients</p>
                          <p className="text-lg font-semibold">{campaign.total_recipients}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Sent</p>
                          <p className="text-lg font-semibold text-green-600">{campaign.sent_count}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Delivered</p>
                          <p className="text-lg font-semibold text-blue-600">{campaign.delivered_count}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Read</p>
                          <p className="text-lg font-semibold text-purple-600">{campaign.read_count}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Read Rate</p>
                          <p className="text-lg font-semibold">{readRate}%</p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      {campaign.status === 'sent' && campaign.sent_count > 0 && (
                        <div className="mb-4">
                          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                            <span>Delivery Progress</span>
                            <span>{deliveryRate}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full"
                              style={{ width: `${deliveryRate}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Metadata */}
                      <div className="flex items-center gap-6 text-sm text-gray-600">
                        {campaign.template_name && (
                          <span>Template: {campaign.template_name}</span>
                        )}
                        {campaign.scheduled_at && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Scheduled: {new Date(campaign.scheduled_at).toLocaleString()}
                          </span>
                        )}
                        {campaign.sent_at && (
                          <span>Sent: {new Date(campaign.sent_at).toLocaleString()}</span>
                        )}
                        {!campaign.sent_at && !campaign.scheduled_at && (
                          <span>Created: {new Date(campaign.created_at).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-4">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      {campaign.status === 'draft' && (
                        <>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSendCampaign(campaign.id)}
                            className="text-green-600"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCampaign(campaign.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Info Card */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Campaign Best Practices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6 text-sm text-gray-600">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">📝 Use Templates</h4>
              <p>Always use approved message templates for marketing campaigns to comply with WhatsApp policies</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">⏰ Schedule Wisely</h4>
              <p>Send messages during business hours (9 AM - 6 PM) for better engagement rates</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">🎯 Segment Audience</h4>
              <p>Use contact tags to send targeted messages to specific customer groups</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
