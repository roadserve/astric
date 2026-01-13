import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables.\n' +
    'Please create .env.local in the web directory and add:\n' +
    'NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url\n' +
    'NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper functions for common operations
export const supabaseHelpers = {
  // Auth helpers
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  // Organization helpers
  async getOrganizations(userId: string) {
    const { data, error } = await supabase
      .from('organization_members')
      .select('organization:organizations(*), role, is_active')
      .eq('user_id', userId)
      .eq('is_active', true)

    if (error) throw error
    return data
  },

  async getOrganizationStats(orgId: string) {
    const { data, error } = await supabase
      .rpc('get_organization_stats', { org_id: orgId })

    if (error) throw error
    return data
  },

  // Invoice helpers
  async getInvoices(orgId: string, status?: string) {
    let query = supabase
      .from('invoices')
      .select('*, customer:customers(*), items:invoice_items(*)')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query
    if (error) throw error
    return data
  },

  async createInvoice(invoiceData: any) {
    const { data, error } = await supabase
      .from('invoices')
      .insert(invoiceData)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Customer helpers
  async getCustomers(orgId: string) {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('organization_id', orgId)
      .order('name', { ascending: true })

    if (error) throw error
    return data
  },

  async createCustomer(customerData: any) {
    const { data, error } = await supabase
      .from('customers')
      .insert(customerData)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Product helpers
  async getProducts(orgId: string) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('organization_id', orgId)
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) throw error
    return data
  },

  // Employee helpers
  async getEmployees(orgId: string) {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('organization_id', orgId)
      .eq('is_active', true)
      .order('full_name', { ascending: true })

    if (error) throw error
    return data
  },

  // WhatsApp campaign helpers
  async getCampaigns(orgId: string) {
    const { data, error } = await supabase
      .from('whatsapp_campaigns')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  async createCampaign(campaignData: any) {
    const { data, error } = await supabase
      .from('whatsapp_campaigns')
      .insert(campaignData)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // AI task helpers
  async getAITasks(orgId: string) {
    const { data, error } = await supabase
      .from('ai_tasks')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error
    return data
  },

  // Analytics helpers
  async getMonthlyRevenue(orgId: string, year: number) {
    const { data, error } = await supabase
      .rpc('get_monthly_revenue', { org_id: orgId, year_param: year })

    if (error) throw error
    return data
  },

  // Usage tracking
  async trackUsage(orgId: string, feature: string, metadata?: any) {
    const { error } = await supabase
      .rpc('track_usage', {
        org_id: orgId,
        feature_name: feature,
        usage_metadata: metadata || {}
      })

    if (error) throw error
  },
}
