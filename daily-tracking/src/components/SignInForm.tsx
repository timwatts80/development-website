'use client'

import { signIn, getProviders } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'

type Provider = {
  id: string
  name: string
  type: string
  signinUrl: string
  callbackUrl: string
}

interface SignInFormProps {
  callbackUrl?: string
}

export default function SignInForm({ callbackUrl }: SignInFormProps) {
  const [providers, setProviders] = useState<Record<string, Provider> | null>(null)
  const [loading, setLoading] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProviders() {
      const res = await getProviders()
      setProviders(res)
    }
    fetchProviders()
  }, [])

  const handleSignIn = async (providerId: string) => {
    setLoading(providerId)
    try {
      await signIn(providerId, { callbackUrl: callbackUrl || '/' })
    } catch (error) {
      console.error('Sign in error:', error)
    } finally {
      setLoading(null)
    }
  }

  if (!providers) {
    return (
      <div className="space-y-4">
        <div className="text-center text-gray-500">Loading sign-in options...</div>
      </div>
    )
  }

  // If no providers are configured, show a message
  if (Object.keys(providers).length === 0) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Authentication Not Configured
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            To enable sign-in, configure OAuth providers in your environment variables.
          </p>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Add to .env.local:</h4>
            <pre className="text-xs text-gray-700 whitespace-pre-wrap">
{`# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# GitHub OAuth  
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret`}
{/* OK: example documentation strings, not actual secrets */}
            </pre>
          </div>
          <Button 
            onClick={() => window.location.href = '/'} 
            variant="secondary"
            className="mt-4"
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-center text-gray-900 mb-6">
        Choose your sign-in method
      </h3>
      
      {Object.values(providers).map((provider) => (
        <Button
          key={provider.id}
          onClick={() => handleSignIn(provider.id)}
          disabled={loading === provider.id}
          className="w-full flex items-center justify-center space-x-2"
          variant={provider.id === 'google' ? 'default' : 'secondary'}
        >
          {loading === provider.id ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Signing in...</span>
            </div>
          ) : (
            <span>
              {provider.id === 'google' && '🔍 '}
              {provider.id === 'github' && '📱 '}
              Continue with {provider.name}
            </span>
          )}
        </Button>
      ))}
      
      <p className="text-xs text-gray-500 text-center mt-4">
        We&apos;ll never post anything without your permission
      </p>
    </div>
  )
}
