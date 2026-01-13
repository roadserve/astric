'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Plus,
  Bot,
  Zap,
  MessageSquare,
  User,
  Clock,
  Mail,
  FileText,
  CheckCircle,
  Play,
  Pause,
  Trash2,
  Edit,
  Copy,
  X,
  Save,
  Maximize2,
  Minimize2,
  Send,
  Users,
  Tag,
  Image,
  AlertCircle
} from 'lucide-react'

interface ConfigField {
  name: string
  label: string
  type: string
  required: boolean
  placeholder?: string
  maxLength?: number
  options?: string[]
}

interface Node {
  id: string
  type: 'trigger' | 'action'
  actionType: string
  label: string
  position: { x: number; y: number }
  config: any
}

interface Connection {
  from: string
  to: string
}

interface Bot {
  id: string
  name: string
  description: string
  nodes: Node[]
  connections: Connection[]
  is_active: boolean
  created_at: string
  metadata?: {
    description?: string
    nodes?: Node[]
    connections?: Connection[]
  }
}

export default function BotBuilderPage() {
  const supabase = createClientComponentClient()
  const [bots, setBots] = useState<Bot[]>([])
  const [loading, setLoading] = useState(true)
  const [showBuilder, setShowBuilder] = useState(false)
  const [currentBot, setCurrentBot] = useState<Bot | null>(null)
  
  // Canvas state
  const [nodes, setNodes] = useState<Node[]>([])
  const [connections, setConnections] = useState<Connection[]>([])
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [draggingNode, setDraggingNode] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null)
  const [botName, setBotName] = useState('')
  const [botDescription, setBotDescription] = useState('')
  
  const canvasRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadBots()
  }, [])

  const loadBots = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('whatsapp_auto_replies')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      
      const transformedBots = (data || []).map(bot => ({
        ...bot,
        nodes: bot.metadata?.nodes || [],
        connections: bot.metadata?.connections || []
      }))
      
      setBots(transformedBots)
    } catch (error) {
      console.error('Error loading bots:', error)
    } finally {
      setLoading(false)
    }
  }

  // WhatsApp Business Platform compliant triggers and actions
  const triggers = [
    { 
      id: 'message_received', 
      label: 'Message Received', 
      icon: MessageSquare,
      description: 'Triggers when any message is received',
      configFields: [
        { name: 'contains', label: 'Message Contains (optional)', type: 'text', placeholder: 'keyword', required: false }
      ]
    },
    { 
      id: 'keyword_match', 
      label: 'Keyword Match', 
      icon: Tag,
      description: 'Triggers on specific keywords',
      configFields: [
        { name: 'keywords', label: 'Keywords (comma-separated)', type: 'text', placeholder: 'hello, hi, help', required: true },
        { name: 'match_type', label: 'Match Type', type: 'select', options: ['exact', 'contains', 'starts_with'], required: true }
      ]
    },
    { 
      id: 'business_hours', 
      label: 'Business Hours', 
      icon: Clock,
      description: 'Triggers based on business hours',
      configFields: [
        { name: 'outside_hours', label: 'Outside Business Hours', type: 'checkbox', required: false },
        { name: 'start_time', label: 'Start Time', type: 'time', placeholder: '09:00', required: false },
        { name: 'end_time', label: 'End Time', type: 'time', placeholder: '18:00', required: false }
      ]
    },
  ]

  const actions = [
    { 
      id: 'send_text', 
      label: 'Send Text Message', 
      icon: Send,
      description: 'Send a text message (max 4096 characters)',
      configFields: [
        { name: 'message', label: 'Message Text', type: 'textarea', placeholder: 'Enter your message...', required: true, maxLength: 4096 },
        { name: 'preview_url', label: 'Preview URLs', type: 'checkbox', required: false }
      ]
    },
    { 
      id: 'send_template', 
      label: 'Send Template Message', 
      icon: FileText,
      description: 'Send an approved WhatsApp template',
      configFields: [
        { name: 'template_name', label: 'Template Name', type: 'text', placeholder: 'hello_world', required: true },
        { name: 'language', label: 'Language Code', type: 'text', placeholder: 'en_US', required: true },
        { name: 'variables', label: 'Variables (JSON)', type: 'textarea', placeholder: '["John", "Doe"]', required: false }
      ]
    },
    { 
      id: 'send_image', 
      label: 'Send Image', 
      icon: Image,
      description: 'Send an image message',
      configFields: [
        { name: 'image_url', label: 'Image URL', type: 'text', placeholder: 'https://...', required: true },
        { name: 'caption', label: 'Caption (optional)', type: 'textarea', maxLength: 1024, required: false }
      ]
    },
    { 
      id: 'add_tag', 
      label: 'Add Tag', 
      icon: Tag,
      description: 'Add a tag to the contact',
      configFields: [
        { name: 'tag', label: 'Tag Name', type: 'text', placeholder: 'customer, lead, vip', required: true }
      ]
    },
    { 
      id: 'assign_agent', 
      label: 'Assign to Agent', 
      icon: Users,
      description: 'Assign conversation to team member',
      configFields: [
        { name: 'agent_id', label: 'Agent/Team Member', type: 'select', options: ['Agent 1', 'Agent 2', 'Support Team'], required: true }
      ]
    },
    { 
      id: 'mark_resolved', 
      label: 'Mark as Resolved', 
      icon: CheckCircle,
      description: 'Mark conversation as resolved',
      configFields: []
    },
  ]

  const createNewBot = () => {
    setBotName('New Bot')
    setBotDescription('')
    setNodes([])
    setConnections([])
    setSelectedNode(null)
    setShowBuilder(true)
    setCurrentBot(null)
  }

  const addNode = (type: 'trigger' | 'action', item: any) => {
    // Only allow one trigger
    if (type === 'trigger' && nodes.some(n => n.type === 'trigger')) {
      alert('Only one trigger is allowed per bot')
      return
    }

    const newNode: Node = {
      id: `node_${Date.now()}`,
      type,
      actionType: item.id,
      label: item.label,
      position: { 
        x: 400 + nodes.length * 50, 
        y: 250 + (nodes.length % 3) * 120 
      },
      config: {}
    }
    setNodes([...nodes, newNode])
    setSelectedNode(newNode)
  }

  const deleteNode = (nodeId: string) => {
    setNodes(nodes.filter(n => n.id !== nodeId))
    setConnections(connections.filter(c => c.from !== nodeId && c.to !== nodeId))
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null)
    }
  }

  const startConnection = (nodeId: string) => {
    setConnectingFrom(nodeId)
  }

  const completeConnection = (toNodeId: string) => {
    if (connectingFrom && connectingFrom !== toNodeId) {
      // Check if connection already exists
      const exists = connections.some(c => c.from === connectingFrom && c.to === toNodeId)
      if (!exists) {
        setConnections([...connections, { from: connectingFrom, to: toNodeId }])
      }
    }
    setConnectingFrom(null)
  }

  const handleNodeMouseDown = (e: React.MouseEvent, node: Node) => {
    e.stopPropagation()
    setDraggingNode(node.id)
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingNode && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left - dragOffset.x
      const y = e.clientY - rect.top - dragOffset.y
      
      setNodes(nodes.map(node => 
        node.id === draggingNode 
          ? { ...node, position: { x: Math.max(0, x), y: Math.max(0, y) } }
          : node
      ))
    }
  }

  const handleMouseUp = () => {
    setDraggingNode(null)
  }

  const updateNodeConfig = (field: string, value: any) => {
    if (!selectedNode) return

    const updatedNode = {
      ...selectedNode,
      config: { ...selectedNode.config, [field]: value }
    }
    
    setNodes(nodes.map(n => n.id === selectedNode.id ? updatedNode : n))
    setSelectedNode(updatedNode)
  }

  const saveBot = async () => {
    if (!botName.trim()) {
      alert('Please enter a bot name')
      return
    }

    // Validate: Must have at least one trigger
    const triggerNode = nodes.find(n => n.type === 'trigger')
    if (!triggerNode) {
      alert('Bot must have at least one trigger')
      return
    }

    // Validate: Must have at least one action
    const actionNodes = nodes.filter(n => n.type === 'action')
    if (actionNodes.length === 0) {
      alert('Bot must have at least one action')
      return
    }

    // Validate required fields
    for (const node of nodes) {
      const definition = node.type === 'trigger' 
        ? triggers.find(t => t.id === node.actionType)
        : actions.find(a => a.id === node.actionType)
      
      if (definition) {
        for (const field of definition.configFields) {
          if (field.required && !node.config[field.name]) {
            alert(`Please configure "${field.label}" for ${node.label}`)
            return
          }
        }
      }
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

      const botData = {
        organization_id: orgMember?.organization_id,
        name: botName,
        trigger_type: triggerNode.actionType,
        trigger_value: triggerNode.config.keywords || triggerNode.config.contains || '',
        response_message: actionNodes[0]?.config.message || '',
        is_active: true,
        priority: 0,
        metadata: {
          description: botDescription,
          nodes: nodes,
          connections: connections
        }
      }

      if (currentBot) {
        const { error } = await supabase
          .from('whatsapp_auto_replies')
          .update(botData)
          .eq('id', currentBot.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('whatsapp_auto_replies')
          .insert(botData)

        if (error) throw error
      }

      alert('Bot saved successfully!')
      setShowBuilder(false)
      loadBots()
    } catch (error) {
      console.error('Error saving bot:', error)
      alert('Failed to save bot')
    }
  }

  const editBot = (bot: Bot) => {
    setCurrentBot(bot)
    setBotName(bot.name)
    setBotDescription(bot.description || bot.metadata?.description || '')
    setNodes(bot.nodes || [])
    setConnections(bot.connections || [])
    setShowBuilder(true)
  }

  const deleteBot = async (botId: string) => {
    if (!confirm('Are you sure you want to delete this bot?')) return

    try {
      const { error } = await supabase
        .from('whatsapp_auto_replies')
        .delete()
        .eq('id', botId)

      if (error) throw error
      loadBots()
    } catch (error) {
      console.error('Error deleting bot:', error)
    }
  }

  const toggleBot = async (botId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('whatsapp_auto_replies')
        .update({ is_active: !isActive })
        .eq('id', botId)

      if (error) throw error
      loadBots()
    } catch (error) {
      console.error('Error toggling bot:', error)
    }
  }

  const getNodeStyle = (node: Node) => {
    if (node.type === 'trigger') {
      return 'bg-blue-50 border-blue-400 text-blue-900'
    }
    return 'bg-green-50 border-green-400 text-green-900'
  }

  const getNodeIcon = (node: Node) => {
    const definition = node.type === 'trigger'
      ? triggers.find(t => t.id === node.actionType)
      : actions.find(a => a.id === node.actionType)
    
    return definition?.icon || MessageSquare
  }

  if (showBuilder) {
    return (
      <div className="h-screen bg-gray-50 flex flex-col">
        {/* Builder Header */}
        <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (confirm('Close without saving?')) {
                  setShowBuilder(false)
                }
              }}
            >
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
            <div className="border-l pl-4">
              <input
                type="text"
                value={botName}
                onChange={(e) => setBotName(e.target.value)}
                className="text-xl font-bold border-b-2 border-transparent hover:border-gray-300 focus:border-green-500 focus:outline-none px-2 py-1"
                placeholder="Bot Name"
              />
              <input
                type="text"
                value={botDescription}
                onChange={(e) => setBotDescription(e.target.value)}
                className="text-sm text-gray-600 border-b border-transparent hover:border-gray-300 focus:border-green-500 focus:outline-none px-2 py-1 mt-1 block"
                placeholder="Description"
              />
            </div>
          </div>
          <Button
            onClick={saveBot}
            className="bg-green-600 hover:bg-green-700"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Bot
          </Button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <div className="w-72 bg-white border-r border-gray-200 overflow-y-auto">
            <div className="p-4">
              {/* Triggers */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="h-4 w-4 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Triggers</h3>
                  <span className="text-xs text-gray-500">(Max 1)</span>
                </div>
                <div className="space-y-2">
                  {triggers.map((trigger) => {
                    const Icon = trigger.icon
                    return (
                      <div
                        key={trigger.id}
                        onClick={() => addNode('trigger', trigger)}
                        className="p-3 bg-blue-50 border-2 border-blue-200 rounded-lg cursor-pointer hover:bg-blue-100 hover:border-blue-400 transition-all"
                      >
                        <div className="flex items-start gap-2">
                          <Icon className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{trigger.label}</div>
                            <div className="text-xs text-gray-600 mt-0.5">{trigger.description}</div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Actions */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <h3 className="font-semibold text-gray-900">Actions</h3>
                </div>
                <div className="space-y-2">
                  {actions.map((action) => {
                    const Icon = action.icon
                    return (
                      <div
                        key={action.id}
                        onClick={() => addNode('action', action)}
                        className="p-3 bg-green-50 border-2 border-green-200 rounded-lg cursor-pointer hover:bg-green-100 hover:border-green-400 transition-all"
                      >
                        <div className="flex items-start gap-2">
                          <Icon className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{action.label}</div>
                            <div className="text-xs text-gray-600 mt-0.5">{action.description}</div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Canvas */}
          <div 
            ref={canvasRef}
            className="flex-1 relative bg-gray-100 overflow-auto"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            style={{ 
              backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }}
          >
            {/* SVG for connections */}
            <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%', zIndex: 1 }}>
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="10"
                  refX="9"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3, 0 6" fill="#10b981" />
                </marker>
              </defs>
              {connections.map((conn, idx) => {
                const fromNode = nodes.find(n => n.id === conn.from)
                const toNode = nodes.find(n => n.id === conn.to)
                if (!fromNode || !toNode) return null

                const x1 = fromNode.position.x + 200
                const y1 = fromNode.position.y + 40
                const x2 = toNode.position.x
                const y2 = toNode.position.y + 40

                const midX = (x1 + x2) / 2

                return (
                  <path
                    key={idx}
                    d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`}
                    stroke="#10b981"
                    strokeWidth="3"
                    fill="none"
                    markerEnd="url(#arrowhead)"
                  />
                )
              })}
            </svg>

            {/* Nodes */}
            <div className="relative" style={{ minHeight: '800px', minWidth: '1200px', zIndex: 2 }}>
              {nodes.map((node) => {
                const Icon = getNodeIcon(node)
                return (
                  <div
                    key={node.id}
                    className={`absolute p-4 rounded-lg border-2 shadow-lg cursor-move select-none ${getNodeStyle(node)} ${
                      selectedNode?.id === node.id ? 'ring-4 ring-green-500 ring-opacity-50' : ''
                    }`}
                    style={{
                      left: node.position.x,
                      top: node.position.y,
                      width: '200px',
                      zIndex: draggingNode === node.id ? 10 : 3
                    }}
                    onMouseDown={(e) => handleNodeMouseDown(e, node)}
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedNode(node)
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span className="font-semibold text-sm">{node.label}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteNode(node.id)
                        }}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    
                    {/* Connection Points */}
                    <div className="flex justify-between">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (connectingFrom) {
                            completeConnection(node.id)
                          }
                        }}
                        className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-md hover:scale-110 transition-transform"
                        title="Input"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          startConnection(node.id)
                        }}
                        className={`w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-md hover:scale-110 transition-transform ${
                          connectingFrom === node.id ? 'ring-2 ring-green-400 animate-pulse' : ''
                        }`}
                        title="Output"
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Empty State */}
            {nodes.length === 0 && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                <Bot className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Build Your Bot Workflow</h3>
                <p className="text-gray-600 mb-4">
                  1. Add a trigger from the left sidebar<br/>
                  2. Add actions to perform<br/>
                  3. Connect nodes by clicking output → input dots
                </p>
              </div>
            )}

            {/* Connection Mode Indicator */}
            {connectingFrom && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50">
                Click on another node&apos;s input (blue dot) to connect
              </div>
            )}
          </div>

          {/* Properties Panel */}
          {selectedNode && (
            <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Node Configuration</h3>
                  <button onClick={() => setSelectedNode(null)}>
                    <X className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Node Type
                    </label>
                    <div className={`px-3 py-2 rounded-lg font-medium ${getNodeStyle(selectedNode)}`}>
                      {selectedNode.type === 'trigger' ? 'Trigger' : 'Action'}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Action
                    </label>
                    <div className="px-3 py-2 bg-gray-100 rounded-lg text-sm">
                      {selectedNode.label}
                    </div>
                  </div>

                  {/* Dynamic Configuration Fields */}
                  {(() => {
                    const definition = selectedNode.type === 'trigger'
                      ? triggers.find(t => t.id === selectedNode.actionType)
                      : actions.find(a => a.id === selectedNode.actionType)
                    
                    return definition?.configFields.map((field) => (
                      <div key={field.name}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {field.label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        
                        {field.type === 'text' && (
                          <input
                            type="text"
                            value={selectedNode.config[field.name] || ''}
                            onChange={(e) => updateNodeConfig(field.name, e.target.value)}
                            placeholder={'placeholder' in field ? field.placeholder || '' : ''}
                            maxLength={'maxLength' in field ? (field.maxLength as number) || undefined : undefined}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        )}
                        
                        {field.type === 'textarea' && (
                          <textarea
                            value={selectedNode.config[field.name] || ''}
                            onChange={(e) => updateNodeConfig(field.name, e.target.value)}
                            placeholder={'placeholder' in field ? field.placeholder || '' : ''}
                            maxLength={'maxLength' in field ? (field.maxLength as number) || undefined : undefined}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        )}
                        
                        {field.type === 'select' && (
                          <select
                            value={selectedNode.config[field.name] || ''}
                            onChange={(e) => updateNodeConfig(field.name, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          >
                            <option value="">Select...</option>
                            {'options' in field && field.options?.map((opt: string) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        )}
                        
                        {field.type === 'checkbox' && (
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedNode.config[field.name] || false}
                              onChange={(e) => updateNodeConfig(field.name, e.target.checked)}
                              className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                            />
                            <span className="text-sm text-gray-700">Enable</span>
                          </label>
                        )}
                        
                        {field.type === 'time' && (
                          <input
                            type="time"
                            value={selectedNode.config[field.name] || ''}
                            onChange={(e) => updateNodeConfig(field.name, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        )}
                        
                        {'maxLength' in field && field.maxLength ? (
                          <p className="text-xs text-gray-500 mt-1">
                            {(selectedNode.config[field.name] || '').length} / {field.maxLength} characters
                          </p>
                        ) : null}
                      </div>
                    ))
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Bot List View (same as before)
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Bot className="h-8 w-8 text-green-600" />
            Bot Builder
          </h1>
          <p className="text-gray-600 mt-1">Create visual automation workflows</p>
        </div>
        <Button 
          onClick={createNewBot}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
        >
          <Plus className="h-4 w-4" />
          Create New Bot
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bots</CardTitle>
            <Bot className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bots.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Play className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {bots.filter(b => b.is_active).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            <Pause className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {bots.filter(b => !b.is_active).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6">
        {loading ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              Loading bots...
            </CardContent>
          </Card>
        ) : bots.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No bots yet</h3>
              <p className="text-gray-600 mb-4">Create your first visual bot workflow</p>
              <Button onClick={createNewBot} className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                Create Bot
              </Button>
            </CardContent>
          </Card>
        ) : (
          bots.map((bot) => (
            <Card key={bot.id} className={`hover:shadow-lg transition-shadow ${!bot.is_active ? 'opacity-60' : ''}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Bot className={`h-5 w-5 ${bot.is_active ? 'text-green-600' : 'text-gray-400'}`} />
                      <h3 className="text-lg font-semibold text-gray-900">{bot.name}</h3>
                      {bot.is_active ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full flex items-center gap-1">
                          <Play className="h-3 w-3" />
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full flex items-center gap-1">
                          <Pause className="h-3 w-3" />
                          Inactive
                        </span>
                      )}
                    </div>

                    <p className="text-gray-600 mb-4">{bot.description || bot.metadata?.description}</p>

                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>{bot.nodes?.length || 0} nodes</span>
                      <span>•</span>
                      <span>{bot.connections?.length || 0} connections</span>
                      <span>•</span>
                      <span>Created {new Date(bot.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleBot(bot.id, bot.is_active)}
                    >
                      {bot.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => editBot(bot)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteBot(bot.id)}
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
    </div>
  )
}