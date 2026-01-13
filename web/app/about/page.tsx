import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Bot, 
  Target, 
  Eye, 
  Heart,
  Users,
  Lightbulb,
  Shield,
  Globe,
  ArrowRight,
  Zap,
  Sparkles
} from 'lucide-react'

export const metadata = {
  title: 'About Astric.ai - Mission, Vision & Values',
  description: 'Learn about Astric.ai\'s mission to democratize business automation and empower SMEs worldwide. Discover our vision, values, and commitment to your success.',
}

export default function AboutPage() {
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
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" />
            <span>About Astric.ai</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Empowering Businesses
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Through Automation
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            We believe that powerful automation tools shouldn&apos;t be exclusive to large corporations. 
            Every small business deserves to operate with enterprise-level efficiency.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center mb-6">
              <div className="h-16 w-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
                <Target className="h-8 w-8 text-white" />
              </div>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-6">
              Our Mission
            </h2>
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 md:p-12 border border-blue-100">
              <p className="text-2xl md:text-3xl font-semibold text-center text-gray-800 leading-relaxed">
                &ldquo;To democratize business automation and empower every small business 
                to operate with the efficiency of an enterprise.&rdquo;
              </p>
            </div>
            <div className="mt-8 space-y-4 text-lg text-gray-600">
              <p>
                We&apos;re committed to making sophisticated workflow automation accessible, affordable, 
                and easy to use for businesses of all sizes. Our mission is to help SMEs save time, 
                reduce costs, and focus on what matters most—growing their business.
              </p>
              <p>
                We believe automation should be intuitive, not intimidating. That&apos;s why we&apos;ve built 
                Astric.ai from the ground up specifically for small and medium enterprises, with 
                features that actually matter to real businesses.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-purple-600">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center mb-6">
              <div className="h-16 w-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Eye className="h-8 w-8 text-white" />
              </div>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-6">
              Our Vision
            </h2>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 md:p-12 border border-white/20">
              <p className="text-2xl md:text-3xl font-semibold text-center text-white leading-relaxed">
                &ldquo;To become the world&apos;s most loved automation platform—where every business, 
                regardless of size or technical expertise, can automate intelligently and scale infinitely.&rdquo;
              </p>
            </div>
            <div className="mt-8 space-y-4 text-lg text-blue-50">
              <p>
                By 2030, we envision Astric.ai powering millions of businesses globally, eliminating 
                billions of hours of manual work, and enabling entrepreneurs to focus on innovation and growth.
              </p>
              <p>
                We see a future where AI-powered automation is as essential as email, and Astric.ai 
                is the platform that makes it happen for everyone, everywhere.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Core Values
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              These principles guide everything we do at Astric.ai
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Value 1 */}
            <Card className="border-2 hover:border-blue-300 hover:shadow-xl transition-all">
              <CardContent className="p-6">
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Simplicity First
                </h3>
                <p className="text-gray-600">
                  Complex problems, simple solutions. We believe automation should be 
                  intuitive, not intimidating.
                </p>
              </CardContent>
            </Card>

            {/* Value 2 */}
            <Card className="border-2 hover:border-purple-300 hover:shadow-xl transition-all">
              <CardContent className="p-6">
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Heart className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Customer Success
                </h3>
                <p className="text-gray-600">
                  Your success is our success. We&apos;re obsessed with helping businesses 
                  achieve their goals.
                </p>
              </CardContent>
            </Card>

            {/* Value 3 */}
            <Card className="border-2 hover:border-indigo-300 hover:shadow-xl transition-all">
              <CardContent className="p-6">
                <div className="h-12 w-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <Lightbulb className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Innovation Always
                </h3>
                <p className="text-gray-600">
                  We constantly push boundaries, embracing AI and emerging technologies 
                  to stay ahead.
                </p>
              </CardContent>
            </Card>

            {/* Value 4 */}
            <Card className="border-2 hover:border-teal-300 hover:shadow-xl transition-all">
              <CardContent className="p-6">
                <div className="h-12 w-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-teal-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Trust & Transparency
                </h3>
                <p className="text-gray-600">
                  We build with integrity, security, and honest communication at our core.
                </p>
              </CardContent>
            </Card>

            {/* Value 5 */}
            <Card className="border-2 hover:border-green-300 hover:shadow-xl transition-all">
              <CardContent className="p-6">
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Globe className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Global Inclusion
                </h3>
                <p className="text-gray-600">
                  Technology shouldn&apos;t have barriers. We build for everyone, everywhere.
                </p>
              </CardContent>
            </Card>

            {/* Value 6 */}
            <Card className="border-2 hover:border-orange-300 hover:shadow-xl transition-all">
              <CardContent className="p-6">
                <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Community Driven
                </h3>
                <p className="text-gray-600">
                  We listen to our users and build features that solve real business problems.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Our Promise */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Heart className="h-4 w-4" />
              <span>Our Commitment</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Our Promise to You
            </h2>
            <div className="bg-white rounded-2xl p-8 md:p-12 shadow-lg border border-blue-100">
              <p className="text-2xl md:text-3xl font-semibold text-gray-800 mb-6">
                &ldquo;We promise to save you at least 20 hours per month, or your money back.&rdquo;
              </p>
              <p className="text-lg text-gray-600">
                Every feature we build, every integration we add, and every update we ship is 
                designed with one goal: to give you more time to focus on what you love about 
                your business.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Impact
            </h2>
            <p className="text-xl text-gray-600">
              Making a difference, one automation at a time
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                10,000+
              </div>
              <p className="text-gray-600 font-medium">Active Businesses</p>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                1M+
              </div>
              <p className="text-gray-600 font-medium">Workflows Executed</p>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                20+
              </div>
              <p className="text-gray-600 font-medium">Hours Saved/Week</p>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                4.8/5
              </div>
              <p className="text-gray-600 font-medium">Customer Rating</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-purple-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Join Us on This Journey
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Be part of the automation revolution. Let&apos;s build the future of business together.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/register">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-white/10 text-white border-white hover:bg-white hover:text-blue-600" asChild>
              <Link href="/">Learn More</Link>
            </Button>
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
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/#features" className="hover:text-white">Features</Link></li>
                <li><Link href="/about" className="hover:text-white">About Us</Link></li>
                <li><Link href="#" className="hover:text-white">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#" className="hover:text-white">Help Center</Link></li>
                <li><Link href="#" className="hover:text-white">Contact Us</Link></li>
                <li><Link href="#" className="hover:text-white">Status</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/about" className="hover:text-white">Mission & Vision</Link></li>
                <li><Link href="#" className="hover:text-white">Privacy</Link></li>
                <li><Link href="#" className="hover:text-white">Terms</Link></li>
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

