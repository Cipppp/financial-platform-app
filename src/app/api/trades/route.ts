import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { PortfolioRepository } from '@/lib/dynamodb/repositories/PortfolioRepository'
import { UserRepository } from '@/lib/dynamodb/repositories/UserRepository'

const portfolioRepo = new PortfolioRepository()
const userRepo = new UserRepository()

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')

    // Find the user
    const user = await userRepo.findByEmail(session.user.email)

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get trades for this user
    const trades = await portfolioRepo.getTradeHistory(user.id, limit)

    return NextResponse.json({ trades })

  } catch (error) {
    console.error('Trades fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trades' },
      { status: 500 }
    )
  }
}