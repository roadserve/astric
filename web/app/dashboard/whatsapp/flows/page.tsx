'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Plus, 
  TrendingUp, 
  Eye,
  Edit,
  Trash2,
  Copy,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  FileText,
  List,
  Calendar,
  Hash,
  ToggleLeft,
  Users,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Play
} from 'lucide-react'

interface Flow {
  id: string
  name: string
  status: string
  description: string
  screens: any[]
  created_at: string
  whatsapp_flow_id?: string
}

type FieldType = 'TextInput' | 'TextArea' | 'Dropdown' | 'RadioButtonsGroup' | 'CheckboxGroup' | 'DatePicker' | 'OptIn'

export default function FlowsPage() {
  const supabase = createClientComponentClient()
  const [flows, setFlows] = useState<Flow[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedFlow, setSelectedFlow] = useState<Flow | null>(null)

  // Form state
  const [flowName, setFlowName] = useState('')
  const [flowDescription, setFlowDescription] = useState('')
  const [screens, setScreens] = useState<any[]>([{
    id: 'SCREEN_1',
    title: 'Screen 1',
    layout: {
      type: 'SingleColumnLayout',
      children: []
    }
  }])
  const [currentScreenIndex, setCurrentScreenIndex] = useState(0)

  useEffect(() => {
    loadFlows()
  }, [])

  const loadFlows = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('whatsapp_flows')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setFlows(data || [])
    } catch (error) {
      console.error('Error loading flows:', error)
    } finally {
      setLoading(false)
    }
  }

  const addScreen = () => {
    const newScreenId = `SCREEN_${screens.length + 1}`
    setScreens([...screens, {
      id: newScreenId,
      title: `Screen ${screens.length + 1}`,
      layout: {
        type: 'SingleColumnLayout',
        children: []
      }
    }])
  }

  const addField = (fieldType: FieldType) => {
    const currentScreen = screens[currentScreenIndex]
    const fieldId = `field_${Date.now()}`
    
    const fieldConfig: any = {
      type: fieldType,
      name: fieldId,
      label: `${fieldType} Field`,
      required: false
    }

    // Add type-specific properties
    switch (fieldType) {
      case 'TextInput':
        fieldConfig['input-type'] = 'text'
        fieldConfig['min-chars'] = 1
        fieldConfig['max-chars'] = 100
        break
      case 'TextArea':
        fieldConfig['max-length'] = 1000
        break
      case 'Dropdown':
        fieldConfig['data-source'] = []
        break
      case 'RadioButtonsGroup':
      case 'CheckboxGroup':
        fieldConfig['data-source'] = []
        break
      case 'DatePicker':
        fieldConfig['format'] = 'YYYY-MM-DD'
        break
      case 'OptIn':
        fieldConfig['on-click-action'] = { name: 'data_exchange', payload: {} }
        break
    }

    const updatedScreens = [...screens]
    updatedScreens[currentScreenIndex].layout.children.push(fieldConfig)
    setScreens(updatedScreens)
  }

  const updateField = (fieldIndex: number, property: string, value: any) => {
    const updatedScreens = [...screens]
    updatedScreens[currentScreenIndex].layout.children[fieldIndex][property] = value
    setScreens(updatedScreens)
  }

  const removeField = (fieldIndex: number) => {
    const updatedScreens = [...screens]
    updatedScreens[currentScreenIndex].layout.children.splice(fieldIndex, 1)
    setScreens(updatedScreens)
  }

  const handleCreateFlow = async () => {
    if (!flowName.trim()) {
      alert('Flow name is required')
      return
    }

    if (screens.length === 0 || screens[0].layout.children.length === 0) {
      alert('Please add at least one field to the flow')
      return
    }

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

      // Create flow JSON according to WhatsApp Flows spec
      const flowJSON = {
        version: '3.0',
        screens: screens
      }

      const { error } = await supabase
        .from('whatsapp_flows')
        .insert({
          organization_id: orgMember?.organization_id,
          name: flowName,
          description: flowDescription,
          status: 'draft',
          flow_json: flowJSON,
          created_by: profile?.id
        })

      if (error) throw error

      alert('Flow created successfully!')
      resetForm()
      setShowCreateModal(false)
      loadFlows()
    } catch (error) {
      console.error('Error creating flow:', error)
      alert('Failed to create flow')
    }
  }

  const handlePublishFlow = async (flowId: string) => {
    if (!confirm('Publish this flow to WhatsApp? It will be reviewed before going live.')) return

    try {
      // Call Edge Function to publish flow to WhatsApp
      const { data, error } = await supabase.functions.invoke('whatsapp_flow_publish', {
        body: { flow_id: flowId, action: 'publish' }
      })

      if (error) throw error

      alert('Flow submitted for review!')
      loadFlows()
    } catch (error) {
      console.error('Error publishing flow:', error)
      alert('Failed to publish flow')
    }
  }

  const handleDeleteFlow = async (flowId: string) => {
    if (!confirm('Are you sure you want to delete this flow?')) return

    try {
      const { error } = await supabase
        .from('whatsapp_flows')
        .delete()
        .eq('id', flowId)

      if (error) throw error
      loadFlows()
    } catch (error) {
      console.error('Error deleting flow:', error)
    }
  }

  const resetForm = () => {
    setFlowName('')
    setFlowDescription('')
    setScreens([{
      id: 'SCREEN_1',
      title: 'Screen 1',
      layout: {
        type: 'SingleColumnLayout',
        children: []
      }
    }])
    setCurrentScreenIndex(0)
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: { color: 'bg-gray-100 text-gray-800', icon: FileText, label: 'Draft' },
      published: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Published' },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending Review' },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Rejected' }
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

  const fieldTypes: { type: FieldType; icon: any; label: string }[] = [
    { type: 'TextInput', icon: FileText, label: 'Text Input' },
    { type: 'TextArea', icon: List, label: 'Text Area' },
    { type: 'Dropdown', icon: ChevronDown, label: 'Dropdown' },
    { type: 'RadioButtonsGroup', icon: ToggleLeft, label: 'Radio Buttons' },
    { type: 'CheckboxGroup', icon: CheckCircle, label: 'Checkboxes' },
    { type: 'DatePicker', icon: Calendar, label: 'Date Picker' },
    { type: 'OptIn', icon: CheckCircle, label: 'Opt-In' }
  ]

  const stats = {
    total: flows.length,
    published: flows.filter(f => f.status === 'published').length,
    draft: flows.filter(f => f.status === 'draft').length,
    pending: flows.filter(f => f.status === 'pending').length
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">WhatsApp Flows</h1>
          <p className="text-gray-600 mt-1">Create interactive forms and experiences</p>
        </div>
        <Button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
        >
          <Plus className="h-4 w-4" />
          Create Flow
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Flows</CardTitle>
            <FileText className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.published}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft</CardTitle>
            <FileText className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.draft}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
      </div>

      {/* Flows List */}
      <div className="grid gap-6">
        {loading ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              Loading flows...
            </CardContent>
          </Card>
        ) : flows.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No flows yet</h3>
              <p className="text-gray-600 mb-4">Create your first WhatsApp Flow to collect information from customers</p>
              <Button onClick={() => setShowCreateModal(true)} className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                Create Flow
              </Button>
            </CardContent>
          </Card>
        ) : (
          flows.map((flow) => (
            <Card key={flow.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{flow.name}</h3>
                      {getStatusBadge(flow.status)}
                    </div>
                    
                    {flow.description && (
                      <p className="text-gray-600 mb-3">{flow.description}</p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{flow.screens?.length || 0} screens</span>
                      <span>Created: {new Date(flow.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedFlow(flow)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    {flow.status === 'draft' && (
                      <>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handlePublishFlow(flow.id)}
                          className="text-green-600"
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    <Button variant="ghost" size="sm">
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteFlow(flow.id)}
                      className="text-red-600"
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

      {/* Create Flow Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <Card className="w-full max-w-6xl my-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Create WhatsApp Flow</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowCreateModal(false)}>
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Info */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Flow Name *</label>
                  <input
                    type="text"
                    value={flowName}
                    onChange={(e) => setFlowName(e.target.value)}
                    placeholder="Lead Generation Form"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <input
                    type="text"
                    value={flowDescription}
                    onChange={(e) => setFlowDescription(e.target.value)}
                    placeholder="Collect customer information"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              {/* Screen Tabs */}
              <div className="border-b border-gray-200">
                <div className="flex items-center gap-2 overflow-x-auto">
                  {screens.map((screen, index) => (
                    <button
                      key={screen.id}
                      onClick={() => setCurrentScreenIndex(index)}
                      className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                        currentScreenIndex === index
                          ? 'border-green-600 text-green-600'
                          : 'border-transparent text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {screen.title}
                    </button>
                  ))}
                  <Button variant="ghost" size="sm" onClick={addScreen}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Field Types */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Add Fields</label>
                <div className="grid grid-cols-4 gap-2">
                  {fieldTypes.map((field) => {
                    const Icon = field.icon
                    return (
                      <button
                        key={field.type}
                        onClick={() => addField(field.type)}
                        className="p-3 border border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
                      >
                        <Icon className="h-5 w-5 mx-auto mb-1 text-gray-600" />
                        <p className="text-xs font-medium text-gray-700">{field.label}</p>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Current Screen Fields */}
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 min-h-[300px]">
                <h3 className="font-semibold text-gray-900 mb-4">
                  {screens[currentScreenIndex]?.title} - Fields
                </h3>
                
                {screens[currentScreenIndex]?.layout.children.length === 0 ? (
                  <div className="text-center text-gray-500 py-12">
                    <FileText className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                    <p>No fields added yet. Click a field type above to add.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {screens[currentScreenIndex]?.layout.children.map((field: any, index: number) => (
                      <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 grid grid-cols-2 gap-3">
                            <input
                              type="text"
                              value={field.label}
                              onChange={(e) => updateField(index, 'label', e.target.value)}
                              placeholder="Field Label"
                              className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                            <input
                              type="text"
                              value={field.name}
                              onChange={(e) => updateField(index, 'name', e.target.value)}
                              placeholder="field_name"
                              className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeField(index)}
                            className="text-red-600 ml-2"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={field.required}
                              onChange={(e) => updateField(index, 'required', e.target.checked)}
                              className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                            />
                            <span className="text-gray-700">Required</span>
                          </label>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {field.type}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={() => {
                    setShowCreateModal(false)
                    resetForm()
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateFlow}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Create Flow
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Info Card */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>About WhatsApp Flows</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm text-gray-600">
            <p>
              <strong>WhatsApp Flows</strong> allow you to create rich, interactive forms directly in WhatsApp. 
              Collect information, bookings, feedback, and more without leaving the chat.
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">📝 Form Fields</h4>
                <p>Text inputs, dropdowns, date pickers, checkboxes, and more.</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">📱 Multi-Screen</h4>
                <p>Create multi-step forms with navigation between screens.</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">✅ Validation</h4>
                <p>Required fields, format validation, and error messages.</p>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-blue-800">
                <strong>Note:</strong> Flows must be published and approved by WhatsApp before use. 
                Review typically takes 24-48 hours.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}