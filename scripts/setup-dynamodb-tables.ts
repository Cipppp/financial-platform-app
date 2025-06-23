import { CreateTableCommand, DescribeTableCommand, ListTablesCommand } from '@aws-sdk/client-dynamodb'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { config } from '../src/lib/config'

const dynamoClient = new DynamoDBClient({
  region: config.aws.region,
})

const TABLES = {
  USERS: config.tables.users,
  PORTFOLIOS: config.tables.portfolios,
  HOLDINGS: config.tables.holdings,
  TRADES: config.tables.trades,
  MARKET_DATA: config.tables.marketData,
  PREDICTIONS: config.tables.predictions,
  SENTIMENT_DATA: config.tables.sentimentData,
  CORRELATIONS: config.tables.correlations,
  ECONOMIC_INDICATORS: config.tables.economicIndicators,
  BACKTEST_RESULTS: config.tables.backtestResults,
}

const tableDefinitions = [
  {
    TableName: TABLES.USERS,
    KeySchema: [
      { AttributeName: 'id', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
      { AttributeName: 'email', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'EmailIndex',
        KeySchema: [{ AttributeName: 'email', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
      }
    ],
    BillingMode: 'PAY_PER_REQUEST'
  },
  {
    TableName: TABLES.PORTFOLIOS,
    KeySchema: [
      { AttributeName: 'id', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
      { AttributeName: 'userId', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'UserIndex',
        KeySchema: [{ AttributeName: 'userId', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
      }
    ],
    BillingMode: 'PAY_PER_REQUEST'
  },
  {
    TableName: TABLES.HOLDINGS,
    KeySchema: [
      { AttributeName: 'portfolioId', KeyType: 'HASH' },
      { AttributeName: 'symbol', KeyType: 'RANGE' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'portfolioId', AttributeType: 'S' },
      { AttributeName: 'symbol', AttributeType: 'S' }
    ],
    BillingMode: 'PAY_PER_REQUEST'
  },
  {
    TableName: TABLES.TRADES,
    KeySchema: [
      { AttributeName: 'id', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
      { AttributeName: 'userId', AttributeType: 'S' },
      { AttributeName: 'createdAt', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'UserTradesIndex',
        KeySchema: [
          { AttributeName: 'userId', KeyType: 'HASH' },
          { AttributeName: 'createdAt', KeyType: 'RANGE' }
        ],
        Projection: { ProjectionType: 'ALL' },
      }
    ],
    BillingMode: 'PAY_PER_REQUEST'
  },
  {
    TableName: TABLES.MARKET_DATA,
    KeySchema: [
      { AttributeName: 'symbol', KeyType: 'HASH' },
      { AttributeName: 'timestamp', KeyType: 'RANGE' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'symbol', AttributeType: 'S' },
      { AttributeName: 'timestamp', AttributeType: 'S' }
    ],
    BillingMode: 'PROVISIONED',
    ProvisionedThroughput: { ReadCapacityUnits: 10, WriteCapacityUnits: 10 }
  },
  {
    TableName: TABLES.PREDICTIONS,
    KeySchema: [
      { AttributeName: 'id', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
      { AttributeName: 'symbol', AttributeType: 'S' },
      { AttributeName: 'createdAt', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'SymbolIndex',
        KeySchema: [
          { AttributeName: 'symbol', KeyType: 'HASH' },
          { AttributeName: 'createdAt', KeyType: 'RANGE' }
        ],
        Projection: { ProjectionType: 'ALL' },
      }
    ],
    BillingMode: 'PAY_PER_REQUEST'
  },
  {
    TableName: TABLES.SENTIMENT_DATA,
    KeySchema: [
      { AttributeName: 'id', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
      { AttributeName: 'symbol', AttributeType: 'S' },
      { AttributeName: 'timestamp', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'SymbolTimestampIndex',
        KeySchema: [
          { AttributeName: 'symbol', KeyType: 'HASH' },
          { AttributeName: 'timestamp', KeyType: 'RANGE' }
        ],
        Projection: { ProjectionType: 'ALL' },
      }
    ],
    BillingMode: 'PAY_PER_REQUEST'
  },
  {
    TableName: TABLES.ECONOMIC_INDICATORS,
    KeySchema: [
      { AttributeName: 'indicator', KeyType: 'HASH' },
      { AttributeName: 'timestamp', KeyType: 'RANGE' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'indicator', AttributeType: 'S' },
      { AttributeName: 'timestamp', AttributeType: 'S' }
    ],
    BillingMode: 'PAY_PER_REQUEST'
  },
  {
    TableName: TABLES.BACKTEST_RESULTS,
    KeySchema: [
      { AttributeName: 'id', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
      { AttributeName: 'userId', AttributeType: 'S' },
      { AttributeName: 'createdAt', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'UserBacktestsIndex',
        KeySchema: [
          { AttributeName: 'userId', KeyType: 'HASH' },
          { AttributeName: 'createdAt', KeyType: 'RANGE' }
        ],
        Projection: { ProjectionType: 'ALL' },
      }
    ],
    BillingMode: 'PAY_PER_REQUEST'
  }
]

async function createTable(tableDefinition: any) {
  try {
    // Check if table exists
    await dynamoClient.send(new DescribeTableCommand({ 
      TableName: tableDefinition.TableName 
    }))
    console.log(`✅ Table ${tableDefinition.TableName} already exists`)
  } catch (error: any) {
    if (error.name === 'ResourceNotFoundException') {
      // Table doesn't exist, create it
      try {
        console.log(`🚀 Creating table: ${tableDefinition.TableName}...`)
        await dynamoClient.send(new CreateTableCommand(tableDefinition))
        console.log(`✅ Created table: ${tableDefinition.TableName}`)
      } catch (createError) {
        console.error(`❌ Error creating table ${tableDefinition.TableName}:`, createError)
      }
    } else {
      console.error(`❌ Error checking table ${tableDefinition.TableName}:`, error)
    }
  }
}

async function setupTables() {
  console.log('🏗️  Setting up DynamoDB tables...')
  console.log(`📍 Region: ${config.aws.region}`)
  
  try {
    // Test connection first
    const listResult = await dynamoClient.send(new ListTablesCommand({}))
    console.log(`🔌 Connected to DynamoDB. Found ${listResult.TableNames?.length || 0} existing tables.`)
  } catch (error) {
    console.error('❌ Failed to connect to DynamoDB:', error)
    console.log('\n💡 Make sure your AWS credentials are configured:')
    console.log('   - Configure AWS CLI: aws configure')
    console.log('   - Or use IAM roles if running on AWS')
    process.exit(1)
  }
  
  for (const tableDefinition of tableDefinitions) {
    await createTable(tableDefinition)
    // Add a small delay between table creation to avoid throttling
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  console.log('✅ DynamoDB setup complete!')
  console.log('\n📝 Next steps:')
  console.log('   1. Update your API routes to use DynamoDB repositories')
  console.log('   2. Update authentication to use UserRepository')
  console.log('   3. Test the connection with: npm run test-dynamodb')
}

setupTables().catch(console.error)
