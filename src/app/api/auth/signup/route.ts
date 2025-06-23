import { NextRequest, NextResponse } from 'next/server'
import { UserRepository } from '@/lib/dynamodb/repositories/UserRepository'
import { PortfolioRepository } from '@/lib/dynamodb/repositories/PortfolioRepository'

const userRepo = new UserRepository()
const portfolioRepo = new PortfolioRepository()

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await userRepo.findByEmail(email)

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      )
    }

    // Create user (password will be hashed in userRepo.create)
    const user = await userRepo.create({
      email,
      password,
      name: name || email.split('@')[0],
    })

    // Create initial portfolio with $10,000 demo money
    await portfolioRepo.create(user.id, 10000)

    return NextResponse.json({
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      }
    })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}