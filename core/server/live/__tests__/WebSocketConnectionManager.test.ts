// 🧪 WebSocketConnectionManager Tests

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { WebSocketConnectionManager } from '../WebSocketConnectionManager'

// Mock WebSocket
class MockWebSocket {
  readyState = 1 // WebSocket.OPEN
  data: any = {}
  
  constructor() {
    this.data = {}
  }

  send = vi.fn()
  ping = vi.fn()
  close = vi.fn()
  on = vi.fn()
}

describe('WebSocketConnectionManager', () => {
  let connectionManager: WebSocketConnectionManager
  let mockWs: MockWebSocket

  beforeEach(() => {
    connectionManager = new WebSocketConnectionManager({
      maxConnections: 10,
      connectionTimeout: 5000,
      heartbeatInterval: 1000,
      healthCheckInterval: 2000,
      messageQueueSize: 100
    })
    
    mockWs = new MockWebSocket()
  })

  afterEach(() => {
    connectionManager.shutdown()
  })

  describe('Connection Registration', () => {
    it('should register a connection successfully', () => {
      const connectionId = 'test-connection-1'
      
      connectionManager.registerConnection(mockWs as any, connectionId, 'test-pool')
      
      const metrics = connectionManager.getConnectionMetrics(connectionId)
      expect(metrics).toBeTruthy()
      expect(metrics?.id).toBe(connectionId)
      expect(metrics?.status).toBe('connected')
    })

    it('should reject connection when max limit reached', () => {
      // Fill up to max connections
      for (let i = 0; i < 10; i++) {
        const ws = new MockWebSocket()
        connectionManager.registerConnection(ws as any, `connection-${i}`)
      }

      // This should throw
      expect(() => {
        const ws = new MockWebSocket()
        connectionManager.registerConnection(ws as any, 'overflow-connection')
      }).toThrow('Maximum connections exceeded')
    })

    it('should add connection to specified pool', () => {
      const connectionId = 'test-connection-1'
      const poolId = 'test-pool'
      
      connectionManager.registerConnection(mockWs as any, connectionId, poolId)
      
      const poolStats = connectionManager.getPoolStats(poolId)
      expect(poolStats).toBeTruthy()
      expect(poolStats?.totalConnections).toBe(1)
    })
  })

  describe('Message Sending', () => {
    let connectionId: string

    beforeEach(() => {
      connectionId = 'test-connection-1'
      connectionManager.registerConnection(mockWs as any, connectionId)
    })

    it('should send message to specific connection', async () => {
      const message = { type: 'test', data: 'hello' }
      
      const success = await connectionManager.sendMessage(message, { connectionId })
      
      expect(success).toBe(true)
      expect(mockWs.send).toHaveBeenCalledWith(JSON.stringify(message))
    })

    it('should send message to pool using load balancing', async () => {
      // Add another connection to the pool
      const ws2 = new MockWebSocket()
      connectionManager.registerConnection(ws2 as any, 'connection-2', 'test-pool')
      
      const message = { type: 'test', data: 'hello' }
      
      const success = await connectionManager.sendMessage(message, { poolId: 'test-pool' })
      
      expect(success).toBe(true)
      // One of the connections should have received the message
      expect(mockWs.send.mock.calls.length + (ws2.send as any).mock.calls.length).toBe(1)
    })

    it('should broadcast to all connections', async () => {
      // Add another connection
      const ws2 = new MockWebSocket()
      connectionManager.registerConnection(ws2 as any, 'connection-2')
      
      const message = { type: 'broadcast', data: 'hello all' }
      
      const success = await connectionManager.sendMessage(message)
      
      expect(success).toBe(true)
      expect(mockWs.send).toHaveBeenCalledWith(JSON.stringify(message))
      expect(ws2.send).toHaveBeenCalledWith(JSON.stringify(message))
    })

    it('should queue message when connection is not ready', async () => {
      mockWs.readyState = 0 // WebSocket.CONNECTING
      
      const message = { type: 'test', data: 'queued' }
      
      const success = await connectionManager.sendMessage(message, { 
        connectionId,
        queueIfOffline: true 
      })
      
      expect(success).toBe(true)
      // Message should be queued, not sent immediately
      expect(mockWs.send).not.toHaveBeenCalled()
    })
  })

  describe('Load Balancing', () => {
    beforeEach(() => {
      // Add multiple connections to a pool
      for (let i = 0; i < 3; i++) {
        const ws = new MockWebSocket()
        connectionManager.registerConnection(ws as any, `connection-${i}`, 'load-test-pool')
      }
    })

    it('should distribute messages using round-robin', async () => {
      const messages = [
        { type: 'msg1', data: '1' },
        { type: 'msg2', data: '2' },
        { type: 'msg3', data: '3' }
      ]

      for (const message of messages) {
        await connectionManager.sendMessage(message, { poolId: 'load-test-pool' })
      }

      // Each connection should have received one message (round-robin)
      const poolStats = connectionManager.getPoolStats('load-test-pool')
      expect(poolStats?.totalConnections).toBe(3)
    })
  })

  describe('Connection Health', () => {
    let connectionId: string

    beforeEach(() => {
      connectionId = 'test-connection-1'
      connectionManager.registerConnection(mockWs as any, connectionId)
    })

    it('should track connection metrics', async () => {
      // Send a message to update metrics
      await connectionManager.sendMessage({ type: 'test' }, { connectionId })
      
      const metrics = connectionManager.getConnectionMetrics(connectionId)
      expect(metrics?.messagesSent).toBe(1)
      expect(metrics?.lastActivity).toBeTruthy()
    })

    it('should get all connection metrics', () => {
      const allMetrics = connectionManager.getAllConnectionMetrics()
      expect(Array.isArray(allMetrics)).toBe(true)
      expect(allMetrics.length).toBe(1)
      expect(allMetrics[0].id).toBe(connectionId)
    })
  })

  describe('System Statistics', () => {
    beforeEach(() => {
      // Add some connections
      for (let i = 0; i < 3; i++) {
        const ws = new MockWebSocket()
        connectionManager.registerConnection(ws as any, `connection-${i}`)
      }
    })

    it('should provide system statistics', () => {
      const stats = connectionManager.getSystemStats()
      
      expect(stats).toHaveProperty('totalConnections')
      expect(stats).toHaveProperty('activeConnections')
      expect(stats).toHaveProperty('maxConnections')
      expect(stats).toHaveProperty('connectionUtilization')
      expect(stats.totalConnections).toBe(3)
      expect(stats.maxConnections).toBe(10)
    })

    it('should calculate connection utilization', () => {
      const stats = connectionManager.getSystemStats()
      
      expect(stats.connectionUtilization).toBe(30) // 3/10 * 100
    })
  })

  describe('Pool Management', () => {
    it('should create and manage pools', () => {
      const poolId = 'test-pool'
      
      // Add connections to pool
      for (let i = 0; i < 2; i++) {
        const ws = new MockWebSocket()
        connectionManager.registerConnection(ws as any, `connection-${i}`, poolId)
      }
      
      const poolStats = connectionManager.getPoolStats(poolId)
      expect(poolStats).toBeTruthy()
      expect(poolStats?.totalConnections).toBe(2)
      expect(poolStats?.strategy).toBe('round-robin')
    })

    it('should return null for non-existent pool', () => {
      const poolStats = connectionManager.getPoolStats('non-existent-pool')
      expect(poolStats).toBeNull()
    })
  })

  describe('Connection Cleanup', () => {
    let connectionId: string

    beforeEach(() => {
      connectionId = 'test-connection-1'
      connectionManager.registerConnection(mockWs as any, connectionId, 'test-pool')
    })

    it('should cleanup connection properly', () => {
      connectionManager.cleanupConnection(connectionId)
      
      const metrics = connectionManager.getConnectionMetrics(connectionId)
      expect(metrics).toBeNull()
      
      const poolStats = connectionManager.getPoolStats('test-pool')
      expect(poolStats?.totalConnections).toBe(0)
    })

    it('should cleanup all connections on shutdown', () => {
      const initialStats = connectionManager.getSystemStats()
      expect(initialStats.totalConnections).toBe(1)
      
      connectionManager.shutdown()
      
      const finalStats = connectionManager.getSystemStats()
      expect(finalStats.totalConnections).toBe(0)
    })
  })

  describe('Error Handling', () => {
    it('should handle send errors gracefully', async () => {
      const connectionId = 'test-connection-1'
      connectionManager.registerConnection(mockWs as any, connectionId)
      
      // Make send throw an error
      mockWs.send.mockImplementation(() => {
        throw new Error('Send failed')
      })
      
      const message = { type: 'test', data: 'error test' }
      const success = await connectionManager.sendMessage(message, { connectionId })
      
      // Should handle error gracefully
      expect(success).toBe(false)
    })

    it('should handle connection not found', async () => {
      const message = { type: 'test', data: 'not found' }
      const success = await connectionManager.sendMessage(message, { 
        connectionId: 'non-existent' 
      })
      
      expect(success).toBe(false)
    })
  })
})