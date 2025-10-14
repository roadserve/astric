import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const N8N_API_URL = process.env.N8N_API_URL || 'http://localhost:5678/api/v1'
const N8N_API_KEY = process.env.N8N_API_KEY || ''

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const res = await fetch(`${N8N_API_URL}/executions/${id}`, { headers: { 'X-N8N-API-KEY': N8N_API_KEY }, cache: 'no-store' })
    const json = await res.json()
    return NextResponse.json(json)
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
    const { id, action } = body
    if (!id || action !== 'retry') return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

    const res = await fetch(`${N8N_API_URL}/executions/${id}/retry`, { method: 'POST', headers: { 'X-N8N-API-KEY': N8N_API_KEY } })
    const json = await res.json()
    return NextResponse.json(json)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}


