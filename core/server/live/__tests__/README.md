# 🧪 Live Components Test Suite

Comprehensive test suite for the FluxStack Live Components system, covering all major components and integration scenarios.

## 📋 Test Coverage

### Unit Tests

- **ComponentRegistry.test.ts** - Component lifecycle, registration, health monitoring
- **StateSignature.test.ts** - Cryptographic state validation, compression, encryption
- **WebSocketConnectionManager.test.ts** - Connection pooling, load balancing, health checks
- **LiveComponentPerformanceMonitor.test.ts** - Performance tracking, alerts, optimization suggestions
- **FileUploadManager.test.ts** - File upload handling, chunking, validation

### Integration Tests

- **integration.test.ts** - End-to-end system functionality and component interactions

## 🚀 Running Tests

### Quick Start

```bash
# Run all tests
npm run test:live

# Run with coverage
npm run test:live:coverage

# Run in watch mode
npm run test:live:watch
```

### Using the Test Runner Script

```bash
# Basic test run
tsx scripts/test-live-components.ts

# With coverage report
tsx scripts/test-live-components.ts --coverage

# Watch mode for development
tsx scripts/test-live-components.ts --watch

# Filter specific tests
tsx scripts/test-live-components.ts --filter=ComponentRegistry

# Different reporters
tsx scripts/test-live-components.ts --reporter=json
```

### Direct Vitest Commands

```bash
# Run with specific config
npx vitest --config vitest.config.live.ts --run

# Run specific test file
npx vitest core/server/live/__tests__/ComponentRegistry.test.ts

# Run with coverage
npx vitest --config vitest.config.live.ts --coverage --run
```

## 📊 Test Structure

### Test Organization

```
core/server/live/__tests__/
├── setup.ts                           # Test configuration and utilities
├── ComponentRegistry.test.ts          # Component registry tests
├── StateSignature.test.ts             # State signature tests
├── WebSocketConnectionManager.test.ts # Connection manager tests
├── LiveComponentPerformanceMonitor.test.ts # Performance monitor tests
├── FileUploadManager.test.ts          # File upload tests
├── integration.test.ts                # Integration tests
└── README.md                          # This file
```

### Test Categories

1. **Unit Tests** - Test individual components in isolation
2. **Integration Tests** - Test component interactions and workflows
3. **Performance Tests** - Test system performance and monitoring
4. **Error Handling Tests** - Test error scenarios and recovery
5. **Security Tests** - Test cryptographic functions and validation

## 🔧 Test Configuration

### Vitest Configuration

The test suite uses a custom Vitest configuration (`vitest.config.live.ts`) with:

- **Environment**: Node.js
- **Coverage**: V8 provider with 80% thresholds
- **Timeout**: 10 seconds for tests, 5 seconds for teardown
- **Isolation**: Each test runs in isolation
- **Threads**: Multi-threaded execution (1-4 threads)

### Coverage Thresholds

- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

## 🛠️ Test Utilities

### Mock Helpers

```typescript
import { createMockWebSocket, createMockComponent } from './setup'

// Create mock WebSocket
const mockWs = createMockWebSocket()

// Create mock component
const MockComponent = createMockComponent({ count: 0 })
```

### Test Data Generators

```typescript
import { generateTestUpload, createTestState } from './setup'

// Generate test upload data
const upload = generateTestUpload({ fileSize: 2048 })

// Create test state of different sizes
const smallState = createTestState('small')
const largeState = createTestState('large')
```

### Performance Testing

```typescript
import { measureExecutionTime, createPerformanceTestData } from './setup'

// Measure execution time
const time = await measureExecutionTime(async () => {
  await someAsyncOperation()
})

// Create performance test data
const perfData = createPerformanceTestData('component-id')
```

## 📈 Coverage Reports

Coverage reports are generated in multiple formats:

- **Text**: Console output during test run
- **HTML**: `./coverage/live-components/index.html`
- **JSON**: `./coverage/live-components/coverage-final.json`

### Viewing Coverage

```bash
# Generate and open HTML coverage report
npm run test:live:coverage
open ./coverage/live-components/index.html
```

## 🐛 Debugging Tests

### Running Individual Tests

```bash
# Run specific test file
npx vitest ComponentRegistry.test.ts

# Run specific test case
npx vitest ComponentRegistry.test.ts -t "should mount component"
```

### Debug Mode

```bash
# Run with debug output
DEBUG=* npx vitest --config vitest.config.live.ts

# Run with Node.js inspector
node --inspect-brk ./node_modules/.bin/vitest
```

### Console Output

Tests use mock console methods by default. To see actual console output:

```typescript
import { restoreConsole } from './setup'

beforeEach(() => {
  restoreConsole() // Restore real console for debugging
})
```

## 🔍 Test Examples

### Component Registry Test

```typescript
it('should mount component successfully', async () => {
  const result = await registry.mountComponent(
    mockWs,
    'TestComponent',
    { count: 5 },
    { room: 'test-room' }
  )

  expect(result.componentId).toBeTruthy()
  expect(result.initialState).toEqual({ count: 5 })
})
```

### Performance Monitor Test

```typescript
it('should detect slow renders', () => {
  monitor.recordRenderTime(componentId, 150) // Above threshold
  
  const metrics = monitor.getComponentMetrics(componentId)
  expect(metrics?.renderMetrics.slowRenderCount).toBe(1)
})
```

### Integration Test

```typescript
it('should handle complete component lifecycle', async () => {
  // Mount component
  const mountResult = await registry.mountComponent(mockWs, 'TestComponent', {})
  
  // Execute action
  const actionResult = await registry.handleMessage(mockWs, {
    type: 'CALL_ACTION',
    componentId: mountResult.componentId,
    action: 'testAction'
  })
  
  // Verify results
  expect(actionResult.success).toBe(true)
})
```

## 📝 Writing New Tests

### Test File Template

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { YourComponent } from '../YourComponent'

describe('YourComponent', () => {
  let component: YourComponent

  beforeEach(() => {
    component = new YourComponent()
  })

  afterEach(() => {
    component.cleanup()
  })

  describe('Feature Group', () => {
    it('should do something', () => {
      // Arrange
      const input = 'test'
      
      // Act
      const result = component.doSomething(input)
      
      // Assert
      expect(result).toBe('expected')
    })
  })
})
```

### Best Practices

1. **Arrange-Act-Assert** pattern
2. **Descriptive test names** that explain the scenario
3. **Proper cleanup** in afterEach hooks
4. **Mock external dependencies**
5. **Test both success and error cases**
6. **Use meaningful assertions**
7. **Keep tests focused and isolated**

## 🚨 Troubleshooting

### Common Issues

1. **Timeout Errors**: Increase timeout in test or vitest config
2. **Mock Issues**: Ensure mocks are properly cleared between tests
3. **Async Issues**: Use proper async/await patterns
4. **Memory Leaks**: Ensure proper cleanup in afterEach

### Getting Help

- Check test output for specific error messages
- Review the test setup and configuration
- Ensure all dependencies are properly mocked
- Verify test isolation and cleanup

## 📊 Performance Benchmarks

The test suite includes performance benchmarks to ensure the live components system meets performance requirements:

- **Component mounting**: < 50ms
- **Action execution**: < 100ms
- **State validation**: < 10ms
- **File upload processing**: < 200ms per chunk

Run performance tests with:

```bash
npm run test:live:perf
```