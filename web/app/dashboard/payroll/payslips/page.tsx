'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Search, 
  Download,
  Mail,
  Eye,
  FileText,
  Calendar,
  DollarSign,
  Users
} from 'lucide-react'

export default function PayslipsPage() {
  const supabase = createClientComponentClient()
  const [payslips, setPayslips] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedPayslip, setSelectedPayslip] = useState<any>(null)
  const [showViewModal, setShowViewModal] = useState(false)

  useEffect(() => {
    loadPayslips()
  }, [selectedMonth, selectedYear])

  const loadPayslips = async () => {
    setLoading(true)
    try {
      const { data: profile } = await supabase.from('profiles').select('id').single()
      const { data: orgMember } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', profile?.id)
        .single()

      const { data, error } = await supabase
        .from('payroll_payslips')
        .select(`
          *,
          employee:payroll_employees(first_name, last_name, employee_code, department, designation, bank_account_number, bank_ifsc_code, pan_number)
        `)
        .eq('organization_id', orgMember?.organization_id)
        .eq('month', selectedMonth)
        .eq('year', selectedYear)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPayslips(data || [])
    } catch (error) {
      console.error('Error loading payslips:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewPayslip = (payslip: any) => {
    setSelectedPayslip(payslip)
    setShowViewModal(true)
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

  const filteredPayslips = payslips.filter(payslip => {
    const employeeName = `${payslip.employee?.first_name} ${payslip.employee?.last_name}`.toLowerCase()
    const employeeCode = payslip.employee?.employee_code?.toLowerCase() || ''
    return employeeName.includes(searchTerm.toLowerCase()) || 
           employeeCode.includes(searchTerm.toLowerCase())
  })

  const stats = {
    total: payslips.length,
    totalGross: payslips.reduce((sum, p) => sum + Number(p.gross_salary), 0),
    totalDeductions: payslips.reduce((sum, p) => sum + Number(p.total_deductions), 0),
    totalNet: payslips.reduce((sum, p) => sum + Number(p.net_salary), 0)
  }

  const months = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: getMonthName(i + 1) }))
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payslips</h1>
          <p className="text-gray-600 mt-1">View and download employee payslips</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export All
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payslips</CardTitle>
            <FileText className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gross Salary</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalGross)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deductions</CardTitle>
            <DollarSign className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(stats.totalDeductions)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Salary</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(stats.totalNet)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by employee name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {months.map(month => (
                <option key={month.value} value={month.value}>{month.label}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Payslips List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading payslips...</div>
          ) : filteredPayslips.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No payslips found</h3>
              <p className="text-gray-600">Process payroll to generate payslips</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gross</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deductions</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Net Salary</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPayslips.map((payslip) => (
                    <tr key={payslip.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {payslip.employee?.first_name} {payslip.employee?.last_name}
                          </div>
                          <div className="text-xs text-gray-500">{payslip.employee?.employee_code}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getMonthName(payslip.month)} {payslip.year}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payslip.paid_days}/{payslip.total_working_days}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                        {formatCurrency(Number(payslip.gross_salary))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                        {formatCurrency(Number(payslip.total_deductions))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">
                        {formatCurrency(Number(payslip.net_salary))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          payslip.payment_status === 'paid' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {payslip.payment_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleViewPayslip(payslip)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Mail className="h-4 w-4" />
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

      {/* View Payslip Modal */}
      {showViewModal && selectedPayslip && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <Card className="w-full max-w-4xl my-8">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle>Payslip - {getMonthName(selectedPayslip.month)} {selectedPayslip.year}</CardTitle>
                <Button variant="ghost" onClick={() => setShowViewModal(false)}>✕</Button>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              {/* Company & Employee Info */}
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Company Information</h3>
                  <p className="text-sm text-gray-600">Your Company Name</p>
                  <p className="text-sm text-gray-600">Address Line 1</p>
                  <p className="text-sm text-gray-600">City, State - Pincode</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Employee Information</h3>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Name:</span> {selectedPayslip.employee?.first_name} {selectedPayslip.employee?.last_name}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Code:</span> {selectedPayslip.employee?.employee_code}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Department:</span> {selectedPayslip.employee?.department}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Designation:</span> {selectedPayslip.employee?.designation}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">PAN:</span> {selectedPayslip.employee?.pan_number}
                  </p>
                </div>
              </div>

              {/* Attendance Summary */}
              <div className="mb-8">
                <h3 className="font-semibold text-gray-900 mb-4">Attendance Summary</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-xs text-gray-600">Total Days</p>
                    <p className="text-lg font-semibold">{selectedPayslip.total_working_days}</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded">
                    <p className="text-xs text-gray-600">Present</p>
                    <p className="text-lg font-semibold text-green-600">{selectedPayslip.days_present}</p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded">
                    <p className="text-xs text-gray-600">Leave</p>
                    <p className="text-lg font-semibold text-blue-600">{selectedPayslip.days_on_leave}</p>
                  </div>
                  <div className="bg-red-50 p-3 rounded">
                    <p className="text-xs text-gray-600">Absent</p>
                    <p className="text-lg font-semibold text-red-600">{selectedPayslip.days_absent}</p>
                  </div>
                </div>
              </div>

              {/* Earnings & Deductions */}
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Earnings</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Basic Salary</span>
                      <span className="font-medium">{formatCurrency(Number(selectedPayslip.basic_salary))}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">HRA</span>
                      <span className="font-medium">{formatCurrency(Number(selectedPayslip.hra))}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Conveyance</span>
                      <span className="font-medium">{formatCurrency(Number(selectedPayslip.conveyance_allowance))}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Medical</span>
                      <span className="font-medium">{formatCurrency(Number(selectedPayslip.medical_allowance))}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Special Allowance</span>
                      <span className="font-medium">{formatCurrency(Number(selectedPayslip.special_allowance))}</span>
                    </div>
                    {Number(selectedPayslip.overtime_amount) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Overtime</span>
                        <span className="font-medium">{formatCurrency(Number(selectedPayslip.overtime_amount))}</span>
                      </div>
                    )}
                    {Number(selectedPayslip.bonus) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Bonus</span>
                        <span className="font-medium">{formatCurrency(Number(selectedPayslip.bonus))}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-semibold pt-2 border-t">
                      <span className="text-gray-900">Gross Salary</span>
                      <span className="text-green-600">{formatCurrency(Number(selectedPayslip.gross_salary))}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Deductions</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">EPF</span>
                      <span className="font-medium">{formatCurrency(Number(selectedPayslip.epf_employee))}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">ESI</span>
                      <span className="font-medium">{formatCurrency(Number(selectedPayslip.esi_employee))}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Professional Tax</span>
                      <span className="font-medium">{formatCurrency(Number(selectedPayslip.professional_tax))}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">TDS</span>
                      <span className="font-medium">{formatCurrency(Number(selectedPayslip.tds))}</span>
                    </div>
                    {Number(selectedPayslip.loan_emi) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Loan EMI</span>
                        <span className="font-medium">{formatCurrency(Number(selectedPayslip.loan_emi))}</span>
                      </div>
                    )}
                    {Number(selectedPayslip.loss_of_pay) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Loss of Pay</span>
                        <span className="font-medium">{formatCurrency(Number(selectedPayslip.loss_of_pay))}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-semibold pt-2 border-t">
                      <span className="text-gray-900">Total Deductions</span>
                      <span className="text-red-600">{formatCurrency(Number(selectedPayslip.total_deductions))}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Salary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Net Salary</span>
                  <span className="text-3xl font-bold text-blue-600">
                    {formatCurrency(Number(selectedPayslip.net_salary))}
                  </span>
                </div>
              </div>

              {/* Bank Details */}
              <div className="mt-8 pt-8 border-t">
                <h3 className="font-semibold text-gray-900 mb-4">Bank Details</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Account Number:</span>
                    <span className="ml-2 font-medium">{selectedPayslip.employee?.bank_account_number || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">IFSC Code:</span>
                    <span className="ml-2 font-medium">{selectedPayslip.employee?.bank_ifsc_code || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-8 flex gap-4">
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                <Button variant="outline" className="flex-1">
                  <Mail className="h-4 w-4 mr-2" />
                  Email to Employee
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
