// src/lib/technicalIndicators.ts

export interface PriceData {
  timestamp: Date
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface TechnicalIndicators {
  rsi?: number
  macd?: number
  macdSignal?: number
  macdHist?: number
  bollUpper?: number
  bollMiddle?: number
  bollLower?: number
  sma20?: number
  sma50?: number
  sma200?: number
  ema12?: number
  ema26?: number
}

/**
 * Simple Moving Average
 */
export function calculateSMA(prices: number[], period: number): number[] {
  const sma: number[] = []
  
  for (let i = period - 1; i < prices.length; i++) {
    const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0)
    sma.push(sum / period)
  }
  
  return sma
}

/**
 * Exponential Moving Average
 */
export function calculateEMA(prices: number[], period: number): number[] {
  const ema: number[] = []
  const multiplier = 2 / (period + 1)
  
  // First EMA is just SMA
  let sum = 0
  for (let i = 0; i < period; i++) {
    sum += prices[i]
  }
  ema.push(sum / period)
  
  // Calculate remaining EMAs
  for (let i = period; i < prices.length; i++) {
    const currentEMA = (prices[i] * multiplier) + (ema[ema.length - 1] * (1 - multiplier))
    ema.push(currentEMA)
  }
  
  return ema
}

/**
 * Relative Strength Index (RSI)
 */
export function calculateRSI(prices: number[], period: number = 14): number[] {
  const rsi: number[] = []
  const gains: number[] = []
  const losses: number[] = []
  
  // Calculate price changes
  for (let i = 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1]
    gains.push(change > 0 ? change : 0)
    losses.push(change < 0 ? Math.abs(change) : 0)
  }
  
  // Calculate RSI
  for (let i = period - 1; i < gains.length; i++) {
    let avgGain: number
    let avgLoss: number
    
    if (i === period - 1) {
      // First calculation uses SMA
      avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period
      avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period
    } else {
      // Subsequent calculations use smoothed averages
      const prevAvgGain = i > period - 1 ? (rsi.length > 0 ? parseFloat((100 - (100 / (1 + rsi[rsi.length - 1]))).toFixed(2)) : 0) : 0
      const prevAvgLoss = i > period - 1 ? (rsi.length > 0 ? parseFloat((100 / (1 + rsi[rsi.length - 1]) - 100).toFixed(2)) : 0) : 0
      avgGain = (prevAvgGain * (period - 1) + gains[i]) / period
      avgLoss = (prevAvgLoss * (period - 1) + losses[i]) / period
    }
    
    const rs = avgGain / avgLoss
    const rsiValue = 100 - (100 / (1 + rs))
    rsi.push(rsiValue)
  }
  
  return rsi
}

/**
 * MACD (Moving Average Convergence Divergence)
 */
export function calculateMACD(prices: number[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9) {
  const ema12 = calculateEMA(prices, fastPeriod)
  const ema26 = calculateEMA(prices, slowPeriod)
  
  // MACD line is difference between fast and slow EMA
  const macdLine: number[] = []
  const startIndex = slowPeriod - fastPeriod
  
  for (let i = 0; i < ema12.length - startIndex; i++) {
    macdLine.push(ema12[i + startIndex] - ema26[i])
  }
  
  // Signal line is EMA of MACD line
  const signalLine = calculateEMA(macdLine, signalPeriod)
  
  // Histogram is difference between MACD and signal
  const histogram: number[] = []
  const histStartIndex = signalPeriod - 1
  
  for (let i = 0; i < signalLine.length; i++) {
    histogram.push(macdLine[i + histStartIndex] - signalLine[i])
  }
  
  return {
    macd: macdLine,
    signal: signalLine,
    histogram
  }
}

/**
 * Bollinger Bands
 */
export function calculateBollingerBands(prices: number[], period: number = 20, stdDevMultiplier: number = 2) {
  const sma = calculateSMA(prices, period)
  const upperBand: number[] = []
  const lowerBand: number[] = []
  
  for (let i = 0; i < sma.length; i++) {
    const dataIndex = i + period - 1
    const subset = prices.slice(dataIndex - period + 1, dataIndex + 1)
    
    // Calculate standard deviation
    const mean = sma[i]
    const squaredDiffs = subset.map(price => Math.pow(price - mean, 2))
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period
    const stdDev = Math.sqrt(variance)
    
    upperBand.push(mean + (stdDevMultiplier * stdDev))
    lowerBand.push(mean - (stdDevMultiplier * stdDev))
  }
  
  return {
    upper: upperBand,
    middle: sma,
    lower: lowerBand
  }
}

/**
 * Calculate all technical indicators for given price data
 */
export function calculateAllIndicators(priceData: PriceData[]): TechnicalIndicators[] {
  if (priceData.length < 200) {
    throw new Error('Insufficient data for technical analysis (minimum 200 data points required)')
  }
  
  const closePrices = priceData.map(d => d.close)
  const results: TechnicalIndicators[] = []
  
  // Calculate all indicators
  const sma20 = calculateSMA(closePrices, 20)
  const sma50 = calculateSMA(closePrices, 50)
  const sma200 = calculateSMA(closePrices, 200)
  const ema12 = calculateEMA(closePrices, 12)
  const ema26 = calculateEMA(closePrices, 26)
  const rsi = calculateRSI(closePrices, 14)
  const macd = calculateMACD(closePrices, 12, 26, 9)
  const bollinger = calculateBollingerBands(closePrices, 20, 2)
  
  // Combine all indicators by index
  for (let i = 0; i < priceData.length; i++) {
    const indicators: TechnicalIndicators = {}
    
    // SMA indicators (start from period-1 index)
    if (i >= 19) indicators.sma20 = sma20[i - 19]
    if (i >= 49) indicators.sma50 = sma50[i - 49]
    if (i >= 199) indicators.sma200 = sma200[i - 199]
    
    // EMA indicators
    if (i >= 11) indicators.ema12 = ema12[i - 11]
    if (i >= 25) indicators.ema26 = ema26[i - 25]
    
    // RSI (starts from period index)
    if (i >= 14) indicators.rsi = rsi[i - 14]
    
    // MACD indicators
    const macdStartIndex = 25 + 8 // slowPeriod-1 + signalPeriod-1
    if (i >= macdStartIndex) {
      const macdIndex = i - macdStartIndex
      if (macdIndex < macd.histogram.length) {
        indicators.macd = macd.macd[macdIndex + 8] // Adjust for signal period offset
        indicators.macdSignal = macd.signal[macdIndex]
        indicators.macdHist = macd.histogram[macdIndex]
      }
    }
    
    // Bollinger Bands
    if (i >= 19) {
      const bollIndex = i - 19
      if (bollIndex < bollinger.upper.length) {
        indicators.bollUpper = bollinger.upper[bollIndex]
        indicators.bollMiddle = bollinger.middle[bollIndex]
        indicators.bollLower = bollinger.lower[bollIndex]
      }
    }
    
    results.push(indicators)
  }
  
  return results
}

/**
 * Calculate correlation between two price series
 */
export function calculateCorrelation(prices1: number[], prices2: number[]): number {
  if (prices1.length !== prices2.length) {
    throw new Error('Price arrays must have the same length')
  }
  
  const n = prices1.length
  const mean1 = prices1.reduce((a, b) => a + b, 0) / n
  const mean2 = prices2.reduce((a, b) => a + b, 0) / n
  
  let numerator = 0
  let sum1 = 0
  let sum2 = 0
  
  for (let i = 0; i < n; i++) {
    const diff1 = prices1[i] - mean1
    const diff2 = prices2[i] - mean2
    numerator += diff1 * diff2
    sum1 += diff1 * diff1
    sum2 += diff2 * diff2
  }
  
  const denominator = Math.sqrt(sum1 * sum2)
  return denominator === 0 ? 0 : numerator / denominator
}

/**
 * Calculate volatility (standard deviation of returns)
 */
export function calculateVolatility(prices: number[], annualize: boolean = true): number {
  if (prices.length < 2) return 0
  
  // Calculate daily returns
  const returns: number[] = []
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1])
  }
  
  // Calculate standard deviation of returns
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length
  const squaredDiffs = returns.map(r => Math.pow(r - mean, 2))
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / returns.length
  const stdDev = Math.sqrt(variance)
  
  // Annualize if requested (assuming 252 trading days per year)
  return annualize ? stdDev * Math.sqrt(252) : stdDev
}