'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Bot, Sparkles, FileText, MessageSquare, TrendingUp } from 'lucide-react'

export default function AIPage() {
  const supabase = createClientComponentClient()
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const sendMessage = async () => {
    if (!input.trim()) return

    const userMessage = { role: 'user', content: input }
    setMessages([...messages, userMessage])
    setInput('')
    setLoading(true)

    try {
      const { data, error } = await supabase.functions.invoke('ai_reply_suggest', {
        body: {
          message: input,
          context: 'business_query',
        },
      })

      if (error) throw error

      const aiMessage = {
        role: 'assistant',
        content: data.reply || 'I apologize, but I encountered an error.',
      }
      setMessages((prev) => [...prev, aiMessage])
    } catch (error) {
      console.error('Error:', error)
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  const scanInvoice = async () => {
    alert('Invoice scanning feature - Upload an invoice image to extract data using AI OCR')
  }

  const getSmartReplies = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('ai_reply_suggest', {
        body: {
          context: 'payment_reminder',
          customer_name: 'Demo Customer',
        },
      })

      if (error) throw error

      const suggestions = data.suggestions || [
        'Thank you for your business! Your payment is due.',
        'Gentle reminder: Invoice payment pending.',
        'Please process the pending payment at your earliest convenience.',
      ]

      alert('Smart Reply Suggestions:\n\n' + suggestions.join('\n\n'))
    } catch (error) {
      console.error('Error:', error)
      alert('Error getting suggestions')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">AI Copilot</h1>
          <p className="text-gray-600 mt-1">AI-powered business assistant</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={scanInvoice}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scan Invoice</CardTitle>
              <FileText className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-600">Extract data from invoices using AI OCR</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={getSmartReplies}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Smart Replies</CardTitle>
              <MessageSquare className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-600">Get AI-generated reply suggestions</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Business Insights</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-600">AI-powered business analytics</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI Assistant</CardTitle>
              <Bot className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-600">Chat with AI about your business</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Chat Interface */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                AI Chat Assistant
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="h-96 overflow-y-auto border rounded-lg p-4 bg-gray-50">
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <div className="text-center">
                        <Bot className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p>Ask me anything about your business!</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((msg, idx) => (
                        <div
                          key={idx}
                          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs px-4 py-2 rounded-lg ${
                              msg.role === 'user'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white border'
                            }`}
                          >
                            {msg.content}
                          </div>
                        </div>
                      ))}
                      {loading && (
                        <div className="flex justify-start">
                          <div className="bg-white border px-4 py-2 rounded-lg">
                            <div className="flex space-x-2">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Ask me anything..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    disabled={loading}
                  />
                  <Button onClick={sendMessage} disabled={loading || !input.trim()}>
                    Send
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Business Insights */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                AI Business Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-green-900">Revenue Trend</h4>
                      <p className="text-sm text-green-700 mt-1">
                        Your revenue is up 15% this month compared to last month
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <MessageSquare className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-orange-900">Outstanding Payments</h4>
                      <p className="text-sm text-orange-700 mt-1">
                        5 invoices are overdue. Consider sending payment reminders
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Bot className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900">Top Customer</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        ABC Corp contributed 30% of your total revenue this month
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Sparkles className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-purple-900">Recommendation</h4>
                      <p className="text-sm text-purple-700 mt-1">
                        Send payment reminders to improve cash flow by 20%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
