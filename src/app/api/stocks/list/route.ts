import { NextRequest, NextResponse } from 'next/server'

const TIINGO_API_KEY = process.env.TIINGO_API_KEY
const TIINGO_BASE_URL = 'https://api.tiingo.com/tiingo'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const category = searchParams.get('category') || 'all'
    const search = searchParams.get('search') || ''

    // Get all symbols with categories
    const allStocks = [
      // Top 6 Popular Stocks (most requested)
      { symbol: 'AAPL', category: 'Tech' }, { symbol: 'GOOGL', category: 'Tech' }, 
      { symbol: 'MSFT', category: 'Tech' }, { symbol: 'AMZN', category: 'Tech' },
      { symbol: 'META', category: 'Tech' }, { symbol: 'NVDA', category: 'Tech' },
      
      // Additional popular stocks
      { symbol: 'TSLA', category: 'Auto' }, { symbol: 'NFLX', category: 'Entertainment' }, { symbol: 'PLTR', category: 'Tech' },
      { symbol: 'AMD', category: 'Tech' }, { symbol: 'INTC', category: 'Tech' },
      { symbol: 'ORCL', category: 'Tech' }, { symbol: 'ADBE', category: 'Tech' },
      { symbol: 'CRM', category: 'Tech' }, { symbol: 'PYPL', category: 'Tech' },
      { symbol: 'COIN', category: 'Tech' }, { symbol: 'UBER', category: 'Transport' },
      { symbol: 'SHOP', category: 'E-commerce' }, { symbol: 'ROKU', category: 'Entertainment' },
      { symbol: 'SNAP', category: 'Tech' }, { symbol: 'F', category: 'Auto' },
      { symbol: 'GM', category: 'Auto' }, { symbol: 'DIS', category: 'Entertainment' },
      { symbol: 'BABA', category: 'Tech' }, { symbol: 'NKLA', category: 'Auto' },
      
      // Financial
      { symbol: 'JPM', category: 'Finance' }, { symbol: 'BAC', category: 'Finance' },
      { symbol: 'WFC', category: 'Finance' }, { symbol: 'GS', category: 'Finance' },
      { symbol: 'MS', category: 'Finance' }, { symbol: 'C', category: 'Finance' },
      { symbol: 'V', category: 'Finance' }, { symbol: 'MA', category: 'Finance' },
      { symbol: 'AXP', category: 'Finance' },
      
      // Healthcare
      { symbol: 'JNJ', category: 'Healthcare' }, { symbol: 'PFE', category: 'Healthcare' },
      { symbol: 'UNH', category: 'Healthcare' }, { symbol: 'ABBV', category: 'Healthcare' },
      { symbol: 'MRK', category: 'Healthcare' }, { symbol: 'TMO', category: 'Healthcare' },
      { symbol: 'ABT', category: 'Healthcare' }, { symbol: 'BMY', category: 'Healthcare' },
      
      // Consumer
      { symbol: 'KO', category: 'Consumer' }, { symbol: 'PEP', category: 'Consumer' },
      { symbol: 'WMT', category: 'Consumer' }, { symbol: 'HD', category: 'Consumer' },
      { symbol: 'MCD', category: 'Consumer' }, { symbol: 'NKE', category: 'Consumer' },
      { symbol: 'SBUX', category: 'Consumer' }, { symbol: 'TGT', category: 'Consumer' },
      
      // Energy
      { symbol: 'XOM', category: 'Energy' }, { symbol: 'CVX', category: 'Energy' },
      { symbol: 'COP', category: 'Energy' }, { symbol: 'EOG', category: 'Energy' },
      
      // Industrial
      { symbol: 'BA', category: 'Industrial' }, { symbol: 'CAT', category: 'Industrial' },
      { symbol: 'GE', category: 'Industrial' }, { symbol: 'MMM', category: 'Industrial' }
    ]

    // Enhanced search that matches both symbol and company name
    let filteredStocks = allStocks.filter(stock => {
      const matchesCategory = category === 'all' || stock.category === category
      
      if (search === '') {
        return matchesCategory
      }
      
      const searchLower = search.toLowerCase().trim()
      const symbolMatch = stock.symbol.toLowerCase().includes(searchLower)
      
      // Generate company names for better search experience
      const companyNames: Record<string, string> = {
        'AAPL': 'Apple Inc.',
        'GOOGL': 'Alphabet Inc.',
        'MSFT': 'Microsoft Corporation',
        'AMZN': 'Amazon.com Inc.',
        'META': 'Meta Platforms Inc.',
        'NVDA': 'NVIDIA Corporation',
        'TSLA': 'Tesla Inc.',
        'NFLX': 'Netflix Inc.',
        'AMD': 'Advanced Micro Devices Inc.',
        'INTC': 'Intel Corporation',
        'ORCL': 'Oracle Corporation',
        'ADBE': 'Adobe Inc.',
        'CRM': 'Salesforce Inc.',
        'PYPL': 'PayPal Holdings Inc.',
        'COIN': 'Coinbase Global Inc.',
        'UBER': 'Uber Technologies Inc.',
        'SHOP': 'Shopify Inc.',
        'ROKU': 'Roku Inc.',
        'SNAP': 'Snap Inc.',
        'PLTR': 'Palantir Technologies Inc.',
        'F': 'Ford Motor Company',
        'GM': 'General Motors Company',
        'DIS': 'The Walt Disney Company',
        'BABA': 'Alibaba Group Holding Limited',
        'NKLA': 'Nikola Corporation',
        'JPM': 'JPMorgan Chase & Co.',
        'BAC': 'Bank of America Corporation',
        'WFC': 'Wells Fargo & Company',
        'GS': 'Goldman Sachs Group Inc.',
        'MS': 'Morgan Stanley',
        'C': 'Citigroup Inc.',
        'V': 'Visa Inc.',
        'MA': 'Mastercard Incorporated',
        'AXP': 'American Express Company'
      }
      
      const companyName = companyNames[stock.symbol] || `${stock.symbol} Corp.`
      const nameMatch = companyName.toLowerCase().includes(searchLower)
      
      return matchesCategory && (symbolMatch || nameMatch)
    })

    // Pagination
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedStocks = filteredStocks.slice(startIndex, endIndex)

    // Get stock data from Tiingo API
    const stocksData = []
    
    console.log(`Fetching real data for ${paginatedStocks.length} stocks (page ${page})`)
    
    // Company names mapping
    const companyNames: Record<string, string> = {
      'AAPL': 'Apple Inc.',
      'GOOGL': 'Alphabet Inc.',
      'MSFT': 'Microsoft Corporation',
      'AMZN': 'Amazon.com Inc.',
      'META': 'Meta Platforms Inc.',
      'NVDA': 'NVIDIA Corporation',
      'TSLA': 'Tesla Inc.',
      'NFLX': 'Netflix Inc.',
      'PLTR': 'Palantir Technologies Inc.',
      'F': 'Ford Motor Company',
      'GM': 'General Motors Company',
      'DIS': 'The Walt Disney Company',
      'BABA': 'Alibaba Group Holding Limited',
      'NKLA': 'Nikola Corporation'
    }
    
    {
      // Parallel API calls with timeout for better performance
      const fetchPromises = paginatedStocks.map(async (stockConfig) => {
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout
          
          const response = await fetch(
            `${TIINGO_BASE_URL}/daily/${stockConfig.symbol}/prices?token=${TIINGO_API_KEY}&startDate=2024-01-01&resampleFreq=daily`,
            {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${TIINGO_API_KEY}`,
              },
              signal: controller.signal
            }
          )
          
          clearTimeout(timeoutId)

          if (response.ok) {
            const data = await response.json()
            if (data && data.length > 0) {
              const latestData = data[data.length - 1]
              const previousData = data.length > 1 ? data[data.length - 2] : null
              const previousClose = previousData ? previousData.close : latestData.adjOpen
              const change = latestData.close - previousClose
              const changePercent = (change / previousClose) * 100
              
              // Calculate relative volume (current volume vs average volume)
              // Use recent volume data to calculate average
              const recentVolumes = data.slice(-10).map((d: any) => d.volume).filter((v: any) => v > 0)
              const avgVolume = recentVolumes.length > 0 
                ? recentVolumes.reduce((sum: number, vol: number) => sum + vol, 0) / recentVolumes.length
                : latestData.volume
              const relativeVolume = avgVolume > 0 ? latestData.volume / avgVolume : 1.0

              // Enhanced company names
              const companyNames: Record<string, string> = {
                'AAPL': 'Apple Inc.',
                'GOOGL': 'Alphabet Inc.',
                'MSFT': 'Microsoft Corporation',
                'AMZN': 'Amazon.com Inc.',
                'META': 'Meta Platforms Inc.',
                'NVDA': 'NVIDIA Corporation',
                'TSLA': 'Tesla Inc.',
                'NFLX': 'Netflix Inc.',
                'AMD': 'Advanced Micro Devices Inc.',
                'INTC': 'Intel Corporation',
                'ORCL': 'Oracle Corporation',
                'ADBE': 'Adobe Inc.',
                'CRM': 'Salesforce Inc.',
                'PYPL': 'PayPal Holdings Inc.',
                'COIN': 'Coinbase Global Inc.',
                'UBER': 'Uber Technologies Inc.',
                'SHOP': 'Shopify Inc.',
                'ROKU': 'Roku Inc.',
                'SNAP': 'Snap Inc.',
                'PLTR': 'Palantir Technologies Inc.',
                'F': 'Ford Motor Company',
                'GM': 'General Motors Company',
                'DIS': 'The Walt Disney Company',
                'BABA': 'Alibaba Group Holding Limited',
                'NKLA': 'Nikola Corporation',
                'JPM': 'JPMorgan Chase & Co.',
                'BAC': 'Bank of America Corporation',
                'WFC': 'Wells Fargo & Company',
                'GS': 'Goldman Sachs Group Inc.',
                'MS': 'Morgan Stanley',
                'C': 'Citigroup Inc.',
                'V': 'Visa Inc.',
                'MA': 'Mastercard Incorporated',
                'AXP': 'American Express Company'
              }
              
              return {
                symbol: stockConfig.symbol,
                name: companyNames[stockConfig.symbol] || `${stockConfig.symbol} Corp.`,
                price: latestData.close,
                change: Math.round(change * 100) / 100,
                changePercent: Math.round(changePercent * 100) / 100,
                volume: latestData.volume,
                high: latestData.high,
                low: latestData.low,
                open: latestData.open,
                previousClose: previousClose,
                marketCap: undefined,
                category: stockConfig.category,
                relativeVolume: Math.round(relativeVolume * 100) / 100,
                sharesOutstanding: undefined // Will be fetched separately if needed
              }
            }
          }
        } catch (error) {
          console.error(`Error fetching ${stockConfig.symbol}:`, error)
        }
        return null
      })
      
      // Wait for all API calls to complete (or timeout)
      const results = await Promise.allSettled(fetchPromises)
      
      // Filter successful results
      results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value) {
          stocksData.push(result.value)
        }
      })
    }

    // Log final results
    console.log(`✅ Successfully fetched ${stocksData.length} out of ${paginatedStocks.length} requested stocks`)

    console.log(`✅ Returning ${stocksData.length} stocks`)

    return NextResponse.json({
      stocks: stocksData,
      pagination: {
        page,
        limit,
        total: filteredStocks.length,
        totalPages: Math.ceil(filteredStocks.length / limit),
        hasNext: endIndex < filteredStocks.length,
        hasPrev: page > 1
      }
    })

  } catch (error) {
    console.error('Stock list API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stock list' },
      { status: 500 }
    )
  }
}