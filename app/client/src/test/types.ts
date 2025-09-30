/**
 * Test Types
 * Type definitions for testing utilities
 */

import '@testing-library/jest-dom'

declare global {
  namespace Vi {
    interface JestAssertion<T = any> extends jest.Matchers<void, T> {}
  }
}