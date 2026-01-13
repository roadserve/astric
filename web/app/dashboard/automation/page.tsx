'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Zap,
  Plus,
  Play,
  Pause,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  AlertCircle,
  Sparkles,
  BarChart3
} from 'lucide-react'
import Link from 'next/link'

export default function AutomationPage() {
  const supabase = createClientComponentClient()
  const [workflows, setWorkflows] = useState<any[]>([])
  const [templates, setTemplates] = useState<any[]>([])
  const [subscription, setSubscription] = useState<any>(null)
  const [stats, setStats] = useState({
    totalWorkflows: 0,
    activeWorkflows: 0,
    totalExecutions: 0,
    successRate: 0
  })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'workflows' | 'templates'>('workflows')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get user's organization
      const { data: orgMember } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single()

      if (!orgMember) return

      // Load workflows
      const { data: workflowsData } = await supabase
        .from('automation_workflows')
        .select('*')
        .eq('organization_id', orgMember.organization_id)
        .order('created_at', { ascending: false })

      setWorkflows(workflowsData || [])

      // Load templates
      const { data: templatesData } = await supabase
        .from('automation_templates')
        .select('*')
        .order('is_featured', { ascending: false })
        .limit(6)

      setTemplates(templatesData || [])

      // Load subscription
      const { data: subData } = await supabase
        .from('automation_subscriptions')
        .select('*')
        .eq('organization_id', orgMember.organization_id)
        .single()

      setSubscription(subData)

      // Calculate stats
      const totalWorkflows = workflowsData?.length || 0
      const activeWorkflows = workflowsData?.filter(w => w.is_active).length || 0
      const totalExecutions = workflowsData?.reduce((sum, w) => sum + (w.execution_count || 0), 0) || 0

      setStats({
        totalWorkflows,
        activeWorkflows,
        totalExecutions,
        successRate: 95 // Will calculate from execution logs later
      })

    } catch (error) {
      console.error('Error loading automation data:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleWorkflow = async (workflowId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('automation_workflows')
        .update({ is_active: !currentStatus, updated_at: new Date().toISOString() })
        .eq('id', workflowId)

      if (error) throw error

      loadData()
    } catch (error: any) {
      alert('Error updating workflow: ' + error.message)
    }
  }

  const deleteWorkflow = async (workflowId: string, workflowName: string) => {
    if (!confirm(`Are you sure you want to delete "${workflowName}"?`)) return

    try {
      const { error } = await supabase
        .from('automation_workflows')
        .delete()
        .eq('id', workflowId)

      if (error) throw error

      alert('Workflow deleted successfully!')
      loadData()
    } catch (error: any) {
      alert('Error deleting workflow: ' + error.message)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Zap className="h-8 w-8 text-blue-600" />
            Automation
          </h1>
          <p className="text-gray-600 mt-1">
            Automate your business workflows and save time
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/automation/help">
            <Button variant="outline">
              <AlertCircle className="h-4 w-4 mr-2" />
              Help
            </Button>
          </Link>
          <Link href="/dashboard/automation/analytics">
            <Button variant="outline">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </Button>
          </Link>
          <Link href="/dashboard/automation/wizard">
            <Button className="bg-green-600 hover:bg-green-700">
              <Sparkles className="h-4 w-4 mr-2" />
              Simple Wizard
            </Button>
          </Link>
          <Link href="/dashboard/automation/create">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Advanced Editor
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Workflows</CardDescription>
            <CardTitle className="text-3xl">{stats.totalWorkflows}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              {subscription?.max_workflows - stats.totalWorkflows} remaining
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active Workflows</CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats.activeWorkflows}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">Currently running</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>This Month</CardDescription>
            <CardTitle className="text-3xl">{subscription?.current_month_executions || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              of {subscription?.max_executions_per_month} executions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Success Rate</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{stats.successRate}%</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              Excellent performance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Info */}
      {subscription && (
        <Card className="mb-8 border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg capitalize">{subscription.plan_type} Plan</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {subscription.max_workflows} workflows • {subscription.max_executions_per_month} executions/month
                </p>
              </div>
              <Button variant="outline" className="bg-white">
                <Sparkles className="h-4 w-4 mr-2" />
                Upgrade Plan
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('workflows')}
          className={`pb-3 px-1 font-medium transition-colors ${
            activeTab === 'workflows'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          My Workflows ({workflows.length})
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`pb-3 px-1 font-medium transition-colors ${
            activeTab === 'templates'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Templates ({templates.length})
        </button>
      </div>

      {/* Content */}
      {activeTab === 'workflows' ? (
        <div className="space-y-4">
          {workflows.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Zap className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No workflows yet</h3>
                <p className="text-gray-600 mb-6">
                  Create your first automation workflow to get started
                </p>
                <Link href="/dashboard/automation/create">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Workflow
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            workflows.map((workflow) => (
              <Card key={workflow.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{workflow.workflow_name}</h3>
                        {workflow.is_active ? (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                            Paused
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm mb-3">{workflow.description}</p>
                      <div className="flex items-center gap-6 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {workflow.execution_count || 0} executions
                        </div>
                        {workflow.last_executed_at && (
                          <div>
                            Last run: {new Date(workflow.last_executed_at).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/dashboard/automation/${workflow.id}/edit`}>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleWorkflow(workflow.id, workflow.is_active)}
                      >
                        {workflow.is_active ? (
                          <><Pause className="h-4 w-4 mr-1" /> Pause</>
                        ) : (
                          <><Play className="h-4 w-4 mr-1" /> Activate</>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteWorkflow(workflow.id, workflow.workflow_name)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="text-4xl mb-2">{template.icon}</div>
                  {template.is_featured && (
                    <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-full">
                      Featured
                    </span>
                  )}
                </div>
                <CardTitle className="text-lg">{template.name}</CardTitle>
                <CardDescription>{template.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/dashboard/automation/wizard">
                  <Button className="w-full" variant="outline">
                    Use Template
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
