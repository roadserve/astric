'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Plus, 
  Search, 
  Calendar,
  UserCheck,
  UserX,
  Clock,
  Download,
  Upload
} from 'lucide-react'

export default function AttendancePage() {
  const supabase = createClientComponentClient()
  const [attendance, setAttendance] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [showMarkModal, setShowMarkModal] = useState(false)

  useEffect(() => {
    loadAttendance()
    loadEmployees()
  }, [selectedDate])

  const loadAttendance = async () => {
    setLoading(true)
    try {
      const { data: profile } = await supabase.from('profiles').select('id').single()
      const { data: orgMember } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', profile?.id)
        .single()

      const { data, error } = await supabase
        .from('payroll_attendance')
        .select(`*, employee:payroll_employees(first_name, last_name, employee_code)`)
        .eq('organization_id', orgMember?.organization_id)
        .eq('attendance_date', selectedDate)

      if (error) throw error
      setAttendance(data || [])
    } catch (error) {
      console.error('Error loading attendance:', error)
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

  const handleMarkAttendance = async (employeeId: string, status: string) => {
    try {
      const { data: profile } = await supabase.from('profiles').select('id').single()
      const { data: orgMember } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', profile?.id)
        .single()

      const { error } = await supabase
        .from('payroll_attendance')
        .upsert({
          organization_id: orgMember?.organization_id,
          employee_id: employeeId,
          attendance_date: selectedDate,
          status,
          regular_hours: status === 'present' ? 8 : status === 'half_day' ? 4 : 0
        })

      if (error) throw error
      loadAttendance()
    } catch (error) {
      console.error('Error marking attendance:', error)
    }
  }

  const handleBulkMarkPresent = async () => {
    try {
      const { data: profile } = await supabase.from('profiles').select('id').single()
      const { data: orgMember } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', profile?.id)
        .single()

      const records = employees.map(emp => ({
        organization_id: orgMember?.organization_id,
        employee_id: emp.id,
        attendance_date: selectedDate,
        status: 'present',
        regular_hours: 8
      }))

      const { error } = await supabase.from('payroll_attendance').upsert(records)
      if (error) throw error
      alert('All employees marked present!')
      loadAttendance()
    } catch (error) {
      console.error('Error bulk marking:', error)
    }
  }

  const stats = {
    total: employees.length,
    present: attendance.filter(a => a.status === 'present').length,
    absent: attendance.filter(a => a.status === 'absent').length,
    onLeave: attendance.filter(a => a.status === 'leave').length,
    halfDay: attendance.filter(a => a.status === 'half_day').length
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      present: { color: 'bg-green-100 text-green-800', label: 'Present' },
      absent: { color: 'bg-red-100 text-red-800', label: 'Absent' },
      leave: { color: 'bg-blue-100 text-blue-800', label: 'On Leave' },
      half_day: { color: 'bg-yellow-100 text-yellow-800', label: 'Half Day' },
      holiday: { color: 'bg-purple-100 text-purple-800', label: 'Holiday' }
    }
    return badges[status as keyof typeof badges] || badges.absent
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Attendance</h1>
          <p className="text-gray-600 mt-1">Track daily attendance</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline"><Upload className="h-4 w-4 mr-2" />Import</Button>
          <Button variant="outline"><Download className="h-4 w-4 mr-2" />Export</Button>
          <Button onClick={handleBulkMarkPresent} className="bg-green-600 hover:bg-green-700">
            <UserCheck className="h-4 w-4 mr-2" />Mark All Present
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-5 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <UserCheck className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.present}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent</CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Leave</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.onLeave}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Half Day</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.halfDay}</div>
          </CardContent>
        </Card>
      </div>

      {/* Date Selector */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Date:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Attendance List */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check In</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check Out</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {employees.map((employee) => {
                  const record = attendance.find(a => a.employee_id === employee.id)
                  const statusBadge = getStatusBadge(record?.status || 'absent')
                  
                  return (
                    <tr key={employee.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {employee.first_name} {employee.last_name}
                        </div>
                        <div className="text-xs text-gray-500">{employee.employee_code}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusBadge.color}`}>
                          {statusBadge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record?.check_in_time ? new Date(record.check_in_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record?.check_out_time ? new Date(record.check_out_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record?.total_hours || 0} hrs
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleMarkAttendance(employee.id, 'present')}
                            className="text-green-600"
                          >
                            Present
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleMarkAttendance(employee.id, 'absent')}
                            className="text-red-600"
                          >
                            Absent
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleMarkAttendance(employee.id, 'half_day')}
                            className="text-yellow-600"
                          >
                            Half Day
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
