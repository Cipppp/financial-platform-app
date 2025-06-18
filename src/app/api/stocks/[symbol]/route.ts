import { NextRequest, NextResponse } from 'next/server'
import { generateDummyStockData, isDummyDataEnabled } from '@/lib/dummyData'
import { DynamoDBCache } from '@/lib/dynamodb'

export async function GET(
  request: NextRequest,
  { params }: { params: { symbol: string } }
) {
  try {
    const { symbol } = await params
    const symbolUpper = symbol.toUpperCase()
    
    // Get data source from environment variable
    const dataSource = process.env.STOCK_DATA_SOURCE || 'dummy'
    
    // Always check dummy data flag first
    if (isDummyDataEnabled() || dataSource === 'dummy') {
      console.log(`🎭 Using dummy data for ${symbolUpper}`)
      const dummyData = generateDummyStockData(symbolUpper)
      return NextResponse.json(dummyData)
    }

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
        console.warn(`Unknown data source: ${dataSource}, falling back to dummy data`)
        const dummyData = generateDummyStockData(symbolUpper)
        return NextResponse.json(dummyData)
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
    
    // If the API returned an error, fall back to dummy data
    if (data.error) {
      console.warn(`${dataSource} API returned error: ${data.error}, falling back to dummy data`)
      const dummyData = generateDummyStockData(symbolUpper)
      return NextResponse.json(dummyData)
    }
    
    // Cache the successful response
    await DynamoDBCache.set(cacheKey, data, 15) // Cache for 15 minutes
    console.log(`💾 Cached data for ${symbolUpper} from ${dataSource}`)
    
    return NextResponse.json(data)
    
  } catch (error) {
    console.error(`Universal Stock API Error:`, error)
    
    // Fallback to dummy data on any error
    const dummyData = generateDummyStockData(symbol)
    return NextResponse.json({
      ...dummyData,
      _fallback: true,
      _originalError: error.message
    })
  }
}
