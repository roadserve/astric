'use client'

import { useEffect, useState, useRef } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Send, 
  Paperclip, 
  Image as ImageIcon, 
  Video, 
  File as FileIcon,
  Search,
  MoreVertical,
  Phone,
  Archive,
  CheckCheck,
  Check
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Contact {
  id: string
  phone_number: string
  name: string
  profile_name: string
  avatar_url?: string
  last_message_at: string
  whatsapp_account_id?: string
}

interface Conversation {
  id: string
  contact_id: string
  status: string
  last_message_at: string
  last_message_preview: string
  unread_count: number
  contact: Contact
}

interface Message {
  id: string
  direction: 'inbound' | 'outbound'
  type: string
  content: string
  media_url?: string
  status: string
  created_at: string
  sent_at?: string
  delivered_at?: string
  read_at?: string
}

export default function ConversationsPage() {
  const supabase = createClientComponentClient()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [messageText, setMessageText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadConversations()
    
    // Subscribe to new messages and status updates
    const channel = supabase
      .channel('whatsapp_messages')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'whatsapp_messages' },
        (payload) => {
          console.log('📨 New message received via real-time:', {
            messageId: payload.new.id,
            conversationId: payload.new.conversation_id,
            direction: payload.new.direction,
            content: payload.new.content,
            selectedConversationId: selectedConversation?.id
          })
          
          // Always refresh conversations list
          loadConversations()
          
          // If this conversation is selected, add message to UI
          if (selectedConversation && payload.new.conversation_id === selectedConversation.id) {
            console.log('✅ Adding message to selected conversation UI')
            setMessages(prev => {
              // Check if message already exists (avoid duplicates)
              const exists = prev.some(msg => msg.id === payload.new.id)
              if (exists) {
                console.log('⚠️ Message already exists, skipping')
                return prev
              }
              console.log('✅ Adding new message to UI:', payload.new.id)
              return [...prev, payload.new as Message]
            })
            scrollToBottom()
          } else {
            console.log('⚠️ Message for different conversation, not adding to UI')
            // If conversation is not selected but message is for a conversation, reload messages if conversation gets selected later
            // This will be handled by loadMessages when conversation is selected
          }
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'whatsapp_messages' },
        (payload) => {
          console.log('📨 Message status update received:', {
            messageId: payload.new.id,
            conversationId: payload.new.conversation_id,
            status: payload.new.status,
            selectedConversationId: selectedConversation?.id
          })
          
          if (selectedConversation && payload.new.conversation_id === selectedConversation.id) {
            // Update message status in real-time
            setMessages(prev => {
              const updated = prev.map(msg => 
                msg.id === payload.new.id 
                  ? { ...msg, ...payload.new as Message }
                  : msg
              )
              console.log('✅ Updated message in UI:', {
                oldStatus: prev.find(m => m.id === payload.new.id)?.status,
                newStatus: payload.new.status
              })
              return updated
            })
          } else {
            console.log('⚠️ Message update ignored - different conversation')
          }
          loadConversations() // Refresh conversation list
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedConversation])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (selectedConversation) {
      console.log('✅ Selected conversation updated:', {
        id: selectedConversation.id,
        contactName: selectedConversation.contact?.name,
        phoneNumber: selectedConversation.contact?.phone_number,
        conversationId: selectedConversation.id
      })
    } else {
      console.log('⚠️ No conversation selected')
    }
  }, [selectedConversation])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadConversations = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('whatsapp_conversations')
        .select(`
          *,
          contact:whatsapp_contacts(*)
        `)
        .eq('status', 'active')
        .order('last_message_at', { ascending: false })

      if (error) throw error
      
      // Ensure whatsapp_account_id is available in conversation data
      const conversationsWithAccount = (data || []).map(conv => ({
        ...conv,
        contact: {
          ...conv.contact,
          whatsapp_account_id: conv.whatsapp_account_id || conv.contact?.whatsapp_account_id
        }
      }))
      
      setConversations(conversationsWithAccount)
    } catch (error) {
      console.error('Error loading conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (conversationId: string) => {
    try {
      console.log('📥 Loading messages for conversation:', conversationId)
      const { data, error } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('❌ Error loading messages:', error)
        throw error
      }
      
      console.log('✅ Loaded messages:', {
        count: data?.length || 0,
        conversationId,
        messages: data?.map(m => ({ id: m.id, content: m.content, direction: m.direction }))
      })
      
      setMessages(data || [])

      // Mark messages as read
      await supabase
        .from('whatsapp_conversations')
        .update({ unread_count: 0 })
        .eq('id', conversationId)
    } catch (error) {
      console.error('❌ Error loading messages:', error)
    }
  }

  const handleSelectConversation = (conversation: Conversation) => {
    console.log('🔄 Selecting conversation:', {
      id: conversation.id,
      contactName: conversation.contact.name,
      phoneNumber: conversation.contact.phone_number,
      conversationId: conversation.id
    })
    setSelectedConversation(conversation)
    loadMessages(conversation.id)
  }

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversation || sending) return

    setSending(true)
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

      // Get WhatsApp account ID from conversation or fetch it
      let whatsappAccountId = (selectedConversation as any).whatsapp_account_id || (selectedConversation.contact as any)?.whatsapp_account_id

      // If still not found, fetch from database
      if (!whatsappAccountId) {
        const { data: account } = await supabase
          .from('whatsapp_accounts')
          .select('id')
          .eq('organization_id', orgMember?.organization_id)
          .eq('status', 'active')
          .maybeSingle()
        
        whatsappAccountId = account?.id
      }

      if (!whatsappAccountId) {
        throw new Error('WhatsApp account not found. Please configure credentials in Settings.')
      }

      const newMessage = {
        organization_id: orgMember?.organization_id,
        conversation_id: selectedConversation.id,
        whatsapp_account_id: whatsappAccountId,
        contact_id: selectedConversation.contact_id,
        direction: 'outbound',
        type: 'text',
        content: messageText,
        status: 'pending',
        created_by: profile?.id
      }

      const { data, error } = await supabase
        .from('whatsapp_messages')
        .insert(newMessage)
        .select()
        .single()

      if (error) throw error

      // Call Edge Function to send via WhatsApp API
      const { data: sendResult, error: sendError } = await supabase.functions.invoke('whatsapp_send', {
        body: {
          phone_number: selectedConversation.contact.phone_number,
          type: 'text',
          text: {
            body: messageText,
            preview_url: true
          }
        }
      })

      if (sendError) {
        console.error('Error sending via WhatsApp API:', sendError)
        // Update message status to failed
        await supabase
          .from('whatsapp_messages')
          .update({ 
            status: 'failed', 
            error_message: sendError.message,
            failed_at: new Date().toISOString()
          })
          .eq('id', data.id)
        
        // Update local state
        setMessages(prev => prev.map(msg => 
          msg.id === data.id 
            ? { ...msg, status: 'failed', error_message: sendError.message }
            : msg
        ))
        throw sendError
      }

      // Update message with WhatsApp message ID and status
      // Edge Function already saves the message, so we just need to update local state
      if (sendResult?.message_id) {
        // Reload message to get updated data from database
        const { data: updatedMessage } = await supabase
          .from('whatsapp_messages')
          .select('*')
          .eq('id', data.id)
          .single()
        
        if (updatedMessage) {
          setMessages(prev => prev.map(msg => 
            msg.id === data.id 
              ? { ...msg, ...updatedMessage }
              : msg
          ))
        } else {
          // Fallback: update local state with what we know
          setMessages(prev => prev.map(msg => 
            msg.id === data.id 
              ? { ...msg, status: 'sent', message_id: sendResult.message_id, sent_at: new Date().toISOString() }
              : msg
          ))
        }
      } else {
        // If no message_id returned, still mark as sent
        setMessages(prev => prev.map(msg => 
          msg.id === data.id 
            ? { ...msg, status: 'sent', sent_at: new Date().toISOString() }
            : msg
        ))
      }

      setMessageText('')
    } catch (error: any) {
      console.error('Error sending message:', error)
      alert('Failed to send message: ' + (error.message || 'Unknown error'))
    } finally {
      setSending(false)
    }
  }

  const filteredConversations = conversations.filter(conv =>
    conv.contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.contact.phone_number.includes(searchQuery) ||
    conv.last_message_preview?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getMessageStatusIcon = (message: Message) => {
    if (message.direction === 'inbound') return null
    
    // Check if message has been read (blue checkmarks)
    if (message.read_at) {
      return <CheckCheck className="h-3 w-3 text-blue-500" />
    }
    
    // Check if message has been delivered (gray double checkmarks)
    if (message.delivered_at) {
      return <CheckCheck className="h-3 w-3 text-gray-400" />
    }
    
    // Check status field
    switch (message.status) {
      case 'sent':
        return <Check className="h-3 w-3 text-gray-400" />
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-gray-400" />
      case 'read':
        return <CheckCheck className="h-3 w-3 text-blue-500" />
      case 'failed':
        return <span className="text-xs text-red-500">✗</span>
      case 'pending':
        return <span className="h-3 w-3 rounded-full border-2 border-gray-300 animate-spin" />
      default:
        return <Check className="h-3 w-3 text-gray-400" />
    }
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 flex overflow-hidden">
        {/* Conversations Sidebar */}
        <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-bold mb-3">Chats</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Loading...</div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No conversations</div>
            ) : (
              filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => handleSelectConversation(conversation)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedConversation?.id === conversation.id ? 'bg-green-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {conversation.contact.avatar_url ? (
                        <img
                          src={conversation.contact.avatar_url}
                          alt={conversation.contact.name}
                          className="w-12 h-12 rounded-full"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white font-semibold">
                          {conversation.contact.name?.[0]?.toUpperCase() || '?'}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {conversation.contact.name || conversation.contact.phone_number}
                        </h3>
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 truncate">
                          {conversation.last_message_preview}
                        </p>
                        {conversation.unread_count > 0 && (
                          <span className="ml-2 px-2 py-0.5 bg-green-500 text-white text-xs rounded-full">
                            {conversation.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-[#efeae2]">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {selectedConversation.contact.avatar_url ? (
                    <img
                      src={selectedConversation.contact.avatar_url}
                      alt={selectedConversation.contact.name}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-semibold">
                      {selectedConversation.contact.name?.[0]?.toUpperCase() || '?'}
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {selectedConversation.contact.name || selectedConversation.contact.phone_number}
                    </h3>
                    <p className="text-sm text-gray-500">{selectedConversation.contact.phone_number}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Archive className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-md px-4 py-2 rounded-lg ${
                        message.direction === 'outbound'
                          ? 'bg-[#d9fdd3]'
                          : 'bg-white'
                      }`}
                    >
                      {message.type === 'text' && (
                        <p className="text-gray-900 whitespace-pre-wrap">{message.content}</p>
                      )}
                      {message.type === 'image' && message.media_url && (
                        <img src={message.media_url} alt="Image" className="rounded-lg max-w-xs" />
                      )}
                      {message.type === 'video' && message.media_url && (
                        <video src={message.media_url} controls className="rounded-lg max-w-xs" />
                      )}
                      <div className="flex items-center justify-end gap-1 mt-1">
                        <span className="text-xs text-gray-500">
                          {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {getMessageStatusIcon(message)}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="bg-white border-t border-gray-200 p-4">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Paperclip className="h-5 w-5 text-gray-500" />
                  </Button>
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500"
                    disabled={sending}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!messageText.trim() || sending}
                    className="bg-green-600 hover:bg-green-700 rounded-full p-2"
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-32 h-32 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-16 h-16 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">WhatsApp Business</h3>
                <p className="text-gray-600">Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
