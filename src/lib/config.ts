/**
 * Production Configuration
 * Centralized configuration management using environment variables
 */

export const config = {
  // AWS Configuration
  aws: {
    region: process.env.AWS_REGION!,
  },

  // AWS Bedrock Configuration
  bedrock: {
    agentId: process.env.BEDROCK_AGENT_ID!,
    agentAliasId: process.env.BEDROCK_AGENT_ALIAS_ID!,
    knowledgeBaseId: process.env.BEDROCK_KNOWLEDGE_BASE_ID!,
    model: process.env.BEDROCK_MODEL || 'anthropic.claude-3-haiku-20240307-v1:0',
  },

  // API Configuration
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL!,
    tiingo: {
      baseUrl: process.env.TIINGO_BASE_URL!,
      apiKey: process.env.TIINGO_API_KEY!,
    },
  },

  // Application Settings
  app: {
    initialPortfolioBalance: Number(process.env.INITIAL_PORTFOLIO_BALANCE!),
    cacheTimeoutMinutes: Number(process.env.CACHE_TIMEOUT_MINUTES!),
    environment: process.env.NODE_ENV!,
  },

  // NextAuth Configuration
  auth: {
    url: process.env.NEXTAUTH_URL!,
    secret: process.env.NEXTAUTH_SECRET!,
  },

  // DynamoDB Table Names (from your AWS account)
  tables: {
    users: process.env.DYNAMODB_USERS_TABLE!,
    portfolios: process.env.DYNAMODB_PORTFOLIOS_TABLE!,
    holdings: process.env.DYNAMODB_HOLDINGS_TABLE!,
    trades: process.env.DYNAMODB_TRADES_TABLE!,
    marketData: process.env.DYNAMODB_MARKET_DATA_TABLE!,
    predictions: process.env.DYNAMODB_PREDICTIONS_TABLE!,
    sentimentData: process.env.DYNAMODB_SENTIMENT_DATA_TABLE!,
    correlations: process.env.DYNAMODB_CORRELATIONS_TABLE!,
    economicIndicators: process.env.DYNAMODB_ECONOMIC_INDICATORS_TABLE!,
    backtestResults: process.env.DYNAMODB_BACKTEST_RESULTS_TABLE!,
    cache: process.env.DYNAMODB_CACHE_TABLE!,
  },
} as const

// Helper function to validate required environment variables
export function validateConfig() {
  const requiredEnvVars = [
    'AWS_REGION',
    'BEDROCK_AGENT_ID',
    'BEDROCK_AGENT_ALIAS_ID', 
    'BEDROCK_KNOWLEDGE_BASE_ID',
    'NEXT_PUBLIC_API_URL',
    'TIINGO_BASE_URL',
    'TIINGO_API_KEY',
    'INITIAL_PORTFOLIO_BALANCE',
    'CACHE_TIMEOUT_MINUTES',
    'NODE_ENV',
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET',
    'DYNAMODB_USERS_TABLE',
    'DYNAMODB_PORTFOLIOS_TABLE',
    'DYNAMODB_HOLDINGS_TABLE',
    'DYNAMODB_TRADES_TABLE',
    'DYNAMODB_MARKET_DATA_TABLE',
    'DYNAMODB_TECHNICAL_INDICATORS_TABLE',
    'DYNAMODB_PREDICTIONS_TABLE',
    'DYNAMODB_SENTIMENT_DATA_TABLE',
    'DYNAMODB_CORRELATIONS_TABLE',
    'DYNAMODB_ECONOMIC_INDICATORS_TABLE',
    'DYNAMODB_BACKTEST_RESULTS_TABLE',
    'DYNAMODB_CACHE_TABLE',
  ]

  const missing = requiredEnvVars.filter(varName => !process.env[varName])
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
}