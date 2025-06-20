// Repository exports for easy importing
export { UserRepository } from './UserRepository'
export { PortfolioRepository } from './PortfolioRepository'
export { SentimentRepository } from './SentimentRepository'
export { PredictionRepository } from './PredictionRepository'
export { CorrelationRepository } from './CorrelationRepository'
export { BacktestRepository } from './BacktestRepository'

// Type exports
export type { User, CreateUserInput } from './UserRepository'
export type { Portfolio, Holding, Trade } from './PortfolioRepository'
export type { SentimentData, CreateSentimentInput } from './SentimentRepository'
export type { Prediction, CreatePredictionInput } from './PredictionRepository'
export type { CorrelationAnalysis, CreateCorrelationInput } from './CorrelationRepository'
export type { BacktestResult, CreateBacktestInput } from './BacktestRepository'