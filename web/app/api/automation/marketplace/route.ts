import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'


// GET - Fetch marketplace workflows
export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const tag = searchParams.get('tag')
    const featured = searchParams.get('featured')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = supabase
      .from('automation_marketplace_workflows')
      .select(`
        id,
        name,
        description,
        category,
        tags,
        workflow_template,
        price,
        is_featured,
        is_verified,
        downloads_count,
        rating,
        created_at,
        profiles:author_id (full_name, avatar_url)
      `)
      .order('downloads_count', { ascending: false })
      .range(offset, offset + limit - 1)

    if (category) {
      query = query.eq('category', category)
    }

    if (tag) {
      query = query.contains('tags', [tag])
    }

    if (featured === 'true') {
      query = query.eq('is_featured', true)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    const { data: workflows, error, count } = await query

    if (error) throw error

    return NextResponse.json({ 
      workflows,
      total: count,
      limit,
      offset
    })
  } catch (error: any) {
    console.error('Error fetching marketplace workflows:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Publish a workflow to marketplace
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      name, 
      description, 
      category, 
      tags, 
      workflowTemplate, 
      price 
    } = body

    if (!name || !description || !workflowTemplate) {
      return NextResponse.json({ 
        error: 'Name, description, and workflow template are required' 
      }, { status: 400 })
    }

    // Create marketplace workflow
    const { data: workflow, error } = await supabase
      .from('automation_marketplace_workflows')
      .insert({
        name,
        description,
        category: category || 'general',
        tags: tags || [],
        workflow_template: workflowTemplate,
        author_id: user.id,
        price: price || 0,
        is_featured: false,
        is_verified: false
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ workflow })
  } catch (error: any) {
    console.error('Error publishing marketplace workflow:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT - Update marketplace workflow
export async function PUT(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, name, description, category, tags, price } = body

    if (!id) {
      return NextResponse.json({ error: 'Workflow ID required' }, { status: 400 })
    }

    // Verify user owns this workflow
    const { data: workflow } = await supabase
      .from('automation_marketplace_workflows')
      .select('author_id')
      .eq('id', id)
      .single()

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    if (workflow.author_id !== user.id) {
      return NextResponse.json({ error: 'You can only update your own workflows' }, { status: 403 })
    }

    // Update workflow
    const updates: any = {}
    if (name) updates.name = name
    if (description) updates.description = description
    if (category) updates.category = category
    if (tags) updates.tags = tags
    if (price !== undefined) updates.price = price

    const { data: updatedWorkflow, error } = await supabase
      .from('automation_marketplace_workflows')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ workflow: updatedWorkflow })
  } catch (error: any) {
    console.error('Error updating marketplace workflow:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Remove from marketplace
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
      return NextResponse.json({ error: 'Workflow ID required' }, { status: 400 })
    }

    // Verify user owns this workflow
    const { data: workflow } = await supabase
      .from('automation_marketplace_workflows')
      .select('author_id')
      .eq('id', id)
      .single()

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    if (workflow.author_id !== user.id) {
      return NextResponse.json({ error: 'You can only delete your own workflows' }, { status: 403 })
    }

    // Delete workflow
    const { error } = await supabase
      .from('automation_marketplace_workflows')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting marketplace workflow:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

