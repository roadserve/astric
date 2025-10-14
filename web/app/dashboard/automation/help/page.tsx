'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Mail, MessageSquare, Calendar, Zap, Clock, Database, GitBranch } from 'lucide-react'
import Link from 'next/link'

export default function AutomationHelpPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Link href="/dashboard/automation">
        <Button variant="outline" size="sm" className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Automation
        </Button>
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Automation Help Guide</h1>
        <p className="text-gray-600">आसान भाषा में समझें कि Automation कैसे काम करता है</p>
      </div>

      {/* What is Automation */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            Automation क्या है?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-gray-700">
          <p>
            <strong>Automation</strong> का मतलब है कि आप अपने business की repetitive (बार-बार होने वाली) tasks को 
            automatic बना सकते हैं। जैसे:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>जब कोई नया customer आए तो automatically welcome email भेजना</li>
            <li>हर दिन सुबह 9 बजे daily report email करना</li>
            <li>जब order आए तो WhatsApp पर notification भेजना</li>
            <li>Database से data लेकर उसे process करना</li>
          </ul>
          <p className="text-sm italic text-gray-600">
            आपको manually कुछ नहीं करना पड़ेगा - सब कुछ automatically होगा!
          </p>
        </CardContent>
      </Card>

      {/* How to Start */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>कहाँ से शुरू करें?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">1. Simple Wizard (आसान तरीका) ✨</h4>
            <p className="text-gray-700 mb-2">
              अगर आप technical नहीं हैं, तो <strong>"Simple Wizard"</strong> button से शुरू करें। 
              यह step-by-step guide करेगा और सब कुछ आसान भाषा में पूछेगा।
            </p>
            <Link href="/dashboard/automation/wizard">
              <Button className="bg-green-600 hover:bg-green-700">
                Open Simple Wizard
              </Button>
            </Link>
          </div>

          <div>
            <h4 className="font-semibold mb-2">2. Advanced Editor (experienced users के लिए)</h4>
            <p className="text-gray-700">
              अगर आपको technical knowledge है या आप complex workflow बनाना चाहते हैं, 
              तो <strong>"Advanced Editor"</strong> use करें।
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Common Use Cases */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>आम तौर पर क्या-क्या बना सकते हैं?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-blue-600 mt-1" />
            <div>
              <h4 className="font-semibold">Email Notifications</h4>
              <p className="text-sm text-gray-700">
                किसी भी event पर automatic email भेजें। जैसे: नया customer, order confirmation, 
                payment received, etc.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MessageSquare className="h-5 w-5 text-green-600 mt-1" />
            <div>
              <h4 className="font-semibold">WhatsApp Alerts</h4>
              <p className="text-sm text-gray-700">
                Important updates WhatsApp पर भेजें। Customer को या अपनी team को instant notifications।
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-purple-600 mt-1" />
            <div>
              <h4 className="font-semibold">Daily/Weekly Reports</h4>
              <p className="text-sm text-gray-700">
                हर दिन या हफ्ते में automatic report generate करें और email करें। 
                Sales report, inventory status, customer summary, etc.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Database className="h-5 w-5 text-orange-600 mt-1" />
            <div>
              <h4 className="font-semibold">Database Operations</h4>
              <p className="text-sm text-gray-700">
                Database से data fetch करें, update करें, या delete करें - automatically.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <GitBranch className="h-5 w-5 text-pink-600 mt-1" />
            <div>
              <h4 className="font-semibold">Conditional Logic (IF/THEN)</h4>
              <p className="text-sm text-gray-700">
                "अगर ऐसा हो तो वो करो" type की logic बनाएं। जैसे: अगर payment 10,000 से ज्यादा हो 
                तो manager को WhatsApp करो।
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Terms */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Important Terms जो आपको पता होने चाहिए</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <strong>Workflow:</strong>
            <p className="text-sm text-gray-700">
              एक complete automation process को "workflow" कहते हैं। जैसे पूरी email sending process 
              एक workflow है।
            </p>
          </div>

          <div>
            <strong>Trigger:</strong>
            <p className="text-sm text-gray-700">
              Trigger वो चीज़ है जो workflow को start करती है। जैसे: webhook call, schedule (time-based), 
              या manual trigger.
            </p>
          </div>

          <div>
            <strong>Node:</strong>
            <p className="text-sm text-gray-700">
              हर action को एक "node" कहते हैं। जैसे: "Send Email" एक node है, "WhatsApp Message" एक node है। 
              आप multiple nodes को connect करके workflow बनाते हैं।
            </p>
          </div>

          <div>
            <strong>Execution:</strong>
            <p className="text-sm text-gray-700">
              जब workflow run होता है उसे "execution" कहते हैं। आप execution logs में देख सकते हैं कि 
              क्या successfully चला या कोई error आया।
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="mb-6 border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="text-yellow-800">💡 Tips & Best Practices</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-yellow-900">
          <p>✅ <strong>Test करें:</strong> पहले Test button से check करें कि workflow सही चल रहा है</p>
          <p>✅ <strong>Simple रखें:</strong> शुरुआत में simple workflows बनाएं, फिर gradually complex बनाएं</p>
          <p>✅ <strong>Credentials save करें:</strong> SMTP, WhatsApp API keys, database passwords - सब सुरक्षित save हो जाते हैं</p>
          <p>✅ <strong>Logs check करें:</strong> अगर कुछ गलत हो तो execution logs में error का reason दिखेगा</p>
          <p>⚠️ <strong>Limit ध्यान रखें:</strong> आपके plan के हिसाब से monthly execution limit होती है</p>
        </CardContent>
      </Card>

      {/* Support */}
      <Card>
        <CardHeader>
          <CardTitle>अभी भी Problem है?</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 mb-4">
            अगर आपको कोई help चाहिए या कुछ समझ नहीं आ रहा, तो:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>Simple Wizard से शुरू करें - सब step-by-step समझाया जाएगा</li>
            <li>Templates से start करें - ready-made workflows use करें</li>
            <li>Support team से contact करें</li>
          </ul>
          <div className="mt-4">
            <Link href="/dashboard/automation/wizard">
              <Button className="bg-blue-600 hover:bg-blue-700">
                Start with Simple Wizard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
