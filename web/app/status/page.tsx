'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Bot, 
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Activity,
  Server,
  Database,
  Globe,
  Zap,
  Clock
} from 'lucide-react'

export default function StatusPage() {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const services = [
    {
      name: 'API Services',
      status: 'operational',
      uptime: '99.99%',
      responseTime: '45ms',
      icon: Server,
      description: 'Core API endpoints and webhooks'
    },
    {
      name: 'Web Dashboard',
      status: 'operational',
      uptime: '100%',
      responseTime: '120ms',
      icon: Globe,
      description: 'Main web application'
    },
    {
      name: 'Database',
      status: 'operational',
      uptime: '99.98%',
      responseTime: '12ms',
      icon: Database,
      description: 'PostgreSQL database cluster'
    },
    {
      name: 'Workflow Engine',
      status: 'operational',
      uptime: '99.95%',
      responseTime: '340ms',
      icon: Zap,
      description: 'n8n automation execution'
    },
    {
      name: 'WhatsApp Integration',
      status: 'operational',
      uptime: '99.97%',
      responseTime: '580ms',
      icon: Activity,
      description: 'WhatsApp Business API'
    },
    {
      name: 'Email Service',
      status: 'operational',
      uptime: '99.99%',
      responseTime: '230ms',
      icon: Activity,
      description: 'SMTP and email delivery'
    },
  ]

  const incidents = [
    {
      date: 'Jan 10, 2025',
      time: '14:30 IST',
      title: 'Resolved: Brief API Slowdown',
      status: 'resolved',
      description: 'We experienced a brief slowdown in API response times. The issue has been identified and resolved.',
      duration: '12 minutes'
    },
    {
      date: 'Jan 5, 2025',
      time: '10:15 IST',
      title: 'Scheduled Maintenance Completed',
      status: 'completed',
      description: 'Database optimization and security updates were successfully applied.',
      duration: '1 hour'
    },
  ]

  const upcomingMaintenance = [
    {
      date: 'Jan 20, 2025',
      time: '02:00 - 03:00 IST',
      title: 'Scheduled Database Backup',
      description: 'Routine database backup maintenance. No service interruption expected.',
      impact: 'None'
    },
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'operational':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-4 w-4 mr-1" />
            Operational
          </span>
        )
      case 'degraded':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            <AlertTriangle className="h-4 w-4 mr-1" />
            Degraded
          </span>
        )
      case 'down':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            <AlertCircle className="h-4 w-4 mr-1" />
            Down
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Astric.ai</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" asChild>
                <Link href="/">Home</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-br from-green-600 to-emerald-600">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center justify-center h-16 w-16 bg-white/20 backdrop-blur-sm rounded-full mb-4">
            <CheckCircle className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            All Systems Operational
          </h1>
          <p className="text-xl text-green-100 max-w-2xl mx-auto mb-6">
            Astric.ai services are running smoothly. Check system status and uptime below.
          </p>
          <div className="flex items-center justify-center space-x-2 text-green-100">
            <Clock className="h-5 w-5" />
            <span>Last updated: {currentTime.toLocaleString()}</span>
          </div>
        </div>
      </section>

      {/* Overall Status */}
      <section className="py-8 bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">99.98%</div>
                    <p className="text-sm text-gray-600">Overall Uptime</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">185ms</div>
                    <p className="text-sm text-gray-600">Avg Response Time</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600 mb-2">6/6</div>
                    <p className="text-sm text-gray-600">Services Online</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-600 mb-2">0</div>
                    <p className="text-sm text-gray-600">Active Incidents</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Service Status */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Service Status
            </h2>

            <div className="space-y-4">
              {services.map((service, index) => (
                <Card key={index} className="hover:shadow-md transition-all">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <service.icon className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{service.name}</CardTitle>
                          <CardDescription>{service.description}</CardDescription>
                        </div>
                      </div>
                      {getStatusBadge(service.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Uptime (30 days)</p>
                        <p className="text-lg font-semibold text-gray-900">{service.uptime}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Response Time</p>
                        <p className="text-lg font-semibold text-gray-900">{service.responseTime}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Status</p>
                        <p className="text-lg font-semibold text-green-600">Healthy</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Past Incidents */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Incident History
            </h2>

            {incidents.length > 0 ? (
              <div className="space-y-4">
                {incidents.map((incident, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <CardTitle className="text-lg">{incident.title}</CardTitle>
                          </div>
                          <CardDescription>
                            {incident.date} at {incident.time} • Duration: {incident.duration}
                          </CardDescription>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {incident.status}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">{incident.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <p className="text-gray-600">No incidents reported in the last 90 days</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>

      {/* Upcoming Maintenance */}
      <section className="py-16 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Scheduled Maintenance
            </h2>

            {upcomingMaintenance.length > 0 ? (
              <div className="space-y-4">
                {upcomingMaintenance.map((maintenance, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <Clock className="h-5 w-5 text-blue-600" />
                            <CardTitle className="text-lg">{maintenance.title}</CardTitle>
                          </div>
                          <CardDescription>
                            {maintenance.date} • {maintenance.time}
                          </CardDescription>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Scheduled
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 mb-2">{maintenance.description}</p>
                      <p className="text-sm text-gray-500">
                        Expected Impact: <span className="font-medium">{maintenance.impact}</span>
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <p className="text-gray-600">No scheduled maintenance at this time</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>

      {/* Subscribe to Updates */}
      <section className="py-16 bg-gradient-to-br from-blue-600 to-purple-600">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Subscribe to Status Updates
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Get notified about incidents and scheduled maintenance
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary">
                Subscribe via Email
              </Button>
              <Button size="lg" variant="outline" className="bg-white/10 text-white border-white hover:bg-white hover:text-blue-600">
                RSS Feed
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="h-6 w-6 bg-gradient-to-br from-blue-600 to-purple-600 rounded flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <span className="text-lg font-bold">Astric.ai</span>
              </div>
              <p className="text-gray-400">
                Your Business Automations - Empowering SMEs worldwide.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/help" className="hover:text-white">Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact Us</Link></li>
                <li><Link href="/status" className="hover:text-white">Status</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/#features" className="hover:text-white">Features</Link></li>
                <li><Link href="/about" className="hover:text-white">About Us</Link></li>
                <li><Link href="#" className="hover:text-white">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/about" className="hover:text-white">Mission & Vision</Link></li>
                <li><Link href="/privacy" className="hover:text-white">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-white">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Astric.ai. All rights reserved. Made with ⚡ in India 🇮🇳 for the World 🌍</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

