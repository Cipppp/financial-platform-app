// src/app/dashboard/stocks/[symbol]/page.tsx
'use client'

import React, { useState, useEffect, use } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { formatCurrency, formatPercent } from '@/lib/utils'
import TradingSidePanel from '@/components/ui/TradingSidePanel'
import TradingViewWidget from '@/components/charts/TradingViewWidget'
import { ArrowLeft, TrendingUp, TrendingDown, BarChart3, DollarSign, Activity, Users } from 'lucide-react'

// Modern Card Components
const Card = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={`card-modern border-0 shadow-sm ${className}`}>
    {children}
  </div>
)

const CardHeader = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={`px-6 py-4 border-b border-slate-200/50 ${className}`}>
    {children}
  </div>
)

const CardContent = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={`px-6 py-4 ${className}`}>
    {children}
  </div>
)

interface StockDetailPageProps {
  params: Promise<{
    symbol: string
  }>
}

export default function StockDetailPage({ params }: StockDetailPageProps) {
  const resolvedParams = use(params)
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stock, setStock] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedStock, setSelectedStock] = useState<any>(null)
  const [showTradingPanel, setShowTradingPanel] = useState(false)
  const [selectedCurrency, setSelectedCurrency] = useState('USD')

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
      return
    }
  }, [session, status, router])

  // Load stock data
  useEffect(() => {
    const loadStockData = async () => {
      if (!session || !resolvedParams.symbol) return
      
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch(`/api/stocks/${resolvedParams.symbol}`)
        if (response.ok) {
          const data = await response.json()
          setStock(data)
        } else {
          setError('Stock not found')
        }
      } catch (err) {
        console.error('Error loading stock:', err)
        setError('Failed to load stock data')
      } finally {
        setLoading(false)
      }
    }

    if (session) {
      loadStockData()
    }
  }, [session, resolvedParams.symbol])

  const handleTrade = () => {
    if (stock) {
      setSelectedStock(stock)
      setShowTradingPanel(true)
    }
  }

  const handleTradeComplete = () => {
    console.log('Trade completed successfully')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-black text-white mb-4">
            <BarChart3 className="w-8 h-8 animate-pulse" />
          </div>
          <div className="text-lg font-medium text-slate-900">Loading {resolvedParams.symbol}...</div>
        </div>
      </div>
    )
  }

  if (error || !stock) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium text-slate-900 mb-4">{error}</div>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-black text-white hover:bg-slate-800 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  const isPositive = stock.change >= 0

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 transition-all duration-300 ${
      showTradingPanel ? 'mr-96' : ''
    }`}>
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="inline-flex items-center text-slate-600 hover:text-slate-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back
              </button>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">
                  {stock.symbol}
                </h1>
                <p className="text-slate-600">{stock.name}</p>
              </div>
            </div>
            <button
              onClick={handleTrade}
              className="px-6 py-3 bg-black text-white hover:bg-slate-800 transition-colors"
            >
              Trade {stock.symbol}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Full-Width Chart */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
                <h2 className="text-xl font-semibold text-slate-900">Price Chart</h2>
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-slate-600">Currency:</label>
                  <select
                    value={selectedCurrency}
                    onChange={(e) => setSelectedCurrency(e.target.value)}
                    className="px-3 py-1 border border-slate-300 rounded-md text-sm focus:border-black focus:outline-none"
                  >
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="JPY">JPY - Japanese Yen</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[600px]">
                <TradingViewWidget
                  symbol={selectedCurrency !== 'USD' ? `FX:${selectedCurrency}USD` : stock.symbol}
                  height={600}
                  theme="light"
                />
              </div>
              {selectedCurrency !== 'USD' && (
                <div className="px-6 py-3 bg-slate-50 border-t border-slate-200">
                  <p className="text-sm text-slate-600">
                    <span className="font-medium">Note:</span> Chart shows {selectedCurrency}/USD exchange rate. 
                    Stock prices are still displayed in USD above.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Extended Hours Trading, Key Statistics, Performance, and Earnings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Extended Hours Trading */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-slate-900">Extended Hours Trading</h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <DollarSign className="w-5 h-5 text-slate-500 mr-2" />
                    <span className="text-slate-600">Pre-Market Price</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900">
                      {stock.preMarketPrice ? formatCurrency(stock.preMarketPrice) : 'N/A'}
                    </span>
                    {stock.preMarketChange && (
                      <div className={`text-sm ${stock.preMarketChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {stock.preMarketChange >= 0 ? '+' : ''}{formatCurrency(stock.preMarketChange)} ({stock.preMarketChange >= 0 ? '+' : ''}{formatPercent(stock.preMarketChangePercent || 0)})
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <DollarSign className="w-5 h-5 text-slate-500 mr-2" />
                    <span className="text-slate-600">After Hours Price</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900">
                      {stock.afterHoursPrice ? formatCurrency(stock.afterHoursPrice) : 'N/A'}
                    </span>
                    {stock.afterHoursChange && (
                      <div className={`text-sm ${stock.afterHoursChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {stock.afterHoursChange >= 0 ? '+' : ''}{formatCurrency(stock.afterHoursChange)} ({stock.afterHoursChange >= 0 ? '+' : ''}{formatPercent(stock.afterHoursChangePercent || 0)})
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-slate-900">Performance</h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">1 Week</span>
                  <span className={`font-medium ${(stock.performance?.oneWeek || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stock.performance?.oneWeek ? `${stock.performance.oneWeek >= 0 ? '+' : ''}${formatPercent(stock.performance.oneWeek)}` : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">1 Month</span>
                  <span className={`font-medium ${(stock.performance?.oneMonth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stock.performance?.oneMonth ? `${stock.performance.oneMonth >= 0 ? '+' : ''}${formatPercent(stock.performance.oneMonth)}` : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">3 Months</span>
                  <span className={`font-medium ${(stock.performance?.threeMonths || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stock.performance?.threeMonths ? `${stock.performance.threeMonths >= 0 ? '+' : ''}${formatPercent(stock.performance.threeMonths)}` : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">6 Months</span>
                  <span className={`font-medium ${(stock.performance?.sixMonths || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stock.performance?.sixMonths ? `${stock.performance.sixMonths >= 0 ? '+' : ''}${formatPercent(stock.performance.sixMonths)}` : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">1 Year</span>
                  <span className={`font-medium ${(stock.performance?.oneYear || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stock.performance?.oneYear ? `${stock.performance.oneYear >= 0 ? '+' : ''}${formatPercent(stock.performance.oneYear)}` : 'N/A'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Key Statistics */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-slate-900">Key Statistics</h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <DollarSign className="w-5 h-5 text-slate-500 mr-2" />
                    <span className="text-slate-600">Current Price</span>
                  </div>
                  <span className={`font-bold text-lg ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(stock.price)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {isPositive ? (
                      <TrendingUp className="w-5 h-5 text-green-500 mr-2" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-500 mr-2" />
                    )}
                    <span className="text-slate-600">Today's Change</span>
                  </div>
                  <span className={`font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {isPositive ? '+' : ''}{formatCurrency(stock.change)} ({isPositive ? '+' : ''}{formatPercent(stock.changePercent)})
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <DollarSign className="w-5 h-5 text-slate-500 mr-2" />
                    <span className="text-slate-600">52W High</span>
                  </div>
                  <span className="font-medium text-slate-900">
                    {stock.fiftyTwoWeekHigh ? formatCurrency(stock.fiftyTwoWeekHigh) : 'N/A'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <DollarSign className="w-5 h-5 text-slate-500 mr-2" />
                    <span className="text-slate-600">52W Low</span>
                  </div>
                  <span className="font-medium text-slate-900">
                    {stock.fiftyTwoWeekLow ? formatCurrency(stock.fiftyTwoWeekLow) : 'N/A'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Activity className="w-5 h-5 text-slate-500 mr-2" />
                    <span className="text-slate-600">Volume</span>
                  </div>
                  <span className="font-medium text-slate-900">
                    {stock.volume?.toLocaleString() || 'N/A'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Activity className="w-5 h-5 text-slate-500 mr-2" />
                    <span className="text-slate-600">Avg Volume</span>
                  </div>
                  <span className="font-medium text-slate-900">
                    {stock.avgVolume?.toLocaleString() || 'N/A'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <DollarSign className="w-5 h-5 text-slate-500 mr-2" />
                    <span className="text-slate-600">Market Cap</span>
                  </div>
                  <span className="font-medium text-slate-900">
                    {stock.marketCap ? formatCurrency(stock.marketCap) : 'N/A'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <BarChart3 className="w-5 h-5 text-slate-500 mr-2" />
                    <span className="text-slate-600">P/E Ratio</span>
                  </div>
                  <span className="font-medium text-slate-900">
                    {stock.peRatio || 'N/A'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <BarChart3 className="w-5 h-5 text-slate-500 mr-2" />
                    <span className="text-slate-600">Beta</span>
                  </div>
                  <span className="font-medium text-slate-900">
                    {stock.beta || 'N/A'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Users className="w-5 h-5 text-slate-500 mr-2" />
                    <span className="text-slate-600">Shares Outstanding</span>
                  </div>
                  <span className="font-medium text-slate-900">
                    {stock.sharesOutstanding?.toLocaleString() || 'N/A'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Earnings Information */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-slate-900">Earnings</h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Next Earnings Date</span>
                  <span className="font-medium text-slate-900">
                    {stock.nextEarningsDate ? new Date(stock.nextEarningsDate).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Last Earnings Date</span>
                  <span className="font-medium text-slate-900">
                    {stock.lastEarningsDate ? new Date(stock.lastEarningsDate).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Earnings Per Share</span>
                  <span className="font-medium text-slate-900">
                    {stock.earningsPerShare ? `$${stock.earningsPerShare.toFixed(2)}` : 'N/A'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">

          {/* Company Info */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-slate-900">Company Information</h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-slate-600">Exchange</div>
                    <div className="font-medium text-slate-900">
                      {stock.exchange || 'N/A'}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-slate-600">Sector</div>
                    <div className="font-medium text-slate-900">
                      {stock.sector || 'N/A'}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-slate-600">Industry</div>
                    <div className="font-medium text-slate-900">
                      {stock.industry || 'N/A'}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-slate-600">Country</div>
                    <div className="font-medium text-slate-900">
                      {stock.country || 'N/A'}
                    </div>
                  </div>
                </div>
                
                {stock.description && (
                  <div className="mt-6">
                    <div className="text-sm text-slate-600 mb-2">Description</div>
                    <p className="text-slate-700 leading-relaxed">
                      {stock.description}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Trading Side Panel */}
      {selectedStock && (
        <TradingSidePanel
          stock={selectedStock}
          isOpen={showTradingPanel}
          onClose={() => {
            setShowTradingPanel(false)
            setSelectedStock(null)
          }}
          onTradeComplete={handleTradeComplete}
        />
      )}
    </div>
  )
}