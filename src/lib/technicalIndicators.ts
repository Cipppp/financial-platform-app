// src/lib/technicalIndicators.ts
// Minimal technical indicators library - keeping only functions used by other APIs

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