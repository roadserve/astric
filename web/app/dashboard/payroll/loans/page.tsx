'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Plus, 
  Search, 
  DollarSign,
  TrendingUp,
  CheckCircle,
  Clock,
  Briefcase
} from 'lucide-react'

export default function LoansPage() {
  const supabase = createClientComponentClient()
  const [loans, setLoans] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showApplyModal, setShowApplyModal] = useState(false)

  const [formData, setFormData] = useState({
    employee_id: '',
    loan_type: 'advance',
    loan_amount: 0,
    interest_rate: 0,
    emi_amount: 0,
    total_installments: 12,
    disbursement_date: new Date().toISOString().split('T')[0],
    start_date: new Date().toISOString().split('T')[0],
    reason: ''
  })

  useEffect(() => {
    loadLoans()
    loadEmployees()
  }, [])

  useEffect(() => {
    if (formData.loan_amount && formData.total_installments) {
      const emi = formData.loan_amount / formData.total_installments
      setFormData(prev => ({ ...prev, emi_amount: parseFloat(emi.toFixed(2)) }))
    }
  }, [formData.loan_amount, formData.total_installments])

  const loadLoans = async () => {
    setLoading(true)
    try {
      const { data: profile } = await supabase.from('profiles').select('id').single()
      const { data: orgMember } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', profile?.id)
        .single()

      const { data, error } = await supabase
        .from('payroll_loans')
        .select(`*, employee:payroll_employees(first_name, last_name, employee_code)`)
        .eq('organization_id', orgMember?.organization_id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setLoans(data || [])
    } catch (error) {
      console.error('Error loading loans:', error)
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
        .select('*')
        .eq('organization_id', orgMember?.organization_id)
        .eq('status', 'active')

      if (error) throw error
      setEmployees(data || [])
    } catch (error) {
      console.error('Error loading employees:', error)
    }
  }

  const handleApplyLoan = async () => {
    if (!formData.employee_id || formData.loan_amount <= 0) {
      alert('Please fill all required fields')
      return
    }

    try {
      const { data: profile } = await supabase.from('profiles').select('id').single()
      const { data: orgMember } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', profile?.id)
        .single()

      const { error } = await supabase
        .from('payroll_loans')
        .insert({
          organization_id: orgMember?.organization_id,
          ...formData,
          remaining_amount: formData.loan_amount,
          approved_by: profile?.id,
          approved_at: new Date().toISOString()
        })

      if (error) throw error
      alert('Loan created successfully!')
      setShowApplyModal(false)
      resetForm()
      loadLoans()
    } catch (error) {
      console.error('Error creating loan:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      employee_id: '',
      loan_type: 'advance',
      loan_amount: 0,
      interest_rate: 0,
      emi_amount: 0,
      total_installments: 12,
      disbursement_date: new Date().toISOString().split('T')[0],
      start_date: new Date().toISOString().split('T')[0],
      reason: ''
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

  const stats = {
    total: loans.length,
    active: loans.filter(l => l.status === 'active').length,
    totalAmount: loans.reduce((sum, l) => sum + Number(l.loan_amount), 0),
    totalRemaining: loans.filter(l => l.status === 'active').reduce((sum, l) => sum + Number(l.remaining_amount), 0)
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      active: { color: 'bg-blue-100 text-blue-800', label: 'Active' },
      completed: { color: 'bg-green-100 text-green-800', label: 'Completed' },
      cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled' }
    }
    return badges[status as keyof typeof badges] || badges.active
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Loans & Advances</h1>
          <p className="text-gray-600 mt-1">Manage employee loans and advances</p>
        </div>
        <Button onClick={() => setShowApplyModal(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Loan
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Loans</CardTitle>
            <Briefcase className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Disbursed</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalAmount)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{formatCurrency(stats.totalRemaining)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Loans List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading loans...</div>
          ) : loans.length === 0 ? (
            <div className="p-8 text-center">
              <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No loans found</h3>
              <p className="text-gray-600 mb-4">Add first loan or advance</p>
              <Button onClick={() => setShowApplyModal(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Loan
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">EMI</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Installments</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remaining</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loans.map((loan) => {
                    const statusBadge = getStatusBadge(loan.status)
                    const progress = ((loan.paid_installments / loan.total_installments) * 100).toFixed(0)
                    
                    return (
                      <tr key={loan.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {loan.employee?.first_name} {loan.employee?.last_name}
                          </div>
                          <div className="text-xs text-gray-500">{loan.employee?.employee_code}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                            {loan.loan_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {formatCurrency(Number(loan.loan_amount))}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(Number(loan.emi_amount))}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {loan.paid_installments}/{loan.total_installments}
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-orange-600">
                          {formatCurrency(Number(loan.remaining_amount))}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusBadge.color}`}>
                            {statusBadge.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(loan.start_date)}
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

      {/* Add Loan Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>Add Loan/Advance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Loan Type *</label>
                  <select
                    value={formData.loan_type}
                    onChange={(e) => setFormData({...formData, loan_type: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="advance">Advance</option>
                    <option value="loan">Loan</option>
                    <option value="emergency">Emergency</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Loan Amount *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.loan_amount}
                    onChange={(e) => setFormData({...formData, loan_amount: parseFloat(e.target.value) || 0})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Interest Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.interest_rate}
                    onChange={(e) => setFormData({...formData, interest_rate: parseFloat(e.target.value) || 0})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Total Installments *</label>
                  <input
                    type="number"
                    value={formData.total_installments}
                    onChange={(e) => setFormData({...formData, total_installments: parseInt(e.target.value) || 0})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">EMI Amount (Auto-calculated)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.emi_amount}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 font-semibold"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Disbursement Date *</label>
                  <input
                    type="date"
                    value={formData.disbursement_date}
                    onChange={(e) => setFormData({...formData, disbursement_date: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <Button onClick={() => { setShowApplyModal(false); resetForm(); }} variant="outline" className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleApplyLoan} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Loan
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
