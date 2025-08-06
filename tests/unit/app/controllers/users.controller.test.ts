import { describe, it, expect, beforeEach } from 'vitest'
import { UsersController } from '@/app/server/controllers/users.controller'
import type { CreateUserRequest } from '@/app/shared/types'

describe('UsersController', () => {
  beforeEach(() => {
    // Reset users array before each test
    // Note: In a real app, you'd want to use a test database
    // For now, we'll test the logic with the in-memory array
    UsersController.resetForTesting()
  })

  describe('getUsers', () => {
    it('should return users list', async () => {
      const result = await UsersController.getUsers()
      
      expect(result).toBeDefined()
      expect(result.users).toBeDefined()
      expect(Array.isArray(result.users)).toBe(true)
    })

    it('should return users with correct structure', async () => {
      const result = await UsersController.getUsers()
      
      if (result.users.length > 0) {
        const user = result.users[0]
        expect(user).toHaveProperty('id')
        expect(user).toHaveProperty('name')
        expect(user).toHaveProperty('email')
        expect(user).toHaveProperty('createdAt')
      }
    })
  })

  describe('createUser', () => {
    it('should create a new user successfully', async () => {
      const userData: CreateUserRequest = {
        name: 'Test User',
        email: 'test@example.com'
      }

      const result = await UsersController.createUser(userData)
      
      expect(result.success).toBe(true)
      expect(result.user).toBeDefined()
      expect(result.user?.name).toBe(userData.name)
      expect(result.user?.email).toBe(userData.email)
      expect(result.user?.id).toBeDefined()
      expect(result.user?.createdAt).toBeDefined()
    })

    it('should prevent duplicate email addresses', async () => {
      const userData: CreateUserRequest = {
        name: 'Test User',
        email: 'duplicate@example.com'
      }

      // Create first user
      const firstResult = await UsersController.createUser(userData)
      expect(firstResult.success).toBe(true)

      // Try to create user with same email
      const secondResult = await UsersController.createUser(userData)
      expect(secondResult.success).toBe(false)
      expect(secondResult.message).toBe('Email já está em uso')
      expect(secondResult.user).toBeUndefined()
    })

    it('should generate unique IDs for different users', async () => {
      const user1Data: CreateUserRequest = {
        name: 'User 1',
        email: 'user1@example.com'
      }

      const user2Data: CreateUserRequest = {
        name: 'User 2', 
        email: 'user2@example.com'
      }

      const result1 = await UsersController.createUser(user1Data)
      // Add small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 2))
      const result2 = await UsersController.createUser(user2Data)

      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)
      expect(result1.user?.id).not.toBe(result2.user?.id)
    })
  })

  describe('getUserById', () => {
    it('should return user when found', async () => {
      // First create a user
      const userData: CreateUserRequest = {
        name: 'Findable User',
        email: 'findable@example.com'
      }
      
      const createResult = await UsersController.createUser(userData)
      expect(createResult.success).toBe(true)
      
      const userId = createResult.user!.id
      const result = await UsersController.getUserById(userId)
      
      expect(result).toBeDefined()
      expect(result?.user).toBeDefined()
      expect(result?.user.id).toBe(userId)
      expect(result?.user.name).toBe(userData.name)
      expect(result?.user.email).toBe(userData.email)
    })

    it('should return null when user not found', async () => {
      const result = await UsersController.getUserById(99999)
      expect(result).toBeNull()
    })
  })

  describe('deleteUser', () => {
    it('should delete existing user successfully', async () => {
      // First create a user
      const userData: CreateUserRequest = {
        name: 'Deletable User',
        email: 'deletable@example.com'
      }
      
      const createResult = await UsersController.createUser(userData)
      expect(createResult.success).toBe(true)
      
      const userId = createResult.user!.id
      const deleteResult = await UsersController.deleteUser(userId)
      
      expect(deleteResult.success).toBe(true)
      expect(deleteResult.user).toBeDefined()
      expect(deleteResult.user?.id).toBe(userId)
      expect(deleteResult.message).toBe('Usuário deletado com sucesso')

      // Verify user is actually deleted
      const findResult = await UsersController.getUserById(userId)
      expect(findResult).toBeNull()
    })

    it('should return error when trying to delete non-existent user', async () => {
      const result = await UsersController.deleteUser(99999)
      
      expect(result.success).toBe(false)
      expect(result.message).toBe('Usuário não encontrado')
      expect(result.user).toBeUndefined()
    })
  })
})