export const TABLES = {
  USERS: 'app-financial-platform-users',
  PORTFOLIOS: 'app-financial-platform-portfolios',
  HOLDINGS: `${process.env.DYNAMODB_TABLE_PREFIX || 'financial-platform'}-holdings`,
  TRADES: `${process.env.DYNAMODB_TABLE_PREFIX || 'financial-platform'}-trades`,
  MARKET_DATA: `${process.env.DYNAMODB_TABLE_PREFIX || 'financial-platform'}-market-data`,
  TECHNICAL_INDICATORS: `${process.env.DYNAMODB_TABLE_PREFIX || 'financial-platform'}-technical-indicators`,
  PREDICTIONS: `${process.env.DYNAMODB_TABLE_PREFIX || 'financial-platform'}-predictions`,
  SENTIMENT_DATA: `${process.env.DYNAMODB_TABLE_PREFIX || 'financial-platform'}-sentiment-data`,
  CORRELATIONS: `${process.env.DYNAMODB_TABLE_PREFIX || 'financial-platform'}-correlations`,
  ECONOMIC_INDICATORS: `${process.env.DYNAMODB_TABLE_PREFIX || 'financial-platform'}-economic-indicators`,
  BACKTEST_RESULTS: `${process.env.DYNAMODB_TABLE_PREFIX || 'financial-platform'}-backtest-results`
} as const

export const REGION = process.env.AWS_REGION || 'eu-west-1'

export const DYNAMODB_CONFIG = {
  region: REGION,
  ...(process.env.NODE_ENV === 'development' && 
      process.env.DYNAMODB_LOCAL_ENDPOINT && {
    endpoint: process.env.DYNAMODB_LOCAL_ENDPOINT
  })
}
