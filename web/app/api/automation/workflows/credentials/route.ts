import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: org } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()
    if (!org) return NextResponse.json({ items: [] })

    // Store simple header presets in automation_credentials table
    const { data } = await supabase
      .from('automation_credentials')
      .select('id, credential_name, credential_data')
      .eq('organization_id', org.organization_id)
      .eq('credential_type', 'http_headers')
      .order('created_at', { ascending: false })
    
    // Transform to match frontend expectations
    const items = (data || []).map(item => ({
      id: item.id,
      name: item.credential_name,
      headers: item.credential_data?.headers || []
    }))
    
    return NextResponse.json({ items })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await request.json()
    const { name, headers } = body

    const { data: org } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()
    if (!org) return NextResponse.json({ error: 'No organization' }, { status: 400 })

    const { data, error } = await supabase
      .from('automation_credentials')
      .insert({ 
        organization_id: org.organization_id, 
        credential_name: name,
        credential_type: 'http_headers',
        credential_data: { headers },
        created_by: user.id
      })
      .select('id, credential_name, credential_data')
      .single()
    if (error) throw error
    
    // Transform response to match frontend expectations
    const item = {
      id: data.id,
      name: data.credential_name,
      headers: data.credential_data?.headers || []
    }
    
    return NextResponse.json({ item })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}


