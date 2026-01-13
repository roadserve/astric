import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'


// GET - Fetch all variables for a workflow
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

    // Fetch all variables
    const { data: variables, error } = await supabase
      .from('automation_workflow_variables')
      .select('*')
      .eq('workflow_id', workflowId)
      .order('variable_name', { ascending: true })

    if (error) throw error

    // Don't return secret values in plain text
    const sanitizedVariables = variables.map(v => ({
      ...v,
      variable_value: v.is_secret ? '********' : v.variable_value
    }))

    return NextResponse.json({ variables: sanitizedVariables })
  } catch (error: any) {
    console.error('Error fetching workflow variables:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Create a new variable
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { workflowId, variableName, variableValue, variableType, isSecret } = body

    if (!workflowId || !variableName) {
      return NextResponse.json({ error: 'Workflow ID and variable name required' }, { status: 400 })
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

    // Create variable
    const { data: variable, error } = await supabase
      .from('automation_workflow_variables')
      .insert({
        workflow_id: workflowId,
        variable_name: variableName,
        variable_value: variableValue,
        variable_type: variableType || 'string',
        is_secret: isSecret || false
      })
      .select()
      .single()

    if (error) throw error

    // Sanitize secret value before returning
    if (variable.is_secret) {
      variable.variable_value = '********'
    }

    return NextResponse.json({ variable })
  } catch (error: any) {
    console.error('Error creating workflow variable:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT - Update a variable
export async function PUT(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, variableValue, variableType, isSecret } = body

    if (!id) {
      return NextResponse.json({ error: 'Variable ID required' }, { status: 400 })
    }

    // Verify user has access to this variable's workflow
    const { data: variable } = await supabase
      .from('automation_workflow_variables')
      .select('workflow_id, automation_workflows!inner(organization_id)')
      .eq('id', id)
      .single()

    if (!variable) {
      return NextResponse.json({ error: 'Variable not found' }, { status: 404 })
    }

    // Check organization membership
    const { data: orgMember } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('organization_id', (variable as any).automation_workflows.organization_id)
      .single()

    if (!orgMember) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Update variable
    const { data: updatedVariable, error } = await supabase
      .from('automation_workflow_variables')
      .update({
        variable_value: variableValue,
        variable_type: variableType,
        is_secret: isSecret,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Sanitize secret value before returning
    if (updatedVariable.is_secret) {
      updatedVariable.variable_value = '********'
    }

    return NextResponse.json({ variable: updatedVariable })
  } catch (error: any) {
    console.error('Error updating workflow variable:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Delete a variable
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
      return NextResponse.json({ error: 'Variable ID required' }, { status: 400 })
    }

    // Verify user has access to this variable's workflow
    const { data: variable } = await supabase
      .from('automation_workflow_variables')
      .select('workflow_id, automation_workflows!inner(organization_id)')
      .eq('id', id)
      .single()

    if (!variable) {
      return NextResponse.json({ error: 'Variable not found' }, { status: 404 })
    }

    // Check organization membership
    const { data: orgMember } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('organization_id', (variable as any).automation_workflows.organization_id)
      .single()

    if (!orgMember) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Delete variable
    const { error } = await supabase
      .from('automation_workflow_variables')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting workflow variable:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

