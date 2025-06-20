import { PutCommand, GetCommand, UpdateCommand, QueryCommand, DeleteCommand, ScanCommand } from '@aws-sdk/lib-dynamodb'
import { docClient } from '../client'
import { TABLES } from '../config'

export interface SentimentData {
  id: string
  headline: string
  sentiment: number
  source: string
  symbol?: string | null
  timestamp: string
  createdAt: string
  updatedAt: string
}

export interface CreateSentimentInput {
  headline: string
  sentiment: number
  source: string
  symbol?: string | null
  timestamp?: string
}

export class SentimentRepository {
  /**
   * Create sentiment data
   */
  async create(sentimentData: CreateSentimentInput): Promise<SentimentData> {
    const now = new Date().toISOString()
    
    const sentiment: SentimentData = {
      id: crypto.randomUUID(),
      headline: sentimentData.headline,
      sentiment: sentimentData.sentiment,
      source: sentimentData.source,
      symbol: sentimentData.symbol || null,
      timestamp: sentimentData.timestamp || now,
      createdAt: now,
      updatedAt: now
    }

    await docClient.send(new PutCommand({
      TableName: TABLES.SENTIMENT_DATA,
      Item: sentiment,
      ConditionExpression: 'attribute_not_exists(id)'
    }))

    return sentiment
  }

  /**
   * Find sentiment data by symbol
   */
  async findBySymbol(symbol: string, limit: number = 50): Promise<SentimentData[]> {
    const result = await docClient.send(new QueryCommand({
      TableName: TABLES.SENTIMENT_DATA,
      IndexName: 'SymbolTimestampIndex',
      KeyConditionExpression: 'symbol = :symbol',
      ExpressionAttributeValues: {
        ':symbol': symbol.toUpperCase()
      },
      ScanIndexForward: false, // Sort by timestamp descending
      Limit: limit
    }))

    return result.Items as SentimentData[] || []
  }

  /**
   * Find sentiment data by date range
   */
  async findByDateRange(startDate: string, endDate: string, symbol?: string): Promise<SentimentData[]> {
    if (symbol) {
      const result = await docClient.send(new QueryCommand({
        TableName: TABLES.SENTIMENT_DATA,
        IndexName: 'SymbolTimestampIndex',
        KeyConditionExpression: 'symbol = :symbol AND #timestamp BETWEEN :startDate AND :endDate',
        ExpressionAttributeNames: {
          '#timestamp': 'timestamp'
        },
        ExpressionAttributeValues: {
          ':symbol': symbol.toUpperCase(),
          ':startDate': startDate,
          ':endDate': endDate
        },
        ScanIndexForward: false
      }))

      return result.Items as SentimentData[] || []
    } else {
      // Scan all items for market-wide sentiment
      const result = await docClient.send(new ScanCommand({
        TableName: TABLES.SENTIMENT_DATA,
        FilterExpression: '#timestamp BETWEEN :startDate AND :endDate',
        ExpressionAttributeNames: {
          '#timestamp': 'timestamp'
        },
        ExpressionAttributeValues: {
          ':startDate': startDate,
          ':endDate': endDate
        }
      }))

      return result.Items as SentimentData[] || []
    }
  }

  /**
   * Delete sentiment data by ID
   */
  async delete(id: string): Promise<void> {
    await docClient.send(new DeleteCommand({
      TableName: TABLES.SENTIMENT_DATA,
      Key: { id }
    }))
  }
}