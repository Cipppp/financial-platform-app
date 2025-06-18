// src/app/page.tsx
'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { TrendingUp, BarChart3, PieChart } from 'lucide-react'

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return
    if (session) {
      router.push('/dashboard')
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-300 border-t-blue-600" />
      </div>
    )
  }

  if (session) {
    return null // Will redirect
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Financial Demo Trading Platform
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Practice trading with $10,000 in demo money using real-time stock data from Tiingo API. 
            Perfect for learning and testing strategies without real money.
          </p>
          <div className="flex justify-center space-x-4">
            <Link 
              href="/auth/signup"
              className="inline-flex items-center px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              <BarChart3 className="mr-2 h-5 w-5" />
              Start Trading with $10,000
            </Link>
            <Link 
              href="/auth/signin"
              className="inline-flex items-center px-8 py-4 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              Sign In
            </Link>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center p-6 bg-white rounded-lg shadow-md">
            <TrendingUp className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Real-time Data</h3>
            <p className="text-gray-600">Live stock prices and market updates</p>
          </div>
          
          <div className="text-center p-6 bg-white rounded-lg shadow-md">
            <BarChart3 className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Advanced Analytics</h3>
            <p className="text-gray-600">Technical indicators and trend analysis</p>
          </div>
          
          <div className="text-center p-6 bg-white rounded-lg shadow-md">
            <PieChart className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Portfolio Management</h3>
            <p className="text-gray-600">Track and optimize your investments</p>
          </div>
        </div>
      </div>
    </div>
  )
}