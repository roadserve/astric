import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Force dynamic rendering

// POST - Handle webhook from n8n executions
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      workflowId,
      executionId,
      status,
      executionTime,
      error,
      inputData,
      outputData
    } = body

    const supabase = createRouteHandlerClient({ cookies })

    // Find workflow in database
    const { data: workflow } = await supabase
      .from('automation_workflows')
      .select('id')
      .eq('n8n_workflow_id', workflowId)
      .single()

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    // Log execution
    const { error: logError } = await supabase
      .from('automation_executions')
      .insert({
        workflow_id: workflow.id,
        n8n_execution_id: executionId,
        status: status,
        execution_time_ms: executionTime,
        error_message: error || null,
        input_data: inputData || {},
        output_data: outputData || {},
      })

    if (logError) {
      console.error('Error logging execution:', logError)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET - Trigger a workflow manually
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const workflowId = searchParams.get('workflowId')
    const testData = searchParams.get('testData')

    if (!workflowId) {
      return NextResponse.json({ error: 'Workflow ID required' }, { status: 400 })
    }

    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get workflow
    const { data: workflow } = await supabase
      .from('automation_workflows')
      .select('*, organization_members!inner(user_id)')
      .eq('id', workflowId)
      .eq('organization_members.user_id', user.id)
      .single()

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    // Check subscription limits
    const { data: subscription } = await supabase
      .from('automation_subscriptions')
      .select('max_executions_per_month, current_month_executions')
      .eq('organization_id', workflow.organization_id)
      .single()

    if (
      subscription &&
      subscription.current_month_executions >= subscription.max_executions_per_month
    ) {
      return NextResponse.json(
        { error: 'Monthly execution limit reached. Please upgrade your plan.' },
        { status: 403 }
      )
    }

    // Trigger workflow via n8n API
    const N8N_API_URL = process.env.N8N_API_URL || 'http://localhost:5678/api/v1'
    const N8N_API_KEY = process.env.N8N_API_KEY || ''

    if (workflow.n8n_workflow_id) {
      try {
        const response = await fetch(
          `${N8N_API_URL}/workflows/${workflow.n8n_workflow_id}/execute`,
          {
            method: 'POST',
            headers: {
              'X-N8N-API-KEY': N8N_API_KEY,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              data: testData ? JSON.parse(testData) : {},
            }),
          }
        )

        const result = await response.json()
        return NextResponse.json({ execution: result })
      } catch (n8nError) {
        console.error('n8n execution error:', n8nError)
        return NextResponse.json(
          { error: 'Failed to execute workflow' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ error: 'Workflow not configured in n8n' }, { status: 404 })
  } catch (error: any) {
    console.error('Error triggering workflow:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
