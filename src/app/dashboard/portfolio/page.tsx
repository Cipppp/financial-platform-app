'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { formatCurrency, formatPercent } from '@/lib/utils'

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

export default function PortfolioPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [portfolio, setPortfolio] = useState<any>(null)
  const [trades, setTrades] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return
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
        const tradesResponse = await fetch('/api/trades?limit=10')
        if (tradesResponse.ok) {
          const tradesData = await tradesResponse.json()
          setTrades(tradesData.trades || [])
        }
      } catch (err) {
        console.error('Error fetching data:', err)
        setError('Failed to load portfolio data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [session])

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-300 border-t-black" />
        <span className="ml-3 text-gray-600">Loading portfolio...</span>
      </div>
    )
  }

  if (!session) {
    return null
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
        >
          Retry
        </button>
      </div>
    )
  }

  const portfolioValue = portfolio?.totalValue || 0
  const totalReturn = portfolio?.totalReturn || 0
  const totalReturnPercent = portfolio?.totalReturnPercent || 0

  return (
    <div className="space-y-4 lg:space-y-6 min-h-screen">
      <div>
        <h1 className="text-2xl lg:text-4xl font-bold text-black">Portfolio</h1>
        <p className="text-sm lg:text-base text-gray-600 mt-2">Detailed view of your investments and performance</p>
      </div>
      
      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        <Card>
          <CardContent className="p-4 lg:p-6">
            <h3 className="text-xs lg:text-sm font-medium text-gray-500 uppercase tracking-wide">Portfolio Value</h3>
            <p className="text-2xl lg:text-3xl font-bold text-black mt-2">{formatCurrency(portfolioValue)}</p>
            <p className="text-xs lg:text-sm text-gray-500 mt-1">Total market value</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 lg:p-6">
            <h3 className="text-xs lg:text-sm font-medium text-gray-500 uppercase tracking-wide">Available Cash</h3>
            <p className="text-2xl lg:text-3xl font-bold text-black mt-2">{formatCurrency(portfolio?.currentBalance || 0)}</p>
            <p className="text-xs lg:text-sm text-gray-500 mt-1">Ready to invest</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 lg:p-6">
            <h3 className="text-xs lg:text-sm font-medium text-gray-500 uppercase tracking-wide">Total Return</h3>
            <p className={`text-2xl lg:text-3xl font-bold mt-2 ${totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totalReturn)}
            </p>
            <p className={`text-xs lg:text-sm mt-1 ${totalReturnPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalReturnPercent >= 0 ? '+' : ''}{formatPercent(totalReturnPercent)}
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Holdings Table */}
      <Card>
        <CardHeader>
          <h2 className="text-lg lg:text-2xl font-bold text-black">Holdings</h2>
          <p className="text-xs lg:text-sm text-gray-600">Your current stock positions</p>
        </CardHeader>
        <CardContent>
          {portfolio?.holdings && portfolio.holdings.length > 0 ? (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Symbol</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Shares</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Avg Cost</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Current Price</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Market Value</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Gain/Loss</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">% of Portfolio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {portfolio.holdings.map((holding: any) => {
                      const isProfit = holding.gainLoss >= 0
                      const portfolioPercent = portfolioValue > 0 ? (holding.currentValue / portfolioValue) * 100 : 0
                      return (
                        <tr key={holding.symbol} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">{holding.symbol}</td>
                          <td className="px-4 py-3 text-right">{holding.shares}</td>
                          <td className="px-4 py-3 text-right">{formatCurrency(holding.avgPrice)}</td>
                          <td className="px-4 py-3 text-right">{formatCurrency(holding.currentPrice)}</td>
                          <td className="px-4 py-3 text-right font-medium">{formatCurrency(holding.currentValue)}</td>
                          <td className={`px-4 py-3 text-right font-medium ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(holding.gainLoss)}
                            <div className="text-xs">
                              ({holding.gainLossPercent >= 0 ? '+' : ''}{formatPercent(holding.gainLossPercent)})
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-gray-600">
                            {portfolioPercent.toFixed(1)}%
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden space-y-4">
                {portfolio.holdings.map((holding: any) => {
                  const isProfit = holding.gainLoss >= 0
                  const portfolioPercent = portfolioValue > 0 ? (holding.currentValue / portfolioValue) * 100 : 0
                  return (
                    <div key={holding.symbol} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-bold text-lg text-gray-900">{holding.symbol}</h3>
                          <p className="text-sm text-gray-600">{holding.shares} shares</p>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg text-gray-900">
                            {formatCurrency(holding.currentValue)}
                          </div>
                          <div className="text-xs text-gray-600">
                            {portfolioPercent.toFixed(1)}% of portfolio
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Avg Cost:</span>
                          <div className="font-medium">{formatCurrency(holding.avgPrice)}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Current:</span>
                          <div className="font-medium">{formatCurrency(holding.currentPrice)}</div>
                        </div>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-gray-300">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Gain/Loss:</span>
                          <div className={`text-right font-medium ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                            <div>{formatCurrency(holding.gainLoss)}</div>
                            <div className="text-xs">
                              ({holding.gainLossPercent >= 0 ? '+' : ''}{formatPercent(holding.gainLossPercent)})
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">No holdings yet</p>
              <p className="text-sm text-gray-500 mt-1">
                Start trading to build your portfolio
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Trades */}
      <Card>
        <CardHeader>
          <h2 className="text-lg lg:text-2xl font-bold text-black">Recent Trades</h2>
          <p className="text-xs lg:text-sm text-gray-600">Your latest trading activity</p>
        </CardHeader>
        <CardContent>
          {trades.length > 0 ? (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Symbol</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Type</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Shares</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Price</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {trades.map((trade: any) => (
                      <tr key={trade.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(trade.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">{trade.symbol}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            trade.type === 'BUY' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {trade.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">{trade.shares}</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(trade.price)}</td>
                        <td className="px-4 py-3 text-right font-medium">{formatCurrency(trade.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden space-y-3">
                {trades.map((trade: any) => (
                  <div key={trade.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-bold text-gray-900">{trade.symbol}</div>
                        <div className="text-sm text-gray-600">
                          {new Date(trade.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        trade.type === 'BUY' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {trade.type}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Shares:</span>
                        <div className="font-medium">{trade.shares}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Price:</span>
                        <div className="font-medium">{formatCurrency(trade.price)}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Total:</span>
                        <div className="font-medium">{formatCurrency(trade.total)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">No trades yet</p>
              <p className="text-sm text-gray-500 mt-1">
                Your trading history will appear here
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}