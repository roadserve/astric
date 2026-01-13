import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { org_id, period } = await req.json()

    if (!org_id || !period) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Parse period (e.g., "2024-01" for January 2024)
    const [year, month] = period.split('-')
    const startDate = new Date(year, parseInt(month) - 1, 1)
    const endDate = new Date(year, parseInt(month), 0)

    // Get active employees
    const { data: employees, error: employeesError } = await supabaseClient
      .from('employees')
      .select('*')
      .eq('organization_id', org_id)
      .eq('is_active', true)

    if (employeesError) {
      throw new Error(`Failed to get employees: ${employeesError.message}`)
    }

    const payrollRecords = []

    for (const employee of employees || []) {
      // Get attendance for the period
      const { data: attendance, error: attendanceError } = await supabaseClient
        .from('attendance')
        .select('*')
        .eq('employee_id', employee.id)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])

      if (attendanceError) {
        console.error(`Failed to get attendance for employee ${employee.id}:`, attendanceError)
        continue
      }

      // Calculate working days
      const presentDays = attendance?.filter(a => a.status === 'present').length || 0
      const halfDays = attendance?.filter(a => a.status === 'half_day').length || 0
      const totalWorkingDays = presentDays + (halfDays * 0.5)

      let basicSalary = 0
      let allowances = 0
      let deductions = 0

      if (employee.salary_type === 'monthly') {
        // Calculate prorated salary based on attendance
        const daysInMonth = endDate.getDate()
        basicSalary = (employee.base_salary / daysInMonth) * totalWorkingDays

        // Calculate standard allowances (example: 20% of basic)
        allowances = basicSalary * 0.20

      } else if (employee.salary_type === 'hourly') {
        // Calculate based on hours worked
        const totalHours = attendance?.reduce((sum, a) => {
          if (a.check_in_time && a.check_out_time) {
            const checkIn = new Date(a.check_in_time)
            const checkOut = new Date(a.check_out_time)
            const hours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60)
            return sum + hours
          }
          return sum
        }, 0) || 0

        basicSalary = totalHours * (employee.hourly_rate || 0)
      }

      // Calculate statutory deductions
      const pfAmount = employee.pf_number ? basicSalary * 0.12 : 0 // 12% PF
      const esiAmount = employee.esi_number && basicSalary < 21000 ? basicSalary * 0.0075 : 0 // 0.75% ESI
      deductions = pfAmount + esiAmount

      // Calculate net salary
      const grossSalary = basicSalary + allowances
      const netSalary = grossSalary - deductions

      // Create payroll record
      const { data: payroll, error: payrollError } = await supabaseClient
        .from('payroll')
        .insert({
          organization_id: org_id,
          employee_id: employee.id,
          period_start: startDate.toISOString().split('T')[0],
          period_end: endDate.toISOString().split('T')[0],
          basic_salary: basicSalary,
          allowances: allowances,
          deductions: deductions,
          pf_amount: pfAmount,
          esi_amount: esiAmount,
          net_salary: netSalary,
          status: 'draft',
        })
        .select()
        .single()

      if (payrollError) {
        console.error(`Failed to create payroll for employee ${employee.id}:`, payrollError)
        continue
      }

      payrollRecords.push({
        employee_id: employee.id,
        employee_name: employee.full_name,
        employee_number: employee.employee_id,
        working_days: totalWorkingDays,
        basic_salary: basicSalary,
        allowances: allowances,
        gross_salary: grossSalary,
        deductions: deductions,
        pf_amount: pfAmount,
        esi_amount: esiAmount,
        net_salary: netSalary,
        payroll_id: payroll.id,
      })
    }

    // Calculate summary
    const summary = {
      total_employees: employees?.length || 0,
      total_basic_salary: payrollRecords.reduce((sum, p) => sum + p.basic_salary, 0),
      total_allowances: payrollRecords.reduce((sum, p) => sum + p.allowances, 0),
      total_deductions: payrollRecords.reduce((sum, p) => sum + p.deductions, 0),
      total_net_salary: payrollRecords.reduce((sum, p) => sum + p.net_salary, 0),
      total_pf: payrollRecords.reduce((sum, p) => sum + p.pf_amount, 0),
      total_esi: payrollRecords.reduce((sum, p) => sum + p.esi_amount, 0),
    }

    return new Response(
      JSON.stringify({
        success: true,
        period,
        summary,
        payroll_records: payrollRecords,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in payroll_run:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
