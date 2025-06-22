import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb'
import { config } from './config'

// Production client using IAM roles (no hardcoded credentials)
const client = new DynamoDBClient({
  region: config.aws.region,
})

const docClient = DynamoDBDocumentClient.from(client)

const TABLE_NAME = config.tables.cache

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

  static async set(key: string, data: any, ttlMinutes: number = config.app.cacheTimeoutMinutes): Promise<boolean> {
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