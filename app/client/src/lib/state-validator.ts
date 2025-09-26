// 🔥 State Validation Utilities

import type { StateValidation, StateConflict, HybridState } from './hybrid-types'

export class StateValidator {
  /**
   * Generate checksum for state object
   */
  static generateChecksum(state: any): string {
    const json = JSON.stringify(state, Object.keys(state).sort())
    let hash = 0
    for (let i = 0; i < json.length; i++) {
      const char = json.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16)
  }

  /**
   * Create validation metadata
   */
  static createValidation(
    state: any, 
    source: 'client' | 'server' | 'merged' = 'client'
  ): StateValidation {
    return {
      checksum: this.generateChecksum(state),
      version: Date.now(),
      lastSync: Date.now(),
      source
    }
  }

  /**
   * Compare two states and detect conflicts
   */
  static detectConflicts<T>(
    clientState: T, 
    serverState: T,
    excludeFields: (keyof T)[] = ['lastUpdated', 'version']
  ): StateConflict<T>[] {
    const conflicts: StateConflict<T>[] = []
    
    const clientKeys = Object.keys(clientState as any) as (keyof T)[]
    const serverKeys = Object.keys(serverState as any) as (keyof T)[]
    const allKeys = new Set([...clientKeys, ...serverKeys])

    for (const key of allKeys) {
      if (excludeFields.includes(key)) continue

      const clientValue = (clientState as any)?.[key]
      const serverValue = (serverState as any)?.[key]

      if (JSON.stringify(clientValue) !== JSON.stringify(serverValue)) {
        conflicts.push({
          field: key,
          clientValue,
          serverValue,
          resolution: 'server' // Default to server wins
        })
      }
    }

    return conflicts
  }

  /**
   * Merge states with conflict resolution
   */
  static mergeStates<T>(
    clientState: T,
    serverState: T,
    conflicts: StateConflict<T>[],
    strategy: 'client' | 'server' | 'smart' = 'smart'
  ): T {
    const merged = { ...clientState }

    for (const conflict of conflicts) {
      switch (strategy) {
        case 'client':
          // Keep client value
          break
        
        case 'server':
          (merged as any)[conflict.field] = conflict.serverValue
          break
          
        case 'smart':
          // Smart resolution based on field type and context
          if (conflict.field === 'lastUpdated') {
            // Server timestamp wins
            (merged as any)[conflict.field] = conflict.serverValue
          } else if (typeof conflict.serverValue === 'number' && typeof conflict.clientValue === 'number') {
            // For numbers, use the higher value (e.g., counters)
            (merged as any)[conflict.field] = Math.max(conflict.serverValue, conflict.clientValue)
          } else {
            // Default to server for other types
            (merged as any)[conflict.field] = conflict.serverValue
          }
          break
      }
    }

    return merged
  }

  /**
   * Validate state integrity
   */
  static validateState<T>(hybridState: HybridState<T>): boolean {
    const currentChecksum = this.generateChecksum(hybridState.data)
    return currentChecksum === hybridState.validation.checksum
  }

  /**
   * Update validation after state change
   */
  static updateValidation<T>(
    hybridState: HybridState<T>,
    source: 'client' | 'server' | 'merged' = 'client'
  ): HybridState<T> {
    return {
      ...hybridState,
      validation: this.createValidation(hybridState.data, source),
      status: 'synced'
    }
  }
}