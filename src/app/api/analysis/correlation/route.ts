// src/app/api/analysis/correlation/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { calculateCorrelation } from '@/lib/technicalIndicators'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fetchPriceData(symbol: string, days: number = 90) {
  const tiingoToken = process.env.TIINGO_API_KEY
  const isDummyMode = process.env.NEXT_PUBLIC_USE_DUMMY_DATA === 'true'
  
  if (isDummyMode || !tiingoToken) {
    return generateDummyPrices(symbol, days)
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
    return data.map((item: any) => item.close)
  } catch (error) {
    console.error(`Error fetching data for ${symbol}:`, error)
    return generateDummyPrices(symbol, days)
  }
}

function generateDummyPrices(symbol: string, days: number): number[] {
  const basePrice = getSymbolBasePrice(symbol)
  const prices = []
  let currentPrice = basePrice
  
  // Create correlated movements based on symbol pairs
  const correlationGroups: Record<string, number> = {
    'AAPL': 1, 'MSFT': 1, 'GOOGL': 1, // Tech correlation group
    'SPY': 2, 'QQQ': 2, 'DIA': 2, // Market indices
    'XLF': 3, 'JPM': 3, 'BAC': 3, // Financials
    'TSLA': 4, 'NIO': 4 // EVs
  }
  
  const group = correlationGroups[symbol] || 0
  const marketSeed = 12345 + group * 1000 // Deterministic seed based on group
  
  for (let i = 0; i < days; i++) {
    // Create semi-random but group-correlated movement
    const random1 = Math.sin(marketSeed + i * 0.1) * 0.5 + 0.5
    const random2 = Math.sin(marketSeed + i * 0.13 + group) * 0.5 + 0.5
    
    const groupMove = (random1 - 0.5) * 0.04 // Group movement
    const idiosyncraticMove = (random2 - 0.5) * 0.02 // Individual movement
    
    currentPrice *= (1 + groupMove + idiosyncraticMove)
    prices.push(parseFloat(currentPrice.toFixed(2)))
  }
  
  return prices
}

function getSymbolBasePrice(symbol: string): number {
  const basePrices: Record<string, number> = {
    'AAPL': 180, 'GOOGL': 140, 'MSFT': 350, 'TSLA': 250,
    'AMZN': 130, 'META': 300, 'NVDA': 450, 'SPY': 450,
    'QQQ': 380, 'DIA': 340, 'XLF': 35, 'JPM': 150, 'BAC': 32
  }
  return basePrices[symbol] || 100
}

const POPULAR_SYMBOLS = [
  'AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'META', 'NVDA',
  'SPY', 'QQQ', 'DIA', 'XLF', 'JPM', 'BAC', 'WMT', 'JNJ'
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const symbol1 = searchParams.get('symbol1')
    const symbol2 = searchParams.get('symbol2')
    const timeframe = searchParams.get('timeframe') || '90d'
    const matrix = searchParams.get('matrix') === 'true'
    
    const days = parseTimeframe(timeframe)
    
    if (matrix) {
      // Generate correlation matrix for popular symbols
      const symbols = POPULAR_SYMBOLS.slice(0, 10) // Limit to 10 for performance
      const correlationMatrix = []
      
      // Fetch all price data in parallel
      const allPriceData = await Promise.all(
        symbols.map(symbol => fetchPriceData(symbol, days))
      )
      
      // Calculate correlation matrix
      for (let i = 0; i < symbols.length; i++) {
        const row = []
        for (let j = 0; j < symbols.length; j++) {
          if (i === j) {
            row.push(1.0) // Perfect correlation with self
          } else {
            const correlation = calculateCorrelation(allPriceData[i], allPriceData[j])
            row.push(parseFloat(correlation.toFixed(3)))
          }
        }
        correlationMatrix.push(row)
      }
      
      return NextResponse.json({
        type: 'matrix',
        symbols,
        timeframe,
        correlationMatrix,
        generatedAt: new Date().toISOString()
      })
      
    } else if (symbol1 && symbol2) {
      // Calculate correlation between two specific symbols
      const [prices1, prices2] = await Promise.all([
        fetchPriceData(symbol1, days),
        fetchPriceData(symbol2, days)
      ])
      
      // Ensure both arrays have the same length
      const minLength = Math.min(prices1.length, prices2.length)
      const correlation = calculateCorrelation(
        prices1.slice(-minLength),
        prices2.slice(-minLength)
      )
      
      // Interpret correlation strength
      let interpretation = ''
      const absCorr = Math.abs(correlation)
      if (absCorr >= 0.8) {
        interpretation = 'Very strong correlation'
      } else if (absCorr >= 0.6) {
        interpretation = 'Strong correlation'
      } else if (absCorr >= 0.4) {
        interpretation = 'Moderate correlation'
      } else if (absCorr >= 0.2) {
        interpretation = 'Weak correlation'
      } else {
        interpretation = 'Very weak or no correlation'
      }
      
      if (correlation < 0) {
        interpretation = interpretation.replace('correlation', 'negative correlation')
      }
      
      // Save to database
      try {
        await prisma.correlationAnalysis.upsert({
          where: {
            symbol1_symbol2_timeframe: {
              symbol1,
              symbol2,
              timeframe
            }
          },
          update: {
            correlation: parseFloat(correlation.toFixed(3)),
            calculatedAt: new Date()
          },
          create: {
            symbol1,
            symbol2,
            timeframe,
            correlation: parseFloat(correlation.toFixed(3))
          }
        })
      } catch (error) {
        console.warn('Could not save correlation to database:', error)
      }
      
      return NextResponse.json({
        type: 'pair',
        symbol1,
        symbol2,
        timeframe,
        correlation: parseFloat(correlation.toFixed(3)),
        interpretation,
        strength: absCorr,
        dataPoints: minLength,
        generatedAt: new Date().toISOString()
      })
      
    } else {
      return NextResponse.json(
        { error: 'Either provide symbol1 and symbol2, or set matrix=true' },
        { status: 400 }
      )
    }
    
  } catch (error) {
    console.error('Error calculating correlation:', error)
    return NextResponse.json(
      { error: 'Failed to calculate correlation' },
      { status: 500 }
    )
  }
}

function parseTimeframe(timeframe: string): number {
  const match = timeframe.match(/(\d+)([dwmy])/)
  if (!match) return 90 // Default to 90 days
  
  const value = parseInt(match[1])
  const unit = match[2]
  
  switch (unit) {
    case 'd': return value
    case 'w': return value * 7
    case 'm': return value * 30
    case 'y': return value * 365
    default: return 90
  }
}