'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { 
  Users,
  DollarSign,
  Calendar,
  FileText,
  TrendingUp,
  Clock,
  Award,
  Shield,
  CreditCard,
  BarChart3,
  UserCheck,
  Briefcase
} from 'lucide-react'

export default function PayrollDashboard() {
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    totalPayroll: 0,
    pendingLeaves: 0,
    presentToday: 0,
    onLeaveToday: 0
  })

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    setLoading(true)
    try {
      const { data: profile } = await supabase.from('profiles').select('id').single()
      const { data: orgMember } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', profile?.id)
        .single()

      const orgId = orgMember?.organization_id

      // Get employee stats
      const { data: employees } = await supabase
        .from('payroll_employees')
        .select('*')
        .eq('organization_id', orgId)

      const activeEmployees = employees?.filter(e => e.status === 'active') || []

      // Get current month payroll
      const currentMonth = new Date().getMonth() + 1
      const currentYear = new Date().getFullYear()

      const { data: payslips } = await supabase
        .from('payroll_payslips')
        .select('net_salary')
        .eq('organization_id', orgId)
        .eq('month', currentMonth)
        .eq('year', currentYear)

      const totalPayroll = payslips?.reduce((sum, p) => sum + Number(p.net_salary), 0) || 0

      // Get pending leaves
      const { data: leaves } = await supabase
        .from('payroll_leaves')
        .select('*')
        .eq('organization_id', orgId)
        .eq('status', 'pending')

      // Get today's attendance
      const today = new Date().toISOString().split('T')[0]
      const { data: attendance } = await supabase
        .from('payroll_attendance')
        .select('*')
        .eq('organization_id', orgId)
        .eq('attendance_date', today)

      const presentToday = attendance?.filter(a => a.status === 'present').length || 0
      const onLeaveToday = attendance?.filter(a => a.status === 'leave').length || 0

      setStats({
        totalEmployees: employees?.length || 0,
        activeEmployees: activeEmployees.length,
        totalPayroll,
        pendingLeaves: leaves?.length || 0,
        presentToday,
        onLeaveToday
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  const modules = [
    {
      title: 'Employees',
      description: 'Manage employee data',
      icon: Users,
      href: '/dashboard/payroll/employees',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Salary Structure',
      description: 'Configure salary components',
      icon: DollarSign,
      href: '/dashboard/payroll/salary',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Attendance',
      description: 'Track daily attendance',
      icon: UserCheck,
      href: '/dashboard/payroll/attendance',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Leave Management',
      description: 'Manage leave requests',
      icon: Calendar,
      href: '/dashboard/payroll/leaves',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'Process Payroll',
      description: 'Run monthly payroll',
      icon: CreditCard,
      href: '/dashboard/payroll/process',
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      title: 'Payslips',
      description: 'View & download payslips',
      icon: FileText,
      href: '/dashboard/payroll/payslips',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    },
    {
      title: 'Loans & Advances',
      description: 'Manage employee loans',
      icon: Briefcase,
      href: '/dashboard/payroll/loans',
      color: 'text-pink-600',
      bgColor: 'bg-pink-50'
    },
    {
      title: 'Overtime',
      description: 'Track overtime hours',
      icon: Clock,
      href: '/dashboard/payroll/overtime',
      color: 'text-teal-600',
      bgColor: 'bg-teal-50'
    },
    {
      title: 'Bonuses',
      description: 'Manage bonuses & incentives',
      icon: Award,
      href: '/dashboard/payroll/bonuses',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      title: 'Tax Compliance',
      description: 'TDS, EPF, ESI reports',
      icon: Shield,
      href: '/dashboard/payroll/compliance',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50'
    },
    {
      title: 'Reports',
      description: 'Payroll analytics',
      icon: BarChart3,
      href: '/dashboard/payroll/reports',
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Payroll Management</h1>
        <p className="text-gray-600 mt-1">Complete payroll solution with compliance</p>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEmployees}</div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.activeEmployees} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month Payroll</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.totalPayroll)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present Today</CardTitle>
            <UserCheck className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.presentToday}</div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.onLeaveToday} on leave
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Leaves</CardTitle>
            <Calendar className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pendingLeaves}</div>
            <p className="text-xs text-gray-500 mt-1">Awaiting approval</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <Link href="/dashboard/payroll/employees">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                <Users className="h-4 w-4 mr-2" />
                Add Employee
              </Button>
            </Link>
            <Link href="/dashboard/payroll/attendance">
              <Button className="w-full bg-purple-600 hover:bg-purple-700">
                <UserCheck className="h-4 w-4 mr-2" />
                Mark Attendance
              </Button>
            </Link>
            <Link href="/dashboard/payroll/process">
              <Button className="w-full bg-green-600 hover:bg-green-700">
                <CreditCard className="h-4 w-4 mr-2" />
                Process Payroll
              </Button>
            </Link>
            <Link href="/dashboard/payroll/reports">
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
                <BarChart3 className="h-4 w-4 mr-2" />
                View Reports
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Modules */}
      <Card>
        <CardHeader>
          <CardTitle>Payroll Modules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4">
            {modules.map((module, index) => {
              const Icon = module.icon
              return (
                <Link key={index} href={module.href}>
                  <div className="p-6 border border-gray-200 rounded-lg hover:shadow-lg transition-all cursor-pointer group">
                    <div className={`w-12 h-12 ${module.bgColor} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon className={`h-6 w-6 ${module.color}`} />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">{module.title}</h3>
                    <p className="text-sm text-gray-600">{module.description}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Getting Started */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Getting Started with Payroll</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 font-semibold">1</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Add Employees</h4>
                <p className="text-sm text-gray-600">
                  Start by adding your employees with their personal, employment, and bank details.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-green-600 font-semibold">2</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Configure Salary Structure</h4>
                <p className="text-sm text-gray-600">
                  Set up salary components including basic, allowances, and deductions (EPF, ESI, TDS).
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-purple-600 font-semibold">3</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Track Attendance</h4>
                <p className="text-sm text-gray-600">
                  Mark daily attendance, track working hours, and manage overtime.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-orange-600 font-semibold">4</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Process Monthly Payroll</h4>
                <p className="text-sm text-gray-600">
                  Run payroll processing to generate payslips with automatic calculations.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-red-600 font-semibold">5</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Ensure Compliance</h4>
                <p className="text-sm text-gray-600">
                  Generate EPF, ESI, and TDS reports for statutory compliance.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}