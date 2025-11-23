// 🔥 FluxStack Client Core - Main Export

// Re-export types from core/types/types.ts for convenience
export type {
  ActionNames,
  ActionParameters,
  ActionPayload,
  ActionReturn,
  ActionReturnType,
  ActiveUpload,
  BroadcastMessage,
  // Utility types
  ComponentActions,
  ComponentDefinition,
  ComponentProps,
  ComponentState,
  // Type inference system (similar to Eden Treaty)
  ExtractActions,
  // File Upload types
  FileChunkData,
  FileUploadChunkMessage,
  FileUploadCompleteMessage,
  FileUploadCompleteResponse,
  FileUploadProgressResponse,
  FileUploadStartMessage,
  HybridComponentOptions,
  // Hybrid Live Component types
  HybridState,
  InferComponentState,
  LiveComponent,
  LiveComponentInstance,
  // Live Components types
  LiveMessage,
  StateConflict,
  StateValidation,
  TypedCall,
  TypedCallAndWait,
  TypedSetValue,
  UseTypedLiveComponentReturn,
  WebSocketData,
  // WebSocket types
  WebSocketMessage,
  WebSocketResponse,
} from '../types/types'
// Hook types
export type { AdaptiveChunkConfig, ChunkMetrics } from './hooks/AdaptiveChunkSizer'
export { AdaptiveChunkSizer } from './hooks/AdaptiveChunkSizer'
export { StateValidator } from './hooks/state-validator'
export type { ChunkedUploadOptions, ChunkedUploadState } from './hooks/useChunkedUpload'
export { useChunkedUpload } from './hooks/useChunkedUpload'
// Hook return types
export type { UseHybridLiveComponentReturn } from './hooks/useHybridLiveComponent'
export { useHybridLiveComponent } from './hooks/useHybridLiveComponent'
export type { ComponentRegistry } from './hooks/useTypedLiveComponent'
export { createTypedLiveComponentHook, useTypedLiveComponent } from './hooks/useTypedLiveComponent'
// Hooks
export { useWebSocket } from './hooks/useWebSocket'
export type {
  LiveComponentsContextValue,
  LiveComponentsProviderProps,
  WebSocketContextValue,
  // Deprecated types for backward compatibility
  WebSocketProviderProps,
} from './LiveComponentsProvider'
// Live Components Provider (Singleton WebSocket Connection)
export {
  LiveComponentsProvider,
  useLiveComponents,
  useWebSocketContext,
  // Deprecated exports for backward compatibility
  WebSocketProvider,
} from './LiveComponentsProvider'
