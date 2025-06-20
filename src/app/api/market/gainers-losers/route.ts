import { NextRequest, NextResponse } from 'next/server'

const TIINGO_API_KEY = process.env.TIINGO_API_KEY
const TIINGO_BASE_URL = 'https://api.tiingo.com/tiingo'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    // Real API implementation for Tiingo
    if (!TIINGO_API_KEY) {
      return NextResponse.json(
        { error: 'Tiingo API key not configured' },
        { status: 500 }
      )
    }

    // Popular stock symbols to check for gainers/losers
    const symbols = [
      'AAPL', 'GOOGL', 'MSFT', 'AMZN', 'META', 'NVDA', 'TSLA', 'NFLX', 
      'AMD', 'INTC', 'ORCL', 'ADBE', 'CRM', 'PYPL', 'COIN', 'PLTR',
      'F', 'GM', 'DIS', 'BABA', 'NKLA', 'SPCE', 'SHOP', 'SQ'
    ].slice(0, Math.min(30, limit * 3)) // Limit to prevent API quota issues
    const stockPromises = symbols.map(async (symbol) => {
      try {
        const response = await fetch(
          `${TIINGO_BASE_URL}/daily/${symbol}/prices?token=${TIINGO_API_KEY}&startDate=2024-01-01&resampleFreq=daily`,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Token ${TIINGO_API_KEY}`,
            },
          }
        )

        if (response.ok) {
          const data = await response.json()
          if (data && data.length > 0) {
            const latestData = data[data.length - 1]
            const previousData = data.length > 1 ? data[data.length - 2] : null
            const previousClose = previousData ? previousData.close : latestData.adjOpen
            const change = latestData.close - previousClose
            const changePercent = (change / previousClose) * 100

            return {
              symbol,
              name: `${symbol} Corp.`,
              price: latestData.close,
              change: Math.round(change * 100) / 100,
              changePercent: Math.round(changePercent * 100) / 100,
              volume: latestData.volume,
              high: latestData.high,
              low: latestData.low,
              open: latestData.open,
              previousClose: previousClose,
              marketCap: undefined
            }
          }
        }
        return null
      } catch (error) {
        console.error(`Error fetching ${symbol}:`, error)
        return null
      }
    })

    const results = await Promise.all(stockPromises)
    const validStocks = results.filter(stock => stock !== null)
    
    // Sort by change percentage
    const sorted = validStocks.sort((a, b) => b.changePercent - a.changePercent)
    
    const result = {
      gainers: sorted.slice(0, limit),
      losers: sorted.slice(-limit).reverse()
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Market data API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch market data' },
      { status: 500 }
    )
  }
}