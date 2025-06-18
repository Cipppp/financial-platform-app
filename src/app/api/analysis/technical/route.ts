// src/app/api/analysis/technical/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { calculateAllIndicators, calculateVolatility, PriceData } from '@/lib/technicalIndicators'

async function fetchHistoricalData(symbol: string, days: number = 200): Promise<PriceData[]> {
  const tiingoToken = process.env.TIINGO_API_KEY
  const isDummyMode = process.env.NEXT_PUBLIC_USE_DUMMY_DATA === 'true'
  
  if (isDummyMode || !tiingoToken) {
    return generateDummyPriceData(symbol, days)
  }
  
  try {
    const endDate = new Date().toISOString().split('T')[0]
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    const response = await fetch(
      `https://api.tiingo.com/tiingo/daily/${symbol}/prices?token=${tiingoToken}&startDate=${startDate}&endDate=${endDate}`,
      { cache: 'no-store' }
    )
    
    if (!response.ok) {
      throw new Error(`Tiingo API error: ${response.status}`)
    }
    
    const data = await response.json()
    return data.map((item: any) => ({
      timestamp: new Date(item.date),
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
      volume: item.volume
    }))
  } catch (error) {
    console.error(`Error fetching historical data for ${symbol}:`, error)
    return generateDummyPriceData(symbol, days)
  }
}

function generateDummyPriceData(symbol: string, days: number): PriceData[] {
  const basePrice = getSymbolBasePrice(symbol)
  const data: PriceData[] = []
  const now = new Date()
  
  let currentPrice = basePrice
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue
    
    // Random walk with slight upward bias
    const randomChange = (Math.random() - 0.48) * 0.05 // Slight upward bias
    currentPrice *= (1 + randomChange)
    
    const volatility = 0.02
    const open = currentPrice * (1 + (Math.random() - 0.5) * volatility)
    const close = currentPrice * (1 + (Math.random() - 0.5) * volatility)
    const high = Math.max(open, close) * (1 + Math.random() * volatility)
    const low = Math.min(open, close) * (1 - Math.random() * volatility)
    const volume = Math.floor(Math.random() * 10000000) + 1000000
    
    data.push({
      timestamp: date,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume
    })
    
    currentPrice = close
  }
  
  return data
}

function getSymbolBasePrice(symbol: string): number {
  const basePrices: Record<string, number> = {
    'AAPL': 180,
    'GOOGL': 140,
    'MSFT': 350,
    'TSLA': 250,
    'AMZN': 130,
    'META': 300,
    'NVDA': 450,
    'SPY': 450,
    'QQQ': 380
  }
  return basePrices[symbol] || 100
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get('symbol')
    const period = parseInt(searchParams.get('period') || '200')
    
    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol parameter is required' },
        { status: 400 }
      )
    }
    
    // Fetch historical price data
    const priceData = await fetchHistoricalData(symbol, period)
    
    if (priceData.length < 200) {
      return NextResponse.json(
        { error: 'Insufficient data for technical analysis (minimum 200 data points required)' },
        { status: 400 }
      )
    }
    
    // Calculate technical indicators
    const indicators = calculateAllIndicators(priceData)
    
    // Calculate additional metrics
    const closePrices = priceData.map(d => d.close)
    const volatility = calculateVolatility(closePrices)
    
    // Get latest values for summary
    const latest = indicators[indicators.length - 1]
    const currentPrice = closePrices[closePrices.length - 1]
    
    // Generate trading signals
    const signals = generateTradingSignals(latest, currentPrice)
    
    // Format response
    const response = {
      symbol,
      timestamp: new Date().toISOString(),
      currentPrice,
      volatility,
      summary: {
        rsi: latest.rsi,
        macd: {
          line: latest.macd,
          signal: latest.macdSignal,
          histogram: latest.macdHist
        },
        bollinger: {
          upper: latest.bollUpper,
          middle: latest.bollMiddle,
          lower: latest.bollLower,
          position: latest.bollUpper && latest.bollLower 
            ? (currentPrice - latest.bollLower) / (latest.bollUpper - latest.bollLower)
            : 0.5
        },
        movingAverages: {
          sma20: latest.sma20,
          sma50: latest.sma50,
          sma200: latest.sma200,
          ema12: latest.ema12,
          ema26: latest.ema26
        }
      },
      signals,
      historical: priceData.slice(-50).map((price, index) => ({
        timestamp: price.timestamp,
        price: price.close,
        indicators: indicators[indicators.length - 50 + index]
      }))
    }
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('Error calculating technical indicators:', error)
    return NextResponse.json(
      { error: 'Failed to calculate technical indicators' },
      { status: 500 }
    )
  }
}

function generateTradingSignals(indicators: any, currentPrice: number) {
  const signals = []
  
  // RSI signals
  if (indicators.rsi) {
    if (indicators.rsi > 70) {
      signals.push({
        type: 'SELL',
        strength: 'STRONG',
        indicator: 'RSI',
        message: `RSI at ${indicators.rsi.toFixed(1)} indicates overbought conditions`,
        confidence: 0.8
      })
    } else if (indicators.rsi < 30) {
      signals.push({
        type: 'BUY',
        strength: 'STRONG',
        indicator: 'RSI',
        message: `RSI at ${indicators.rsi.toFixed(1)} indicates oversold conditions`,
        confidence: 0.8
      })
    }
  }
  
  // MACD signals
  if (indicators.macd && indicators.macdSignal) {
    if (indicators.macd > indicators.macdSignal && indicators.macdHist > 0) {
      signals.push({
        type: 'BUY',
        strength: 'MEDIUM',
        indicator: 'MACD',
        message: 'MACD line above signal line indicates bullish momentum',
        confidence: 0.6
      })
    } else if (indicators.macd < indicators.macdSignal && indicators.macdHist < 0) {
      signals.push({
        type: 'SELL',
        strength: 'MEDIUM',
        indicator: 'MACD',
        message: 'MACD line below signal line indicates bearish momentum',
        confidence: 0.6
      })
    }
  }
  
  // Bollinger Bands signals
  if (indicators.bollUpper && indicators.bollLower) {
    if (currentPrice > indicators.bollUpper) {
      signals.push({
        type: 'SELL',
        strength: 'MEDIUM',
        indicator: 'Bollinger Bands',
        message: 'Price above upper Bollinger Band suggests potential reversal',
        confidence: 0.6
      })
    } else if (currentPrice < indicators.bollLower) {
      signals.push({
        type: 'BUY',
        strength: 'MEDIUM',
        indicator: 'Bollinger Bands',
        message: 'Price below lower Bollinger Band suggests potential reversal',
        confidence: 0.6
      })
    }
  }
  
  // Moving Average signals
  if (indicators.sma20 && indicators.sma50) {
    if (indicators.sma20 > indicators.sma50 && currentPrice > indicators.sma20) {
      signals.push({
        type: 'BUY',
        strength: 'WEAK',
        indicator: 'Moving Averages',
        message: '20-day SMA above 50-day SMA with price above 20-day SMA',
        confidence: 0.4
      })
    } else if (indicators.sma20 < indicators.sma50 && currentPrice < indicators.sma20) {
      signals.push({
        type: 'SELL',
        strength: 'WEAK',
        indicator: 'Moving Averages',
        message: '20-day SMA below 50-day SMA with price below 20-day SMA',
        confidence: 0.4
      })
    }
  }
  
  return signals
}