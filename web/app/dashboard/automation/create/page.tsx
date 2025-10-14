'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Save, Play } from 'lucide-react'
import Link from 'next/link'

export default function CreateWorkflowPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    trigger: 'manual',
    actions: []
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Create basic workflow structure
      const workflowData = {
        nodes: [
          {
            id: 'trigger',
            name: 'Manual Trigger',
            type: 'n8n-nodes-base.manualTrigger',
            typeVersion: 1,
            position: [250, 300],
            parameters: {}
          }
        ],
        connections: {}
      }

      const response = await fetch('/api/automation/workflows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          workflowData
        }),
      })

      if (!response.ok) {
        // Prefer JSON errors, but fall back to text to avoid HTML parsing errors in dev
        let message = 'Failed to create workflow'
        try {
          const error = await response.clone().json()
          message = (error as any)?.error || JSON.stringify(error)
        } catch (_) {
          const text = await response.text()
          // Trim dev HTML error pages
          message = text?.slice(0, 300) || message
        }
        throw new Error(message)
      }

      const { workflow } = await response.json()
      alert('Workflow created successfully!')
      router.push('/dashboard/automation')
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link href="/dashboard/automation">
          <Button variant="outline" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Automation
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Create Workflow</h1>
        <p className="text-gray-600 mt-1">
          Build a new automation workflow
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Workflow Details</CardTitle>
            <CardDescription>
              Provide basic information about your workflow
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Workflow Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Workflow Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Send Invoice via WhatsApp"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe what this workflow does..."
                rows={3}
              />
            </div>

            {/* Trigger Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trigger Type
              </label>
              <select
                value={formData.trigger}
                onChange={(e) => setFormData({ ...formData, trigger: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="manual">Manual Trigger</option>
                <option value="schedule">Schedule</option>
                <option value="webhook">Webhook</option>
                <option value="database">Database Event</option>
              </select>
              <p className="text-sm text-gray-500 mt-1">
                How should this workflow be triggered?
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">What happens next?</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Your workflow will be created with a basic structure</li>
                <li>• You can add actions and configure triggers</li>
                <li>• Test the workflow before activating it</li>
                <li>• Monitor executions from the dashboard</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={loading || !formData.name}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Creating...' : 'Create Workflow'}
              </Button>
              <Link href="/dashboard/automation">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Available Features */}
      <Card className="mt-6 border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-lg text-green-900">✅ Advanced Features Included</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="bg-white p-3 rounded-lg border border-green-200">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <span className="text-green-600">✓</span> Visual Editor
              </h4>
              <p className="text-gray-600">Drag-and-drop interface with 12+ node types</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-green-200">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <span className="text-green-600">✓</span> Pre-built Actions
              </h4>
              <p className="text-gray-600">WhatsApp, Email, SMS, HTTP, Database, and more</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-green-200">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <span className="text-green-600">✓</span> Conditional Logic
              </h4>
              <p className="text-gray-600">IF conditions, loops, delays, and filters</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-green-200">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <span className="text-green-600">✓</span> Error Handling
              </h4>
              <p className="text-gray-600">Automatic retries, error logs, and notifications</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-green-200">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <span className="text-green-600">✓</span> Analytics Dashboard
              </h4>
              <p className="text-gray-600">Track performance, success rates, and trends</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-green-200">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <span className="text-green-600">✓</span> Version Control
              </h4>
              <p className="text-gray-600">Auto-versioning, rollback, and change history</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-green-200">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <span className="text-green-600">✓</span> A/B Testing
              </h4>
              <p className="text-gray-600">Test workflow variants and optimize performance</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-green-200">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <span className="text-green-600">✓</span> AI Integration
              </h4>
              <p className="text-gray-600">AI-powered processing and smart automation</p>
            </div>
          </div>
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>💡 Pro Tip:</strong> After creating a workflow, click "Edit" to access the visual editor and start building!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
