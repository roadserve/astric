'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Play,
  Users,
  DollarSign,
  Calendar,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  FileText
} from 'lucide-react'

export default function PayrollProcessPage() {
  const supabase = createClientComponentClient()
  const [payrollRuns, setPayrollRuns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  useEffect(() => {
    loadPayrollRuns()
  }, [])

  const loadPayrollRuns = async () => {
    setLoading(true)
    try {
      const { data: profile } = await supabase.from('profiles').select('id').single()
      const { data: orgMember } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', profile?.id)
        .single()

      const { data, error } = await supabase
        .from('payroll_runs')
        .select('*')
        .eq('organization_id', orgMember?.organization_id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPayrollRuns(data || [])
    } catch (error) {
      console.error('Error loading payroll runs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleProcessPayroll = async () => {
    if (!confirm(`Process payroll for ${getMonthName(selectedMonth)} ${selectedYear}?`)) return

    setProcessing(true)
    try {
      const { data: profile } = await supabase.from('profiles').select('id').single()
      const { data: orgMember } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', profile?.id)
        .single()

      const orgId = orgMember?.organization_id

      // Check if payroll already exists
      const { data: existing } = await supabase
        .from('payroll_runs')
        .select('*')
        .eq('organization_id', orgId)
        .eq('month', selectedMonth)
        .eq('year', selectedYear)
        .single()

      if (existing) {
        alert('Payroll already processed for this month!')
        setProcessing(false)
        return
      }

      // Get active employees
      const { data: employees } = await supabase
        .from('payroll_employees')
        .select('id')
        .eq('organization_id', orgId)
        .eq('status', 'active')

      if (!employees || employees.length === 0) {
        alert('No active employees found!')
        setProcessing(false)
        return
      }

      // Get salary structures
      const { data: salaries } = await supabase
        .from('payroll_salary_structures')
        .select('*')
        .eq('organization_id', orgId)
        .eq('is_current', true)
        .in('employee_id', employees.map(e => e.id))

      // Get attendance for the month
      const fromDate = new Date(selectedYear, selectedMonth - 1, 1).toISOString().split('T')[0]
      const toDate = new Date(selectedYear, selectedMonth, 0).toISOString().split('T')[0]
      const totalDays = new Date(selectedYear, selectedMonth, 0).getDate()

      const { data: attendance } = await supabase
        .from('payroll_attendance')
        .select('*')
        .eq('organization_id', orgId)
        .gte('attendance_date', fromDate)
        .lte('attendance_date', toDate)

      // Get approved leaves
      const { data: leaves } = await supabase
        .from('payroll_leaves')
        .select('*')
        .eq('organization_id', orgId)
        .eq('status', 'approved')
        .gte('from_date', fromDate)
        .lte('to_date', toDate)

      // Get bonuses
      const { data: bonuses } = await supabase
        .from('payroll_bonuses')
        .select('*')
        .eq('organization_id', orgId)
        .eq('status', 'approved')
        .eq('month', selectedMonth)
        .eq('year', selectedYear)

      // Get overtime
      const { data: overtime } = await supabase
        .from('payroll_overtime')
        .select('*')
        .eq('organization_id', orgId)
        .eq('status', 'approved')
        .gte('overtime_date', fromDate)
        .lte('overtime_date', toDate)

      // Create payroll run
      const { data: payrollRun, error: runError } = await supabase
        .from('payroll_runs')
        .insert({
          organization_id: orgId,
          month: selectedMonth,
          year: selectedYear,
          payroll_period: `${getMonthName(selectedMonth)} ${selectedYear}`,
          from_date: fromDate,
          to_date: toDate,
          status: 'processing',
          total_employees: employees.length,
          processed_by: profile?.id
        })
        .select()
        .single()

      if (runError) throw runError

      // Process each employee
      let totalGross = 0
      let totalDeductions = 0
      let totalNet = 0

      const payslips = []

      for (const employee of employees) {
        const salary = salaries?.find(s => s.employee_id === employee.id)
        if (!salary) continue

        // Calculate attendance
        const empAttendance = attendance?.filter(a => a.employee_id === employee.id) || []
        const daysPresent = empAttendance.filter(a => a.status === 'present').length
        const daysAbsent = empAttendance.filter(a => a.status === 'absent').length
        const halfDays = empAttendance.filter(a => a.status === 'half_day').length
        
        // Calculate leave days
        const empLeaves = leaves?.filter(l => l.employee_id === employee.id) || []
        const leaveDays = empLeaves.reduce((sum, l) => sum + Number(l.total_days), 0)

        // Calculate paid days
        const paidDays = daysPresent + (halfDays * 0.5) + leaveDays

        // Calculate pro-rata salary
        const salaryPerDay = Number(salary.gross_salary) / totalDays
        const grossSalary = salaryPerDay * paidDays

        // Calculate deductions pro-rata
        const deductionPerDay = Number(salary.total_deductions) / totalDays
        const totalDeduction = deductionPerDay * paidDays

        // Add bonuses
        const empBonuses = bonuses?.filter(b => b.employee_id === employee.id) || []
        const bonusAmount = empBonuses.reduce((sum, b) => sum + Number(b.amount), 0)

        // Add overtime
        const empOvertime = overtime?.filter(o => o.employee_id === employee.id) || []
        const overtimeAmount = empOvertime.reduce((sum, o) => sum + Number(o.total_amount), 0)

        // Calculate loss of pay
        const lossOfPay = daysAbsent * salaryPerDay

        // Final calculations
        const finalGross = grossSalary + bonusAmount + overtimeAmount
        const finalDeductions = totalDeduction + lossOfPay
        const netSalary = finalGross - finalDeductions

        totalGross += finalGross
        totalDeductions += finalDeductions
        totalNet += netSalary

        // Create payslip
        payslips.push({
          organization_id: orgId,
          payroll_run_id: payrollRun.id,
          employee_id: employee.id,
          month: selectedMonth,
          year: selectedYear,
          total_working_days: totalDays,
          days_present: daysPresent + (halfDays * 0.5),
          days_absent: daysAbsent,
          days_on_leave: leaveDays,
          paid_days: paidDays,
          basic_salary: (Number(salary.basic_salary) / totalDays) * paidDays,
          hra: (Number(salary.hra) / totalDays) * paidDays,
          conveyance_allowance: (Number(salary.conveyance_allowance) / totalDays) * paidDays,
          medical_allowance: (Number(salary.medical_allowance) / totalDays) * paidDays,
          special_allowance: (Number(salary.special_allowance) / totalDays) * paidDays,
          education_allowance: (Number(salary.education_allowance) / totalDays) * paidDays,
          other_allowance: (Number(salary.other_allowance) / totalDays) * paidDays,
          overtime_amount: overtimeAmount,
          bonus: bonusAmount,
          gross_salary: finalGross,
          epf_employee: (Number(salary.epf_employee) / totalDays) * paidDays,
          esi_employee: (Number(salary.esi_employee) / totalDays) * paidDays,
          professional_tax: (Number(salary.professional_tax) / totalDays) * paidDays,
          tds: (Number(salary.tds) / totalDays) * paidDays,
          loan_emi: (Number(salary.loan_emi) / totalDays) * paidDays,
          other_deduction: (Number(salary.other_deduction) / totalDays) * paidDays,
          loss_of_pay: lossOfPay,
          total_deductions: finalDeductions,
          net_salary: netSalary,
          payment_status: 'pending'
        })
      }

      // Insert all payslips
      const { error: payslipError } = await supabase
        .from('payroll_payslips')
        .insert(payslips)

      if (payslipError) throw payslipError

      // Update payroll run
      await supabase
        .from('payroll_runs')
        .update({
          status: 'completed',
          total_gross_salary: totalGross,
          total_deductions: totalDeductions,
          total_net_salary: totalNet,
          processed_at: new Date().toISOString()
        })
        .eq('id', payrollRun.id)

      alert(`Payroll processed successfully! ${employees.length} payslips generated.`)
      loadPayrollRuns()
    } catch (error: any) {
      console.error('Error processing payroll:', error)
      alert(error.message || 'Failed to process payroll')
    } finally {
      setProcessing(false)
    }
  }

  const getMonthName = (month: number) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                   'July', 'August', 'September', 'October', 'November', 'December']
    return months[month - 1]
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: { color: 'bg-gray-100 text-gray-800', label: 'Draft', icon: FileText },
      processing: { color: 'bg-blue-100 text-blue-800', label: 'Processing', icon: Play },
      completed: { color: 'bg-green-100 text-green-800', label: 'Completed', icon: CheckCircle },
      paid: { color: 'bg-purple-100 text-purple-800', label: 'Paid', icon: CheckCircle }
    }
    return badges[status as keyof typeof badges] || badges.draft
  }

  const months = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: getMonthName(i + 1) }))
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Process Payroll</h1>
          <p className="text-gray-600 mt-1">Run monthly payroll processing</p>
        </div>
      </div>

      {/* Process New Payroll */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Process New Payroll</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {months.map(month => (
                    <option key={month.value} value={month.value}>{month.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={handleProcessPayroll}
                  disabled={processing}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {processing ? (
                    <>Processing...</>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Process Payroll
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">Payroll Processing Steps:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Fetch all active employees</li>
                    <li>Calculate attendance (Present, Absent, Half Day, Leave)</li>
                    <li>Calculate pro-rata salary based on working days</li>
                    <li>Add bonuses and overtime</li>
                    <li>Deduct EPF, ESI, TDS, Loans</li>
                    <li>Calculate loss of pay for absences</li>
                    <li>Generate payslips for all employees</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payroll History */}
      <Card>
        <CardHeader>
          <CardTitle>Payroll History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading payroll history...</div>
          ) : payrollRuns.length === 0 ? (
            <div className="p-8 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No payroll runs yet</h3>
              <p className="text-gray-600">Process your first payroll above</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employees</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gross Salary</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deductions</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Net Salary</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Processed</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payrollRuns.map((run) => {
                    const statusBadge = getStatusBadge(run.status)
                    const StatusIcon = statusBadge.icon
                    
                    return (
                      <tr key={run.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{run.payroll_period}</div>
                          <div className="text-xs text-gray-500">
                            {formatDate(run.from_date)} - {formatDate(run.to_date)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {run.total_employees}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                          {formatCurrency(Number(run.total_gross_salary) || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                          {formatCurrency(Number(run.total_deductions) || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">
                          {formatCurrency(Number(run.total_net_salary) || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${statusBadge.color}`}>
                            <StatusIcon className="h-3 w-3" />
                            {statusBadge.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {run.processed_at ? formatDate(run.processed_at) : '-'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
