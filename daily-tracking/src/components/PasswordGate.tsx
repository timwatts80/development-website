'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import ThemeToggle from '@/components/ThemeToggle'

interface PasswordGateProps {
  children: React.ReactNode
}

export default function PasswordGate({ children }: PasswordGateProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  // Check if already authenticated on mount
  useEffect(() => {
    const authStatus = localStorage.getItem('daily-tracker-auth')
    if (authStatus === 'true') {
      setIsAuthenticated(true)
    }
    setLoading(false)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Simple password check - you can change this password
    const correctPassword = 'daily123'
    
    if (password === correctPassword) {
      setIsAuthenticated(true)
      localStorage.setItem('daily-tracker-auth', 'true')
    } else {
      setError('Incorrect password')
      setPassword('')
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem('daily-tracker-auth')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-gray-100">
              Daily Tracker
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Enter password to access your daily tracking dashboard
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 py-8 px-6 shadow-lg rounded-lg">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your password"
                  required
                />
                {error && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
                )}
              </div>
              
              <Button type="submit" className="w-full">
                Access Dashboard
              </Button>
            </form>
          </div>
          
          <div className="text-center text-xs text-gray-500 dark:text-gray-400">
            <p>Demo password: <code className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded">daily123</code></p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex justify-between items-center">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Daily Tracker</h1>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button 
            onClick={handleLogout} 
            variant="outline" 
            size="sm"
          >
            Logout
          </Button>
        </div>
      </div>
      {children}
    </div>
  )
}
