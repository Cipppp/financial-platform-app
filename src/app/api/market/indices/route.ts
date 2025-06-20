// src/app/api/market/indices/route.ts
import { NextRequest, NextResponse } from 'next/server'

// Major market indices with their symbols and metadata
const MARKET_INDICES = [
  {
    symbol: 'SPY',
    name: 'S&P 500',
    description: 'SPDR S&P 500 ETF Trust',
    category: 'LARGE_CAP',
    constituents: [] // Will be populated from API
  },
  {
    symbol: 'QQQ',
    name: 'NASDAQ-100',
    description: 'Invesco QQQ Trust',
    category: 'LARGE_CAP',
    constituents: []
  },
  {
    symbol: 'DIA',
    name: 'Dow Jones',
    description: 'SPDR Dow Jones Industrial Average ETF',
    category: 'LARGE_CAP',
    constituents: []
  },
  {
    symbol: 'IWM',
    name: 'Russell 2000',
    description: 'iShares Russell 2000 ETF',
    category: 'SMALL_CAP',
    constituents: []
  },
  {
    symbol: 'XLF',
    name: 'Financial Sector',
    description: 'Financial Select Sector SPDR Fund',
    category: 'SECTOR',
    constituents: []
  },
  {
    symbol: 'XLK',
    name: 'Technology Sector',
    description: 'Technology Select Sector SPDR Fund',
    category: 'SECTOR',
    constituents: []
  }
]

async function fetchIndexData(symbol: string) {
  const tiingoToken = process.env.TIINGO_API_KEY
  const isDummyMode = process.env.NEXT_PUBLIC_USE_DUMMY_DATA === 'true'
  
  if (isDummyMode || !tiingoToken) {
    // Return dummy data for development
    return generateDummyIndexData(symbol)
  }
  
  try {
    const response = await fetch(
      `https://api.tiingo.com/tiingo/daily/${symbol}/prices?token=${tiingoToken}&resampleFreq=daily&columns=open,high,low,close,volume&startDate=2023-01-01`,
      { cache: 'no-store' }
    )
    
    if (!response.ok) {
      throw new Error(`Tiingo API error: ${response.status}`)
    }
    
    const data = await response.json()
    return data.slice(-90) // Last 90 days
  } catch (error) {
    console.error(`Error fetching data for ${symbol}:`, error)
    return generateDummyIndexData(symbol)
  }
}

function generateDummyIndexData(symbol: string) {
  const basePrice = getBasePrice(symbol)
  const data = []
  const now = new Date()
  
  for (let i = 89; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue
    
    const randomChange = (Math.random() - 0.5) * 0.04 // ±2% daily change
    const dayPrice = basePrice * (1 + randomChange * (90 - i) / 90)
    const volatility = 0.01
    
    const open = dayPrice * (1 + (Math.random() - 0.5) * volatility)
    const close = dayPrice * (1 + (Math.random() - 0.5) * volatility)
    const high = Math.max(open, close) * (1 + Math.random() * volatility)
    const low = Math.min(open, close) * (1 - Math.random() * volatility)
    const volume = Math.floor(Math.random() * 50000000) + 10000000
    
    data.push({
      date: date.toISOString().split('T')[0],
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume
    })
  }
  
  return data
}

function getBasePrice(symbol: string): number {
  const basePrices: Record<string, number> = {
    'SPY': 450,
    'QQQ': 380,
    'DIA': 340,
    'IWM': 180,
    'XLF': 35,
    'XLK': 180
  }
  return basePrices[symbol] || 100
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get('symbol')
    
    if (symbol) {
      // Get specific index data
      const indexData = await fetchIndexData(symbol)
      const current = indexData[indexData.length - 1]
      const previous = indexData[indexData.length - 2]
      
      const change = current.close - previous.close
      const changePercent = (change / previous.close) * 100
      
      return NextResponse.json({
        symbol,
        name: MARKET_INDICES.find(idx => idx.symbol === symbol)?.name || symbol,
        current: {
          price: current.close,
          change,
          changePercent,
          volume: current.volume,
          timestamp: current.date
        },
        historical: indexData
      })
    } else {
      // Get all indices summary
      const indicesData = await Promise.all(
        MARKET_INDICES.map(async (index) => {
          const data = await fetchIndexData(index.symbol)
          const current = data[data.length - 1]
          const previous = data[data.length - 2]
          
          const change = current.close - previous.close
          const changePercent = (change / previous.close) * 100
          
          return {
            ...index,
            current: {
              price: current.close,
              change,
              changePercent,
              volume: current.volume,
              timestamp: current.date
            }
          }
        })
      )
      
      return NextResponse.json({ indices: indicesData })
    }
    
  } catch (error) {
    console.error('Error fetching market indices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch market indices' },
      { status: 500 }
    )
  }
}