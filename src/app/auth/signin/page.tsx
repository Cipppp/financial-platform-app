'use client'

import { useState, useEffect, Suspense } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  TrendingUp, 
  ArrowLeft,
  CheckCircle,
  DollarSign,
  Loader2
} from 'lucide-react'

function SignInContent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const message = searchParams.get('message')
    if (message) {
      setSuccessMessage(message)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid email or password')
      } else {
        // Refresh the session
        await getSession()
        router.push('/dashboard')
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">

      <div className="relative max-w-md w-full space-y-8">
        {/* Back to Home */}
        <Link 
          href="/"
          className="inline-flex items-center text-gray-600 hover:text-black transition-colors duration-200 group"
        >
          <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>

        <div className="bg-white p-8 border border-gray-200 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2 mb-6">
              <div className="p-3 bg-black">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <span className="text-2xl font-bold text-black">Financial Platform</span>
            </div>
            <h2 className="text-3xl font-bold text-black mb-2">
              Account Access
            </h2>
            <p className="text-gray-600">
              Sign in to access your trading environment
            </p>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-100 border border-green-300">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                <span className="text-green-800 text-sm font-medium">{successMessage}</span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-300">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 flex-shrink-0"></div>
                <span className="text-red-700 text-sm font-medium">{error}</span>
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full pl-12 pr-4 py-3 bg-white border border-gray-300 text-black placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all duration-200"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="block w-full pl-12 pr-12 py-3 bg-white border border-gray-300 text-black placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all duration-200"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400 hover:text-black transition-colors" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400 hover:text-black transition-colors" />
                  )}
                </button>
              </div>
            </div>

            {/* Sign In Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center items-center py-4 px-6 bg-black text-white font-bold hover:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 border border-black"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  <>
                    <TrendingUp className="mr-2 h-5 w-5" />
                    Access Dashboard
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="text-center">
              <p className="text-gray-600">
                New to our platform?{' '}
                <Link 
                  href="/auth/signup" 
                  className="font-semibold text-black hover:text-gray-700 transition-colors duration-200"
                >
                  Create account & get $10,000
                </Link>
              </p>
            </div>

            {/* Benefits Preview */}
            <div className="mt-6 p-4 bg-gray-100 border border-gray-200">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <DollarSign className="h-5 w-5 text-black" />
                <span className="text-black font-semibold">Platform Access</span>
              </div>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex items-center space-x-2">
                  <div className="w-1 h-1 bg-black"></div>
                  <span>$10,000 virtual trading balance</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-1 h-1 bg-black"></div>
                  <span>Real-time market data & analytics</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-1 h-1 bg-black"></div>
                  <span>Professional trading tools</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-gray-500 text-sm">
            © 2025 Financial Trading Platform. Virtual capital simulation.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function SignIn() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-300 border-t-black" />
      </div>
    }>
      <SignInContent />
    </Suspense>
  )
}