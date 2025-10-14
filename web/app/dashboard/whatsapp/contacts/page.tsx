'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Plus, 
  Users, 
  Search,
  Edit,
  Trash2,
  MessageSquare,
  Tag,
  Upload,
  Download,
  Filter,
  MoreVertical,
  Ban,
  UserCheck
} from 'lucide-react'

interface Contact {
  id: string
  phone_number: string
  name: string
  profile_name?: string
  avatar_url?: string
  tags: string[]
  notes?: string
  is_blocked: boolean
  last_message_at?: string
  created_at: string
}

export default function ContactsPage() {
  const supabase = createClientComponentClient()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    phone_number: '',
    name: '',
    tags: [] as string[],
    notes: ''
  })

  useEffect(() => {
    loadContacts()
  }, [])

  useEffect(() => {
    filterContacts()
  }, [contacts, searchQuery, selectedTag])

  const loadContacts = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('whatsapp_contacts')
        .select('*')
        .order('name')

      if (error) throw error
      setContacts(data || [])
    } catch (error) {
      console.error('Error loading contacts:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterContacts = () => {
    let filtered = contacts

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(contact =>
        contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.phone_number.includes(searchQuery) ||
        contact.notes?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Tag filter
    if (selectedTag !== 'all') {
      filtered = filtered.filter(contact =>
        contact.tags?.includes(selectedTag)
      )
    }

    setFilteredContacts(filtered)
  }

  const handleSaveContact = async () => {
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

      if (editingContact) {
        // Update existing contact
        const { error } = await supabase
          .from('whatsapp_contacts')
          .update({
            name: formData.name,
            tags: formData.tags,
            notes: formData.notes
          })
          .eq('id', editingContact.id)

        if (error) throw error
      } else {
        // Create new contact
        const { error } = await supabase
          .from('whatsapp_contacts')
          .insert({
            organization_id: orgMember?.organization_id,
            phone_number: formData.phone_number,
            name: formData.name,
            tags: formData.tags,
            notes: formData.notes
          })

        if (error) throw error
      }

      // Reset form and reload
      setFormData({ phone_number: '', name: '', tags: [], notes: '' })
      setEditingContact(null)
      setShowAddModal(false)
      loadContacts()
    } catch (error) {
      console.error('Error saving contact:', error)
      alert('Failed to save contact')
    }
  }

  const handleDeleteContact = async (contactId: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) return

    try {
      const { error } = await supabase
        .from('whatsapp_contacts')
        .delete()
        .eq('id', contactId)

      if (error) throw error
      loadContacts()
    } catch (error) {
      console.error('Error deleting contact:', error)
      alert('Failed to delete contact')
    }
  }

  const handleBlockContact = async (contactId: string, block: boolean) => {
    try {
      const { error } = await supabase
        .from('whatsapp_contacts')
        .update({ is_blocked: block })
        .eq('id', contactId)

      if (error) throw error
      loadContacts()
    } catch (error) {
      console.error('Error updating contact:', error)
      alert('Failed to update contact')
    }
  }

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact)
    setFormData({
      phone_number: contact.phone_number,
      name: contact.name,
      tags: contact.tags || [],
      notes: contact.notes || ''
    })
    setShowAddModal(true)
  }

  const exportContacts = () => {
    const csv = [
      ['Name', 'Phone Number', 'Tags', 'Notes'],
      ...contacts.map(c => [
        c.name,
        c.phone_number,
        c.tags?.join(', ') || '',
        c.notes || ''
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `whatsapp-contacts-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  // Get all unique tags
  const allTags = Array.from(new Set(contacts.flatMap(c => c.tags || [])))

  const stats = {
    total: contacts.length,
    blocked: contacts.filter(c => c.is_blocked).length,
    active: contacts.filter(c => !c.is_blocked).length
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contacts</h1>
          <p className="text-gray-600 mt-1">Manage your WhatsApp contacts</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={exportContacts}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button 
            onClick={() => {
              setEditingContact(null)
              setFormData({ phone_number: '', name: '', tags: [], notes: '' })
              setShowAddModal(true)
            }}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Contact
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked</CardTitle>
            <Ban className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.blocked}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Tag Filter */}
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Tags</option>
              {allTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Contacts List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading contacts...</div>
          ) : filteredContacts.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No contacts found</h3>
              <p className="text-gray-600 mb-4">Add your first contact to get started</p>
              <Button onClick={() => setShowAddModal(true)} className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Contact
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredContacts.map((contact) => (
                <div key={contact.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      {/* Avatar */}
                      {contact.avatar_url ? (
                        <img
                          src={contact.avatar_url}
                          alt={contact.name}
                          className="w-12 h-12 rounded-full"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white font-semibold text-lg">
                          {contact.name?.[0]?.toUpperCase() || '?'}
                        </div>
                      )}

                      {/* Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{contact.name || 'Unnamed'}</h3>
                          {contact.is_blocked && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded-full">
                              Blocked
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{contact.phone_number}</p>
                        {contact.tags && contact.tags.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {contact.tags.map(tag => (
                              <span key={tag} className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        {contact.notes && (
                          <p className="text-sm text-gray-500 mt-1">{contact.notes}</p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEditContact(contact)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      {contact.is_blocked ? (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleBlockContact(contact.id, false)}
                          className="text-green-600"
                        >
                          <UserCheck className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleBlockContact(contact.id, true)}
                          className="text-red-600"
                        >
                          <Ban className="h-4 w-4" />
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteContact(contact.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>{editingContact ? 'Edit Contact' : 'Add Contact'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  placeholder="+1234567890"
                  disabled={!!editingContact}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contact name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={formData.tags.join(', ')}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                  placeholder="customer, vip, leads"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setShowAddModal(false)
                    setEditingContact(null)
                    setFormData({ phone_number: '', name: '', tags: [], notes: '' })
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveContact}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {editingContact ? 'Update' : 'Add'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
