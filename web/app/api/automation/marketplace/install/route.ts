import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// POST - Install a marketplace workflow
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { marketplaceWorkflowId, customName } = body

    if (!marketplaceWorkflowId) {
      return NextResponse.json({ error: 'Marketplace workflow ID required' }, { status: 400 })
    }

    // Get user's organization
    const { data: orgMember } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (!orgMember) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    // Check subscription limits
    const { data: subscription } = await supabase
      .from('automation_subscriptions')
      .select('max_workflows')
      .eq('organization_id', orgMember.organization_id)
      .single()

    const { count } = await supabase
      .from('automation_workflows')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgMember.organization_id)

    if (count && subscription && count >= subscription.max_workflows) {
      return NextResponse.json(
        { error: 'Workflow limit reached. Please upgrade your plan.' },
        { status: 403 }
      )
    }

    // Get marketplace workflow
    const { data: marketplaceWorkflow, error: fetchError } = await supabase
      .from('automation_marketplace_workflows')
      .select('*')
      .eq('id', marketplaceWorkflowId)
      .single()

    if (fetchError || !marketplaceWorkflow) {
      return NextResponse.json({ error: 'Marketplace workflow not found' }, { status: 404 })
    }

    // Check if user needs to pay (for paid workflows)
    if (marketplaceWorkflow.price && marketplaceWorkflow.price > 0) {
      // TODO: Integrate payment gateway
      // For now, we'll just check if they have a valid subscription
      return NextResponse.json(
        { error: 'Payment integration not yet implemented' },
        { status: 501 }
      )
    }

    // Create new workflow from template
    const workflowName = customName || `${marketplaceWorkflow.name} (Copy)`
    
    const { data: newWorkflow, error: createError } = await supabase
      .from('automation_workflows')
      .insert({
        organization_id: orgMember.organization_id,
        user_id: user.id,
        workflow_name: workflowName,
        description: marketplaceWorkflow.description,
        workflow_data: marketplaceWorkflow.workflow_template,
        is_active: false
      })
      .select()
      .single()

    if (createError) throw createError

    // Create nodes from template
    const nodes = marketplaceWorkflow.workflow_template?.nodes || []
    if (nodes.length > 0) {
      const nodeInserts = nodes.map((node: any, index: number) => ({
        workflow_id: newWorkflow.id,
        node_id: node.id || `node_${index}`,
        node_type: node.type || 'manual',
        node_name: node.name || `Node ${index + 1}`,
        parameters: node.parameters || {},
        position_x: node.position?.[0] || 300 + index * 50,
        position_y: node.position?.[1] || 200 + index * 120
      }))

      await supabase
        .from('automation_workflow_nodes')
        .insert(nodeInserts)
    }

    // Increment download count
    await supabase
      .from('automation_marketplace_workflows')
      .update({ 
        downloads_count: (marketplaceWorkflow.downloads_count || 0) + 1 
      })
      .eq('id', marketplaceWorkflowId)

    return NextResponse.json({ 
      workflow: newWorkflow,
      message: 'Workflow installed successfully'
    })
  } catch (error: any) {
    console.error('Error installing marketplace workflow:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

