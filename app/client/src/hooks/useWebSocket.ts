// 🔥 WebSocket Hook for Live Components (Deprecated - Use @/core/client/hooks)

import { 
  useWebSocket as coreUseWebSocket,
  type WebSocketMessage,
  type WebSocketResponse,
  type UseWebSocketOptions,
  type UseWebSocketReturn
} from '@/core/client/hooks/useWebSocket'

// Re-export from core for backward compatibility
export { coreUseWebSocket as useWebSocket }
export type { WebSocketMessage, WebSocketResponse, UseWebSocketOptions, UseWebSocketReturn }