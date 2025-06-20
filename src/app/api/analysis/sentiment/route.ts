// src/app/api/analysis/sentiment/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { SentimentRepository } from '@/lib/dynamodb/repositories/SentimentRepository'

const sentimentRepo = new SentimentRepository()

// Mock news headlines for demonstration
const MOCK_NEWS_HEADLINES = [
  "Apple reports record quarterly earnings, beats analyst expectations",
  "Tesla stock surges on strong delivery numbers",
  "Microsoft announces major AI breakthrough partnership",
  "Amazon faces regulatory scrutiny over market dominance",
  "Google's parent company Alphabet shows strong ad revenue growth",
  "Meta stock drops on privacy regulation concerns",
  "NVIDIA continues AI chip dominance with new product line",
  "Federal Reserve signals potential interest rate changes",
  "Inflation data shows mixed signals for economic recovery",
  "Tech sector faces headwinds amid geopolitical tensions"
]

// Simple sentiment analysis using keyword matching
function analyzeSentiment(text: string): number {
  const positiveWords = [
    'strong', 'growth', 'beats', 'record', 'surge', 'breakthrough', 'partnership',
    'dominance', 'recovery', 'positive', 'gains', 'success', 'profit', 'bull',
    'upgrade', 'outperform', 'buy', 'rally', 'momentum', 'expansion'
  ]
  
  const negativeWords = [
    'scrutiny', 'concerns', 'drops', 'falls', 'decline', 'headwinds', 'tensions',
    'regulation', 'bear', 'sell', 'downgrade', 'losses', 'crash', 'recession',
    'bankruptcy', 'lawsuit', 'investigation', 'warning', 'risk', 'uncertainty'
  ]
  
  const words = text.toLowerCase().split(/\W+/)
  let score = 0
  
  words.forEach(word => {
    if (positiveWords.includes(word)) score += 1
    if (negativeWords.includes(word)) score -= 1
  })
  
  // Normalize to -1 to 1 scale
  const maxWords = Math.max(positiveWords.length, negativeWords.length)
  return Math.max(-1, Math.min(1, score / 5)) // Divide by 5 for smoother scaling
}

function generateMockSentimentData(symbol?: string) {
  const sentimentData = []
  const now = new Date()
  
  // Generate sentiment data for the last 30 days
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    
    // Generate 1-3 mock headlines per day
    const headlineCount = Math.floor(Math.random() * 3) + 1
    
    for (let j = 0; j < headlineCount; j++) {
      const headline = MOCK_NEWS_HEADLINES[Math.floor(Math.random() * MOCK_NEWS_HEADLINES.length)]
      
      // Modify headline to include symbol if specified
      const symbolSpecificHeadline = symbol 
        ? headline.replace(/Apple|Tesla|Microsoft|Amazon|Google|Meta|NVIDIA/i, getCompanyName(symbol))
        : headline
      
      let sentiment = analyzeSentiment(symbolSpecificHeadline)
      
      // Add some symbol-specific sentiment bias for more realistic data
      if (symbol) {
        const symbolBias = getSymbolSentimentBias(symbol)
        sentiment = Math.max(-1, Math.min(1, sentiment + symbolBias))
      }
      
      sentimentData.push({
        timestamp: date,
        headline: symbolSpecificHeadline,
        sentiment: parseFloat(sentiment.toFixed(3)),
        source: 'Financial News',
        symbol: symbol || null
      })
    }
  }
  
  return sentimentData
}

function getSymbolSentimentBias(symbol: string): number {
  // Add some realistic sentiment biases for different stocks
  const biases: Record<string, number> = {
    'AAPL': 0.1,   // Generally positive sentiment
    'TSLA': 0.05,  // Slightly positive but volatile
    'MSFT': 0.15,  // Very positive sentiment
    'AMZN': 0.08,  // Positive sentiment
    'GOOGL': 0.05, // Slightly positive
    'META': -0.05, // Slightly negative due to privacy concerns
    'NVDA': 0.2,   // Very positive due to AI boom
    'SPY': 0.0,    // Neutral market sentiment
    'QQQ': 0.05    // Slightly positive tech sentiment
  }
  return biases[symbol] || 0
}

function getCompanyName(symbol: string): string {
  const companyNames: Record<string, string> = {
    'AAPL': 'Apple',
    'TSLA': 'Tesla', 
    'MSFT': 'Microsoft',
    'AMZN': 'Amazon',
    'GOOGL': 'Google',
    'META': 'Meta',
    'NVDA': 'NVIDIA',
    'SPY': 'S&P 500',
    'QQQ': 'NASDAQ'
  }
  return companyNames[symbol] || symbol
}

async function fetchRealSentiment(symbol: string): Promise<any[]> {
  // In a real implementation, this would call a news API like:
  // - NewsAPI
  // - Alpha Vantage News Sentiment
  // - Finnhub News Sentiment
  // - Custom news scraping + NLP
  
  // For now, return mock data
  return generateMockSentimentData(symbol)
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get('symbol')
    const days = parseInt(searchParams.get('days') || '30')
    const aggregate = searchParams.get('aggregate') === 'true'
    
    const isDummyMode = process.env.NEXT_PUBLIC_USE_DUMMY_DATA === 'true'
    
    let sentimentData: any[]
    
    if (isDummyMode) {
      sentimentData = generateMockSentimentData(symbol || undefined)
    } else {
      sentimentData = symbol 
        ? await fetchRealSentiment(symbol)
        : generateMockSentimentData()
    }
    
    // Filter by days
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)
    sentimentData = sentimentData.filter(item => item.timestamp >= cutoffDate)
    
    if (aggregate) {
      // Aggregate sentiment by day
      const dailyAggregates: Record<string, { date: string; sentiment: number; count: number }> = {}
      
      sentimentData.forEach(item => {
        const dateKey = item.timestamp.toISOString().split('T')[0]
        
        if (!dailyAggregates[dateKey]) {
          dailyAggregates[dateKey] = {
            date: dateKey,
            sentiment: 0,
            count: 0
          }
        }
        
        dailyAggregates[dateKey].sentiment += item.sentiment
        dailyAggregates[dateKey].count += 1
      })
      
      // Calculate average sentiment per day
      const aggregatedData = Object.values(dailyAggregates).map(day => ({
        date: day.date,
        sentiment: day.count > 0 ? day.sentiment / day.count : 0,
        headlineCount: day.count
      }))
      
      // Calculate overall metrics
      const overallSentiment = aggregatedData.reduce((sum, day) => sum + day.sentiment, 0) / aggregatedData.length
      const sentimentTrend = aggregatedData.length > 1 
        ? aggregatedData[aggregatedData.length - 1].sentiment - aggregatedData[0].sentiment
        : 0
      
      let sentimentLabel = 'Neutral'
      if (overallSentiment > 0.2) sentimentLabel = 'Positive'
      else if (overallSentiment < -0.2) sentimentLabel = 'Negative'
      
      return NextResponse.json({
        symbol: symbol || 'Market',
        timeframe: `${days}d`,
        overview: {
          overallSentiment: parseFloat(overallSentiment.toFixed(3)),
          sentimentLabel,
          sentimentTrend: parseFloat(sentimentTrend.toFixed(3)),
          totalHeadlines: sentimentData.length,
          averageHeadlinesPerDay: parseFloat((sentimentData.length / days).toFixed(1))
        },
        dailyData: aggregatedData.sort((a, b) => a.date.localeCompare(b.date)),
        generatedAt: new Date().toISOString()
      })
    } else {
      // Return individual headlines
      const formattedData = sentimentData.map(item => ({
        timestamp: item.timestamp.toISOString(),
        headline: item.headline,
        sentiment: parseFloat(item.sentiment.toFixed(3)),
        source: item.source,
        symbol: item.symbol
      }))
      
      return NextResponse.json({
        symbol: symbol || 'Market',
        headlines: formattedData.sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
        totalCount: formattedData.length,
        generatedAt: new Date().toISOString()
      })
    }
    
  } catch (error) {
    console.error('Error fetching sentiment data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sentiment data' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { headline, sentiment, source, symbol } = body
    
    if (!headline || sentiment === undefined) {
      return NextResponse.json(
        { error: 'Headline and sentiment are required' },
        { status: 400 }
      )
    }
    
    // Save sentiment data to database
    const sentimentRecord = await sentimentRepo.create({
      headline,
      sentiment: parseFloat(sentiment),
      source: source || 'MANUAL',
      symbol: symbol || null,
      timestamp: new Date().toISOString()
    })
    
    return NextResponse.json({
      message: 'Sentiment data saved successfully',
      id: sentimentRecord.id
    })
    
  } catch (error) {
    console.error('Error saving sentiment data:', error)
    return NextResponse.json(
      { error: 'Failed to save sentiment data' },
      { status: 500 }
    )
  }
}