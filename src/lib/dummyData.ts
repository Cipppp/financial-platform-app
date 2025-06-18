import { StockData } from './types'

// Expanded stock list for market scanning
const STOCK_NAMES: { [key: string]: string } = {
  // Tech Giants
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
  'TWTR': 'Twitter Inc.',
  
  // Financial
  'JPM': 'JPMorgan Chase & Co.',
  'BAC': 'Bank of America Corporation',
  'WFC': 'Wells Fargo & Company',
  'GS': 'Goldman Sachs Group Inc.',
  'MS': 'Morgan Stanley',
  'C': 'Citigroup Inc.',
  'V': 'Visa Inc.',
  'MA': 'Mastercard Incorporated',
  'AXP': 'American Express Company',
  'BRK.B': 'Berkshire Hathaway Inc.',
  
  // Healthcare
  'JNJ': 'Johnson & Johnson',
  'PFE': 'Pfizer Inc.',
  'UNH': 'UnitedHealth Group Incorporated',
  'ABBV': 'AbbVie Inc.',
  'MRK': 'Merck & Co. Inc.',
  'TMO': 'Thermo Fisher Scientific Inc.',
  'ABT': 'Abbott Laboratories',
  'BMY': 'Bristol-Myers Squibb Company',
  'AMGN': 'Amgen Inc.',
  'GILD': 'Gilead Sciences Inc.',
  
  // Consumer
  'KO': 'The Coca-Cola Company',
  'PEP': 'PepsiCo Inc.',
  'WMT': 'Walmart Inc.',
  'HD': 'The Home Depot Inc.',
  'MCD': 'McDonald\'s Corporation',
  'NKE': 'NIKE Inc.',
  'SBUX': 'Starbucks Corporation',
  'TGT': 'Target Corporation',
  'COST': 'Costco Wholesale Corporation',
  'LOW': 'Lowe\'s Companies Inc.',
  
  // Energy
  'XOM': 'Exxon Mobil Corporation',
  'CVX': 'Chevron Corporation',
  'COP': 'ConocoPhillips',
  'EOG': 'EOG Resources Inc.',
  'SLB': 'Schlumberger Limited',
  'PSX': 'Phillips 66',
  'VLO': 'Valero Energy Corporation',
  'MPC': 'Marathon Petroleum Corporation',
  
  // Industrial
  'BA': 'The Boeing Company',
  'CAT': 'Caterpillar Inc.',
  'GE': 'General Electric Company',
  'MMM': '3M Company',
  'HON': 'Honeywell International Inc.',
  'UPS': 'United Parcel Service Inc.',
  'FDX': 'FedEx Corporation',
  'LMT': 'Lockheed Martin Corporation',
  'RTX': 'Raytheon Technologies Corporation',
  'DE': 'Deere & Company'
}

// Base prices for realistic dummy data (roughly current market prices)
const BASE_PRICES: { [key: string]: number } = {
  // Tech Giants
  'AAPL': 185.0, 'GOOGL': 140.0, 'MSFT': 415.0, 'AMZN': 145.0, 'META': 485.0,
  'NVDA': 875.0, 'TSLA': 240.0, 'NFLX': 485.0, 'AMD': 140.0, 'INTC': 25.0,
  'ORCL': 115.0, 'ADBE': 555.0, 'CRM': 260.0, 'PYPL': 75.0, 'COIN': 205.0,
  'UBER': 65.0, 'SHOP': 95.0, 'ROKU': 85.0, 'SNAP': 12.0, 'TWTR': 45.0,
  
  // Financial
  'JPM': 215.0, 'BAC': 40.0, 'WFC': 45.0, 'GS': 385.0, 'MS': 95.0,
  'C': 55.0, 'V': 285.0, 'MA': 425.0, 'AXP': 185.0, 'BRK.B': 355.0,
  
  // Healthcare
  'JNJ': 165.0, 'PFE': 35.0, 'UNH': 525.0, 'ABBV': 145.0, 'MRK': 125.0,
  'TMO': 585.0, 'ABT': 115.0, 'BMY': 55.0, 'AMGN': 285.0, 'GILD': 85.0,
  
  // Consumer
  'KO': 65.0, 'PEP': 175.0, 'WMT': 165.0, 'HD': 385.0, 'MCD': 285.0,
  'NKE': 105.0, 'SBUX': 105.0, 'TGT': 155.0, 'COST': 885.0, 'LOW': 245.0,
  
  // Energy
  'XOM': 115.0, 'CVX': 165.0, 'COP': 125.0, 'EOG': 135.0, 'SLB': 45.0,
  'PSX': 135.0, 'VLO': 145.0, 'MPC': 165.0,
  
  // Industrial
  'BA': 185.0, 'CAT': 355.0, 'GE': 165.0, 'MMM': 125.0, 'HON': 215.0,
  'UPS': 155.0, 'FDX': 285.0, 'LMT': 485.0, 'RTX': 115.0, 'DE': 385.0
}

export function generateDummyStockData(symbol: string): StockData {
  const symbolUpper = symbol.toUpperCase()
  const basePrice = BASE_PRICES[symbolUpper] || (50 + Math.random() * 300)
  
  // Generate realistic daily fluctuation (-5% to +5%)
  const changePercent = -5 + Math.random() * 10
  const change = basePrice * (changePercent / 100)
  const currentPrice = basePrice + change
  
  // Generate realistic intraday high/low
  const volatility = Math.random() * 0.03 // 0-3% volatility
  const high = currentPrice + (currentPrice * volatility)
  const low = currentPrice - (currentPrice * volatility)
  const open = low + Math.random() * (high - low)
  const previousClose = currentPrice - change
  
  return {
    symbol: symbolUpper,
    name: STOCK_NAMES[symbolUpper] || `${symbolUpper} Corp.`,
    price: Math.round(currentPrice * 100) / 100,
    change: Math.round(change * 100) / 100,
    changePercent: Math.round(changePercent * 100) / 100,
    volume: Math.floor(1000000 + Math.random() * 50000000), // 1M - 51M volume
    high: Math.round(high * 100) / 100,
    low: Math.round(low * 100) / 100,
    open: Math.round(open * 100) / 100,
    previousClose: Math.round(previousClose * 100) / 100,
    marketCap: Math.floor(10000000000 + Math.random() * 2000000000000) // 10B - 2.01T market cap
  }
}

export function isDummyDataEnabled(): boolean {
  return process.env.USE_DUMMY_DATA === 'true'
}

export function getAllStockSymbols(): string[] {
  return Object.keys(STOCK_NAMES)
}

export function generateMarketData(): StockData[] {
  const symbols = getAllStockSymbols()
  return symbols.map(symbol => generateDummyStockData(symbol))
}

export function getTopGainersLosers(limit: number = 10): { gainers: StockData[], losers: StockData[] } {
  const marketData = generateMarketData()
  
  // Sort by change percentage
  const sorted = marketData.sort((a, b) => b.changePercent - a.changePercent)
  
  return {
    gainers: sorted.slice(0, limit),
    losers: sorted.slice(-limit).reverse() // Reverse to show biggest losers first
  }
}