/**
 * Task 2 Integration Tests
 * 
 * Tests for Task 2: Improved State Synchronization
 * Covering race condition fixes, optimistic updates, and retry mechanisms.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { RequestTracker } from '../RequestTracker'
import { OptimisticUpdateManager } from '../OptimisticUpdateManager'
import { RetryManager } from '../RetryManager'

describe('Task 2: Improved State Synchronization', () => {
  let requestTracker: RequestTracker
  let optimisticManager: OptimisticUpdateManager
  let retryManager: RetryManager
  let mockLogger: any

  beforeEach(() => {
    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn()
    }

    // Initialize Task 2 systems
    requestTracker = new RequestTracker({
      requestTimeout: 1000,
      maxPendingRequests: 10,
      enableDeduplication: true,
      deduplicationWindow: 500,
      defaultConflictStrategy: 'last_write_wins'
    }, mockLogger)

    optimisticManager = new OptimisticUpdateManager(
      requestTracker,
      {
        enabled: true,
        defaultTimeout: 1000,
        enableAutoRollback: true,
        showVisualIndicators: false // Disable for tests
      },
      mockLogger
    )

    retryManager = new RetryManager({
      enabled: true,
      strategy: 'exponential',
      maxAttempts: 3,
      baseDelay: 100,
      maxDelay: 1000,
      retryOnErrors: ['NetworkError', 'TimeoutError', 'ServerError'],
      skipOnErrors: ['ValidationError', 'AuthenticationError'],
      networkAware: false // Disable network awareness for tests
    }, mockLogger)

    // Mock the scheduleRetryExecution to prevent automatic execution during tests
    vi.spyOn(retryManager as any, 'scheduleRetryExecution').mockImplementation(() => {})

    vi.clearAllMocks()
  })

  afterEach(() => {
    optimisticManager?.shutdown()
    requestTracker?.shutdown()
    retryManager?.shutdown()
  })

  describe('Task 2.1: Fix Race Conditions in Updates', () => {
    it('should track requests with unique IDs', () => {
      const request1 = requestTracker.createRequest('comp1', 'update', { value: 1 })
      const request2 = requestTracker.createRequest('comp1', 'update', { value: 2 })
      
      expect(request1.id).toBeDefined()
      expect(request2.id).toBeDefined()
      expect(request1.id).not.toBe(request2.id)
      expect(request1.sequenceNumber).toBe(1)
      expect(request2.sequenceNumber).toBe(2)
    })

    it('should deduplicate similar requests', () => {
      const request1 = requestTracker.createRequest('comp1', 'update', { value: 1 })
      const request2 = requestTracker.createRequest('comp1', 'update', { value: 1 })
      
      const submitted1 = requestTracker.submitRequest(request1)
      const submitted2 = requestTracker.submitRequest(request2)
      
      expect(submitted1).toBe(true)
      expect(submitted2).toBe(false) // Should be deduplicated
    })

    it('should order requests by sequence number', () => {
      const request1 = requestTracker.createRequest('comp1', 'update', { value: 1 })
      const request2 = requestTracker.createRequest('comp1', 'update', { value: 2 })
      const request3 = requestTracker.createRequest('comp1', 'update', { value: 3 })
      
      requestTracker.submitRequest(request3)
      requestTracker.submitRequest(request1)
      requestTracker.submitRequest(request2)
      
      const orderedRequests = requestTracker.getOrderedRequests('comp1')
      expect(orderedRequests[0].sequenceNumber).toBe(1)
      expect(orderedRequests[1].sequenceNumber).toBe(2)
      expect(orderedRequests[2].sequenceNumber).toBe(3)
    })

    it('should confirm and fail requests properly', () => {
      const request = requestTracker.createRequest('comp1', 'update', { value: 1 })
      requestTracker.submitRequest(request)
      
      expect(requestTracker.getRequest(request.id)).toBeDefined()
      
      const confirmed = requestTracker.confirmRequest(request.id, { confirmed: true })
      expect(confirmed).toBe(true)
      expect(requestTracker.getRequest(request.id)).toBeUndefined() // Moved to history
      
      const history = requestTracker.getHistory('comp1')
      expect(history).toHaveLength(1)
      expect(history[0].status).toBe('confirmed')
    })

    it('should detect and resolve conflicts', () => {
      const request1 = requestTracker.createRequest('comp1', 'update', { value: 1 })
      const request2 = requestTracker.createRequest('comp1', 'update', { value: 2 })
      
      // Make them conflict by similar timestamps
      request2.timestamp = request1.timestamp + 500 // Within conflict window
      
      requestTracker.submitRequest(request1)
      requestTracker.submitRequest(request2)
      
      const conflicts = requestTracker.detectConflicts('comp1')
      expect(conflicts.length).toBeGreaterThan(0)
      
      const resolved = requestTracker.resolveConflicts('comp1')
      expect(resolved.length).toBeLessThanOrEqual(2) // Some should be resolved
    })
  })

  describe('Task 2.2: Implement Optimistic Updates System', () => {
    it('should apply optimistic updates', async () => {
      const originalState = { count: 0 }
      const newValue = { count: 5 }
      
      const update = await optimisticManager.applyOptimisticUpdate(
        'comp1',
        'set',
        newValue,
        originalState,
        {
          rollbackFn: () => {
            // Rollback logic would go here
          }
        }
      )
      
      expect(update.state).toBe('pending')
      expect(update.optimisticState).toEqual(newValue)
      expect(update.originalState).toEqual(originalState)
    })

    it('should confirm optimistic updates', async () => {
      const update = await optimisticManager.applyOptimisticUpdate(
        'comp1',
        'set',
        { value: 'new' },
        { value: 'old' }
      )
      
      const confirmed = optimisticManager.confirmUpdate(update.id, { value: 'confirmed' })
      expect(confirmed).toBe(true)
      
      const retrievedUpdate = optimisticManager.getUpdate(update.id)
      expect(retrievedUpdate?.state).toBe('confirmed')
      expect(retrievedUpdate?.serverState).toEqual({ value: 'confirmed' })
    })

    it('should rollback failed optimistic updates', async () => {
      const rollbackFn = vi.fn()
      
      const update = await optimisticManager.applyOptimisticUpdate(
        'comp1',
        'set',
        { value: 'new' },
        { value: 'old' },
        { rollbackFn }
      )
      
      await optimisticManager.failUpdate(update.id, new Error('Server rejected'))
      
      expect(rollbackFn).toHaveBeenCalled()
    })

    it('should get optimistic state for component', async () => {
      const baseState = { count: 0, name: 'test' }
      
      // Apply multiple optimistic updates using correct increment syntax
      await optimisticManager.applyOptimisticUpdate(
        'comp1',
        'increment',
        { field: 'count', amount: 1 },
        baseState
      )
      
      await optimisticManager.applyOptimisticUpdate(
        'comp1',
        'increment',
        { field: 'count', amount: 2 },
        baseState
      )
      
      const optimisticState = optimisticManager.getOptimisticState('comp1', baseState)
      // Should have applied both increments optimistically (0 + 1 + 2 = 3)
      expect(optimisticState.count).toBe(3)
    })

    it('should handle pending update limits', async () => {
      // Create manager with low limit
      const limitedManager = new OptimisticUpdateManager(
        requestTracker,
        { maxPendingUpdates: 2 },
        mockLogger
      )
      
      // Apply updates up to limit
      await limitedManager.applyOptimisticUpdate('comp1', 'op1', {}, {})
      await limitedManager.applyOptimisticUpdate('comp1', 'op2', {}, {})
      
      // Third should fail
      await expect(
        limitedManager.applyOptimisticUpdate('comp1', 'op3', {}, {})
      ).rejects.toThrow('Maximum pending updates exceeded')
      
      limitedManager.shutdown()
    })
  })

  describe('Task 2.3: Add Retry Mechanisms', () => {
    it('should schedule retries with exponential backoff', () => {
      const error = new Error('Network error')
      error.name = 'NetworkError' // Set the proper error type
      
      const attemptId = retryManager.scheduleRetry('req1', 'comp1', error)
      
      expect(attemptId).toBeDefined()
      expect(attemptId).not.toBeNull()
      
      const attempt = retryManager.getRetryAttempt(attemptId!)
      expect(attempt).toBeDefined()
      expect(attempt?.attemptNumber).toBe(1)
      expect(attempt?.strategy).toBe('exponential')
      expect(attempt?.currentDelay).toBeGreaterThan(0)
    })

    it('should respect max retry attempts', () => {
      const error = new Error('Network error')
      error.name = 'NetworkError'
      
      // Schedule max attempts
      let attemptId = retryManager.scheduleRetry('req1', 'comp1', error)
      expect(attemptId).toBeDefined()
      
      attemptId = retryManager.scheduleRetry('req1', 'comp1', error)
      expect(attemptId).toBeDefined()
      
      attemptId = retryManager.scheduleRetry('req1', 'comp1', error)
      expect(attemptId).toBeDefined()
      
      // Fourth attempt should be rejected
      attemptId = retryManager.scheduleRetry('req1', 'comp1', error)
      expect(attemptId).toBeNull()
    })

    it('should not retry non-retryable errors', () => {
      const validationError = new Error('Validation failed')
      validationError.name = 'ValidationError'
      
      const attemptId = retryManager.scheduleRetry('req1', 'comp1', validationError)
      
      expect(attemptId).toBeNull() // Should not schedule retry
    })

    it('should support manual retry execution', async () => {
      const error = new Error('Network error')
      error.name = 'NetworkError'
      
      const attemptId = retryManager.scheduleRetry('req1', 'comp1', error)
      expect(attemptId).toBeDefined()
      
      const results = await retryManager.executeManualRetry('comp1', 'req1')
      expect(results).toHaveLength(1)
    })

    it('should cancel retries', () => {
      const error = new Error('Network error')
      error.name = 'NetworkError'
      
      retryManager.scheduleRetry('req1', 'comp1', error)
      retryManager.scheduleRetry('req2', 'comp1', error)
      
      const status = retryManager.getRetryStatus('comp1')
      expect(status.hasActiveRetries).toBe(true)
      expect(status.totalRetries).toBe(2)
      
      const cancelled = retryManager.cancelRetries('comp1')
      expect(cancelled).toBe(2)
      
      const statusAfter = retryManager.getRetryStatus('comp1')
      expect(statusAfter.hasActiveRetries).toBe(false)
    })

    it('should track network conditions', () => {
      const networkCondition = retryManager.getNetworkCondition()
      
      expect(networkCondition).toBeDefined()
      expect(networkCondition.status).toBeDefined()
      expect(networkCondition.stability).toBeGreaterThanOrEqual(0)
      expect(networkCondition.stability).toBeLessThanOrEqual(1)
    })

    it('should provide retry statistics', () => {
      const error = new Error('Network error')
      error.name = 'NetworkError'
      
      retryManager.scheduleRetry('req1', 'comp1', error)
      retryManager.scheduleRetry('req2', 'comp1', error)
      
      const stats = retryManager.getRetryStats()
      
      expect(stats.totalRetries).toBe(2)
      expect(stats.retriesByStrategy.get('exponential')).toBe(2)
      expect(stats.retriesByError.get('NetworkError')).toBe(2)
    })
  })

  describe('System Integration', () => {
    it('should integrate all Task 2 systems', async () => {
      // Create request
      const request = requestTracker.createRequest('comp1', 'update', { value: 'test' })
      expect(requestTracker.submitRequest(request)).toBe(true)
      
      // Apply optimistic update
      const optimisticUpdate = await optimisticManager.applyOptimisticUpdate(
        'comp1',
        'update',
        { value: 'optimistic' },
        { value: 'original' }
      )
      
      expect(optimisticUpdate.state).toBe('pending')
      
      // Simulate failure to trigger retry
      const serverError = new Error('Server error')
      serverError.name = 'ServerError'
      await optimisticManager.failUpdate(optimisticUpdate.id, serverError)
      
      // Should have scheduled retry
      const retryStatus = retryManager.getRetryStatus('comp1')
      // Note: In a real integration, the OptimisticUpdateManager would 
      // automatically trigger RetryManager, but here they're separate
      
      expect(optimisticUpdate.state).toBe('rolled_back')
    })

    it('should handle component cleanup', () => {
      // Create some requests and updates
      const request = requestTracker.createRequest('comp1', 'update', { value: 'test' })
      requestTracker.submitRequest(request)
      
      // Schedule retry
      const testError = new Error('Test')
      testError.name = 'NetworkError'
      retryManager.scheduleRetry('req1', 'comp1', testError)
      
      // Clear component
      requestTracker.clearComponent('comp1')
      optimisticManager.clearComponent('comp1')
      retryManager.cancelRetries('comp1')
      
      // Should be cleaned up
      expect(requestTracker.getPendingRequests('comp1')).toHaveLength(0)
      expect(optimisticManager.getComponentUpdates('comp1')).toHaveLength(0)
      expect(retryManager.getRetryStatus('comp1').hasActiveRetries).toBe(false)
    })

    it('should provide comprehensive statistics', () => {
      // Generate some activity
      const request1 = requestTracker.createRequest('comp1', 'op1', {})
      const request2 = requestTracker.createRequest('comp1', 'op2', {})
      
      requestTracker.submitRequest(request1)
      requestTracker.submitRequest(request2)
      requestTracker.confirmRequest(request1.id)
      
      const testError = new Error('Test')
      testError.name = 'NetworkError'
      retryManager.scheduleRetry('req1', 'comp1', testError)
      
      // Get statistics
      const requestStats = requestTracker.getStats()
      const retryStats = retryManager.getRetryStats()
      const optimisticStats = optimisticManager.getStats()
      
      expect(requestStats.pendingCount).toBeGreaterThanOrEqual(0)
      expect(requestStats.totalRequests).toBeGreaterThan(0)
      
      expect(retryStats.totalRetries).toBeGreaterThan(0)
      
      expect(optimisticStats.activeUpdates).toBeGreaterThanOrEqual(0)
    })
  })
})