import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: { symbol: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { symbol } = await params
    const symbolUpper = symbol.toUpperCase()
    
    // Get user's portfolio
    const portfolio = await prisma.portfolio.findUnique({
      where: { userId: session.user.id },
      include: {
        holdings: {
          where: { symbol: symbolUpper }
        }
      }
    })

    if (!portfolio) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 })
    }

    // Find the specific holding for this symbol
    const holding = portfolio.holdings.find(h => h.symbol === symbolUpper)

    if (!holding) {
      // User doesn't own any shares of this stock
      return NextResponse.json({
        position: {
          symbol: symbolUpper,
          shares: 0,
          averageCost: 0,
          currentValue: 0,
          unrealizedGainLoss: 0
        }
      })
    }

    // Calculate current value and unrealized gain/loss
    const currentValue = holding.shares * holding.currentPrice
    const totalCost = holding.shares * holding.avgPrice
    const unrealizedGainLoss = currentValue - totalCost

    return NextResponse.json({
      position: {
        symbol: symbolUpper,
        shares: holding.shares,
        averageCost: holding.avgPrice,
        currentValue,
        unrealizedGainLoss
      }
    })
  } catch (error) {
    console.error('Error fetching position:', error)
    return NextResponse.json(
      { error: 'Failed to fetch position data' },
      { status: 500 }
    )
  }
}