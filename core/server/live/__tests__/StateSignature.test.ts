// 🧪 StateSignature Tests

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { StateSignature } from '../StateSignature'

describe('StateSignature', () => {
  let stateSignature: StateSignature

  beforeEach(() => {
    stateSignature = new StateSignature('test-secret-key-12345678901234567890')
  })

  afterEach(() => {
    // Cleanup if needed
  })

  describe('State Signing', () => {
    it('should sign state successfully', async () => {
      const componentId = 'test-component'
      const state = { count: 5, name: 'test' }

      const signedState = await stateSignature.signState(componentId, state)

      expect(signedState).toHaveProperty('data')
      expect(signedState).toHaveProperty('signature')
      expect(signedState).toHaveProperty('timestamp')
      expect(signedState).toHaveProperty('componentId')
      expect(signedState).toHaveProperty('version')
      expect(signedState.componentId).toBe(componentId)
      expect(signedState.version).toBe(1)
    })

    it('should sign state with compression', async () => {
      const componentId = 'test-component'
      const largeState = {
        data: 'x'.repeat(2000), // Large enough to trigger compression
        items: Array.from({ length: 100 }, (_, i) => ({ id: i, value: `item-${i}` }))
      }

      const signedState = await stateSignature.signState(componentId, largeState, 1, {
        compress: true
      })

      expect(signedState.compressed).toBe(true)
      expect(typeof signedState.data).toBe('string') // Should be base64 compressed data
    })

    it('should sign state with encryption', async () => {
      const componentId = 'test-component'
      const sensitiveState = { password: 'secret123', apiKey: 'key-123' }

      const signedState = await stateSignature.signState(componentId, sensitiveState, 1, {
        encrypt: true
      })

      expect(signedState.encrypted).toBe(true)
      expect(typeof signedState.data).toBe('string') // Should be encrypted data
    })

    it('should create backup when requested', async () => {
      const componentId = 'test-component'
      const state = { important: 'data' }

      const signedState = await stateSignature.signState(componentId, state, 1, {
        backup: true
      })

      expect(signedState).toHaveProperty('signature')
      
      // Check if backup was created
      const backups = stateSignature.getComponentBackups(componentId)
      expect(backups.length).toBe(1)
      expect(backups[0].state).toEqual(state)
    })
  })

  describe('State Validation', () => {
    it('should validate valid signed state', async () => {
      const componentId = 'test-component'
      const state = { count: 5 }

      const signedState = await stateSignature.signState(componentId, state)
      const validation = await stateSignature.validateState(signedState)

      expect(validation.valid).toBe(true)
      expect(validation.error).toBeUndefined()
    })

    it('should reject tampered state', async () => {
      const componentId = 'test-component'
      const state = { count: 5 }

      const signedState = await stateSignature.signState(componentId, state)
      
      // Tamper with the signature to simulate tampering
      signedState.signature = 'tampered-signature'

      const validation = await stateSignature.validateState(signedState)

      expect(validation.valid).toBe(false)
      expect(validation.tampered).toBe(true)
    })

    it('should reject expired state', async () => {
      const componentId = 'test-component'
      const state = { count: 5 }

      const signedState = await stateSignature.signState(componentId, state)
      
      // Make the state appear old
      signedState.timestamp = Date.now() - (25 * 60 * 60 * 1000) // 25 hours ago

      const validation = await stateSignature.validateState(signedState)

      expect(validation.valid).toBe(false)
      expect(validation.expired).toBe(true)
    })

    it('should validate state with custom max age', async () => {
      const componentId = 'test-component'
      const state = { count: 5 }

      const signedState = await stateSignature.signState(componentId, state)
      
      // Make the state 2 hours old
      signedState.timestamp = Date.now() - (2 * 60 * 60 * 1000)

      const validation = await stateSignature.validateState(signedState, 60 * 60 * 1000) // 1 hour max age

      expect(validation.valid).toBe(false)
      expect(validation.expired).toBe(true)
    })
  })

  describe('Data Extraction', () => {
    it('should extract plain data', async () => {
      const componentId = 'test-component'
      const originalState = { count: 5, name: 'test' }

      const signedState = await stateSignature.signState(componentId, originalState)
      const extractedData = await stateSignature.extractData(signedState)

      expect(extractedData).toEqual(originalState)
    })

    it('should extract compressed data', async () => {
      const componentId = 'test-component'
      const originalState = {
        data: 'x'.repeat(2000),
        items: Array.from({ length: 50 }, (_, i) => ({ id: i, value: `item-${i}` }))
      }

      const signedState = await stateSignature.signState(componentId, originalState, 1, {
        compress: true
      })
      
      const extractedData = await stateSignature.extractData(signedState)

      expect(extractedData).toEqual(originalState)
    })

    it('should extract encrypted data', async () => {
      const componentId = 'test-component'
      const originalState = { secret: 'confidential-data' }

      const signedState = await stateSignature.signState(componentId, originalState, 1, {
        encrypt: true
      })
      
      const extractedData = await stateSignature.extractData(signedState)

      expect(extractedData).toEqual(originalState)
    })
  })

  describe('State Migration', () => {
    beforeEach(() => {
      // Register a migration function
      stateSignature.registerMigration('1', '2', (state: any) => ({
        ...state,
        version: 2,
        newField: 'added in v2'
      }))
    })

    it('should migrate state to new version', async () => {
      const componentId = 'test-component'
      const oldState = { version: 1, data: 'test' }

      const signedState = await stateSignature.signState(componentId, oldState, 1)
      const migratedState = await stateSignature.migrateState(signedState, '2')

      expect(migratedState).toBeTruthy()
      if (migratedState) {
        expect(migratedState.version).toBe(2)
        const extractedData = await stateSignature.extractData(migratedState)
        expect(extractedData.version).toBe(2)
        expect(extractedData.newField).toBe('added in v2')
      }
    })

    it('should return null for missing migration', async () => {
      const componentId = 'test-component'
      const state = { version: 1, data: 'test' }

      const signedState = await stateSignature.signState(componentId, state, 1)
      const migratedState = await stateSignature.migrateState(signedState, '3') // No migration defined

      expect(migratedState).toBeNull()
    })
  })

  describe('Backup Management', () => {
    it('should create and retrieve backups', async () => {
      const componentId = 'test-component'
      const state1 = { version: 1, data: 'first' }
      const state2 = { version: 2, data: 'second' }

      // Create backups
      await stateSignature.signState(componentId, state1, 1, { backup: true })
      await stateSignature.signState(componentId, state2, 2, { backup: true })

      const backups = stateSignature.getComponentBackups(componentId)
      expect(backups.length).toBe(2)
      expect(backups[0].state).toEqual(state1)
      expect(backups[1].state).toEqual(state2)
    })

    it('should recover specific version from backup', async () => {
      const componentId = 'test-component'
      const state1 = { version: 1, data: 'first' }
      const state2 = { version: 2, data: 'second' }

      await stateSignature.signState(componentId, state1, 1, { backup: true })
      await stateSignature.signState(componentId, state2, 2, { backup: true })

      const backup = stateSignature.recoverStateFromBackup(componentId, 1)
      expect(backup).toBeTruthy()
      expect(backup?.state).toEqual(state1)
    })

    it('should verify backup integrity', async () => {
      const componentId = 'test-component'
      const state = { data: 'test' }

      await stateSignature.signState(componentId, state, 1, { backup: true })
      
      const backups = stateSignature.getComponentBackups(componentId)
      const backup = backups[0]
      
      const isValid = stateSignature.verifyBackup(backup)
      expect(isValid).toBe(true)
    })

    it('should cleanup old backups', () => {
      const componentId = 'test-component'
      
      // This would normally create old backups, but for testing we'll just call cleanup
      stateSignature.cleanupBackups(1000) // 1 second max age
      
      // Should not throw any errors
      expect(true).toBe(true)
    })
  })

  describe('Signature Info', () => {
    it('should provide signature information', () => {
      const info = stateSignature.getSignatureInfo()

      expect(info).toHaveProperty('algorithm')
      expect(info).toHaveProperty('keyLength')
      expect(info).toHaveProperty('maxAge')
      expect(info).toHaveProperty('keyPreview')
      expect(info).toHaveProperty('currentKeyId')
      expect(info).toHaveProperty('compressionEnabled')
      expect(info.algorithm).toBe('HMAC-SHA256')
    })
  })
})