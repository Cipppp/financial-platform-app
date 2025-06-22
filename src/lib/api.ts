import { StockData, ChartDataPoint } from './types'
import { config } from './config'

const API_BASE = config.api.baseUrl

export class FinancialAPI {
  private static instance: FinancialAPI
  
  static getInstance(): FinancialAPI {
    if (!FinancialAPI.instance) {
      FinancialAPI.instance = new FinancialAPI()
    }
    return FinancialAPI.instance
  }

  async getStockData(symbol: string): Promise<StockData> {
    const response = await fetch(`${API_BASE}/api/stocks/${symbol}`)
    if (!response.ok) {
      throw new Error('Failed to fetch stock data')
    }
    return response.json()
  }

  async getStockChart(symbol: string, period: string = '1M'): Promise<ChartDataPoint[]> {
    const response = await fetch(`${API_BASE}/api/stocks/${symbol}/chart?period=${period}`)
    if (!response.ok) {
      throw new Error('Failed to fetch chart data')
    }
    return response.json()
  }

  async searchStocks(query: string): Promise<StockData[]> {
    const response = await fetch(`${API_BASE}/api/stocks/search?q=${query}`)
    if (!response.ok) {
      throw new Error('Failed to search stocks')
    }
    return response.json()
  }

  // Tiingo API methods
  async getTiingoStockData(symbol: string): Promise<StockData> {
    const response = await fetch(`${API_BASE}/api/stocks/tiingo/${symbol}`)
    if (!response.ok) {
      throw new Error('Failed to fetch Tiingo stock data')
    }
    return response.json()
  }

  async getTiingoStockMeta(symbol: string): Promise<any> {
    const response = await fetch(`${API_BASE}/api/stocks/tiingo/meta/${symbol}`)
    if (!response.ok) {
      throw new Error('Failed to fetch Tiingo stock metadata')
    }
    return response.json()
  }
}