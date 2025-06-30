'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { formatCurrency, formatPercent } from '@/lib/utils'
import TradingSidePanel from '@/components/ui/TradingSidePanel'
import { Search, TrendingUp, TrendingDown, BarChart3, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

type SortField = 'symbol' | 'price' | 'volume' | 'float' | 'relativeVolume'
type SortDirection = 'asc' | 'desc'

interface StockData {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: number
  float: number
  relativeVolume: number
}

const Card = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={`card-modern border-0 shadow-sm ${className}`}>
    {children}
  </div>
)

export default function StockScreenerPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stocks, setStocks] = useState<StockData[]>([])
  const [allStocks, setAllStocks] = useState<StockData[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStock, setSelectedStock] = useState<any>(null)
  const [showTradingPanel, setShowTradingPanel] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [sortField, setSortField] = useState<SortField>('symbol')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
      return
    }
  }, [session, status, router])

  useEffect(() => {
    const loadStockData = async () => {
      if (!session) return
      
      try {
        setLoading(true)
        
        const response = await fetch('/api/stocks/list')
        if (!response.ok) {
          throw new Error('Failed to fetch stock data')
        }
        
        const data = await response.json()
        
        // Transform the API data to match our StockData interface
        const stocksData: StockData[] = data.stocks.map((stock: any) => ({
          symbol: stock.symbol,
          name: stock.name,
          price: stock.price,
          change: stock.change,
          changePercent: stock.changePercent,
          volume: stock.volume || 0,
          float: stock.sharesOutstanding || stock.volume * 10 || 0, // Estimate float if not available
          relativeVolume: stock.relativeVolume || 1.0
        }))
        
        setAllStocks(stocksData)
        setStocks(stocksData)
        
      } catch (err) {
        console.error('Error loading stocks:', err)
        setAllStocks([])
        setStocks([])
      } finally {
        setLoading(false)
        setIsInitialLoad(false)
      }
    }

    if (session && isInitialLoad) {
      loadStockData()
    }
  }, [session, isInitialLoad])


  const handleSort = (field: SortField) => {
    const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc'
    setSortField(field)
    setSortDirection(newDirection)
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-4 h-4 text-blue-600" />
      : <ArrowDown className="w-4 h-4 text-blue-600" />
  }

  const sortedAndFilteredStocks = useMemo(() => {
    let filtered = allStocks
    
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = allStocks.filter(stock => 
        stock.symbol.toLowerCase().includes(term) ||
        stock.name.toLowerCase().includes(term)
      )
    }
    
    return filtered.sort((a, b) => {
      let aValue: number | string = a[sortField]
      let bValue: number | string = b[sortField]
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = (bValue as string).toLowerCase()
      }
      
      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })
  }, [allStocks, searchTerm, sortField, sortDirection])

  useEffect(() => {
    setStocks(sortedAndFilteredStocks)
  }, [sortedAndFilteredStocks])

  const handleTrade = (stock: StockData) => {
    setSelectedStock(stock)
    setShowTradingPanel(true)
  }

  const handleStockClick = (stock: StockData) => {
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
          <div className="text-lg font-medium text-slate-900">Loading stock screener...</div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 transition-all duration-300 ${
      showTradingPanel ? 'mr-96' : ''
    }`}>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-black text-white mr-4">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-slate-900">
                  Stock Screener
                </h1>
                <p className="text-slate-600 text-lg">
                  Discover and analyze stocks with advanced filtering and sorting
                </p>
              </div>
            </div>
            
            {/* Search Bar */}
            <div className="relative max-w-md">
              <input
                type="text"
                placeholder="Search by symbol or company name..."
                className="input-modern w-full pl-12 pr-4 py-3 border-0 focus:outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Screener Table */}
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left p-4">
                      <button
                        onClick={() => handleSort('symbol')}
                        className="flex items-center space-x-2 font-semibold text-slate-700 hover:text-black transition-colors"
                      >
                        <span>Symbol</span>
                        {getSortIcon('symbol')}
                      </button>
                    </th>
                    <th className="text-left p-4">
                      <button
                        onClick={() => handleSort('price')}
                        className="flex items-center space-x-2 font-semibold text-slate-700 hover:text-black transition-colors"
                      >
                        <span>Price</span>
                        {getSortIcon('price')}
                      </button>
                    </th>
                    <th className="text-left p-4">Change</th>
                    <th className="text-left p-4">
                      <button
                        onClick={() => handleSort('volume')}
                        className="flex items-center space-x-2 font-semibold text-slate-700 hover:text-black transition-colors"
                      >
                        <span>Volume</span>
                        {getSortIcon('volume')}
                      </button>
                    </th>
                    <th className="text-left p-4">
                      <button
                        onClick={() => handleSort('float')}
                        className="flex items-center space-x-2 font-semibold text-slate-700 hover:text-black transition-colors"
                      >
                        <span>Float</span>
                        {getSortIcon('float')}
                      </button>
                    </th>
                    <th className="text-left p-4">
                      <button
                        onClick={() => handleSort('relativeVolume')}
                        className="flex items-center space-x-2 font-semibold text-slate-700 hover:text-black transition-colors"
                      >
                        <span>Rel. Volume</span>
                        {getSortIcon('relativeVolume')}
                      </button>
                    </th>
                    <th className="text-left p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stocks.map((stock) => (
                    <tr
                      key={stock.symbol}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => handleStockClick(stock)}
                    >
                      <td className="p-4">
                        <div>
                          <div className="font-semibold text-slate-900">{stock.symbol}</div>
                          <div className="text-sm text-slate-600 truncate max-w-[200px]">
                            {stock.name}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-slate-900">
                          {formatCurrency(stock.price)}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className={`flex items-center space-x-1 ${
                          stock.change >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {stock.change >= 0 ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : (
                            <TrendingDown className="w-4 h-4" />
                          )}
                          <div>
                            <div className="font-medium">
                              {stock.change >= 0 ? '+' : ''}{formatCurrency(stock.change)}
                            </div>
                            <div className="text-sm">
                              ({stock.changePercent >= 0 ? '+' : ''}{formatPercent(stock.changePercent)})
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-slate-900">
                          {stock.volume.toLocaleString()}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-slate-900">
                          {(stock.float / 1000000).toFixed(1)}M
                        </div>
                      </td>
                      <td className="p-4">
                        <div className={`font-medium ${
                          stock.relativeVolume >= 1.5 ? 'text-green-600' : 
                          stock.relativeVolume <= 0.7 ? 'text-red-600' : 'text-slate-900'
                        }`}>
                          {stock.relativeVolume.toFixed(2)}x
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleStockClick(stock)
                            }}
                            className="px-3 py-1 text-sm bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors rounded"
                          >
                            View
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleTrade(stock)
                            }}
                            className="px-3 py-1 text-sm bg-black text-white hover:bg-slate-800 transition-colors rounded"
                          >
                            Trade
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {stocks.length === 0 && !loading && searchTerm && (
              <div className="text-center py-12">
                <div className="text-slate-500 mb-2">No stocks found</div>
                <p className="text-sm text-slate-400">
                  Try a different search term or symbol
                </p>
              </div>
            )}
            
            {stocks.length > 0 && (
              <div className="p-4 border-t border-slate-200 bg-slate-50">
                <div className="text-sm text-slate-600">
                  Showing {stocks.length} stocks
                  {searchTerm && ` matching "${searchTerm}"`}
                  • Sorted by {sortField} ({sortDirection === 'asc' ? 'ascending' : 'descending'})
                </div>
              </div>
            )}
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