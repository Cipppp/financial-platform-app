import { NextRequest, NextResponse } from 'next/server'
import { generateDummyStockData } from '@/lib/dummyData'

const TIINGO_API_KEY = process.env.TIINGO_API_KEY
const TIINGO_BASE_URL = 'https://api.tiingo.com/tiingo'

export async function GET(
  request: NextRequest,
  { params }: { params: { symbol: string } }
) {
  try {
    const { symbol } = await params
    const symbolUpper = symbol.toUpperCase()
    const { searchParams } = new URL(request.url)
    
    const startDate = searchParams.get('startDate') || '2024-01-01'
    const endDate = searchParams.get('endDate') || new Date().toISOString().split('T')[0]
    const resampleFreq = searchParams.get('resampleFreq') || 'daily'
    
    // Check if dummy data is enabled
    const isDummyEnabled = process.env.USE_DUMMY_DATA === 'true'
    
    if (isDummyEnabled || !TIINGO_API_KEY) {
      console.log(`🎭 Using dummy chart data for ${symbolUpper}`)
      
      // Generate 30 days of dummy OHLC data
      const chartData = []
      const basePrice = 100 + Math.random() * 900 // Random base price between 100-1000
      
      for (let i = 0; i < 30; i++) {
        const date = new Date()
        date.setDate(date.getDate() - (29 - i))
        
        // Generate realistic OHLC data with some variation
        const open = basePrice + (Math.random() - 0.5) * 20
        const close = open + (Math.random() - 0.5) * 10
        const high = Math.max(open, close) + Math.random() * 5
        const low = Math.min(open, close) - Math.random() * 5
        
        chartData.push({
          date: date.toISOString().split('T')[0],
          open: Math.round(open * 100) / 100,
          high: Math.round(high * 100) / 100,
          low: Math.round(low * 100) / 100,
          close: Math.round(close * 100) / 100,
          volume: Math.floor(Math.random() * 1000000) + 100000
        })
      }
      
      return NextResponse.json(chartData)
    }

    // Fetch historical OHLC data from Tiingo
    const response = await fetch(
      `${TIINGO_BASE_URL}/daily/${symbolUpper}/prices?token=${TIINGO_API_KEY}&startDate=${startDate}&endDate=${endDate}&resampleFreq=${resampleFreq}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${TIINGO_API_KEY}`,
        },
      }
    )
    
    if (!response.ok) {
      return NextResponse.json(
        { error: `Tiingo API error: ${response.status}` },
        { status: response.status }
      )
    }
    
    const data = await response.json()
    
    // Check if we got valid data
    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: `No chart data available for ${symbolUpper}` },
        { status: 404 }
      )
    }

    // Transform Tiingo data to our chart format
    const chartData = data.map((point: any) => ({
      date: point.date.split('T')[0], // Convert to yyyy-mm-dd format
      open: point.open,
      high: point.high,
      low: point.low,
      close: point.close,
      volume: point.volume
    }))
    
    return NextResponse.json(chartData)
    
  } catch (error) {
    console.error('Chart API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chart data' },
      { status: 500 }
    )
  }
}