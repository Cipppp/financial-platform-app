import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, UpdateCommand, DeleteCommand, ScanCommand } from '@aws-sdk/lib-dynamodb'
import { v4 as uuidv4 } from 'uuid'

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'eu-west-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    sessionToken: process.env.AWS_SESSION_TOKEN,
  },
})

const docClient = DynamoDBDocumentClient.from(client)

// Table names based on your infrastructure
const getTableName = (table: string) => {
  const environment = process.env.NODE_ENV === 'production' ? 'prod' : 'app'
  return `${environment}-financial-platform-${table}`
}

export interface User {
  id: string
  email: string
  password: string
  name?: string
  createdAt: string
  updatedAt: string
}

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
  symbol: string
  type: 'BUY' | 'SELL'
  shares: number
  price: number
  total: number
  createdAt: string
}

export class DynamoDBService {
  
  // ================== USER OPERATIONS ==================
  
  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const now = new Date().toISOString()
    const user: User = {
      id: uuidv4(),
      ...userData,
      createdAt: now,
      updatedAt: now,
    }

    await docClient.send(new PutCommand({
      TableName: getTableName('users'),
      Item: user,
    }))

    return user
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const result = await docClient.send(new QueryCommand({
      TableName: getTableName('users'),
      IndexName: 'email-index',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email,
      },
    }))

    return result.Items?.[0] as User || null
  }

  async getUserById(id: string): Promise<User | null> {
    const result = await docClient.send(new GetCommand({
      TableName: getTableName('users'),
      Key: { id },
    }))

    return result.Item as User || null
  }

  // ================== PORTFOLIO OPERATIONS ==================
  
  async createPortfolio(portfolioData: Omit<Portfolio, 'id' | 'createdAt' | 'updatedAt'>): Promise<Portfolio> {
    const now = new Date().toISOString()
    const portfolio: Portfolio = {
      id: uuidv4(),
      ...portfolioData,
      createdAt: now,
      updatedAt: now,
    }

    await docClient.send(new PutCommand({
      TableName: getTableName('portfolios'),
      Item: portfolio,
    }))

    return portfolio
  }

  async getPortfolioByUserId(userId: string): Promise<Portfolio | null> {
    const result = await docClient.send(new QueryCommand({
      TableName: getTableName('portfolios'),
      IndexName: 'userId-index',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
    }))

    return result.Items?.[0] as Portfolio || null
  }

  async updatePortfolio(id: string, updates: Partial<Portfolio>): Promise<void> {
    const now = new Date().toISOString()
    
    await docClient.send(new UpdateCommand({
      TableName: getTableName('portfolios'),
      Key: { id },
      UpdateExpression: 'SET #updatedAt = :updatedAt, #totalValue = :totalValue, #currentBalance = :currentBalance',
      ExpressionAttributeNames: {
        '#updatedAt': 'updatedAt',
        '#totalValue': 'totalValue',
        '#currentBalance': 'currentBalance',
      },
      ExpressionAttributeValues: {
        ':updatedAt': now,
        ':totalValue': updates.totalValue,
        ':currentBalance': updates.currentBalance,
      },
    }))
  }

  // ================== HOLDINGS OPERATIONS ==================
  
  async createHolding(holdingData: Omit<Holding, 'id' | 'createdAt' | 'updatedAt'>): Promise<Holding> {
    const now = new Date().toISOString()
    const holding: Holding = {
      id: uuidv4(),
      ...holdingData,
      createdAt: now,
      updatedAt: now,
    }

    await docClient.send(new PutCommand({
      TableName: getTableName('holdings'),
      Item: holding,
    }))

    return holding
  }

  async getHoldingsByPortfolioId(portfolioId: string): Promise<Holding[]> {
    const result = await docClient.send(new QueryCommand({
      TableName: getTableName('holdings'),
      IndexName: 'portfolioId-index',
      KeyConditionExpression: 'portfolioId = :portfolioId',
      ExpressionAttributeValues: {
        ':portfolioId': portfolioId,
      },
    }))

    return result.Items as Holding[] || []
  }

  async updateHolding(id: string, updates: Partial<Holding>): Promise<void> {
    const now = new Date().toISOString()
    
    await docClient.send(new UpdateCommand({
      TableName: getTableName('holdings'),
      Key: { id },
      UpdateExpression: 'SET #updatedAt = :updatedAt, #shares = :shares, #avgPrice = :avgPrice, #currentPrice = :currentPrice',
      ExpressionAttributeNames: {
        '#updatedAt': 'updatedAt',
        '#shares': 'shares',
        '#avgPrice': 'avgPrice',
        '#currentPrice': 'currentPrice',
      },
      ExpressionAttributeValues: {
        ':updatedAt': now,
        ':shares': updates.shares,
        ':avgPrice': updates.avgPrice,
        ':currentPrice': updates.currentPrice,
      },
    }))
  }

  async deleteHolding(id: string): Promise<void> {
    await docClient.send(new DeleteCommand({
      TableName: getTableName('holdings'),
      Key: { id },
    }))
  }

  // ================== TRADE OPERATIONS ==================
  
  async createTrade(tradeData: Omit<Trade, 'id' | 'createdAt'>): Promise<Trade> {
    const now = new Date().toISOString()
    const trade: Trade = {
      id: uuidv4(),
      ...tradeData,
      createdAt: now,
    }

    await docClient.send(new PutCommand({
      TableName: getTableName('trades'),
      Item: trade,
    }))

    return trade
  }

  async getTradesByUserId(userId: string): Promise<Trade[]> {
    const result = await docClient.send(new QueryCommand({
      TableName: getTableName('trades'),
      IndexName: 'userId-createdAt-index',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
      ScanIndexForward: false, // Sort by createdAt descending
    }))

    return result.Items as Trade[] || []
  }

  // ================== UTILITY METHODS ==================
  
  async resetUserPortfolio(userId: string): Promise<void> {
    // Get user's portfolio
    const portfolio = await this.getPortfolioByUserId(userId)
    if (!portfolio) return

    // Get all holdings
    const holdings = await this.getHoldingsByPortfolioId(portfolio.id)
    
    // Delete all holdings
    for (const holding of holdings) {
      await this.deleteHolding(holding.id)
    }

    // Reset portfolio balance
    await this.updatePortfolio(portfolio.id, {
      currentBalance: 10000,
      totalValue: 10000,
    })
  }
}

// Export singleton instance
export const dynamoDBService = new DynamoDBService()