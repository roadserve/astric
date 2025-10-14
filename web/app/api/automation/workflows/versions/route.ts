import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET - Fetch all versions of a workflow
export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const workflowId = searchParams.get('workflowId')

    if (!workflowId) {
      return NextResponse.json({ error: 'Workflow ID required' }, { status: 400 })
    }

    // Verify user has access to this workflow
    const { data: workflow } = await supabase
      .from('automation_workflows')
      .select('organization_id')
      .eq('id', workflowId)
      .single()

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    // Check organization membership
    const { data: orgMember } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('organization_id', workflow.organization_id)
      .single()

    if (!orgMember) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Fetch all versions
    const { data: versions, error } = await supabase
      .from('automation_workflow_versions')
      .select(`
        id,
        version_number,
        workflow_data,
        changelog,
        is_published,
        created_at,
        created_by,
        profiles:created_by (full_name, email)
      `)
      .eq('workflow_id', workflowId)
      .order('version_number', { ascending: false })

    if (error) throw error

    return NextResponse.json({ versions })
  } catch (error: any) {
    console.error('Error fetching workflow versions:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Create a new version manually (or restore from a previous version)
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { workflowId, changelog, versionToRestore } = body

    if (!workflowId) {
      return NextResponse.json({ error: 'Workflow ID required' }, { status: 400 })
    }

    // Verify user has access to this workflow
    const { data: workflow } = await supabase
      .from('automation_workflows')
      .select('organization_id, workflow_data')
      .eq('id', workflowId)
      .single()

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    // Check organization membership
    const { data: orgMember } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('organization_id', workflow.organization_id)
      .single()

    if (!orgMember) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // If restoring from a previous version
    if (versionToRestore) {
      const { data: versionData } = await supabase
        .from('automation_workflow_versions')
        .select('workflow_data')
        .eq('id', versionToRestore)
        .eq('workflow_id', workflowId)
        .single()

      if (!versionData) {
        return NextResponse.json({ error: 'Version not found' }, { status: 404 })
      }

      // Update workflow with restored data
      const { error: updateError } = await supabase
        .from('automation_workflows')
        .update({ 
          workflow_data: versionData.workflow_data,
          updated_at: new Date().toISOString()
        })
        .eq('id', workflowId)

      if (updateError) throw updateError

      return NextResponse.json({ 
        message: 'Workflow restored successfully',
        restored: true 
      })
    }

    // Get next version number
    const { data: lastVersion } = await supabase
      .from('automation_workflow_versions')
      .select('version_number')
      .eq('workflow_id', workflowId)
      .order('version_number', { ascending: false })
      .limit(1)
      .single()

    const nextVersion = (lastVersion?.version_number || 0) + 1

    // Create new version
    const { data: newVersion, error } = await supabase
      .from('automation_workflow_versions')
      .insert({
        workflow_id: workflowId,
        version_number: nextVersion,
        workflow_data: workflow.workflow_data,
        changelog: changelog || 'Manual version save',
        created_by: user.id,
        is_published: true
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ version: newVersion })
  } catch (error: any) {
    console.error('Error creating workflow version:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

