// 🔥 Hybrid Live Components - Type definitions

export interface StateValidation {
  checksum: string
  version: number
  lastSync: number
  source: 'server' | 'mount'
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
  status: 'synced' | 'disconnected'
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
  
  // Simplified options (server-only model)
  fallbackToLocal?: boolean
}