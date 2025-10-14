import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET - Fetch all comments for a workflow
export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const workflowId = searchParams.get('workflowId')
    const nodeId = searchParams.get('nodeId') // Optional: filter by specific node

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

    // Fetch comments
    let query = supabase
      .from('automation_workflow_comments')
      .select(`
        id,
        comment_text,
        node_id,
        created_at,
        profiles:user_id (full_name, email, avatar_url)
      `)
      .eq('workflow_id', workflowId)
      .order('created_at', { ascending: false })

    if (nodeId) {
      query = query.eq('node_id', nodeId)
    }

    const { data: comments, error } = await query

    if (error) throw error

    return NextResponse.json({ comments })
  } catch (error: any) {
    console.error('Error fetching workflow comments:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Create a new comment
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { workflowId, commentText, nodeId } = body

    if (!workflowId || !commentText) {
      return NextResponse.json({ error: 'Workflow ID and comment text required' }, { status: 400 })
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

    // Create comment
    const { data: comment, error } = await supabase
      .from('automation_workflow_comments')
      .insert({
        workflow_id: workflowId,
        user_id: user.id,
        comment_text: commentText,
        node_id: nodeId || null
      })
      .select(`
        id,
        comment_text,
        node_id,
        created_at,
        profiles:user_id (full_name, email, avatar_url)
      `)
      .single()

    if (error) throw error

    return NextResponse.json({ comment })
  } catch (error: any) {
    console.error('Error creating workflow comment:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Delete a comment
export async function DELETE(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Comment ID required' }, { status: 400 })
    }

    // Verify user owns this comment or is an admin
    const { data: comment } = await supabase
      .from('automation_workflow_comments')
      .select('user_id, workflow_id, automation_workflows!inner(organization_id)')
      .eq('id', id)
      .single()

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    // Check if user is comment owner or organization admin
    const { data: orgMember } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .eq('organization_id', (comment as any).automation_workflows.organization_id)
      .single()

    if (!orgMember) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Only allow deletion if user owns the comment or is admin
    if (comment.user_id !== user.id && orgMember.role !== 'admin') {
      return NextResponse.json({ error: 'You can only delete your own comments' }, { status: 403 })
    }

    // Delete comment
    const { error } = await supabase
      .from('automation_workflow_comments')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting workflow comment:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

