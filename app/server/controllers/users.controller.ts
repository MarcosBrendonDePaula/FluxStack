import type { User, CreateUserRequest, UserResponse } from '../types'

let users: User[] = [
  { id: 1, name: "João", email: "joao@example.com", createdAt: new Date() },
  { id: 2, name: "Maria", email: "maria@example.com", createdAt: new Date() }
]

export class UsersController {
  static async getUsers() {
    return { users }
  }

  static resetForTesting() {
    users.splice(0, users.length)
    users.push(
      { id: 1, name: "João", email: "joao@example.com", createdAt: new Date() },
      { id: 2, name: "Maria", email: "maria@example.com", createdAt: new Date() }
    )
  }

  static async createUser(userData: CreateUserRequest): Promise<UserResponse> {
    const existingUser = users.find(u => u.email === userData.email)
    
    if (existingUser) {
      return {
        success: false,
        message: "Email já está em uso"
      }
    }

    const newUser: User = {
      id: Date.now(),
      name: userData.name,
      email: userData.email,
      createdAt: new Date()
    }

    users.push(newUser)

    return {
      success: true,
      user: newUser
    }
  }

  static async getUserById(id: number) {
    const user = users.find(u => u.id === id)
    return user ? { user } : null
  }

  static async deleteUser(id: number): Promise<UserResponse> {
    const userIndex = users.findIndex(u => u.id === id)
    
    if (userIndex === -1) {
      return {
        success: false,
        message: "Usuário não encontrado"
      }
    }

    const deletedUser = users.splice(userIndex, 1)[0]
    
    return {
      success: true,
      user: deletedUser,
      message: "Usuário deletado com sucesso"
    }
  }
}