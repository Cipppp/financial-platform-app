// src/app/dashboard/stocks/page.tsx
'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { formatCurrency, formatPercent } from '@/lib/utils'
import TradingSidePanel from '@/components/ui/TradingSidePanel'
import { Search, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react'

// Modern Card Components
const Card = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={`card-modern border-0 shadow-sm ${className}`}>
    {children}
  </div>
)

export default function StocksPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stocks, setStocks] = useState<any[]>([])
  const [allStocks, setAllStocks] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStock, setSelectedStock] = useState<any>(null)
  const [showTradingPanel, setShowTradingPanel] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
      return
    }
  }, [session, status, router])

  // Load 6 popular stocks on initial load
  useEffect(() => {
    const loadPopularStocks = async () => {
      if (!session) return
      
      try {
        setLoading(true)
        
        // Fetch only 6 popular stocks for fast loading
        const response = await fetch('/api/stocks/list?limit=6&page=1')
        if (response.ok) {
          const data = await response.json()
          setAllStocks(data.stocks)
          setStocks(data.stocks)
        } else {
          // Fallback to empty array if API fails
          console.error('Failed to fetch stock data')
          setAllStocks([])
          setStocks([])
        }
        
      } catch (err) {
        console.error('Error loading stocks:', err)
      } finally {
        setLoading(false)
        setIsInitialLoad(false)
      }
    }

    if (session && isInitialLoad) {
      loadPopularStocks()
    }
  }, [session, isInitialLoad])

  // Search for stocks by symbol or company name
  const searchStocks = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(`/api/stocks/list?search=${encodeURIComponent(query)}&limit=20`)
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.stocks || [])
      } else {
        setSearchResults([])
      }
    } catch (error) {
      console.error('Error searching stocks:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }


  // Handle search input changes with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim()) {
        searchStocks(searchTerm)
      } else {
        setSearchResults([])
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  // Determine which stocks to display
  const displayedStocks = useMemo(() => {
    if (searchTerm.trim()) {
      return searchResults
    }
    return allStocks
  }, [searchTerm, searchResults, allStocks])

  const handleTrade = (stock: any) => {
    setSelectedStock(stock)
    setShowTradingPanel(true)
  }

  const handleStockClick = (stock: any) => {
    router.push(`/dashboard/stocks/${stock.symbol}`)
  }

  const handleTradeComplete = () => {
    console.log('Trade completed successfully')
  }

  if (isInitialLoad && loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-black text-white mb-4">
            <BarChart3 className="w-8 h-8" />
          </div>
          <div className="text-lg font-medium text-slate-900">Loading stocks...</div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 transition-all duration-300 ${
      showTradingPanel ? 'mr-96' : ''
    }`}>
      {/* Centered Search Bar */}
      <div className="flex flex-col justify-center min-h-[40vh] px-6">
        <div className="max-w-2xl mx-auto w-full text-center">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-black text-white mb-4">
              <Search className="w-8 h-8" />
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-2">
              Stock Search
            </h1>
            <p className="text-slate-600 text-lg">
              Search and discover stocks in real-time
            </p>
          </div>
          
          <div className="relative">
            <input
              type="text"
              placeholder="Enter symbol or company name"
              className="input-modern w-full pl-12 pr-4 py-4 text-lg border-0 focus:outline-none relative z-0"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {isSearching && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-slate-300 border-t-black" />
              </div>
            )}
          </div>
          
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA', 'META', 'AMZN'].map((symbol) => (
              <button
                key={symbol}
                onClick={() => setSearchTerm(symbol)}
                className="px-3 py-1 text-sm bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              >
                {symbol}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Section */}
      {displayedStocks.length > 0 && (
        <div className="pb-12 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6 text-center">
              <h2 className="text-xl font-semibold text-slate-900">
                {searchTerm ? `Results for "${searchTerm}"` : 'Popular Stocks'}
              </h2>
              <p className="text-slate-600 text-sm mt-1">
                {displayedStocks.length} stock{displayedStocks.length !== 1 ? 's' : ''} found
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedStocks.map((stock) => (
                <Card key={stock.symbol} className="group cursor-pointer transition-all duration-200 hover:shadow-lg">
                  <div className="p-6" onClick={() => handleStockClick(stock)}>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-black transition-colors">
                          {stock.symbol}
                        </h3>
                        <p className="text-sm text-slate-600 line-clamp-2">
                          {stock.name}
                        </p>
                      </div>
                      <div className={`inline-flex items-center w-8 h-8 ${
                        stock.change >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {stock.change >= 0 ? (
                          <TrendingUp className="w-5 h-5" />
                        ) : (
                          <TrendingDown className="w-5 h-5" />
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-2xl font-bold text-slate-900">
                        {formatCurrency(stock.price)}
                      </div>
                      <div className={`text-sm font-medium ${
                        stock.change >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {stock.change >= 0 ? '+' : ''}{formatCurrency(stock.change)} 
                        ({stock.changePercent >= 0 ? '+' : ''}{formatPercent(stock.changePercent)})
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-slate-200/50 flex space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleStockClick(stock)
                        }}
                        className="flex-1 px-3 py-2 text-sm bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                      >
                        View Details
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleTrade(stock)
                        }}
                        className="flex-1 px-3 py-2 text-sm bg-black text-white hover:bg-slate-800 transition-colors"
                      >
                        Trade
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* No Results */}
      {searchTerm && displayedStocks.length === 0 && !isSearching && !loading && (
        <div className="text-center py-12">
          <div className="text-slate-500 mb-2">No stocks found</div>
          <p className="text-sm text-slate-400">
            Try a different search term or symbol
          </p>
        </div>
      )}

      {/* Search Loading */}
      {isSearching && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-300 border-t-black mx-auto mb-2" />
          <div className="text-slate-500">Searching stocks...</div>
        </div>
      )}

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