import { NextRequest, NextResponse } from 'next/server'

const TIINGO_API_KEY = process.env.TIINGO_API_KEY
const TIINGO_BASE_URL = 'https://api.tiingo.com/tiingo'

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

    // Fetch company metadata from Tiingo
    const metaResponse = await fetch(
      `${TIINGO_BASE_URL}/daily/${symbolUpper}?token=${TIINGO_API_KEY}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
    
    if (!metaResponse.ok) {
      return NextResponse.json(
        { error: `Tiingo API error: ${metaResponse.status}` },
        { status: metaResponse.status }
      )
    }
    
    const metaData = await metaResponse.json()
    
    return NextResponse.json(metaData)
  } catch (error) {
    console.error('Tiingo Meta API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stock metadata' },
      { status: 500 }
    )
  }
}