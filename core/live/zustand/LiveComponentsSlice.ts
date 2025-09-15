/**
 * LiveComponentsSlice
 * 
 * Zustand store slice for managing LiveAction components global state.
 * Provides centralized state management, synchronization, and persistence.
 * 
 * Features:
 * - Component registration and lifecycle management
 * - Global state synchronization with local component state
 * - Event tracking and performance metrics
 * - State persistence and hydration
 * - Conflict resolution between local and global state
 */

import type { StateCreator } from 'zustand'
import type { Logger } from '../../types'

/**
 * Component state entry in the global store
 */
export interface ComponentStateEntry {
  /** Component unique identifier */
  id: string
  
  /** Component type/class name */
  type: string
  
  /** Current component state */
  state: Record<string, any>
  
  /** Component metadata */
  metadata: {
    /** Parent component ID */
    parentId?: string
    
    /** Child component IDs */
    childIds: string[]
    
    /** Component creation timestamp */
    createdAt: number
    
    /** Last update timestamp */
    updatedAt: number
    
    /** Component hierarchy depth */
    depth: number
    
    /** Component path in hierarchy */
    path: string
    
    /** Whether component is currently active */
    isActive: boolean
    
    /** Component props snapshot */
    props: Record<string, any>
  }
  
  /** State synchronization settings */
  sync: {
    /** Enable sync with global state */
    enabled: boolean
    
    /** Sync direction: 'bidirectional' | 'toGlobal' | 'fromGlobal' */
    direction: 'bidirectional' | 'toGlobal' | 'fromGlobal'
    
    /** State keys to sync (empty array = all keys) */
    syncKeys: string[]
    
    /** State keys to exclude from sync */
    excludeKeys: string[]
    
    /** Conflict resolution strategy */
    conflictResolution: ConflictResolutionStrategy
    
    /** Last sync timestamp */
    lastSync: number
  }
}

/**
 * Global event entry
 */
export interface GlobalEvent {
  /** Event unique ID */
  id: string
  
  /** Event type */
  type: string
  
  /** Event name */
  name: string
  
  /** Source component ID */
  sourceId: string
  
  /** Target component ID(s) */
  targetIds: string[]
  
  /** Event payload */
  payload: Record<string, any>
  
  /** Event timestamp */
  timestamp: number
  
  /** Event priority */
  priority: 'low' | 'normal' | 'high' | 'critical'
  
  /** Event scope */
  scope: 'local' | 'parent' | 'children' | 'siblings' | 'global' | 'subtree'
  
  /** Event status */
  status: 'pending' | 'processing' | 'completed' | 'failed'
  
  /** Processing results */
  results?: {
    /** Successfully processed targets */
    success: string[]
    
    /** Failed targets with errors */
    failed: Array<{ targetId: string; error: string }>
    
    /** Processing duration */
    duration: number
  }
}

/**
 * Performance metrics for global state
 */
export interface GlobalPerformanceMetrics {
  /** Total components registered */
  totalComponents: number
  
  /** Currently active components */
  activeComponents: number
  
  /** Total state updates */
  totalStateUpdates: number
  
  /** Total events processed */
  totalEventsProcessed: number
  
  /** Average update latency (ms) */
  averageUpdateLatency: number
  
  /** Memory usage estimate (bytes) */
  memoryUsage: number
  
  /** Sync conflicts detected */
  syncConflicts: number
  
  /** Performance score (0-1) */
  performanceScore: number
  
  /** Last metrics update */
  lastUpdate: number
}

/**
 * Conflict resolution strategies
 */
export type ConflictResolutionStrategy = 
  | 'localWins'      // Local state takes precedence
  | 'globalWins'     // Global state takes precedence
  | 'lastWriteWins'  // Most recent update wins
  | 'merge'          // Attempt to merge states
  | 'manual'         // Require manual resolution

/**
 * State persistence configuration
 */
export interface PersistenceConfig {
  /** Enable state persistence */
  enabled: boolean
  
  /** Storage backend */
  storage: 'localStorage' | 'sessionStorage' | 'indexedDB' | 'custom'
  
  /** Persistence key */
  key: string
  
  /** Components to persist (empty = all) */
  persistComponents: string[]
  
  /** State keys to persist (empty = all) */
  persistKeys: string[]
  
  /** Exclude keys from persistence */
  excludeKeys: string[]
  
  /** Debounce persistence writes (ms) */
  debounceMs: number
  
  /** Custom storage adapter */
  customStorage?: {
    getItem: (key: string) => Promise<string | null>
    setItem: (key: string, value: string) => Promise<void>
    removeItem: (key: string) => Promise<void>
  }
}

/**
 * Store slice state
 */
export interface LiveComponentsSliceState {
  /** Registered components */
  components: Map<string, ComponentStateEntry>
  
  /** Global event queue */
  events: GlobalEvent[]
  
  /** Performance metrics */
  metrics: GlobalPerformanceMetrics
  
  /** Persistence configuration */
  persistence: PersistenceConfig
  
  /** Global configuration */
  config: {
    /** Maximum events to keep in history */
    maxEventHistory: number
    
    /** Event cleanup interval (ms) */
    eventCleanupInterval: number
    
    /** Metrics update interval (ms) */
    metricsUpdateInterval: number
    
    /** Enable debug logging */
    debugMode: boolean
    
    /** Logger instance */
    logger?: Logger
  }
  
  /** Subscriptions for component state changes */
  subscriptions: Map<string, Set<(state: Record<string, any>) => void>>
  
  /** Conflict queue for manual resolution */
  conflicts: Array<{
    id: string
    componentId: string
    localState: Record<string, any>
    globalState: Record<string, any>
    timestamp: number
  }>
}

/**
 * Store slice actions
 */
export interface LiveComponentsSliceActions {
  // Component Management
  registerComponent: (
    id: string,
    type: string,
    initialState: Record<string, any>,
    metadata: Partial<ComponentStateEntry['metadata']>,
    syncConfig?: Partial<ComponentStateEntry['sync']>
  ) => void
  
  unregisterComponent: (id: string) => void
  
  updateComponentState: (
    id: string,
    newState: Record<string, any>,
    source?: 'local' | 'global'
  ) => void
  
  getComponentState: (id: string) => Record<string, any> | undefined
  
  // Component Hierarchy
  setParentChild: (parentId: string, childId: string) => void
  removeParentChild: (parentId: string, childId: string) => void
  getComponentHierarchy: (id: string) => {
    parent?: ComponentStateEntry
    children: ComponentStateEntry[]
    siblings: ComponentStateEntry[]
    ancestors: ComponentStateEntry[]
    descendants: ComponentStateEntry[]
  }
  
  // State Synchronization
  syncComponentState: (id: string, direction?: 'toGlobal' | 'fromGlobal') => void
  enableSync: (id: string, config: Partial<ComponentStateEntry['sync']>) => void
  disableSync: (id: string) => void
  
  // Event Management
  emitEvent: (event: Omit<GlobalEvent, 'id' | 'timestamp' | 'status'>) => string
  processEvent: (eventId: string) => Promise<void>
  getEvents: (filters?: {
    sourceId?: string
    targetId?: string
    type?: string
    status?: GlobalEvent['status']
    since?: number
  }) => GlobalEvent[]
  clearEvents: (before?: number) => void
  
  // Conflict Resolution
  resolveConflict: (
    conflictId: string,
    resolution: 'local' | 'global' | 'merge',
    mergedState?: Record<string, any>
  ) => void
  getConflicts: (componentId?: string) => typeof LiveComponentsSliceState.prototype.conflicts
  
  // Subscriptions
  subscribe: (componentId: string, callback: (state: Record<string, any>) => void) => () => void
  
  // Metrics
  updateMetrics: () => void
  getMetrics: () => GlobalPerformanceMetrics
  
  // Persistence
  configurePersistence: (config: Partial<PersistenceConfig>) => void
  saveState: () => Promise<void>
  loadState: () => Promise<void>
  clearPersistedState: () => Promise<void>
  
  // Debugging
  getDebugInfo: () => {
    componentCount: number
    eventCount: number
    conflictCount: number
    memoryUsage: number
    performance: GlobalPerformanceMetrics
  }
  exportState: () => string
  importState: (stateJson: string) => void
}

/**
 * Combined slice type
 */
export type LiveComponentsSlice = LiveComponentsSliceState & LiveComponentsSliceActions

/**
 * Create LiveComponents slice for Zustand store
 */
export const createLiveComponentsSlice: StateCreator<
  LiveComponentsSlice,
  [],
  [],
  LiveComponentsSlice
> = (set, get) => {
  const initialState = {
    // Initial State
    components: new Map(),
    events: [],
    metrics: {
      totalComponents: 0,
      activeComponents: 0,
      totalStateUpdates: 0,
      totalEventsProcessed: 0,
      averageUpdateLatency: 0,
      memoryUsage: 0,
      syncConflicts: 0,
      performanceScore: 1,
      lastUpdate: Date.now()
    },
    persistence: {
      enabled: false,
      storage: 'localStorage',
      key: 'fluxlive-components',
      persistComponents: [],
      persistKeys: [],
      excludeKeys: ['__internal'],
      debounceMs: 1000
    },
    config: {
      maxEventHistory: 1000,
      eventCleanupInterval: 5 * 60 * 1000, // 5 minutes
      metricsUpdateInterval: 30 * 1000, // 30 seconds
      debugMode: process.env.NODE_ENV === 'development'
    },
    subscriptions: new Map(),
    conflicts: [],
  }

  return {
    ...initialState,

  // Component Management Actions
  registerComponent: (id, type, initialState, metadata = {}, syncConfig = {}) => {
    set((state) => {
      const now = Date.now()
      const component: ComponentStateEntry = {
        id,
        type,
        state: { ...initialState },
        metadata: {
          parentId: undefined,
          childIds: [],
          createdAt: now,
          updatedAt: now,
          depth: 0,
          path: id,
          isActive: true,
          props: {},
          ...metadata
        },
        sync: {
          enabled: true,
          direction: 'bidirectional',
          syncKeys: [],
          excludeKeys: [],
          conflictResolution: 'lastWriteWins',
          lastSync: now,
          ...syncConfig
        }
      }
      
      const newComponents = new Map(state.components)
      newComponents.set(id, component)
      
      return {
        ...state,
        components: newComponents,
        metrics: {
          ...state.metrics,
          totalComponents: state.metrics.totalComponents + 1,
          activeComponents: state.metrics.activeComponents + 1
        }
      }
    })
  },

  unregisterComponent: (id) => {
    set((state) => {
      const component = state.components.get(id)
      if (!component) return state
      
      const newComponents = new Map(state.components)
      const newSubscriptions = new Map(state.subscriptions)
      
      // Remove from parent's children
      if (component.metadata.parentId) {
        const parent = newComponents.get(component.metadata.parentId)
        if (parent) {
          const updatedParent = {
            ...parent,
            metadata: {
              ...parent.metadata,
              childIds: parent.metadata.childIds.filter(childId => childId !== id)
            }
          }
          newComponents.set(component.metadata.parentId, updatedParent)
        }
      }
      
      // Update children's parent reference
      component.metadata.childIds.forEach(childId => {
        const child = newComponents.get(childId)
        if (child) {
          const updatedChild = {
            ...child,
            metadata: {
              ...child.metadata,
              parentId: undefined
            }
          }
          newComponents.set(childId, updatedChild)
        }
      })
      
      newComponents.delete(id)
      newSubscriptions.delete(id)
      
      // Remove conflicts for this component
      const newConflicts = state.conflicts.filter(conflict => conflict.componentId !== id)
      
      return {
        ...state,
        components: newComponents,
        subscriptions: newSubscriptions,
        conflicts: newConflicts,
        metrics: {
          ...state.metrics,
          activeComponents: Math.max(0, state.metrics.activeComponents - 1)
        }
      }
    })
  },

  updateComponentState: (id, newState, source = 'local') => {
    set((state) => {
      const component = state.components.get(id)
      if (!component) return state
      
      const now = Date.now()
      const newComponents = new Map(state.components)
      
      const updatedComponent = {
        ...component,
        state: { ...component.state, ...newState },
        metadata: {
          ...component.metadata,
          updatedAt: now
        },
        sync: {
          ...component.sync,
          lastSync: now
        }
      }
      
      newComponents.set(id, updatedComponent)
      
      // Notify subscribers
      const subscribers = state.subscriptions.get(id)
      if (subscribers) {
        subscribers.forEach(callback => {
          try {
            callback(updatedComponent.state)
          } catch (error) {
            if (state.config.logger) {
              state.config.logger.error('Subscription callback error', { id, error })
            }
          }
        })
      }
      
      return {
        ...state,
        components: newComponents,
        metrics: {
          ...state.metrics,
          totalStateUpdates: state.metrics.totalStateUpdates + 1
        }
      }
    })
  },

  getComponentState: (id) => {
    const component = get().components.get(id)
    return component ? { ...component.state } : undefined
  },

  // Hierarchy Management
  setParentChild: (parentId, childId) => {
    set((state) => {
      const parent = state.components.get(parentId)
      const child = state.components.get(childId)
      
      if (!parent || !child) return
      
      // Remove child from previous parent if any
      if (child.metadata.parentId && child.metadata.parentId !== parentId) {
        const oldParent = state.components.get(child.metadata.parentId)
        if (oldParent) {
          oldParent.metadata.childIds = oldParent.metadata.childIds.filter(id => id !== childId)
        }
      }
      
      // Set new relationships
      child.metadata.parentId = parentId
      if (!parent.metadata.childIds.includes(childId)) {
        parent.metadata.childIds.push(childId)
      }
      
      // Update depth and path
      child.metadata.depth = parent.metadata.depth + 1
      child.metadata.path = `${parent.metadata.path}.${childId}`
    })
  },

  removeParentChild: (parentId, childId) => {
    set((state) => {
      const parent = state.components.get(parentId)
      const child = state.components.get(childId)
      
      if (!parent || !child) return
      
      parent.metadata.childIds = parent.metadata.childIds.filter(id => id !== childId)
      child.metadata.parentId = undefined
      child.metadata.depth = 0
      child.metadata.path = childId
    })
  },

  getComponentHierarchy: (id) => {
    const state = get()
    const component = state.components.get(id)
    if (!component) {
      return { children: [], siblings: [], ancestors: [], descendants: [] }
    }
    
    const parent = component.metadata.parentId 
      ? state.components.get(component.metadata.parentId)
      : undefined
    
    const children = component.metadata.childIds
      .map(childId => state.components.get(childId))
      .filter(Boolean) as ComponentStateEntry[]
    
    const siblings = parent
      ? parent.metadata.childIds
          .filter(siblingId => siblingId !== id)
          .map(siblingId => state.components.get(siblingId))
          .filter(Boolean) as ComponentStateEntry[]
      : []
    
    // Get ancestors (walking up the tree)
    const ancestors: ComponentStateEntry[] = []
    let currentParent = parent
    while (currentParent) {
      ancestors.push(currentParent)
      currentParent = currentParent.metadata.parentId 
        ? state.components.get(currentParent.metadata.parentId)
        : undefined
    }
    
    // Get descendants (walking down the tree)
    const descendants: ComponentStateEntry[] = []
    const addDescendants = (comp: ComponentStateEntry) => {
      comp.metadata.childIds.forEach(childId => {
        const child = state.components.get(childId)
        if (child) {
          descendants.push(child)
          addDescendants(child)
        }
      })
    }
    addDescendants(component)
    
    return { parent, children, siblings, ancestors, descendants }
  },

  // State Synchronization
  syncComponentState: (id, direction = 'bidirectional') => {
    const state = get()
    const component = state.components.get(id)
    if (!component || !component.sync.enabled) return
    
    // Sync implementation would be handled by the component itself
    // This method primarily updates the last sync timestamp
    set((state) => {
      const comp = state.components.get(id)
      if (comp) {
        comp.sync.lastSync = Date.now()
      }
    })
  },

  enableSync: (id, config) => {
    set((state) => {
      const component = state.components.get(id)
      if (component) {
        component.sync = { ...component.sync, ...config, enabled: true }
      }
    })
  },

  disableSync: (id) => {
    set((state) => {
      const component = state.components.get(id)
      if (component) {
        component.sync.enabled = false
      }
    })
  },

  // Event Management
  emitEvent: (event) => {
    const eventId = `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const fullEvent: GlobalEvent = {
      ...event,
      id: eventId,
      timestamp: Date.now(),
      status: 'pending'
    }
    
    set((state) => {
      state.events.push(fullEvent)
      
      // Cleanup old events if necessary
      if (state.events.length > state.config.maxEventHistory) {
        state.events = state.events.slice(-state.config.maxEventHistory)
      }
    })
    
    return eventId
  },

  processEvent: async (eventId) => {
    const state = get()
    const event = state.events.find(e => e.id === eventId)
    if (!event || event.status !== 'pending') return
    
    set((state) => {
      const evt = state.events.find(e => e.id === eventId)
      if (evt) {
        evt.status = 'processing'
      }
    })
    
    const startTime = Date.now()
    const success: string[] = []
    const failed: Array<{ targetId: string; error: string }> = []
    
    // Process event for each target
    for (const targetId of event.targetIds) {
      try {
        const component = state.components.get(targetId)
        if (!component) {
          failed.push({ targetId, error: 'Component not found' })
          continue
        }
        
        // Event processing logic would be implemented here
        // For now, just mark as successful
        success.push(targetId)
        
      } catch (error) {
        failed.push({ 
          targetId, 
          error: error instanceof Error ? error.message : String(error) 
        })
      }
    }
    
    set((state) => {
      const evt = state.events.find(e => e.id === eventId)
      if (evt) {
        evt.status = failed.length === 0 ? 'completed' : 'failed'
        evt.results = {
          success,
          failed,
          duration: Date.now() - startTime
        }
        state.metrics.totalEventsProcessed++
      }
    })
  },

  getEvents: (filters = {}) => {
    const state = get()
    let events = [...state.events]
    
    if (filters.sourceId) {
      events = events.filter(e => e.sourceId === filters.sourceId)
    }
    if (filters.targetId) {
      events = events.filter(e => e.targetIds.includes(filters.targetId))
    }
    if (filters.type) {
      events = events.filter(e => e.type === filters.type)
    }
    if (filters.status) {
      events = events.filter(e => e.status === filters.status)
    }
    if (filters.since) {
      events = events.filter(e => e.timestamp >= filters.since)
    }
    
    return events
  },

  clearEvents: (before) => {
    set((state) => {
      if (before) {
        state.events = state.events.filter(e => e.timestamp >= before)
      } else {
        state.events = []
      }
    })
  },

  // Conflict Resolution
  resolveConflict: (conflictId, resolution, mergedState) => {
    set((state) => {
      const conflictIndex = state.conflicts.findIndex(c => c.id === conflictId)
      if (conflictIndex === -1) return
      
      const conflict = state.conflicts[conflictIndex]
      const component = state.components.get(conflict.componentId)
      if (!component) return
      
      let resolvedState: Record<string, any>
      
      switch (resolution) {
        case 'local':
          resolvedState = conflict.localState
          break
        case 'global':
          resolvedState = conflict.globalState
          break
        case 'merge':
          resolvedState = mergedState || { ...conflict.globalState, ...conflict.localState }
          break
        default:
          return
      }
      
      component.state = { ...component.state, ...resolvedState }
      component.metadata.updatedAt = Date.now()
      
      // Remove resolved conflict
      state.conflicts.splice(conflictIndex, 1)
    })
  },

  getConflicts: (componentId) => {
    const state = get()
    return componentId 
      ? state.conflicts.filter(c => c.componentId === componentId)
      : [...state.conflicts]
  },

  // Subscriptions
  subscribe: (componentId, callback) => {
    set((state) => {
      if (!state.subscriptions.has(componentId)) {
        state.subscriptions.set(componentId, new Set())
      }
      state.subscriptions.get(componentId)!.add(callback)
    })
    
    return () => {
      set((state) => {
        const subs = state.subscriptions.get(componentId)
        if (subs) {
          subs.delete(callback)
          if (subs.size === 0) {
            state.subscriptions.delete(componentId)
          }
        }
      })
    }
  },

  // Metrics
  updateMetrics: () => {
    set((state) => {
      const now = Date.now()
      const components = Array.from(state.components.values())
      
      state.metrics = {
        ...state.metrics,
        totalComponents: components.length,
        activeComponents: components.filter(c => c.metadata.isActive).length,
        memoryUsage: estimateMemoryUsage(state),
        performanceScore: calculatePerformanceScore(state),
        lastUpdate: now
      }
    })
  },

  getMetrics: () => {
    return { ...get().metrics }
  },

  // Persistence
  configurePersistence: (config) => {
    set((state) => {
      state.persistence = { ...state.persistence, ...config }
    })
  },

  saveState: async () => {
    const state = get()
    if (!state.persistence.enabled) return
    
    try {
      const dataToSave = {
        components: Array.from(state.components.entries()),
        timestamp: Date.now()
      }
      
      const serialized = JSON.stringify(dataToSave)
      
      if (state.persistence.customStorage) {
        await state.persistence.customStorage.setItem(state.persistence.key, serialized)
      } else {
        const storage = state.persistence.storage === 'sessionStorage' 
          ? sessionStorage 
          : localStorage
        storage.setItem(state.persistence.key, serialized)
      }
    } catch (error) {
      if (state.config.logger) {
        state.config.logger.error('Failed to save state', { error })
      }
    }
  },

  loadState: async () => {
    const state = get()
    if (!state.persistence.enabled) return
    
    try {
      let serialized: string | null = null
      
      if (state.persistence.customStorage) {
        serialized = await state.persistence.customStorage.getItem(state.persistence.key)
      } else {
        const storage = state.persistence.storage === 'sessionStorage' 
          ? sessionStorage 
          : localStorage
        serialized = storage.getItem(state.persistence.key)
      }
      
      if (serialized) {
        const data = JSON.parse(serialized)
        set((state) => {
          state.components = new Map(data.components)
          state.metrics.totalComponents = state.components.size
          state.metrics.activeComponents = Array.from(state.components.values())
            .filter(c => c.metadata.isActive).length
        })
      }
    } catch (error) {
      if (state.config.logger) {
        state.config.logger.error('Failed to load state', { error })
      }
    }
  },

  clearPersistedState: async () => {
    const state = get()
    
    try {
      if (state.persistence.customStorage) {
        await state.persistence.customStorage.removeItem(state.persistence.key)
      } else {
        const storage = state.persistence.storage === 'sessionStorage' 
          ? sessionStorage 
          : localStorage
        storage.removeItem(state.persistence.key)
      }
    } catch (error) {
      if (state.config.logger) {
        state.config.logger.error('Failed to clear persisted state', { error })
      }
    }
  },

  // Debugging
  getDebugInfo: () => {
    const state = get()
    return {
      componentCount: state.components.size,
      eventCount: state.events.length,
      conflictCount: state.conflicts.length,
      memoryUsage: estimateMemoryUsage(state),
      performance: state.metrics
    }
  },

  exportState: () => {
    const state = get()
    return JSON.stringify({
      components: Array.from(state.components.entries()),
      events: state.events,
      metrics: state.metrics,
      conflicts: state.conflicts,
      timestamp: Date.now()
    }, null, 2)
  },

  importState: (stateJson) => {
    try {
      const data = JSON.parse(stateJson)
      set((state) => {
        state.components = new Map(data.components || [])
        state.events = data.events || []
        state.metrics = { ...state.metrics, ...data.metrics }
        state.conflicts = data.conflicts || []
      })
    } catch (error) {
      const state = get()
      if (state.config.logger) {
        state.config.logger.error('Failed to import state', { error })
      }
    }
  }
  }
}

/**
 * Helper function to resolve state conflicts
 */
function resolveStateConflict(
  globalState: Record<string, any>,
  localState: Record<string, any>,
  strategy: ConflictResolutionStrategy
): Record<string, any> {
  switch (strategy) {
    case 'localWins':
      return localState
    case 'globalWins':
      return globalState
    case 'lastWriteWins':
      // In this context, local is the "last write"
      return localState
    case 'merge':
      return { ...globalState, ...localState }
    default:
      return localState
  }
}

/**
 * Estimate memory usage of the store state
 */
function estimateMemoryUsage(state: LiveComponentsSliceState): number {
  // Rough estimation - in production this would be more sophisticated
  const componentSize = state.components.size * 1024 // 1KB per component
  const eventSize = state.events.length * 512 // 512 bytes per event
  const conflictSize = state.conflicts.length * 256 // 256 bytes per conflict
  
  return componentSize + eventSize + conflictSize
}

/**
 * Calculate performance score based on various metrics
 */
function calculatePerformanceScore(state: LiveComponentsSliceState): number {
  const now = Date.now()
  const timeSinceLastUpdate = now - state.metrics.lastUpdate
  
  // Factors that affect performance score
  const updateFrequencyScore = Math.min(1, 10000 / Math.max(timeSinceLastUpdate, 1)) // Prefer recent updates
  const conflictScore = Math.max(0, 1 - (state.conflicts.length / 10)) // Penalize conflicts
  const memoryScore = Math.max(0, 1 - (state.metrics.memoryUsage / (10 * 1024 * 1024))) // Penalize high memory usage
  
  return (updateFrequencyScore + conflictScore + memoryScore) / 3
}