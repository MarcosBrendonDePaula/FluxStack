// 🔥 FluxStack Live Components - Core Exports

// Shared types and classes
export * from './shared/types'

// Client-side exports
export { useWebSocket } from './client/useWebSocket'
export { useHybridLiveComponent } from './client/useHybridLiveComponent'
export { StateValidator } from './client/state-validator'

// Server-side exports
export { ComponentRegistry } from './server/ComponentRegistry'

// Re-export core types for convenience
export type {
  LiveMessage,
  ComponentState,
  LiveComponentInstance,
  WebSocketData,
  ComponentDefinition,
  BroadcastMessage,
  WebSocketMessage,
  WebSocketResponse,
  HybridState,
  StateValidation,
  StateConflict,
  HybridComponentOptions
} from './shared/types'