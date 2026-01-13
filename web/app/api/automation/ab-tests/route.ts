import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'


// GET - Fetch all A/B tests for organization
export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const testId = searchParams.get('id')

    // Get user's organization
    const { data: orgMember } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (!orgMember) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    if (testId) {
      // Fetch specific test with detailed metrics
      const { data: test, error } = await supabase
        .from('automation_ab_tests')
        .select(`
          *,
          workflow_a:workflow_a_id (id, workflow_name, execution_count),
          workflow_b:workflow_b_id (id, workflow_name, execution_count),
          winner:winner_workflow_id (id, workflow_name)
        `)
        .eq('id', testId)
        .eq('organization_id', orgMember.organization_id)
        .single()

      if (error) throw error

      // Calculate metrics for each workflow
      const { data: execA } = await supabase
        .from('automation_executions')
        .select('status, execution_time_ms')
        .eq('workflow_id', test.workflow_a_id)
        .gte('executed_at', test.start_date || new Date(0).toISOString())

      const { data: execB } = await supabase
        .from('automation_executions')
        .select('status, execution_time_ms')
        .eq('workflow_id', test.workflow_b_id)
        .gte('executed_at', test.start_date || new Date(0).toISOString())

      const metricsA = calculateMetrics(execA || [])
      const metricsB = calculateMetrics(execB || [])

      return NextResponse.json({ 
        test, 
        metrics: {
          workflow_a: metricsA,
          workflow_b: metricsB
        }
      })
    }

    // Fetch all tests
    const { data: tests, error } = await supabase
      .from('automation_ab_tests')
      .select(`
        *,
        workflow_a:workflow_a_id (id, workflow_name),
        workflow_b:workflow_b_id (id, workflow_name),
        winner:winner_workflow_id (id, workflow_name)
      `)
      .eq('organization_id', orgMember.organization_id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ tests })
  } catch (error: any) {
    console.error('Error fetching A/B tests:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Create a new A/B test
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, workflowAId, workflowBId, trafficSplit, startDate, endDate } = body

    if (!name || !workflowAId || !workflowBId) {
      return NextResponse.json({ 
        error: 'Name, workflow A ID, and workflow B ID are required' 
      }, { status: 400 })
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

    // Verify both workflows belong to the organization
    const { data: workflows } = await supabase
      .from('automation_workflows')
      .select('id')
      .eq('organization_id', orgMember.organization_id)
      .in('id', [workflowAId, workflowBId])

    if (!workflows || workflows.length !== 2) {
      return NextResponse.json({ 
        error: 'Both workflows must belong to your organization' 
      }, { status: 403 })
    }

    // Create A/B test
    const { data: test, error } = await supabase
      .from('automation_ab_tests')
      .insert({
        organization_id: orgMember.organization_id,
        name,
        workflow_a_id: workflowAId,
        workflow_b_id: workflowBId,
        traffic_split: trafficSplit || 50,
        start_date: startDate || new Date().toISOString(),
        end_date: endDate || null,
        status: 'draft'
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ test })
  } catch (error: any) {
    console.error('Error creating A/B test:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT - Update an A/B test
export async function PUT(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, status, winnerWorkflowId, endDate } = body

    if (!id) {
      return NextResponse.json({ error: 'Test ID required' }, { status: 400 })
    }

    // Verify user has access to this test
    const { data: test } = await supabase
      .from('automation_ab_tests')
      .select('organization_id')
      .eq('id', id)
      .single()

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 })
    }

    // Check organization membership
    const { data: orgMember } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('organization_id', test.organization_id)
      .single()

    if (!orgMember) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Update test
    const updates: any = {}
    if (status) updates.status = status
    if (winnerWorkflowId) updates.winner_workflow_id = winnerWorkflowId
    if (endDate) updates.end_date = endDate

    const { data: updatedTest, error } = await supabase
      .from('automation_ab_tests')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ test: updatedTest })
  } catch (error: any) {
    console.error('Error updating A/B test:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Delete an A/B test
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
      return NextResponse.json({ error: 'Test ID required' }, { status: 400 })
    }

    // Verify user has access to this test
    const { data: test } = await supabase
      .from('automation_ab_tests')
      .select('organization_id')
      .eq('id', id)
      .single()

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 })
    }

    // Check organization membership
    const { data: orgMember } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('organization_id', test.organization_id)
      .single()

    if (!orgMember) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Delete test
    const { error } = await supabase
      .from('automation_ab_tests')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting A/B test:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Helper function to calculate metrics
function calculateMetrics(executions: any[]) {
  const total = executions.length
  const successful = executions.filter(e => e.status === 'success').length
  const failed = executions.filter(e => e.status === 'error').length
  const avgTime = total > 0 
    ? executions.reduce((sum, e) => sum + (e.execution_time_ms || 0), 0) / total 
    : 0

  return {
    total_executions: total,
    successful_executions: successful,
    failed_executions: failed,
    success_rate: total > 0 ? ((successful / total) * 100).toFixed(2) : 0,
    avg_execution_time_ms: Math.round(avgTime)
  }
}

