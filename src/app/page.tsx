'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  TrendingUp, 
  BarChart3, 
  PieChart, 
  DollarSign, 
  Activity, 
  Shield,
  Users,
  ArrowRight,
  CheckCircle,
  Zap,
  Target,
  Globe
} from 'lucide-react'

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [currentSlide, setCurrentSlide] = useState(0)

  const testimonials = [
    {
      name: "Alex Chen",
      role: "Student",
      comment: "Perfect for learning trading without risking real money. The interface is intuitive and the data is real-time!"
    },
    {
      name: "Sarah Johnson", 
      role: "Investor",
      comment: "I use this to test my strategies before implementing them with real funds. Incredibly valuable tool."
    },
    {
      name: "Mike Rodriguez",
      role: "Finance Professional", 
      comment: "The analytics and portfolio tracking features are outstanding. Great for educational purposes."
    }
  ]

  useEffect(() => {
    if (status === 'loading') return
    if (session) {
      router.push('/dashboard')
    }
  }, [session, status, router])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % testimonials.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [testimonials.length])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="relative">
          <div className="animate-spin rounded-full h-20 w-20 border-4 border-gray-600 border-t-white" />
          <div className="absolute inset-0 flex items-center justify-center">
            <DollarSign className="h-8 w-8 text-white animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  if (session) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden border-b border-gray-800">
        <div className="relative container mx-auto px-4 py-20">
          <div className="text-center max-w-5xl mx-auto">
            <div className="inline-flex items-center bg-gray-900 rounded-full px-6 py-2 mb-8 border border-gray-700">
              <Activity className="h-4 w-4 mr-2 text-white" />
              <span className="text-sm font-medium text-gray-300">Professional Trading Platform</span>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-bold mb-6 text-white leading-tight">
              Financial Trading
              <br />
              <span className="text-5xl md:text-6xl text-gray-300">Simulation</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-400 mb-10 max-w-3xl mx-auto leading-relaxed">
              Practice with <span className="font-bold text-white">$10,000</span> virtual capital using real-time market data. 
              Develop expertise, validate strategies, and master trading without financial exposure.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Link 
                href="/auth/signup"
                className="group relative inline-flex items-center px-8 py-4 bg-white text-black font-bold rounded-none hover:bg-gray-200 transition-all duration-300 border border-white"
              >
                <DollarSign className="mr-2 h-6 w-6" />
                Start Trading
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link 
                href="/auth/signin"
                className="inline-flex items-center px-8 py-4 bg-transparent text-white font-semibold rounded-none hover:bg-gray-900 transition-all duration-300 border border-gray-600"
              >
                Sign In
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
              <div className="text-center border-r border-gray-800 last:border-r-0">
                <div className="text-3xl font-bold text-white">$10,000</div>
                <div className="text-sm text-gray-500">Virtual Capital</div>
              </div>
              <div className="text-center border-r border-gray-800 last:border-r-0">
                <div className="text-3xl font-bold text-white">Real-time</div>
                <div className="text-sm text-gray-500">Market Data</div>
              </div>
              <div className="text-center border-r border-gray-800 last:border-r-0">
                <div className="text-3xl font-bold text-white">Zero</div>
                <div className="text-sm text-gray-500">Financial Risk</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">24/7</div>
                <div className="text-sm text-gray-500">Market Access</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-gray-950">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">Professional Trading Infrastructure</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Enterprise-grade tools and real market conditions in a risk-controlled environment
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: Activity,
                title: "Real-Time Market Data",
                description: "Live stock prices powered by Tiingo API with 15-minute refresh cycles"
              },
              {
                icon: BarChart3,
                title: "Advanced Analytics",
                description: "Technical indicators, charts, and comprehensive market analysis tools"
              },
              {
                icon: PieChart,
                title: "Portfolio Tracking",
                description: "Monitor your investments with detailed performance metrics and insights"
              },
              {
                icon: Shield,
                title: "Risk-Free Learning",
                description: "Practice trading strategies without any financial risk or consequences"
              },
              {
                icon: Target,
                title: "Strategy Testing",
                description: "Backtest and validate your trading strategies with historical data"
              },
              {
                icon: Globe,
                title: "Global Markets",
                description: "Access to major stock exchanges and thousands of trading instruments"
              }
            ].map((feature, index) => (
              <div key={index} className="group relative">
                <div className="relative bg-gray-900 p-8 border border-gray-800 hover:border-gray-600 transition-all duration-300">
                  <div className="inline-flex p-3 bg-white mb-4">
                    <feature.icon className="h-6 w-6 text-black" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-20 bg-black border-y border-gray-800">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-8 text-white">Platform Advantages</h2>
              <div className="space-y-6">
                {[
                  "$10,000 virtual capital allocation - no deposit required",
                  "Real-time market data from institutional sources",
                  "Zero financial exposure or consequences", 
                  "Professional-grade analytical tools",
                  "Comprehensive performance tracking",
                  "Risk-free strategy development"
                ].map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="w-2 h-2 bg-white mt-3 flex-shrink-0" />
                    <span className="text-lg text-gray-300">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="bg-gray-900 p-8 border border-gray-800">
                <h3 className="text-2xl font-bold mb-6 text-center text-white">Account Specifications</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-gray-800">
                    <span className="font-medium text-gray-400">Virtual Capital</span>
                    <span className="text-2xl font-bold text-white">$10,000</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-800">
                    <span className="font-medium text-gray-400">Market Data</span>
                    <span className="text-white font-bold">Real-time</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-800">
                    <span className="font-medium text-gray-400">Analytics Suite</span>
                    <span className="text-white font-bold">Professional</span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="font-medium text-gray-400">Financial Risk</span>
                    <span className="text-white font-bold">$0</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="py-20 bg-gray-950">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">User Testimonials</h2>
            <p className="text-xl text-gray-400">Professional traders developing skills risk-free</p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="relative bg-black p-8 md:p-12 border border-gray-800">
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-light mb-8 leading-relaxed text-gray-300">
                  "{testimonials[currentSlide].comment}"
                </div>
                <div className="flex items-center justify-center space-x-4">
                  <div className="w-12 h-12 bg-white flex items-center justify-center">
                    <Users className="h-6 w-6 text-black" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-lg text-white">{testimonials[currentSlide].name}</div>
                    <div className="text-gray-400">{testimonials[currentSlide].role}</div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-center mt-8 space-x-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-3 h-3 transition-all duration-300 ${
                      index === currentSlide ? 'bg-white' : 'bg-gray-600'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-white text-black">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Begin Trading</h2>
          <p className="text-xl mb-10 max-w-2xl mx-auto text-gray-700">
            Access professional trading infrastructure with comprehensive risk management
          </p>
          <Link 
            href="/auth/signup"
            className="inline-flex items-center px-12 py-6 bg-black text-white font-bold text-xl hover:bg-gray-800 transition-all duration-300 border border-black"
          >
            <DollarSign className="mr-3 h-8 w-8" />
            Access Platform
            <ArrowRight className="ml-3 h-6 w-6" />
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-12 bg-black border-t border-gray-800">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <TrendingUp className="h-6 w-6 text-white" />
            <span className="text-xl font-bold text-white">Financial Trading Platform</span>
          </div>
          <p className="text-gray-400">
            © 2025 Financial Trading Platform. Virtual capital simulation environment.
          </p>
        </div>
      </footer>
    </div>
  )
}