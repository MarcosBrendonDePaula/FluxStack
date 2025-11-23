// 🔥 FluxStack Client Library - Main Entry Point
// This is the primary interface for all FluxStack client functionality

// Re-export everything from the main index
export * from './index'

// Convenience aliases for common hooks and utilities
export {
  StateValidator as Validator,
  useChunkedUpload as useUpload,
  useHybridLiveComponent as useLive,
  useWebSocket as useWS,
} from './index'

// Default export for easy importing
import * as FluxStack from './index'
export default FluxStack
