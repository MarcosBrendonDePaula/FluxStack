// 🧪 Test Setup Configuration

import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest'

// Global test setup
beforeAll(() => {
  // Setup global test environment
  console.log('🧪 Starting Live Components Test Suite')
})

afterAll(() => {
  // Cleanup global test environment
  console.log('✅ Live Components Test Suite Complete')
})

// Setup for each test
beforeEach(() => {
  // Reset any global state before each test
})

afterEach(() => {
  // Cleanup after each test
})

// Mock console methods to reduce noise in tests
const originalConsole = { ...console }

export const mockConsole = () => {
  console.log = () => {}
  console.warn = () => {}
  console.error = () => {}
  console.info = () => {}
}

export const restoreConsole = () => {
  Object.assign(console, originalConsole)
}

// Test utilities
export const createMockWebSocket = () => ({
  send: vi.fn(),
  close: vi.fn(),
  ping: vi.fn(),
  on: vi.fn(),
  readyState: 1, // WebSocket.OPEN
  data: {
    components: new Map(),
    subscriptions: new Set(),
    userId: 'test-user',
    connectionId: 'test-connection',
  },
})

export const createMockComponent = (initialState: any = {}) => {
  return class MockComponent {
    public id: string
    public state: any

    constructor(state: any, _ws: any) {
      this.id = `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      this.state = { ...initialState, ...state }
    }

    setState(updates: any) {
      this.state = { ...this.state, ...updates }
    }

    getSerializableState() {
      return this.state
    }

    destroy() {
      // Mock cleanup
    }

    emit(_type: string, _payload: any) {
      // Mock emit
    }
  }
}

// Test data generators
export const generateTestUpload = (overrides: any = {}) => ({
  uploadId: `upload-${Date.now()}`,
  componentId: 'test-component',
  filename: 'test.jpg',
  fileType: 'image/jpeg',
  fileSize: 1024 * 1024, // 1MB
  chunkSize: 64 * 1024, // 64KB
  ...overrides,
})

export const generateTestChunk = (uploadId: string, chunkIndex: number, totalChunks: number) => ({
  type: 'FILE_UPLOAD_CHUNK' as const,
  componentId: 'test-component',
  uploadId,
  chunkIndex,
  totalChunks,
  data: Buffer.from(`chunk-${chunkIndex}-data`).toString('base64'),
})

// Performance test helpers
export const measureExecutionTime = async (fn: () => Promise<any>) => {
  const start = Date.now()
  await fn()
  return Date.now() - start
}

export const createPerformanceTestData = (_componentId: string) => ({
  renderTimes: [10, 20, 30, 40, 50],
  actionTimes: [100, 200, 150, 300, 250],
  memoryUsages: [10 * 1024 * 1024, 15 * 1024 * 1024, 12 * 1024 * 1024],
  networkActivity: [
    { type: 'sent' as const, bytes: 1024, latency: 50 },
    { type: 'received' as const, bytes: 2048, latency: 75 },
  ],
})

// State signature test helpers
export const createTestState = (size: 'small' | 'medium' | 'large' = 'small') => {
  switch (size) {
    case 'small':
      return { count: 1, name: 'test' }
    case 'medium':
      return {
        count: 100,
        items: Array.from({ length: 50 }, (_, i) => ({ id: i, value: `item-${i}` })),
        metadata: { created: Date.now(), version: 1 },
      }
    case 'large':
      return {
        count: 1000,
        data: 'x'.repeat(2000),
        items: Array.from({ length: 200 }, (_, i) => ({
          id: i,
          value: `item-${i}`,
          description: `This is a longer description for item ${i}`.repeat(3),
        })),
        metadata: {
          created: Date.now(),
          version: 1,
          tags: Array.from({ length: 20 }, (_, i) => `tag-${i}`),
        },
      }
  }
}

// Connection manager test helpers
export const createTestConnections = (count: number) => {
  const connections = []
  for (let i = 0; i < count; i++) {
    connections.push({
      id: `connection-${i}`,
      ws: createMockWebSocket(),
      poolId: i % 2 === 0 ? 'pool-a' : 'pool-b',
    })
  }
  return connections
}

// Error simulation helpers
export const simulateNetworkError = () => {
  throw new Error('Network connection failed')
}

export const simulateMemoryError = () => {
  throw new Error('Out of memory')
}

export const simulateFileSystemError = () => {
  throw new Error('Disk full')
}

// Async test helpers
export const waitFor = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const waitForCondition = async (condition: () => boolean, timeout: number = 5000) => {
  const start = Date.now()
  while (!condition() && Date.now() - start < timeout) {
    await waitFor(10)
  }
  if (!condition()) {
    throw new Error(`Condition not met within ${timeout}ms`)
  }
}
