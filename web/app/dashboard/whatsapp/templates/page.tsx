'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Plus, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock,
  Eye,
  Copy,
  Trash2,
  Edit,
  Send,
  Image,
  Video,
  File as FileIcon,
  Phone,
  Link as LinkIcon,
  AlertCircle,
  X
} from 'lucide-react'

interface Template {
  id: string
  name: string
  language: string
  category: string
  status: string
  components: any
  quality_score?: string
  rejection_reason?: string
  created_at: string
}

type ComponentType = 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS'
type HeaderType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT'
type ButtonType = 'QUICK_REPLY' | 'PHONE_NUMBER' | 'URL' | 'COPY_CODE'

export default function TemplatesPage() {
  const supabase = createClientComponentClient()
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)

  // Form state
  const [templateName, setTemplateName] = useState('')
  const [templateLanguage, setTemplateLanguage] = useState('en')
  const [templateCategory, setTemplateCategory] = useState('UTILITY')
  
  // Components
  const [hasHeader, setHasHeader] = useState(false)
  const [headerType, setHeaderType] = useState<HeaderType>('TEXT')
  const [headerText, setHeaderText] = useState('')
  const [headerMediaUrl, setHeaderMediaUrl] = useState('')
  
  const [bodyText, setBodyText] = useState('')
  const [bodyVariables, setBodyVariables] = useState<string[]>([])
  
  const [hasFooter, setHasFooter] = useState(false)
  const [footerText, setFooterText] = useState('')
  
  const [hasButtons, setHasButtons] = useState(false)
  const [buttonType, setButtonType] = useState<ButtonType>('QUICK_REPLY')
  const [buttons, setButtons] = useState<{type: ButtonType, text: string, value?: string}[]>([])

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('whatsapp_templates')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setTemplates(data || [])
    } catch (error) {
      console.error('Error loading templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const detectVariables = (text: string): string[] => {
    const matches = text.match(/\{\{(\d+)\}\}/g)
    return matches ? matches.map(m => m.replace(/[{}]/g, '')) : []
  }

  const handleBodyTextChange = (text: string) => {
    setBodyText(text)
    setBodyVariables(detectVariables(text))
  }

  const addVariable = () => {
    const nextNum = bodyVariables.length + 1
    setBodyText(bodyText + ` {{${nextNum}}}`)
    setBodyVariables([...bodyVariables, nextNum.toString()])
  }

  const addButton = () => {
    if (buttons.length >= 3) {
      alert('Maximum 3 buttons allowed')
      return
    }
    setButtons([...buttons, { type: buttonType, text: '', value: '' }])
  }

  const updateButton = (index: number, field: 'text' | 'value', value: string) => {
    const updated = [...buttons]
    updated[index][field] = value
    setButtons(updated)
  }

  const removeButton = (index: number) => {
    setButtons(buttons.filter((_, i) => i !== index))
  }

  const validateTemplate = (): string | null => {
    // Template name validation
    if (!templateName.trim()) return 'Template name is required'
    if (!/^[a-z0-9_]+$/.test(templateName)) {
      return 'Template name must be lowercase letters, numbers, and underscores only'
    }
    if (templateName.length > 512) return 'Template name too long (max 512 characters)'

    // Body validation
    if (!bodyText.trim()) return 'Body text is required'
    if (bodyText.length > 1024) return 'Body text too long (max 1024 characters)'

    // Header validation
    if (hasHeader) {
      if (headerType === 'TEXT' && !headerText.trim()) return 'Header text is required'
      if (headerType !== 'TEXT' && !headerMediaUrl.trim()) return 'Header media URL is required'
      if (headerType === 'TEXT' && headerText.length > 60) return 'Header text too long (max 60 characters)'
    }

    // Footer validation
    if (hasFooter) {
      if (!footerText.trim()) return 'Footer text is required'
      if (footerText.length > 60) return 'Footer text too long (max 60 characters)'
    }

    // Button validation
    if (hasButtons) {
      if (buttons.length === 0) return 'At least one button is required'
      for (const btn of buttons) {
        if (!btn.text.trim()) return 'Button text is required'
        if (btn.text.length > 20) return 'Button text too long (max 20 characters)'
        if ((btn.type === 'PHONE_NUMBER' || btn.type === 'URL') && !btn.value?.trim()) {
          return `${btn.type === 'PHONE_NUMBER' ? 'Phone number' : 'URL'} is required for ${btn.text}`
        }
      }
    }

    return null
  }

  const handleCreateTemplate = async () => {
    const error = validateTemplate()
    if (error) {
      alert(error)
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

      // Build components according to WhatsApp spec
      const components: any = []

      // Header
      if (hasHeader) {
        const headerComponent: any = {
          type: 'HEADER',
          format: headerType
        }
        
        if (headerType === 'TEXT') {
          headerComponent.text = headerText
        } else {
          headerComponent.example = {
            header_handle: [headerMediaUrl]
          }
        }
        
        components.push(headerComponent)
      }

      // Body (required)
      const bodyComponent: any = {
        type: 'BODY',
        text: bodyText
      }
      
      if (bodyVariables.length > 0) {
        bodyComponent.example = {
          body_text: [bodyVariables.map((_, i) => `Variable ${i + 1}`)]
        }
      }
      
      components.push(bodyComponent)

      // Footer
      if (hasFooter) {
        components.push({
          type: 'FOOTER',
          text: footerText
        })
      }

      // Buttons
      if (hasButtons && buttons.length > 0) {
        const buttonComponent: any = {
          type: 'BUTTONS',
          buttons: buttons.map((btn, idx) => {
            const button: any = {
              type: btn.type,
              text: btn.text
            }
            
            if (btn.type === 'PHONE_NUMBER') {
              button.phone_number = btn.value
            } else if (btn.type === 'URL') {
              button.url = btn.value
            }
            
            return button
          })
        }
        
        components.push(buttonComponent)
      }

      // Save to database
      const { error: dbError } = await supabase
        .from('whatsapp_templates')
        .insert({
          organization_id: orgMember?.organization_id,
          name: templateName,
          language: templateLanguage,
          category: templateCategory,
          status: 'pending',
          components: { components },
          created_by: profile?.id
        })

      if (dbError) throw dbError

      alert('Template created! It will be submitted to WhatsApp for approval.')
      resetForm()
      setShowCreateModal(false)
      loadTemplates()
    } catch (error) {
      console.error('Error creating template:', error)
      alert('Failed to create template')
    }
  }

  const resetForm = () => {
    setTemplateName('')
    setTemplateLanguage('en')
    setTemplateCategory('UTILITY')
    setHasHeader(false)
    setHeaderType('TEXT')
    setHeaderText('')
    setHeaderMediaUrl('')
    setBodyText('')
    setBodyVariables([])
    setHasFooter(false)
    setFooterText('')
    setHasButtons(false)
    setButtons([])
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return

    try {
      const { error } = await supabase
        .from('whatsapp_templates')
        .delete()
        .eq('id', templateId)

      if (error) throw error
      loadTemplates()
    } catch (error) {
      console.error('Error deleting template:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Approved' },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending' },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Rejected' },
      disabled: { color: 'bg-gray-100 text-gray-800', icon: XCircle, label: 'Disabled' }
    }
    
    const badge = badges[status as keyof typeof badges] || badges.pending
    const Icon = badge.icon

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="h-3 w-3" />
        {badge.label}
      </span>
    )
  }

  const getCategoryBadge = (category: string) => {
    const colors = {
      MARKETING: 'bg-purple-100 text-purple-800',
      UTILITY: 'bg-blue-100 text-blue-800',
      AUTHENTICATION: 'bg-indigo-100 text-indigo-800'
    }
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[category as keyof typeof colors]}`}>
        {category}
      </span>
    )
  }

  const stats = {
    total: templates.length,
    approved: templates.filter(t => t.status === 'approved').length,
    pending: templates.filter(t => t.status === 'pending').length,
    rejected: templates.filter(t => t.status === 'rejected').length
  }

  const renderTemplatePreview = (template: Template) => {
    const components = template.components?.components || []
    
    return (
      <div className="bg-white border border-gray-300 rounded-lg p-4 max-w-md">
        {components.map((comp: any, idx: number) => {
          if (comp.type === 'HEADER') {
            return (
              <div key={idx} className="mb-3">
                {comp.format === 'TEXT' && (
                  <div className="font-bold text-gray-900">{comp.text}</div>
                )}
                {comp.format === 'IMAGE' && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Image className="h-4 w-4" />
                    <span>Image Header</span>
                  </div>
                )}
                {comp.format === 'VIDEO' && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Video className="h-4 w-4" />
                    <span>Video Header</span>
                  </div>
                )}
                {comp.format === 'DOCUMENT' && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FileIcon className="h-4 w-4" />
                    <span>Document Header</span>
                  </div>
                )}
              </div>
            )
          }
          
          if (comp.type === 'BODY') {
            return (
              <div key={idx} className="mb-3 text-gray-800 whitespace-pre-wrap">
                {comp.text}
              </div>
            )
          }
          
          if (comp.type === 'FOOTER') {
            return (
              <div key={idx} className="mb-3 text-sm text-gray-500">
                {comp.text}
              </div>
            )
          }
          
          if (comp.type === 'BUTTONS') {
            return (
              <div key={idx} className="space-y-2">
                {comp.buttons?.map((btn: any, btnIdx: number) => (
                  <div key={btnIdx} className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 rounded border border-gray-300 text-sm font-medium">
                    {btn.type === 'PHONE_NUMBER' && <Phone className="h-3 w-3" />}
                    {btn.type === 'URL' && <LinkIcon className="h-3 w-3" />}
                    {btn.text}
                  </div>
                ))}
              </div>
            )
          }
          
          return null
        })}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Message Templates</h1>
          <p className="text-gray-600 mt-1">Create and manage WhatsApp message templates</p>
        </div>
        <Button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
        >
          <Plus className="h-4 w-4" />
          Create Template
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Templates</CardTitle>
            <FileText className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Templates List */}
      <div className="grid gap-6">
        {loading ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              Loading templates...
            </CardContent>
          </Card>
        ) : templates.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No templates yet</h3>
              <p className="text-gray-600 mb-4">Create your first message template to get started</p>
              <Button onClick={() => setShowCreateModal(true)} className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </CardContent>
          </Card>
        ) : (
          templates.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                      {getStatusBadge(template.status)}
                      {getCategoryBadge(template.category)}
                      <span className="text-xs text-gray-500">({template.language.toUpperCase()})</span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                      <span>Created: {new Date(template.created_at).toLocaleDateString()}</span>
                    </div>

                    {/* Template Preview */}
                    <div className="mb-4">
                      {renderTemplatePreview(template)}
                    </div>

                    {template.status === 'rejected' && template.rejection_reason && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-red-900">Rejection Reason:</p>
                            <p className="text-sm text-red-800 mt-1">{template.rejection_reason}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedTemplate(template)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    {template.status === 'approved' && (
                      <Button variant="ghost" size="sm">
                        <Copy className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTemplate(template.id)}
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

      {/* Create Template Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <Card className="w-full max-w-4xl my-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Create Message Template</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowCreateModal(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Basic Info */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template Name * (lowercase, underscores only)
                  </label>
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                    placeholder="welcome_message"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Language *</label>
                  <select
                    value={templateLanguage}
                    onChange={(e) => setTemplateLanguage(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="en">English</option>
                    <option value="en_US">English (US)</option>
                    <option value="en_GB">English (UK)</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="hi">Hindi</option>
                    <option value="pt_BR">Portuguese (Brazil)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                <select
                  value={templateCategory}
                  onChange={(e) => setTemplateCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="UTILITY">UTILITY - Transactional updates</option>
                  <option value="MARKETING">MARKETING - Promotional content</option>
                  <option value="AUTHENTICATION">AUTHENTICATION - OTP/Verification</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {templateCategory === 'MARKETING' && 'Requires user opt-in'}
                  {templateCategory === 'UTILITY' && 'For account updates, order notifications'}
                  {templateCategory === 'AUTHENTICATION' && 'For OTP codes and verification'}
                </p>
              </div>

              {/* Header */}
              <div className="border-t pt-4">
                <label className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    checked={hasHeader}
                    onChange={(e) => setHasHeader(e.target.checked)}
                    className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Add Header (Optional)</span>
                </label>

                {hasHeader && (
                  <div className="space-y-3 ml-6">
                    <div className="flex gap-2">
                      {(['TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT'] as HeaderType[]).map((type) => (
                        <button
                          key={type}
                          onClick={() => setHeaderType(type)}
                          className={`px-3 py-1 text-sm rounded ${
                            headerType === type
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>

                    {headerType === 'TEXT' ? (
                      <input
                        type="text"
                        value={headerText}
                        onChange={(e) => setHeaderText(e.target.value)}
                        placeholder="Header text (max 60 chars)"
                        maxLength={60}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    ) : (
                      <input
                        type="url"
                        value={headerMediaUrl}
                        onChange={(e) => setHeaderMediaUrl(e.target.value)}
                        placeholder={`${headerType} URL`}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Body */}
              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Body Text * (max 1024 chars)
                </label>
                <textarea
                  value={bodyText}
                  onChange={(e) => handleBodyTextChange(e.target.value)}
                  placeholder="Enter your message. Use {{1}}, {{2}} for variables"
                  rows={6}
                  maxLength={1024}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-500">{bodyText.length} / 1024 characters</p>
                  <Button variant="outline" size="sm" onClick={addVariable}>
                    <Plus className="h-3 w-3 mr-1" />
                    Add Variable
                  </Button>
                </div>
                {bodyVariables.length > 0 && (
                  <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-800">
                    Variables detected: {bodyVariables.join(', ')}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t pt-4">
                <label className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    checked={hasFooter}
                    onChange={(e) => setHasFooter(e.target.checked)}
                    className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Add Footer (Optional)</span>
                </label>

                {hasFooter && (
                  <input
                    type="text"
                    value={footerText}
                    onChange={(e) => setFooterText(e.target.value)}
                    placeholder="Footer text (max 60 chars)"
                    maxLength={60}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ml-6"
                  />
                )}
              </div>

              {/* Buttons */}
              <div className="border-t pt-4">
                <label className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    checked={hasButtons}
                    onChange={(e) => setHasButtons(e.target.checked)}
                    className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Add Buttons (Optional, max 3)</span>
                </label>

                {hasButtons && (
                  <div className="space-y-3 ml-6">
                    <div className="flex gap-2">
                      <select
                        value={buttonType}
                        onChange={(e) => setButtonType(e.target.value as ButtonType)}
                        className="px-3 py-1 text-sm border border-gray-300 rounded"
                      >
                        <option value="QUICK_REPLY">Quick Reply</option>
                        <option value="PHONE_NUMBER">Call Phone Number</option>
                        <option value="URL">Visit Website</option>
                        <option value="COPY_CODE">Copy Code (OTP)</option>
                      </select>
                      <Button variant="outline" size="sm" onClick={addButton}>
                        <Plus className="h-3 w-3 mr-1" />
                        Add Button
                      </Button>
                    </div>

                    {buttons.map((btn, idx) => (
                      <div key={idx} className="flex gap-2 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1 space-y-2">
                          <input
                            type="text"
                            value={btn.text}
                            onChange={(e) => updateButton(idx, 'text', e.target.value)}
                            placeholder="Button text (max 20 chars)"
                            maxLength={20}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                          {(btn.type === 'PHONE_NUMBER' || btn.type === 'URL') && (
                            <input
                              type={btn.type === 'PHONE_NUMBER' ? 'tel' : 'url'}
                              value={btn.value || ''}
                              onChange={(e) => updateButton(idx, 'value', e.target.value)}
                              placeholder={btn.type === 'PHONE_NUMBER' ? '+1234567890' : 'https://example.com'}
                              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          )}
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => removeButton(idx)}>
                          <X className="h-4 w-4" />
                        </Button>
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
                  onClick={handleCreateTemplate}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Info Card */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>About Message Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm text-gray-600">
            <p>
              <strong>Message templates</strong> must be pre-approved by WhatsApp before use. 
              Templates ensure quality and prevent spam.
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">📢 MARKETING</h4>
                <p>Promotional messages, offers, announcements. Requires user opt-in.</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">🔔 UTILITY</h4>
                <p>Order updates, appointment reminders, account notifications.</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">🔐 AUTHENTICATION</h4>
                <p>OTP codes, verification messages, security alerts.</p>
              </div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-yellow-800">
                <strong>Note:</strong> Template approval typically takes 24-48 hours. 
                Once approved, you can use the template to send messages.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}