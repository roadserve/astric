'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight, Check, Mail, MessageSquare, Calendar, Database, Zap } from 'lucide-react'
import Link from 'next/link'

// Common workflow templates for non-tech users
const WORKFLOW_TEMPLATES = [
  {
    id: 'email-notification',
    name: 'ईमेल भेजें / Send Email Notification',
    description: 'जब कोई trigger हो तो automatic email भेजें',
    icon: <Mail className="h-8 w-8" />,
    color: 'blue',
    steps: [
      { field: 'trigger', label: 'कब Email भेजना है?', type: 'select', options: ['नया customer जुड़े', 'Order मिले', 'Daily report के लिए'] },
      { field: 'smtp_host', label: 'Email Provider (e.g. smtp.gmail.com)', type: 'text' },
      { field: 'smtp_user', label: 'आपका Email', type: 'email' },
      { field: 'smtp_password', label: 'Email Password / App Password', type: 'password' },
      { field: 'to_email', label: 'किसको Email भेजना है?', type: 'email' },
      { field: 'subject', label: 'Email Subject', type: 'text' },
      { field: 'message', label: 'Email Message', type: 'textarea' }
    ],
    buildWorkflow: (data: any) => ({
      trigger: 'webhook',
      nodes: [
        { type: 'webhook', name: 'Webhook Trigger', params: { method: 'POST', path: `/webhook-${Date.now()}` } },
        { type: 'send_email', name: 'Send Email', params: {
          smtp: { host: data.smtp_host, port: 587, secure: false, user: data.smtp_user, password: data.smtp_password },
          to: data.to_email,
          subject: data.subject,
          body: data.message
        }}
      ]
    })
  },
  {
    id: 'whatsapp-alert',
    name: 'व्हाट्सएप मेसेज / WhatsApp Alert',
    description: 'Important updates WhatsApp पर भेजें',
    icon: <MessageSquare className="h-8 w-8" />,
    color: 'green',
    steps: [
      { field: 'whatsapp_api_key', label: 'WhatsApp API Key', type: 'text' },
      { field: 'whatsapp_number', label: 'किसको मेसेज भेजना है? (91XXXXXXXXXX)', type: 'text' },
      { field: 'message', label: 'Message', type: 'textarea' }
    ],
    buildWorkflow: (data: any) => ({
      trigger: 'webhook',
      nodes: [
        { type: 'webhook', name: 'Webhook Trigger', params: { method: 'POST', path: `/wa-${Date.now()}` } },
        { type: 'send_whatsapp', name: 'Send WhatsApp', params: {
          api_key: data.whatsapp_api_key,
          to: data.whatsapp_number,
          message: data.message
        }}
      ]
    })
  },
  {
    id: 'daily-report',
    name: 'रोज़ाना रिपोर्ट / Daily Report',
    description: 'हर दिन एक fixed time पर report email करें',
    icon: <Calendar className="h-8 w-8" />,
    color: 'purple',
    steps: [
      { field: 'time', label: 'किस समय Report चाहिए? (जैसे: 09:00)', type: 'time' },
      { field: 'smtp_host', label: 'Email Provider', type: 'text', default: 'smtp.gmail.com' },
      { field: 'smtp_user', label: 'आपका Email', type: 'email' },
      { field: 'smtp_password', label: 'Password', type: 'password' },
      { field: 'to_email', label: 'Report किसको भेजें?', type: 'email' },
      { field: 'report_type', label: 'कौनसी Report?', type: 'select', options: ['Sales Report', 'Customer Report', 'Inventory Report'] }
    ],
    buildWorkflow: (data: any) => {
      const [hour, minute] = (data.time || '09:00').split(':')
      return {
        trigger: 'schedule',
        nodes: [
          { type: 'schedule', name: 'Daily Schedule', params: { cron: `${minute} ${hour} * * *` } },
          { type: 'database_query', name: 'Fetch Data', params: { query: `SELECT * FROM sales WHERE date = CURDATE()` } },
          { type: 'send_email', name: 'Send Report', params: {
            smtp: { host: data.smtp_host, port: 587, secure: false, user: data.smtp_user, password: data.smtp_password },
            to: data.to_email,
            subject: `Daily ${data.report_type} - ${new Date().toLocaleDateString()}`,
            body: 'Report attached (data from database)'
          }}
        ]
      }
    }
  }
]

export default function WorkflowWizardPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [step, setStep] = useState(0)
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [formData, setFormData] = useState<any>({})
  const [creating, setCreating] = useState(false)

  const currentSteps = selectedTemplate?.steps || []
  const totalSteps = currentSteps.length + 2 // +2 for template selection and confirmation

  const handleCreateWorkflow = async () => {
    setCreating(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not logged in')

      const { data: orgMember } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single()
      if (!orgMember) throw new Error('No organization')

      const workflowData = selectedTemplate.buildWorkflow(formData)
      
      // Create workflow
      const { data: workflow, error } = await supabase
        .from('automation_workflows')
        .insert({
          organization_id: orgMember.organization_id,
          workflow_name: selectedTemplate.name,
          description: selectedTemplate.description,
          trigger_type: workflowData.trigger,
          workflow_data: workflowData,
          is_active: true
        })
        .select()
        .single()

      if (error) throw error

      // Create nodes
      for (let i = 0; i < workflowData.nodes.length; i++) {
        const node = workflowData.nodes[i]
        await supabase
          .from('automation_workflow_nodes')
          .insert({
            workflow_id: workflow.id,
            node_id: `node_${i}`,
            node_type: node.type,
            node_name: node.name,
            parameters: node.params,
            position_x: 100,
            position_y: 100 + i * 100,
            order_index: i
          })
      }

      alert('✅ Workflow बन गया! आपका automation अब active है।')
      router.push('/dashboard/automation')
    } catch (error: any) {
      alert('Error: ' + error.message)
    } finally {
      setCreating(false)
    }
  }

  // Step 0: Template Selection
  if (step === 0) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <Link href="/dashboard/automation">
          <Button variant="outline" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Simple Automation Wizard</h1>
          <p className="text-gray-600">बिना technical knowledge के automation बनाएं - step by step</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {WORKFLOW_TEMPLATES.map((template) => (
            <Card 
              key={template.id}
              className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-blue-500"
              onClick={() => {
                setSelectedTemplate(template)
                setFormData({})
                setStep(1)
              }}
            >
              <CardHeader>
                <div className={`mb-4 p-4 bg-${template.color}-100 rounded-full w-fit`}>
                  {template.icon}
                </div>
                <CardTitle className="text-lg">{template.name}</CardTitle>
                <CardDescription className="text-base">{template.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  इस्तेमाल करें / Use This <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // Steps 1 to N: Form fields
  if (step <= currentSteps.length) {
    const currentField = currentSteps[step - 1]
    
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">{selectedTemplate.name}</h2>
            <span className="text-sm text-gray-600">Step {step} of {totalSteps - 1}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${(step / (totalSteps - 1)) * 100}%` }}
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{currentField.label}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentField.type === 'select' ? (
              <select
                className="w-full px-4 py-3 border-2 rounded-lg text-lg"
                value={formData[currentField.field] || ''}
                onChange={(e) => setFormData({ ...formData, [currentField.field]: e.target.value })}
              >
                <option value="">चुनें / Select...</option>
                {currentField.options?.map((opt: string) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : currentField.type === 'textarea' ? (
              <textarea
                className="w-full px-4 py-3 border-2 rounded-lg text-lg"
                rows={6}
                placeholder={currentField.label}
                value={formData[currentField.field] || ''}
                onChange={(e) => setFormData({ ...formData, [currentField.field]: e.target.value })}
              />
            ) : (
              <input
                type={currentField.type}
                className="w-full px-4 py-3 border-2 rounded-lg text-lg"
                placeholder={currentField.label}
                value={formData[currentField.field] || currentField.default || ''}
                onChange={(e) => setFormData({ ...formData, [currentField.field]: e.target.value })}
              />
            )}

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                पीछे / Back
              </Button>
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => setStep(step + 1)}
                disabled={!formData[currentField.field]}
              >
                आगे / Next <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Final step: Confirmation
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">✅ तैयार है! / Ready!</h2>
        <p className="text-gray-600">आपका automation setup हो गया है</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>आपकी Settings:</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {currentSteps.map((field: any) => (
            <div key={field.field} className="flex justify-between py-2 border-b">
              <span className="font-medium">{field.label}:</span>
              <span className="text-gray-600">
                {field.type === 'password' ? '••••••••' : (formData[field.field] || '-')}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep(step - 1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          पीछे / Back
        </Button>
        <Button 
          className="bg-green-600 hover:bg-green-700"
          onClick={handleCreateWorkflow}
          disabled={creating}
        >
          {creating ? 'बना रहे हैं...' : (
            <>
              <Check className="h-4 w-4 mr-2" />
              Automation शुरू करें / Create Workflow
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
