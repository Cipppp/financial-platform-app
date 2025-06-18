// src/app/api/portfolio/reset/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { portfolio: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!user.portfolio) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 })
    }

    // Delete all trades for this user
    await prisma.trade.deleteMany({
      where: { userId: user.id }
    })

    // Delete all holdings for this user's portfolio
    await prisma.holding.deleteMany({
      where: { portfolioId: user.portfolio.id }
    })

    // Reset portfolio balance to $10,000
    await prisma.portfolio.update({
      where: { userId: user.id },
      data: {
        currentBalance: 10000,
        initialBalance: 10000,
        totalValue: 10000
      }
    })

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