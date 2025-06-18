import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import { DYNAMODB_CONFIG } from './config'

const client = new DynamoDBClient(DYNAMODB_CONFIG)

export const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    convertEmptyValues: false,
    removeUndefinedValues: true,
    convertClassInstanceToMap: false,
  },
  unmarshallOptions: {
    wrapNumbers: false,
  },
})

export { client as dynamoClient }

// Health check function
export async function testConnection(): Promise<boolean> {
  try {
    await client.send(new (await import('@aws-sdk/client-dynamodb')).ListTablesCommand({}))
    return true
  } catch (error) {
    console.error('DynamoDB connection failed:', error)
    return false
  }
}
