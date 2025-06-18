// src/lib/predictionModels.ts

export interface PredictionInput {
  prices: number[]
  timestamps: Date[]
  volume?: number[]
  technicalIndicators?: any[]
}

export interface PredictionResult {
  predictedPrice: number
  confidence: number
  model: string
  parameters: Record<string, any>
  reasoning?: string
}

/**
 * Simple Linear Regression Model
 */
export class LinearRegressionModel {
  private slope: number = 0
  private intercept: number = 0
  private r2: number = 0

  train(data: PredictionInput): void {
    const { prices } = data
    const n = prices.length
    const x = Array.from({ length: n }, (_, i) => i) // Time index
    const y = prices

    // Calculate means
    const xMean = x.reduce((a, b) => a + b, 0) / n
    const yMean = y.reduce((a, b) => a + b, 0) / n

    // Calculate slope and intercept
    let numerator = 0
    let denominator = 0

    for (let i = 0; i < n; i++) {
      numerator += (x[i] - xMean) * (y[i] - yMean)
      denominator += (x[i] - xMean) * (x[i] - xMean)
    }

    this.slope = denominator === 0 ? 0 : numerator / denominator
    this.intercept = yMean - this.slope * xMean

    // Calculate R-squared
    let ssRes = 0
    let ssTot = 0
    for (let i = 0; i < n; i++) {
      const predicted = this.slope * x[i] + this.intercept
      ssRes += (y[i] - predicted) * (y[i] - predicted)
      ssTot += (y[i] - yMean) * (y[i] - yMean)
    }
    this.r2 = ssTot === 0 ? 0 : 1 - (ssRes / ssTot)
  }

  predict(daysAhead: number): PredictionResult {
    const predictedPrice = this.slope * daysAhead + this.intercept
    const confidence = Math.max(0, Math.min(1, this.r2)) // R-squared as confidence

    return {
      predictedPrice,
      confidence,
      model: 'Linear Regression',
      parameters: {
        slope: this.slope,
        intercept: this.intercept,
        r2: this.r2
      },
      reasoning: `Linear trend analysis with R² = ${this.r2.toFixed(3)}`
    }
  }
}

/**
 * Moving Average Based Prediction
 */
export class MovingAverageModel {
  private shortMA: number = 0
  private longMA: number = 0
  private trend: number = 0

  train(data: PredictionInput): void {
    const { prices } = data
    const shortPeriod = Math.min(10, Math.floor(prices.length / 4))
    const longPeriod = Math.min(30, Math.floor(prices.length / 2))

    // Calculate short and long moving averages
    this.shortMA = prices.slice(-shortPeriod).reduce((a, b) => a + b, 0) / shortPeriod
    this.longMA = prices.slice(-longPeriod).reduce((a, b) => a + b, 0) / longPeriod

    // Calculate trend from recent price changes
    const recentPrices = prices.slice(-5)
    this.trend = (recentPrices[recentPrices.length - 1] - recentPrices[0]) / recentPrices.length
  }

  predict(daysAhead: number): PredictionResult {
    const currentPrice = this.shortMA
    const predictedPrice = currentPrice + (this.trend * daysAhead)
    
    // Confidence based on MA convergence
    const convergence = Math.abs(this.shortMA - this.longMA) / this.longMA
    const confidence = Math.max(0.1, Math.min(0.9, 1 - convergence))

    return {
      predictedPrice,
      confidence,
      model: 'Moving Average',
      parameters: {
        shortMA: this.shortMA,
        longMA: this.longMA,
        trend: this.trend
      },
      reasoning: `Based on ${this.shortMA > this.longMA ? 'bullish' : 'bearish'} MA crossover`
    }
  }
}

/**
 * Technical Analysis Based Prediction
 */
export class TechnicalAnalysisModel {
  private rsi: number = 50
  private macdSignal: 'bullish' | 'bearish' | 'neutral' = 'neutral'
  private bollingerPosition: number = 0.5
  private trend: 'uptrend' | 'downtrend' | 'sideways' = 'sideways'

  train(data: PredictionInput): void {
    const { prices, technicalIndicators } = data
    
    if (!technicalIndicators || technicalIndicators.length === 0) {
      // Calculate basic indicators if not provided
      this.calculateBasicIndicators(prices)
      return
    }

    const latest = technicalIndicators[technicalIndicators.length - 1]
    
    // RSI analysis
    this.rsi = latest.rsi || 50

    // MACD analysis
    if (latest.macd && latest.macdSignal) {
      this.macdSignal = latest.macd > latest.macdSignal ? 'bullish' : 'bearish'
    }

    // Bollinger Bands position
    if (latest.bollUpper && latest.bollLower && latest.bollMiddle) {
      const currentPrice = prices[prices.length - 1]
      const range = latest.bollUpper - latest.bollLower
      this.bollingerPosition = (currentPrice - latest.bollLower) / range
    }

    // Trend analysis using moving averages
    if (latest.sma20 && latest.sma50) {
      if (latest.sma20 > latest.sma50) {
        this.trend = 'uptrend'
      } else if (latest.sma20 < latest.sma50) {
        this.trend = 'downtrend'
      } else {
        this.trend = 'sideways'
      }
    }
  }

  private calculateBasicIndicators(prices: number[]): void {
    // Simple RSI approximation
    const changes = []
    for (let i = 1; i < Math.min(15, prices.length); i++) {
      changes.push(prices[i] - prices[i - 1])
    }
    const gains = changes.filter(c => c > 0)
    const losses = changes.filter(c => c < 0).map(c => Math.abs(c))
    
    if (gains.length > 0 && losses.length > 0) {
      const avgGain = gains.reduce((a, b) => a + b, 0) / gains.length
      const avgLoss = losses.reduce((a, b) => a + b, 0) / losses.length
      const rs = avgGain / avgLoss
      this.rsi = 100 - (100 / (1 + rs))
    }
  }

  predict(daysAhead: number): PredictionResult {
    const currentPrice = 100 // This should be the actual current price
    let priceMultiplier = 1

    // RSI influence
    if (this.rsi > 70) {
      priceMultiplier *= 0.98 // Overbought, expect decline
    } else if (this.rsi < 30) {
      priceMultiplier *= 1.02 // Oversold, expect rise
    }

    // MACD influence
    if (this.macdSignal === 'bullish') {
      priceMultiplier *= 1.01
    } else if (this.macdSignal === 'bearish') {
      priceMultiplier *= 0.99
    }

    // Bollinger Bands influence
    if (this.bollingerPosition > 0.8) {
      priceMultiplier *= 0.99 // Near upper band
    } else if (this.bollingerPosition < 0.2) {
      priceMultiplier *= 1.01 // Near lower band
    }

    // Trend influence
    const trendMultiplier = daysAhead * 0.001
    if (this.trend === 'uptrend') {
      priceMultiplier *= (1 + trendMultiplier)
    } else if (this.trend === 'downtrend') {
      priceMultiplier *= (1 - trendMultiplier)
    }

    const predictedPrice = currentPrice * Math.pow(priceMultiplier, daysAhead)
    
    // Calculate confidence based on signal strength
    let confidence = 0.5
    if (this.rsi < 30 || this.rsi > 70) confidence += 0.1
    if (this.macdSignal !== 'neutral') confidence += 0.1
    if (this.bollingerPosition < 0.2 || this.bollingerPosition > 0.8) confidence += 0.1
    if (this.trend !== 'sideways') confidence += 0.1

    return {
      predictedPrice,
      confidence: Math.min(0.9, confidence),
      model: 'Technical Analysis',
      parameters: {
        rsi: this.rsi,
        macdSignal: this.macdSignal,
        bollingerPosition: this.bollingerPosition,
        trend: this.trend
      },
      reasoning: `${this.trend} trend with RSI at ${this.rsi.toFixed(1)}, MACD ${this.macdSignal}`
    }
  }
}

/**
 * Sentiment-Based Prediction Model
 */
export class SentimentModel {
  private sentimentScore: number = 0
  private volatility: number = 0

  train(data: PredictionInput & { sentiment?: number }): void {
    this.sentimentScore = data.sentiment || 0
    
    // Calculate volatility from prices
    const { prices } = data
    if (prices.length > 1) {
      const returns = []
      for (let i = 1; i < prices.length; i++) {
        returns.push((prices[i] - prices[i - 1]) / prices[i - 1])
      }
      const mean = returns.reduce((a, b) => a + b, 0) / returns.length
      const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length
      this.volatility = Math.sqrt(variance)
    }
  }

  predict(daysAhead: number): PredictionResult {
    const currentPrice = 100 // Should be actual current price
    
    // Sentiment influence on price direction
    const sentimentImpact = this.sentimentScore * 0.05 // 5% max impact per day
    const volatilityImpact = this.volatility * Math.sqrt(daysAhead)
    
    const predictedChange = sentimentImpact * daysAhead
    const predictedPrice = currentPrice * (1 + predictedChange)
    
    // Confidence inversely related to volatility
    const confidence = Math.max(0.1, Math.min(0.8, 0.6 - volatilityImpact))

    return {
      predictedPrice,
      confidence,
      model: 'Sentiment Analysis',
      parameters: {
        sentimentScore: this.sentimentScore,
        volatility: this.volatility,
        sentimentImpact
      },
      reasoning: `${this.sentimentScore > 0 ? 'Positive' : 'Negative'} sentiment (${this.sentimentScore.toFixed(2)})`
    }
  }
}

/**
 * Ensemble Model combining multiple prediction methods
 */
export class EnsembleModel {
  private models: Array<{
    model: any
    weight: number
    name: string
  }> = []

  constructor() {
    this.models = [
      { model: new LinearRegressionModel(), weight: 0.3, name: 'Linear Regression' },
      { model: new MovingAverageModel(), weight: 0.25, name: 'Moving Average' },
      { model: new TechnicalAnalysisModel(), weight: 0.35, name: 'Technical Analysis' },
      { model: new SentimentModel(), weight: 0.1, name: 'Sentiment' }
    ]
  }

  train(data: PredictionInput & { sentiment?: number }): void {
    this.models.forEach(({ model }) => {
      model.train(data)
    })
  }

  predict(daysAhead: number): PredictionResult {
    const predictions = this.models.map(({ model, weight, name }) => ({
      ...model.predict(daysAhead),
      weight,
      name
    }))

    // Weighted average of predictions
    const weightedPrice = predictions.reduce((sum, pred) => 
      sum + (pred.predictedPrice * pred.weight), 0)
    
    const weightedConfidence = predictions.reduce((sum, pred) => 
      sum + (pred.confidence * pred.weight), 0)

    // Combine reasoning
    const reasoning = predictions
      .filter(p => p.weight > 0.1)
      .map(p => `${p.name}: ${p.reasoning}`)
      .join('; ')

    return {
      predictedPrice: weightedPrice,
      confidence: weightedConfidence,
      model: 'Ensemble',
      parameters: {
        individualPredictions: predictions.map(p => ({
          model: p.name,
          price: p.predictedPrice,
          confidence: p.confidence,
          weight: p.weight
        }))
      },
      reasoning
    }
  }
}

/**
 * Main prediction function
 */
export function generatePrediction(
  data: PredictionInput & { sentiment?: number },
  modelType: 'linear' | 'ma' | 'technical' | 'sentiment' | 'ensemble' = 'ensemble',
  daysAhead: number = 30
): PredictionResult {
  let model: any

  switch (modelType) {
    case 'linear':
      model = new LinearRegressionModel()
      break
    case 'ma':
      model = new MovingAverageModel()
      break
    case 'technical':
      model = new TechnicalAnalysisModel()
      break
    case 'sentiment':
      model = new SentimentModel()
      break
    case 'ensemble':
    default:
      model = new EnsembleModel()
      break
  }

  model.train(data)
  return model.predict(daysAhead)
}