'use client'

import { useEffect, useState } from 'react'

// Required for static export
export async function generateStaticParams() {
  return []
}
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  ArrowLeft, 
  Save, 
  Play, 
  Plus,
  Trash2,
  Settings,
  GitBranch,
  History
} from 'lucide-react'
import Link from 'next/link'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import NODE_CONFIGS, { updateNodeParam, ConfigInput } from '@/components/node-configs'

// Complete Node Library - n8n style
const NODE_TYPES = [
  // TRIGGERS
  { id: 'webhook', name: 'Webhook', icon: '🔗', category: 'triggers', desc: 'Trigger on HTTP request' },
  { id: 'schedule', name: 'Schedule', icon: '⏰', category: 'triggers', desc: 'Trigger on time/cron' },
  { id: 'manual', name: 'Manual Trigger', icon: '▶️', category: 'triggers', desc: 'Start manually' },
  { id: 'email_trigger', name: 'Email Trigger', icon: '📬', category: 'triggers', desc: 'On new email' },
  
  // COMMUNICATION
  { id: 'send_email', name: 'Send Email', icon: '📧', category: 'communication', desc: 'Send email via SMTP' },
  { id: 'send_whatsapp', name: 'WhatsApp', icon: '💬', category: 'communication', desc: 'Send WhatsApp message' },
  { id: 'send_sms', name: 'Send SMS', icon: '📱', category: 'communication', desc: 'Send SMS via Twilio' },
  { id: 'slack', name: 'Slack', icon: '💼', category: 'communication', desc: 'Send Slack message' },
  { id: 'telegram', name: 'Telegram', icon: '✈️', category: 'communication', desc: 'Send Telegram message' },
  { id: 'discord', name: 'Discord', icon: '🎮', category: 'communication', desc: 'Send Discord message' },
  
  // HTTP & APIs
  { id: 'http_request', name: 'HTTP Request', icon: '🌐', category: 'http', desc: 'Make HTTP API call' },
  { id: 'graphql', name: 'GraphQL', icon: '◆', category: 'http', desc: 'GraphQL query' },
  { id: 'soap', name: 'SOAP', icon: '🧼', category: 'http', desc: 'SOAP API call' },
  { id: 'webhook_response', name: 'Respond to Webhook', icon: '↩️', category: 'http', desc: 'Send response' },
  
  // DATABASE
  { id: 'database_query', name: 'Database Query', icon: '🗄️', category: 'database', desc: 'SQL query' },
  { id: 'postgres', name: 'PostgreSQL', icon: '🐘', category: 'database', desc: 'PostgreSQL operations' },
  { id: 'mysql', name: 'MySQL', icon: '🐬', category: 'database', desc: 'MySQL operations' },
  { id: 'mongodb', name: 'MongoDB', icon: '🍃', category: 'database', desc: 'MongoDB operations' },
  { id: 'redis', name: 'Redis', icon: '🔴', category: 'database', desc: 'Redis cache operations' },
  { id: 'supabase', name: 'Supabase', icon: '⚡', category: 'database', desc: 'Supabase operations' },
  
  // LOGIC & FLOW
  { id: 'condition', name: 'IF Condition', icon: '🔀', category: 'logic', desc: 'Branch based on condition' },
  { id: 'switch', name: 'Switch', icon: '🎛️', category: 'logic', desc: 'Multiple conditions' },
  { id: 'loop', name: 'Loop', icon: '🔄', category: 'logic', desc: 'Iterate over items' },
  { id: 'delay', name: 'Delay', icon: '⏱️', category: 'logic', desc: 'Wait before next step' },
  { id: 'stop', name: 'Stop & Error', icon: '🛑', category: 'logic', desc: 'Stop workflow' },
  { id: 'merge', name: 'Merge', icon: '🔗', category: 'logic', desc: 'Merge multiple branches' },
  
  // DATA TRANSFORMATION
  { id: 'transform', name: 'Transform Data', icon: '⚙️', category: 'data', desc: 'Modify data structure' },
  { id: 'filter', name: 'Filter', icon: '🔍', category: 'data', desc: 'Filter items' },
  { id: 'sort', name: 'Sort', icon: '🔢', category: 'data', desc: 'Sort items' },
  { id: 'aggregate', name: 'Aggregate', icon: '📊', category: 'data', desc: 'Sum, count, average' },
  { id: 'split', name: 'Split', icon: '✂️', category: 'data', desc: 'Split data into parts' },
  { id: 'set', name: 'Set Variable', icon: '📝', category: 'data', desc: 'Set workflow variable' },
  { id: 'code', name: 'Code', icon: '💻', category: 'data', desc: 'Run JavaScript code' },
  
  // FILE OPERATIONS
  { id: 'read_file', name: 'Read File', icon: '📄', category: 'files', desc: 'Read file content' },
  { id: 'write_file', name: 'Write File', icon: '💾', category: 'files', desc: 'Write to file' },
  { id: 'google_drive', name: 'Google Drive', icon: '📁', category: 'files', desc: 'Google Drive operations' },
  { id: 'dropbox', name: 'Dropbox', icon: '📦', category: 'files', desc: 'Dropbox operations' },
  { id: 'aws_s3', name: 'AWS S3', icon: '☁️', category: 'files', desc: 'S3 storage operations' },
  
  // CRM & SALES
  { id: 'hubspot', name: 'HubSpot', icon: '🎯', category: 'crm', desc: 'HubSpot CRM' },
  { id: 'salesforce', name: 'Salesforce', icon: '☁️', category: 'crm', desc: 'Salesforce CRM' },
  { id: 'pipedrive', name: 'Pipedrive', icon: '📊', category: 'crm', desc: 'Pipedrive CRM' },
  { id: 'zoho_crm', name: 'Zoho CRM', icon: '🦁', category: 'crm', desc: 'Zoho CRM' },
  
  // PAYMENT
  { id: 'stripe', name: 'Stripe', icon: '💳', category: 'payment', desc: 'Stripe payments' },
  { id: 'paypal', name: 'PayPal', icon: '💰', category: 'payment', desc: 'PayPal operations' },
  { id: 'razorpay', name: 'Razorpay', icon: '💵', category: 'payment', desc: 'Razorpay payments' },
  
  // PRODUCTIVITY
  { id: 'google_sheets', name: 'Google Sheets', icon: '📊', category: 'productivity', desc: 'Google Sheets operations' },
  { id: 'excel', name: 'Excel', icon: '📈', category: 'productivity', desc: 'Excel operations' },
  { id: 'google_calendar', name: 'Google Calendar', icon: '📅', category: 'productivity', desc: 'Calendar operations' },
  { id: 'notion', name: 'Notion', icon: '📓', category: 'productivity', desc: 'Notion operations' },
  { id: 'airtable', name: 'Airtable', icon: '🗂️', category: 'productivity', desc: 'Airtable operations' },
  
  // AI & ML
  { id: 'openai', name: 'OpenAI', icon: '🤖', category: 'ai', desc: 'ChatGPT, GPT-4' },
  { id: 'anthropic', name: 'Claude AI', icon: '🧠', category: 'ai', desc: 'Anthropic Claude' },
  { id: 'gemini', name: 'Google Gemini', icon: '✨', category: 'ai', desc: 'Google Gemini AI' },
  { id: 'ai_process', name: 'AI Processing', icon: '🔮', category: 'ai', desc: 'Custom AI processing' },
  
  // SOCIAL MEDIA
  { id: 'twitter', name: 'Twitter/X', icon: '🐦', category: 'social', desc: 'Twitter operations' },
  { id: 'facebook', name: 'Facebook', icon: '👥', category: 'social', desc: 'Facebook operations' },
  { id: 'instagram', name: 'Instagram', icon: '📷', category: 'social', desc: 'Instagram operations' },
  { id: 'linkedin', name: 'LinkedIn', icon: '💼', category: 'social', desc: 'LinkedIn operations' },
]

export default function WorkflowEditorPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClientComponentClient()
  const workflowId = params.id as string

  const [workflow, setWorkflow] = useState<any>(null)
  const [nodes, setNodes] = useState<any[]>([])
  const [selectedNode, setSelectedNode] = useState<any>(null)
  const [showNodeMenu, setShowNodeMenu] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testOutput, setTestOutput] = useState<any>(null)
  const [executions, setExecutions] = useState<any[]>([])
  const webhookBase = process.env.NEXT_PUBLIC_N8N_WEBHOOK_BASE || ''
  const [presets, setPresets] = useState<any[]>([])
  const [showPresetForm, setShowPresetForm] = useState(false)
  const [newPreset, setNewPreset] = useState({ name: '', headers: [{ key: '', value: '' }] })
  const [running, setRunning] = useState(false)
  const [draggedNode, setDraggedNode] = useState<any>(null)
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 })
  const [canvasZoom, setCanvasZoom] = useState(1)
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [connections, setConnections] = useState<any[]>([])
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadWorkflow()
    loadExecutions()
    loadPresets()
  }, [workflowId])

  const loadWorkflow = async () => {
    try {
      const { data, error } = await supabase
        .from('automation_workflows')
        .select('*, automation_workflow_nodes(*)')
        .eq('id', workflowId)
        .single()

      if (error) throw error

      setWorkflow(data)
      setNodes(data.automation_workflow_nodes || [])
    } catch (error) {
      console.error('Error loading workflow:', error)
      alert('Failed to load workflow')
    } finally {
      setLoading(false)
    }
  }

  const addNode = (nodeType: typeof NODE_TYPES[0]) => {
    const newNode = {
      id: `node_${Date.now()}`,
      workflow_id: workflowId,
      node_id: `node_${Date.now()}`,
      node_type: nodeType.id,
      node_name: nodeType.name,
      parameters: nodeType.id === 'http_request' ? { method: 'GET', url: '', headers: [], body: '' }
        : nodeType.id === 'webhook' ? { method: 'POST', path: `/hook-${Date.now()}` }
        : nodeType.id === 'schedule' ? { cron: '* * * * *' }
        : {},
      position_x: 300 + nodes.length * 50,
      position_y: 200 + nodes.length * 50,
    }

    setNodes([...nodes, newNode])
    setShowNodeMenu(false)
  }

  const deleteNode = (nodeId: string) => {
    setNodes(nodes.filter(n => n.node_id !== nodeId))
    if (selectedNode?.node_id === nodeId) {
      setSelectedNode(null)
    }
  }

  const saveWorkflow = async () => {
    setSaving(true)
    try {
      // Persist to DB for our records
      const { error: dbError } = await supabase
        .from('automation_workflows')
        .update({
          workflow_data: { nodes, connections: [] },
          updated_at: new Date().toISOString()
        })
        .eq('id', workflowId)
      if (dbError) throw dbError

      // Also sync to n8n via our API (so users can manage entirely in CRM)
      let apiRes = await fetch('/api/automation/workflows', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: workflowId,
          name: workflow?.workflow_name || 'Workflow',
          description: workflow?.description || '',
          editorNodes: nodes,
        })
      })
      // If route not found (dev routing glitch) or first-time create fallback
      if (apiRes.status === 404) {
        apiRes = await fetch('/api/automation/workflows', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: workflowId,
            name: workflow?.workflow_name || 'Workflow',
            description: workflow?.description || '',
            editorNodes: nodes,
          }),
        })
      }
      if (!apiRes.ok) {
        let msg = 'n8n sync failed'
        try {
          const data = await apiRes.clone().json()
          msg = data?.error || msg
        } catch {
          const text = await apiRes.text()
          msg = text?.slice(0, 300) || msg
        }
        throw new Error(msg)
      }

      alert('Workflow saved successfully!')
    } catch (error: any) {
      console.error('Error saving:', error)
      alert('Failed to save: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const testWorkflow = async () => {
    try {
      setRunning(true)
      const response = await fetch(`/api/automation/webhook?workflowId=${workflowId}`)
      if (!response.ok) {
        throw new Error('Failed to execute workflow')
      }
      const result = await response.json()
      setTestOutput(result)
      alert('Workflow executed!')
    } catch (error: any) {
      alert('Error: ' + error.message)
    } finally {
      setRunning(false)
    }
  }

  const loadExecutions = async () => {
    try {
      const res = await fetch(`/api/automation/workflows?type=executions&workflowId=${workflowId}`, { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      setExecutions(Array.isArray(data?.data) ? data.data : (Array.isArray(data?.executions) ? data.executions : []))
    } catch {
      // ignore
    }
  }

  const loadPresets = async () => {
    try {
      const res = await fetch('/api/automation/workflows/credentials')
      if (!res.ok) return
      const data = await res.json()
      setPresets(data?.items || [])
    } catch {}
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/automation">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">{workflow?.workflow_name}</h1>
              <p className="text-sm text-gray-600">Visual Workflow Editor</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
              {/* Activate/Deactivate */}
              <Button
                size="sm"
                variant={workflow?.is_active ? 'outline' : 'default'}
                onClick={async () => {
                  try {
                    await fetch('/api/automation/workflows', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ id: workflowId, editorNodes: nodes, activate: !workflow?.is_active })
                    })
                    await loadWorkflow()
                  } catch {}
                }}
              >
                {workflow?.is_active ? 'Deactivate' : 'Activate'}
              </Button>
            <Button variant="outline" size="sm">
              <History className="h-4 w-4 mr-2" />
              Versions
            </Button>
            <Button variant="outline" size="sm" onClick={testWorkflow} disabled={running}>
              <Play className="h-4 w-4 mr-2" />
              {running ? 'Running...' : 'Test'}
            </Button>
            <Button 
              size="sm" 
              onClick={saveWorkflow}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Left Sidebar - Node Palette */}
        <div className="w-72 bg-white border-r p-4 overflow-y-auto">
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Add Nodes</h3>
            <input
              type="text"
              placeholder="🔍 Search nodes..."
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {['triggers', 'communication', 'http', 'database', 'logic', 'data', 'files', 'crm', 'payment', 'productivity', 'ai', 'social'].map(category => {
            const categoryNodes = NODE_TYPES.filter(n => {
              if (n.category !== category) return false
              if (!searchQuery) return true
              const search = searchQuery.toLowerCase()
              return n.name.toLowerCase().includes(search) || 
                     n.desc.toLowerCase().includes(search) ||
                     n.id.toLowerCase().includes(search)
            })
            if (categoryNodes.length === 0) return null
            
            return (
              <div key={category} className="mb-4">
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-2">
                  {category}
                  <span className="text-xs bg-gray-200 px-1.5 py-0.5 rounded">{categoryNodes.length}</span>
                </h4>
                <div className="space-y-1">
                  {categoryNodes.map(nodeType => (
                    <button
                      key={nodeType.id}
                      onClick={() => addNode(nodeType)}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('nodeType', JSON.stringify(nodeType))
                        e.dataTransfer.effectAllowed = 'copy'
                      }}
                      className="w-full text-left px-2 py-2 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-all border border-transparent group cursor-grab active:cursor-grabbing"
                      title={nodeType.desc}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{nodeType.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate group-hover:text-blue-700">{nodeType.name}</div>
                          <div className="text-xs text-gray-500 truncate">{nodeType.desc}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Center - Visual Canvas */}
        <div className="flex-1 relative overflow-hidden bg-gray-100">
          {/* Canvas Controls */}
          <div className="absolute top-4 left-4 z-10 flex gap-2">
            <div className="bg-white rounded-lg shadow-lg p-2 flex gap-1">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setCanvasZoom(Math.min(2, canvasZoom + 0.1))}
                title="Zoom In"
              >
                +
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setCanvasZoom(Math.max(0.5, canvasZoom - 0.1))}
                title="Zoom Out"
              >
                -
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => {
                  setCanvasZoom(1)
                  setCanvasOffset({ x: 0, y: 0 })
                }}
                title="Reset View"
              >
                ↺
              </Button>
              <span className="px-2 py-1 text-sm">{Math.round(canvasZoom * 100)}%</span>
            </div>
          </div>

          {/* SVG for Connection Lines */}
          <svg 
            className="absolute inset-0 pointer-events-none"
            style={{
              width: '100%',
              height: '100%',
              zIndex: 1,
            }}
          >
            <g transform={`translate(${canvasOffset.x}, ${canvasOffset.y}) scale(${canvasZoom})`}>
              {nodes.map((node, index) => {
                if (index === nodes.length - 1) return null
                const nextNode = nodes[index + 1]
                
                // Calculate positions (center bottom of current node to center top of next node)
                const x1 = (node.position_x || 300) + 100 // center of node (200px width / 2)
                const y1 = (node.position_y || 200 + index * 150) + 100 // bottom of node
                const x2 = (nextNode.position_x || 300) + 100 // center of next node
                const y2 = (nextNode.position_y || 200 + (index + 1) * 150) // top of next node
                
                // Calculate distance and adjust curve
                const dx = Math.abs(x2 - x1)
                const dy = y2 - y1
                
                // Smart curve control points with smooth bezier
                let path = ''
                if (dy > 80) {
                  // Normal vertical flow - elegant S-curve
                  const controlOffset = Math.min(dy * 0.4, 80)
                  path = `M ${x1} ${y1} C ${x1} ${y1 + controlOffset}, ${x2} ${y2 - controlOffset}, ${x2} ${y2}`
                } else if (dy > 0 && dy <= 80 && dx < 100) {
                  // Close nodes - tight smooth curve
                  const controlOffset = dy * 0.3
                  path = `M ${x1} ${y1} C ${x1} ${y1 + controlOffset}, ${x2} ${y2 - controlOffset}, ${x2} ${y2}`
                } else if (dy <= 0) {
                  // Upward or same level - rounded side routing
                  const offset = Math.max(dx * 0.3, 50)
                  const verticalOffset = Math.abs(dy) + 60
                  const sideX1 = x1 + (x2 > x1 ? offset : -offset)
                  const sideX2 = x2 - (x2 > x1 ? offset : -offset)
                  path = `M ${x1} ${y1} 
                          C ${x1} ${y1 + 30}, ${x1} ${y1 + 40}, ${x1 + (x2 > x1 ? 20 : -20)} ${y1 + 40}
                          L ${sideX1} ${y1 + 40}
                          C ${sideX1 + (x2 > x1 ? 20 : -20)} ${y1 + 40}, ${sideX1 + (x2 > x1 ? 20 : -20)} ${y1 + 50}, ${sideX1 + (x2 > x1 ? 20 : -20)} ${y1 + verticalOffset}
                          L ${sideX2 - (x2 > x1 ? 20 : -20)} ${y2 - 40}
                          C ${sideX2 - (x2 > x1 ? 20 : -20)} ${y2 - 30}, ${x2 - (x2 > x1 ? 20 : -20)} ${y2 - 30}, ${x2} ${y2 - 20}
                          L ${x2} ${y2}`
                } else {
                  // Side-by-side - smooth horizontal curve
                  const controlOffset = Math.max(dy * 0.4, 40)
                  const midX = x1 + (x2 - x1) / 2
                  path = `M ${x1} ${y1} C ${x1} ${y1 + controlOffset}, ${midX} ${y1 + controlOffset}, ${midX} ${y1 + dy / 2} C ${midX} ${y2 - controlOffset}, ${x2} ${y2 - controlOffset}, ${x2} ${y2}`
                }
                
                return (
                  <g key={`conn-${node.node_id}-${nextNode.node_id}`}>
                    {/* Outer glow - widest */}
                    <path
                      d={path}
                      stroke="#3b82f6"
                      strokeWidth="12"
                      fill="none"
                      opacity="0.08"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {/* Middle glow */}
                    <path
                      d={path}
                      stroke="#3b82f6"
                      strokeWidth="8"
                      fill="none"
                      opacity="0.15"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {/* Depth layer */}
                    <path
                      d={path}
                      stroke="#2563eb"
                      strokeWidth="5"
                      fill="none"
                      opacity="0.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {/* Main line with gradient */}
                    <path
                      d={path}
                      stroke="url(#lineGradient)"
                      strokeWidth="3.5"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ 
                        filter: 'drop-shadow(0 2px 6px rgba(59, 130, 246, 0.4))',
                      }}
                    />
                    {/* Animated flow dots */}
                    <circle r="4" fill="#60a5fa" opacity="0.8">
                      <animateMotion
                        dur="3s"
                        repeatCount="indefinite"
                        path={path}
                      />
                    </circle>
                    <circle r="4" fill="#60a5fa" opacity="0.8">
                      <animateMotion
                        dur="3s"
                        repeatCount="indefinite"
                        path={path}
                        begin="1s"
                      />
                    </circle>
                    <circle r="4" fill="#60a5fa" opacity="0.8">
                      <animateMotion
                        dur="3s"
                        repeatCount="indefinite"
                        path={path}
                        begin="2s"
                      />
                    </circle>
                    
                    {/* Connection dots - Start point */}
                    <g>
                      <circle cx={x1} cy={y1} r="10" fill="#3b82f6" opacity="0.15">
                        <animate attributeName="r" values="10;12;10" dur="2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.15;0.25;0.15" dur="2s" repeatCount="indefinite" />
                      </circle>
                      <circle cx={x1} cy={y1} r="7" fill="#3b82f6" stroke="white" strokeWidth="2.5" />
                      <circle cx={x1} cy={y1} r="3.5" fill="white" opacity="0.9" />
                      <circle cx={x1} cy={y1} r="1.5" fill="#3b82f6" />
                    </g>
                    
                    {/* Connection dots - End point */}
                    <g>
                      <circle cx={x2} cy={y2} r="10" fill="#3b82f6" opacity="0.15">
                        <animate attributeName="r" values="10;12;10" dur="2s" repeatCount="indefinite" begin="0.5s" />
                        <animate attributeName="opacity" values="0.15;0.25;0.15" dur="2s" repeatCount="indefinite" begin="0.5s" />
                      </circle>
                      <circle cx={x2} cy={y2} r="7" fill="#3b82f6" stroke="white" strokeWidth="2.5" />
                      <circle cx={x2} cy={y2} r="3.5" fill="white" opacity="0.9" />
                      <circle cx={x2} cy={y2} r="1.5" fill="#3b82f6" />
                    </g>
                  </g>
                )
              })}
            </g>
            <defs>
              {/* Enhanced gradient for lines */}
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#60a5fa', stopOpacity: 1 }} />
                <stop offset="50%" style={{ stopColor: '#3b82f6', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#2563eb', stopOpacity: 1 }} />
              </linearGradient>
              
              {/* Radial gradient for dots */}
              <radialGradient id="dotGradient">
                <stop offset="0%" style={{ stopColor: '#60a5fa', stopOpacity: 1 }} />
                <stop offset="70%" style={{ stopColor: '#3b82f6', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#2563eb', stopOpacity: 0.8 }} />
              </radialGradient>
              
              {/* Glow filter for premium effect */}
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              
              {/* Soft glow filter */}
              <filter id="softGlow">
                <feGaussianBlur stdDeviation="2" result="blur"/>
                <feFlood floodColor="#3b82f6" floodOpacity="0.5"/>
                <feComposite in2="blur" operator="in" result="softGlow"/>
                <feMerge>
                  <feMergeNode in="softGlow"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
          </svg>

          {/* Canvas Area */}
          <div
            className="w-full h-full overflow-auto"
            style={{
              cursor: isPanning ? 'grabbing' : 'grab',
              backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)',
              backgroundSize: `${20 * canvasZoom}px ${20 * canvasZoom}px`,
            }}
            onMouseDown={(e) => {
              if (e.target === e.currentTarget || e.target === e.currentTarget.firstChild) {
                setIsPanning(true)
                setPanStart({ x: e.clientX - canvasOffset.x, y: e.clientY - canvasOffset.y })
              }
            }}
            onMouseMove={(e) => {
              if (isPanning) {
                setCanvasOffset({
                  x: e.clientX - panStart.x,
                  y: e.clientY - panStart.y,
                })
              }
            }}
            onMouseUp={() => setIsPanning(false)}
            onMouseLeave={() => setIsPanning(false)}
            onDragOver={(e) => {
              e.preventDefault()
              e.dataTransfer.dropEffect = 'copy'
            }}
            onDrop={(e) => {
              e.preventDefault()
              const nodeTypeData = e.dataTransfer.getData('nodeType')
              if (nodeTypeData) {
                try {
                  const nodeType = JSON.parse(nodeTypeData)
                  const rect = e.currentTarget.getBoundingClientRect()
                  const x = (e.clientX - rect.left - canvasOffset.x) / canvasZoom
                  const y = (e.clientY - rect.top - canvasOffset.y) / canvasZoom
                  
                  const newNode = {
                    id: `node_${Date.now()}`,
                    workflow_id: workflowId,
                    node_id: `node_${Date.now()}`,
                    node_type: nodeType.id,
                    node_name: nodeType.name,
                    parameters: nodeType.id === 'http_request' ? { method: 'GET', url: '', headers: [], body: '' }
                      : nodeType.id === 'webhook' ? { method: 'POST', path: `/hook-${Date.now()}` }
                      : nodeType.id === 'schedule' ? { cron: '* * * * *' }
                      : {},
                    position_x: Math.max(0, x - 100),
                    position_y: Math.max(0, y - 40),
                  }
                  setNodes([...nodes, newNode])
                } catch (error) {
                  console.error('Failed to parse dropped node:', error)
                }
              }
            }}
          >
            <div
              className="relative"
              style={{
                transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${canvasZoom})`,
                transformOrigin: '0 0',
                minWidth: '2000px',
                minHeight: '2000px',
              }}
            >
              {nodes.length === 0 ? (
                <div 
                  className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"
                  style={{
                    transform: `translate(-50%, -50%) scale(${1 / canvasZoom})`,
                  }}
                >
                  <div className="flex flex-col items-center justify-center text-center bg-white rounded-lg shadow-lg p-8 border-2 border-dashed">
                    <div className="text-6xl mb-4">⚡</div>
                    <h3 className="text-xl font-semibold mb-2">Start Building</h3>
                    <p className="text-gray-600 mb-4">
                      Drag nodes from the left sidebar onto the canvas
                    </p>
                  </div>
                </div>
              ) : (
                nodes.map((node, index) => (
                  <div
                    key={node.node_id}
                    className={`absolute bg-white rounded-lg shadow-lg border-2 transition-all cursor-move ${
                      selectedNode?.node_id === node.node_id 
                        ? 'border-blue-500 shadow-xl' 
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                    style={{
                      left: `${node.position_x || 300}px`,
                      top: `${node.position_y || 200 + index * 150}px`,
                      width: '200px',
                    }}
                    draggable
                    onDragStart={(e) => {
                      setDraggedNode(node)
                      e.dataTransfer.effectAllowed = 'move'
                    }}
                    onDragEnd={(e) => {
                      if (draggedNode) {
                        const rect = e.currentTarget.parentElement?.getBoundingClientRect()
                        if (rect) {
                          const x = (e.clientX - rect.left - canvasOffset.x) / canvasZoom
                          const y = (e.clientY - rect.top - canvasOffset.y) / canvasZoom
                          
                          const updated = nodes.map(n =>
                            n.node_id === draggedNode.node_id
                              ? { ...n, position_x: Math.max(0, x - 100), position_y: Math.max(0, y - 40) }
                              : n
                          )
                          setNodes(updated)
                          if (selectedNode?.node_id === draggedNode.node_id) {
                            setSelectedNode({ ...draggedNode, position_x: Math.max(0, x - 100), position_y: Math.max(0, y - 40) })
                          }
                        }
                        setDraggedNode(null)
                      }
                    }}
                    onClick={() => setSelectedNode(node)}
                  >
                    {/* Connection Points */}
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-blue-500 rounded-full border-2 border-white cursor-pointer hover:bg-blue-600 z-10"></div>
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-blue-500 rounded-full border-2 border-white cursor-pointer hover:bg-blue-600 z-10"></div>
                    
                    {/* Node Header */}
                    <div className="p-3 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{NODE_TYPES.find(t => t.id === node.node_type)?.icon}</span>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm truncate">{node.node_name}</h4>
                          <p className="text-xs text-gray-600 truncate capitalize">{node.node_type}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Node Actions */}
                    <div className="p-2 flex gap-1 bg-gray-50">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedNode(node)
                        }}
                        className="flex-1 text-xs"
                      >
                        <Settings className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteNode(node.node_id)
                        }}
                        className="text-red-600 text-xs"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar - Node Properties */}
        {selectedNode && (
          <div className="w-80 bg-white border-l p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Node Settings</h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSelectedNode(null)}
              >
                ✕
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Node Name</label>
                <input
                  type="text"
                  value={selectedNode.node_name}
                  onChange={(e) => {
                    const updated = nodes.map(n => 
                      n.node_id === selectedNode.node_id 
                        ? { ...n, node_name: e.target.value }
                        : n
                    )
                    setNodes(updated)
                    setSelectedNode({ ...selectedNode, node_name: e.target.value })
                  }}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Node Type</label>
                <input
                  type="text"
                  value={selectedNode.node_type}
                  disabled
                  className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                />
              </div>

              {selectedNode.node_type === 'http_request' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Method</label>
                    <select
                      value={selectedNode.parameters?.method || 'GET'}
                      onChange={(e) => {
                        const updated = nodes.map(n => 
                          n.node_id === selectedNode.node_id 
                            ? { ...n, parameters: { ...n.parameters, method: e.target.value } }
                            : n
                        )
                        setNodes(updated)
                        setSelectedNode({ ...selectedNode, parameters: { ...selectedNode.parameters, method: e.target.value } })
                      }}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      {['GET','POST','PUT','PATCH','DELETE'].map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">URL</label>
                    <input
                      type="text"
                      placeholder="https://api.example.com/resource"
                      value={selectedNode.parameters?.url || ''}
                      onChange={(e) => {
                        const updated = nodes.map(n => 
                          n.node_id === selectedNode.node_id 
                            ? { ...n, parameters: { ...n.parameters, url: e.target.value } }
                            : n
                        )
                        setNodes(updated)
                        setSelectedNode({ ...selectedNode, parameters: { ...selectedNode.parameters, url: e.target.value } })
                      }}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div className="text-xs text-gray-500">Headers/Body support aage add kar denge.</div>
                </div>
              )}

              {selectedNode.node_type === 'webhook' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Method</label>
                    <select
                      value={selectedNode.parameters?.method || 'POST'}
                      onChange={(e) => {
                        const updated = nodes.map(n => n.node_id === selectedNode.node_id ? { ...n, parameters: { ...n.parameters, method: e.target.value } } : n)
                        setNodes(updated)
                        setSelectedNode({ ...selectedNode, parameters: { ...selectedNode.parameters, method: e.target.value } })
                      }}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      {['POST','GET'].map(m => (<option key={m} value={m}>{m}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Path</label>
                    <input
                      type="text"
                      value={selectedNode.parameters?.path || ''}
                      onChange={(e) => {
                        const updated = nodes.map(n => n.node_id === selectedNode.node_id ? { ...n, parameters: { ...n.parameters, path: e.target.value } } : n)
                        setNodes(updated)
                        setSelectedNode({ ...selectedNode, parameters: { ...selectedNode.parameters, path: e.target.value } })
                      }}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                    <div className="text-xs text-gray-500">Final URL will be based on your deployment’s webhook base.</div>
                  </div>
                </div>
              )}

              {selectedNode.node_type === 'schedule' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Cron Expression</label>
                    <input
                      type="text"
                      value={selectedNode.parameters?.cron || '* * * * *'}
                      onChange={(e) => {
                        const updated = nodes.map(n => n.node_id === selectedNode.node_id ? { ...n, parameters: { ...n.parameters, cron: e.target.value } } : n)
                        setNodes(updated)
                        setSelectedNode({ ...selectedNode, parameters: { ...selectedNode.parameters, cron: e.target.value } })
                      }}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                    <div className="text-xs text-gray-500">Example: 0 9 * * * (every day at 9 AM)</div>
                  </div>
                </div>
              )}

              {selectedNode.node_type === 'send_email' && (
                <div className="space-y-3">
                  <div className="text-sm font-medium mb-2">SMTP Settings</div>
                  <input
                    type="text"
                    placeholder="SMTP Host (e.g. smtp.gmail.com)"
                    value={selectedNode.parameters?.smtp?.host || ''}
                    onChange={(e) => {
                      const updated = nodes.map(n => n.node_id === selectedNode.node_id ? { ...n, parameters: { ...n.parameters, smtp: { ...n.parameters?.smtp, host: e.target.value } } } : n)
                      setNodes(updated)
                      setSelectedNode({ ...selectedNode, parameters: { ...selectedNode.parameters, smtp: { ...selectedNode.parameters?.smtp, host: e.target.value } } })
                    }}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <input
                    type="number"
                    placeholder="Port (587 for TLS)"
                    value={selectedNode.parameters?.smtp?.port || 587}
                    onChange={(e) => {
                      const updated = nodes.map(n => n.node_id === selectedNode.node_id ? { ...n, parameters: { ...n.parameters, smtp: { ...n.parameters?.smtp, port: parseInt(e.target.value) } } } : n)
                      setNodes(updated)
                      setSelectedNode({ ...selectedNode, parameters: { ...selectedNode.parameters, smtp: { ...selectedNode.parameters?.smtp, port: parseInt(e.target.value) } } })
                    }}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <input
                    type="email"
                    placeholder="Your Email"
                    value={selectedNode.parameters?.smtp?.user || ''}
                    onChange={(e) => {
                      const updated = nodes.map(n => n.node_id === selectedNode.node_id ? { ...n, parameters: { ...n.parameters, smtp: { ...n.parameters?.smtp, user: e.target.value } } } : n)
                      setNodes(updated)
                      setSelectedNode({ ...selectedNode, parameters: { ...selectedNode.parameters, smtp: { ...selectedNode.parameters?.smtp, user: e.target.value } } })
                    }}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <input
                    type="password"
                    placeholder="Password / App Password"
                    value={selectedNode.parameters?.smtp?.password || ''}
                    onChange={(e) => {
                      const updated = nodes.map(n => n.node_id === selectedNode.node_id ? { ...n, parameters: { ...n.parameters, smtp: { ...n.parameters?.smtp, password: e.target.value } } } : n)
                      setNodes(updated)
                      setSelectedNode({ ...selectedNode, parameters: { ...selectedNode.parameters, smtp: { ...selectedNode.parameters?.smtp, password: e.target.value } } })
                    }}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  
                  <div className="text-sm font-medium mb-2 mt-4">Email Details</div>
                  <input
                    type="email"
                    placeholder="To Email"
                    value={selectedNode.parameters?.to || ''}
                    onChange={(e) => {
                      const updated = nodes.map(n => n.node_id === selectedNode.node_id ? { ...n, parameters: { ...n.parameters, to: e.target.value } } : n)
                      setNodes(updated)
                      setSelectedNode({ ...selectedNode, parameters: { ...selectedNode.parameters, to: e.target.value } })
                    }}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Subject"
                    value={selectedNode.parameters?.subject || ''}
                    onChange={(e) => {
                      const updated = nodes.map(n => n.node_id === selectedNode.node_id ? { ...n, parameters: { ...n.parameters, subject: e.target.value } } : n)
                      setNodes(updated)
                      setSelectedNode({ ...selectedNode, parameters: { ...selectedNode.parameters, subject: e.target.value } })
                    }}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <textarea
                    placeholder="Email Body"
                    rows={4}
                    value={selectedNode.parameters?.body || ''}
                    onChange={(e) => {
                      const updated = nodes.map(n => n.node_id === selectedNode.node_id ? { ...n, parameters: { ...n.parameters, body: e.target.value } } : n)
                      setNodes(updated)
                      setSelectedNode({ ...selectedNode, parameters: { ...selectedNode.parameters, body: e.target.value } })
                    }}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              )}

              {selectedNode.node_type === 'send_whatsapp' && (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="WhatsApp API Key"
                    value={selectedNode.parameters?.api_key || ''}
                    onChange={(e) => {
                      const updated = nodes.map(n => n.node_id === selectedNode.node_id ? { ...n, parameters: { ...n.parameters, api_key: e.target.value } } : n)
                      setNodes(updated)
                      setSelectedNode({ ...selectedNode, parameters: { ...selectedNode.parameters, api_key: e.target.value } })
                    }}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="To Number (e.g. 91XXXXXXXXXX)"
                    value={selectedNode.parameters?.to || ''}
                    onChange={(e) => {
                      const updated = nodes.map(n => n.node_id === selectedNode.node_id ? { ...n, parameters: { ...n.parameters, to: e.target.value } } : n)
                      setNodes(updated)
                      setSelectedNode({ ...selectedNode, parameters: { ...selectedNode.parameters, to: e.target.value } })
                    }}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <textarea
                    placeholder="Message"
                    rows={4}
                    value={selectedNode.parameters?.message || ''}
                    onChange={(e) => {
                      const updated = nodes.map(n => n.node_id === selectedNode.node_id ? { ...n, parameters: { ...n.parameters, message: e.target.value } } : n)
                      setNodes(updated)
                      setSelectedNode({ ...selectedNode, parameters: { ...selectedNode.parameters, message: e.target.value } })
                    }}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <div className="text-xs text-gray-500">Make sure you have WhatsApp Business API access</div>
                </div>
              )}

              {selectedNode.node_type === 'condition' && (
                <div className="space-y-3">
                  <div className="text-sm text-gray-600 mb-2">IF Condition: Check if...</div>
                  <input
                    type="text"
                    placeholder="Left value (e.g. {{status}})"
                    value={selectedNode.parameters?.left || ''}
                    onChange={(e) => {
                      const updated = nodes.map(n => n.node_id === selectedNode.node_id ? { ...n, parameters: { ...n.parameters, left: e.target.value } } : n)
                      setNodes(updated)
                      setSelectedNode({ ...selectedNode, parameters: { ...selectedNode.parameters, left: e.target.value } })
                    }}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <select
                    value={selectedNode.parameters?.operator || 'equals'}
                    onChange={(e) => {
                      const updated = nodes.map(n => n.node_id === selectedNode.node_id ? { ...n, parameters: { ...n.parameters, operator: e.target.value } } : n)
                      setNodes(updated)
                      setSelectedNode({ ...selectedNode, parameters: { ...selectedNode.parameters, operator: e.target.value } })
                    }}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="equals">Equals (=)</option>
                    <option value="not_equals">Not Equals (!=)</option>
                    <option value="greater">Greater Than (&gt;)</option>
                    <option value="less">Less Than (&lt;)</option>
                    <option value="contains">Contains</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Right value (e.g. approved)"
                    value={selectedNode.parameters?.right || ''}
                    onChange={(e) => {
                      const updated = nodes.map(n => n.node_id === selectedNode.node_id ? { ...n, parameters: { ...n.parameters, right: e.target.value } } : n)
                      setNodes(updated)
                      setSelectedNode({ ...selectedNode, parameters: { ...selectedNode.parameters, right: e.target.value } })
                    }}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              )}

              {selectedNode.node_type === 'loop' && (
                <div className="space-y-3">
                  <div className="text-sm text-gray-600 mb-2">Loop over items in array</div>
                  <input
                    type="text"
                    placeholder="Array variable (e.g. {{customers}})"
                    value={selectedNode.parameters?.array || ''}
                    onChange={(e) => {
                      const updated = nodes.map(n => n.node_id === selectedNode.node_id ? { ...n, parameters: { ...n.parameters, array: e.target.value } } : n)
                      setNodes(updated)
                      setSelectedNode({ ...selectedNode, parameters: { ...selectedNode.parameters, array: e.target.value } })
                    }}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <div className="text-xs text-gray-500">Each item will be available as {'{'}{'{'} item {'}'} {'}'}  in next nodes</div>
                </div>
              )}

              {selectedNode.node_type === 'database_query' && (
                <div className="space-y-3">
                  <div className="text-sm font-medium mb-2">Database Connection</div>
                  <input
                    type="text"
                    placeholder="Host (e.g. localhost)"
                    value={selectedNode.parameters?.db?.host || ''}
                    onChange={(e) => {
                      const updated = nodes.map(n => n.node_id === selectedNode.node_id ? { ...n, parameters: { ...n.parameters, db: { ...n.parameters?.db, host: e.target.value } } } : n)
                      setNodes(updated)
                      setSelectedNode({ ...selectedNode, parameters: { ...selectedNode.parameters, db: { ...selectedNode.parameters?.db, host: e.target.value } } })
                    }}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Database Name"
                    value={selectedNode.parameters?.db?.database || ''}
                    onChange={(e) => {
                      const updated = nodes.map(n => n.node_id === selectedNode.node_id ? { ...n, parameters: { ...n.parameters, db: { ...n.parameters?.db, database: e.target.value } } } : n)
                      setNodes(updated)
                      setSelectedNode({ ...selectedNode, parameters: { ...selectedNode.parameters, db: { ...selectedNode.parameters?.db, database: e.target.value } } })
                    }}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Username"
                    value={selectedNode.parameters?.db?.user || ''}
                    onChange={(e) => {
                      const updated = nodes.map(n => n.node_id === selectedNode.node_id ? { ...n, parameters: { ...n.parameters, db: { ...n.parameters?.db, user: e.target.value } } } : n)
                      setNodes(updated)
                      setSelectedNode({ ...selectedNode, parameters: { ...selectedNode.parameters, db: { ...selectedNode.parameters?.db, user: e.target.value } } })
                    }}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={selectedNode.parameters?.db?.password || ''}
                    onChange={(e) => {
                      const updated = nodes.map(n => n.node_id === selectedNode.node_id ? { ...n, parameters: { ...n.parameters, db: { ...n.parameters?.db, password: e.target.value } } } : n)
                      setNodes(updated)
                      setSelectedNode({ ...selectedNode, parameters: { ...selectedNode.parameters, db: { ...selectedNode.parameters?.db, password: e.target.value } } })
                    }}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  
                  <div className="text-sm font-medium mb-2 mt-4">SQL Query</div>
                  <textarea
                    placeholder="SELECT * FROM table WHERE ..."
                    rows={4}
                    value={selectedNode.parameters?.query || ''}
                    onChange={(e) => {
                      const updated = nodes.map(n => n.node_id === selectedNode.node_id ? { ...n, parameters: { ...n.parameters, query: e.target.value } } : n)
                      setNodes(updated)
                      setSelectedNode({ ...selectedNode, parameters: { ...selectedNode.parameters, query: e.target.value } })
                    }}
                    className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
                  />
                </div>
              )}

              {/* Dynamic Configuration for Other Nodes */}
              {NODE_CONFIGS[selectedNode.node_type] && (
                <div className="space-y-3 mt-4">
                  <div className="text-sm font-medium text-blue-600 mb-2">
                    ⚙️ {NODE_TYPES.find(t => t.id === selectedNode.node_type)?.name} Configuration
                  </div>
                  {NODE_CONFIGS[selectedNode.node_type].fields.map((field: any) => {
                    if (field.type === 'select') {
                      return (
                        <div key={field.key}>
                          <label className="block text-sm font-medium mb-1">
                            {field.label} {field.required && <span className="text-red-500">*</span>}
                          </label>
                          <select
                            className="w-full px-3 py-2 border rounded-lg text-sm"
                            value={selectedNode.parameters?.[field.key] || ''}
                            onChange={(e) => updateNodeParam(nodes, selectedNode, setNodes, setSelectedNode, field.key, e.target.value)}
                          >
                            <option value="">Select...</option>
                            {field.options?.map((opt: string) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>
                      )
                    } else if (field.type === 'checkbox') {
                      return (
                        <div key={field.key} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedNode.parameters?.[field.key] || false}
                            onChange={(e) => updateNodeParam(nodes, selectedNode, setNodes, setSelectedNode, field.key, e.target.checked)}
                            className="rounded"
                          />
                          <label className="text-sm font-medium">{field.label}</label>
                        </div>
                      )
                    } else if (field.type === 'textarea') {
                      return (
                        <div key={field.key}>
                          <label className="block text-sm font-medium mb-1">
                            {field.label} {field.required && <span className="text-red-500">*</span>}
                          </label>
                          <textarea
                            className="w-full px-3 py-2 border rounded-lg text-sm font-mono"
                            rows={field.rows || 4}
                            placeholder={field.placeholder || ''}
                            value={selectedNode.parameters?.[field.key] || ''}
                            onChange={(e) => updateNodeParam(nodes, selectedNode, setNodes, setSelectedNode, field.key, e.target.value)}
                          />
                        </div>
                      )
                    } else {
                      return (
                        <div key={field.key}>
                          <label className="block text-sm font-medium mb-1">
                            {field.label} {field.required && <span className="text-red-500">*</span>}
                          </label>
                          <input
                            type={field.type}
                            className="w-full px-3 py-2 border rounded-lg text-sm"
                            placeholder={field.placeholder || ''}
                            value={selectedNode.parameters?.[field.key] || ''}
                            onChange={(e) => updateNodeParam(nodes, selectedNode, setNodes, setSelectedNode, field.key, e.target.value)}
                          />
                        </div>
                      )
                    }
                  })}
                </div>
              )}

              {/* Generic fallback for nodes without specific config */}
              {!NODE_CONFIGS[selectedNode.node_type] && 
               !['webhook', 'schedule', 'send_email', 'send_whatsapp', 'condition', 'loop', 'database_query', 'http_request'].includes(selectedNode.node_type) && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="text-sm text-yellow-800">
                    <strong>📝 Note:</strong> Configuration UI for this node is coming soon. 
                    You can still add it to the workflow.
                  </div>
                </div>
              )}

              <Button 
                variant="outline" 
                className="w-full text-red-600 mt-4"
                onClick={() => deleteNode(selectedNode.node_id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Node
              </Button>
            </div>
                  {/* Headers */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium">Headers</label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const list = Array.isArray(selectedNode.parameters?.headers)
                            ? selectedNode.parameters.headers
                            : []
                          const updated = nodes.map(n =>
                            n.node_id === selectedNode.node_id
                              ? { ...n, parameters: { ...n.parameters, headers: [...list, { key: '', value: '' }] } }
                              : n
                          )
                          setNodes(updated)
                          setSelectedNode({ ...selectedNode, parameters: { ...selectedNode.parameters, headers: [...list, { key: '', value: '' }] } })
                        }}
                      >Add</Button>
                    </div>
                    {presets.length > 0 && (
                      <div className="flex items-center gap-2 mb-2">
                        <select
                          className="px-2 py-1 border rounded"
                          onChange={(e) => {
                            const preset = presets.find(p => p.id === e.target.value)
                            if (!preset) return
                            const updated = nodes.map(n =>
                              n.node_id === selectedNode.node_id
                                ? { ...n, parameters: { ...n.parameters, headers: preset.headers || [] } }
                                : n
                            )
                            setNodes(updated)
                            setSelectedNode({ ...selectedNode, parameters: { ...selectedNode.parameters, headers: preset.headers || [] } })
                          }}
                        >
                          <option value="">Apply preset...</option>
                          {presets.map((p: any) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                        <Button size="sm" variant="outline" onClick={() => setShowPresetForm(true)}>New preset</Button>
                      </div>
                    )}
                    <div className="space-y-2">
                      {(Array.isArray(selectedNode.parameters?.headers) ? selectedNode.parameters.headers : []).map((h: any, i: number) => (
                        <div key={i} className="grid grid-cols-5 gap-2">
                          <input
                            className="col-span-2 px-2 py-1 border rounded"
                            placeholder="Key"
                            value={h.key || ''}
                            onChange={(e) => {
                              const list = (Array.isArray(selectedNode.parameters?.headers) ? selectedNode.parameters.headers : []).slice()
                              list[i] = { ...list[i], key: e.target.value }
                              const updated = nodes.map(n => n.node_id === selectedNode.node_id ? { ...n, parameters: { ...n.parameters, headers: list } } : n)
                              setNodes(updated)
                              setSelectedNode({ ...selectedNode, parameters: { ...selectedNode.parameters, headers: list } })
                            }}
                          />
                          <input
                            className="col-span-2 px-2 py-1 border rounded"
                            placeholder="Value"
                            value={h.value || ''}
                            onChange={(e) => {
                              const list = (Array.isArray(selectedNode.parameters?.headers) ? selectedNode.parameters.headers : []).slice()
                              list[i] = { ...list[i], value: e.target.value }
                              const updated = nodes.map(n => n.node_id === selectedNode.node_id ? { ...n, parameters: { ...n.parameters, headers: list } } : n)
                              setNodes(updated)
                              setSelectedNode({ ...selectedNode, parameters: { ...selectedNode.parameters, headers: list } })
                            }}
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const list = (Array.isArray(selectedNode.parameters?.headers) ? selectedNode.parameters.headers : []).slice()
                              list.splice(i, 1)
                              const updated = nodes.map(n => n.node_id === selectedNode.node_id ? { ...n, parameters: { ...n.parameters, headers: list } } : n)
                              setNodes(updated)
                              setSelectedNode({ ...selectedNode, parameters: { ...selectedNode.parameters, headers: list } })
                            }}
                          >Del</Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Body (raw JSON) */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Body (JSON)</label>
                    <textarea
                      className="w-full px-3 py-2 border rounded"
                      rows={4}
                      placeholder='{"name":"John"}'
                      value={selectedNode.parameters?.body || ''}
                      onChange={(e) => {
                        const updated = nodes.map(n =>
                          n.node_id === selectedNode.node_id
                            ? { ...n, parameters: { ...n.parameters, body: e.target.value } }
                            : n
                        )
                        setNodes(updated)
                        setSelectedNode({ ...selectedNode, parameters: { ...selectedNode.parameters, body: e.target.value } })
                      }}
                    />
                    <div className="text-xs text-gray-500">Sent as JSON; leave empty for GET requests.</div>
                  </div>
          </div>
        )}
      </div>

      {/* Header info: Webhook URL (if webhook present) */}
      {nodes.some(n => n.node_type === 'webhook' && webhookBase) && (
        <div className="mt-2 mx-6 text-sm text-gray-600">
          Webhook URL: {webhookBase.replace(/\/$/, '')}/{nodes.find(n => n.node_type === 'webhook')?.parameters?.path?.replace(/^\//,'')}
        </div>
      )}

      {testOutput && (
        <div className="fixed bottom-4 right-4 w-[32rem] max-w-[90vw] bg-white border rounded-lg shadow-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold">Last Test Result</h4>
            <Button size="sm" variant="outline" onClick={() => setTestOutput(null)}>Close</Button>
          </div>
          <pre className="text-xs overflow-auto max-h-80 bg-gray-50 p-2 rounded">{JSON.stringify(testOutput, null, 2)}</pre>
        </div>
      )}

      {/* Executions mini list */}
      <div className="m-6 bg-white border rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold">Recent Executions</h4>
          <Button size="sm" variant="outline" onClick={loadExecutions}>Refresh</Button>
        </div>
        {executions.length === 0 ? (
          <div className="text-sm text-gray-500">No recent executions</div>
        ) : (
          <div className="text-xs max-h-64 overflow-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="pr-2">Status</th>
                  <th className="pr-2">Started</th>
                  <th className="pr-2">Duration</th>
                  <th className="pr-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {executions.map((e, i) => (
                  <tr key={e.id || i} className="border-t">
                    <td className="py-1">{e.status || (e.finished ? 'success' : 'running')}</td>
                    <td className="py-1">{new Date(e.startedAt || e.startTime || Date.now()).toLocaleString()}</td>
                    <td className="py-1">{e.stoppedAt && e.startedAt ? Math.round((new Date(e.stoppedAt).getTime() - new Date(e.startedAt).getTime())/1000)+'s' : '-'}</td>
                    <td className="py-1">
                      <Button size="sm" variant="outline" onClick={async () => {
                        try {
                          const res = await fetch(`/api/automation/workflows/executions?id=${e.id}`)
                          if (!res.ok) return
                          const data = await res.json(); setTestOutput(data)
                        } catch {}
                      }}>View</Button>
                      {e.status === 'error' && (
                        <Button size="sm" variant="outline" className="ml-2" onClick={async () => {
                          try {
                            await fetch('/api/automation/workflows/executions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: e.id, action: 'retry' }) })
                            await loadExecutions()
                          } catch {}
                        }}>Retry</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New preset modal */}
      {showPresetForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-[32rem] max-w-[90vw] rounded-lg border p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold">Create Header Preset</h4>
              <Button size="sm" variant="outline" onClick={() => setShowPresetForm(false)}>Close</Button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input className="w-full px-3 py-2 border rounded" value={newPreset.name} onChange={(e) => setNewPreset({ ...newPreset, name: e.target.value })} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium">Headers</label>
                  <Button size="sm" variant="outline" onClick={() => setNewPreset({ ...newPreset, headers: [...newPreset.headers, { key: '', value: '' }] })}>Add</Button>
                </div>
                <div className="space-y-2">
                  {newPreset.headers.map((h, i) => (
                    <div key={i} className="grid grid-cols-5 gap-2">
                      <input className="col-span-2 px-2 py-1 border rounded" placeholder="Key" value={h.key} onChange={(e) => {
                        const list = newPreset.headers.slice(); list[i] = { ...list[i], key: e.target.value }; setNewPreset({ ...newPreset, headers: list })
                      }} />
                      <input className="col-span-2 px-2 py-1 border rounded" placeholder="Value" value={h.value} onChange={(e) => {
                        const list = newPreset.headers.slice(); list[i] = { ...list[i], value: e.target.value }; setNewPreset({ ...newPreset, headers: list })
                      }} />
                      <Button size="sm" variant="outline" onClick={() => { const list = newPreset.headers.slice(); list.splice(i,1); setNewPreset({ ...newPreset, headers: list }) }}>Del</Button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => setShowPresetForm(false)}>Cancel</Button>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={async () => {
                  try {
                    const res = await fetch('/api/automation/workflows/credentials', {
                      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newPreset)
                    })
                    if (res.ok) {
                      setShowPresetForm(false); setNewPreset({ name: '', headers: [{ key: '', value: '' }] }); await loadPresets()
                    }
                  } catch {}
                }}>Save Preset</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
