'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { X, TrendingUp, TrendingDown, DollarSign, Clock, Target, Calculator } from 'lucide-react'
import CompactStockChart from '@/components/charts/CompactStockChart'
import TradeSuccessAnimation from '@/components/ui/TradeSuccessAnimation'
import { ChartDataPoint, CandlestickDataPoint } from '@/lib/types'

interface TradingSidePanelProps {
  stock: {
    symbol: string
    name: string
    price: number
    change?: number
    changePercent?: number
  }
  isOpen: boolean
  onClose: () => void
  onTradeComplete: () => void
}

export default function TradingSidePanel({ stock, isOpen, onClose, onTradeComplete }: TradingSidePanelProps) {
  const { data: session } = useSession()
  const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY')
  const [orderType, setOrderType] = useState<'market' | 'limit' | 'stop'>('market')
  const [shares, setShares] = useState('')
  const [dollarAmount, setDollarAmount] = useState('')
  const [useSharesInput, setUseSharesInput] = useState(true)
  const [limitPrice, setLimitPrice] = useState('')
  const [stopPrice, setStopPrice] = useState('')
  const [timeInForce, setTimeInForce] = useState<'day' | 'gtc'>('day')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [availableCash, setAvailableCash] = useState(0)
  const [currentPosition, setCurrentPosition] = useState(0)
  const [chartData, setChartData] = useState<ChartDataPoint[] | CandlestickDataPoint[]>([])
  const [chartLoading, setChartLoading] = useState(false)
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false)
  const [lastTradeDetails, setLastTradeDetails] = useState<{
    type: 'BUY' | 'SELL'
    symbol: string
    shares: number
    price: number
    totalValue: number
  } | null>(null)

  // Fetch portfolio data and chart data when panel opens
  useEffect(() => {
    if (isOpen && session) {
      // Reset position to 0 first to avoid showing stale data
      setCurrentPosition(0)
      
      Promise.all([
        fetch('/api/portfolio').then(res => res.json()),
        fetch(`/api/portfolio/position/${stock.symbol}`).then(res => res.json())
      ]).then(([portfolioData, positionData]) => {
        if (portfolioData.currentBalance !== undefined) {
          setAvailableCash(portfolioData.currentBalance)
        }
        if (positionData.position && positionData.position.shares !== undefined) {
          setCurrentPosition(positionData.position.shares)
        }
      }).catch(error => {
        console.error('Error fetching portfolio data:', error)
        setCurrentPosition(0) // Fallback to 0 shares on error
      })

      // Fetch real historical OHLC chart data from Tiingo
      const fetchChartData = async () => {
        setChartLoading(true)
        try {
          // Fetch historical OHLC data for chart
          const endDate = new Date().toISOString().split('T')[0]
          const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          
          const response = await fetch(
            `/api/stocks/chart/${stock.symbol}?startDate=${startDate}&endDate=${endDate}&resampleFreq=daily`
          )
          
          if (response.ok) {
            const data = await response.json()
            
            // Check if we got valid historical data
            if (Array.isArray(data) && data.length > 0) {
              // Transform historical data to candlestick format
              const chartData: CandlestickDataPoint[] = data.slice(-30).map((point: any) => ({
                time: point.date,
                open: point.open,
                high: point.high,
                low: point.low,
                close: point.close
              }))
              setChartData(chartData)
            } else {
              // Fallback to simple price data
              const fallbackData: ChartDataPoint[] = [{
                date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                price: stock.price
              }]
              setChartData(fallbackData)
            }
          } else {
            // API error - fallback to current price
            const fallbackData: ChartDataPoint[] = [{
              date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              price: stock.price
            }]
            setChartData(fallbackData)
          }
        } catch (error) {
          console.error('Error fetching chart data:', error)
          // Fallback to current price only
          const fallbackData: ChartDataPoint[] = [{
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            price: stock.price
          }]
          setChartData(fallbackData)
        } finally {
          setChartLoading(false)
        }
      }

      fetchChartData()
    } else if (!isOpen) {
      // Reset state when panel closes
      setCurrentPosition(0)
      setAvailableCash(0)
    }
  }, [isOpen, session, stock.symbol, stock.price])

  if (!isOpen) return null

  const sharesNum = parseFloat(shares) || 0
  const dollarAmountNum = parseFloat(dollarAmount) || 0
  const calculatedShares = useSharesInput ? sharesNum : dollarAmountNum / stock.price
  const totalCost = calculatedShares * stock.price
  const effectivePrice = orderType === 'limit' ? (parseFloat(limitPrice) || stock.price) : stock.price

  const handleTrade = async () => {
    if (!session || calculatedShares <= 0) return

    setLoading(true)
    setError('')

    try {
      const tradeData: any = {
        symbol: stock.symbol,
        type: tradeType,
        shares: calculatedShares,
        price: effectivePrice,
        orderType,
        timeInForce
      }

      if (orderType === 'limit') {
        tradeData.limitPrice = parseFloat(limitPrice)
      }
      if (orderType === 'stop') {
        tradeData.stopPrice = parseFloat(stopPrice)
      }

      const response = await fetch('/api/trade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tradeData),
      })

      const data = await response.json()

      if (response.ok) {
        // Set trade details for animation
        setLastTradeDetails({
          type: tradeType,
          symbol: stock.symbol,
          shares: calculatedShares,
          price: effectivePrice,
          totalValue: totalCost
        })
        
        // Show success animation
        setShowSuccessAnimation(true)
        
        // Update portfolio data in real-time
        Promise.all([
          fetch('/api/portfolio').then(res => res.json()),
          fetch(`/api/portfolio/position/${stock.symbol}`).then(res => res.json())
        ]).then(([portfolioData, positionData]) => {
          if (portfolioData.currentBalance !== undefined) {
            setAvailableCash(portfolioData.currentBalance)
          }
          if (positionData.position && positionData.position.shares !== undefined) {
            setCurrentPosition(positionData.position.shares)
          }
        }).catch(error => {
          console.error('Error updating portfolio data after trade:', error)
        })
        
        onTradeComplete()
        setShares('')
        setDollarAmount('')
        setError('')
      } else {
        setError(data.error || 'Trade failed')
      }
    } catch (error) {
      setError('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const isPositive = (stock.change || 0) >= 0

  return (
    <div className={`trading-panel fixed right-0 top-0 h-full w-96 bg-background shadow-2xl border-l border-border z-40 transform transition-transform duration-300 ${
      isOpen ? 'translate-x-0' : 'translate-x-full'
    }`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-bold text-foreground">Trade {stock.symbol}</h2>
            <p className="text-sm text-muted">{stock.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-foreground p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Stock Price Info */}
          <div className="bg-accent rounded-lg p-4">
            <div className="text-2xl font-bold text-foreground mb-1">
              {formatCurrency(stock.price)}
            </div>
            {stock.change !== undefined && (
              <div className={`flex items-center text-sm font-medium ${
                isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {isPositive ? (
                  <TrendingUp className="w-4 h-4 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 mr-1" />
                )}
                {isPositive ? '+' : ''}{formatCurrency(stock.change)} 
                ({isPositive ? '+' : ''}{formatPercent(stock.changePercent || 0)})
              </div>
            )}
          </div>

          {/* Chart Preview */}
          <div className="bg-accent rounded-lg border border-border p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-foreground">30-Day Price Chart</h3>
              <span className="text-xs text-muted">{stock.symbol}</span>
            </div>
            {chartLoading ? (
              <div className="h-32 flex items-center justify-center">
                <div className="text-sm text-muted">Loading chart...</div>
              </div>
            ) : chartData.length > 0 ? (
              <CompactStockChart
                data={chartData}
                symbol={stock.symbol}
                currentPrice={stock.price}
                isPositive={isPositive}
              />
            ) : (
              <div className="h-32 flex items-center justify-center">
                <div className="text-sm text-muted">Chart unavailable</div>
              </div>
            )}
          </div>

          {/* Account Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/10 hover:border-white/20 transition-all duration-300 shadow-sm">
              <div className="flex items-center text-green-500 mb-1">
                <DollarSign className="w-3.5 h-3.5 mr-1.5" />
                <span className="text-xs font-medium uppercase tracking-wide">Cash</span>
              </div>
              <div className="text-sm font-bold text-foreground">
                {formatCurrency(availableCash)}
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/10 hover:border-white/20 transition-all duration-300 shadow-sm">
              <div className="flex items-center text-blue-400 mb-1">
                <Target className="w-3.5 h-3.5 mr-1.5" />
                <span className="text-xs font-medium uppercase tracking-wide">Position</span>
              </div>
              <div className="text-sm font-bold text-foreground">
                {currentPosition.toLocaleString()} shares
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Trade Type */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Action
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setTradeType('BUY')}
                className={`py-3 px-4 rounded-lg font-medium transition-colors ${
                  tradeType === 'BUY'
                    ? 'bg-green-600 text-white'
                    : 'bg-accent text-foreground hover:bg-border'
                }`}
              >
                Buy
              </button>
              <button
                onClick={() => setTradeType('SELL')}
                className={`py-3 px-4 rounded-lg font-medium transition-colors ${
                  tradeType === 'SELL'
                    ? 'bg-red-600 text-white'
                    : 'bg-accent text-foreground hover:bg-border'
                }`}
              >
                Sell
              </button>
            </div>
          </div>

          {/* Order Type */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Order Type
            </label>
            <select
              value={orderType}
              onChange={(e) => setOrderType(e.target.value as 'market' | 'limit' | 'stop')}
              className="input-modern w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="market">Market Order</option>
              <option value="limit">Limit Order</option>
              <option value="stop">Stop Order</option>
            </select>
          </div>

          {/* Quantity Input Method Toggle */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Quantity
            </label>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                onClick={() => setUseSharesInput(true)}
                className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  useSharesInput
                    ? 'bg-primary text-background'
                    : 'bg-accent text-foreground hover:bg-border'
                }`}
              >
                Shares
              </button>
              <button
                onClick={() => setUseSharesInput(false)}
                className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  !useSharesInput
                    ? 'bg-primary text-background'
                    : 'bg-accent text-foreground hover:bg-border'
                }`}
              >
                Dollar Amount
              </button>
            </div>

            {useSharesInput ? (
              <div>
                <input
                  type="number"
                  value={shares}
                  onChange={(e) => setShares(e.target.value)}
                  className="input-modern w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="Number of shares"
                  min="0"
                  step="0.01"
                />
                <p className="text-xs text-muted mt-1">Fractional shares supported</p>
              </div>
            ) : (
              <div>
                <input
                  type="number"
                  value={dollarAmount}
                  onChange={(e) => setDollarAmount(e.target.value)}
                  className="input-modern w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="Dollar amount"
                  min="0"
                  step="0.01"
                />
                <p className="text-xs text-muted mt-1">
                  ≈ {(dollarAmountNum / stock.price).toFixed(4)} shares
                </p>
              </div>
            )}
          </div>

          {/* Limit Price Input */}
          {orderType === 'limit' && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Limit Price
              </label>
              <input
                type="number"
                value={limitPrice}
                onChange={(e) => setLimitPrice(e.target.value)}
                className="input-modern w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder={formatCurrency(stock.price)}
                min="0"
                step="0.01"
              />
            </div>
          )}

          {/* Stop Price Input */}
          {orderType === 'stop' && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Stop Price
              </label>
              <input
                type="number"
                value={stopPrice}
                onChange={(e) => setStopPrice(e.target.value)}
                className="input-modern w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder={formatCurrency(stock.price)}
                min="0"
                step="0.01"
              />
            </div>
          )}

          {/* Time in Force */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              <Clock className="w-4 h-4 inline mr-1" />
              Time in Force
            </label>
            <select
              value={timeInForce}
              onChange={(e) => setTimeInForce(e.target.value as 'day' | 'gtc')}
              className="input-modern w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="day">Day (Cancel at market close)</option>
              <option value="gtc">Good Till Canceled</option>
            </select>
          </div>

          {/* Order Summary */}
          {calculatedShares > 0 && (
            <div className="bg-accent rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center">
                  <Calculator className="w-4 h-4 mr-1" />
                  Order Summary
                </span>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Shares:</span>
                  <span className="font-medium">{calculatedShares.toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Price per share:</span>
                  <span className="font-medium">{formatCurrency(effectivePrice)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Total {tradeType === 'BUY' ? 'Cost' : 'Value'}:</span>
                  <span>{formatCurrency(totalCost)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer with Trade Button */}
        <div className="border-t border-border p-6">
          <button
            onClick={handleTrade}
            disabled={loading || calculatedShares <= 0}
            className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-colors ${
              tradeType === 'BUY'
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-red-600 hover:bg-red-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? 'Processing...' : `${tradeType} ${calculatedShares.toFixed(4)} Shares`}
          </button>
        </div>
      </div>

      {/* Trade Success Animation */}
      {lastTradeDetails && (
        <TradeSuccessAnimation
          isVisible={showSuccessAnimation}
          onClose={() => setShowSuccessAnimation(false)}
          tradeDetails={lastTradeDetails}
        />
      )}
    </div>
  )
}