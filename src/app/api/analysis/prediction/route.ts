// src/app/api/analysis/prediction/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { generatePrediction, PredictionInput } from '@/lib/predictionModels'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fetchHistoricalData(symbol: string, days: number = 90) {
  const tiingoToken = process.env.TIINGO_API_KEY
  const isDummyMode = process.env.NEXT_PUBLIC_USE_DUMMY_DATA === 'true'
  
  if (isDummyMode || !tiingoToken) {
    return generateDummyHistoricalData(symbol, days)
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
    return {
      prices: data.map((item: any) => item.close),
      timestamps: data.map((item: any) => new Date(item.date)),
      volume: data.map((item: any) => item.volume)
    }
  } catch (error) {
    console.error(`Error fetching data for ${symbol}:`, error)
    return generateDummyHistoricalData(symbol, days)
  }
}

function generateDummyHistoricalData(symbol: string, days: number) {
  const basePrice = getSymbolBasePrice(symbol)
  const prices = []
  const timestamps = []
  const volume = []
  
  let currentPrice = basePrice
  const now = new Date()
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue
    
    const randomChange = (Math.random() - 0.48) * 0.03
    currentPrice *= (1 + randomChange)
    
    prices.push(parseFloat(currentPrice.toFixed(2)))
    timestamps.push(date)
    volume.push(Math.floor(Math.random() * 10000000) + 1000000)
  }
  
  return { prices, timestamps, volume }
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

async function getSentimentScore(symbol: string): Promise<number> {
  // In a real implementation, this would fetch from news APIs
  // For now, return a random sentiment between -1 and 1
  return (Math.random() - 0.5) * 2
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const { 
      symbol, 
      timeframe = '30d', 
      model = 'ensemble',
      confidence_interval = 0.95 
    } = body
    
    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol parameter is required' },
        { status: 400 }
      )
    }
    
    // Parse timeframe to days
    const daysAhead = parseTimeframe(timeframe)
    
    // Fetch historical data
    const historicalData = await fetchHistoricalData(symbol)
    
    if (historicalData.prices.length < 30) {
      return NextResponse.json(
        { error: 'Insufficient historical data for prediction' },
        { status: 400 }
      )
    }
    
    // Get sentiment data (mock for now)
    const sentiment = await getSentimentScore(symbol)
    
    // Prepare prediction input
    const predictionInput: PredictionInput & { sentiment: number } = {
      prices: historicalData.prices,
      timestamps: historicalData.timestamps,
      volume: historicalData.volume,
      sentiment
    }
    
    // Generate prediction
    const prediction = generatePrediction(predictionInput, model as any, daysAhead)
    
    // Save prediction to database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })
    
    if (user) {
      const targetDate = new Date()
      targetDate.setDate(targetDate.getDate() + daysAhead)
      
      await prisma.prediction.create({
        data: {
          symbol,
          model: model.toUpperCase() as any,
          timeframe,
          currentPrice: historicalData.prices[historicalData.prices.length - 1],
          predictedPrice: prediction.predictedPrice,
          confidence: prediction.confidence,
          targetDate,
          parameters: prediction.parameters as any
        }
      })
    }
    
    // Calculate prediction intervals
    const currentPrice = historicalData.prices[historicalData.prices.length - 1]
    const priceChange = prediction.predictedPrice - currentPrice
    const priceChangePercent = (priceChange / currentPrice) * 100
    
    // Calculate confidence intervals based on historical volatility
    const returns = []
    for (let i = 1; i < historicalData.prices.length; i++) {
      returns.push((historicalData.prices[i] - historicalData.prices[i-1]) / historicalData.prices[i-1])
    }
    const volatility = Math.sqrt(returns.reduce((sum, ret) => sum + ret * ret, 0) / returns.length)
    const dailyVol = volatility / Math.sqrt(252) // Convert to daily volatility
    
    // Calculate confidence intervals
    const zScore = confidence_interval === 0.95 ? 1.96 : confidence_interval === 0.99 ? 2.58 : 1.64
    const intervalRange = zScore * dailyVol * Math.sqrt(daysAhead) * currentPrice
    
    const response = {
      symbol,
      prediction: {
        currentPrice,
        predictedPrice: prediction.predictedPrice,
        priceChange,
        priceChangePercent,
        confidence: prediction.confidence,
        model: prediction.model,
        timeframe,
        targetDate: new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000).toISOString(),
        reasoning: prediction.reasoning
      },
      confidenceInterval: {
        level: confidence_interval,
        upper: prediction.predictedPrice + intervalRange,
        lower: prediction.predictedPrice - intervalRange
      },
      technicalFactors: {
        volatility: volatility * 100, // Convert to percentage
        sentiment: sentiment,
        dataPoints: historicalData.prices.length
      },
      disclaimer: 'This prediction is for educational purposes only and should not be considered as financial advice.',
      generatedAt: new Date().toISOString()
    }
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('Error generating prediction:', error)
    return NextResponse.json(
      { error: 'Failed to generate prediction' },
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
    const symbol = searchParams.get('symbol')
    const limit = parseInt(searchParams.get('limit') || '10')
    
    // Get recent predictions
    const predictions = await prisma.prediction.findMany({
      where: symbol ? { symbol } : {},
      orderBy: { createdAt: 'desc' },
      take: limit
    })
    
    // Calculate accuracy for predictions that have passed their target date
    const now = new Date()
    const predictionsWithAccuracy = await Promise.all(
      predictions.map(async (pred) => {
        if (pred.targetDate <= now && !pred.accuracy) {
          // Fetch actual price for accuracy calculation
          try {
            const actualData = await fetchHistoricalData(pred.symbol, 1)
            const actualPrice = actualData.prices[actualData.prices.length - 1]
            const accuracy = 1 - Math.abs(pred.predictedPrice - actualPrice) / actualPrice
            
            // Update prediction with accuracy
            await prisma.prediction.update({
              where: { id: pred.id },
              data: { accuracy }
            })
            
            return { ...pred, accuracy, actualPrice }
          } catch (error) {
            return pred
          }
        }
        return pred
      })
    )
    
    return NextResponse.json({ predictions: predictionsWithAccuracy })
    
  } catch (error) {
    console.error('Error fetching predictions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch predictions' },
      { status: 500 }
    )
  }
}

function parseTimeframe(timeframe: string): number {
  const match = timeframe.match(/(\d+)([dwmy])/)
  if (!match) return 30 // Default to 30 days
  
  const value = parseInt(match[1])
  const unit = match[2]
  
  switch (unit) {
    case 'd': return value
    case 'w': return value * 7
    case 'm': return value * 30
    case 'y': return value * 365
    default: return 30
  }
}