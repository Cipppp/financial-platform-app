import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { PortfolioRepository } from '@/lib/dynamodb/repositories/PortfolioRepository'
const portfolioRepo = new PortfolioRepository()

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { symbol, type, shares, price } = await request.json()

    if (!symbol || !type || !shares || !price) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const total = shares * price

    // Get user's portfolio
    const portfolio = await portfolioRepo.findByUserId(session.user.id)

    if (!portfolio) {
      return NextResponse.json(
        { error: 'Portfolio not found' },
        { status: 404 }
      )
    }

    if (type === 'BUY') {
      // Execute buy trade
      await portfolioRepo.executeBuyTrade(
        portfolio.id,
        session.user.id,
        symbol,
        shares,
        price
      )
    } else if (type === 'SELL') {
      // Execute sell trade
      await portfolioRepo.executeSellTrade(
        portfolio.id,
        session.user.id,
        symbol,
        shares,
        price
      )
    }

    return NextResponse.json({
      message: `Successfully ${type.toLowerCase()}ed ${shares} shares of ${symbol}`,
      trade: {
        symbol,
        type,
        shares,
        price,
        total,
      }
    })

  } catch (error) {
    console.error('Trade API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}