'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function GmbCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClientComponentClient()
  const [status, setStatus] = useState('Processing...')
  const [details, setDetails] = useState<string>('')
  const hasRunRef = useRef(false)

  useEffect(() => {
    handleCallback()
  }, [])

  const handleCallback = async () => {
    // In dev, React Strict Mode can run effects twice; avoid reusing the same `code`.
    if (hasRunRef.current) return
    hasRunRef.current = true

    try {
      const code = searchParams.get('code')
      const state = searchParams.get('state')
      const error = searchParams.get('error')

      if (error) {
        setStatus('Authorization failed. Redirecting...')
        setTimeout(() => router.push('/dashboard/gmb'), 2000)
        return
      }

      if (!code) {
        setStatus('No authorization code received. Redirecting...')
        setTimeout(() => router.push('/dashboard/gmb'), 2000)
        return
      }

      setStatus('Connecting your Google My Business account...')

      // Get organization_id from session or state
      const organizationId = state || sessionStorage.getItem('gmb_org_id')
      
      if (!organizationId) {
        setStatus('Organization not found. Redirecting...')
        setTimeout(() => router.push('/dashboard/gmb'), 2000)
        return
      }

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseAnonKey) {
        setStatus('Supabase env missing. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.')
        return
      }

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !sessionData.session?.access_token) {
        setStatus('Not logged in (no session). Please login and try again.')
        setDetails(sessionError?.message || '')
        return
      }

      // Call edge function directly to capture full error body on non-2xx.
      const resp = await fetch(`${supabaseUrl}/functions/v1/gmb_connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify({
          authorization_code: code,
          organization_id: organizationId,
          redirect_uri: `${window.location.origin}/dashboard/gmb/callback`,
        }),
      })

      const bodyText = await resp.text()

      if (!resp.ok) {
        setStatus('Failed to connect account. Please check details below.')
        setDetails(bodyText || `${resp.status} ${resp.statusText}`)
        return
      }

      // Parse JSON only if needed (body might be empty)
      try {
        JSON.parse(bodyText || '{}')
      } catch {
        // ignore
      }

      // Clear session storage
      sessionStorage.removeItem('gmb_org_id')

      setStatus('Successfully connected! Redirecting...')
      setTimeout(() => router.push('/dashboard/gmb'), 1500)

    } catch (error) {
      console.error('Callback error:', error)
      setStatus('An error occurred. Please check details below.')
      setDetails((error as any)?.message || String(error))
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Connecting Google My Business
        </h2>
        <p className="text-gray-600">{status}</p>
        {details && (
          <pre className="mt-4 text-left text-xs bg-gray-50 border rounded-md p-3 overflow-auto max-h-64">
            {details}
          </pre>
        )}
      </div>
    </div>
  )
}
