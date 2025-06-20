import { PutCommand, GetCommand, UpdateCommand, QueryCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb'
import { docClient } from '../client'
import { TABLES } from '../config'
import bcrypt from 'bcryptjs'

export interface User {
  id: string
  email: string
  password: string
  name?: string
  createdAt: string
  updatedAt: string
}

export interface CreateUserInput {
  email: string
  password: string
  name?: string
}

export class UserRepository {
  /**
   * Create a new user
   */
  async create(userData: CreateUserInput): Promise<Omit<User, 'password'>> {
    const now = new Date().toISOString()
    const hashedPassword = await bcrypt.hash(userData.password, 12)
    
    const user: User = {
      id: crypto.randomUUID(),
      email: userData.email.toLowerCase(),
      password: hashedPassword,
      name: userData.name,
      createdAt: now,
      updatedAt: now
    }

    await docClient.send(new PutCommand({
      TableName: TABLES.USERS,
      Item: user,
      ConditionExpression: 'attribute_not_exists(id)' // Prevent overwrites
    }))

    // Return user without password
    const { password, ...userWithoutPassword } = user
    return userWithoutPassword
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    const result = await docClient.send(new QueryCommand({
      TableName: TABLES.USERS,
      IndexName: 'email-index',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email.toLowerCase()
      }
    }))

    return result.Items?.[0] as User || null
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<Omit<User, 'password'> | null> {
    const result = await docClient.send(new GetCommand({
      TableName: TABLES.USERS,
      Key: { id }
    }))

    if (!result.Item) return null

    const { password, ...userWithoutPassword } = result.Item as User
    return userWithoutPassword
  }

  /**
   * Find user by ID (including password for authentication)
   */
  async findByIdWithPassword(id: string): Promise<User | null> {
    const result = await docClient.send(new GetCommand({
      TableName: TABLES.USERS,
      Key: { id }
    }))

    return result.Item as User || null
  }

  /**
   * Update user information
   */
  async update(id: string, updates: Partial<Omit<User, 'id' | 'email' | 'password' | 'createdAt'>>): Promise<Omit<User, 'password'> | null> {
    const now = new Date().toISOString()
    
    const updateExpression: string[] = ['SET updatedAt = :updatedAt']
    const expressionAttributeValues: Record<string, any> = {
      ':updatedAt': now
    }

    if (updates.name !== undefined) {
      updateExpression.push('#name = :name')
      expressionAttributeValues[':name'] = updates.name
    }

    await docClient.send(new UpdateCommand({
      TableName: TABLES.USERS,
      Key: { id },
      UpdateExpression: updateExpression.join(', '),
      ExpressionAttributeNames: {
        '#name': 'name'
      },
      ExpressionAttributeValues: expressionAttributeValues,
      ConditionExpression: 'attribute_exists(id)' // Ensure user exists
    }))

    return this.findById(id)
  }

  /**
   * Update user password
   */
  async updatePassword(id: string, newPassword: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, 12)
    
    await docClient.send(new UpdateCommand({
      TableName: TABLES.USERS,
      Key: { id },
      UpdateExpression: 'SET password = :password, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':password': hashedPassword,
        ':updatedAt': new Date().toISOString()
      },
      ConditionExpression: 'attribute_exists(id)'
    }))
  }

  /**
   * Verify user password
   */
  async verifyPassword(email: string, password: string): Promise<User | null> {
    const user = await this.findByEmail(email)
    
    if (!user) {
      return null
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)
    
    if (!isPasswordValid) {
      return null
    }

    return user
  }

  /**
   * Delete user
   */
  async delete(id: string): Promise<void> {
    await docClient.send(new DeleteCommand({
      TableName: TABLES.USERS,
      Key: { id },
      ConditionExpression: 'attribute_exists(id)'
    }))
  }

  /**
   * Check if email exists
   */
  async emailExists(email: string): Promise<boolean> {
    const user = await this.findByEmail(email)
    return !!user
  }
}
