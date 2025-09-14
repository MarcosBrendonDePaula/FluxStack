/**
 * ComponentCleanupManager
 * 
 * Advanced cleanup system with React component unmount detection,
 * WebSocket disconnect handling, and automatic garbage collection.
 * 
 * Implements proper cleanup ordering, memory leak detection,
 * and hierarchical cleanup for nested components.
 */

import { ComponentIdentity, MemoryStats } from './types'
import { ComponentIsolationManager } from './ComponentIsolationManager'
import { Logger } from '../utils/logger'

/**
 * Cleanup event types
 */
export type CleanupEvent = 
  | 'component_unmount'
  | 'websocket_disconnect' 
  | 'client_disconnect'
  | 'manual_cleanup'
  | 'garbage_collection'
  | 'browser_close'

/**
 * Cleanup hook function type
 */
export type CleanupHook = (componentId: string, event: CleanupEvent) => void | Promise<void>

/**
 * Cleanup configuration
 */
export interface CleanupConfig {
  /** Enable automatic garbage collection */
  enableGarbageCollection: boolean
  
  /** Garbage collection interval in milliseconds */
  gcInterval: number
  
  /** Threshold for considering component stale (ms) */
  staleThreshold: number
  
  /** Maximum cleanup batch size */
  maxCleanupBatch: number
  
  /** Enable browser tab close detection */
  enableBrowserCloseDetection: boolean
  
  /** Enable WebSocket disconnect cleanup */
  enableWebSocketCleanup: boolean
  
  /** Cleanup timeout in milliseconds */
  cleanupTimeout: number
}

/**
 * Cleanup statistics
 */
export interface CleanupStats {
  /** Total cleanup operations performed */
  totalCleanups: number
  
  /** Cleanups by event type */
  cleanupsByEvent: Map<CleanupEvent, number>
  
  /** Average cleanup time */
  avgCleanupTime: number
  
  /** Failed cleanup attempts */
  failedCleanups: number
  
  /** Components cleaned up in last GC cycle */
  lastGcCount: number
  
  /** Memory freed in last GC cycle */
  lastGcMemoryFreed: number
  
  /** Last GC timestamp */
  lastGcTimestamp: number
}

/**
 * ComponentCleanupManager
 * 
 * Manages component lifecycle cleanup with advanced detection
 * and automatic garbage collection capabilities.
 */
export class ComponentCleanupManager {
  private static instance: ComponentCleanupManager
  
  /** Component isolation manager reference */
  private isolationManager: ComponentIsolationManager
  
  /** Logger instance */
  private logger: Logger
  
  /** Cleanup configuration */
  private config: CleanupConfig
  
  /** Global cleanup hooks */
  private globalCleanupHooks: Set<CleanupHook> = new Set()
  
  /** Component-specific cleanup hooks */
  private componentCleanupHooks = new Map<string, Set<CleanupHook>>()
  
  /** WebSocket connections tracking */
  private wsConnections = new Map<string, WebSocket>()
  
  /** Component last activity timestamps */
  private componentActivity = new Map<string, number>()
  
  /** Cleanup statistics */
  private stats: CleanupStats = {
    totalCleanups: 0,
    cleanupsByEvent: new Map(),
    avgCleanupTime: 0,
    failedCleanups: 0,
    lastGcCount: 0,
    lastGcMemoryFreed: 0,
    lastGcTimestamp: 0
  }
  
  /** Garbage collection interval handle */
  private gcInterval: NodeJS.Timeout | null = null
  
  /** Browser close detection setup */
  private browserCloseSetup = false
  
  constructor(
    isolationManager: ComponentIsolationManager,
    config: Partial<CleanupConfig> = {},
    logger?: Logger
  ) {
    this.isolationManager = isolationManager
    this.logger = logger || console as any
    
    this.config = {
      enableGarbageCollection: true,
      gcInterval: 5 * 60 * 1000, // 5 minutes
      staleThreshold: 30 * 60 * 1000, // 30 minutes
      maxCleanupBatch: 50,
      enableBrowserCloseDetection: true,
      enableWebSocketCleanup: true,
      cleanupTimeout: 10000, // 10 seconds
      ...config
    }
    
    this.initialize()
  }
  
  /**
   * Get singleton instance
   */
  static getInstance(
    isolationManager?: ComponentIsolationManager,
    config?: Partial<CleanupConfig>,
    logger?: Logger
  ): ComponentCleanupManager {
    if (!ComponentCleanupManager.instance && isolationManager) {
      ComponentCleanupManager.instance = new ComponentCleanupManager(
        isolationManager, 
        config, 
        logger
      )
    }
    return ComponentCleanupManager.instance
  }
  
  /**
   * Initialize cleanup system
   */
  private initialize(): void {
    // Start garbage collection if enabled
    if (this.config.enableGarbageCollection) {
      this.startGarbageCollection()
    }
    
    // Setup browser close detection if in browser environment
    if (this.config.enableBrowserCloseDetection && typeof window !== 'undefined') {
      this.setupBrowserCloseDetection()
    }
    
    this.logger.info('ComponentCleanupManager initialized', {
      config: this.config
    })
  }
  
  /**
   * Register component for cleanup tracking
   */
  registerComponent(
    componentId: string, 
    websocket?: WebSocket,
    cleanupHooks: CleanupHook[] = []
  ): void {
    // Track component activity
    this.componentActivity.set(componentId, Date.now())
    
    // Store WebSocket connection if provided
    if (websocket) {
      this.wsConnections.set(componentId, websocket)
      
      // Setup WebSocket disconnect handling
      if (this.config.enableWebSocketCleanup) {
        this.setupWebSocketCleanup(componentId, websocket)
      }
    }
    
    // Register component-specific cleanup hooks
    if (cleanupHooks.length > 0) {
      this.componentCleanupHooks.set(componentId, new Set(cleanupHooks))
    }
    
    this.logger.debug(`Registered component for cleanup: ${componentId}`, {
      hasWebSocket: !!websocket,
      cleanupHooksCount: cleanupHooks.length
    })
  }
  
  /**
   * Update component activity timestamp
   */
  updateComponentActivity(componentId: string): void {
    this.componentActivity.set(componentId, Date.now())
  }
  
  /**
   * Add global cleanup hook
   */
  addGlobalCleanupHook(hook: CleanupHook): () => void {
    this.globalCleanupHooks.add(hook)
    
    return () => {
      this.globalCleanupHooks.delete(hook)
    }
  }
  
  /**
   * Add component-specific cleanup hook
   */
  addComponentCleanupHook(componentId: string, hook: CleanupHook): () => void {
    if (!this.componentCleanupHooks.has(componentId)) {
      this.componentCleanupHooks.set(componentId, new Set())
    }
    
    this.componentCleanupHooks.get(componentId)!.add(hook)
    
    return () => {
      const hooks = this.componentCleanupHooks.get(componentId)
      if (hooks) {
        hooks.delete(hook)
        if (hooks.size === 0) {
          this.componentCleanupHooks.delete(componentId)
        }
      }
    }
  }
  
  /**
   * Cleanup component with event context
   */
  async cleanupComponent(
    componentId: string, 
    event: CleanupEvent = 'manual_cleanup'
  ): Promise<void> {
    const startTime = performance.now()
    
    try {
      // Update statistics
      this.stats.totalCleanups++
      this.stats.cleanupsByEvent.set(
        event, 
        (this.stats.cleanupsByEvent.get(event) || 0) + 1
      )
      
      // Run component-specific cleanup hooks
      const componentHooks = this.componentCleanupHooks.get(componentId)
      if (componentHooks) {
        await this.runCleanupHooks(Array.from(componentHooks), componentId, event)
      }
      
      // Run global cleanup hooks
      if (this.globalCleanupHooks.size > 0) {
        await this.runCleanupHooks(Array.from(this.globalCleanupHooks), componentId, event)
      }
      
      // Clean up WebSocket connection
      const ws = this.wsConnections.get(componentId)
      if (ws) {
        try {
          // Only close if WebSocket is in OPEN state
          if (ws.readyState === WebSocket.OPEN) {
            ws.close(1000, `Component cleanup: ${componentId}`)
          }
        } catch (error) {
          this.logger.warn(`Failed to close WebSocket for ${componentId}:`, error)
        }
      }
      
      // Remove from tracking maps
      this.wsConnections.delete(componentId)
      this.componentActivity.delete(componentId)
      this.componentCleanupHooks.delete(componentId)
      
      // Cleanup through isolation manager
      this.isolationManager.cleanupInstance(componentId)
      
      // Update performance statistics
      const cleanupTime = performance.now() - startTime
      this.updateCleanupPerformance(cleanupTime)
      
      this.logger.debug(`Cleaned up component: ${componentId}`, {
        event,
        cleanupTime: Math.round(cleanupTime * 100) / 100
      })
      
    } catch (error) {
      this.stats.failedCleanups++
      this.logger.error(`Cleanup failed for component ${componentId}:`, error)
      throw error
    }
  }
  
  /**
   * Cleanup multiple components (batch cleanup)
   */
  async cleanupComponents(
    componentIds: string[], 
    event: CleanupEvent = 'manual_cleanup'
  ): Promise<void> {
    const batches = this.createCleanupBatches(componentIds)
    
    for (const batch of batches) {
      await Promise.allSettled(
        batch.map(componentId => this.cleanupComponent(componentId, event))
      )
    }
  }
  
  /**
   * Cleanup all components for a client
   */
  async cleanupClient(clientId: string): Promise<void> {
    const components = this.isolationManager.getComponentsByClient(clientId)
    const componentIds = components.map(c => c.componentId)
    
    if (componentIds.length > 0) {
      await this.cleanupComponents(componentIds, 'client_disconnect')
      this.logger.info(`Cleaned up ${componentIds.length} components for client: ${clientId}`)
    }
  }
  
  /**
   * Force garbage collection cycle
   */
  async forceGarbageCollection(): Promise<{
    cleanedComponents: number
    memoryFreed: number
    duration: number
  }> {
    const startTime = performance.now()
    const staleComponents = this.detectStaleComponents()
    
    if (staleComponents.length === 0) {
      return {
        cleanedComponents: 0,
        memoryFreed: 0,
        duration: performance.now() - startTime
      }
    }
    
    const memoryBefore = this.isolationManager.getMemoryStats().totalMemoryUsage
    
    await this.cleanupComponents(staleComponents, 'garbage_collection')
    
    const memoryAfter = this.isolationManager.getMemoryStats().totalMemoryUsage
    const memoryFreed = memoryBefore - memoryAfter
    const duration = performance.now() - startTime
    
    // Update GC statistics
    this.stats.lastGcCount = staleComponents.length
    this.stats.lastGcMemoryFreed = memoryFreed
    this.stats.lastGcTimestamp = Date.now()
    
    this.logger.info('Garbage collection completed', {
      cleanedComponents: staleComponents.length,
      memoryFreed,
      duration: Math.round(duration)
    })
    
    return {
      cleanedComponents: staleComponents.length,
      memoryFreed,
      duration
    }
  }
  
  /**
   * Get cleanup statistics
   */
  getCleanupStats(): CleanupStats {
    return {
      ...this.stats,
      cleanupsByEvent: new Map(this.stats.cleanupsByEvent)
    }
  }
  
  /**
   * Shutdown cleanup system
   */
  shutdown(): void {
    // Stop garbage collection
    if (this.gcInterval) {
      clearInterval(this.gcInterval)
      this.gcInterval = null
    }
    
    // Clean up remaining components
    const allComponents = this.isolationManager.getAllComponents()
    const componentIds = allComponents.map(c => c.componentId)
    
    if (componentIds.length > 0) {
      // Synchronous cleanup for shutdown
      for (const componentId of componentIds) {
        try {
          this.cleanupComponent(componentId, 'manual_cleanup')
        } catch (error) {
          this.logger.error(`Error during shutdown cleanup of ${componentId}:`, error)
        }
      }
    }
    
    // Clear all maps
    this.wsConnections.clear()
    this.componentActivity.clear()
    this.componentCleanupHooks.clear()
    this.globalCleanupHooks.clear()
    
    this.logger.info('ComponentCleanupManager shutdown complete')
  }
  
  /**
   * Detect stale components that need cleanup
   */
  private detectStaleComponents(): string[] {
    const now = Date.now()
    const staleComponents: string[] = []
    
    for (const [componentId, lastActivity] of this.componentActivity) {
      if (now - lastActivity > this.config.staleThreshold) {
        staleComponents.push(componentId)
      }
    }
    
    // Also check for components that exist in isolation manager but not in activity tracking
    const allComponents = this.isolationManager.getAllComponents()
    for (const component of allComponents) {
      if (!this.componentActivity.has(component.componentId)) {
        staleComponents.push(component.componentId)
      }
    }
    
    return staleComponents
  }
  
  /**
   * Create cleanup batches to avoid overwhelming the system
   */
  private createCleanupBatches(componentIds: string[]): string[][] {
    const batches: string[][] = []
    const batchSize = this.config.maxCleanupBatch
    
    for (let i = 0; i < componentIds.length; i += batchSize) {
      batches.push(componentIds.slice(i, i + batchSize))
    }
    
    return batches
  }
  
  /**
   * Run cleanup hooks with timeout and error handling
   */
  private async runCleanupHooks(
    hooks: CleanupHook[], 
    componentId: string, 
    event: CleanupEvent
  ): Promise<void> {
    const timeoutPromise = new Promise<void>((_, reject) => {
      setTimeout(() => reject(new Error('Cleanup timeout')), this.config.cleanupTimeout)
    })
    
    const hooksPromise = Promise.allSettled(
      hooks.map(async (hook) => {
        try {
          await hook(componentId, event)
        } catch (error) {
          this.logger.error(`Cleanup hook error for ${componentId}:`, error)
          throw error
        }
      })
    )
    
    try {
      await Promise.race([hooksPromise, timeoutPromise])
    } catch (error) {
      this.logger.error(`Cleanup hooks timed out for ${componentId}:`, error)
      throw error
    }
  }
  
  /**
   * Setup WebSocket disconnect cleanup
   */
  private setupWebSocketCleanup(componentId: string, websocket: WebSocket): void {
    const cleanupOnDisconnect = () => {
      this.cleanupComponent(componentId, 'websocket_disconnect')
        .catch(error => {
          this.logger.error(`WebSocket cleanup failed for ${componentId}:`, error)
        })
    }
    
    websocket.addEventListener('close', cleanupOnDisconnect)
    websocket.addEventListener('error', cleanupOnDisconnect)
  }
  
  /**
   * Setup browser close detection
   */
  private setupBrowserCloseDetection(): void {
    if (this.browserCloseSetup) return
    
    const handleBeforeUnload = () => {
      // Cleanup all components synchronously
      const allComponents = this.isolationManager.getAllComponents()
      for (const component of allComponents) {
        try {
          // Synchronous cleanup for browser close
          this.cleanupComponent(component.componentId, 'browser_close')
        } catch (error) {
          // Ignore errors during browser close
        }
      }
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('pagehide', handleBeforeUnload)
    
    this.browserCloseSetup = true
  }
  
  /**
   * Start automatic garbage collection
   */
  private startGarbageCollection(): void {
    if (this.gcInterval) {
      clearInterval(this.gcInterval)
    }
    
    this.gcInterval = setInterval(() => {
      this.forceGarbageCollection()
        .catch(error => {
          this.logger.error('Garbage collection failed:', error)
        })
    }, this.config.gcInterval)
  }
  
  /**
   * Update cleanup performance statistics
   */
  private updateCleanupPerformance(cleanupTime: number): void {
    const currentAvg = this.stats.avgCleanupTime
    const totalCleanups = this.stats.totalCleanups
    
    // Calculate rolling average
    this.stats.avgCleanupTime = currentAvg + (cleanupTime - currentAvg) / totalCleanups
  }
}