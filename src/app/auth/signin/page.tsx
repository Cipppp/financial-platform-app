'use client'

import { useState, useEffect } from 'react'
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

export default function SignIn() {
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
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute top-40 right-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-20 left-40 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-2000"></div>
        </div>
      </div>

      <div className="relative max-w-md w-full space-y-8">
        {/* Back to Home */}
        <Link 
          href="/"
          className="inline-flex items-center text-blue-200 hover:text-white transition-colors duration-200 group"
        >
          <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>

        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2 mb-6">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">Financial Platform</span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Welcome Back
            </h2>
            <p className="text-blue-200">
              Sign in to continue your trading journey
            </p>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-500/20 border border-green-400/30 rounded-xl backdrop-blur-sm">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                <span className="text-green-100 text-sm font-medium">{successMessage}</span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-400/30 rounded-xl backdrop-blur-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-400 rounded-full flex-shrink-0"></div>
                <span className="text-red-100 text-sm font-medium">{error}</span>
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-blue-100">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-blue-300" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full pl-12 pr-4 py-3 bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-blue-100">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-blue-300" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="block w-full pl-12 pr-12 py-3 bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-blue-300 hover:text-white transition-colors" />
                  ) : (
                    <Eye className="h-5 w-5 text-blue-300 hover:text-white transition-colors" />
                  )}
                </button>
              </div>
            </div>

            {/* Sign In Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center items-center py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-blue-500/25"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  <>
                    <TrendingUp className="mr-2 h-5 w-5" />
                    Sign In to Dashboard
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <div className="text-center">
              <p className="text-blue-200">
                New to our platform?{' '}
                <Link 
                  href="/auth/signup" 
                  className="font-semibold text-green-400 hover:text-green-300 transition-colors duration-200"
                >
                  Create account & get $10,000
                </Link>
              </p>
            </div>

            {/* Benefits Preview */}
            <div className="mt-6 p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl border border-green-400/20">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <DollarSign className="h-5 w-5 text-green-400" />
                <span className="text-green-300 font-semibold">What awaits you</span>
              </div>
              <div className="space-y-2 text-sm text-green-100">
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                  <span>$10,000 virtual trading balance</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                  <span>Real-time market data & analytics</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                  <span>Professional trading tools</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-blue-300 text-sm">
            © 2025 Financial Trading Platform. Practice trading with virtual money.
          </p>
        </div>
      </div>
    </div>
  )
}