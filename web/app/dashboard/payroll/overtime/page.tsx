'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Plus, 
  Search, 
  Clock,
  Award,
  DollarSign,
  CheckCircle,
  TrendingUp
} from 'lucide-react'

export default function OvertimeBonusesPage() {
  const supabase = createClientComponentClient()
  const [overtime, setOvertime] = useState<any[]>([])
  const [bonuses, setBonuses] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overtime')
  const [showAddModal, setShowAddModal] = useState(false)

  const [overtimeForm, setOvertimeForm] = useState({
    employee_id: '',
    overtime_date: new Date().toISOString().split('T')[0],
    hours: 0,
    rate_per_hour: 0
  })

  const [bonusForm, setBonusForm] = useState({
    employee_id: '',
    bonus_type: 'performance',
    amount: 0,
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    description: ''
  })

  useEffect(() => {
    loadData()
    loadEmployees()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const { data: profile } = await supabase.from('profiles').select('id').single()
      const { data: orgMember } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', profile?.id)
        .single()

      const { data: overtimeData } = await supabase
        .from('payroll_overtime')
        .select(`*, employee:payroll_employees(first_name, last_name, employee_code)`)
        .eq('organization_id', orgMember?.organization_id)
        .order('overtime_date', { ascending: false })

      const { data: bonusData } = await supabase
        .from('payroll_bonuses')
        .select(`*, employee:payroll_employees(first_name, last_name, employee_code)`)
        .eq('organization_id', orgMember?.organization_id)
        .order('created_at', { ascending: false })

      setOvertime(overtimeData || [])
      setBonuses(bonusData || [])
    } catch (error) {
      console.error('Error loading data:', error)
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

  const handleAddOvertime = async () => {
    if (!overtimeForm.employee_id || overtimeForm.hours <= 0) {
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
        .from('payroll_overtime')
        .insert({
          organization_id: orgMember?.organization_id,
          ...overtimeForm,
          status: 'approved',
          approved_by: profile?.id,
          approved_at: new Date().toISOString()
        })

      if (error) throw error
      alert('Overtime added successfully!')
      setShowAddModal(false)
      resetForms()
      loadData()
    } catch (error) {
      console.error('Error adding overtime:', error)
    }
  }

  const handleAddBonus = async () => {
    if (!bonusForm.employee_id || bonusForm.amount <= 0) {
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
        .from('payroll_bonuses')
        .insert({
          organization_id: orgMember?.organization_id,
          ...bonusForm,
          status: 'approved',
          approved_by: profile?.id,
          approved_at: new Date().toISOString()
        })

      if (error) throw error
      alert('Bonus added successfully!')
      setShowAddModal(false)
      resetForms()
      loadData()
    } catch (error) {
      console.error('Error adding bonus:', error)
    }
  }

  const resetForms = () => {
    setOvertimeForm({
      employee_id: '',
      overtime_date: new Date().toISOString().split('T')[0],
      hours: 0,
      rate_per_hour: 0
    })
    setBonusForm({
      employee_id: '',
      bonus_type: 'performance',
      amount: 0,
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      description: ''
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

  const getMonthName = (month: number) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return months[month - 1]
  }

  const overtimeStats = {
    total: overtime.length,
    totalHours: overtime.reduce((sum, o) => sum + Number(o.hours), 0),
    totalAmount: overtime.reduce((sum, o) => sum + Number(o.total_amount), 0),
    approved: overtime.filter(o => o.status === 'approved').length
  }

  const bonusStats = {
    total: bonuses.length,
    totalAmount: bonuses.reduce((sum, b) => sum + Number(b.amount), 0),
    approved: bonuses.filter(b => b.status === 'approved').length,
    thisMonth: bonuses.filter(b => b.month === new Date().getMonth() + 1 && b.year === new Date().getFullYear()).length
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Overtime & Bonuses</h1>
          <p className="text-gray-600 mt-1">Manage overtime hours and employee bonuses</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Add {activeTab === 'overtime' ? 'Overtime' : 'Bonus'}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8">
        <Button
          onClick={() => setActiveTab('overtime')}
          variant={activeTab === 'overtime' ? 'default' : 'outline'}
          className={activeTab === 'overtime' ? 'bg-blue-600' : ''}
        >
          <Clock className="h-4 w-4 mr-2" />
          Overtime
        </Button>
        <Button
          onClick={() => setActiveTab('bonuses')}
          variant={activeTab === 'bonuses' ? 'default' : 'outline'}
          className={activeTab === 'bonuses' ? 'bg-blue-600' : ''}
        >
          <Award className="h-4 w-4 mr-2" />
          Bonuses
        </Button>
      </div>

      {/* Stats */}
      {activeTab === 'overtime' ? (
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Records</CardTitle>
              <Clock className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overtimeStats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{overtimeStats.totalHours.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(overtimeStats.totalAmount)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{overtimeStats.approved}</div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bonuses</CardTitle>
              <Award className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{bonusStats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(bonusStats.totalAmount)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{bonusStats.approved}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{bonusStats.thisMonth}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : activeTab === 'overtime' ? (
            overtime.length === 0 ? (
              <div className="p-8 text-center">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No overtime records</h3>
                <p className="text-gray-600 mb-4">Add overtime hours for employees</p>
                <Button onClick={() => setShowAddModal(true)} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Overtime
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate/Hour</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {overtime.map((ot) => (
                      <tr key={ot.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {ot.employee?.first_name} {ot.employee?.last_name}
                          </div>
                          <div className="text-xs text-gray-500">{ot.employee?.employee_code}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(ot.overtime_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">
                          {ot.hours} hrs
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(Number(ot.rate_per_hour))}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                          {formatCurrency(Number(ot.total_amount))}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            ot.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {ot.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            bonuses.length === 0 ? (
              <div className="p-8 text-center">
                <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No bonuses</h3>
                <p className="text-gray-600 mb-4">Add bonuses for employees</p>
                <Button onClick={() => setShowAddModal(true)} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Bonus
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {bonuses.map((bonus) => (
                      <tr key={bonus.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {bonus.employee?.first_name} {bonus.employee?.last_name}
                          </div>
                          <div className="text-xs text-gray-500">{bonus.employee?.employee_code}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                            {bonus.bonus_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                          {formatCurrency(Number(bonus.amount))}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {getMonthName(bonus.month)} {bonus.year}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                          {bonus.description || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            bonus.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {bonus.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </CardContent>
      </Card>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>Add {activeTab === 'overtime' ? 'Overtime' : 'Bonus'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeTab === 'overtime' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Employee *</label>
                    <select
                      value={overtimeForm.employee_id}
                      onChange={(e) => setOvertimeForm({...overtimeForm, employee_id: e.target.value})}
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                    <input
                      type="date"
                      value={overtimeForm.overtime_date}
                      onChange={(e) => setOvertimeForm({...overtimeForm, overtime_date: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Hours *</label>
                      <input
                        type="number"
                        step="0.5"
                        value={overtimeForm.hours}
                        onChange={(e) => setOvertimeForm({...overtimeForm, hours: parseFloat(e.target.value) || 0})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Rate per Hour *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={overtimeForm.rate_per_hour}
                        onChange={(e) => setOvertimeForm({...overtimeForm, rate_per_hour: parseFloat(e.target.value) || 0})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Total Amount:</span>
                      <span className="text-lg font-bold text-blue-600">
                        {formatCurrency(overtimeForm.hours * overtimeForm.rate_per_hour)}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4 border-t">
                    <Button onClick={() => { setShowAddModal(false); resetForms(); }} variant="outline" className="flex-1">
                      Cancel
                    </Button>
                    <Button onClick={handleAddOvertime} className="flex-1 bg-blue-600 hover:bg-blue-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Overtime
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Employee *</label>
                    <select
                      value={bonusForm.employee_id}
                      onChange={(e) => setBonusForm({...bonusForm, employee_id: e.target.value})}
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">Bonus Type *</label>
                      <select
                        value={bonusForm.bonus_type}
                        onChange={(e) => setBonusForm({...bonusForm, bonus_type: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="performance">Performance</option>
                        <option value="festival">Festival</option>
                        <option value="annual">Annual</option>
                        <option value="project">Project</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Amount *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={bonusForm.amount}
                        onChange={(e) => setBonusForm({...bonusForm, amount: parseFloat(e.target.value) || 0})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Month *</label>
                      <select
                        value={bonusForm.month}
                        onChange={(e) => setBonusForm({...bonusForm, month: parseInt(e.target.value)})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {Array.from({length: 12}, (_, i) => (
                          <option key={i+1} value={i+1}>{getMonthName(i+1)}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Year *</label>
                      <select
                        value={bonusForm.year}
                        onChange={(e) => setBonusForm({...bonusForm, year: parseInt(e.target.value)})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {Array.from({length: 3}, (_, i) => {
                          const year = new Date().getFullYear() - i
                          return <option key={year} value={year}>{year}</option>
                        })}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={bonusForm.description}
                      onChange={(e) => setBonusForm({...bonusForm, description: e.target.value})}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex gap-3 pt-4 border-t">
                    <Button onClick={() => { setShowAddModal(false); resetForms(); }} variant="outline" className="flex-1">
                      Cancel
                    </Button>
                    <Button onClick={handleAddBonus} className="flex-1 bg-blue-600 hover:bg-blue-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Bonus
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
