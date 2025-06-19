import { NextRequest, NextResponse } from 'next/server'
import { AlphaVantageQuote, StockData } from '@/lib/types'
import { generateDummyStockData, isDummyDataEnabled } from '@/lib/dummyData'

const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY
const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query'

export async function GET(
  request: NextRequest,
  { params }: { params: { symbol: string } }
) {
  try {
    const { symbol } = await params
    const symbolUpper = symbol.toUpperCase()
    
    // Check if dummy data is enabled
    if (isDummyDataEnabled()) {
      console.log(`🎭 Using dummy data for ${symbolUpper}`)
      const dummyData = generateDummyStockData(symbolUpper)
      return NextResponse.json(dummyData)
    }
    
    if (!ALPHA_VANTAGE_API_KEY) {
      return NextResponse.json(
        { error: 'Alpha Vantage API key not configured' },
        { status: 500 }
      )
    }

    // Fetch real-time quote from Alpha Vantage
    const response = await fetch(
      `${ALPHA_VANTAGE_BASE_URL}?function=GLOBAL_QUOTE&symbol=${symbolUpper}&apikey=${ALPHA_VANTAGE_API_KEY}`,
      {
        headers: {
          'User-Agent': 'Financial-Platform/1.0',
        },
      }
    )
    
    if (!response.ok) {
      throw new Error(`Alpha Vantage API error: ${response.status}`)
    }
    
    const data: AlphaVantageQuote = await response.json()
    
    // Check for API limit or error
    if (data['Information'] || data['Error Message']) {
      console.warn('Alpha Vantage API limit or error, falling back to dummy data')
      const dummyData = generateDummyStockData(symbolUpper)
      return NextResponse.json(dummyData)
    }
    
    const quote = data['Global Quote']
    
    if (!quote || !quote['05. price']) {
      return NextResponse.json(
        { error: `No data available for ${symbolUpper}` },
        { status: 404 }
      )
    }
    
    // Transform Alpha Vantage data to our format
    const stockData: StockData = {
      symbol: symbolUpper,
      name: `${symbolUpper} Corp.`, // Alpha Vantage doesn't provide names in quotes
      price: parseFloat(quote['05. price']),
      change: parseFloat(quote['09. change']),
      changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
      volume: parseInt(quote['06. volume']),
      high: parseFloat(quote['03. high']),
      low: parseFloat(quote['04. low']),
      open: parseFloat(quote['02. open']),
      previousClose: parseFloat(quote['08. previous close'])
    }
    
    return NextResponse.json(stockData)
  } catch (error) {
    console.error('Alpha Vantage API Error:', error)
    // Fallback to dummy data on error
    const dummyData = generateDummyStockData(symbol)
    return NextResponse.json(dummyData)
  }
}
