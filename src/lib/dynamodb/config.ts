import { config } from '../config'

export const TABLES = {
  USERS: config.tables.users,
  PORTFOLIOS: config.tables.portfolios,
  HOLDINGS: config.tables.holdings,
  TRADES: config.tables.trades,
  MARKET_DATA: config.tables.marketData,
  TECHNICAL_INDICATORS: config.tables.technicalIndicators,
  PREDICTIONS: config.tables.predictions,
  SENTIMENT_DATA: config.tables.sentimentData,
  CORRELATIONS: config.tables.correlations,
  ECONOMIC_INDICATORS: config.tables.economicIndicators,
  BACKTEST_RESULTS: config.tables.backtestResults
} as const

export const REGION = config.aws.region

export const DYNAMODB_CONFIG = {
  region: REGION,
}
