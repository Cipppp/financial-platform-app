import { PutCommand, GetCommand, UpdateCommand, QueryCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb'
import { docClient } from '../client'
import { TABLES } from '../config'

export interface CorrelationAnalysis {
  id: string
  symbol1: string
  symbol2: string
  timeframe: string
  correlation: number
  calculatedAt: string
  createdAt: string
  updatedAt: string
}

export interface CreateCorrelationInput {
  symbol1: string
  symbol2: string
  timeframe: string
  correlation: number
}

export class CorrelationRepository {
  /**
   * Create or update correlation analysis
   */
  async upsert(correlationData: CreateCorrelationInput): Promise<CorrelationAnalysis> {
    const now = new Date().toISOString()
    
    // Create a composite key for uniqueness
    const compositeKey = `${correlationData.symbol1.toUpperCase()}_${correlationData.symbol2.toUpperCase()}_${correlationData.timeframe}`
    
    const existing = await this.findBySymbolsAndTimeframe(
      correlationData.symbol1,
      correlationData.symbol2,
      correlationData.timeframe
    )

    if (existing) {
      // Update existing correlation
      await docClient.send(new UpdateCommand({
        TableName: TABLES.CORRELATIONS,
        Key: { id: existing.id },
        UpdateExpression: 'SET correlation = :correlation, calculatedAt = :calculatedAt, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':correlation': correlationData.correlation,
          ':calculatedAt': now,
          ':updatedAt': now
        }
      }))

      return {
        ...existing,
        correlation: correlationData.correlation,
        calculatedAt: now,
        updatedAt: now
      }
    } else {
      // Create new correlation
      const correlation: CorrelationAnalysis = {
        id: crypto.randomUUID(),
        symbol1: correlationData.symbol1.toUpperCase(),
        symbol2: correlationData.symbol2.toUpperCase(),
        timeframe: correlationData.timeframe,
        correlation: correlationData.correlation,
        calculatedAt: now,
        createdAt: now,
        updatedAt: now
      }

      await docClient.send(new PutCommand({
        TableName: TABLES.CORRELATIONS,
        Item: correlation,
        ConditionExpression: 'attribute_not_exists(id)'
      }))

      return correlation
    }
  }

  /**
   * Find correlation by symbols and timeframe
   */
  async findBySymbolsAndTimeframe(symbol1: string, symbol2: string, timeframe: string): Promise<CorrelationAnalysis | null> {
    // Try both symbol orders since correlation is symmetric
    const combinations = [
      { s1: symbol1.toUpperCase(), s2: symbol2.toUpperCase() },
      { s1: symbol2.toUpperCase(), s2: symbol1.toUpperCase() }
    ]

    for (const combo of combinations) {
      const result = await docClient.send(new QueryCommand({
        TableName: TABLES.CORRELATIONS,
        IndexName: 'SymbolsTimeframeIndex',
        KeyConditionExpression: 'symbol1 = :symbol1 AND symbol2 = :symbol2 AND timeframe = :timeframe',
        ExpressionAttributeValues: {
          ':symbol1': combo.s1,
          ':symbol2': combo.s2,
          ':timeframe': timeframe
        }
      }))

      if (result.Items && result.Items.length > 0) {
        return result.Items[0] as CorrelationAnalysis
      }
    }

    return null
  }

  /**
   * Find correlations by symbol
   */
  async findBySymbol(symbol: string, limit: number = 20): Promise<CorrelationAnalysis[]> {
    const upperSymbol = symbol.toUpperCase()
    
    // Query where symbol is either symbol1 or symbol2
    const result1 = await docClient.send(new QueryCommand({
      TableName: TABLES.CORRELATIONS,
      IndexName: 'Symbol1Index',
      KeyConditionExpression: 'symbol1 = :symbol',
      ExpressionAttributeValues: {
        ':symbol': upperSymbol
      },
      Limit: Math.ceil(limit / 2)
    }))

    const result2 = await docClient.send(new QueryCommand({
      TableName: TABLES.CORRELATIONS,
      IndexName: 'Symbol2Index',
      KeyConditionExpression: 'symbol2 = :symbol',
      ExpressionAttributeValues: {
        ':symbol': upperSymbol
      },
      Limit: Math.ceil(limit / 2)
    }))

    const correlations = [
      ...(result1.Items as CorrelationAnalysis[] || []),
      ...(result2.Items as CorrelationAnalysis[] || [])
    ]

    // Remove duplicates and sort by correlation strength
    const uniqueCorrelations = correlations.filter((correlation, index, self) => 
      index === self.findIndex(c => c.id === correlation.id)
    )

    return uniqueCorrelations
      .sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))
      .slice(0, limit)
  }

  /**
   * Delete correlation
   */
  async delete(id: string): Promise<void> {
    await docClient.send(new DeleteCommand({
      TableName: TABLES.CORRELATIONS,
      Key: { id }
    }))
  }
}