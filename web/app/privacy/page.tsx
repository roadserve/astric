import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Bot, 
  Shield,
  Lock,
  Eye,
  Database,
  UserCheck,
  Mail
} from 'lucide-react'

export const metadata = {
  title: 'Privacy Policy - Astric.ai',
  description: 'Learn how Astric.ai collects, uses, and protects your personal information. Our commitment to your privacy and data security.',
}

export default function PrivacyPage() {
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
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center justify-center h-16 w-16 bg-white/20 backdrop-blur-sm rounded-full mb-4">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Privacy Policy
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Your privacy matters to us. Learn how we collect, use, and protect your information.
          </p>
          <p className="text-blue-200 mt-4">
            Last updated: January 11, 2025
          </p>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-8 bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-4 justify-center text-sm">
            <Link href="#information-collection" className="text-blue-600 hover:text-blue-700 font-medium">
              Information We Collect
            </Link>
            <Link href="#how-we-use" className="text-blue-600 hover:text-blue-700 font-medium">
              How We Use Data
            </Link>
            <Link href="#data-security" className="text-blue-600 hover:text-blue-700 font-medium">
              Data Security
            </Link>
            <Link href="#your-rights" className="text-blue-600 hover:text-blue-700 font-medium">
              Your Rights
            </Link>
            <Link href="#contact" className="text-blue-600 hover:text-blue-700 font-medium">
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="mb-8">
              <CardContent className="pt-6 prose prose-blue max-w-none">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Introduction</h2>
                <p className="text-gray-600 mb-4">
                  Welcome to Astric.ai ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our business automation platform.
                </p>
                <p className="text-gray-600">
                  By using Astric.ai, you agree to the collection and use of information in accordance with this policy. If you do not agree with our policies and practices, please do not use our services.
                </p>
              </CardContent>
            </Card>

            <Card id="information-collection" className="mb-8">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Database className="h-5 w-5 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Information We Collect</h2>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">1. Information You Provide</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                  <li><strong>Account Information:</strong> Name, email address, phone number, company name</li>
                  <li><strong>Profile Data:</strong> User preferences, settings, and customization choices</li>
                  <li><strong>Payment Information:</strong> Billing address, payment method details (processed securely by our payment providers)</li>
                  <li><strong>Customer Data:</strong> Information you input into our CRM and automation systems</li>
                  <li><strong>Communications:</strong> Messages you send to our support team</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">2. Automatically Collected Information</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                  <li><strong>Usage Data:</strong> How you interact with our platform, features used, time spent</li>
                  <li><strong>Device Information:</strong> Browser type, operating system, IP address</li>
                  <li><strong>Cookies:</strong> We use cookies to enhance your experience (see our Cookie Policy)</li>
                  <li><strong>Log Data:</strong> Access times, pages viewed, errors encountered</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">3. Information from Third Parties</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                  <li><strong>Integration Data:</strong> Data from services you connect (WhatsApp, email, etc.)</li>
                  <li><strong>Authentication:</strong> If you sign in using Google or other OAuth providers</li>
                </ul>
              </CardContent>
            </Card>

            <Card id="how-we-use" className="mb-8">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Eye className="h-5 w-5 text-purple-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">How We Use Your Information</h2>
                </div>

                <p className="text-gray-600 mb-4">We use the collected information for various purposes:</p>

                <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                  <li><strong>Provide Services:</strong> Deliver, maintain, and improve Astric.ai</li>
                  <li><strong>Account Management:</strong> Create and manage your account</li>
                  <li><strong>Customer Support:</strong> Respond to your requests and provide assistance</li>
                  <li><strong>Communication:</strong> Send service updates, security alerts, and support messages</li>
                  <li><strong>Marketing:</strong> Send promotional communications (you can opt out anytime)</li>
                  <li><strong>Analytics:</strong> Understand usage patterns to improve our platform</li>
                  <li><strong>Security:</strong> Detect, prevent, and address fraud and security issues</li>
                  <li><strong>Legal Compliance:</strong> Comply with legal obligations and enforce our terms</li>
                </ul>
              </CardContent>
            </Card>

            <Card id="data-security" className="mb-8">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Lock className="h-5 w-5 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Data Security</h2>
                </div>

                <p className="text-gray-600 mb-4">
                  We take the security of your data seriously and implement industry-standard measures:
                </p>

                <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                  <li><strong>Encryption:</strong> All data is encrypted in transit (TLS/SSL) and at rest</li>
                  <li><strong>Access Controls:</strong> Strict role-based access with multi-factor authentication</li>
                  <li><strong>Infrastructure:</strong> Hosted on secure cloud infrastructure (Supabase/AWS)</li>
                  <li><strong>Regular Audits:</strong> Periodic security assessments and penetration testing</li>
                  <li><strong>Data Isolation:</strong> Multi-tenant architecture with Row Level Security (RLS)</li>
                  <li><strong>Backup:</strong> Regular automated backups with disaster recovery procedures</li>
                  <li><strong>Monitoring:</strong> 24/7 system monitoring and intrusion detection</li>
                </ul>

                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> While we implement robust security measures, no method of transmission over the internet is 100% secure. We strive to use commercially acceptable means to protect your data.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardContent className="pt-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Sharing and Disclosure</h2>

                <p className="text-gray-600 mb-4">We may share your information in the following situations:</p>

                <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                  <li><strong>Service Providers:</strong> Third-party vendors who help us provide services (hosting, payment processing, email delivery)</li>
                  <li><strong>Business Transfers:</strong> In connection with mergers, acquisitions, or asset sales</li>
                  <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                  <li><strong>With Your Consent:</strong> When you explicitly agree to share information</li>
                </ul>

                <p className="text-gray-600 mt-4">
                  <strong>We do NOT:</strong> Sell your personal information to third parties or use it for purposes unrelated to providing our services.
                </p>
              </CardContent>
            </Card>

            <Card id="your-rights" className="mb-8">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <UserCheck className="h-5 w-5 text-orange-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Your Privacy Rights</h2>
                </div>

                <p className="text-gray-600 mb-4">You have the following rights regarding your personal information:</p>

                <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                  <li><strong>Access:</strong> Request a copy of the personal data we hold about you</li>
                  <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                  <li><strong>Deletion:</strong> Request deletion of your personal data (with some exceptions)</li>
                  <li><strong>Portability:</strong> Export your data in a machine-readable format</li>
                  <li><strong>Restriction:</strong> Request restriction of processing your data</li>
                  <li><strong>Objection:</strong> Object to processing for marketing purposes</li>
                  <li><strong>Withdraw Consent:</strong> Withdraw consent at any time where we rely on consent</li>
                </ul>

                <p className="text-gray-600 mt-4">
                  To exercise these rights, please contact us at <a href="mailto:privacy@astric.ai" className="text-blue-600 hover:underline">privacy@astric.ai</a>
                </p>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardContent className="pt-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Retention</h2>

                <p className="text-gray-600 mb-4">
                  We retain your personal information only as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law.
                </p>

                <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                  <li><strong>Active Accounts:</strong> Data retained while your account is active</li>
                  <li><strong>Deleted Accounts:</strong> Most data deleted within 30 days of account deletion</li>
                  <li><strong>Backups:</strong> Backup copies may persist for up to 90 days</li>
                  <li><strong>Legal Requirements:</strong> Some data retained longer for compliance purposes</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardContent className="pt-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">International Data Transfers</h2>

                <p className="text-gray-600 mb-4">
                  Astric.ai is based in India. If you access our services from outside India, please be aware that your information may be transferred to, stored, and processed in India and other countries where our service providers operate.
                </p>

                <p className="text-gray-600">
                  We take appropriate measures to ensure that your personal information receives adequate protection wherever it is transferred, in accordance with applicable data protection laws.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardContent className="pt-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Children's Privacy</h2>

                <p className="text-gray-600">
                  Astric.ai is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you become aware that a child has provided us with personal information, please contact us immediately.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardContent className="pt-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Changes to This Privacy Policy</h2>

                <p className="text-gray-600 mb-4">
                  We may update our Privacy Policy from time to time. We will notify you of any changes by:
                </p>

                <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                  <li>Posting the new Privacy Policy on this page</li>
                  <li>Updating the "Last updated" date at the top</li>
                  <li>Sending you an email notification for material changes</li>
                </ul>

                <p className="text-gray-600 mt-4">
                  We encourage you to review this Privacy Policy periodically for any changes. Changes are effective when posted on this page.
                </p>
              </CardContent>
            </Card>

            <Card id="contact" className="mb-8 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Mail className="h-5 w-5 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Contact Us</h2>
                </div>

                <p className="text-gray-600 mb-4">
                  If you have any questions about this Privacy Policy or our privacy practices, please contact us:
                </p>

                <div className="space-y-3 text-gray-700">
                  <p><strong>Email:</strong> <a href="mailto:privacy@astric.ai" className="text-blue-600 hover:underline">privacy@astric.ai</a></p>
                  <p><strong>Support:</strong> <a href="mailto:support@astric.ai" className="text-blue-600 hover:underline">support@astric.ai</a></p>
                  <p><strong>Address:</strong> 2151/9b 3rd Floor, New Patel Nagar, Shadipur, New Delhi 110008, India</p>
                </div>

                <div className="mt-6">
                  <Button asChild>
                    <Link href="/contact">Contact Support</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
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

