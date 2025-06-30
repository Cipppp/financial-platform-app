/**
 * AWS Bedrock Client
 * Handles communication with Bedrock agents and knowledge bases
 */

import { BedrockAgentRuntimeClient, InvokeAgentCommand } from '@aws-sdk/client-bedrock-agent-runtime'
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'
import { config } from './config'

// Initialize Bedrock clients
const bedrockAgentClient = new BedrockAgentRuntimeClient({
  region: config.aws.region,
})

const bedrockRuntimeClient = new BedrockRuntimeClient({
  region: config.aws.region,
})

export interface BedrockPredictionRequest {
  symbol: string
  currentPrice: number
  historicalPrices: number[]
  volume: number[]
  sentiment?: number
  timeframe: string
  marketContext?: string
}

export interface BedrockPredictionResponse {
  predictedPrice: number
  confidence: number
  reasoning: string
  technicalFactors: string[]
  riskFactors: string[]
  marketOutlook: string
  timeframe: string
}

/**
 * Invoke the financial platform agent to generate predictions
 */
export async function generateAIPrediction(
  request: BedrockPredictionRequest
): Promise<BedrockPredictionResponse> {
  try {
    // Prepare the prompt for the financial agent
    const prompt = buildPredictionPrompt(request)
    
    const command = new InvokeAgentCommand({
      agentId: config.bedrock.agentId,
      agentAliasId: config.bedrock.agentAliasId,
      sessionId: `prediction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      inputText: prompt,
    })

    const response = await bedrockAgentClient.send(command)
    
    // Process the streaming response
    let fullResponse = ''
    if (response.completion) {
      for await (const chunk of response.completion) {
        if (chunk.chunk?.bytes) {
          fullResponse += new TextDecoder().decode(chunk.chunk.bytes)
        }
      }
    }

    // Parse the agent response
    return parseAgentResponse(fullResponse, request)
    
  } catch (error) {
    console.error('Error invoking Bedrock agent:', error)
    throw new Error('Failed to generate AI prediction')
  }
}

/**
 * Generate market sentiment analysis using Bedrock
 */
export async function generateMarketSentiment(
  symbol: string,
  newsHeadlines?: string[]
): Promise<{
  sentiment: number
  label: string
  factors: string[]
  confidence: number
}> {
  try {
    const prompt = `
As a financial analyst, analyze the market sentiment for ${symbol}.

${newsHeadlines && newsHeadlines.length > 0 ? 
  `Consider these recent headlines:
${newsHeadlines.slice(0, 10).map(h => `- ${h}`).join('\n')}` : 
  'Analyze based on general market conditions and the stock\'s recent performance.'
}

Please provide:
1. Sentiment score (-1.0 to 1.0, where -1 is very bearish and 1 is very bullish)
2. Sentiment label (Very Bearish, Bearish, Neutral, Bullish, Very Bullish)
3. Key factors influencing sentiment
4. Confidence level in your assessment

Format your response as JSON:
{
  "sentiment": <number>,
  "label": "<string>",
  "factors": ["<factor1>", "<factor2>", ...],
  "confidence": <number>
}
`

    const command = new InvokeAgentCommand({
      agentId: config.bedrock.agentId,
      agentAliasId: config.bedrock.agentAliasId,
      sessionId: `sentiment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      inputText: prompt,
    })

    const response = await bedrockAgentClient.send(command)
    
    let fullResponse = ''
    if (response.completion) {
      for await (const chunk of response.completion) {
        if (chunk.chunk?.bytes) {
          fullResponse += new TextDecoder().decode(chunk.chunk.bytes)
        }
      }
    }

    // Try to parse JSON response
    try {
      const parsed = JSON.parse(fullResponse)
      return parsed
    } catch {
      // If JSON parsing fails, provide fallback sentiment
      return {
        sentiment: 0,
        label: 'Neutral',
        factors: ['Unable to parse agent response'],
        confidence: 0.5
      }
    }
    
  } catch (error) {
    console.error('Error generating sentiment:', error)
    return {
      sentiment: 0,
      label: 'Neutral',
      factors: ['Error generating sentiment'],
      confidence: 0.5
    }
  }
}

/**
 * Query the knowledge base directly for financial information
 */
export async function queryKnowledgeBase(query: string): Promise<string> {
  try {
    const prompt = `
Query: ${query}

Please search your knowledge base for relevant financial information and provide a comprehensive answer based on the documents and data available to you. Include specific references to data sources when possible.
`

    const command = new InvokeAgentCommand({
      agentId: config.bedrock.agentId,
      agentAliasId: config.bedrock.agentAliasId,
      sessionId: `kb_query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      inputText: prompt,
    })

    const response = await bedrockAgentClient.send(command)
    
    let fullResponse = ''
    if (response.completion) {
      for await (const chunk of response.completion) {
        if (chunk.chunk?.bytes) {
          fullResponse += new TextDecoder().decode(chunk.chunk.bytes)
        }
      }
    }

    return fullResponse || 'No response from knowledge base'
    
  } catch (error) {
    console.error('Error querying knowledge base:', error)
    throw new Error('Failed to query knowledge base')
  }
}

/**
 * Build the prediction prompt for the agent
 */
function buildPredictionPrompt(request: BedrockPredictionRequest): string {
  const {
    symbol,
    currentPrice,
    historicalPrices,
    volume,
    sentiment,
    timeframe,
    marketContext
  } = request

  // Calculate basic statistics
  const recentPrices = historicalPrices.slice(-10)
  const avgPrice = recentPrices.reduce((a, b) => a + b, 0) / recentPrices.length
  const priceVolatility = calculateVolatility(historicalPrices.slice(-30))
  const avgVolume = volume.slice(-10).reduce((a, b) => a + b, 0) / volume.slice(-10).length

  return `
As a financial analyst with access to comprehensive market data and research, please analyze ${symbol} and provide a price prediction for the ${timeframe} timeframe.

Current Market Data:
- Symbol: ${symbol}
- Current Price: $${currentPrice.toFixed(2)}
- Recent Average Price (10 days): $${avgPrice.toFixed(2)}
- Price Volatility (30 days): ${(priceVolatility * 100).toFixed(2)}%
- Average Volume (10 days): ${avgVolume.toLocaleString()}
- Market Sentiment Score: ${sentiment?.toFixed(3) || 'N/A'}
${marketContext ? `- Market Context: ${marketContext}` : ''}

Historical Price Data (last 10 days): [${recentPrices.map(p => p.toFixed(2)).join(', ')}]

Please provide your analysis in the following JSON format:
{
  "predictedPrice": <number>,
  "confidence": <number between 0 and 1>,
  "reasoning": "<detailed explanation of your prediction>",
  "technicalFactors": ["<factor1>", "<factor2>", ...],
  "riskFactors": ["<risk1>", "<risk2>", ...],
  "marketOutlook": "<brief market outlook>",
  "timeframe": "${timeframe}"
}

Base your analysis on:
1. Technical indicators and price patterns
2. Market sentiment and news flow
3. Sector and broader market trends
4. Any relevant financial documents in your knowledge base
5. Risk assessment and volatility considerations

Please query your knowledge base for any relevant information about ${symbol} or its sector before making your prediction.
`
}

/**
 * Parse the agent's response and extract prediction data
 */
function parseAgentResponse(
  response: string,
  request: BedrockPredictionRequest
): BedrockPredictionResponse {
  try {
    // Try to find JSON in the response
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        predictedPrice: parsed.predictedPrice || request.currentPrice,
        confidence: Math.min(Math.max(parsed.confidence || 0.5, 0), 1),
        reasoning: parsed.reasoning || 'AI analysis completed',
        technicalFactors: parsed.technicalFactors || [],
        riskFactors: parsed.riskFactors || [],
        marketOutlook: parsed.marketOutlook || 'Neutral outlook',
        timeframe: parsed.timeframe || request.timeframe
      }
    }
  } catch (error) {
    console.error('Error parsing agent response:', error)
  }

  // Fallback if parsing fails
  return {
    predictedPrice: request.currentPrice,
    confidence: 0.5,
    reasoning: 'Unable to parse complete AI analysis. Please try again.',
    technicalFactors: ['Response parsing error'],
    riskFactors: ['Incomplete analysis'],
    marketOutlook: 'Unable to determine',
    timeframe: request.timeframe
  }
}

/**
 * Calculate price volatility
 */
function calculateVolatility(prices: number[]): number {
  if (prices.length < 2) return 0

  const returns = []
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i-1]) / prices[i-1])
  }

  const mean = returns.reduce((a, b) => a + b, 0) / returns.length
  const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length
  
  return Math.sqrt(variance)
}

/**
 * Health check for Bedrock connectivity
 */
export async function testBedrockConnection(): Promise<boolean> {
  try {
    const testPrompt = 'Hello! Please respond briefly to confirm you are working.'
    
    const command = new InvokeAgentCommand({
      agentId: config.bedrock.agentId,
      agentAliasId: config.bedrock.agentAliasId,
      sessionId: `health_${Date.now()}`,
      inputText: testPrompt,
    })

    const response = await bedrockAgentClient.send(command)
    return !!response.completion
    
  } catch (error) {
    console.error('Bedrock connection test failed:', error)
    return false
  }
}