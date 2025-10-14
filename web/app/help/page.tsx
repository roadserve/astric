import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { 
  Bot, 
  Search,
  MessageCircle,
  BookOpen,
  Video,
  Mail,
  Phone,
  HelpCircle,
  Zap,
  CreditCard,
  Settings,
  Users,
  FileText,
  ChevronRight
} from 'lucide-react'

export const metadata = {
  title: 'Help Center - Astric.ai Support',
  description: 'Get help with Astric.ai. Browse documentation, tutorials, FAQs, and contact our support team for assistance with business automation.',
}

export default function HelpCenterPage() {
  const popularTopics = [
    {
      icon: Zap,
      title: 'Getting Started',
      description: 'Learn the basics of setting up your first workflow',
      link: '#getting-started',
      color: 'blue'
    },
    {
      icon: Settings,
      title: 'Workflow Builder',
      description: 'Master the visual workflow editor',
      link: '#workflow-builder',
      color: 'purple'
    },
    {
      icon: CreditCard,
      title: 'Billing & Plans',
      description: 'Understand pricing, payments, and subscriptions',
      link: '#billing',
      color: 'green'
    },
    {
      icon: Users,
      title: 'Team Management',
      description: 'Add team members and manage permissions',
      link: '#team',
      color: 'orange'
    },
  ]

  const faqs = [
    {
      question: 'How do I create my first workflow?',
      answer: 'Click on "Dashboard" → "Automation" → "Create Workflow". Choose from templates or start from scratch using our visual builder.'
    },
    {
      question: 'What integrations are available?',
      answer: 'Astric.ai supports 60+ integrations including WhatsApp, Email, SMS, AI tools (OpenAI, Claude), databases, payment gateways, CRMs, and cloud storage.'
    },
    {
      question: 'How much does Astric.ai cost?',
      answer: 'We offer a Free plan with 5 workflows and 100 executions/month. Paid plans start at $29/month for Starter (20 workflows, 1000 executions).'
    },
    {
      question: 'Can I try Astric.ai for free?',
      answer: 'Yes! Our Free plan is forever free with no credit card required. You can upgrade anytime as your business grows.'
    },
    {
      question: 'Is my data secure?',
      answer: 'Absolutely. We use bank-grade encryption, multi-tenant architecture with Row Level Security, and comply with international security standards.'
    },
    {
      question: 'How do I cancel my subscription?',
      answer: 'Go to Settings → Billing → Cancel Subscription. You\'ll retain access until the end of your billing period.'
    },
    {
      question: 'Do you offer refunds?',
      answer: 'Yes! If we don\'t save you at least 20 hours per month, we offer a money-back guarantee within the first 30 days.'
    },
    {
      question: 'Can I export my data?',
      answer: 'Yes. You can export all your data including workflows, executions, and customer data at any time from Settings → Data Export.'
    },
  ]

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
      <section className="py-16 bg-gradient-to-br from-blue-600 to-purple-600">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center h-16 w-16 bg-white/20 backdrop-blur-sm rounded-full mb-4">
              <HelpCircle className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              How can we help you?
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Search our knowledge base or browse popular topics below
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Search for help articles, tutorials, and guides..."
                  className="pl-12 pr-4 py-6 text-lg bg-white"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Topics */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Popular Topics
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {popularTopics.map((topic, index) => (
              <Card key={index} className="hover:shadow-lg transition-all cursor-pointer group">
                <CardHeader>
                  <div className={`h-12 w-12 bg-${topic.color}-100 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    <topic.icon className={`h-6 w-6 text-${topic.color}-600`} />
                  </div>
                  <CardTitle className="text-lg">{topic.title}</CardTitle>
                  <CardDescription>{topic.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href={topic.link} className="text-blue-600 hover:text-blue-700 font-medium flex items-center">
                    Learn more <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Resources */}
      <section className="py-16 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Resources
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="text-center hover:shadow-lg transition-all">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <BookOpen className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                <CardTitle>Documentation</CardTitle>
                <CardDescription>
                  Comprehensive guides and API references
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  Browse Docs
                </Button>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-all">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <div className="h-16 w-16 bg-purple-100 rounded-full flex items-center justify-center">
                    <Video className="h-8 w-8 text-purple-600" />
                  </div>
                </div>
                <CardTitle>Video Tutorials</CardTitle>
                <CardDescription>
                  Step-by-step video guides and walkthroughs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  Watch Videos
                </Button>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-all">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                    <MessageCircle className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <CardTitle>Community</CardTitle>
                <CardDescription>
                  Connect with other Astric.ai users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  Join Community
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">
              Frequently Asked Questions
            </h2>
            <p className="text-gray-600 mb-12 text-center">
              Quick answers to common questions
            </p>
            
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <Card key={index} className="hover:shadow-md transition-all">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-start">
                      <HelpCircle className="h-5 w-5 text-blue-600 mr-3 mt-1 flex-shrink-0" />
                      {faq.question}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 ml-8">{faq.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Support */}
      <section className="py-16 bg-gradient-to-br from-blue-600 to-purple-600">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Still need help?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Our support team is here to help you 24/7
            </p>
            
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Live Chat</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Chat with us in real-time
                  </p>
                  <Button className="w-full">Start Chat</Button>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Email Support</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    support@astric.ai
                  </p>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/contact">Send Email</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Phone className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Phone Support</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Business hours only
                  </p>
                  <Button variant="outline" className="w-full">Call Us</Button>
                </CardContent>
              </Card>
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

