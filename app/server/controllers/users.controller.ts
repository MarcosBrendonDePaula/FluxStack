import type { CreateUserRequest } from '@/app/shared/types'

// User type
export interface User {
  id: number
  name: string
  email: string
  createdAt: Date
}

// In-memory storage for users (for testing purposes)
let users: User[] = []
let nextId = 1

export class UsersController {
  /**
   * Get all users
   */
  static async getUsers() {
    return {
      users
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(id: number) {
    const user = users.find(u => u.id === id)
    if (!user) {
      return null
    }
    return { user }
  }

  /**
   * Create a new user
   */
  static async createUser(data: CreateUserRequest) {
    // Check for duplicate email
    const existingUser = users.find(u => u.email === data.email)
    if (existingUser) {
      return {
        success: false,
        message: 'Email já está em uso'
      }
    }

    // Create new user
    const newUser: User = {
      id: nextId++,
      name: data.name,
      email: data.email,
      createdAt: new Date()
    }

    users.push(newUser)

    return {
      success: true,
      user: newUser
    }
  }

  /**
   * Delete user by ID
   */
  static async deleteUser(id: number) {
    const userIndex = users.findIndex(u => u.id === id)

    if (userIndex === -1) {
      return {
        success: false,
        message: 'Usuário não encontrado'
      }
    }

    const deletedUser = users[userIndex]
    users.splice(userIndex, 1)

    return {
      success: true,
      user: deletedUser,
      message: 'Usuário deletado com sucesso'
    }
  }

  /**
   * Reset users array for testing purposes
   */
  static resetForTesting() {
    users = []
    nextId = 1
  }
}
