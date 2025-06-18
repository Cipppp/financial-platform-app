// src/app/dashboard/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

// Removed POPULAR_STOCKS - now using market gainers/losers

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


export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [portfolio, setPortfolio] = useState<any>(null)
  const [recentTrades, setRecentTrades] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return // Still loading
    if (!session) {
      router.push('/auth/signin')
      return
    }
  }, [session, status, router])

  useEffect(() => {
    async function fetchData() {
      if (!session) return
      
      try {
        setLoading(true)
        
        // Fetch portfolio data
        const portfolioResponse = await fetch('/api/portfolio')
        if (portfolioResponse.ok) {
          const portfolioData = await portfolioResponse.json()
          setPortfolio(portfolioData)
        }
        
        
        // Fetch recent trades
        const tradesResponse = await fetch('/api/trades?limit=5')
        if (tradesResponse.ok) {
          const tradesData = await tradesResponse.json()
          setRecentTrades(tradesData.trades || [])
        }
      } catch (err) {
        console.error('Error fetching data:', err)
        setError('Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [session])

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-300 border-t-blue-600" />
        <span className="ml-3 text-gray-600">Loading portfolio data...</span>
      </div>
    )
  }

  if (!session) {
    return null // Will redirect via useEffect
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    )
  }

  // Use real portfolio data
  const portfolioValue = portfolio?.totalValue || 0
  const dailyChange = portfolio?.dailyChange || 0
  const totalReturn = portfolio?.totalReturn || 0

  return (
    <div className="space-y-4 lg:space-y-6 min-h-screen">
      <div>
        <h1 className="text-2xl lg:text-4xl font-black text-black dark:text-white">Portfolio Overview</h1>
        <p className="text-sm lg:text-base font-bold text-black dark:text-white mt-2">Welcome back, {session.user?.name || session.user?.email}!</p>
        <p className="text-xs lg:text-sm font-semibold text-black dark:text-white">
          Track your demo trading portfolio
          {process.env.NEXT_PUBLIC_USE_DUMMY_DATA === 'true' && ' • Using demo data'}
        </p>
      </div>
      
      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <Card className="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700">
          <CardContent className="p-3 lg:p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide [&]:!text-slate-950 [&]:!text-opacity-100" style={{color: '#020617 !important', WebkitTextFillColor: '#020617 !important'}}>Available Cash</h3>
            <p className="text-lg lg:text-xl font-bold mt-1 [&]:!text-slate-950 [&]:!text-opacity-100" style={{color: '#020617 !important', WebkitTextFillColor: '#020617 !important'}}>{formatCurrency(portfolio?.currentBalance || 0)}</p>
            <p className="text-xs font-medium mt-1 [&]:!text-slate-500 [&]:!text-opacity-100" style={{color: '#64748b !important', WebkitTextFillColor: '#64748b !important'}}>Buying power</p>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700">
          <CardContent className="p-3 lg:p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide [&]:!text-slate-950 [&]:!text-opacity-100" style={{color: '#020617 !important', WebkitTextFillColor: '#020617 !important'}}>Total Portfolio</h3>
            <p className="text-lg lg:text-xl font-bold mt-1 [&]:!text-slate-950 [&]:!text-opacity-100" style={{color: '#020617 !important', WebkitTextFillColor: '#020617 !important'}}>{formatCurrency(portfolioValue)}</p>
            <p className="text-xs font-medium mt-1 [&]:!text-slate-500 [&]:!text-opacity-100" style={{color: '#64748b !important', WebkitTextFillColor: '#64748b !important'}}>Total value</p>
          </CardContent>
        </Card>
        
        <Card className={`${dailyChange >= 0 ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'}`}>
          <CardContent className="p-3 lg:p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide [&]:!text-green-600 [&]:!text-opacity-100" style={{color: '#059669 !important', WebkitTextFillColor: '#059669 !important'}}>Daily Change</h3>
            <p className="text-lg lg:text-xl font-bold mt-1 !text-green-800 [&>*]:!text-green-800" style={{color: '#047857 !important', WebkitTextFillColor: '#047857 !important', fill: '#047857 !important'}}>
              <span style={{color: '#047857 !important', WebkitTextFillColor: '#047857 !important'}}>{formatCurrency(dailyChange)}</span>
            </p>
            <p className="text-xs font-medium mt-1 [&]:!text-green-600 [&]:!text-opacity-100" style={{color: '#059669 !important', WebkitTextFillColor: '#059669 !important'}}>Today&apos;s performance</p>
          </CardContent>
        </Card>
        
        <Card className={`${totalReturn >= 0 ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700' : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700'}`}>
          <CardContent className="p-3 lg:p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide [&]:!text-purple-600 [&]:!text-opacity-100" style={{color: '#7c3aed !important', WebkitTextFillColor: '#7c3aed !important'}}>Total Return</h3>
            <p className="text-lg lg:text-xl font-bold mt-1 !text-purple-600 [&]:!text-purple-600 [&>*]:!text-purple-600" style={{color: '#7c3aed !important', WebkitTextFillColor: '#7c3aed !important', fill: '#7c3aed !important'}}>
              <span style={{color: '#7c3aed !important', WebkitTextFillColor: '#7c3aed !important'}}>{formatPercent(totalReturn)}</span>
            </p>
            <p className="text-xs font-medium mt-1 [&]:!text-slate-500 [&]:!text-opacity-100" style={{color: '#64748b !important', WebkitTextFillColor: '#64748b !important'}}>Overall gains</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Portfolio Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <Card>
          <CardHeader>
            <h2 className="text-xl lg:text-2xl font-bold text-gray-900">Portfolio Distribution</h2>
            <p className="text-xs lg:text-sm text-gray-600">Your holdings allocation</p>
          </CardHeader>
          <CardContent>
            {portfolio?.holdings && portfolio.holdings.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={portfolio.holdings.map((holding: any) => ({
                        name: holding.symbol,
                        value: holding.currentValue,
                        percentage: ((holding.currentValue / portfolio.totalValue) * 100).toFixed(1)
                      }))}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percentage }: any) => `${name} ${percentage}%`}
                    >
                      {portfolio.holdings.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 50%)`} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">No holdings to display</p>
                <p className="text-sm text-gray-500 mt-1">Start trading to see your portfolio distribution</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-xl lg:text-2xl font-bold text-gray-900">Recent Trades</h2>
            <p className="text-xs lg:text-sm text-gray-600">Your latest trading activity</p>
          </CardHeader>
          <CardContent>
            {recentTrades.length > 0 ? (
              <div className="space-y-3">
                {recentTrades.map((trade: any) => (
                  <div key={trade.id} className="flex justify-between items-center p-3 bg-gray-50 border border-gray-200">
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                        trade.type === 'BUY' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {trade.type}
                      </span>
                      <div>
                        <div className="font-medium text-gray-900">{trade.symbol}</div>
                        <div className="text-sm text-gray-600">{trade.shares} shares</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">{formatCurrency(trade.total)}</div>
                      <div className="text-sm text-gray-600">{formatCurrency(trade.price)}/share</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">No recent trades</p>
                <p className="text-sm text-gray-500 mt-1">Your trading activity will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      

      {/* Footer */}
      <div className="text-center py-8">
        <p className="text-gray-500">Integrative web platform for stock index analysis and prediction</p>
        <p className="text-xs text-gray-400 mt-1">Advanced analytics • Machine Learning • Real-time Data</p>
      </div>
    </div>
  )
}