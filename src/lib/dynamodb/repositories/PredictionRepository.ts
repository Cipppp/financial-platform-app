import { PutCommand, GetCommand, UpdateCommand, QueryCommand, DeleteCommand, ScanCommand } from '@aws-sdk/lib-dynamodb'
import { docClient } from '../client'
import { TABLES } from '../config'

export interface Prediction {
  id: string
  symbol: string
  model: 'ENSEMBLE' | 'LINEAR_REGRESSION' | 'ARIMA' | 'LSTM'
  timeframe: string
  currentPrice: number
  predictedPrice: number
  confidence: number
  targetDate: string
  accuracy?: number
  parameters: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface CreatePredictionInput {
  symbol: string
  model: 'ENSEMBLE' | 'LINEAR_REGRESSION' | 'ARIMA' | 'LSTM'
  timeframe: string
  currentPrice: number
  predictedPrice: number
  confidence: number
  targetDate: string
  parameters: Record<string, any>
}

export class PredictionRepository {
  /**
   * Create a new prediction
   */
  async create(predictionData: CreatePredictionInput): Promise<Prediction> {
    const now = new Date().toISOString()
    
    const prediction: Prediction = {
      id: crypto.randomUUID(),
      symbol: predictionData.symbol.toUpperCase(),
      model: predictionData.model,
      timeframe: predictionData.timeframe,
      currentPrice: predictionData.currentPrice,
      predictedPrice: predictionData.predictedPrice,
      confidence: predictionData.confidence,
      targetDate: predictionData.targetDate,
      parameters: predictionData.parameters,
      createdAt: now,
      updatedAt: now
    }

    await docClient.send(new PutCommand({
      TableName: TABLES.PREDICTIONS,
      Item: prediction,
      ConditionExpression: 'attribute_not_exists(id)'
    }))

    return prediction
  }

  /**
   * Find predictions by symbol
   */
  async findBySymbol(symbol: string, limit: number = 10): Promise<Prediction[]> {
    const result = await docClient.send(new QueryCommand({
      TableName: TABLES.PREDICTIONS,
      IndexName: 'SymbolCreatedAtIndex',
      KeyConditionExpression: 'symbol = :symbol',
      ExpressionAttributeValues: {
        ':symbol': symbol.toUpperCase()
      },
      ScanIndexForward: false, // Sort by createdAt descending
      Limit: limit
    }))

    return result.Items as Prediction[] || []
  }

  /**
   * Find all recent predictions
   */
  async findRecent(limit: number = 10): Promise<Prediction[]> {
    const result = await docClient.send(new ScanCommand({
      TableName: TABLES.PREDICTIONS,
      Limit: limit
    }))

    // Sort by createdAt descending
    const predictions = (result.Items as Prediction[] || []).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    return predictions.slice(0, limit)
  }

  /**
   * Find prediction by ID
   */
  async findById(id: string): Promise<Prediction | null> {
    const result = await docClient.send(new GetCommand({
      TableName: TABLES.PREDICTIONS,
      Key: { id }
    }))

    return result.Item as Prediction || null
  }

  /**
   * Update prediction accuracy
   */
  async updateAccuracy(id: string, accuracy: number): Promise<void> {
    await docClient.send(new UpdateCommand({
      TableName: TABLES.PREDICTIONS,
      Key: { id },
      UpdateExpression: 'SET accuracy = :accuracy, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':accuracy': accuracy,
        ':updatedAt': new Date().toISOString()
      },
      ConditionExpression: 'attribute_exists(id)'
    }))
  }

  /**
   * Find predictions that need accuracy updates (past target date)
   */
  async findPredictionsForAccuracyUpdate(): Promise<Prediction[]> {
    const now = new Date().toISOString()
    
    const result = await docClient.send(new ScanCommand({
      TableName: TABLES.PREDICTIONS,
      FilterExpression: 'targetDate <= :now AND attribute_not_exists(accuracy)',
      ExpressionAttributeValues: {
        ':now': now
      }
    }))

    return result.Items as Prediction[] || []
  }

  /**
   * Delete prediction
   */
  async delete(id: string): Promise<void> {
    await docClient.send(new DeleteCommand({
      TableName: TABLES.PREDICTIONS,
      Key: { id }
    }))
  }
}