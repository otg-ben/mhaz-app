'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function ConfirmPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Get the token from URL parameters
        const token_hash = searchParams.get('token_hash')
        const type = searchParams.get('type')

        if (token_hash && type) {
          // Verify the email confirmation
          const { error } = await supabase.auth.verifyOtp({
            token_hash,
            type: type as any
          })

          if (error) {
            console.error('Confirmation error:', error)
            setStatus('error')
            setMessage('Email confirmation failed. Please try again.')
          } else {
            setStatus('success')
            setMessage('Email confirmed successfully! Redirecting to app...')
            
            // Redirect to main app after 2 seconds
            setTimeout(() => {
              router.push('/')
            }, 2000)
          }
        } else {
          setStatus('error')
          setMessage('Invalid confirmation link.')
        }
      } catch (err) {
        console.error('Confirmation error:', err)
        setStatus('error')
        setMessage('An error occurred during confirmation.')
      }
    }

    handleEmailConfirmation()
  }, [searchParams, supabase, router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Confirming your email...
            </h2>
            <p className="text-gray-600">Please wait while we verify your account.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-green-600 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Email Confirmed!
            </h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <button
              onClick={() => router.push('/')}
              className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Go to App
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-red-600 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Confirmation Failed
            </h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <button
              onClick={() => router.push('/')}
              className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Back to App
            </button>
          </>
        )}
      </div>
    </div>
  )
}