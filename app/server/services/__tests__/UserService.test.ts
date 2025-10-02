/**
 * UserService Tests
 * Tests for the user service business logic
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { UserService } from '../UserService'
import type { ServiceContext } from '../BaseService'

// Mock logger
const mockLogger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  child: vi.fn(() => mockLogger)
}

// Mock config
const mockConfig = {
  app: { name: 'test-app', version: '1.0.0' }
} as any

describe('UserService', () => {
  let userService: UserService
  let serviceContext: ServiceContext

  beforeEach(() => {
    serviceContext = {
      config: mockConfig,
      logger: mockLogger as any
    }
    
    userService = new UserService(serviceContext)
    
    // Reset mocks
    vi.clearAllMocks()
  })

  describe('Initialization', () => {
    it('should initialize with sample data', async () => {
      await userService.initialize()

      const users = await userService.getAllUsers()
      expect(users).toHaveLength(2)
      expect(users[0].name).toBe('John Doe')
      expect(users[1].name).toBe('Jane Smith')
    })
  })

  describe('Get All Users', () => {
    it('should return all users', async () => {
      await userService.initialize()
      
      const users = await userService.getAllUsers()
      
      expect(users).toHaveLength(2)
      expect(users[0]).toHaveProperty('id')
      expect(users[0]).toHaveProperty('name')
      expect(users[0]).toHaveProperty('email')
      expect(users[0]).toHaveProperty('createdAt')
    })
  })

  describe('Get User By ID', () => {
    it('should return user when found', async () => {
      await userService.initialize()
      
      const user = await userService.getUserById(1)
      
      expect(user).not.toBeNull()
      expect(user?.name).toBe('John Doe')
      expect(user?.email).toBe('john@example.com')
    })

    it('should return null when user not found', async () => {
      await userService.initialize()
      
      const user = await userService.getUserById(999)
      
      expect(user).toBeNull()
    })
  })

  describe('Get User By Email', () => {
    it('should return user when found', async () => {
      await userService.initialize()
      
      const user = await userService.getUserByEmail('john@example.com')
      
      expect(user).not.toBeNull()
      expect(user?.name).toBe('John Doe')
    })

    it('should return null when user not found', async () => {
      await userService.initialize()
      
      const user = await userService.getUserByEmail('nonexistent@example.com')
      
      expect(user).toBeNull()
    })
  })

  describe('Create User', () => {
    beforeEach(async () => {
      await userService.initialize()
    })

    it('should create user successfully', async () => {
      const userData = {
        name: 'New User',
        email: 'new@example.com'
      }

      const user = await userService.createUser(userData)

      expect(user).toHaveProperty('id')
      expect(user.name).toBe('New User')
      expect(user.email).toBe('new@example.com')
      expect(user).toHaveProperty('createdAt')

      // Verify user was added to the list
      const allUsers = await userService.getAllUsers()
      expect(allUsers).toHaveLength(3)
    })

    it('should throw error for duplicate email', async () => {
      const userData = {
        name: 'Duplicate User',
        email: 'john@example.com' // Already exists
      }

      await expect(userService.createUser(userData)).rejects.toThrow(
        "User with email 'john@example.com' already exists"
      )
    })

    it('should throw error for missing name', async () => {
      const userData = {
        name: '',
        email: 'test@example.com'
      }

      await expect(userService.createUser(userData)).rejects.toThrow(
        'Missing required parameters: name'
      )
    })

    it('should throw error for missing email', async () => {
      const userData = {
        name: 'Test User',
        email: ''
      }

      await expect(userService.createUser(userData)).rejects.toThrow(
        'Missing required parameters: email'
      )
    })

    it('should normalize email to lowercase', async () => {
      const userData = {
        name: 'Test User',
        email: 'TEST@EXAMPLE.COM'
      }

      const user = await userService.createUser(userData)

      expect(user.email).toBe('test@example.com')
    })

    it('should trim whitespace from name and email', async () => {
      const userData = {
        name: '  Test User  ',
        email: '  test@example.com  '
      }

      const user = await userService.createUser(userData)

      expect(user.name).toBe('Test User')
      expect(user.email).toBe('test@example.com')
    })
  })

  describe('Update User', () => {
    beforeEach(async () => {
      await userService.initialize()
    })

    it('should update user successfully', async () => {
      const updates = {
        name: 'Updated John'
      }

      const user = await userService.updateUser(1, updates)

      expect(user.name).toBe('Updated John')
      expect(user.email).toBe('john@example.com') // Should remain unchanged
      expect(user).toHaveProperty('updatedAt')
    })

    it('should update email successfully', async () => {
      const updates = {
        email: 'john.updated@example.com'
      }

      const user = await userService.updateUser(1, updates)

      expect(user.email).toBe('john.updated@example.com')
      expect(user.name).toBe('John Doe') // Should remain unchanged
    })

    it('should throw error for non-existent user', async () => {
      const updates = {
        name: 'Updated Name'
      }

      await expect(userService.updateUser(999, updates)).rejects.toThrow(
        'User with ID 999 not found'
      )
    })

    it('should throw error for duplicate email', async () => {
      const updates = {
        email: 'jane@example.com' // Already exists for user ID 2
      }

      await expect(userService.updateUser(1, updates)).rejects.toThrow(
        "User with email 'jane@example.com' already exists"
      )
    })

    it('should allow updating to same email', async () => {
      const updates = {
        email: 'john@example.com' // Same email as current
      }

      const user = await userService.updateUser(1, updates)

      expect(user.email).toBe('john@example.com')
    })
  })

  describe('Delete User', () => {
    beforeEach(async () => {
      await userService.initialize()
    })

    it('should delete user successfully', async () => {
      const result = await userService.deleteUser(1)

      expect(result).toBe(true)

      // Verify user was removed
      const allUsers = await userService.getAllUsers()
      expect(allUsers).toHaveLength(1)
      expect(allUsers[0].name).toBe('Jane Smith')
    })

    it('should return false for non-existent user', async () => {
      const result = await userService.deleteUser(999)

      expect(result).toBe(false)

      // Verify no users were removed
      const allUsers = await userService.getAllUsers()
      expect(allUsers).toHaveLength(2)
    })
  })

  describe('Search Users', () => {
    beforeEach(async () => {
      await userService.initialize()
    })

    it('should search by name', async () => {
      const results = await userService.searchUsers('John')

      expect(results).toHaveLength(1)
      expect(results[0].name).toBe('John Doe')
    })

    it('should search by email', async () => {
      const results = await userService.searchUsers('jane@example.com')

      expect(results).toHaveLength(1)
      expect(results[0].name).toBe('Jane Smith')
    })

    it('should be case insensitive', async () => {
      const results = await userService.searchUsers('JOHN')

      expect(results).toHaveLength(1)
      expect(results[0].name).toBe('John Doe')
    })

    it('should return empty array for no matches', async () => {
      const results = await userService.searchUsers('nonexistent')

      expect(results).toHaveLength(0)
    })

    it('should return empty array for empty query', async () => {
      const results = await userService.searchUsers('')

      expect(results).toHaveLength(0)
    })

    it('should return empty array for whitespace query', async () => {
      const results = await userService.searchUsers('   ')

      expect(results).toHaveLength(0)
    })
  })

  describe('Get User Stats', () => {
    beforeEach(async () => {
      await userService.initialize()
    })

    it('should return correct stats', async () => {
      const stats = await userService.getUserStats()

      expect(stats.totalUsers).toBe(2)
      expect(stats.recentUsers).toBe(2) // Both users created recently
      expect(stats.topDomains).toHaveLength(1)
      expect(stats.topDomains[0]).toEqual({
        domain: 'example.com',
        count: 2
      })
    })

    it('should calculate recent users correctly', async () => {
      // Create a user with old date
      const oldUser = {
        name: 'Old User',
        email: 'old@example.com'
      }
      
      await userService.createUser(oldUser)
      
      // Manually set old creation date
      const allUsers = await userService.getAllUsers()
      const oldUserIndex = allUsers.findIndex(u => u.email === 'old@example.com')
      if (oldUserIndex !== -1) {
        // Set date to 10 days ago
        const tenDaysAgo = new Date()
        tenDaysAgo.setDate(tenDaysAgo.getDate() - 10)
        ;(allUsers[oldUserIndex] as any).createdAt = tenDaysAgo.toISOString()
      }

      const stats = await userService.getUserStats()

      expect(stats.totalUsers).toBe(3)
      expect(stats.recentUsers).toBe(2) // Only the original 2 users are recent
    })
  })

  describe('Error Handling and Logging', () => {
    beforeEach(async () => {
      await userService.initialize()
    })

    it('should log operations', async () => {
      await userService.getAllUsers()

      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Starting getAllUsers',
        undefined
      )
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Completed getAllUsers',
        expect.objectContaining({
          duration: expect.stringMatching(/\d+ms/)
        })
      )
    })

    it('should log errors', async () => {
      // Force an error by trying to create user with invalid data
      try {
        await userService.createUser({ name: '', email: '' })
      } catch (error) {
        // Expected to throw
      }

      expect(mockLogger.error).toHaveBeenCalled()
    })
  })
})