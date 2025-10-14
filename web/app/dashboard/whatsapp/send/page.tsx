'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Send, 
  Image as ImageIcon, 
  Video, 
  File as FileIcon,
  Users,
  FileText,
  X,
  Upload,
  CheckCircle,
  Music,
  MapPin,
  User,
  List,
  MessageSquare
} from 'lucide-react'

interface Contact {
  id: string
  phone_number: string
  name: string
}

interface Template {
  id: string
  name: string
  language: string
  category: string
  components: any
}

type MessageType = 'text' | 'template' | 'image' | 'video' | 'audio' | 'document' | 'location' | 'contact' | 'interactive'

export default function SendMessagePage() {
  const supabase = createClientComponentClient()
  const [messageType, setMessageType] = useState<MessageType>('text')
  const [contacts, setContacts] = useState<Contact[]>([])
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  
  // Text message
  const [messageText, setMessageText] = useState('')
  const [previewUrl, setPreviewUrl] = useState(true)
  
  // Media
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaUrl, setMediaUrl] = useState('')
  const [mediaPreview, setMediaPreview] = useState<string>('')
  const [caption, setCaption] = useState('')
  
  // Location
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [locationName, setLocationName] = useState('')
  const [locationAddress, setLocationAddress] = useState('')
  
  // Contact
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  
  // Interactive
  const [interactiveType, setInteractiveType] = useState<'button' | 'list'>('button')
  const [interactiveHeader, setInteractiveHeader] = useState('')
  const [interactiveBody, setInteractiveBody] = useState('')
  const [interactiveFooter, setInteractiveFooter] = useState('')
  const [buttons, setButtons] = useState<string[]>([''])
  const [listItems, setListItems] = useState<{title: string, description: string}[]>([{title: '', description: ''}])
  
  const [sending, setSending] = useState(false)
  const [sendStatus, setSendStatus] = useState<{ success: number; failed: number } | null>(null)

  useEffect(() => {
    loadContacts()
    loadTemplates()
  }, [])

  const loadContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_contacts')
        .select('id, phone_number, name')
        .order('name')

      if (error) throw error
      setContacts(data || [])
    } catch (error) {
      console.error('Error loading contacts:', error)
    }
  }

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_templates')
        .select('*')
        .eq('status', 'approved')
        .order('name')

      if (error) throw error
      setTemplates(data || [])
    } catch (error) {
      console.error('Error loading templates:', error)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size based on type
    const maxSizes = {
      image: 5 * 1024 * 1024, // 5MB
      video: 16 * 1024 * 1024, // 16MB
      audio: 16 * 1024 * 1024, // 16MB
      document: 100 * 1024 * 1024 // 100MB
    }

    const fileType = file.type.startsWith('image/') ? 'image' :
                     file.type.startsWith('video/') ? 'video' :
                     file.type.startsWith('audio/') ? 'audio' : 'document'

    if (file.size > maxSizes[fileType]) {
      alert(`File too large. Maximum size for ${fileType}: ${maxSizes[fileType] / (1024 * 1024)}MB`)
      return
    }

    setMediaFile(file)
    
    // Create preview
    if (fileType === 'image' || fileType === 'video') {
      const reader = new FileReader()
      reader.onloadend = () => {
        setMediaPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSendMessage = async () => {
    if (selectedContacts.length === 0) {
      alert('Please select at least one contact')
      return
    }

    // Validation based on message type
    if (messageType === 'text' && !messageText.trim()) {
      alert('Please enter a message')
      return
    }

    if (messageType === 'text' && messageText.length > 4096) {
      alert('Message too long. Maximum 4096 characters')
      return
    }

    if (['image', 'video', 'audio', 'document'].includes(messageType) && !mediaFile && !mediaUrl) {
      alert('Please select a file or enter a URL')
      return
    }

    if (messageType === 'location' && (!latitude || !longitude)) {
      alert('Please enter latitude and longitude')
      return
    }

    if (messageType === 'contact' && (!contactName || !contactPhone)) {
      alert('Please enter contact name and phone')
      return
    }

    if (messageType === 'interactive' && !interactiveBody) {
      alert('Please enter message body')
      return
    }

    setSending(true)
    setSendStatus(null)

    try {
      let successCount = 0
      let failedCount = 0

      for (const contactId of selectedContacts) {
        try {
          const contact = contacts.find(c => c.id === contactId)
          if (!contact) continue

          let messageData: any = {
            phone_number: contact.phone_number,
            type: messageType
          }

          // Build message based on type
          switch (messageType) {
            case 'text':
              messageData.text = {
                body: messageText,
                preview_url: previewUrl
              }
              break

            case 'image':
            case 'video':
            case 'audio':
            case 'document':
              if (mediaFile) {
                // Upload to Supabase Storage first
                const fileExt = mediaFile.name.split('.').pop()
                const fileName = `${Date.now()}.${fileExt}`
                const { data: uploadData, error: uploadError } = await supabase.storage
                  .from('whatsapp-media')
                  .upload(fileName, mediaFile)

                if (uploadError) throw uploadError

                const { data: { publicUrl } } = supabase.storage
                  .from('whatsapp-media')
                  .getPublicUrl(fileName)

                messageData[messageType] = {
                  link: publicUrl,
                  caption: caption || undefined
                }
              } else if (mediaUrl) {
                messageData[messageType] = {
                  link: mediaUrl,
                  caption: caption || undefined
                }
              }
              break

            case 'location':
              messageData.location = {
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                name: locationName || undefined,
                address: locationAddress || undefined
              }
              break

            case 'contact':
              messageData.contacts = [{
                name: {
                  formatted_name: contactName,
                  first_name: contactName.split(' ')[0]
                },
                phones: [{
                  phone: contactPhone,
                  type: 'CELL'
                }],
                emails: contactEmail ? [{
                  email: contactEmail,
                  type: 'WORK'
                }] : undefined
              }]
              break

            case 'interactive':
              if (interactiveType === 'button') {
                messageData.interactive = {
                  type: 'button',
                  header: interactiveHeader ? { type: 'text', text: interactiveHeader } : undefined,
                  body: { text: interactiveBody },
                  footer: interactiveFooter ? { text: interactiveFooter } : undefined,
                  action: {
                    buttons: buttons.filter(b => b.trim()).slice(0, 3).map((text, idx) => ({
                      type: 'reply',
                      reply: {
                        id: `btn_${idx}`,
                        title: text.substring(0, 20)
                      }
                    }))
                  }
                }
              } else {
                messageData.interactive = {
                  type: 'list',
                  header: interactiveHeader ? { type: 'text', text: interactiveHeader } : undefined,
                  body: { text: interactiveBody },
                  footer: interactiveFooter ? { text: interactiveFooter } : undefined,
                  action: {
                    button: 'View Options',
                    sections: [{
                      title: 'Options',
                      rows: listItems.filter(item => item.title.trim()).slice(0, 10).map((item, idx) => ({
                        id: `item_${idx}`,
                        title: item.title.substring(0, 24),
                        description: item.description.substring(0, 72)
                      }))
                    }]
                  }
                }
              }
              break

            case 'template':
              const template = templates.find(t => t.id === selectedTemplate)
              if (template) {
                messageData.template = {
                  name: template.name,
                  language: { code: template.language }
                }
              }
              break
          }

          const { error } = await supabase.functions.invoke('whatsapp_send', {
            body: messageData
          })

          if (error) throw error
          successCount++
        } catch (error) {
          console.error(`Failed to send to ${contactId}:`, error)
          failedCount++
        }
      }

      setSendStatus({ success: successCount, failed: failedCount })
      
      // Reset form
      if (successCount > 0) {
        setSelectedContacts([])
        setMessageText('')
        setMediaFile(null)
        setMediaPreview('')
        setMediaUrl('')
        setCaption('')
      }
    } catch (error) {
      console.error('Error sending messages:', error)
      alert('Failed to send messages')
    } finally {
      setSending(false)
    }
  }

  const toggleContact = (contactId: string) => {
    setSelectedContacts(prev =>
      prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    )
  }

  const messageTypes = [
    { id: 'text', label: 'Text', icon: MessageSquare, description: 'Send text message (max 4096 chars)' },
    { id: 'image', label: 'Image', icon: ImageIcon, description: 'JPEG, PNG (max 5MB)' },
    { id: 'video', label: 'Video', icon: Video, description: 'MP4, 3GP (max 16MB)' },
    { id: 'audio', label: 'Audio', icon: Music, description: 'AAC, MP3, OGG (max 16MB)' },
    { id: 'document', label: 'Document', icon: FileIcon, description: 'PDF, DOC, XLS (max 100MB)' },
    { id: 'location', label: 'Location', icon: MapPin, description: 'Share location' },
    { id: 'contact', label: 'Contact', icon: User, description: 'Share contact card' },
    { id: 'interactive', label: 'Interactive', icon: List, description: 'Buttons or Lists' },
    { id: 'template', label: 'Template', icon: FileText, description: 'Approved templates' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Send Message</h1>
        <p className="text-gray-600 mt-1">Send messages to your WhatsApp contacts</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Recipients */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Recipients ({selectedContacts.length})
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setSelectedContacts(contacts.map(c => c.id))}>
                    All
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedContacts([])}>
                    Clear
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {contacts.map((contact) => (
                  <div
                    key={contact.id}
                    onClick={() => toggleContact(contact.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedContacts.includes(contact.id)
                        ? 'bg-green-50 border-green-500'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        selectedContacts.includes(contact.id)
                          ? 'bg-green-500 border-green-500'
                          : 'border-gray-300'
                      }`}>
                        {selectedContacts.includes(contact.id) && (
                          <CheckCircle className="h-4 w-4 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{contact.name || contact.phone_number}</p>
                        {contact.name && (
                          <p className="text-sm text-gray-500">{contact.phone_number}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Message Composer */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Compose Message</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Message Type Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Message Type</label>
                <div className="grid grid-cols-3 gap-3">
                  {messageTypes.map((type) => {
                    const Icon = type.icon
                    return (
                      <button
                        key={type.id}
                        onClick={() => setMessageType(type.id as MessageType)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          messageType === type.id
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Icon className="h-5 w-5 mx-auto mb-1 text-gray-600" />
                        <p className="text-xs font-medium">{type.label}</p>
                      </button>
                    )
                  })}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {messageTypes.find(t => t.id === messageType)?.description}
                </p>
              </div>

              {/* Message Content based on type */}
              {messageType === 'text' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                    <textarea
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Type your message here..."
                      rows={8}
                      maxLength={4096}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <p className="text-sm text-gray-500 mt-2">{messageText.length} / 4096 characters</p>
                  </div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={previewUrl}
                      onChange={(e) => setPreviewUrl(e.target.checked)}
                      className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Preview URLs in message</span>
                  </label>
                </div>
              )}

              {['image', 'video', 'audio', 'document'].includes(messageType) && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Upload File</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      {mediaPreview ? (
                        <div className="relative">
                          {messageType === 'image' && (
                            <img src={mediaPreview} alt="Preview" className="max-h-64 mx-auto rounded-lg" />
                          )}
                          {messageType === 'video' && (
                            <video src={mediaPreview} controls className="max-h-64 mx-auto rounded-lg" />
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setMediaFile(null)
                              setMediaPreview('')
                            }}
                            className="absolute top-2 right-2 bg-white"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <label className="cursor-pointer">
                          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600 mb-2">Click to upload or drag and drop</p>
                          <p className="text-sm text-gray-500">
                            {messageTypes.find(t => t.id === messageType)?.description}
                          </p>
                          <input
                            type="file"
                            onChange={handleFileSelect}
                            accept={
                              messageType === 'image' ? 'image/*' :
                              messageType === 'video' ? 'video/*' :
                              messageType === 'audio' ? 'audio/*' :
                              '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx'
                            }
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Or Enter URL</label>
                    <input
                      type="url"
                      value={mediaUrl}
                      onChange={(e) => setMediaUrl(e.target.value)}
                      placeholder="https://example.com/file.jpg"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  {(messageType === 'image' || messageType === 'video' || messageType === 'document') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Caption (Optional, max {messageType === 'document' ? '1024' : '1024'} chars)
                      </label>
                      <textarea
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        placeholder="Add a caption..."
                        rows={3}
                        maxLength={1024}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  )}
                </div>
              )}

              {messageType === 'location' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Latitude *</label>
                      <input
                        type="number"
                        step="any"
                        value={latitude}
                        onChange={(e) => setLatitude(e.target.value)}
                        placeholder="37.7749"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Longitude *</label>
                      <input
                        type="number"
                        step="any"
                        value={longitude}
                        onChange={(e) => setLongitude(e.target.value)}
                        placeholder="-122.4194"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location Name (Optional)</label>
                    <input
                      type="text"
                      value={locationName}
                      onChange={(e) => setLocationName(e.target.value)}
                      placeholder="San Francisco"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Address (Optional)</label>
                    <input
                      type="text"
                      value={locationAddress}
                      onChange={(e) => setLocationAddress(e.target.value)}
                      placeholder="123 Main St, San Francisco, CA"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
              )}

              {messageType === 'contact' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contact Name *</label>
                    <input
                      type="text"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                    <input
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+1234567890"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email (Optional)</label>
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="john@example.com"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
              )}

              {messageType === 'interactive' && (
                <div className="space-y-4">
                  <div className="flex gap-4 mb-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={interactiveType === 'button'}
                        onChange={() => setInteractiveType('button')}
                        className="w-4 h-4 text-green-600"
                      />
                      <span className="text-sm font-medium">Reply Buttons (max 3)</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={interactiveType === 'list'}
                        onChange={() => setInteractiveType('list')}
                        className="w-4 h-4 text-green-600"
                      />
                      <span className="text-sm font-medium">List Message (max 10)</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Header (Optional)</label>
                    <input
                      type="text"
                      value={interactiveHeader}
                      onChange={(e) => setInteractiveHeader(e.target.value)}
                      placeholder="Header text"
                      maxLength={60}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Body *</label>
                    <textarea
                      value={interactiveBody}
                      onChange={(e) => setInteractiveBody(e.target.value)}
                      placeholder="Message body"
                      rows={4}
                      maxLength={1024}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Footer (Optional)</label>
                    <input
                      type="text"
                      value={interactiveFooter}
                      onChange={(e) => setInteractiveFooter(e.target.value)}
                      placeholder="Footer text"
                      maxLength={60}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  {interactiveType === 'button' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Buttons (max 3)</label>
                      {buttons.map((btn, idx) => (
                        <div key={idx} className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={btn}
                            onChange={(e) => {
                              const newButtons = [...buttons]
                              newButtons[idx] = e.target.value
                              setButtons(newButtons)
                            }}
                            placeholder={`Button ${idx + 1}`}
                            maxLength={20}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                          {idx > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setButtons(buttons.filter((_, i) => i !== idx))}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      {buttons.length < 3 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setButtons([...buttons, ''])}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Button
                        </Button>
                      )}
                    </div>
                  )}

                  {interactiveType === 'list' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">List Items (max 10)</label>
                      {listItems.map((item, idx) => (
                        <div key={idx} className="mb-3 p-3 bg-gray-50 rounded-lg">
                          <input
                            type="text"
                            value={item.title}
                            onChange={(e) => {
                              const newItems = [...listItems]
                              newItems[idx].title = e.target.value
                              setListItems(newItems)
                            }}
                            placeholder="Title (max 24 chars)"
                            maxLength={24}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 mb-2"
                          />
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => {
                              const newItems = [...listItems]
                              newItems[idx].description = e.target.value
                              setListItems(newItems)
                            }}
                            placeholder="Description (max 72 chars)"
                            maxLength={72}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                          {idx > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setListItems(listItems.filter((_, i) => i !== idx))}
                              className="mt-2"
                            >
                              <X className="h-4 w-4 mr-2" />
                              Remove
                            </Button>
                          )}
                        </div>
                      ))}
                      {listItems.length < 10 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setListItems([...listItems, {title: '', description: ''}])}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Item
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {messageType === 'template' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Template</label>
                  <select
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Choose a template...</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name} ({template.category})
                      </option>
                    ))}
                  </select>

                  {selectedTemplate && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                      <div className="space-y-2">
                        {templates.find(t => t.id === selectedTemplate)?.components?.body && (
                          <p className="text-gray-900">
                            {templates.find(t => t.id === selectedTemplate)?.components.body.text}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Send Status */}
              {sendStatus && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800">
                    <strong>Sent successfully:</strong> {sendStatus.success} messages
                  </p>
                  {sendStatus.failed > 0 && (
                    <p className="text-red-800 mt-1">
                      <strong>Failed:</strong> {sendStatus.failed} messages
                    </p>
                  )}
                </div>
              )}

              {/* Send Button */}
              <Button
                onClick={handleSendMessage}
                disabled={sending || selectedContacts.length === 0}
                className="w-full bg-green-600 hover:bg-green-700 py-6 text-lg"
              >
                {sending ? (
                  <>Sending...</>
                ) : (
                  <>
                    <Send className="h-5 w-5 mr-2" />
                    Send to {selectedContacts.length} {selectedContacts.length === 1 ? 'Contact' : 'Contacts'}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}