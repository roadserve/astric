'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Download,
  FileText,
  BarChart3,
  DollarSign,
  Users,
  Calendar,
  Shield,
  TrendingUp
} from 'lucide-react'

export default function PayrollReportsPage() {
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [stats, setStats] = useState({
    totalEmployees: 0,
    totalPayroll: 0,
    totalEPF: 0,
    totalESI: 0,
    totalTDS: 0,
    totalPT: 0
  })

  useEffect(() => {
    loadStats()
  }, [selectedMonth, selectedYear])

  const loadStats = async () => {
    setLoading(true)
    try {
      const { data: profile } = await supabase.from('profiles').select('id').single()
      const { data: orgMember } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', profile?.id)
        .single()

      const { data: payslips } = await supabase
        .from('payroll_payslips')
        .select('*')
        .eq('organization_id', orgMember?.organization_id)
        .eq('month', selectedMonth)
        .eq('year', selectedYear)

      if (payslips) {
        setStats({
          totalEmployees: payslips.length,
          totalPayroll: payslips.reduce((sum, p) => sum + Number(p.net_salary), 0),
          totalEPF: payslips.reduce((sum, p) => sum + Number(p.epf_employee), 0),
          totalESI: payslips.reduce((sum, p) => sum + Number(p.esi_employee), 0),
          totalTDS: payslips.reduce((sum, p) => sum + Number(p.tds), 0),
          totalPT: payslips.reduce((sum, p) => sum + Number(p.professional_tax), 0)
        })
      }
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

  const getMonthName = (month: number) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                   'July', 'August', 'September', 'October', 'November', 'December']
    return months[month - 1]
  }

  const reports = [
    {
      title: 'Salary Register',
      description: 'Complete salary register with all components',
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'EPF Report',
      description: 'Employee Provident Fund contribution report',
      icon: Shield,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'ESI Report',
      description: 'Employee State Insurance contribution report',
      icon: Shield,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'TDS Report',
      description: 'Tax Deducted at Source report',
      icon: DollarSign,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      title: 'Professional Tax',
      description: 'Professional tax deduction report',
      icon: DollarSign,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'Attendance Report',
      description: 'Monthly attendance summary',
      icon: Calendar,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    },
    {
      title: 'Leave Report',
      description: 'Leave balance and usage report',
      icon: Calendar,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50'
    },
    {
      title: 'Department-wise Report',
      description: 'Payroll breakdown by department',
      icon: Users,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50'
    },
    {
      title: 'Loan Report',
      description: 'Employee loans and repayment status',
      icon: DollarSign,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      title: 'Overtime Report',
      description: 'Overtime hours and payments',
      icon: TrendingUp,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50'
    },
    {
      title: 'Bonus Report',
      description: 'Bonuses and incentives report',
      icon: TrendingUp,
      color: 'text-lime-600',
      bgColor: 'bg-lime-50'
    },
    {
      title: 'Form 16',
      description: 'Annual tax certificate for employees',
      icon: FileText,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50'
    }
  ]

  const months = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: getMonthName(i + 1) }))
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Compliance</h1>
          <p className="text-gray-600 mt-1">Payroll reports and statutory compliance</p>
        </div>
      </div>

      {/* Period Selector */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Select Period</CardTitle>
        </CardHeader>
        <CardContent>
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
              <Button onClick={loadStats} className="w-full bg-blue-600 hover:bg-blue-700">
                <BarChart3 className="h-4 w-4 mr-2" />
                Load Reports
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payroll</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(stats.totalPayroll)}</div>
            <p className="text-xs text-gray-500 mt-1">{stats.totalEmployees} employees</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">EPF Contribution</CardTitle>
            <Shield className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalEPF)}</div>
            <p className="text-xs text-gray-500 mt-1">Employee contribution</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ESI Contribution</CardTitle>
            <Shield className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{formatCurrency(stats.totalESI)}</div>
            <p className="text-xs text-gray-500 mt-1">Employee contribution</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">TDS Deducted</CardTitle>
            <DollarSign className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(stats.totalTDS)}</div>
            <p className="text-xs text-gray-500 mt-1">Tax deducted at source</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Professional Tax</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{formatCurrency(stats.totalPT)}</div>
            <p className="text-xs text-gray-500 mt-1">State tax</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEmployees}</div>
            <p className="text-xs text-gray-500 mt-1">Active employees</p>
          </CardContent>
        </Card>
      </div>

      {/* Available Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Available Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {reports.map((report, index) => {
              const Icon = report.icon
              return (
                <div
                  key={index}
                  className="p-6 border border-gray-200 rounded-lg hover:shadow-lg transition-all cursor-pointer"
                >
                  <div className={`w-12 h-12 ${report.bgColor} rounded-lg flex items-center justify-center mb-4`}>
                    <Icon className={`h-6 w-6 ${report.color}`} />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{report.title}</h3>
                  <p className="text-sm text-gray-600 mb-4">{report.description}</p>
                  <Button variant="outline" size="sm" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Generate
                  </Button>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Compliance Checklist */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Compliance Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-green-600" />
                <div>
                  <h4 className="font-semibold text-gray-900">EPF Filing</h4>
                  <p className="text-sm text-gray-600">Monthly EPF return filing</p>
                </div>
              </div>
              <span className="px-3 py-1 text-sm font-medium bg-green-100 text-green-800 rounded-full">
                Ready
              </span>
            </div>

            <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-green-600" />
                <div>
                  <h4 className="font-semibold text-gray-900">ESI Filing</h4>
                  <p className="text-sm text-gray-600">Monthly ESI return filing</p>
                </div>
              </div>
              <span className="px-3 py-1 text-sm font-medium bg-green-100 text-green-800 rounded-full">
                Ready
              </span>
            </div>

            <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-green-600" />
                <div>
                  <h4 className="font-semibold text-gray-900">TDS Filing</h4>
                  <p className="text-sm text-gray-600">Quarterly TDS return filing</p>
                </div>
              </div>
              <span className="px-3 py-1 text-sm font-medium bg-green-100 text-green-800 rounded-full">
                Ready
              </span>
            </div>

            <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-green-600" />
                <div>
                  <h4 className="font-semibold text-gray-900">Professional Tax</h4>
                  <p className="text-sm text-gray-600">Monthly PT payment</p>
                </div>
              </div>
              <span className="px-3 py-1 text-sm font-medium bg-green-100 text-green-800 rounded-full">
                Ready
              </span>
            </div>

            <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-blue-600" />
                <div>
                  <h4 className="font-semibold text-gray-900">Form 16</h4>
                  <p className="text-sm text-gray-600">Annual tax certificate for employees</p>
                </div>
              </div>
              <span className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">
                Annual
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
