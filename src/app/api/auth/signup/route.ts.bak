import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { dynamoDBService } from '@/lib/dynamodb-client'

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
    const existingUser = await dynamoDBService.getUserByEmail(email)

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await dynamoDBService.createUser({
      email,
      password: hashedPassword,
      name: name || email.split('@')[0],
    })

    // Create initial portfolio with $10,000 demo money
    await dynamoDBService.createPortfolio({
      userId: user.id,
      initialBalance: 10000,
      currentBalance: 10000,
      totalValue: 10000,
    })

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