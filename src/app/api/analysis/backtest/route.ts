// src/app/api/analysis/backtest/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { BacktestRepository } from '@/lib/dynamodb/repositories/BacktestRepository'
import { UserRepository } from '@/lib/dynamodb/repositories/UserRepository'

const backtestRepo = new BacktestRepository()
const userRepo = new UserRepository()

interface BacktestParams {
  symbol: string
  strategy: 'sma_crossover' | 'rsi_mean_reversion' | 'macd_signal' | 'bollinger_bounce'
  startDate: string
  endDate: string
  initialCapital: number
  parameters: Record<string, number>
}

interface Trade {
  date: string
  type: 'BUY' | 'SELL'
  price: number
  shares: number
  value: number
}

interface BacktestResult {
  strategy: string
  symbol: string
  startDate: string
  endDate: string
  initialCapital: number
  finalValue: number
  totalReturn: number
  annualizedReturn: number
  sharpeRatio: number
  maxDrawdown: number
  winRate: number
  totalTrades: number
  trades: Trade[]
  dailyReturns: number[]
  equityCurve: Array<{ date: string; value: number }>
}

async function fetchHistoricalData(symbol: string, startDate: string, endDate: string) {
  const tiingoToken = process.env.TIINGO_API_KEY
  const isDummyMode = process.env.NEXT_PUBLIC_USE_DUMMY_DATA === 'true'
  
  if (isDummyMode || !tiingoToken) {
    return generateDummyBacktestData(symbol, startDate, endDate)
  }
  
  try {
    const response = await fetch(
      `https://api.tiingo.com/tiingo/daily/${symbol}/prices?token=${tiingoToken}&startDate=${startDate}&endDate=${endDate}`,
      { cache: 'no-store' }
    )
    
    if (!response.ok) {
      throw new Error(`Tiingo API error: ${response.status}`)
    }
    
    const data = await response.json()
    return data.map((item: any) => ({
      date: item.date,
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
      volume: item.volume
    }))
  } catch (error) {
    console.error(`Error fetching backtest data for ${symbol}:`, error)
    return generateDummyBacktestData(symbol, startDate, endDate)
  }
}

function generateDummyBacktestData(symbol: string, startDate: string, endDate: string) {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const data = []
  
  const basePrice = getSymbolBasePrice(symbol)
  let currentPrice = basePrice
  
  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue
    
    // Random walk with slight upward bias
    const randomChange = (Math.random() - 0.48) * 0.03
    currentPrice *= (1 + randomChange)
    
    const volatility = 0.015
    const open = currentPrice * (1 + (Math.random() - 0.5) * volatility)
    const close = currentPrice * (1 + (Math.random() - 0.5) * volatility)
    const high = Math.max(open, close) * (1 + Math.random() * volatility)
    const low = Math.min(open, close) * (1 - Math.random() * volatility)
    
    data.push({
      date: date.toISOString().split('T')[0],
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume: Math.floor(Math.random() * 5000000) + 1000000
    })
    
    currentPrice = close
  }
  
  return data
}

function getSymbolBasePrice(symbol: string): number {
  const basePrices: Record<string, number> = {
    'AAPL': 150, 'GOOGL': 120, 'MSFT': 300, 'TSLA': 200,
    'AMZN': 110, 'META': 250, 'NVDA': 400, 'SPY': 400,
    'QQQ': 350, 'DIA': 320
  }
  return basePrices[symbol] || 100
}

function runBacktest(data: any[], params: BacktestParams): BacktestResult {
  const { strategy, symbol, initialCapital } = params
  
  let cash = initialCapital
  let shares = 0
  const trades: Trade[] = []
  const equityCurve: Array<{ date: string; value: number }> = []
  const dailyReturns: number[] = []
  
  // Calculate indicators for the strategy
  const indicators = calculateIndicators(data, params.parameters)
  
  let previousValue = initialCapital
  
  for (let i = 1; i < data.length; i++) {
    const currentData = data[i]
    const currentIndicators = indicators[i]
    const price = currentData.close
    
    // Generate trading signals based on strategy
    const signal = generateSignal(strategy, i, data, indicators, params.parameters)
    
    // Execute trades
    if (signal === 'BUY' && cash > price && shares === 0) {
      const sharesToBuy = Math.floor(cash / price)
      const cost = sharesToBuy * price
      
      cash -= cost
      shares += sharesToBuy
      
      trades.push({
        date: currentData.date,
        type: 'BUY',
        price,
        shares: sharesToBuy,
        value: cost
      })
    } else if (signal === 'SELL' && shares > 0) {
      const revenue = shares * price
      cash += revenue
      
      trades.push({
        date: currentData.date,
        type: 'SELL',
        price,
        shares,
        value: revenue
      })
      
      shares = 0
    }
    
    // Calculate portfolio value
    const portfolioValue = cash + (shares * price)
    equityCurve.push({
      date: currentData.date,
      value: portfolioValue
    })
    
    // Calculate daily return
    const dailyReturn = (portfolioValue - previousValue) / previousValue
    dailyReturns.push(dailyReturn)
    previousValue = portfolioValue
  }
  
  // Final portfolio value
  const finalPrice = data[data.length - 1].close
  const finalValue = cash + (shares * finalPrice)
  
  // Calculate performance metrics
  const totalReturn = (finalValue - initialCapital) / initialCapital
  const days = data.length
  const years = days / 252 // Approximate trading days per year
  const annualizedReturn = Math.pow(1 + totalReturn, 1 / years) - 1
  
  // Calculate Sharpe ratio (assuming 0% risk-free rate)
  const avgDailyReturn = dailyReturns.reduce((sum, ret) => sum + ret, 0) / dailyReturns.length
  const stdDev = Math.sqrt(dailyReturns.reduce((sum, ret) => sum + Math.pow(ret - avgDailyReturn, 2), 0) / dailyReturns.length)
  const sharpeRatio = (avgDailyReturn / stdDev) * Math.sqrt(252) // Annualized
  
  // Calculate maximum drawdown
  let maxDrawdown = 0
  let peak = initialCapital
  
  for (const point of equityCurve) {
    if (point.value > peak) {
      peak = point.value
    }
    const drawdown = (peak - point.value) / peak
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown
    }
  }
  
  // Calculate win rate
  const profitableTrades = trades.filter((trade, index) => {
    if (trade.type === 'SELL' && index > 0) {
      const buyTrade = trades[index - 1]
      return trade.price > buyTrade.price
    }
    return false
  }).length
  
  const sellTrades = trades.filter(trade => trade.type === 'SELL').length
  const winRate = sellTrades > 0 ? profitableTrades / sellTrades : 0
  
  return {
    strategy,
    symbol,
    startDate: params.startDate,
    endDate: params.endDate,
    initialCapital,
    finalValue,
    totalReturn,
    annualizedReturn,
    sharpeRatio: isNaN(sharpeRatio) ? 0 : sharpeRatio,
    maxDrawdown,
    winRate,
    totalTrades: trades.length,
    trades,
    dailyReturns,
    equityCurve
  }
}

function calculateIndicators(data: any[], parameters: Record<string, number>) {
  const indicators = []
  
  for (let i = 0; i < data.length; i++) {
    const indicator: any = {}
    
    // Simple Moving Averages
    if (i >= (parameters.sma_short || 10) - 1) {
      const period = parameters.sma_short || 10
      const prices = data.slice(i - period + 1, i + 1).map(d => d.close)
      indicator.sma_short = prices.reduce((sum, price) => sum + price, 0) / period
    }
    
    if (i >= (parameters.sma_long || 30) - 1) {
      const period = parameters.sma_long || 30
      const prices = data.slice(i - period + 1, i + 1).map(d => d.close)
      indicator.sma_long = prices.reduce((sum, price) => sum + price, 0) / period
    }
    
    // RSI calculation (simplified)
    if (i >= 14) {
      const period = 14
      const changes = []
      for (let j = i - period + 1; j <= i; j++) {
        if (j > 0) {
          changes.push(data[j].close - data[j - 1].close)
        }
      }
      
      const gains = changes.filter(c => c > 0)
      const losses = changes.filter(c => c < 0).map(c => Math.abs(c))
      
      if (gains.length > 0 && losses.length > 0) {
        const avgGain = gains.reduce((sum, gain) => sum + gain, 0) / gains.length
        const avgLoss = losses.reduce((sum, loss) => sum + loss, 0) / losses.length
        const rs = avgGain / avgLoss
        indicator.rsi = 100 - (100 / (1 + rs))
      }
    }
    
    indicators.push(indicator)
  }
  
  return indicators
}

function generateSignal(strategy: string, index: number, data: any[], indicators: any[], parameters: Record<string, number>): 'BUY' | 'SELL' | 'HOLD' {
  const current = indicators[index]
  const previous = indicators[index - 1]
  
  if (!current || !previous) return 'HOLD'
  
  switch (strategy) {
    case 'sma_crossover':
      if (current.sma_short && current.sma_long && previous.sma_short && previous.sma_long) {
        if (previous.sma_short <= previous.sma_long && current.sma_short > current.sma_long) {
          return 'BUY'
        }
        if (previous.sma_short >= previous.sma_long && current.sma_short < current.sma_long) {
          return 'SELL'
        }
      }
      break
      
    case 'rsi_mean_reversion':
      if (current.rsi !== undefined) {
        const oversold = parameters.rsi_oversold || 30
        const overbought = parameters.rsi_overbought || 70
        
        if (current.rsi < oversold) return 'BUY'
        if (current.rsi > overbought) return 'SELL'
      }
      break
      
    // Add more strategies as needed
  }
  
  return 'HOLD'
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json() as BacktestParams
    const { symbol, strategy, startDate, endDate, initialCapital, parameters } = body
    
    // Validate inputs
    if (!symbol || !strategy || !startDate || !endDate || !initialCapital) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }
    
    // Fetch historical data
    const historicalData = await fetchHistoricalData(symbol, startDate, endDate)
    
    if (historicalData.length < 50) {
      return NextResponse.json(
        { error: 'Insufficient historical data for backtesting' },
        { status: 400 }
      )
    }
    
    // Run backtest
    const result = runBacktest(historicalData, body)
    
    // Save result to database
    const user = await userRepo.findByEmail(session.user.email)
    
    if (user) {
      await backtestRepo.create({
        userId: user.id,
        strategy: result.strategy,
        symbol: result.symbol,
        startDate: result.startDate,
        endDate: result.endDate,
        totalReturn: result.totalReturn,
        annualizedReturn: result.annualizedReturn,
        sharpeRatio: result.sharpeRatio,
        maxDrawdown: result.maxDrawdown,
        winRate: result.winRate,
        totalTrades: result.totalTrades,
        parameters: parameters
      })
    }
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('Error running backtest:', error)
    return NextResponse.json(
      { error: 'Failed to run backtest' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    
    const user = await userRepo.findByEmail(session.user.email)
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    const backtestResults = await backtestRepo.findByUserId(user.id, limit)
    
    return NextResponse.json({ results: backtestResults })
    
  } catch (error) {
    console.error('Error fetching backtest results:', error)
    return NextResponse.json(
      { error: 'Failed to fetch backtest results' },
      { status: 500 }
    )
  }
}