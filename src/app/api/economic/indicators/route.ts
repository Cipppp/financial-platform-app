import { NextRequest, NextResponse } from 'next/server'
import { EconomicIndicatorRepository } from '@/lib/dynamodb/repositories/EconomicIndicatorRepository'

const economicRepo = new EconomicIndicatorRepository()

// Mock economic indicators data
const ECONOMIC_INDICATORS = [
  {
    indicator: 'GDP_GROWTH',
    name: 'GDP Growth Rate',
    unit: '%',
    description: 'Quarterly GDP growth rate (annualized)',
    category: 'Growth'
  },
  {
    indicator: 'INFLATION_RATE',
    name: 'Inflation Rate (CPI)',
    unit: '%',
    description: 'Consumer Price Index year-over-year change',
    category: 'Inflation'
  },
  {
    indicator: 'UNEMPLOYMENT_RATE',
    name: 'Unemployment Rate',
    unit: '%',
    description: 'Civilian unemployment rate',
    category: 'Employment'
  },
  {
    indicator: 'FEDERAL_FUNDS_RATE',
    name: 'Federal Funds Rate',
    unit: '%',
    description: 'Federal Reserve interest rate',
    category: 'Monetary Policy'
  },
  {
    indicator: 'CONSUMER_CONFIDENCE',
    name: 'Consumer Confidence Index',
    unit: 'Index',
    description: 'Consumer confidence index (100 = 1985 baseline)',
    category: 'Sentiment'
  },
  {
    indicator: 'RETAIL_SALES',
    name: 'Retail Sales Growth',
    unit: '%',
    description: 'Month-over-month retail sales change',
    category: 'Consumption'
  },
  {
    indicator: 'INDUSTRIAL_PRODUCTION',
    name: 'Industrial Production',
    unit: '%',
    description: 'Year-over-year industrial production change',
    category: 'Production'
  },
  {
    indicator: 'HOUSING_STARTS',
    name: 'Housing Starts',
    unit: 'Thousands',
    description: 'New residential construction starts (seasonally adjusted)',
    category: 'Housing'
  }
]

function generateStaticIndicatorData(indicator: string, months: number = 24) {
  const data = []
  const now = new Date()
  
  // Static base values for different indicators - no randomization
  const baseValues: Record<string, number> = {
    'GDP_GROWTH': 2.5,
    'INFLATION_RATE': 3.2,
    'UNEMPLOYMENT_RATE': 4.1,
    'FEDERAL_FUNDS_RATE': 5.25,
    'CONSUMER_CONFIDENCE': 105,
    'RETAIL_SALES': 0.8,
    'INDUSTRIAL_PRODUCTION': 1.2,
    'HOUSING_STARTS': 1400
  }
  
  const currentValue = baseValues[indicator] || 100
  
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setMonth(date.getMonth() - i)
    date.setDate(1) // First day of month
    
    // Use static values instead of random generation
    data.push({
      timestamp: date,
      value: currentValue, // No variation - static value
      indicator,
      source: 'Static Data - Real API Required'
    })
  }
  
  return data
}


async function fetchRealEconomicData(indicator: string) {
  // In a real implementation, this would fetch from:
  // - FRED (Federal Reserve Economic Data) API
  // - Bureau of Labor Statistics API
  // - Census Bureau API
  // - Alpha Vantage Economic Indicators
  
  // For now, return static data
  return generateStaticIndicatorData(indicator)
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const indicator = searchParams.get('indicator')
    const months = parseInt(searchParams.get('months') || '24')
    const latest = searchParams.get('latest') === 'true'
    
    const isDummyMode = process.env.NEXT_PUBLIC_USE_DUMMY_DATA === 'true'
    
    if (latest) {
      // Return latest values for all indicators
      const latestData = await Promise.all(
        ECONOMIC_INDICATORS.map(async (ind) => {
          const data = isDummyMode || true 
            ? generateStaticIndicatorData(ind.indicator, 1)
            : await fetchRealEconomicData(ind.indicator)
          
          const latest = data[data.length - 1]
          const previous = generateStaticIndicatorData(ind.indicator, 2)[0] // Previous month
          
          const change = latest.value - previous.value
          const changePercent = (change / previous.value) * 100
          
          return {
            ...ind,
            current: {
              value: latest.value,
              change: parseFloat(change.toFixed(2)),
              changePercent: parseFloat(changePercent.toFixed(2)),
              timestamp: latest.timestamp.toISOString()
            }
          }
        })
      )
      
      return NextResponse.json({
        indicators: latestData,
        generatedAt: new Date().toISOString()
      })
    }
    
    if (indicator) {
      // Get historical data for specific indicator
      const indicatorInfo = ECONOMIC_INDICATORS.find(ind => ind.indicator === indicator)
      
      if (!indicatorInfo) {
        return NextResponse.json(
          { error: 'Indicator not found' },
          { status: 404 }
        )
      }
      
      const data = isDummyMode || true
        ? generateStaticIndicatorData(indicator as string, months)
        : await fetchRealEconomicData(indicator as string)
      
      // Calculate statistics
      const values = data.map(d => d.value)
      const latest = values[values.length - 1]
      const previous = values[values.length - 2]
      const change = latest - previous
      const changePercent = (change / previous) * 100
      
      const average = values.reduce((sum, val) => sum + val, 0) / values.length
      const min = Math.min(...values)
      const max = Math.max(...values)
      
      // Calculate standard deviation
      const variance = values.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / values.length
      const standardDeviation = Math.sqrt(variance)
      
      return NextResponse.json({
        indicator: indicatorInfo,
        statistics: {
          latest: parseFloat(latest.toFixed(2)),
          change: parseFloat(change.toFixed(2)),
          changePercent: parseFloat(changePercent.toFixed(2)),
          average: parseFloat(average.toFixed(2)),
          min: parseFloat(min.toFixed(2)),
          max: parseFloat(max.toFixed(2)),
          standardDeviation: parseFloat(standardDeviation.toFixed(2))
        },
        historical: data.map(d => ({
          timestamp: d.timestamp.toISOString(),
          value: d.value
        })),
        timeframe: `${months} months`,
        generatedAt: new Date().toISOString()
      })
    }
    
    // Return list of available indicators
    return NextResponse.json({
      indicators: ECONOMIC_INDICATORS,
      description: 'Available economic indicators'
    })
    
  } catch (error) {
    console.error('Error fetching economic indicators:', error)
    return NextResponse.json(
      { error: 'Failed to fetch economic indicators' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { indicator, value, timestamp, source } = body
    
    if (!indicator || value === undefined) {
      return NextResponse.json(
        { error: 'Indicator and value are required' },
        { status: 400 }
      )
    }
    
    // Save economic indicator data to database
    const indicatorRecord = await economicRepo.create({
      indicator,
      value: parseFloat(value),
      timestamp: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString(),
      source: source || 'Manual Entry'
    })
    
    return NextResponse.json({
      message: 'Economic indicator saved successfully',
      id: indicatorRecord.id
    })
    
  } catch (error) {
    console.error('Error saving economic indicator:', error)
    return NextResponse.json(
      { error: 'Failed to save economic indicator' },
      { status: 500 }
    )
  }
}