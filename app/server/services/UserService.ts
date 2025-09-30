/**
 * User Service
 * Handles user-related business logic
 */

import { BaseService } from './BaseService'

export interface User {
  id: number
  name: string
  email: string
  createdAt: string
  updatedAt?: string
}

export interface CreateUserData {
  name: string
  email: string
}

export interface UpdateUserData {
  name?: string
  email?: string
}

export class UserService extends BaseService {
  private users: User[] = []
  private nextId = 1

  async initialize(): Promise<void> {
    await super.initialize()
    
    // Initialize with some sample data
    this.users = [
      {
        id: this.nextId++,
        name: 'John Doe',
        email: 'john@example.com',
        createdAt: new Date().toISOString()
      },
      {
        id: this.nextId++,
        name: 'Jane Smith',
        email: 'jane@example.com',
        createdAt: new Date().toISOString()
      }
    ]
    
    this.logger.info(`UserService initialized with ${this.users.length} users`)
  }

  /**
   * Get all users
   */
  async getAllUsers(): Promise<User[]> {
    return this.executeWithLogging('getAllUsers', async () => {
      return [...this.users]
    })
  }

  /**
   * Get user by ID
   */
  async getUserById(id: number): Promise<User | null> {
    return this.executeWithLogging('getUserById', async () => {
      const user = this.users.find(u => u.id === id)
      return user || null
    }, { userId: id })
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    return this.executeWithLogging('getUserByEmail', async () => {
      const user = this.users.find(u => u.email === email)
      return user || null
    }, { email })
  }

  /**
   * Create a new user
   */
  async createUser(data: CreateUserData): Promise<User> {
    return this.executeWithLogging('createUser', async () => {
      this.validateRequired(data, ['name', 'email'])
      
      // Check if email already exists
      const existingUser = await this.getUserByEmail(data.email)
      if (existingUser) {
        throw new Error(`User with email '${data.email}' already exists`)
      }

      const user: User = {
        id: this.nextId++,
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        createdAt: new Date().toISOString()
      }

      this.users.push(user)
      
      this.logger.info('User created', { userId: user.id, email: user.email })
      
      return user
    }, { email: data.email })
  }

  /**
   * Update an existing user
   */
  async updateUser(id: number, data: UpdateUserData): Promise<User> {
    return this.executeWithLogging('updateUser', async () => {
      const userIndex = this.users.findIndex(u => u.id === id)
      if (userIndex === -1) {
        throw new Error(`User with ID ${id} not found`)
      }

      // Check email uniqueness if email is being updated
      if (data.email) {
        const existingUser = await this.getUserByEmail(data.email)
        if (existingUser && existingUser.id !== id) {
          throw new Error(`User with email '${data.email}' already exists`)
        }
      }

      const updatedUser: User = {
        ...this.users[userIndex],
        ...data,
        updatedAt: new Date().toISOString()
      }

      if (data.email) {
        updatedUser.email = data.email.trim().toLowerCase()
      }
      
      if (data.name) {
        updatedUser.name = data.name.trim()
      }

      this.users[userIndex] = updatedUser
      
      this.logger.info('User updated', { userId: id })
      
      return updatedUser
    }, { userId: id })
  }

  /**
   * Delete a user
   */
  async deleteUser(id: number): Promise<boolean> {
    return this.executeWithLogging('deleteUser', async () => {
      const userIndex = this.users.findIndex(u => u.id === id)
      if (userIndex === -1) {
        return false
      }

      this.users.splice(userIndex, 1)
      
      this.logger.info('User deleted', { userId: id })
      
      return true
    }, { userId: id })
  }

  /**
   * Search users by name or email
   */
  async searchUsers(query: string): Promise<User[]> {
    return this.executeWithLogging('searchUsers', async () => {
      if (!query || query.trim().length === 0) {
        return []
      }

      const searchTerm = query.trim().toLowerCase()
      
      return this.users.filter(user => 
        user.name.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm)
      )
    }, { query })
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<{
    totalUsers: number
    recentUsers: number
    topDomains: Array<{ domain: string; count: number }>
  }> {
    return this.executeWithLogging('getUserStats', async () => {
      const totalUsers = this.users.length
      
      // Users created in the last 7 days
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      const recentUsers = this.users.filter(user => 
        new Date(user.createdAt) > weekAgo
      ).length

      // Top email domains
      const domainCounts = new Map<string, number>()
      this.users.forEach(user => {
        const domain = user.email.split('@')[1]
        domainCounts.set(domain, (domainCounts.get(domain) || 0) + 1)
      })

      const topDomains = Array.from(domainCounts.entries())
        .map(([domain, count]) => ({ domain, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      return {
        totalUsers,
        recentUsers,
        topDomains
      }
    })
  }
}