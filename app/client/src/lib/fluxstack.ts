// 🔥 FluxStack Client Library - Easy Imports
// This file provides a simple way to import FluxStack client functionality

// Re-export everything from core/client for easy access
export * from '../../../../core/client'

// Commonly used imports with shorter names
export { 
  useHybridLiveComponent as useLive,
  useWebSocket as useWS,
  StateValidator as Validator
} from '../../../../core/client'