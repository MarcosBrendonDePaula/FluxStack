/**
 * FluxLive System Types
 * 
 * Core type definitions for the FluxLive component system that enables
 * React components to communicate directly with backend server components
 * through WebSockets with hierarchical nesting and inter-component communication.
 */

/**
 * Component Identity System
 * 
 * Enhanced identity system with hierarchical component relationships,
 * deterministic ID generation, and parent-child tracking.
 */
export interface ComponentIdentity {
  /** Unique identifier for this component instance */
  componentId: string      // e.g., "dashboard-abc123" or "parent.child-def456"
  
  /** Type name of the LiveAction class */
  componentType: string    // e.g., "DashboardAction", "CounterAction"
  
  /** Runtime instance ID for server-side tracking */
  instanceId: string       // e.g., "counter-abc123-inst-xyz789"
  
  /** Client session identifier */
  clientId: string         // e.g., "client-session-456"
  
  /** State fingerprint for hydration validation */
  fingerprint: string      // e.g., "sha256-hash-of-props-and-state"
  
  /** Parent component ID for hierarchical relationships */
  parentId?: string        // e.g., "dashboard-abc123"
  
  /** Set of child component IDs */
  childIds: Set<string>    // e.g., Set(["header-def456", "sidebar-ghi789"])
  
  /** Nesting depth in component tree (0 for root components) */
  depth: number           // e.g., 0, 1, 2, 3...
  
  /** Component path in hierarchy */
  path: string            // e.g., "dashboard", "dashboard.header", "dashboard.header.userinfo"
  
  /** Timestamp when component was created */
  createdAt: number       // e.g., Date.now()
  
  /** Timestamp when component was last updated */
  updatedAt: number       // e.g., Date.now()
}

/**
 * Component Dependency System
 * 
 * Defines dependencies between components for proper initialization
 * and cleanup ordering.
 */
export interface ComponentDependency {
  /** Type of dependency relationship */
  type: 'parent' | 'sibling' | 'service' | 'state'
  
  /** ID of the component this depends on */
  dependsOn: string
  
  /** Whether this dependency is required for initialization */
  required: boolean
  
  /** Optional initialization data to pass to dependent component */
  initData?: any
}

/**
 * Component Lifecycle State
 * 
 * Tracks the current lifecycle state of a component for proper
 * initialization and cleanup ordering.
 */
export interface ComponentLifecycle {
  /** Current lifecycle state */
  state: 'creating' | 'initializing' | 'ready' | 'updating' | 'unmounting' | 'destroyed'
  
  /** Dependencies that must be resolved before initialization */
  dependencies: ComponentDependency[]
  
  /** Components that depend on this one */
  dependents: Set<string>
  
  /** Initialization promise for async setup */
  initPromise?: Promise<void>
  
  /** Cleanup functions to run on unmount */
  cleanupFns: Array<() => void | Promise<void>>
  
  /** Error that occurred during lifecycle transition */
  error?: Error
}

/**
 * Event System Types
 * 
 * Enhanced event system with hierarchical scoping, propagation control,
 * and component relationship awareness.
 */
export interface EventScope {
  /** Type of event scope for routing */
  type: 'local' | 'parent' | 'children' | 'siblings' | 'global' | 'subtree'
  
  /** Specific component IDs to target (optional) */
  componentIds?: string[]
  
  /** Maximum propagation depth for subtree events */
  maxDepth?: number
  
  /** Whether event should bubble up the component tree */
  bubble?: boolean
  
  /** Whether event should capture down the component tree */
  capture?: boolean
}

export interface LiveEvent {
  /** Unique event identifier */
  id: string
  
  /** Event type/name */
  type: string
  
  /** Event data payload */
  data?: any
  
  /** Component that emitted the event */
  sourceComponentId: string
  
  /** Target components for this event */
  targetComponentIds: Set<string>
  
  /** Event scope configuration */
  scope: EventScope
  
  /** Timestamp when event was created */
  timestamp: number
  
  /** Whether event propagation has been stopped */
  propagationStopped: boolean
  
  /** Whether default behavior has been prevented */
  defaultPrevented: boolean
  
  /** Event priority (higher numbers processed first) */
  priority: number
  
  /** Event metadata for debugging */
  metadata?: {
    componentPath?: string
    eventHistory?: string[]
    processingTime?: number
  }
}

/**
 * Event Handler Function Type
 */
export type EventHandler = (event: LiveEvent) => void | Promise<void>

/**
 * Performance Monitoring Types
 * 
 * Comprehensive performance tracking for component lifecycle,
 * updates, and resource usage.
 */
export interface ComponentMetrics {
  /** Component identifier */
  componentId: string
  
  /** Total number of updates processed */
  updateCount: number
  
  /** Average update processing time (ms) */
  avgUpdateTime: number
  
  /** Maximum update processing time (ms) */
  maxUpdateTime: number
  
  /** Total number of renders triggered */
  renderCount: number
  
  /** Average render time (ms) */
  avgRenderTime: number
  
  /** Current memory usage estimate (bytes) */
  memoryUsage: number
  
  /** Peak memory usage (bytes) */
  peakMemoryUsage: number
  
  /** Number of event listeners registered */
  eventListenerCount: number
  
  /** Number of child components */
  childCount: number
  
  /** Component health score (0-100) */
  healthScore: number
  
  /** Last update timestamp */
  lastUpdated: number
  
  /** Performance warnings/issues */
  warnings: string[]
}

/**
 * WebSocket Communication Types
 * 
 * Enhanced WebSocket message handling with deduplication,
 * batching, and hierarchical component awareness.
 */
export interface LiveMessage {
  /** Unique request identifier for deduplication */
  requestId: string
  
  /** Message timestamp */
  timestamp: number
  
  /** Client session ID */
  clientId: string
  
  /** Array of component updates in this message */
  updates: LiveUpdate[]
  
  /** Message type for routing */
  type: 'action' | 'event' | 'state' | 'batch' | 'heartbeat'
  
  /** Message priority (higher processed first) */
  priority: number
  
  /** Whether this message requires acknowledgment */
  requiresAck: boolean
}

export interface LiveUpdate {
  /** Target component ID */
  componentId: string
  
  /** Update type */
  type: 'method_call' | 'state_update' | 'event_emit' | 'lifecycle'
  
  /** Method name (for method calls) */
  methodName?: string
  
  /** Method parameters (for method calls) */
  params?: any[]
  
  /** State changes (for state updates) */
  stateChanges?: Record<string, any>
  
  /** Event data (for event emissions) */
  eventData?: {
    eventType: string
    data: any
    scope: EventScope
  }
  
  /** Lifecycle transition (for lifecycle updates) */
  lifecycle?: {
    from: ComponentLifecycle['state']
    to: ComponentLifecycle['state']
    data?: any
  }
  
  /** Update sequence number for ordering */
  sequence: number
  
  /** Whether this is an optimistic update */
  optimistic: boolean
}

/**
 * Component State Management
 * 
 * Enhanced state management with hierarchical inheritance,
 * conflict resolution, and performance optimization.
 */
export interface ComponentState {
  /** Component's local state */
  local: Record<string, any>
  
  /** State inherited from parent components */
  inherited: Record<string, any>
  
  /** Computed state derived from local and inherited */
  computed: Record<string, any>
  
  /** State keys that should be shared with children */
  shareWithChildren: string[]
  
  /** State keys that should bubble to parent */
  bubbleToParent: string[]
  
  /** State version for optimistic update tracking */
  version: number
  
  /** Pending optimistic updates */
  optimisticUpdates: Map<string, any>
  
  /** State change history for debugging */
  history: Array<{
    timestamp: number
    changes: Record<string, any>
    source: 'local' | 'inherited' | 'optimistic' | 'server'
  }>
}

/**
 * Memory Management Types
 * 
 * Advanced memory management with leak detection,
 * automatic cleanup, and resource monitoring.
 */
export interface MemoryStats {
  /** Number of active component instances */
  activeInstances: number
  
  /** Number of orphaned instances awaiting cleanup */
  orphanedInstances: number
  
  /** Total memory usage estimate (bytes) */
  totalMemoryUsage: number
  
  /** Memory usage by component type */
  memoryByType: Map<string, number>
  
  /** Detected memory leaks */
  memoryLeaks: Array<{
    componentId: string
    componentType: string
    leakType: 'instance' | 'event_listener' | 'websocket_ref' | 'state'
    severity: 'low' | 'medium' | 'high' | 'critical'
    detectedAt: number
  }>
  
  /** Cleanup operations performed */
  cleanupOperations: Array<{
    timestamp: number
    operation: string
    itemsCleanedUp: number
    memoryFreed: number
  }>
}

/**
 * Development and Debugging Types
 * 
 * Enhanced development tools integration with component tree
 * visualization, performance profiling, and debugging utilities.
 */
export interface ComponentDebugInfo {
  /** Component tree structure */
  tree: {
    parent: ComponentIdentity | null
    children: ComponentIdentity[]
    siblings: ComponentIdentity[]
    ancestors: ComponentIdentity[]
    descendants: ComponentIdentity[]
  }
  
  /** Current component state with history */
  state: ComponentState
  
  /** Performance metrics */
  metrics: ComponentMetrics
  
  /** Recent events */
  recentEvents: LiveEvent[]
  
  /** Component lifecycle information */
  lifecycle: ComponentLifecycle
  
  /** WebSocket connection status */
  connection: {
    status: 'connected' | 'disconnected' | 'connecting' | 'reconnecting'
    lastHeartbeat: number
    messagesSent: number
    messagesReceived: number
    errors: Array<{timestamp: number, error: string}>
  }
  
  /** Development warnings and suggestions */
  devWarnings: Array<{
    type: 'performance' | 'memory' | 'best_practice' | 'deprecation'
    message: string
    severity: 'info' | 'warning' | 'error'
    timestamp: number
  }>
}

/**
 * Enhanced useLive Hook Types
 * 
 * Complete type definitions for the enhanced useLive hook with
 * hierarchical component support, performance optimization,
 * and advanced communication patterns.
 */
export interface UseLiveOptions {
  /** Component type name (LiveAction class name) */
  name: string
  
  /** Initial props to pass to component */
  props?: Record<string, any>
  
  /** Custom component ID (optional, auto-generated if not provided) */
  componentId?: string
  
  /** Parent component ID for hierarchical relationships */
  parentId?: string
  
  /** Props to automatically pass to child components */
  childProps?: Record<string, any>
  
  /** State keys to inherit from parent component */
  inheritFromParent?: string[]
  
  /** Enable communication with parent component */
  emitToParent?: boolean
  
  /** Enable communication with child components */
  emitToChildren?: boolean
  
  /** Enable event bubbling up the component tree */
  bubbleEvents?: boolean
  
  /** Event handlers for component events */
  eventHandlers?: Record<string, EventHandler>
  
  /** Zustand global state integration */
  globalState?: {
    selector: (state: any) => any
    updater?: (localState: any, globalState: any) => void
  }
  
  /** Performance options */
  performance?: {
    optimisticUpdates?: boolean
    debounceMs?: number
    throttleMs?: number
    enableMetrics?: boolean
  }
  
  /** Development options */
  development?: {
    debug?: boolean
    devtools?: boolean
    enableWarnings?: boolean
  }
  
  /** Advanced options */
  advanced?: {
    retryOnError?: boolean
    persistState?: boolean
    maxRetries?: number
    retryDelayMs?: number
  }
}

export interface UseLiveResult<TState = any, TActions = any> {
  /** Current component state */
  state: TState
  
  /** Loading state indicator */
  loading: boolean
  
  /** Error state (null if no error) */
  error: string | null
  
  /** WebSocket connection status */
  connected: boolean
  
  /** Call server-side component method */
  callMethod: (method: keyof TActions, ...args: any[]) => Promise<any>
  
  /** Emit event to other components */
  emit: (event: string, data?: any, scope?: EventScope) => void
  
  /** Subscribe to events */
  subscribe: (event: string, handler: EventHandler) => () => void
  
  /** Reset component to initial state */
  reset: () => void
  
  /** Perform optimistic update */
  optimisticUpdate: (updater: (state: TState) => TState) => void
  
  /** Global state (if globalState option provided) */
  globalState: any
  
  /** Update global state */
  updateGlobal: (updater: (global: any) => void) => void
  
  /** Hierarchical communication methods */
  communication: {
    /** Emit event to parent component */
    emitToParent: (event: string, data?: any) => void
    
    /** Emit event to child components */
    emitToChildren: (event: string, data?: any) => void
    
    /** Emit event to sibling components */
    emitToSiblings: (event: string, data?: any) => void
    
    /** Subscribe to parent events */
    subscribeToParent: (event: string, handler: EventHandler) => () => void
    
    /** Subscribe to children events */
    subscribeToChildren: (event: string, handler: EventHandler) => () => void
  }
  
  /** Component metadata */
  meta: {
    componentId: string
    instanceId: string
    parentId?: string
    childIds: string[]
    path: string
    depth: number
  }
  
  /** Component tree information */
  tree: {
    parent: ComponentIdentity | null
    children: ComponentIdentity[]
    siblings: ComponentIdentity[]
  }
  
  /** Development debugging information */
  __debug?: ComponentDebugInfo
}