'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function GmbCallbackPage() {
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

      // Call edge function to complete OAuth and fetch GMB data
      const { data: functionData, error: functionError } = await supabase.functions.invoke('gmb_connect', {
        body: {
          authorization_code: code,
          organization_id: organizationId,
        },
      })

      if (functionError) {
        console.error('Error connecting GMB:', functionError)
        setStatus('Failed to connect account. Redirecting...')
        setTimeout(() => router.push('/dashboard/gmb'), 2000)
        return
      }

      // Clear session storage
      sessionStorage.removeItem('gmb_org_id')

      setStatus('Successfully connected! Redirecting...')
      setTimeout(() => router.push('/dashboard/gmb'), 1500)

    } catch (error) {
      console.error('Callback error:', error)
      setStatus('An error occurred. Redirecting...')
      setTimeout(() => router.push('/dashboard/gmb'), 2000)
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
      </div>
    </div>
  )
}
