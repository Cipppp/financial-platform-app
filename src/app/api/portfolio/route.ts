import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'
import { generateDummyStockData, isDummyDataEnabled } from '@/lib/dummyData'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const portfolio = await prisma.portfolio.findUnique({
      where: { userId: session.user.id },
      include: {
        holdings: true,
      }
    })

    if (!portfolio) {
      return NextResponse.json(
        { error: 'Portfolio not found' },
        { status: 404 }
      )
    }

    // Calculate total portfolio value by fetching current prices
    let totalValue = portfolio.currentBalance
    const holdingsWithCurrentValue = []

    for (const holding of portfolio.holdings) {
      try {
        let currentPrice = holding.currentPrice

        if (isDummyDataEnabled()) {
          // Use dummy data for price
          const dummyData = generateDummyStockData(holding.symbol)
          currentPrice = dummyData.price
        } else {
          // Fetch current price from Tiingo API
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/stocks/tiingo/${holding.symbol}`,
            { cache: 'no-cache' }
          )
          
          if (response.ok) {
            const stockData = await response.json()
            currentPrice = stockData.price
          }
        }

        const currentValue = holding.shares * currentPrice
        const gainLoss = currentValue - (holding.shares * holding.avgPrice)
        const gainLossPercent = ((currentPrice - holding.avgPrice) / holding.avgPrice) * 100

        holdingsWithCurrentValue.push({
          ...holding,
          currentPrice,
          currentValue,
          gainLoss,
          gainLossPercent,
        })

        totalValue += currentValue

        // Update current price in database
        await prisma.holding.update({
          where: { id: holding.id },
          data: { currentPrice }
        })
      } catch (error) {
        console.error(`Error fetching price for ${holding.symbol}:`, error)
        // Use stored price if error
        const currentValue = holding.shares * holding.currentPrice
        holdingsWithCurrentValue.push({
          ...holding,
          currentValue,
          gainLoss: currentValue - (holding.shares * holding.avgPrice),
          gainLossPercent: ((holding.currentPrice - holding.avgPrice) / holding.avgPrice) * 100,
        })
        totalValue += currentValue
      }
    }

    // Update total value in database
    await prisma.portfolio.update({
      where: { id: portfolio.id },
      data: { totalValue }
    })

    const dailyChange = totalValue - portfolio.initialBalance
    const totalReturn = ((totalValue - portfolio.initialBalance) / portfolio.initialBalance) * 100

    return NextResponse.json({
      ...portfolio,
      totalValue,
      dailyChange,
      totalReturn,
      holdings: holdingsWithCurrentValue,
    })
  } catch (error) {
    console.error('Portfolio API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}