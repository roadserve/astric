'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Plus, 
  Search, 
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp
} from 'lucide-react'

export default function LeavesPage() {
  const supabase = createClientComponentClient()
  const [leaves, setLeaves] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')

  const [formData, setFormData] = useState({
    employee_id: '',
    leave_type: 'casual',
    from_date: '',
    to_date: '',
    total_days: 0,
    reason: ''
  })

  useEffect(() => {
    loadLeaves()
    loadEmployees()
  }, [])

  const loadLeaves = async () => {
    setLoading(true)
    try {
      const { data: profile } = await supabase.from('profiles').select('id').single()
      const { data: orgMember } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', profile?.id)
        .single()

      const { data, error } = await supabase
        .from('payroll_leaves')
        .select(`*, employee:payroll_employees(first_name, last_name, employee_code)`)
        .eq('organization_id', orgMember?.organization_id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setLeaves(data || [])
    } catch (error) {
      console.error('Error loading leaves:', error)
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

  const handleApplyLeave = async () => {
    if (!formData.employee_id || !formData.from_date || !formData.to_date) {
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
        .from('payroll_leaves')
        .insert({
          organization_id: orgMember?.organization_id,
          ...formData
        })

      if (error) throw error
      alert('Leave applied successfully!')
      setShowApplyModal(false)
      resetForm()
      loadLeaves()
    } catch (error) {
      console.error('Error applying leave:', error)
    }
  }

  const handleApproveReject = async (leaveId: string, status: string) => {
    try {
      const { data: profile } = await supabase.from('profiles').select('id').single()
      
      const { error } = await supabase
        .from('payroll_leaves')
        .update({
          status,
          approved_by: profile?.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', leaveId)

      if (error) throw error
      loadLeaves()
    } catch (error) {
      console.error('Error updating leave:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      employee_id: '',
      leave_type: 'casual',
      from_date: '',
      to_date: '',
      total_days: 0,
      reason: ''
    })
  }

  useEffect(() => {
    if (formData.from_date && formData.to_date) {
      const from = new Date(formData.from_date)
      const to = new Date(formData.to_date)
      const days = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1
      setFormData(prev => ({ ...prev, total_days: days }))
    }
  }, [formData.from_date, formData.to_date])

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const filteredLeaves = leaves.filter(leave => 
    filterStatus === 'all' || leave.status === filterStatus
  )

  const stats = {
    total: leaves.length,
    pending: leaves.filter(l => l.status === 'pending').length,
    approved: leaves.filter(l => l.status === 'approved').length,
    rejected: leaves.filter(l => l.status === 'rejected').length
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending', icon: Clock },
      approved: { color: 'bg-green-100 text-green-800', label: 'Approved', icon: CheckCircle },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected', icon: XCircle },
      cancelled: { color: 'bg-gray-100 text-gray-800', label: 'Cancelled', icon: XCircle }
    }
    return badges[status as keyof typeof badges] || badges.pending
  }

  const leaveTypes = [
    { value: 'casual', label: 'Casual Leave' },
    { value: 'sick', label: 'Sick Leave' },
    { value: 'earned', label: 'Earned Leave' },
    { value: 'unpaid', label: 'Unpaid Leave' },
    { value: 'maternity', label: 'Maternity Leave' },
    { value: 'paternity', label: 'Paternity Leave' }
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leave Management</h1>
          <p className="text-gray-600 mt-1">Manage leave requests</p>
        </div>
        <Button onClick={() => setShowApplyModal(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Apply Leave
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Calendar className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </CardContent>
      </Card>

      {/* Leaves List */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">From</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">To</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLeaves.map((leave) => {
                  const statusBadge = getStatusBadge(leave.status)
                  const StatusIcon = statusBadge.icon
                  
                  return (
                    <tr key={leave.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {leave.employee?.first_name} {leave.employee?.last_name}
                        </div>
                        <div className="text-xs text-gray-500">{leave.employee?.employee_code}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          {leave.leave_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(leave.from_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(leave.to_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {leave.total_days}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                        {leave.reason}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${statusBadge.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {statusBadge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {leave.status === 'pending' && (
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleApproveReject(leave.id, 'approved')}
                              className="text-green-600"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleApproveReject(leave.id, 'rejected')}
                              className="text-red-600"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Apply Leave Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>Apply Leave</CardTitle>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Leave Type *</label>
                <select
                  value={formData.leave_type}
                  onChange={(e) => setFormData({...formData, leave_type: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {leaveTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">From Date *</label>
                  <input
                    type="date"
                    value={formData.from_date}
                    onChange={(e) => setFormData({...formData, from_date: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">To Date *</label>
                  <input
                    type="date"
                    value={formData.to_date}
                    onChange={(e) => setFormData({...formData, to_date: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Total Days</label>
                <input
                  type="number"
                  value={formData.total_days}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 font-semibold"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason *</label>
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
                <Button onClick={handleApplyLeave} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Apply Leave
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
