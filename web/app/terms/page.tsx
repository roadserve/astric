import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Bot, 
  FileText,
  Scale,
  AlertTriangle,
  CheckCircle,
  Mail
} from 'lucide-react'

export const metadata = {
  title: 'Terms of Service - Astric.ai',
  description: 'Read Astric.ai Terms of Service. Understand your rights and responsibilities when using our business automation platform.',
}

export default function TermsPage() {
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
            <FileText className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Terms of Service
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Please read these terms carefully before using Astric.ai
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
            <Link href="#acceptance" className="text-blue-600 hover:text-blue-700 font-medium">
              Acceptance
            </Link>
            <Link href="#services" className="text-blue-600 hover:text-blue-700 font-medium">
              Services
            </Link>
            <Link href="#accounts" className="text-blue-600 hover:text-blue-700 font-medium">
              Accounts
            </Link>
            <Link href="#payment" className="text-blue-600 hover:text-blue-700 font-medium">
              Payment
            </Link>
            <Link href="#conduct" className="text-blue-600 hover:text-blue-700 font-medium">
              User Conduct
            </Link>
            <Link href="#termination" className="text-blue-600 hover:text-blue-700 font-medium">
              Termination
            </Link>
            <Link href="#contact" className="text-blue-600 hover:text-blue-700 font-medium">
              Contact
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="mb-8">
              <CardContent className="pt-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Introduction</h2>
                <p className="text-gray-600 mb-4">
                  Welcome to Astric.ai! These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of the Astric.ai platform, website, and related services (collectively, the &ldquo;Services&rdquo;). These Terms constitute a legally binding agreement between you and Astric.ai (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;).
                </p>
                <p className="text-gray-600">
                  By accessing or using our Services, you agree to be bound by these Terms. If you do not agree to these Terms, please do not use our Services.
                </p>
              </CardContent>
            </Card>

            <Card id="acceptance" className="mb-8">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">1. Acceptance of Terms</h2>
                </div>

                <p className="text-gray-600 mb-4">
                  By creating an account or using Astric.ai, you represent that:
                </p>

                <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                  <li>You are at least 18 years old</li>
                  <li>You have the legal authority to enter into these Terms</li>
                  <li>You will comply with all applicable laws and regulations</li>
                  <li>All information you provide is accurate and up-to-date</li>
                  <li>You will not use the Services for any unlawful purpose</li>
                </ul>
              </CardContent>
            </Card>

            <Card id="services" className="mb-8">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Scale className="h-5 w-5 text-purple-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">2. Description of Services</h2>
                </div>

                <p className="text-gray-600 mb-4">
                  Astric.ai provides a business automation platform that includes:
                </p>

                <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                  <li>Visual workflow builder for creating automated processes</li>
                  <li>Integration with 60+ third-party services and APIs</li>
                  <li>CRM and customer management tools</li>
                  <li>Multi-channel communication (WhatsApp, Email, SMS)</li>
                  <li>Analytics and reporting features</li>
                  <li>Team collaboration tools</li>
                </ul>

                <p className="text-gray-600 mt-4">
                  We reserve the right to modify, suspend, or discontinue any part of the Services at any time, with or without notice. We are not liable to you or any third party for any modification, suspension, or discontinuation of the Services.
                </p>
              </CardContent>
            </Card>

            <Card id="accounts" className="mb-8">
              <CardContent className="pt-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Accounts</h2>

                <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Account Registration</h3>
                <p className="text-gray-600 mb-4">
                  To use certain features, you must create an account. You agree to:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                  <li>Provide accurate, current, and complete information</li>
                  <li>Maintain and update your information to keep it accurate</li>
                  <li>Keep your password secure and confidential</li>
                  <li>Notify us immediately of any unauthorized access</li>
                  <li>Be responsible for all activities under your account</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Account Security</h3>
                <p className="text-gray-600">
                  You are solely responsible for maintaining the confidentiality of your account credentials. We are not liable for any loss or damage arising from your failure to protect your account information.
                </p>
              </CardContent>
            </Card>

            <Card id="payment" className="mb-8">
              <CardContent className="pt-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Payment and Subscription</h2>

                <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Pricing and Plans</h3>
                <p className="text-gray-600 mb-4">
                  Astric.ai offers both free and paid subscription plans. Pricing is subject to change with 30 days&apos; notice.
                </p>

                <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                  <li><strong>Free Plan:</strong> Limited features with usage restrictions</li>
                  <li><strong>Paid Plans:</strong> Enhanced features and higher usage limits</li>
                  <li><strong>Enterprise:</strong> Custom pricing and features</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Billing</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                  <li>Subscription fees are billed in advance on a monthly or annual basis</li>
                  <li>All fees are non-refundable except as required by law or our refund policy</li>
                  <li>You authorize us to charge your payment method on a recurring basis</li>
                  <li>You&apos;re responsible for all taxes associated with your subscription</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Refund Policy</h3>
                <p className="text-gray-600">
                  We offer a 30-day money-back guarantee if you&apos;re not satisfied with our service. To request a refund, contact support@astric.ai within 30 days of your purchase.
                </p>
              </CardContent>
            </Card>

            <Card id="conduct" className="mb-8">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="h-10 w-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">5. Prohibited Conduct</h2>
                </div>

                <p className="text-gray-600 mb-4">
                  You agree NOT to use our Services to:
                </p>

                <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                  <li>Violate any applicable laws or regulations</li>
                  <li>Send spam, unsolicited communications, or malicious content</li>
                  <li>Infringe on intellectual property rights of others</li>
                  <li>Attempt to gain unauthorized access to our systems</li>
                  <li>Interfere with or disrupt the Services or servers</li>
                  <li>Use the Services to harm, threaten, or harass others</li>
                  <li>Upload viruses, malware, or harmful code</li>
                  <li>Scrape, crawl, or harvest data without permission</li>
                  <li>Resell or redistribute the Services without authorization</li>
                  <li>Create fake accounts or impersonate others</li>
                </ul>

                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">
                    <strong>Warning:</strong> Violation of these terms may result in immediate suspension or termination of your account without refund.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardContent className="pt-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Intellectual Property</h2>

                <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Our Rights</h3>
                <p className="text-gray-600 mb-4">
                  All content, features, and functionality of the Services, including but not limited to text, graphics, logos, icons, images, audio clips, downloads, and software, are the exclusive property of Astric.ai and are protected by copyright, trademark, and other intellectual property laws.
                </p>

                <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Your Rights</h3>
                <p className="text-gray-600 mb-4">
                  You retain all rights to the content and data you upload to the Services (&ldquo;Your Content&rdquo;). By using the Services, you grant us a limited license to use, store, and process Your Content solely to provide the Services to you.
                </p>

                <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">License to Use Services</h3>
                <p className="text-gray-600">
                  Subject to these Terms, we grant you a limited, non-exclusive, non-transferable license to access and use the Services for your internal business purposes.
                </p>
              </CardContent>
            </Card>

            <Card id="termination" className="mb-8">
              <CardContent className="pt-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Termination</h2>

                <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">By You</h3>
                <p className="text-gray-600 mb-4">
                  You may cancel your account at any time through your account settings or by contacting support. Cancellation will take effect at the end of your current billing period.
                </p>

                <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">By Us</h3>
                <p className="text-gray-600 mb-4">
                  We may suspend or terminate your account if:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                  <li>You violate these Terms</li>
                  <li>Your payment fails or account becomes past due</li>
                  <li>You engage in fraudulent or illegal activities</li>
                  <li>Required by law or legal process</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Effects of Termination</h3>
                <p className="text-gray-600">
                  Upon termination, your right to use the Services will immediately cease. We will delete your data within 30 days unless legally required to retain it. You may request an export of your data before account deletion.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardContent className="pt-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Disclaimers and Limitations of Liability</h2>

                <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Service &ldquo;As Is&rdquo;</h3>
                <p className="text-gray-600 mb-4">
                  THE SERVICES ARE PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
                </p>

                <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Limitation of Liability</h3>
                <p className="text-gray-600 mb-4">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, ASTRIC.AI SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, OR GOODWILL.
                </p>

                <p className="text-gray-600">
                  Our total liability shall not exceed the amount you paid us in the 12 months preceding the claim.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardContent className="pt-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Indemnification</h2>

                <p className="text-gray-600">
                  You agree to indemnify, defend, and hold harmless Astric.ai and its officers, directors, employees, and agents from any claims, liabilities, damages, losses, and expenses (including reasonable attorneys&apos; fees) arising out of or in any way connected with:
                </p>

                <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4 mt-4">
                  <li>Your access to or use of the Services</li>
                  <li>Your violation of these Terms</li>
                  <li>Your violation of any third-party rights</li>
                  <li>Your Content</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardContent className="pt-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Dispute Resolution</h2>

                <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Governing Law</h3>
                <p className="text-gray-600 mb-4">
                  These Terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law provisions.
                </p>

                <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Arbitration</h3>
                <p className="text-gray-600">
                  Any disputes arising out of or relating to these Terms or the Services shall be resolved through binding arbitration in New Delhi, India, except that either party may seek injunctive relief in court.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardContent className="pt-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Changes to Terms</h2>

                <p className="text-gray-600 mb-4">
                  We reserve the right to modify these Terms at any time. We will notify you of material changes by:
                </p>

                <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                  <li>Posting the updated Terms on our website</li>
                  <li>Updating the &ldquo;Last updated&rdquo; date</li>
                  <li>Sending an email notification to your registered email</li>
                </ul>

                <p className="text-gray-600 mt-4">
                  Your continued use of the Services after changes become effective constitutes acceptance of the revised Terms. If you do not agree to the new Terms, you must stop using the Services.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardContent className="pt-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">12. General Provisions</h2>

                <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                  <li><strong>Entire Agreement:</strong> These Terms constitute the entire agreement between you and Astric.ai</li>
                  <li><strong>Severability:</strong> If any provision is found to be unenforceable, the remaining provisions will remain in effect</li>
                  <li><strong>Waiver:</strong> No waiver of any term shall be deemed a further or continuing waiver</li>
                  <li><strong>Assignment:</strong> You may not assign these Terms; we may assign them without restriction</li>
                  <li><strong>Force Majeure:</strong> We are not liable for delays or failures due to circumstances beyond our control</li>
                </ul>
              </CardContent>
            </Card>

            <Card id="contact" className="mb-8 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Mail className="h-5 w-5 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Contact Information</h2>
                </div>

                <p className="text-gray-600 mb-4">
                  If you have any questions about these Terms, please contact us:
                </p>

                <div className="space-y-3 text-gray-700">
                  <p><strong>Email:</strong> <a href="mailto:legal@astric.ai" className="text-blue-600 hover:underline">legal@astric.ai</a></p>
                  <p><strong>Support:</strong> <a href="mailto:support@astric.ai" className="text-blue-600 hover:underline">support@astric.ai</a></p>
                  <p><strong>Address:</strong> 2151/9b 3rd Floor, New Patel Nagar, Shadipur, New Delhi 110008, India</p>
                </div>

                <div className="mt-6 flex space-x-4">
                  <Button asChild>
                    <Link href="/contact">Contact Us</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/privacy">Privacy Policy</Link>
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

