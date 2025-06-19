import { NextRequest, NextResponse } from 'next/server'
import { StockData } from '@/lib/types'

const TIINGO_API_KEY = process.env.TIINGO_API_KEY
const TIINGO_BASE_URL = 'https://api.tiingo.com/tiingo/daily'

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

    // Fetch real-time quote from Tiingo
    const response = await fetch(
      `${TIINGO_BASE_URL}/${symbolUpper}/prices?token=${TIINGO_API_KEY}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
    
    if (!response.ok) {
      throw new Error(`Tiingo API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: `No data available for ${symbolUpper}` },
        { status: 404 }
      )
    }
    
    const latestData = data[0]
    
    // Calculate change from previous close
    const change = latestData.close - latestData.adjClose
    const changePercent = ((change / latestData.adjClose) * 100)
    
    // Transform Tiingo data to our format
    const stockData: StockData = {
      symbol: symbolUpper,
      name: `${symbolUpper} Corp.`,
      price: latestData.close,
      change: change,
      changePercent: changePercent,
      volume: latestData.volume,
      high: latestData.high,
      low: latestData.low,
      open: latestData.open,
      previousClose: latestData.adjClose
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
