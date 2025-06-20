import { NextRequest, NextResponse } from 'next/server'
import { DynamoDBCache } from '@/lib/dynamodb'

export async function GET(
  request: NextRequest,
  { params }: { params: { symbol: string } }
) {
  try {
    const { symbol } = await params
    const symbolUpper = symbol.toUpperCase()
    
    // Use Tiingo as data source
    const dataSource = 'tiingo'
    
    // Check cache first
    const cacheKey = DynamoDBCache.generateKey(symbolUpper, dataSource)
    const cachedData = await DynamoDBCache.get(cacheKey)
    
    if (cachedData) {
      console.log(`📦 Cache hit for ${symbolUpper} from ${dataSource}`)
      return NextResponse.json({
        ...cachedData,
        _cached: true
      })
    }
    
    // Route to appropriate data source
    let apiEndpoint: string
    
    switch (dataSource.toLowerCase()) {
      case 'tiingo':
        apiEndpoint = `/api/stocks/tiingo/${symbolUpper}`
        break
      case 'alpha-vantage':
      case 'alphavantage':
        apiEndpoint = `/api/stocks/alpha-vantage/${symbolUpper}`
        break
      case 'yahoo':
        apiEndpoint = `/api/stocks/yahoo/${symbolUpper}`
        break
      case 'polygon':
        apiEndpoint = `/api/stocks/polygon/${symbolUpper}`
        break
      default:
        return NextResponse.json(
          { error: `Unknown data source: ${dataSource}` },
          { status: 400 }
        )
    }
    
    // Fetch from the selected data source
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}${apiEndpoint}`,
      { 
        cache: 'no-cache',
        headers: {
          'User-Agent': 'Financial-Platform/1.0',
        },
      }
    )
    
    if (!response.ok) {
      throw new Error(`${dataSource} API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    // If the API returned an error, return error response
    if (data.error) {
      console.warn(`${dataSource} API returned error: ${data.error}`)
      return NextResponse.json(
        { error: `Failed to fetch data from ${dataSource}: ${data.error}` },
        { status: 500 }
      )
    }
    
    // Cache the successful response
    await DynamoDBCache.set(cacheKey, data, 15) // Cache for 15 minutes
    console.log(`💾 Cached data for ${symbolUpper} from ${dataSource}`)
    
    return NextResponse.json(data)
    
  } catch (error) {
    console.error(`Universal Stock API Error:`, error)
    
    return NextResponse.json({
      error: 'Failed to fetch stock data',
      _fallback: true,
      _originalError: error.message
    })
  }
}
