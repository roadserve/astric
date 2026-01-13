'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function SocialCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClientComponentClient()
  const [status, setStatus] = useState('Processing...')

  useEffect(() => {
    handleCallback()
  }, [])

  const handleCallback = async () => {
    try {
      const code = searchParams.get('code')
      const state = searchParams.get('state')
      const error = searchParams.get('error')

      if (error) {
        setStatus(`Error: ${error}`)
        setTimeout(() => router.push('/dashboard/social'), 3000)
        return
      }

      if (!code) {
        setStatus('No authorization code received')
        setTimeout(() => router.push('/dashboard/social'), 3000)
        return
      }

      setStatus('Connecting to Facebook...')

      // Get organization ID from session
      const organizationId = sessionStorage.getItem('social_org_id') || state

      if (!organizationId) {
        setStatus('Organization ID not found')
        setTimeout(() => router.push('/dashboard/social'), 3000)
        return
      }

      // Call Supabase Edge Function to exchange code for tokens
      const { data, error: functionError } = await supabase.functions.invoke('social_connect', {
        body: {
          authorization_code: code,
          organization_id: organizationId,
          platform: 'facebook'
        }
      })

      if (functionError) {
        console.error('Function error:', functionError)
        setStatus(`Connection failed: ${functionError.message}`)
        setTimeout(() => router.push('/dashboard/social'), 3000)
        return
      }

      setStatus('Successfully connected! Redirecting...')
      sessionStorage.removeItem('social_org_id')
      
      setTimeout(() => {
        router.push('/dashboard/social')
      }, 2000)

    } catch (error) {
      console.error('Callback error:', error)
      setStatus('An error occurred. Redirecting...')
      setTimeout(() => router.push('/dashboard/social'), 3000)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
        <h2 className="mt-6 text-2xl font-semibold text-gray-900">{status}</h2>
        <p className="mt-2 text-gray-600">Please wait...</p>
      </div>
    </div>
  )
}
