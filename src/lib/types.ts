export interface StockData {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: number
  marketCap?: number
  high?: number
  low?: number
  open?: number
  previousClose?: number
  // Additional fields for detailed view
  fiftyTwoWeekHigh?: number
  fiftyTwoWeekLow?: number
  avgVolume?: number
  peRatio?: number
  beta?: number
  sharesOutstanding?: number
  exchange?: string
  sector?: string
  industry?: string
  country?: string
  description?: string
  // New fields for enhanced features
  nextEarningsDate?: string
  lastEarningsDate?: string
  earningsPerShare?: number
  preMarketPrice?: number
  afterHoursPrice?: number
  preMarketChange?: number
  afterHoursChange?: number
  preMarketChangePercent?: number
  afterHoursChangePercent?: number
  performance?: {
    oneWeek: number
    oneMonth: number
    threeMonths: number
    sixMonths: number
    oneYear: number
  }
}

export interface AlphaVantageQuote {
  'Global Quote': {
    '01. symbol': string
    '02. open': string
    '03. high': string
    '04. low': string
    '05. price': string
    '06. volume': string
    '07. latest trading day': string
    '08. previous close': string
    '09. change': string
    '10. change percent': string
  }
}

export interface AlphaVantageOverview {
  Symbol: string
  Name: string
  MarketCapitalization: string
  [key: string]: string
}

export interface TiingoQuote {
  ticker: string
  timestamp: string
  quoteTimestamp: string
  lastSaleTimestamp: string
  last: number
  lastSize: number
  tngoLast: number
  prevClose: number
  open: number
  high: number
  low: number
  mid: number
  volume: number
  bidSize: number
  bidPrice: number
  askSize: number
  askPrice: number
}

export interface TiingoHistoricalData {
  date: string
  close: number
  high: number
  low: number
  open: number
  volume: number
  adjClose: number
  adjHigh: number
  adjLow: number
  adjOpen: number
  adjVolume: number
  divCash: number
  splitFactor: number
}

export interface ChartDataPoint {
  date: string
  price: number
  volume?: number
}

export interface CandlestickDataPoint {
  time: string
  open: number
  high: number
  low: number
  close: number
  volume?: number
}