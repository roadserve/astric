'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { 
  LayoutDashboard, 
  Receipt, 
  Users, 
  Package, 
  Briefcase,
  Calendar,
  MessageSquare,
  Bot,
  BarChart3,
  Building2,
  Shield,
  Settings,
  LogOut,
  Share2,
  Activity,
  Server,
  Database,
  Zap
} from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard', adminOnly: false },
  { icon: Receipt, label: 'Billing', href: '/dashboard/billing', adminOnly: false },
  { icon: Users, label: 'Customers', href: '/dashboard/customers', adminOnly: false },
  { icon: Package, label: 'Products', href: '/dashboard/products', adminOnly: false },
  { icon: Briefcase, label: 'Payroll', href: '/dashboard/payroll', adminOnly: false },
  { icon: Calendar, label: 'Attendance', href: '/dashboard/attendance', adminOnly: false },
  { icon: MessageSquare, label: 'WhatsApp CRM', href: '/dashboard/whatsapp', adminOnly: false },
  { icon: Bot, label: 'AI Copilot', href: '/dashboard/ai-copilot', adminOnly: false },
  { icon: Zap, label: 'Automation', href: '/dashboard/automation', adminOnly: false },
  { icon: BarChart3, label: 'Analytics', href: '/dashboard/analytics', adminOnly: false },
  { icon: Building2, label: 'GMB Management', href: '/dashboard/gmb', adminOnly: false },
  { icon: Share2, label: 'Social Media', href: '/dashboard/social', adminOnly: false },
  { icon: Activity, label: 'Overview', href: '/dashboard/admin', adminOnly: true },
  { icon: Users, label: 'Users', href: '/dashboard/admin/users', adminOnly: true },
  { icon: Shield, label: 'Organizations', href: '/dashboard/admin/organizations', adminOnly: true },
  { icon: Server, label: 'System Health', href: '/dashboard/admin/system', adminOnly: true },
  { icon: Database, label: 'Database', href: '/dashboard/admin/database', adminOnly: true },
  { icon: Settings, label: 'Settings', href: '/dashboard/settings', adminOnly: true },
]

export default function Sidebar() {
  const pathname = usePathname()
  const supabase = createClientComponentClient()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAdminStatus()
  }, [])

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setIsAdmin(false)
        setLoading(false)
        return
      }

      // First, check if user is a system admin (Level 1)
      const { data: systemAdmin } = await supabase
        .from('system_admins')
        .select('id, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle()

      if (systemAdmin) {
        console.log('Sidebar: User is system admin (Level 1)')
        setIsAdmin(true)
        setLoading(false)
        return
      }

      // Level 2: Customer Interface - Organization users (including owners)
      // Only system admins get admin interface
      console.log('Sidebar: User is customer (Level 2)')
      setIsAdmin(false)
    } catch (error) {
      console.error('Error checking admin status:', error)
      setIsAdmin(false)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="flex flex-col h-screen w-64 bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="flex items-center gap-2 p-6 border-b border-gray-200">
        <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <Bot className="h-5 w-5 text-white" />
        </div>
        <span className="text-xl font-bold text-gray-900">AI SME Copilot</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-1">
            {menuItems.map((item) => {
              // If user is admin, only show admin items
              if (isAdmin && !item.adminOnly) {
                return null
              }
              
              // If user is not admin, hide admin items
              if (!isAdmin && item.adminOnly) {
                return null
              }

              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                  {item.adminOnly && (
                    <span className="ml-auto text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                      Admin
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        )}
      </nav>

      {/* Logout */}
      {!loading && (
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 w-full transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      )}
    </div>
  )
}
