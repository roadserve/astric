import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Receipt, 
  Users, 
  Smartphone, 
  BarChart3, 
  Bot, 
  Shield,
  ArrowRight,
  CheckCircle,
  Zap
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Astric.ai</span>
            </div>
            <div className="flex items-center space-x-4">
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
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Your
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Business Automations</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Astric.ai is an intelligent business automation platform that empowers SMEs to automate workflows, manage CRM, and scale operations effortlessly. With AI-powered tools and 60+ integrations, transform repetitive tasks into automated workflows in minutes—no coding required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/register">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#features">Learn More</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Key Features Highlight */}
      <section className="py-16 bg-gradient-to-br from-blue-600 to-purple-600">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Powerful Features for Modern Businesses
            </h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Everything you need to automate, manage, and grow your business—all in one platform
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 transition-all">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="h-16 w-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
                    <Zap className="h-8 w-8 text-yellow-300" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">60+</h3>
                  <p className="text-blue-100">Integrations</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 transition-all">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="h-16 w-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
                    <Bot className="h-8 w-8 text-purple-300" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">AI-Powered</h3>
                  <p className="text-blue-100">Smart Automation</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 transition-all">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="h-16 w-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="h-8 w-8 text-green-300" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">99.98%</h3>
                  <p className="text-blue-100">Uptime SLA</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 transition-all">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="h-16 w-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
                    <Shield className="h-8 w-8 text-blue-300" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Secure</h3>
                  <p className="text-blue-100">Bank-Grade Encryption</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Zap className="h-4 w-4" />
              <span>Complete Feature Set</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Run Your Business
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From workflow automation to AI-powered insights, we've got you covered.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Visual Workflow Builder */}
            <Card className="hover:shadow-lg transition-shadow border-2 border-blue-100">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <Zap className="h-8 w-8 text-blue-600" />
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">Popular</span>
                </div>
                <CardTitle>Visual Workflow Builder</CardTitle>
                <CardDescription>
                  Create powerful automations with drag-and-drop—no coding required.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    Drag-and-drop interface
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    Pre-built templates
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    Real-time execution
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    Version control & rollback
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* 60+ Integrations */}
            <Card className="hover:shadow-lg transition-shadow border-2 border-purple-100">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <Bot className="h-8 w-8 text-purple-600" />
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">60+ Apps</span>
                </div>
                <CardTitle>Powerful Integrations</CardTitle>
                <CardDescription>
                  Connect with your favorite tools and automate across platforms.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    WhatsApp, Email, SMS
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    AI (OpenAI, Claude, Gemini)
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    Databases & Cloud Storage
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    Payment gateways & CRMs
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* WhatsApp Business */}
            <Card className="hover:shadow-lg transition-shadow border-2 border-green-100">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <Smartphone className="h-8 w-8 text-green-600" />
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">Popular</span>
                </div>
                <CardTitle>WhatsApp Automation</CardTitle>
                <CardDescription>
                  Automate customer communications and marketing campaigns.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    Bulk messaging campaigns
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    Auto-replies & chatbots
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    Template messages
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    Delivery tracking & analytics
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Smart CRM */}
            <Card className="hover:shadow-lg transition-shadow border-2 border-orange-100">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <Users className="h-8 w-8 text-orange-600" />
                </div>
                <CardTitle>Smart CRM</CardTitle>
                <CardDescription>
                  Manage customers, track deals, and automate follow-ups seamlessly.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    Contact & lead management
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    Automated follow-ups
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    Deal pipeline tracking
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    Activity timeline & notes
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Billing Automation */}
            <Card className="hover:shadow-lg transition-shadow border-2 border-teal-100">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <Receipt className="h-8 w-8 text-teal-600" />
                  <span className="text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded-full font-medium">GST Ready</span>
                </div>
                <CardTitle>Billing Automation</CardTitle>
                <CardDescription>
                  Automate invoicing, payments, and GST compliance effortlessly.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    Auto invoice generation
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    Payment reminders
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    GST calculation & reports
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    Expense tracking
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Analytics & Reporting */}
            <Card className="hover:shadow-lg transition-shadow border-2 border-indigo-100">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <BarChart3 className="h-8 w-8 text-indigo-600" />
                  <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-medium">Real-time</span>
                </div>
                <CardTitle>Analytics & Insights</CardTitle>
                <CardDescription>
                  Track workflow performance and business metrics in real-time.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    Workflow execution logs
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    Success rate tracking
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    Performance metrics
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    Custom dashboards
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Automate Your Business?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of businesses already using Astric.ai to automate workflows and scale operations effortlessly.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/register">
              Get Started Today
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
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
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#" className="hover:text-white">Features</Link></li>
                <li><Link href="#" className="hover:text-white">Pricing</Link></li>
                <li><Link href="#" className="hover:text-white">API</Link></li>
              </ul>
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
