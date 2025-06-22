'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  TrendingUp, 
  ArrowLeft,
  User,
  DollarSign,
  Loader2,
  CheckCircle,
  Star,
  Zap,
  Gift,
  Shield
} from 'lucide-react'

export default function SignUp() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const router = useRouter()

  const calculatePasswordStrength = (pwd: string) => {
    let strength = 0
    if (pwd.length >= 6) strength += 1
    if (pwd.length >= 8) strength += 1
    if (/[A-Z]/.test(pwd)) strength += 1
    if (/[0-9]/.test(pwd)) strength += 1
    if (/[^A-Za-z0-9]/.test(pwd)) strength += 1
    return strength
  }

  const handlePasswordChange = (pwd: string) => {
    setPassword(pwd)
    setPasswordStrength(calculatePasswordStrength(pwd))
  }

  const getPasswordStrengthText = () => {
    switch (passwordStrength) {
      case 0:
      case 1: return { text: 'Weak', color: 'text-red-400' }
      case 2:
      case 3: return { text: 'Good', color: 'text-yellow-400' }
      case 4:
      case 5: return { text: 'Strong', color: 'text-green-400' }
      default: return { text: 'Weak', color: 'text-red-400' }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        router.push('/auth/signin?message=Account created successfully! You can now sign in.')
      } else {
        setError(data.error || 'An error occurred')
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
          <div className="absolute top-20 left-20 w-72 h-72 bg-green-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute top-40 right-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-20 left-40 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-2000"></div>
        </div>
      </div>

      <div className="relative max-w-2xl w-full space-y-8">
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
              <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl">
                <Gift className="h-8 w-8 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">Get Started</span>
            </div>
            <h2 className="text-4xl font-bold text-white mb-2">
              Claim Your <span className="text-green-400">$10,000</span>
            </h2>
            <p className="text-blue-200 text-lg">
              Start trading risk-free with virtual money today
            </p>
          </div>

          {/* Benefits Banner */}
          <div className="mb-8 p-6 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl border border-green-400/30">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="inline-flex p-2 bg-green-500/20 rounded-xl mb-2">
                  <DollarSign className="h-6 w-6 text-green-400" />
                </div>
                <div className="text-2xl font-bold text-green-400">$10,000</div>
                <div className="text-sm text-green-200">Virtual Balance</div>
              </div>
              <div className="text-center">
                <div className="inline-flex p-2 bg-blue-500/20 rounded-xl mb-2">
                  <Zap className="h-6 w-6 text-blue-400" />
                </div>
                <div className="text-2xl font-bold text-blue-400">Real-time</div>
                <div className="text-sm text-blue-200">Market Data</div>
              </div>
              <div className="text-center">
                <div className="inline-flex p-2 bg-purple-500/20 rounded-xl mb-2">
                  <Shield className="h-6 w-6 text-purple-400" />
                </div>
                <div className="text-2xl font-bold text-purple-400">0% Risk</div>
                <div className="text-sm text-purple-200">Practice Safe</div>
              </div>
            </div>
          </div>

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name Field */}
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium text-blue-100">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-blue-300" />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    className="block w-full pl-12 pr-4 py-3 bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>

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
                    className="block w-full pl-12 pr-4 py-3 bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
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
                  autoComplete="new-password"
                  required
                  className="block w-full pl-12 pr-12 py-3 bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  placeholder="Create a secure password"
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
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
              
              {/* Password Strength Indicator */}
              {password && (
                <div className="mt-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-blue-200">Password strength:</span>
                    <span className={`text-xs font-medium ${getPasswordStrengthText().color}`}>
                      {getPasswordStrengthText().text}
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        passwordStrength <= 1 ? 'bg-red-500' :
                        passwordStrength <= 3 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${(passwordStrength / 5) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <label htmlFor="confirm-password" className="block text-sm font-medium text-blue-100">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-blue-300" />
                </div>
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  className="block w-full pl-12 pr-12 py-3 bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-blue-300 hover:text-white transition-colors" />
                  ) : (
                    <Eye className="h-5 w-5 text-blue-300 hover:text-white transition-colors" />
                  )}
                </button>
              </div>
              
              {/* Password Match Indicator */}
              {confirmPassword && (
                <div className="mt-2 flex items-center space-x-2">
                  {password === confirmPassword ? (
                    <CheckCircle className="h-4 w-4 text-green-400" />
                  ) : (
                    <div className="w-4 h-4 border-2 border-red-400 rounded-full" />
                  )}
                  <span className={`text-xs ${password === confirmPassword ? 'text-green-400' : 'text-red-400'}`}>
                    {password === confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                  </span>
                </div>
              )}
            </div>

            {/* Sign Up Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center items-center py-4 px-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-4 focus:ring-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-green-500/25"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creating Your Account...
                  </>
                ) : (
                  <>
                    <Gift className="mr-2 h-6 w-6 group-hover:animate-bounce" />
                    Claim $10,000 & Start Trading
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Benefits List */}
          <div className="mt-8 p-6 bg-black/20 rounded-2xl border border-white/10">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center">
              <Star className="h-5 w-5 text-yellow-400 mr-2" />
              What you get instantly:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              {[
                "💰 $10,000 virtual trading balance",
                "📈 Real-time market data from Tiingo",
                "📊 Professional trading tools & charts",
                "🎯 Risk-free learning environment",
                "📱 Mobile-responsive platform",
                "🔒 Secure account protection"
              ].map((benefit, index) => (
                <div key={index} className="flex items-center space-x-2 text-blue-100">
                  <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <div className="text-center">
              <p className="text-blue-200">
                Already have an account?{' '}
                <Link 
                  href="/auth/signin" 
                  className="font-semibold text-blue-400 hover:text-blue-300 transition-colors duration-200"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-blue-300 text-sm">
            © 2025 Financial Trading Platform. Practice trading with virtual money.
          </p>
          <p className="text-blue-400 text-xs mt-1">
            No real money required • 100% risk-free • Educational purposes
          </p>
        </div>
      </div>
    </div>
  )
}