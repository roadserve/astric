import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Force dynamic rendering

// n8n API endpoints
const N8N_API_URL = process.env.N8N_API_URL || 'http://localhost:5678/api/v1'
const N8N_API_KEY = process.env.N8N_API_KEY || ''

// Transform our lightweight node schema from the CRM editor to n8n format
function buildN8nWorkflowFromEditor(editorNodes: any[] | undefined) {
  const nodes: any[] = []
  const connections: any = {}
  if (!editorNodes || editorNodes.length === 0) {
    return { nodes, connections }
  }

  // Map nodes
  editorNodes.forEach((n, idx) => {
    if (n.node_type === 'trigger' || n.type === 'n8n-nodes-base.manualTrigger') {
      nodes.push({
        id: `node_${idx}`,
        name: 'Manual Trigger',
        type: 'n8n-nodes-base.manualTrigger',
        typeVersion: 1,
        position: [240, 200 + idx * 120],
        parameters: {},
      })
      return
    }

    if (n.node_type === 'http_request') {
      const method = n.parameters?.method || 'GET'
      const url = n.parameters?.url || ''
      const headers: Array<{ key: string; value: string }> = n.parameters?.headers || []
      const body: string = n.parameters?.body || ''
      nodes.push({
        id: `node_${idx}`,
        name: n.node_name || 'HTTP Request',
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 4,
        position: [240, 200 + idx * 120],
        parameters: {
          url,
          options: {},
          sendQuery: false,
          queryParametersUi: { parameter: [] },
          method,
          jsonParameters: true,
          // headers
          headerParametersUi: {
            parameter: headers
              .filter(h => h?.key)
              .map(h => ({ name: h.key, value: h.value ?? '' }))
          },
          // body
          sendBody: !!body,
          bodyParametersJson: body || undefined,
        },
      })
      return
    }

    if (n.node_type === 'webhook') {
      const method = (n.parameters?.method || 'POST').toUpperCase()
      const path = n.parameters?.path || '/webhook'
      const nodeType = method === 'GET' ? 'n8n-nodes-base.webhook' : 'n8n-nodes-base.webhook'
      nodes.push({
        id: `node_${idx}`,
        name: 'Webhook',
        type: nodeType,
        typeVersion: 1,
        position: [240, 200 + idx * 120],
        parameters: {
          httpMethod: method,
          path,
        },
      })
      return
    }

    if (n.node_type === 'schedule') {
      const cron = n.parameters?.cron || '* * * * *'
      nodes.push({
        id: `node_${idx}`,
        name: 'Cron',
        type: 'n8n-nodes-base.cron',
        typeVersion: 1,
        position: [240, 200 + idx * 120],
        parameters: {
          mode: 'everyX',
          // Use cron expression – cron node supports custom mode via 'cronExpression'
          cronExpression: cron,
        },
      })
      return
    }

    // Fallback: passthrough as-is if already n8n formatted
    nodes.push(n)
  })

  // Create simple linear connections between consecutive nodes
  if (nodes.length > 1) {
    for (let i = 0; i < nodes.length - 1; i++) {
      const fromName = nodes[i].name
      const toName = nodes[i + 1].name
      connections[fromName] = connections[fromName] || { main: [] }
      connections[fromName].main[0] = connections[fromName].main[0] || []
      connections[fromName].main[0].push({ node: toName, type: 'main', index: 0 })
    }
  }

  return { nodes, connections }
}

// GET - Fetch all workflows for the user's organization
export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const workflowId = searchParams.get('workflowId')

    // Executions proxy
    if (type === 'executions' && workflowId) {
      const { data: wf } = await supabase
        .from('automation_workflows')
        .select('n8n_workflow_id')
        .eq('id', workflowId)
        .maybeSingle()
      if (!wf?.n8n_workflow_id) return NextResponse.json({ executions: [] })
      const res = await fetch(`${N8N_API_URL}/executions?workflowId=${wf.n8n_workflow_id}&limit=10`, {
        headers: { 'X-N8N-API-KEY': N8N_API_KEY },
        cache: 'no-store',
      })
      const json = await res.json()
      return NextResponse.json(json)
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

    // Fetch workflows from database
    const { data: workflows, error } = await supabase
      .from('automation_workflows')
      .select('*')
      .eq('organization_id', orgMember.organization_id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ workflows })
  } catch (error: any) {
    console.error('Error fetching workflows:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Create a new workflow
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, name, description, workflowData, editorNodes } = body

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

    // Upsert workflow in n8n: if an existing CRM workflow has an n8n id, update instead of creating
    let n8nWorkflowId: string | null = null
    if (id) {
      const { data: current } = await supabase
        .from('automation_workflows')
        .select('n8n_workflow_id')
        .eq('id', id)
        .maybeSingle()
      if (current?.n8n_workflow_id) {
        n8nWorkflowId = current.n8n_workflow_id
      }
    }
    try {
      // Prefer editorNodes if provided, otherwise use raw workflowData
      const editorBuild = buildN8nWorkflowFromEditor(editorNodes)
      const wfNodes = editorBuild.nodes.length > 0
        ? editorBuild.nodes
        : (workflowData?.nodes || [])
      const wfConnections = editorBuild.nodes.length > 0
        ? editorBuild.connections
        : (workflowData?.connections || {})
      if (n8nWorkflowId) {
        // Update existing
        await fetch(`${N8N_API_URL}/workflows/${n8nWorkflowId}`, {
          method: 'PUT',
          headers: {
            'X-N8N-API-KEY': N8N_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: name,
            nodes: wfNodes,
            connections: wfConnections,
          }),
        })
      } else {
        // Create new
        const n8nResponse = await fetch(`${N8N_API_URL}/workflows`, {
          method: 'POST',
          headers: {
            'X-N8N-API-KEY': N8N_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: name,
            nodes: wfNodes,
            connections: wfConnections,
            settings: {
              executionOrder: 'v1',
            },
          }),
        })
        if (n8nResponse.ok) {
          const n8nWorkflow = await n8nResponse.json()
          n8nWorkflowId = n8nWorkflow.id
        }
      }
    } catch (n8nError) {
      console.error('n8n API error:', n8nError)
      // Continue without n8n integration if API is not available
    }

    // Save workflow to database (upsert by provided id when available)
    let workflow
    let error
    if (id) {
      const up = await supabase
        .from('automation_workflows')
        .update({
          organization_id: orgMember.organization_id,
          user_id: user.id,
          workflow_name: name,
          description: description || '',
          n8n_workflow_id: n8nWorkflowId,
          workflow_data: workflowData || {},
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()
      workflow = up.data
      error = up.error
    } else {
      const ins = await supabase
        .from('automation_workflows')
        .insert({
          organization_id: orgMember.organization_id,
          user_id: user.id,
          workflow_name: name,
          description: description || '',
          n8n_workflow_id: n8nWorkflowId,
          workflow_data: workflowData || {},
          is_active: false,
        })
        .select()
        .single()
      workflow = ins.data
      error = ins.error
    }

    if (error) throw error

    return NextResponse.json({ workflow })
  } catch (error: any) {
    console.error('Error creating workflow:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT - Update workflow
export async function PUT(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, name, description, workflowData, is_active, editorNodes, activate } = body

    // Verify workflow belongs to user's organization
    const { data: workflow } = await supabase
      .from('automation_workflows')
      .select('*, organization_members!inner(user_id)')
      .eq('id', id)
      .eq('organization_members.user_id', user.id)
      .single()

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    // Update in n8n. If workflow hasn't been created yet, create it; otherwise update.
    try {
      const editorBuild = buildN8nWorkflowFromEditor(editorNodes)
      const wfNodes = editorBuild.nodes.length > 0
        ? editorBuild.nodes
        : (workflowData?.nodes || [])
      const wfConnections = editorBuild.nodes.length > 0
        ? editorBuild.connections
        : (workflowData?.connections || {})

      let n8nId = workflow.n8n_workflow_id as string | null
      let ok = false

      if (n8nId) {
        const upRes = await fetch(`${N8N_API_URL}/workflows/${n8nId}`, {
          method: 'PUT',
          headers: {
            'X-N8N-API-KEY': N8N_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: name || workflow.workflow_name,
            nodes: wfNodes,
            connections: wfConnections,
          }),
        })
        ok = upRes.ok
      } else {
        const createRes = await fetch(`${N8N_API_URL}/workflows`, {
          method: 'POST',
          headers: {
            'X-N8N-API-KEY': N8N_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: name || workflow.workflow_name,
            nodes: wfNodes,
            connections: wfConnections,
            settings: { executionOrder: 'v1' },
          }),
        })
        if (createRes.ok) {
          const created = await createRes.json()
          await supabase
            .from('automation_workflows')
            .update({ n8n_workflow_id: created.id })
            .eq('id', id)
          n8nId = created.id
          ok = true
        }
      }

      // Activation toggle if requested
      if (typeof activate === 'boolean' && n8nId) {
        const endpoint = activate ? 'activate' : 'deactivate'
        const resp = await fetch(`${N8N_API_URL}/workflows/${n8nId}/${endpoint}`, {
          method: 'POST',
          headers: { 'X-N8N-API-KEY': N8N_API_KEY },
        })
        if (resp.ok) {
          await supabase
            .from('automation_workflows')
            .update({ is_active: activate, updated_at: new Date().toISOString() })
            .eq('id', id)
        }
      }
    } catch (n8nError) {
      console.error('n8n API error:', n8nError)
    }

    // Update in database
    const { data: updatedWorkflow, error } = await supabase
      .from('automation_workflows')
      .update({
        workflow_name: name || workflow.workflow_name,
        description: description || workflow.description,
        workflow_data: workflowData || workflow.workflow_data,
        is_active: is_active !== undefined ? is_active : workflow.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ workflow: updatedWorkflow })
  } catch (error: any) {
    console.error('Error updating workflow:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Delete workflow
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

    // Verify workflow belongs to user's organization
    const { data: workflow } = await supabase
      .from('automation_workflows')
      .select('*, organization_members!inner(user_id)')
      .eq('id', id)
      .eq('organization_members.user_id', user.id)
      .single()

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    // Delete from n8n if exists
    if (workflow.n8n_workflow_id) {
      try {
        await fetch(`${N8N_API_URL}/workflows/${workflow.n8n_workflow_id}`, {
          method: 'DELETE',
          headers: {
            'X-N8N-API-KEY': N8N_API_KEY,
          },
        })
      } catch (n8nError) {
        console.error('n8n API error:', n8nError)
      }
    }

    // Delete from database
    const { error } = await supabase
      .from('automation_workflows')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting workflow:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
