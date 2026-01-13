'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  MessageSquare, 
  Send, 
  Users, 
  CheckCircle, 
  FileText,
  TrendingUp,
  Phone,
  Image,
  Video,
  File,
  Clock,
  Eye,
  MessageCircle,
  CreditCard,
  ExternalLink,
  Info,
  DollarSign
} from 'lucide-react'
import Link from 'next/link'

export default function WhatsAppPage() {
  const supabase = createClientComponentClient()
  const [stats, setStats] = useState({
    totalConversations: 0,
    activeConversations: 0,
    totalMessages: 0,
    messagesSent: 0,
    messagesDelivered: 0,
    messagesRead: 0,
    messagesFailed: 0,
    templates: 0,
    contacts: 0
  })
  const [loading, setLoading] = useState(true)
  const [isSystemAdmin, setIsSystemAdmin] = useState(false)

  useEffect(() => {
    checkUserLevel()
    loadStats()
  }, [])

  const checkUserLevel = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Check if user is system admin (Level 1)
      const { data: systemAdmin } = await supabase
        .from('system_admins')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle()

      setIsSystemAdmin(!!systemAdmin)
    } catch (error) {
      console.error('Error checking user level:', error)
    }
  }

  const loadStats = async () => {
    setLoading(true)
    try {
      // Load conversations count
      const { count: conversationsCount } = await supabase
        .from('whatsapp_conversations')
        .select('*', { count: 'exact', head: true })

      const { count: activeCount } = await supabase
        .from('whatsapp_conversations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')

      // Load messages count
      const { count: messagesCount } = await supabase
        .from('whatsapp_messages')
        .select('*', { count: 'exact', head: true })

      const { count: sentCount } = await supabase
        .from('whatsapp_messages')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'sent')

      const { count: deliveredCount } = await supabase
        .from('whatsapp_messages')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'delivered')

      const { count: readCount } = await supabase
        .from('whatsapp_messages')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'read')

      const { count: failedCount } = await supabase
        .from('whatsapp_messages')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'failed')

      // Load templates count
      const { count: templatesCount } = await supabase
        .from('whatsapp_templates')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved')

      // Load contacts count
      const { count: contactsCount } = await supabase
        .from('whatsapp_contacts')
        .select('*', { count: 'exact', head: true })

      setStats({
        totalConversations: conversationsCount || 0,
        activeConversations: activeCount || 0,
        totalMessages: messagesCount || 0,
        messagesSent: sentCount || 0,
        messagesDelivered: deliveredCount || 0,
        messagesRead: readCount || 0,
        messagesFailed: failedCount || 0,
        templates: templatesCount || 0,
        contacts: contactsCount || 0
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const deliveryRate = stats.messagesSent > 0 
    ? ((stats.messagesDelivered / stats.messagesSent) * 100).toFixed(1)
    : 0

  const readRate = stats.messagesDelivered > 0
    ? ((stats.messagesRead / stats.messagesDelivered) * 100).toFixed(1)
    : 0

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">WhatsApp Business CRM</h1>
          <p className="text-gray-600 mt-1">Manage conversations, send messages, and track engagement</p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/whatsapp/conversations">
            <Button variant="outline" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Conversations
            </Button>
          </Link>
          <Link href="/dashboard/whatsapp/send">
            <Button className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
              <Send className="h-4 w-4" />
              Send Message
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-4 mb-8">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
            <MessageSquare className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalConversations}</div>
            <p className="text-xs text-green-600 mt-1">
              {stats.activeConversations} active
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
            <Send className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.messagesSent}</div>
            <p className="text-xs text-gray-600 mt-1">
              {stats.messagesDelivered} delivered
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{deliveryRate}%</div>
            <p className="text-xs text-gray-600 mt-1">
              {stats.messagesFailed} failed
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Read Rate</CardTitle>
            <Eye className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{readRate}%</div>
            <p className="text-xs text-gray-600 mt-1">
              {stats.messagesRead} read
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Link href="/dashboard/whatsapp/conversations">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-green-500">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <MessageCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Conversations</h3>
                  <p className="text-sm text-gray-600">View and manage chats</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/whatsapp/templates">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-500">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Templates</h3>
                  <p className="text-sm text-gray-600">{stats.templates} approved templates</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/whatsapp/contacts">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-purple-500">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Contacts</h3>
                  <p className="text-sm text-gray-600">{stats.contacts} contacts</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Features Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <Link href="/dashboard/whatsapp/bot-builder">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-green-500">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="inline-flex p-3 bg-green-100 rounded-lg mb-3">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="font-semibold">Bot Builder</h3>
                <p className="text-sm text-gray-600 mt-1">Automate conversations</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/whatsapp/flows">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="inline-flex p-3 bg-indigo-100 rounded-lg mb-3">
                  <TrendingUp className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="font-semibold">WhatsApp Flows</h3>
                <p className="text-sm text-gray-600 mt-1">Interactive experiences</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/whatsapp/campaigns">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="inline-flex p-3 bg-orange-100 rounded-lg mb-3">
                  <Send className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="font-semibold">Campaigns</h3>
                <p className="text-sm text-gray-600 mt-1">Bulk messaging</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/whatsapp/analytics">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="inline-flex p-3 bg-pink-100 rounded-lg mb-3">
                  <TrendingUp className="h-6 w-6 text-pink-600" />
                </div>
                <h3 className="font-semibold">Analytics</h3>
                <p className="text-sm text-gray-600 mt-1">Performance insights</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/whatsapp/settings">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="inline-flex p-3 bg-gray-100 rounded-lg mb-3">
                  <Phone className="h-6 w-6 text-gray-600" />
                </div>
                <h3 className="font-semibold">Settings</h3>
                <p className="text-sm text-gray-600 mt-1">Configure WhatsApp</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Payment Model Info - Only for Level 2 (Business Owners) */}
      {!isSystemAdmin && (
        <Card className="mt-8 border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              Pricing & Payment Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Info Banner */}
              <div className="bg-blue-100 border border-blue-300 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">Transparent Pricing Model</p>
                    <p>We charge only for our CRM platform. WhatsApp API charges are billed directly by Meta (WhatsApp) to you.</p>
                  </div>
                </div>
              </div>

              {/* Payment Breakdown */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Platform Subscription */}
                <div className="bg-white rounded-lg border-2 border-green-200 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CreditCard className="h-5 w-5 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-lg">Platform Subscription</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-green-600">₹999</span>
                      <span className="text-gray-600">/month</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Pay to: <span className="font-medium">Our Platform</span>
                    </p>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Access to WhatsApp CRM platform</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>All features (messaging, analytics, templates)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Unlimited messages (via Meta)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Email support & updates</span>
                      </li>
                    </ul>
                    <div className="pt-3 mt-3 border-t">
                      <Link href="/dashboard/settings/billing">
                        <Button className="w-full bg-green-600 hover:bg-green-700">
                          <CreditCard className="h-4 w-4 mr-2" />
                          Manage Subscription
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Meta WhatsApp Charges */}
                <div className="bg-white rounded-lg border-2 border-blue-200 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Phone className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-lg">WhatsApp API Charges</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-blue-600">Pay-as-you-go</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Pay to: <span className="font-medium">Meta (WhatsApp) Directly</span>
                    </p>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span>First 1,000 conversations/month = <strong>FREE</strong></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span>After that: Pay per conversation</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span>Billed directly by Meta</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span>No markup from us</span>
                      </li>
                    </ul>
                    <div className="pt-3 mt-3 border-t">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => window.open('https://business.facebook.com/settings/billing', '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Setup Meta Payment
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Total Cost Example */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200 p-4">
                <h4 className="font-semibold text-gray-900 mb-2">💡 Example Monthly Cost:</h4>
                <div className="grid md:grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600">Platform Subscription</p>
                    <p className="text-lg font-bold text-gray-900">₹999</p>
                    <p className="text-xs text-gray-500">Fixed monthly</p>
                  </div>
                  <div>
                    <p className="text-gray-600">WhatsApp API (Meta)</p>
                    <p className="text-lg font-bold text-gray-900">~₹500</p>
                    <p className="text-xs text-gray-500">Variable (2,000 conversations)</p>
                  </div>
                  <div className="border-l-2 border-purple-300 pl-3">
                    <p className="text-gray-600">Total Estimated</p>
                    <p className="text-2xl font-bold text-purple-600">₹1,499</p>
                    <p className="text-xs text-gray-500">per month</p>
                  </div>
                </div>
              </div>

              {/* Benefits */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h4 className="font-semibold mb-3">✅ Why This Model?</h4>
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Transparent Pricing</p>
                      <p className="text-gray-600">You see exactly what Meta charges</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Direct Meta Relationship</p>
                      <p className="text-gray-600">Pay Meta directly, no middleman</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Lower Platform Cost</p>
                      <p className="text-gray-600">We only charge for CRM features</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Control Your Spending</p>
                      <p className="text-gray-600">Optimize WhatsApp usage yourself</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div className="flex flex-wrap gap-2 pt-2">
                <Link href="/dashboard/settings/billing">
                  <Button variant="outline" size="sm">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Manage Platform Payment
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('https://business.facebook.com/settings/billing', '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Meta Billing Dashboard
                </Button>
                <Link href="/dashboard/whatsapp/settings">
                  <Button variant="outline" size="sm">
                    <Phone className="h-4 w-4 mr-2" />
                    WhatsApp Settings
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Setup Status */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>WhatsApp Business Setup</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">WhatsApp Business API Connected</p>
                  <p className="text-sm text-gray-600">Your account is active and ready</p>
                </div>
              </div>
              <Link href="/dashboard/whatsapp/settings">
                <Button variant="outline" size="sm">Configure</Button>
              </Link>
            </div>

            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">Message Templates</p>
                  <p className="text-sm text-gray-600">{stats.templates} approved templates ready to use</p>
                </div>
              </div>
              <Link href="/dashboard/whatsapp/templates">
                <Button variant="outline" size="sm">Manage</Button>
              </Link>
            </div>

            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="font-medium">Webhooks Configured</p>
                  <p className="text-sm text-gray-600">Receiving real-time updates</p>
                </div>
              </div>
              <Link href="/dashboard/whatsapp/settings">
                <Button variant="outline" size="sm">View</Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}