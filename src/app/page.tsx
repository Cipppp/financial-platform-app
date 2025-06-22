'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  TrendingUp, 
  BarChart3, 
  PieChart, 
  DollarSign, 
  Activity, 
  Shield,
  ArrowRight,
  Target,
  Globe
} from 'lucide-react'

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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="relative">
          <div className="animate-spin rounded-full h-20 w-20 border-4 border-gray-200 border-t-black" />
          <div className="absolute inset-0 flex items-center justify-center">
            <DollarSign className="h-8 w-8 text-black animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  if (session) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Hero Section */}
      <div className="relative overflow-hidden border-b border-gray-200">
        <div className="relative container mx-auto px-4 py-20">
          <div className="text-center max-w-5xl mx-auto">
            <div className="inline-flex items-center bg-gray-100 rounded-full px-6 py-2 mb-8 border border-gray-300">
              <Activity className="h-4 w-4 mr-2 text-black" />
              <span className="text-sm font-medium text-gray-700">Professional Trading Platform</span>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-bold mb-6 text-black leading-tight">
              Financial Trading
              <br />
              <span className="text-5xl md:text-6xl text-gray-600">Simulation</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
              Practice trading with <span className="font-bold text-black">$10,000</span> virtual capital using real market data.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Link 
                href="/auth/signup"
                className="group relative inline-flex items-center px-8 py-4 bg-black text-white font-bold rounded-none hover:bg-gray-800 transition-all duration-300 border border-black"
              >
                <DollarSign className="mr-2 h-6 w-6" />
                Start Trading
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link 
                href="/auth/signin"
                className="inline-flex items-center px-8 py-4 bg-transparent text-black font-semibold rounded-none hover:bg-gray-100 transition-all duration-300 border border-gray-400"
              >
                Sign In
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
              <div className="text-center border-r border-gray-200 last:border-r-0">
                <div className="text-3xl font-bold text-black">$10,000</div>
                <div className="text-sm text-gray-500">Virtual Capital</div>
              </div>
              <div className="text-center border-r border-gray-200 last:border-r-0">
                <div className="text-3xl font-bold text-black">Real-time</div>
                <div className="text-sm text-gray-500">Market Data</div>
              </div>
              <div className="text-center border-r border-gray-200 last:border-r-0">
                <div className="text-3xl font-bold text-black">Zero</div>
                <div className="text-sm text-gray-500">Financial Risk</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-black">24/7</div>
                <div className="text-sm text-gray-500">Market Access</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-black">Trading Features</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: Activity,
                title: "Real-Time Data",
                description: "Live stock prices"
              },
              {
                icon: BarChart3,
                title: "Portfolio Analytics",
                description: "Track performance"
              },
              {
                icon: Shield,
                title: "Risk-Free",
                description: "Virtual money only"
              }
            ].map((feature, index) => (
              <div key={index} className="group relative">
                <div className="relative bg-white p-8 border border-gray-200 hover:border-gray-400 transition-all duration-300">
                  <div className="inline-flex p-3 bg-black mb-4">
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-black">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-20 bg-white border-y border-gray-200">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-8 text-black">Key Features</h2>
              <div className="space-y-6">
                {[
                  "$10,000 virtual capital",
                  "Real-time market data",
                  "Zero financial risk", 
                  "Portfolio tracking"
                ].map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="w-2 h-2 bg-black mt-3 flex-shrink-0" />
                    <span className="text-lg text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="bg-gray-100 p-8 border border-gray-200">
                <h3 className="text-2xl font-bold mb-6 text-center text-black">Account Specifications</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-gray-200">
                    <span className="font-medium text-gray-600">Virtual Capital</span>
                    <span className="text-2xl font-bold text-black">$10,000</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-200">
                    <span className="font-medium text-gray-600">Market Data</span>
                    <span className="text-black font-bold">Real-time</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-200">
                    <span className="font-medium text-gray-600">Analytics Suite</span>
                    <span className="text-black font-bold">Professional</span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="font-medium text-gray-600">Financial Risk</span>
                    <span className="text-black font-bold">$0</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* CTA Section */}
      <div className="py-20 bg-black text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Begin Trading</h2>
          <p className="text-xl mb-10 max-w-2xl mx-auto text-gray-300">
            Access professional trading infrastructure
          </p>
          <Link 
            href="/auth/signup"
            className="inline-flex items-center px-12 py-6 bg-white text-black font-bold text-xl hover:bg-gray-200 transition-all duration-300 border border-white"
          >
            <DollarSign className="mr-3 h-8 w-8" />
            Access Platform
            <ArrowRight className="ml-3 h-6 w-6" />
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-12 bg-white border-t border-gray-200">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <TrendingUp className="h-6 w-6 text-black" />
            <span className="text-xl font-bold text-black">Financial Trading Platform</span>
          </div>
          <p className="text-gray-600">
            © 2025 Financial Trading Platform. Virtual capital simulation environment.
          </p>
        </div>
      </footer>
    </div>
  )
}