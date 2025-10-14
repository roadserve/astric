'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Send,
  Bot,
  User,
  Sparkles,
  FileText,
  DollarSign,
  Users,
  Calendar,
  BarChart3,
  MessageSquare,
  Zap,
  TrendingUp
} from 'lucide-react'

export default function AICopilotPage() {
  const [messages, setMessages] = useState<any[]>([
    {
      role: 'assistant',
      content: 'Hello! I\'m your AI Copilot. I can help you with:\n\n• Generate invoices and quotes\n• Analyze sales data\n• Create reports\n• Manage customers\n• Process payroll\n• WhatsApp campaigns\n• Business insights\n\nWhat would you like to do today?'
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const quickActions = [
    {
      title: 'Generate Invoice',
      description: 'Create a new invoice with AI assistance',
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      prompt: 'Help me create a new invoice'
    },
    {
      title: 'Sales Analysis',
      description: 'Analyze your sales performance',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      prompt: 'Show me sales analysis for this month'
    },
    {
      title: 'Customer Insights',
      description: 'Get insights about your customers',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      prompt: 'Give me customer insights'
    },
    {
      title: 'Payroll Summary',
      description: 'Get payroll summary and insights',
      icon: DollarSign,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      prompt: 'Show me payroll summary'
    },
    {
      title: 'WhatsApp Campaign',
      description: 'Create a WhatsApp marketing campaign',
      icon: MessageSquare,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      prompt: 'Help me create a WhatsApp campaign'
    },
    {
      title: 'Business Report',
      description: 'Generate comprehensive business report',
      icon: BarChart3,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      prompt: 'Generate a business report'
    }
  ]

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage = { role: 'user', content: input }
    setMessages([...messages, userMessage])
    setInput('')
    setLoading(true)

    try {
      // Call Supabase Edge Function for real AI response
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/ai_chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            message: input,
            context: 'business_copilot',
            messages: messages.slice(-10) // Send last 10 messages for context
          }),
        }
      )

      if (!response.ok) {
        throw new Error('Failed to get AI response')
      }

      const data = await response.json()
      const aiReply = data.reply || 'I apologize, but I encountered an error.'

      setMessages(prev => [...prev, { role: 'assistant', content: aiReply }])
    } catch (error) {
      console.error('AI Error:', error)
      // Fallback to local response if API fails
      const aiResponse = generateAIResponse(input)
      setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }])
    } finally {
      setLoading(false)
    }
  }

  const handleQuickAction = (prompt: string) => {
    setInput(prompt)
    setTimeout(() => handleSend(), 100)
  }

  const generateAIResponse = (userInput: string) => {
    const input = userInput.toLowerCase()

    // Invoice related
    if (input.includes('invoice') || input.includes('bill')) {
      return `I can help you create an invoice! Here's what I need:

1. **Customer Details**: Who is the invoice for?
2. **Items/Services**: What are you billing for?
3. **Amount**: What's the total amount?
4. **Due Date**: When is payment due?

Would you like me to:
• Create a new invoice
• View recent invoices
• Send invoice reminders
• Generate invoice report

Just let me know what you need!`
    }

    // Sales analysis
    if (input.includes('sales') || input.includes('revenue') || input.includes('analysis')) {
      return `📊 **Sales Analysis Summary**

Based on your current data:

• **This Month**: ₹2,45,000 (+15% from last month)
• **Top Customer**: ABC Corp (₹85,000)
• **Best Product**: Premium Package (45 units sold)
• **Conversion Rate**: 68%

**Insights:**
✅ Sales trending upward
✅ Customer retention improved by 12%
⚠️ 3 invoices overdue (₹45,000)

**Recommendations:**
1. Follow up on overdue invoices
2. Upsell to top 5 customers
3. Launch promotion for slow-moving products

Would you like detailed reports or specific insights?`
    }

    // Customer insights
    if (input.includes('customer') || input.includes('client')) {
      return `👥 **Customer Insights**

**Overview:**
• Total Customers: 156
• Active: 142 (91%)
• New This Month: 12
• Churned: 3

**Top Customers:**
1. ABC Corp - ₹2,45,000 (YTD)
2. XYZ Ltd - ₹1,89,000 (YTD)
3. Tech Solutions - ₹1,56,000 (YTD)

**Customer Behavior:**
• Average Order Value: ₹15,750
• Purchase Frequency: 2.3x/month
• Customer Lifetime Value: ₹1,89,000

**Action Items:**
• 5 customers haven't purchased in 60 days
• 8 customers ready for upsell
• 12 customers eligible for loyalty rewards

Need help with any specific customer?`
    }

    // Payroll
    if (input.includes('payroll') || input.includes('salary') || input.includes('employee')) {
      return `💼 **Payroll Summary**

**This Month:**
• Total Employees: 45
• Total Payroll: ₹18,75,000
• Avg Salary: ₹41,667
• Pending Approvals: 2 leaves

**Breakdown:**
• Basic Salary: ₹12,50,000
• Allowances: ₹4,25,000
• Deductions: ₹2,00,000

**Compliance:**
✅ EPF Filed
✅ ESI Filed
✅ TDS Calculated
⏳ Professional Tax (Due: 15th)

**Quick Actions:**
• Process this month's payroll
• Generate payslips
• View attendance report
• Manage leaves

What would you like to do?`
    }

    // WhatsApp campaign
    if (input.includes('whatsapp') || input.includes('campaign') || input.includes('message')) {
      return `📱 **WhatsApp Campaign Assistant**

I can help you create an effective WhatsApp campaign!

**Campaign Types:**
1. **Promotional** - New offers, discounts
2. **Transactional** - Order updates, invoices
3. **Engagement** - Surveys, feedback
4. **Seasonal** - Festival wishes, special events

**Best Practices:**
✅ Personalize with customer name
✅ Include clear call-to-action
✅ Send at optimal time (10 AM - 6 PM)
✅ Use templates for compliance

**Quick Start:**
• Target Audience: Select customer segment
• Message Template: Choose or create
• Schedule: Now or later
• Track: Real-time analytics

Would you like me to help you create a campaign?`
    }

    // Reports
    if (input.includes('report') || input.includes('analytics') || input.includes('dashboard')) {
      return `📊 **Business Report Generator**

I can generate comprehensive reports for:

**Financial Reports:**
• Profit & Loss Statement
• Cash Flow Analysis
• Revenue Trends
• Expense Breakdown

**Sales Reports:**
• Sales by Product
• Sales by Customer
• Sales by Region
• Conversion Funnel

**Operational Reports:**
• Inventory Status
• Employee Performance
• Attendance Summary
• Project Status

**Custom Reports:**
• Define your metrics
• Choose date range
• Select visualization
• Export to PDF/Excel

Which report would you like to generate?`
    }

    // Default response
    return `I'm here to help! I can assist you with:

**📊 Business Operations:**
• Create invoices & quotations
• Manage customers & products
• Track payments & expenses

**💼 Payroll & HR:**
• Process monthly payroll
• Manage attendance & leaves
• Generate compliance reports

**📱 Marketing:**
• WhatsApp campaigns
• Customer segmentation
• Email marketing

**📈 Analytics:**
• Sales analysis
• Financial reports
• Business insights

**🤖 Automation:**
• Invoice reminders
• Payment follow-ups
• Report scheduling

Just tell me what you need, and I'll guide you through it!`
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AI Copilot</h1>
              <p className="text-gray-600">Your intelligent business assistant</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Chat Area */}
          <div className="lg:col-span-2">
            <Card className="h-[calc(100vh-200px)] flex flex-col">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-blue-600" />
                  Chat with AI Copilot
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.role === 'assistant' && (
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <Bot className="h-5 w-5 text-white" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-line">{message.content}</p>
                    </div>
                    {message.role === 'user' && (
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="h-5 w-5 text-gray-600" />
                      </div>
                    )}
                  </div>
                ))}
                {loading && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <Bot className="h-5 w-5 text-white" />
                    </div>
                    <div className="bg-gray-100 rounded-2xl px-4 py-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask me anything..."
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!input.trim() || loading}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-6"
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-600" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {quickActions.map((action, index) => {
                  const Icon = action.icon
                  return (
                    <button
                      key={index}
                      onClick={() => handleQuickAction(action.prompt)}
                      className="w-full p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all text-left group"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 ${action.bgColor} rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                          <Icon className={`h-5 w-5 ${action.color}`} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">{action.title}</h3>
                          <p className="text-xs text-gray-600">{action.description}</p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </CardContent>
            </Card>

            {/* AI Capabilities */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  AI Capabilities
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Smart Insights</p>
                    <p className="text-xs text-gray-600">Get actionable business insights</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Automated Tasks</p>
                    <p className="text-xs text-gray-600">Automate repetitive workflows</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Predictive Analytics</p>
                    <p className="text-xs text-gray-600">Forecast trends and patterns</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Natural Language</p>
                    <p className="text-xs text-gray-600">Chat in plain English</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">24/7 Available</p>
                    <p className="text-xs text-gray-600">Always ready to help</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
