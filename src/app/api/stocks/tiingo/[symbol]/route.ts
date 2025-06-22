import { NextRequest, NextResponse } from 'next/server'
import { TiingoQuote, StockData } from '@/lib/types'
import { config } from '@/lib/config'

const TIINGO_API_KEY = config.api.tiingo.apiKey
const TIINGO_BASE_URL = config.api.tiingo.baseUrl

export async function GET(
  request: NextRequest,
  { params }: { params: { symbol: string } }
) {
  try {
    const { symbol } = await params
    const symbolUpper = symbol.toUpperCase()
    
    if (!TIINGO_API_KEY) {
      return NextResponse.json(
        { error: 'Tiingo API key not configured' },
        { status: 500 }
      )
    }

    // Fetch real-time quote data from Tiingo
    const quoteResponse = await fetch(
      `${TIINGO_BASE_URL}/daily/${symbolUpper}/prices?token=${TIINGO_API_KEY}&startDate=2024-01-01&resampleFreq=daily`,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${TIINGO_API_KEY}`,
        },
      }
    )
    
    if (!quoteResponse.ok) {
      return NextResponse.json(
        { error: `Tiingo API error: ${quoteResponse.status}` },
        { status: quoteResponse.status }
      )
    }
    
    const quoteData = await quoteResponse.json()
    
    // Check if we got valid data
    if (!quoteData || quoteData.length === 0) {
      return NextResponse.json(
        { error: `No data available for ${symbolUpper}` },
        { status: 404 }
      )
    }

    const latestData = quoteData[quoteData.length - 1] // Get the most recent data
    const previousData = quoteData.length > 1 ? quoteData[quoteData.length - 2] : null
    
    // Calculate change and change percent
    const previousClose = previousData ? previousData.close : latestData.adjOpen
    const change = latestData.close - previousClose
    const changePercent = (change / previousClose) * 100
    
    // Transform Tiingo data to our format
    const stockData: StockData = {
      symbol: symbolUpper,
      name: `${symbolUpper} Corp.`, // Tiingo doesn't provide company names in this endpoint
      price: latestData.close,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
      volume: latestData.volume,
      high: latestData.high,
      low: latestData.low,
      open: latestData.open,
      previousClose: previousClose,
      marketCap: undefined // Would need separate API call for market cap
    }
    
    return NextResponse.json(stockData)
  } catch (error) {
    console.error('Tiingo API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stock data' },
      { status: 500 }
    )
  }
}