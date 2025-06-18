import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb'

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    sessionToken: process.env.AWS_SESSION_TOKEN,
  },
})

const docClient = DynamoDBDocumentClient.from(client)

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'financial-platform-cache'

export interface CacheItem {
  key: string
  data: any
  timestamp: number
  ttl: number
}

export class DynamoDBCache {
  static async get(key: string): Promise<any | null> {
    try {
      const command = new GetCommand({
        TableName: TABLE_NAME,
        Key: { key },
      })

      const response = await docClient.send(command)
      
      if (!response.Item) {
        return null
      }

      const item = response.Item as CacheItem
      
      // Check if item has expired
      if (Date.now() > item.ttl * 1000) {
        return null
      }

      return item.data
    } catch (error) {
      console.error('DynamoDB get error:', error)
      return null
    }
  }

  static async set(key: string, data: any, ttlMinutes: number = 15): Promise<boolean> {
    try {
      const timestamp = Date.now()
      const ttl = Math.floor(timestamp / 1000) + (ttlMinutes * 60)

      const command = new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          key,
          data,
          timestamp,
          ttl,
        },
      })

      await docClient.send(command)
      return true
    } catch (error) {
      console.error('DynamoDB set error:', error)
      return false
    }
  }

  static generateKey(symbol: string, dataSource: string = 'default'): string {
    return `stock_${symbol}_${dataSource}`
  }
}