import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

const ALLOWED_ROLES = new Set(['owner', 'manager', 'accountant', 'hr', 'staff'])

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json().catch(() => ({} as any))
    const email = String(body?.email || '').trim().toLowerCase()
    const role = String(body?.role || 'staff')
    const fullName = String(body?.full_name || '').trim()
    const bodyOrgId = body?.organization_id ? String(body.organization_id) : null
    const mode = String(body?.mode || 'invite') // 'invite' | 'create_with_password'
    const tempPassword = String(body?.password || '')

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }
    if (!ALLOWED_ROLES.has(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }
    if (mode !== 'invite' && mode !== 'create_with_password') {
      return NextResponse.json({ error: 'Invalid mode' }, { status: 400 })
    }
    if (mode === 'create_with_password') {
      if (!tempPassword || tempPassword.length < 8) {
        return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
      }
    }

    // Check permissions + derive org
    const { data: systemAdmin } = await supabase
      .from('system_admins')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle()

    const { data: orgMembers, error: orgMembersErr } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
    if (orgMembersErr) throw orgMembersErr

    const memberships = Array.isArray(orgMembers) ? orgMembers : []
    const membershipByOrg = new Map<string, any>(memberships.map((m: any) => [String(m.organization_id), m]))

    let orgId: string | null = bodyOrgId
    if (!orgId) {
      if (memberships.length === 1) orgId = String(memberships[0].organization_id)
      else if (memberships.length > 1) {
        return NextResponse.json(
          { error: 'Multiple organizations found. Please select an organization.' },
          { status: 400 }
        )
      }
    }
    if (!orgId) return NextResponse.json({ error: 'Organization not found for inviter' }, { status: 400 })

    if (!systemAdmin) {
      const mem = membershipByOrg.get(String(orgId)) || null
      if (!mem || (mem.role !== 'owner' && mem.role !== 'manager')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        {
          error:
            'Server not configured (missing Supabase env). ' +
            `SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? 'ok' : 'missing'}, ` +
            `SUPABASE_SERVICE_ROLE_KEY: ${serviceRoleKey ? 'ok' : 'missing'}`,
        },
        { status: 500 }
      )
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    // Try to find an existing profile first (fast path)
    let targetUserId: string | null = null
    const { data: existingProfile } = await admin
      .from('profiles')
      .select('id,email')
      .eq('email', email)
      .maybeSingle()

    if (existingProfile?.id) targetUserId = existingProfile.id

    let invited = false
    let createdWithPassword = false

    if (mode === 'create_with_password') {
      if (targetUserId) {
        return NextResponse.json(
          { error: 'User already exists. Use invite or ask user to reset password.' },
          { status: 409 }
        )
      }

      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: fullName || email,
          must_change_password: true,
          invited_by: user.id,
          organization_id: orgId,
        },
      })
      if (createErr) return NextResponse.json({ error: createErr.message || 'Create user failed' }, { status: 400 })
      targetUserId = created?.user?.id ?? null
      createdWithPassword = true
    } else {
      // Invite mode: if no profile, invite the user (creates auth.user)
      if (!targetUserId) {
        const { data: inviteData, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email, {
          data: { invited_by: user.id, organization_id: orgId, must_change_password: true, full_name: fullName || email },
        })

        if (inviteErr) {
          // If already registered, try to resolve auth user id via listUsers
          const msg = inviteErr.message || 'Invite failed'
          const { data: listData, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 })
          if (listErr) return NextResponse.json({ error: msg }, { status: 400 })

          const found = (listData?.users || []).find((u: any) => String(u?.email || '').toLowerCase() === email)
          if (!found?.id) return NextResponse.json({ error: msg }, { status: 400 })

          targetUserId = found.id
        } else {
          targetUserId = inviteData?.user?.id ?? null
          invited = true
        }
      }
    }

    if (!targetUserId) return NextResponse.json({ error: 'Failed to resolve user id' }, { status: 500 })

    // Ensure a profiles row exists (Admin UI uses profiles!inner join).
    const { data: profileById } = await admin
      .from('profiles')
      .select('id')
      .eq('id', targetUserId)
      .maybeSingle()

    if (!profileById?.id) {
      const { error: profileInsertErr } = await admin.from('profiles').insert({
        id: targetUserId,
        email,
        full_name: fullName || email,
        avatar_url: null,
      })
      if (profileInsertErr) throw profileInsertErr
    }

    // Add to org (idempotent)
    const { error: memberErr } = await admin
      .from('organization_members')
      .upsert(
        { organization_id: orgId, user_id: targetUserId, role, is_active: true },
        { onConflict: 'organization_id,user_id' }
      )
    if (memberErr) throw memberErr

    return NextResponse.json({
      ok: true,
      invited,
      created_with_password: createdWithPassword,
      user_id: targetUserId,
      email,
      organization_id: orgId,
      role,
    })
  } catch (error: any) {
    console.error('Error inviting user:', error)
    return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 })
  }
}

