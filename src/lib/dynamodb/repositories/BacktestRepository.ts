import { PutCommand, GetCommand, UpdateCommand, QueryCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb'
import { docClient } from '../client'
import { TABLES } from '../config'

export interface BacktestResult {
  id: string
  userId: string
  strategy: string
  symbol: string
  startDate: string
  endDate: string
  totalReturn: number
  annualizedReturn: number
  sharpeRatio: number
  maxDrawdown: number
  winRate: number
  totalTrades: number
  parameters: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface CreateBacktestInput {
  userId: string
  strategy: string
  symbol: string
  startDate: string
  endDate: string
  totalReturn: number
  annualizedReturn: number
  sharpeRatio: number
  maxDrawdown: number
  winRate: number
  totalTrades: number
  parameters: Record<string, any>
}

export class BacktestRepository {
  /**
   * Create a new backtest result
   */
  async create(backtestData: CreateBacktestInput): Promise<BacktestResult> {
    const now = new Date().toISOString()
    
    const backtest: BacktestResult = {
      id: crypto.randomUUID(),
      userId: backtestData.userId,
      strategy: backtestData.strategy,
      symbol: backtestData.symbol.toUpperCase(),
      startDate: backtestData.startDate,
      endDate: backtestData.endDate,
      totalReturn: backtestData.totalReturn,
      annualizedReturn: backtestData.annualizedReturn,
      sharpeRatio: backtestData.sharpeRatio,
      maxDrawdown: backtestData.maxDrawdown,
      winRate: backtestData.winRate,
      totalTrades: backtestData.totalTrades,
      parameters: backtestData.parameters,
      createdAt: now,
      updatedAt: now
    }

    await docClient.send(new PutCommand({
      TableName: TABLES.BACKTEST_RESULTS,
      Item: backtest,
      ConditionExpression: 'attribute_not_exists(id)'
    }))

    return backtest
  }

  /**
   * Find backtest results by user ID
   */
  async findByUserId(userId: string, limit: number = 10): Promise<BacktestResult[]> {
    const result = await docClient.send(new QueryCommand({
      TableName: TABLES.BACKTEST_RESULTS,
      IndexName: 'UserIdCreatedAtIndex',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      },
      ScanIndexForward: false, // Sort by createdAt descending
      Limit: limit
    }))

    return result.Items as BacktestResult[] || []
  }

  /**
   * Find backtest results by symbol
   */
  async findBySymbol(symbol: string, limit: number = 10): Promise<BacktestResult[]> {
    const result = await docClient.send(new QueryCommand({
      TableName: TABLES.BACKTEST_RESULTS,
      IndexName: 'SymbolCreatedAtIndex',
      KeyConditionExpression: 'symbol = :symbol',
      ExpressionAttributeValues: {
        ':symbol': symbol.toUpperCase()
      },
      ScanIndexForward: false, // Sort by createdAt descending
      Limit: limit
    }))

    return result.Items as BacktestResult[] || []
  }

  /**
   * Find backtest results by strategy
   */
  async findByStrategy(strategy: string, limit: number = 10): Promise<BacktestResult[]> {
    const result = await docClient.send(new QueryCommand({
      TableName: TABLES.BACKTEST_RESULTS,
      IndexName: 'StrategyCreatedAtIndex',
      KeyConditionExpression: 'strategy = :strategy',
      ExpressionAttributeValues: {
        ':strategy': strategy
      },
      ScanIndexForward: false, // Sort by createdAt descending
      Limit: limit
    }))

    return result.Items as BacktestResult[] || []
  }

  /**
   * Find backtest result by ID
   */
  async findById(id: string): Promise<BacktestResult | null> {
    const result = await docClient.send(new GetCommand({
      TableName: TABLES.BACKTEST_RESULTS,
      Key: { id }
    }))

    return result.Item as BacktestResult || null
  }

  /**
   * Find user's backtest results by symbol and strategy
   */
  async findByUserSymbolStrategy(userId: string, symbol?: string, strategy?: string, limit: number = 10): Promise<BacktestResult[]> {
    let keyConditionExpression = 'userId = :userId'
    const expressionAttributeValues: Record<string, any> = {
      ':userId': userId
    }

    let filterExpression = ''
    const filterValues: Record<string, any> = {}

    if (symbol) {
      filterExpression += (filterExpression ? ' AND ' : '') + 'symbol = :symbol'
      filterValues[':symbol'] = symbol.toUpperCase()
    }

    if (strategy) {
      filterExpression += (filterExpression ? ' AND ' : '') + 'strategy = :strategy'
      filterValues[':strategy'] = strategy
    }

    const queryParams: any = {
      TableName: TABLES.BACKTEST_RESULTS,
      IndexName: 'UserIdCreatedAtIndex',
      KeyConditionExpression: keyConditionExpression,
      ExpressionAttributeValues: { ...expressionAttributeValues, ...filterValues },
      ScanIndexForward: false,
      Limit: limit
    }

    if (filterExpression) {
      queryParams.FilterExpression = filterExpression
    }

    const result = await docClient.send(new QueryCommand(queryParams))

    return result.Items as BacktestResult[] || []
  }

  /**
   * Update backtest result
   */
  async update(id: string, updates: Partial<Omit<BacktestResult, 'id' | 'userId' | 'createdAt'>>): Promise<BacktestResult | null> {
    const now = new Date().toISOString()
    
    const updateExpression: string[] = ['SET updatedAt = :updatedAt']
    const expressionAttributeValues: Record<string, any> = {
      ':updatedAt': now
    }

    // Add fields to update
    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'updatedAt' && value !== undefined) {
        updateExpression.push(`${key} = :${key}`)
        expressionAttributeValues[`:${key}`] = value
      }
    })

    await docClient.send(new UpdateCommand({
      TableName: TABLES.BACKTEST_RESULTS,
      Key: { id },
      UpdateExpression: updateExpression.join(', '),
      ExpressionAttributeValues: expressionAttributeValues,
      ConditionExpression: 'attribute_exists(id)'
    }))

    return this.findById(id)
  }

  /**
   * Delete backtest result
   */
  async delete(id: string): Promise<void> {
    await docClient.send(new DeleteCommand({
      TableName: TABLES.BACKTEST_RESULTS,
      Key: { id }
    }))
  }
}