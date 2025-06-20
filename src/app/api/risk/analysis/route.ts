// src/app/api/risk/analysis/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { calculateVolatility } from '@/lib/technicalIndicators'
import { UserRepository } from '@/lib/dynamodb/repositories/UserRepository'
import { PortfolioRepository } from '@/lib/dynamodb/repositories/PortfolioRepository'

const userRepo = new UserRepository()
const portfolioRepo = new PortfolioRepository()

interface RiskMetrics {
  portfolioValue: number
  var95: number // Value at Risk at 95% confidence
  var99: number // Value at Risk at 99% confidence
  expectedShortfall: number // Conditional Value at Risk
  sharpeRatio: number
  beta: number
  maxDrawdown: number
  volatility: number
  diversificationRatio: number
  concentrationRisk: number
}

async function fetchHistoricalData(symbol: string, days: number = 252) {
  const tiingoToken = process.env.TIINGO_API_KEY
  const isDummyMode = process.env.NEXT_PUBLIC_USE_DUMMY_DATA === 'true'
  
  if (isDummyMode || !tiingoToken) {
    return generateDummyReturns(symbol, days)
  }
  
  try {
    const endDate = new Date().toISOString().split('T')[0]
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    const response = await fetch(
      `https://api.tiingo.com/tiingo/daily/${symbol}/prices?token=${tiingoToken}&startDate=${startDate}&endDate=${endDate}`,
      { cache: 'no-store' }
    )
    
    if (!response.ok) {
      throw new Error(`Tiingo API error: ${response.status}`)
    }
    
    const data = await response.json()
    const prices = data.map((item: any) => item.close)
    
    // Calculate returns
    const returns = []
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1])
    }
    
    return returns
  } catch (error) {
    console.error(`Error fetching data for ${symbol}:`, error)
    return generateDummyReturns(symbol, days)
  }
}

function generateDummyReturns(symbol: string, days: number): number[] {
  const returns = []
  const volatility = getSymbolVolatility(symbol)
  
  for (let i = 0; i < days; i++) {
    // Generate normally distributed returns
    const u1 = Math.random()
    const u2 = Math.random()
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
    const dailyReturn = z * volatility / Math.sqrt(252) // Daily volatility
    returns.push(dailyReturn)
  }
  
  return returns
}

function getSymbolVolatility(symbol: string): number {
  const volatilities: Record<string, number> = {
    'AAPL': 0.25,
    'GOOGL': 0.28,
    'MSFT': 0.23,
    'TSLA': 0.50,
    'AMZN': 0.30,
    'META': 0.35,
    'NVDA': 0.40,
    'SPY': 0.16,
    'QQQ': 0.20
  }
  return volatilities[symbol] || 0.25
}

function calculateVaR(returns: number[], confidence: number): number {
  const sortedReturns = [...returns].sort((a, b) => a - b)
  const index = Math.floor((1 - confidence) * sortedReturns.length)
  return -sortedReturns[index] // Negative because VaR is typically reported as a positive loss
}

function calculateExpectedShortfall(returns: number[], confidence: number): number {
  const sortedReturns = [...returns].sort((a, b) => a - b)
  const cutoff = Math.floor((1 - confidence) * sortedReturns.length)
  const tailReturns = sortedReturns.slice(0, cutoff)
  const avgTailReturn = tailReturns.reduce((sum, ret) => sum + ret, 0) / tailReturns.length
  return -avgTailReturn
}

function calculateBeta(assetReturns: number[], marketReturns: number[]): number {
  const n = Math.min(assetReturns.length, marketReturns.length)
  
  // Calculate means
  const assetMean = assetReturns.slice(0, n).reduce((sum, ret) => sum + ret, 0) / n
  const marketMean = marketReturns.slice(0, n).reduce((sum, ret) => sum + ret, 0) / n
  
  // Calculate covariance and variance
  let covariance = 0
  let marketVariance = 0
  
  for (let i = 0; i < n; i++) {
    const assetDiff = assetReturns[i] - assetMean
    const marketDiff = marketReturns[i] - marketMean
    covariance += assetDiff * marketDiff
    marketVariance += marketDiff * marketDiff
  }
  
  covariance /= (n - 1)
  marketVariance /= (n - 1)
  
  return marketVariance === 0 ? 0 : covariance / marketVariance
}

function calculateSharpeRatio(returns: number[], riskFreeRate: number = 0.02): number {
  const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length
  const annualizedReturn = avgReturn * 252 // Annualize
  const volatility = calculateVolatility(returns.map((_, i) => 100 + returns[i] * 100), false) // Convert to price-like series
  
  return volatility === 0 ? 0 : (annualizedReturn - riskFreeRate) / volatility
}

function calculateMaxDrawdown(returns: number[]): number {
  let peak = 1
  let maxDrawdown = 0
  let currentValue = 1
  
  for (const ret of returns) {
    currentValue *= (1 + ret)
    
    if (currentValue > peak) {
      peak = currentValue
    }
    
    const drawdown = (peak - currentValue) / peak
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown
    }
  }
  
  return maxDrawdown
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get('symbol')
    
    // Get user's portfolio
    const user = await userRepo.findByEmail(session.user.email)
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    const portfolio = await portfolioRepo.findByUserId(user.id)
    
    if (!portfolio) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 })
    }
    
    if (symbol) {
      // Single asset risk analysis
      const returns = await fetchHistoricalData(symbol, 252)
      const marketReturns = await fetchHistoricalData('SPY', 252) // Use SPY as market proxy
      
      const riskMetrics = {
        symbol,
        var95: calculateVaR(returns, 0.95),
        var99: calculateVaR(returns, 0.99),
        expectedShortfall: calculateExpectedShortfall(returns, 0.95),
        volatility: Math.sqrt(returns.reduce((sum, ret) => sum + ret * ret, 0) / returns.length) * Math.sqrt(252),
        beta: calculateBeta(returns, marketReturns),
        sharpeRatio: calculateSharpeRatio(returns),
        maxDrawdown: calculateMaxDrawdown(returns)
      }
      
      return NextResponse.json(riskMetrics)
    } else {
      // Portfolio-level risk analysis
      const holdings = await portfolioRepo.getHoldings(portfolio.id)
      const portfolioValue = portfolio.totalValue
      
      if (holdings.length === 0) {
        return NextResponse.json({
          error: 'No holdings in portfolio for risk analysis'
        }, { status: 400 })
      }
      
      // Calculate portfolio-level metrics
      const portfolioReturns: number[] = []
      const marketReturns = await fetchHistoricalData('SPY', 252)
      
      // Fetch returns for all holdings
      const holdingReturns = await Promise.all(
        holdings.map(holding => fetchHistoricalData(holding.symbol, 252))
      )
      
      // Calculate portfolio returns (weighted average)
      const weights = holdings.map(holding => (holding.shares * holding.currentPrice) / portfolioValue)
      
      for (let i = 0; i < 252; i++) {
        let portfolioReturn = 0
        for (let j = 0; j < holdings.length; j++) {
          if (holdingReturns[j][i] !== undefined) {
            portfolioReturn += weights[j] * holdingReturns[j][i]
          }
        }
        portfolioReturns.push(portfolioReturn)
      }
      
      // Calculate concentration risk (Herfindahl Index)
      const concentrationRisk = weights.reduce((sum, weight) => sum + weight * weight, 0)
      
      // Calculate diversification ratio
      const individualVolatilities = holdingReturns.map(returns => 
        Math.sqrt(returns.reduce((sum, ret) => sum + ret * ret, 0) / returns.length) * Math.sqrt(252)
      )
      const weightedAvgVolatility = weights.reduce((sum, weight, i) => 
        sum + weight * individualVolatilities[i], 0
      )
      const portfolioVolatility = Math.sqrt(
        portfolioReturns.reduce((sum, ret) => sum + ret * ret, 0) / portfolioReturns.length
      ) * Math.sqrt(252)
      
      const diversificationRatio = weightedAvgVolatility / portfolioVolatility
      
      const riskMetrics: RiskMetrics = {
        portfolioValue,
        var95: calculateVaR(portfolioReturns, 0.95) * portfolioValue,
        var99: calculateVaR(portfolioReturns, 0.99) * portfolioValue,
        expectedShortfall: calculateExpectedShortfall(portfolioReturns, 0.95) * portfolioValue,
        sharpeRatio: calculateSharpeRatio(portfolioReturns),
        beta: calculateBeta(portfolioReturns, marketReturns),
        maxDrawdown: calculateMaxDrawdown(portfolioReturns),
        volatility: portfolioVolatility,
        diversificationRatio,
        concentrationRisk
      }
      
      // Risk level assessment
      let riskLevel = 'Low'
      if (riskMetrics.volatility > 0.25 || riskMetrics.concentrationRisk > 0.5) {
        riskLevel = 'High'
      } else if (riskMetrics.volatility > 0.15 || riskMetrics.concentrationRisk > 0.3) {
        riskLevel = 'Medium'
      }
      
      // Risk recommendations
      const recommendations = []
      if (riskMetrics.concentrationRisk > 0.4) {
        recommendations.push('Consider diversifying your portfolio to reduce concentration risk')
      }
      if (riskMetrics.volatility > 0.3) {
        recommendations.push('Your portfolio has high volatility; consider adding less volatile assets')
      }
      if (riskMetrics.diversificationRatio < 1.2) {
        recommendations.push('Your portfolio may benefit from better diversification across uncorrelated assets')
      }
      if (riskMetrics.sharpeRatio < 0.5) {
        recommendations.push('Consider optimizing your risk-adjusted returns')
      }
      
      return NextResponse.json({
        ...riskMetrics,
        riskLevel,
        recommendations,
        holdingsAnalysis: holdings.map((holding, i) => ({
          symbol: holding.symbol,
          weight: weights[i],
          volatility: individualVolatilities[i],
          contribution: weights[i] * holding.currentValue
        })),
        generatedAt: new Date().toISOString()
      })
    }
    
  } catch (error) {
    console.error('Error calculating risk metrics:', error)
    return NextResponse.json(
      { error: 'Failed to calculate risk metrics' },
      { status: 500 }
    )
  }
}