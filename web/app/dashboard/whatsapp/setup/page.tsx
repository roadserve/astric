'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  CheckCircle, 
  Circle, 
  ExternalLink, 
  Copy, 
  AlertCircle,
  Loader2,
  CheckCircle2,
  XCircle,
  PlayCircle
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function WhatsAppSetupPage() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [testingConnection, setTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'not_tested' | 'testing' | 'success' | 'failed'>('not_tested')
  
  // Form data
  const [phoneNumberId, setPhoneNumberId] = useState('')
  const [businessAccountId, setBusinessAccountId] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [webhookVerifyToken, setWebhookVerifyToken] = useState('')
  
  // Check if already configured
  useEffect(() => {
    checkExistingConfig()
  }, [])

  const checkExistingConfig = async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .single()

      const { data: orgMember } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', profile?.id)
        .single()

      const { data: account } = await supabase
        .from('whatsapp_accounts')
        .select('*')
        .eq('organization_id', orgMember?.organization_id)
        .single()

      if (account) {
        // Already configured
        setPhoneNumberId(account.phone_number_id || '')
        setBusinessAccountId(account.business_account_id || '')
        setCurrentStep(5) // Jump to success
      }
    } catch (error) {
      console.log('No existing config found')
    }
  }

  const generateWebhookToken = () => {
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    setWebhookVerifyToken(token)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
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
        setConnectionStatus('failed')
        alert('❌ Connection failed. Please check your credentials.')
      }
    } catch (error) {
      setConnectionStatus('failed')
      alert('❌ Connection failed. Please check your credentials.')
    } finally {
      setTestingConnection(false)
    }
  }

  const saveConfiguration = async () => {
    if (!phoneNumberId || !businessAccountId || !accessToken) {
      alert('Please fill all required fields')
      return
    }

    setLoading(true)
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .single()

      const { data: orgMember } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', profile?.id)
        .single()

      // Save to database (in production, encrypt the access token)
      const { error } = await supabase
        .from('whatsapp_accounts')
        .upsert({
          organization_id: orgMember?.organization_id,
          phone_number_id: phoneNumberId,
          business_account_id: businessAccountId,
          access_token: accessToken, // TODO: Encrypt this in production
          webhook_verify_token: webhookVerifyToken,
          phone_number: phoneNumberId, // Will be updated from API
          display_name: 'WhatsApp Business',
          is_verified: true,
          status: 'active'
        })

      if (error) throw error

      alert('✅ Configuration saved successfully!')
      setCurrentStep(5)
    } catch (error: any) {
      console.error('Error saving configuration:', error)
      alert('Failed to save configuration: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const steps = [
    { number: 1, title: 'Create Meta Business Account', completed: currentStep > 1 },
    { number: 2, title: 'Setup WhatsApp API', completed: currentStep > 2 },
    { number: 3, title: 'Get Credentials', completed: currentStep > 3 },
    { number: 4, title: 'Configure Platform', completed: currentStep > 4 },
    { number: 5, title: 'Complete Setup', completed: currentStep >= 5 }
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">WhatsApp Business Setup</h1>
        <p className="text-gray-600 mt-1">Connect your WhatsApp Business Account to start messaging</p>
      </div>

      {/* Progress Steps */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            {steps.map((step, idx) => (
              <div key={step.number} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    step.completed 
                      ? 'bg-green-500 text-white' 
                      : step.number === currentStep
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-300 text-gray-600'
                  }`}>
                    {step.completed ? <CheckCircle className="h-5 w-5" /> : step.number}
                  </div>
                  <p className="text-xs text-gray-600 mt-2 text-center max-w-[100px]">{step.title}</p>
                </div>
                {idx < steps.length - 1 && (
                  <div className={`w-20 h-1 mx-2 ${step.completed ? 'bg-green-500' : 'bg-gray-300'}`} />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Create Meta Business Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">What you&apos;ll need:</h3>
              <ul className="space-y-1 text-sm text-blue-800">
                <li>• Business name and details</li>
                <li>• Valid email address</li>
                <li>• Business phone number</li>
                <li>• Business documents (for verification)</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold">Instructions:</h3>
              <ol className="space-y-2 text-sm text-gray-700">
                <li>1. Go to <a href="https://business.facebook.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">
                  Meta Business Suite <ExternalLink className="h-3 w-3" />
                </a></li>
                <li>2. Click &quot;Create Account&quot;</li>
                <li>3. Enter your business details</li>
                <li>4. Verify your email address</li>
                <li>5. Add your business information</li>
              </ol>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Important:</p>
                  <p>Business verification may take 1-3 business days. You can proceed with the next steps while waiting.</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => window.open('https://business.facebook.com', '_blank')}
                variant="outline"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Meta Business
              </Button>
              <Button
                onClick={() => setCurrentStep(2)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Next Step →
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Setup WhatsApp API</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <h3 className="font-semibold">Instructions:</h3>
              <ol className="space-y-2 text-sm text-gray-700">
                <li>1. Go to <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">
                  Meta Developers <ExternalLink className="h-3 w-3" />
                </a></li>
                <li>2. Click &quot;My Apps&quot; → &quot;Create App&quot;</li>
                <li>3. Select &quot;Business&quot; as app type</li>
                <li>4. Fill in app details and create</li>
                <li>5. In your app dashboard, find &quot;WhatsApp&quot; and click &quot;Set up&quot;</li>
                <li>6. Follow the setup wizard to add WhatsApp product</li>
                <li>7. Add or register a phone number for your business</li>
              </ol>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div className="text-sm text-green-800">
                  <p className="font-medium">Tip:</p>
                  <p>You can use a test number provided by Meta to try the API before using your actual business number.</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => setCurrentStep(1)}
                variant="outline"
              >
                ← Previous
              </Button>
              <Button
                onClick={() => window.open('https://developers.facebook.com', '_blank')}
                variant="outline"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Meta Developers
              </Button>
              <Button
                onClick={() => setCurrentStep(3)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Next Step →
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 3: Get Your Credentials</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-3">Where to find your credentials:</h3>
                
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="font-medium text-blue-900">📱 Phone Number ID:</p>
                    <p className="text-blue-800">WhatsApp → API Setup → Under &quot;Send and receive messages&quot;</p>
                  </div>
                  
                  <div>
                    <p className="font-medium text-blue-900">🏢 Business Account ID:</p>
                    <p className="text-blue-800">WhatsApp → API Setup → Top of the page</p>
                  </div>
                  
                  <div>
                    <p className="font-medium text-blue-900">🔑 Access Token:</p>
                    <p className="text-blue-800">WhatsApp → API Setup → Temporary Access Token (copy this)</p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium">Important: Create a Permanent Token!</p>
                    <p className="mt-1">The temporary token expires in 24 hours. To create a permanent token:</p>
                    <ol className="mt-2 space-y-1 ml-4">
                      <li>1. Go to Business Settings → System Users</li>
                      <li>2. Create a new System User</li>
                      <li>3. Add &quot;WhatsApp Business Management&quot; permission</li>
                      <li>4. Generate Token → Select your app → Generate</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => setCurrentStep(2)}
                variant="outline"
              >
                ← Previous
              </Button>
              <Button
                onClick={() => setCurrentStep(4)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                I Have My Credentials →
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 4: Configure Your Platform</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Phone Number ID */}
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
                Found in WhatsApp → API Setup → Phone Number ID
              </p>
            </div>

            {/* Business Account ID */}
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
                Found in WhatsApp → API Setup → Business Account ID
              </p>
            </div>

            {/* Access Token */}
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
                Create a permanent token (instructions in previous step)
              </p>
            </div>

            {/* Webhook Verify Token */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Webhook Verify Token
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={webhookVerifyToken}
                  onChange={(e) => setWebhookVerifyToken(e.target.value)}
                  placeholder="your_custom_token_here"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Button onClick={generateWebhookToken} variant="outline">
                  Generate
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Use this token when configuring webhook in Meta
              </p>
            </div>

            {/* Test Connection */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold mb-3">Test Connection</h3>
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

            {/* Save Configuration */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                onClick={() => setCurrentStep(3)}
                variant="outline"
              >
                ← Previous
              </Button>
              <Button
                onClick={saveConfiguration}
                disabled={loading || !phoneNumberId || !businessAccountId || !accessToken}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Configuration & Continue'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 5 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-6 w-6" />
              Setup Complete!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-green-900 mb-2">
                🎉 WhatsApp Connected Successfully!
              </h2>
              <p className="text-green-700">
                Your WhatsApp Business Account is now connected to the platform.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold">Next Steps:</h3>
              <div className="grid gap-3">
                <Link href="/dashboard/whatsapp/send">
                  <div className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-xl">💬</span>
                    </div>
                    <div>
                      <p className="font-medium">Send Your First Message</p>
                      <p className="text-sm text-gray-600">Start messaging your customers</p>
                    </div>
                  </div>
                </Link>

                <Link href="/dashboard/whatsapp/templates">
                  <div className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <span className="text-xl">📝</span>
                    </div>
                    <div>
                      <p className="font-medium">Create Message Templates</p>
                      <p className="text-sm text-gray-600">Setup pre-approved message templates</p>
                    </div>
                  </div>
                </Link>

                <Link href="/dashboard/whatsapp/settings">
                  <div className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <span className="text-xl">⚙️</span>
                    </div>
                    <div>
                      <p className="font-medium">Update Business Profile</p>
                      <p className="text-sm text-gray-600">Complete your WhatsApp business profile</p>
                    </div>
                  </div>
                </Link>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">📚 Helpful Resources:</h3>
              <ul className="space-y-1 text-sm text-blue-800">
                <li>• <a href="https://developers.facebook.com/docs/whatsapp" target="_blank" rel="noopener noreferrer" className="hover:underline">WhatsApp Business API Documentation</a></li>
                <li>• <a href="https://business.facebook.com/help" target="_blank" rel="noopener noreferrer" className="hover:underline">Meta Business Help Center</a></li>
                <li>• <a href="/dashboard/whatsapp" className="hover:underline">WhatsApp Dashboard</a></li>
              </ul>
            </div>

            <div className="pt-4">
              <Button
                onClick={() => router.push('/dashboard/whatsapp')}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Go to WhatsApp Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

