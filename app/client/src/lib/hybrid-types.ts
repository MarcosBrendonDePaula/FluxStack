// 🔥 Hybrid Live Components - Type definitions

export interface StateValidation {
  checksum: string
  version: number
  lastSync: number
  source: 'client' | 'server' | 'merged'
}

export interface StateConflict<T = any> {
  field: keyof T
  clientValue: any
  serverValue: any
  resolution: 'client' | 'server' | 'merge' | 'manual'
}

export interface HybridState<T = any> {
  data: T
  validation: StateValidation
  conflicts: StateConflict<T>[]
  status: 'synced' | 'pending' | 'conflict' | 'disconnected'
}

export interface SyncResult<T = any> {
  success: boolean
  state?: T
  conflicts?: StateConflict<T>[]
  error?: string
}

export interface HybridComponentOptions {
  // Live Component options
  room?: string
  userId?: string
  autoMount?: boolean
  debug?: boolean
  
  // Hybrid options
  enableValidation?: boolean
  conflictResolution?: 'auto' | 'manual'
  syncStrategy?: 'optimistic' | 'pessimistic'
  fallbackToLocal?: boolean
}