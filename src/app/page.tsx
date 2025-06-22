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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
        <div className="relative">
          <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-300 border-t-white" />
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
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative container mx-auto px-4 py-20">
          <div className="text-center max-w-5xl mx-auto">
            <div className="inline-flex items-center bg-white/10 backdrop-blur-sm rounded-full px-6 py-2 mb-8 border border-white/20">
              <Zap className="h-4 w-4 mr-2 text-yellow-400" />
              <span className="text-sm font-medium">Live Trading Simulation</span>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent leading-tight">
              Master Trading
              <br />
              <span className="text-5xl md:text-6xl">Risk-Free</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-blue-100 mb-10 max-w-3xl mx-auto leading-relaxed">
              Practice with <span className="font-bold text-green-400">$10,000</span> virtual money using real-time market data. 
              Build confidence, test strategies, and learn trading without financial risk.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Link 
                href="/auth/signup"
                className="group relative inline-flex items-center px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-full hover:from-green-600 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-green-500/25"
              >
                <DollarSign className="mr-2 h-6 w-6 group-hover:animate-bounce" />
                Get $10,000 Free
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link 
                href="/auth/signin"
                className="inline-flex items-center px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-full hover:bg-white/20 transition-all duration-300 border border-white/30"
              >
                Sign In
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400">$10K</div>
                <div className="text-sm text-blue-200">Starting Balance</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400">Real-time</div>
                <div className="text-sm text-blue-200">Market Data</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400">0%</div>
                <div className="text-sm text-blue-200">Real Risk</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-400">24/7</div>
                <div className="text-sm text-blue-200">Practice Trading</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-gradient-to-b from-transparent to-black/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Everything You Need to Learn Trading</h2>
            <p className="text-xl text-blue-200 max-w-2xl mx-auto">
              Professional-grade tools and real market conditions in a risk-free environment
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: Activity,
                title: "Real-Time Market Data",
                description: "Live stock prices powered by Tiingo API with 15-minute refresh cycles",
                color: "from-blue-500 to-cyan-500"
              },
              {
                icon: BarChart3,
                title: "Advanced Analytics",
                description: "Technical indicators, charts, and comprehensive market analysis tools",
                color: "from-purple-500 to-pink-500"
              },
              {
                icon: PieChart,
                title: "Portfolio Tracking",
                description: "Monitor your investments with detailed performance metrics and insights",
                color: "from-green-500 to-emerald-500"
              },
              {
                icon: Shield,
                title: "Risk-Free Learning",
                description: "Practice trading strategies without any financial risk or consequences",
                color: "from-orange-500 to-red-500"
              },
              {
                icon: Target,
                title: "Strategy Testing",
                description: "Backtest and validate your trading strategies with historical data",
                color: "from-indigo-500 to-purple-500"
              },
              {
                icon: Globe,
                title: "Global Markets",
                description: "Access to major stock exchanges and thousands of trading instruments",
                color: "from-teal-500 to-blue-500"
              }
            ].map((feature, index) => (
              <div key={index} className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl blur-xl" 
                     style={{background: `linear-gradient(to right, ${feature.color.split(' ')[1]}, ${feature.color.split(' ')[3]})`}} />
                <div className="relative bg-white/10 backdrop-blur-sm p-8 rounded-2xl border border-white/20 hover:border-white/40 transition-all duration-300 transform hover:scale-105">
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${feature.color} mb-4`}>
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
                  <p className="text-blue-200 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-20 bg-black/20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-8">Why Choose Our Platform?</h2>
              <div className="space-y-6">
                {[
                  "Start with $10,000 in virtual money - no deposit required",
                  "Real-time market data from professional sources",
                  "Practice without any financial risk or consequences", 
                  "Professional-grade tools and analytics",
                  "Track your progress and improve your strategies",
                  "Learn from mistakes without losing real money"
                ].map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <CheckCircle className="h-6 w-6 text-green-400 mt-1 flex-shrink-0" />
                    <span className="text-lg text-blue-100">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl transform rotate-6" />
              <div className="relative bg-white/10 backdrop-blur-sm p-8 rounded-3xl border border-white/20">
                <h3 className="text-2xl font-bold mb-6 text-center">What You Get</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-white/20">
                    <span className="font-medium">Virtual Trading Balance</span>
                    <span className="text-2xl font-bold text-green-400">$10,000</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-white/20">
                    <span className="font-medium">Real Market Data</span>
                    <span className="text-green-400 font-bold">✓ Included</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-white/20">
                    <span className="font-medium">Advanced Analytics</span>
                    <span className="text-green-400 font-bold">✓ Included</span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="font-medium">Financial Risk</span>
                    <span className="text-red-400 font-bold">$0</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">What Our Users Say</h2>
            <p className="text-xl text-blue-200">Join thousands of traders learning risk-free</p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="relative bg-white/10 backdrop-blur-sm rounded-3xl p-8 md:p-12 border border-white/20">
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-light mb-8 leading-relaxed">
                  "{testimonials[currentSlide].comment}"
                </div>
                <div className="flex items-center justify-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-lg">{testimonials[currentSlide].name}</div>
                    <div className="text-blue-300">{testimonials[currentSlide].role}</div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-center mt-8 space-x-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      index === currentSlide ? 'bg-white' : 'bg-white/30'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-r from-green-600 via-blue-600 to-purple-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Start Trading?</h2>
          <p className="text-xl mb-10 max-w-2xl mx-auto">
            Join thousands of traders who are mastering the markets with our risk-free platform
          </p>
          <Link 
            href="/auth/signup"
            className="inline-flex items-center px-12 py-6 bg-white text-blue-900 font-bold text-xl rounded-full hover:bg-blue-50 transition-all duration-300 transform hover:scale-105 shadow-2xl"
          >
            <DollarSign className="mr-3 h-8 w-8" />
            Get Your $10,000 Now
            <ArrowRight className="ml-3 h-6 w-6" />
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-12 bg-black/40 border-t border-white/10">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <TrendingUp className="h-6 w-6 text-blue-400" />
            <span className="text-xl font-bold">Financial Trading Platform</span>
          </div>
          <p className="text-blue-300">
            © 2025 Financial Trading Platform. Practice trading with virtual money.
          </p>
        </div>
      </footer>
    </div>
  )
}