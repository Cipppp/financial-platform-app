import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { UserRepository } from '@/lib/dynamodb/repositories/UserRepository'
import { PortfolioRepository } from '@/lib/dynamodb/repositories/PortfolioRepository'

const userRepo = new UserRepository()
const portfolioRepo = new PortfolioRepository()

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find the user
    const user = await userRepo.findByEmail(session.user.email)

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Reset user portfolio (handles all cleanup and reset)
    await portfolioRepo.resetUserPortfolio(user.id)

    return NextResponse.json({ 
      message: 'Portfolio reset successfully',
      newBalance: 10000
    })

  } catch (error) {
    console.error('Portfolio reset error:', error)
    return NextResponse.json(
      { error: 'Failed to reset portfolio' },
      { status: 500 }
    )
  }
}