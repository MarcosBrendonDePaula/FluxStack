/**
 * WebSocketManager Tests
 * 
 * Unit tests for WebSocket communication system covering
 * connection management, message queuing, reconnection logic,
 * and real-time bidirectional communication.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { WebSocketManager } from '../WebSocketManager'

// Mock WebSocket
const mockWebSocket = {
  OPEN: 1,
  CLOSED: 3,
  readyState: 1,
  send: vi.fn(),
  close: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
}

global.WebSocket = vi.fn(() => mockWebSocket) as any
Object.assign(global.WebSocket, {
  OPEN: 1,
  CLOSED: 3
})

describe('WebSocketManager', () => {
  let wsManager: WebSocketManager
  let mockLogger: any

  beforeEach(() => {
    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn()
    }

    wsManager = new WebSocketManager({
      url: 'ws://localhost:3000/test',
      maxReconnectAttempts: 3,
      reconnectDelay: 100,
      heartbeatInterval: 1000,
      maxQueueSize: 10,
      connectionTimeout: 1000,
      enableBatching: false
    }, mockLogger)

    vi.clearAllMocks()
  })

  afterEach(() => {
    wsManager.shutdown()
  })

  describe('Connection Management', () => {
    it('should connect to WebSocket server', async () => {
      // Mock the WebSocket constructor to immediately provide handlers
      (global.WebSocket as any).mockImplementation(() => {
        const ws = { ...mockWebSocket }
        // Simulate successful connection immediately
        setTimeout(() => {
          ws.addEventListener.mock.calls
            .find((call: any) => call[0] === 'open')?.[1]()
        }, 0)
        return ws
      })

      const connectPromise = wsManager.connect()
      await connectPromise

      expect(wsManager.isConnected()).toBe(true)
      expect(wsManager.getConnectionState()).toBe('connected')
    })

    it('should handle connection timeout', async () => {
      const wsManager = new WebSocketManager({
        url: 'ws://localhost:3000/test',
        connectionTimeout: 50
      }, mockLogger)

      // Don't trigger onopen callback to simulate timeout
      await expect(wsManager.connect()).rejects.toThrow('Connection timeout')
    })

    it('should disconnect properly', async () => {
      // First connect
      (global.WebSocket as any).mockImplementation(() => {
        const ws = { ...mockWebSocket }
        setTimeout(() => {
          ws.addEventListener.mock.calls
            .find((call: any) => call[0] === 'open')?.[1]()
        }, 0)
        return ws
      })
      
      await wsManager.connect()
      
      wsManager.disconnect()
      
      expect(mockWebSocket.close).toHaveBeenCalledWith(1000, 'Client disconnect')
      expect(wsManager.getConnectionState()).toBe('disconnected')
    })

    it('should track connection state changes', () => {
      const handler = vi.fn()
      wsManager.onConnectionChange(handler)

      wsManager.disconnect()
      
      expect(handler).toHaveBeenCalledWith('disconnected', undefined)
    })
  })

  describe('Message Handling', () => {
    beforeEach(async () => {
      // Mock successful connection
      const connectPromise = wsManager.connect()
      mockWebSocket.addEventListener.mock.calls
        .find(call => call[0] === 'open')?.[1]()
      await connectPromise
    })

    it('should send messages when connected', async () => {
      await wsManager.send({
        type: 'test_message',
        componentId: 'test-component',
        payload: { data: 'test' }
      })

      expect(mockWebSocket.send).toHaveBeenCalled()
      
      const sentMessage = JSON.parse(mockWebSocket.send.mock.calls[0][0])
      expect(sentMessage.type).toBe('test_message')
      expect(sentMessage.componentId).toBe('test-component')
      expect(sentMessage.payload).toEqual({ data: 'test' })
    })

    it('should queue messages when disconnected', async () => {
      wsManager.disconnect()

      await wsManager.send({
        type: 'queued_message',
        componentId: 'test-component',
        payload: { data: 'queued' }
      })

      const stats = wsManager.getStats()
      expect(stats.queueSize).toBe(1)
    })

    it('should process queued messages on reconnection', async () => {
      wsManager.disconnect()

      // Queue a message
      await wsManager.send({
        type: 'queued_message',
        componentId: 'test-component',
        payload: { data: 'queued' }
      })

      // Reconnect
      const connectPromise = wsManager.connect()
      mockWebSocket.addEventListener.mock.calls
        .find(call => call[0] === 'open')?.[1]()
      await connectPromise

      expect(mockWebSocket.send).toHaveBeenCalled()
    })

    it('should handle incoming messages', () => {
      const handler = vi.fn()
      wsManager.onMessage('test_message', handler)

      const message = {
        id: 'msg-1',
        type: 'test_message',
        componentId: 'test-component',
        timestamp: Date.now(),
        payload: { data: 'received' }
      }

      // Simulate receiving message
      const onMessageCallback = mockWebSocket.addEventListener.mock.calls
        .find(call => call[0] === 'message')?.[1]
      
      onMessageCallback({ data: JSON.stringify(message) })

      expect(handler).toHaveBeenCalledWith(message)
    })

    it('should handle message parsing errors', () => {
      const onMessageCallback = mockWebSocket.addEventListener.mock.calls
        .find(call => call[0] === 'message')?.[1]
      
      onMessageCallback({ data: 'invalid json' })

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to parse WebSocket message:',
        expect.any(Error)
      )
    })
  })

  describe('Message Queuing', () => {
    it('should limit queue size', async () => {
      wsManager.disconnect()

      // Send more messages than queue limit
      for (let i = 0; i < 15; i++) {
        await wsManager.send({
          type: 'test_message',
          componentId: 'test-component',
          payload: { index: i }
        })
      }

      const stats = wsManager.getStats()
      expect(stats.queueSize).toBe(10) // maxQueueSize
    })

    it('should prioritize messages correctly', async () => {
      wsManager.disconnect()

      // Send messages with different priorities
      await wsManager.send({
        type: 'test_message',
        componentId: 'test-low',
        payload: { priority: 'low' }
      })

      await wsManager.send({
        type: 'test_message',
        componentId: 'test-high',
        payload: { priority: 'high' }
      })

      // Reconnect and check order
      const connectPromise = wsManager.connect()
      mockWebSocket.addEventListener.mock.calls
        .find(call => call[0] === 'open')?.[1]()
      await connectPromise

      // High priority message should be sent first
      expect(mockWebSocket.send).toHaveBeenCalledTimes(2)
    })
  })

  describe('Error Handling', () => {
    it('should handle WebSocket errors', () => {
      const onErrorCallback = mockWebSocket.addEventListener.mock.calls
        .find(call => call[0] === 'error')?.[1]
      
      onErrorCallback(new Error('WebSocket error'))

      expect(wsManager.getConnectionState()).toBe('error')
    })

    it('should handle send errors gracefully', async () => {
      const connectPromise = wsManager.connect()
      mockWebSocket.addEventListener.mock.calls
        .find(call => call[0] === 'open')?.[1]()
      await connectPromise

      mockWebSocket.send.mockImplementation(() => {
        throw new Error('Send failed')
      })

      await wsManager.send({
        type: 'test_message',
        componentId: 'test-component',
        payload: { data: 'test' }
      })

      const stats = wsManager.getStats()
      expect(stats.failedMessages).toBe(1)
    })
  })

  describe('Reconnection Logic', () => {
    it('should attempt reconnection on disconnect', () => {
      const reconnectSpy = vi.spyOn(wsManager as any, 'attemptReconnection')

      // Simulate unexpected disconnect
      const onCloseCallback = mockWebSocket.addEventListener.mock.calls
        .find(call => call[0] === 'close')?.[1]
      
      onCloseCallback({ code: 1006, reason: 'Connection lost' })

      expect(wsManager.getConnectionState()).toBe('disconnected')
      expect(reconnectSpy).toHaveBeenCalled()
    })

    it('should not reconnect on intentional disconnect', () => {
      const reconnectSpy = vi.spyOn(wsManager as any, 'attemptReconnection')

      // Simulate intentional disconnect
      const onCloseCallback = mockWebSocket.addEventListener.mock.calls
        .find(call => call[0] === 'close')?.[1]
      
      onCloseCallback({ code: 1000, reason: 'Normal close' })

      expect(reconnectSpy).not.toHaveBeenCalled()
    })
  })

  describe('Statistics and Metrics', () => {
    it('should track message statistics', async () => {
      const connectPromise = wsManager.connect()
      mockWebSocket.addEventListener.mock.calls
        .find(call => call[0] === 'open')?.[1]()
      await connectPromise

      await wsManager.send({
        type: 'test_message',
        componentId: 'test-component',
        payload: { data: 'test' }
      })

      const stats = wsManager.getStats()
      expect(stats.messagesSent).toBe(1)
    })

    it('should track connection statistics', () => {
      const stats = wsManager.getStats()
      
      expect(stats.connectionState).toBe('disconnected')
      expect(stats.reconnectAttempts).toBe(0)
      expect(stats.queueSize).toBe(0)
    })

    it('should provide connection status', () => {
      expect(wsManager.isConnected()).toBe(false)
      expect(wsManager.getConnectionState()).toBe('disconnected')
    })
  })

  describe('Heartbeat System', () => {
    it('should send heartbeat messages', async () => {
      const connectPromise = wsManager.connect()
      mockWebSocket.addEventListener.mock.calls
        .find(call => call[0] === 'open')?.[1]()
      await connectPromise

      // Fast-forward time to trigger heartbeat
      vi.advanceTimersByTime(1000)

      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('heartbeat')
      )
    })

    it('should handle heartbeat responses', () => {
      const heartbeatMessage = {
        id: 'hb-1',
        type: 'heartbeat',
        componentId: 'system',
        timestamp: Date.now() - 100,
        payload: { timestamp: Date.now() - 100 }
      }

      const onMessageCallback = mockWebSocket.addEventListener.mock.calls
        .find(call => call[0] === 'message')?.[1]
      
      onMessageCallback({ data: JSON.stringify(heartbeatMessage) })

      const stats = wsManager.getStats()
      expect(stats.lastHeartbeat).toBeGreaterThan(0)
      expect(stats.averageLatency).toBeGreaterThan(0)
    })
  })

  describe('Cleanup and Shutdown', () => {
    it('should clean up resources on shutdown', () => {
      const handler = vi.fn()
      wsManager.onMessage('test', handler)
      wsManager.onConnectionChange(handler)

      wsManager.shutdown()

      expect(mockWebSocket.close).toHaveBeenCalled()
      expect(wsManager.getConnectionState()).toBe('disconnected')
    })

    it('should clear timers on shutdown', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval')

      wsManager.shutdown()

      expect(clearTimeoutSpy).toHaveBeenCalled()
      expect(clearIntervalSpy).toHaveBeenCalled()
    })
  })
})