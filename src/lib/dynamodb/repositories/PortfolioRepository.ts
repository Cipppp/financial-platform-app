import { PutCommand, GetCommand, UpdateCommand, QueryCommand, DeleteCommand, ScanCommand } from '@aws-sdk/lib-dynamodb'
import { docClient } from '../client'
import { TABLES } from '../config'

export interface Portfolio {
  id: string
  userId: string
  initialBalance: number
  currentBalance: number
  totalValue: number
  createdAt: string
  updatedAt: string
}

export interface Holding {
  id: string
  portfolioId: string
  symbol: string
  shares: number
  avgPrice: number
  currentPrice: number
  createdAt: string
  updatedAt: string
}

export interface Trade {
  id: string
  userId: string
  portfolioId: string
  symbol: string
  type: 'BUY' | 'SELL'
  shares: number
  price: number
  total: number
  createdAt: string
}

export class PortfolioRepository {
  /**
   * Create a new portfolio for a user
   */
  async create(userId: string, initialBalance: number = 10000): Promise<Portfolio> {
    const now = new Date().toISOString()
    
    const portfolio: Portfolio = {
      id: crypto.randomUUID(),
      userId,
      initialBalance,
      currentBalance: initialBalance,
      totalValue: initialBalance,
      createdAt: now,
      updatedAt: now
    }

    await docClient.send(new PutCommand({
      TableName: TABLES.PORTFOLIOS,
      Item: portfolio,
      ConditionExpression: 'attribute_not_exists(id)'
    }))

    return portfolio
  }

  /**
   * Find portfolio by user ID
   */
  async findByUserId(userId: string): Promise<Portfolio | null> {
    const result = await docClient.send(new QueryCommand({
      TableName: TABLES.PORTFOLIOS,
      IndexName: 'userId-index',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    }))

    return result.Items?.[0] as Portfolio || null
  }

  /**
   * Find portfolio by ID
   */
  async findById(portfolioId: string): Promise<Portfolio | null> {
    const result = await docClient.send(new GetCommand({
      TableName: TABLES.PORTFOLIOS,
      Key: { id: portfolioId }
    }))

    return result.Item as Portfolio || null
  }

  /**
   * Update portfolio balance
   */
  async updateBalance(portfolioId: string, currentBalance: number): Promise<void> {
    await docClient.send(new UpdateCommand({
      TableName: TABLES.PORTFOLIOS,
      Key: { id: portfolioId },
      UpdateExpression: 'SET currentBalance = :currentBalance, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':currentBalance': currentBalance,
        ':updatedAt': new Date().toISOString()
      },
      ConditionExpression: 'attribute_exists(id)'
    }))
  }

  /**
   * Update portfolio total value
   */
  async updateTotalValue(portfolioId: string, totalValue: number): Promise<void> {
    await docClient.send(new UpdateCommand({
      TableName: TABLES.PORTFOLIOS,
      Key: { id: portfolioId },
      UpdateExpression: 'SET totalValue = :totalValue, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':totalValue': totalValue,
        ':updatedAt': new Date().toISOString()
      },
      ConditionExpression: 'attribute_exists(id)'
    }))
  }

  /**
   * Get all holdings for a portfolio
   */
  async getHoldings(portfolioId: string): Promise<Holding[]> {
    const result = await docClient.send(new QueryCommand({
      TableName: TABLES.HOLDINGS,
      IndexName: 'portfolioId-index',
      KeyConditionExpression: 'portfolioId = :portfolioId',
      ExpressionAttributeValues: {
        ':portfolioId': portfolioId
      }
    }))

    return result.Items as Holding[] || []
  }

  /**
   * Get a specific holding
   */
  async getHolding(portfolioId: string, symbol: string): Promise<Holding | null> {
    const result = await docClient.send(new QueryCommand({
      TableName: TABLES.HOLDINGS,
      IndexName: 'portfolioId-index',
      KeyConditionExpression: 'portfolioId = :portfolioId',
      FilterExpression: 'symbol = :symbol',
      ExpressionAttributeValues: {
        ':portfolioId': portfolioId,
        ':symbol': symbol.toUpperCase()
      }
    }))

    return result.Items?.[0] as Holding || null
  }

  /**
   * Add or update a holding
   */
  async upsertHolding(holding: Omit<Holding, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    const now = new Date().toISOString()
    const existingHolding = await this.getHolding(holding.portfolioId, holding.symbol)

    if (existingHolding) {
      // Update existing holding
      await docClient.send(new UpdateCommand({
        TableName: TABLES.HOLDINGS,
        Key: { id: existingHolding.id },
        UpdateExpression: 'SET shares = :shares, avgPrice = :avgPrice, currentPrice = :currentPrice, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':shares': holding.shares,
          ':avgPrice': holding.avgPrice,
          ':currentPrice': holding.currentPrice,
          ':updatedAt': now
        }
      }))
    } else {
      // Create new holding
      await docClient.send(new PutCommand({
        TableName: TABLES.HOLDINGS,
        Item: {
          id: crypto.randomUUID(),
          ...holding,
          symbol: holding.symbol.toUpperCase(),
          createdAt: now,
          updatedAt: now
        }
      }))
    }
  }

  /**
   * Update holding price
   */
  async updateHoldingPrice(portfolioId: string, symbol: string, currentPrice: number): Promise<void> {
    const holding = await this.getHolding(portfolioId, symbol)
    if (holding) {
      await docClient.send(new UpdateCommand({
        TableName: TABLES.HOLDINGS,
        Key: { id: holding.id },
        UpdateExpression: 'SET currentPrice = :currentPrice, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':currentPrice': currentPrice,
          ':updatedAt': new Date().toISOString()
        }
      }))
    }
  }

  /**
   * Remove a holding (when shares reach 0)
   */
  async removeHolding(portfolioId: string, symbol: string): Promise<void> {
    const holding = await this.getHolding(portfolioId, symbol)
    if (holding) {
      await docClient.send(new DeleteCommand({
        TableName: TABLES.HOLDINGS,
        Key: { id: holding.id }
      }))
    }
  }

  /**
   * Record a trade
   */
  async recordTrade(trade: Omit<Trade, 'id' | 'createdAt'>): Promise<Trade> {
    const now = new Date().toISOString()
    const tradeRecord: Trade = {
      ...trade,
      id: crypto.randomUUID(),
      symbol: trade.symbol.toUpperCase(),
      createdAt: now
    }

    await docClient.send(new PutCommand({
      TableName: TABLES.TRADES,
      Item: tradeRecord
    }))

    return tradeRecord
  }

  /**
   * Get user's trade history
   */
  async getTradeHistory(userId: string, limit: number = 50): Promise<Trade[]> {
    const result = await docClient.send(new QueryCommand({
      TableName: TABLES.TRADES,
      IndexName: 'userId-createdAt-index',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      },
      ScanIndexForward: false, // Sort by createdAt descending
      Limit: limit
    }))

    return result.Items as Trade[] || []
  }

  /**
   * Execute a buy trade
   */
  async executeBuyTrade(portfolioId: string, userId: string, symbol: string, shares: number, price: number): Promise<Trade> {
    const total = shares * price
    const portfolio = await this.findById(portfolioId)
    
    if (!portfolio) {
      throw new Error('Portfolio not found')
    }

    if (portfolio.currentBalance < total) {
      throw new Error('Insufficient funds')
    }

    // Update portfolio balance
    await this.updateBalance(portfolioId, portfolio.currentBalance - total)

    // Get existing holding
    const existingHolding = await this.getHolding(portfolioId, symbol)
    
    if (existingHolding) {
      // Calculate new average price
      const totalShares = existingHolding.shares + shares
      const totalCost = (existingHolding.shares * existingHolding.avgPrice) + total
      const newAvgPrice = totalCost / totalShares

      await this.upsertHolding({
        portfolioId,
        symbol: symbol.toUpperCase(),
        shares: totalShares,
        avgPrice: newAvgPrice,
        currentPrice: price
      })
    } else {
      // Create new holding
      await this.upsertHolding({
        portfolioId,
        symbol: symbol.toUpperCase(),
        shares,
        avgPrice: price,
        currentPrice: price
      })
    }

    // Record the trade
    return this.recordTrade({
      userId,
      portfolioId,
      symbol: symbol.toUpperCase(),
      type: 'BUY',
      shares,
      price,
      total
    })
  }

  /**
   * Execute a sell trade
   */
  async executeSellTrade(portfolioId: string, userId: string, symbol: string, shares: number, price: number): Promise<Trade> {
    const total = shares * price
    const portfolio = await this.findById(portfolioId)
    
    if (!portfolio) {
      throw new Error('Portfolio not found')
    }

    const holding = await this.getHolding(portfolioId, symbol)
    
    if (!holding || holding.shares < shares) {
      throw new Error('Insufficient shares')
    }

    // Update portfolio balance
    await this.updateBalance(portfolioId, portfolio.currentBalance + total)

    // Update or remove holding
    const remainingShares = holding.shares - shares
    
    if (remainingShares === 0) {
      await this.removeHolding(portfolioId, symbol)
    } else {
      await this.upsertHolding({
        portfolioId,
        symbol: symbol.toUpperCase(),
        shares: remainingShares,
        avgPrice: holding.avgPrice, // Keep the same average price
        currentPrice: price
      })
    }

    // Record the trade
    return this.recordTrade({
      userId,
      portfolioId,
      symbol: symbol.toUpperCase(),
      type: 'SELL',
      shares,
      price,
      total
    })
  }

  /**
   * Reset user portfolio - delete all holdings, trades, and reset balance to $10,000
   */
  async resetUserPortfolio(userId: string): Promise<void> {
    // Find user's portfolio
    const portfolio = await this.findByUserId(userId)
    
    if (!portfolio) {
      throw new Error('Portfolio not found')
    }

    // Delete all holdings for this portfolio
    const holdings = await this.getHoldings(portfolio.id)
    for (const holding of holdings) {
      await this.removeHolding(portfolio.id, holding.symbol)
    }

    // Delete all trades for this user using scan (since we're deleting all)
    const trades = await this.getTradeHistory(userId, 1000) // Get a large number
    for (const trade of trades) {
      await docClient.send(new DeleteCommand({
        TableName: TABLES.TRADES,
        Key: { id: trade.id }
      }))
    }

    // Reset portfolio balance to $10,000
    await this.updateBalance(portfolio.id, 10000)
    await this.updateTotalValue(portfolio.id, 10000)
  }
}
