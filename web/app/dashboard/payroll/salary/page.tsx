'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  DollarSign,
  TrendingUp,
  Users,
  Calculator,
  Eye
} from 'lucide-react'

interface SalaryStructure {
  id: string
  employee: {
    first_name: string
    last_name: string
    employee_code: string
  }
  basic_salary: number
  hra: number
  gross_salary: number
  total_deductions: number
  net_salary: number
  ctc: number
  effective_from: string
  is_current: boolean
}

export default function SalaryStructurePage() {
  const supabase = createClientComponentClient()
  const [salaries, setSalaries] = useState<SalaryStructure[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)

  const [formData, setFormData] = useState({
    employee_id: '',
    basic_salary: 0,
    hra: 0,
    conveyance_allowance: 0,
    medical_allowance: 0,
    special_allowance: 0,
    education_allowance: 0,
    other_allowance: 0,
    epf_employee: 0,
    epf_employer: 0,
    esi_employee: 0,
    esi_employer: 0,
    professional_tax: 0,
    tds: 0,
    loan_emi: 0,
    advance_deduction: 0,
    other_deduction: 0,
    effective_from: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    loadSalaries()
    loadEmployees()
  }, [])

  useEffect(() => {
    // Auto-calculate HRA (50% of basic for metro, 40% for non-metro)
    const hra = formData.basic_salary * 0.5
    
    // Auto-calculate EPF (12% of basic)
    const epf_employee = formData.basic_salary * 0.12
    const epf_employer = formData.basic_salary * 0.12
    
    // Auto-calculate ESI (0.75% employee, 3.25% employer) - only if gross < 21000
    const gross = formData.basic_salary + hra + formData.conveyance_allowance + 
                  formData.medical_allowance + formData.special_allowance + 
                  formData.education_allowance + formData.other_allowance
    
    const esi_employee = gross <= 21000 ? gross * 0.0075 : 0
    const esi_employer = gross <= 21000 ? gross * 0.0325 : 0
    
    setFormData(prev => ({
      ...prev,
      hra: parseFloat(hra.toFixed(2)),
      epf_employee: parseFloat(epf_employee.toFixed(2)),
      epf_employer: parseFloat(epf_employer.toFixed(2)),
      esi_employee: parseFloat(esi_employee.toFixed(2)),
      esi_employer: parseFloat(esi_employer.toFixed(2))
    }))
  }, [formData.basic_salary, formData.conveyance_allowance, formData.medical_allowance, 
      formData.special_allowance, formData.education_allowance, formData.other_allowance])

  const loadSalaries = async () => {
    setLoading(true)
    try {
      const { data: profile } = await supabase.from('profiles').select('id').single()
      const { data: orgMember } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', profile?.id)
        .single()

      const { data, error } = await supabase
        .from('payroll_salary_structures')
        .select(`
          *,
          employee:payroll_employees(first_name, last_name, employee_code)
        `)
        .eq('organization_id', orgMember?.organization_id)
        .eq('is_current', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      setSalaries(data || [])
    } catch (error) {
      console.error('Error loading salaries:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadEmployees = async () => {
    try {
      const { data: profile } = await supabase.from('profiles').select('id').single()
      const { data: orgMember } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', profile?.id)
        .single()

      const { data, error } = await supabase
        .from('payroll_employees')
        .select('id, first_name, last_name, employee_code')
        .eq('organization_id', orgMember?.organization_id)
        .eq('status', 'active')
        .order('first_name')

      if (error) throw error
      setEmployees(data || [])
    } catch (error) {
      console.error('Error loading employees:', error)
    }
  }

  const handleCreateSalary = async () => {
    if (!formData.employee_id || formData.basic_salary <= 0) {
      alert('Please select employee and enter basic salary')
      return
    }

    try {
      const { data: profile } = await supabase.from('profiles').select('id').single()
      const { data: orgMember } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', profile?.id)
        .single()

      // Mark existing salary structures as not current
      await supabase
        .from('payroll_salary_structures')
        .update({ is_current: false })
        .eq('employee_id', formData.employee_id)

      // Insert new salary structure
      const { error } = await supabase
        .from('payroll_salary_structures')
        .insert({
          organization_id: orgMember?.organization_id,
          ...formData,
          created_by: profile?.id
        })

      if (error) throw error

      alert('Salary structure created successfully!')
      setShowCreateModal(false)
      resetForm()
      loadSalaries()
    } catch (error: any) {
      console.error('Error creating salary:', error)
      alert(error.message || 'Failed to create salary structure')
    }
  }

  const handleDeleteSalary = async (salaryId: string) => {
    if (!confirm('Are you sure you want to delete this salary structure?')) return

    try {
      const { error } = await supabase
        .from('payroll_salary_structures')
        .delete()
        .eq('id', salaryId)

      if (error) throw error
      loadSalaries()
    } catch (error) {
      console.error('Error deleting salary:', error)
      alert('Failed to delete salary structure')
    }
  }

  const resetForm = () => {
    setFormData({
      employee_id: '',
      basic_salary: 0,
      hra: 0,
      conveyance_allowance: 0,
      medical_allowance: 0,
      special_allowance: 0,
      education_allowance: 0,
      other_allowance: 0,
      epf_employee: 0,
      epf_employer: 0,
      esi_employee: 0,
      esi_employer: 0,
      professional_tax: 0,
      tds: 0,
      loan_emi: 0,
      advance_deduction: 0,
      other_deduction: 0,
      effective_from: new Date().toISOString().split('T')[0]
    })
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

  const calculateTotals = () => {
    const gross = formData.basic_salary + formData.hra + formData.conveyance_allowance + 
                  formData.medical_allowance + formData.special_allowance + 
                  formData.education_allowance + formData.other_allowance

    const deductions = formData.epf_employee + formData.esi_employee + formData.professional_tax + 
                      formData.tds + formData.loan_emi + formData.advance_deduction + formData.other_deduction

    const net = gross - deductions

    const ctc = gross + formData.epf_employer + formData.esi_employer

    return { gross, deductions, net, ctc }
  }

  const filteredSalaries = salaries.filter(salary => {
    const employeeName = `${salary.employee?.first_name} ${salary.employee?.last_name}`.toLowerCase()
    const employeeCode = salary.employee?.employee_code?.toLowerCase() || ''
    return employeeName.includes(searchTerm.toLowerCase()) || 
           employeeCode.includes(searchTerm.toLowerCase())
  })

  const stats = {
    total: salaries.length,
    totalCTC: salaries.reduce((sum, s) => sum + Number(s.ctc), 0),
    avgSalary: salaries.length > 0 ? salaries.reduce((sum, s) => sum + Number(s.net_salary), 0) / salaries.length : 0,
    totalPayroll: salaries.reduce((sum, s) => sum + Number(s.net_salary), 0)
  }

  const totals = calculateTotals()

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Salary Structure</h1>
          <p className="text-gray-600 mt-1">Configure employee salary components</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Salary Structure
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total CTC</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(stats.totalCTC)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Salary</CardTitle>
            <Calculator className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.avgSalary)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Payroll</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{formatCurrency(stats.totalPayroll)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by employee name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Salary List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading salary structures...</div>
          ) : filteredSalaries.length === 0 ? (
            <div className="p-8 text-center">
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No salary structures found</h3>
              <p className="text-gray-600 mb-4">Add salary structure for employees</p>
              <Button onClick={() => setShowCreateModal(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Salary Structure
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Basic</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">HRA</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gross</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deductions</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Net Salary</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CTC</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Effective From</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSalaries.map((salary) => (
                    <tr key={salary.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {salary.employee?.first_name} {salary.employee?.last_name}
                          </div>
                          <div className="text-xs text-gray-500">{salary.employee?.employee_code}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(Number(salary.basic_salary))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(Number(salary.hra))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                        {formatCurrency(Number(salary.gross_salary))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                        {formatCurrency(Number(salary.total_deductions))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">
                        {formatCurrency(Number(salary.net_salary))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-purple-600">
                        {formatCurrency(Number(salary.ctc))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(salary.effective_from)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteSalary(salary.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Salary Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="w-full max-w-6xl my-8">
            <Card>
              <CardHeader>
                <CardTitle>Add Salary Structure</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid lg:grid-cols-3 gap-6">
                  {/* Left Column - Employee & Earnings */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Employee Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Employee *</label>
                      <select
                        value={formData.employee_id}
                        onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Employee</option>
                        {employees.map(emp => (
                          <option key={emp.id} value={emp.id}>
                            {emp.first_name} {emp.last_name} ({emp.employee_code})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Earnings */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Earnings</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Basic Salary *</label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.basic_salary}
                            onChange={(e) => setFormData({...formData, basic_salary: parseFloat(e.target.value) || 0})}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">HRA (Auto-calculated)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.hra}
                            readOnly
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Conveyance Allowance</label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.conveyance_allowance}
                            onChange={(e) => setFormData({...formData, conveyance_allowance: parseFloat(e.target.value) || 0})}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Medical Allowance</label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.medical_allowance}
                            onChange={(e) => setFormData({...formData, medical_allowance: parseFloat(e.target.value) || 0})}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Special Allowance</label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.special_allowance}
                            onChange={(e) => setFormData({...formData, special_allowance: parseFloat(e.target.value) || 0})}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Education Allowance</label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.education_allowance}
                            onChange={(e) => setFormData({...formData, education_allowance: parseFloat(e.target.value) || 0})}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Other Allowance</label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.other_allowance}
                            onChange={(e) => setFormData({...formData, other_allowance: parseFloat(e.target.value) || 0})}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Deductions */}
                    <div className="pt-6 border-t">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Deductions</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">EPF Employee (12%)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.epf_employee}
                            readOnly
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">ESI Employee (0.75%)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.esi_employee}
                            readOnly
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Professional Tax</label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.professional_tax}
                            onChange={(e) => setFormData({...formData, professional_tax: parseFloat(e.target.value) || 0})}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">TDS</label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.tds}
                            onChange={(e) => setFormData({...formData, tds: parseFloat(e.target.value) || 0})}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Loan EMI</label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.loan_emi}
                            onChange={(e) => setFormData({...formData, loan_emi: parseFloat(e.target.value) || 0})}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Other Deduction</label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.other_deduction}
                            onChange={(e) => setFormData({...formData, other_deduction: parseFloat(e.target.value) || 0})}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Effective Date */}
                    <div className="pt-6 border-t">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Effective From *</label>
                      <input
                        type="date"
                        value={formData.effective_from}
                        onChange={(e) => setFormData({...formData, effective_from: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Right Column - Summary */}
                  <div className="lg:col-span-1">
                    <Card className="sticky top-6">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Calculator className="h-5 w-5" />
                          Salary Summary
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Gross Salary:</span>
                            <span className="font-semibold text-green-600">{formatCurrency(totals.gross)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Total Deductions:</span>
                            <span className="font-semibold text-red-600">{formatCurrency(totals.deductions)}</span>
                          </div>
                        </div>

                        <div className="pt-4 border-t">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-900">Net Salary:</span>
                            <span className="text-xl font-bold text-blue-600">{formatCurrency(totals.net)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-900">CTC (Annual):</span>
                            <span className="text-lg font-bold text-purple-600">{formatCurrency(totals.ctc * 12)}</span>
                          </div>
                        </div>

                        <div className="pt-4 border-t space-y-2">
                          <h4 className="text-sm font-semibold text-gray-900">Employer Contributions:</h4>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">EPF Employer:</span>
                            <span>{formatCurrency(formData.epf_employer)}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">ESI Employer:</span>
                            <span>{formatCurrency(formData.esi_employer)}</span>
                          </div>
                        </div>

                        <div className="pt-4 border-t">
                          <Button onClick={handleCreateSalary} className="w-full bg-blue-600 hover:bg-blue-700">
                            <Plus className="h-4 w-4 mr-2" />
                            Create Salary Structure
                          </Button>
                          <Button 
                            onClick={() => { setShowCreateModal(false); resetForm(); }} 
                            variant="outline" 
                            className="w-full mt-2"
                          >
                            Cancel
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
