import { PutCommand, GetCommand, QueryCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb'
import { docClient } from '../client'
import { TABLES } from '../config'

export interface EconomicIndicator {
  id: string
  indicator: string
  value: number
  timestamp: string
  unit?: string
  source: string
  createdAt: string
}

export interface CreateEconomicIndicatorInput {
  indicator: string
  value: number
  timestamp: string
  unit?: string
  source: string
}

export class EconomicIndicatorRepository {
  /**
   * Create a new economic indicator record
   */
  async create(data: CreateEconomicIndicatorInput): Promise<EconomicIndicator> {
    const now = new Date().toISOString()
    
    const economicIndicator: EconomicIndicator = {
      id: crypto.randomUUID(),
      ...data,
      createdAt: now
    }

    await docClient.send(new PutCommand({
      TableName: TABLES.ECONOMIC_INDICATORS,
      Item: economicIndicator,
      ConditionExpression: 'attribute_not_exists(id)'
    }))

    return economicIndicator
  }

  /**
   * Find indicators by indicator name
   */
  async findByIndicator(indicator: string, limit: number = 50): Promise<EconomicIndicator[]> {
    const result = await docClient.send(new QueryCommand({
      TableName: TABLES.ECONOMIC_INDICATORS,
      IndexName: 'IndicatorTimestampIndex',
      KeyConditionExpression: 'indicator = :indicator',
      ExpressionAttributeValues: {
        ':indicator': indicator
      },
      ScanIndexForward: false, // Sort by timestamp descending
      Limit: limit
    }))

    return result.Items as EconomicIndicator[] || []
  }

  /**
   * Find indicators by date range
   */
  async findByDateRange(
    indicator: string,
    startDate: string,
    endDate: string
  ): Promise<EconomicIndicator[]> {
    const result = await docClient.send(new QueryCommand({
      TableName: TABLES.ECONOMIC_INDICATORS,
      IndexName: 'IndicatorTimestampIndex',
      KeyConditionExpression: 'indicator = :indicator AND #timestamp BETWEEN :startDate AND :endDate',
      ExpressionAttributeNames: {
        '#timestamp': 'timestamp'
      },
      ExpressionAttributeValues: {
        ':indicator': indicator,
        ':startDate': startDate,
        ':endDate': endDate
      },
      ScanIndexForward: false
    }))

    return result.Items as EconomicIndicator[] || []
  }

  /**
   * Get latest value for an indicator
   */
  async getLatest(indicator: string): Promise<EconomicIndicator | null> {
    const result = await this.findByIndicator(indicator, 1)
    return result[0] || null
  }

  /**
   * Find indicator by ID
   */
  async findById(id: string): Promise<EconomicIndicator | null> {
    const result = await docClient.send(new GetCommand({
      TableName: TABLES.ECONOMIC_INDICATORS,
      Key: { id }
    }))

    return result.Item as EconomicIndicator || null
  }

  /**
   * Delete an economic indicator
   */
  async delete(id: string): Promise<void> {
    await docClient.send(new DeleteCommand({
      TableName: TABLES.ECONOMIC_INDICATORS,
      Key: { id },
      ConditionExpression: 'attribute_exists(id)'
    }))
  }
}