/**
 * AutomaticCleanupSystem
 * 
 * Advanced automatic cleanup system using WeakRef-based tracking,
 * periodic cleanup tasks, and browser lifecycle integration.
 * 
 * Features:
 * - WeakRef-based instance tracking for automatic GC integration
 * - Periodic cleanup of orphaned data
 * - Browser tab/window close detection
 * - React component lifecycle integration
 * - Configurable cleanup strategies
 * - Performance-optimized cleanup scheduling
 */

import type { Logger } from '../types'

/**
 * Cleanup system configuration
 */
export interface CleanupSystemConfig {
  /** Enable automatic cleanup */
  enabled: boolean
  
  /** Cleanup cycle interval (ms) */
  cleanupInterval: number
  
  /** Orphan detection timeout (ms) */
  orphanTimeout: number
  
  /** Enable WeakRef tracking */
  enableWeakRefTracking: boolean
  
  /** Enable browser lifecycle hooks */
  enableBrowserHooks: boolean
  
  /** Enable React lifecycle integration */
  enableReactIntegration: boolean
  
  /** Maximum cleanup operations per cycle */
  maxCleanupOpsPerCycle: number
  
  /** Enable performance optimization */
  enablePerformanceOptimization: boolean
  
  /** Cleanup priority scoring */
  enablePriorityScoring: boolean
}

/**
 * Cleanup target information
 */
export interface CleanupTarget {
  /** Target identifier */
  id: string
  
  /** Target type */
  type: string
  
  /** WeakRef to the target object */
  weakRef?: WeakRef<any>
  
  /** Cleanup functions */
  cleanupFunctions: (() => void | Promise<void>)[]
  
  /** Registration timestamp */
  registeredAt: number
  
  /** Last activity timestamp */
  lastActivity: number
  
  /** Cleanup priority (higher = more important) */
  priority: number
  
  /** Custom metadata */
  metadata: Record<string, any>
  
  /** Whether target is critical (should not be auto-cleaned) */
  isCritical: boolean
}

/**
 * Cleanup operation result
 */
export interface CleanupResult {
  /** Operation success */
  success: boolean
  
  /** Target that was cleaned */
  targetId: string
  
  /** Cleanup functions executed */
  functionsExecuted: number
  
  /** Cleanup duration (ms) */
  duration: number
  
  /** Any errors encountered */
  errors: Error[]
}

/**
 * Cleanup statistics
 */
export interface CleanupStats {
  /** Total cleanup operations performed */
  totalCleanupOps: number
  
  /** Successfully cleaned targets */
  successfulCleanups: number
  
  /** Failed cleanup operations */
  failedCleanups: number
  
  /** Total targets registered */
  totalTargetsRegistered: number
  
  /** Currently tracked targets */
  activeTargets: number
  
  /** Orphaned targets cleaned */
  orphanedTargetsCleaned: number
  
  /** WeakRef targets garbage collected */
  weakRefTargetsCollected: number
  
  /** Average cleanup duration (ms) */
  averageCleanupDuration: number
  
  /** Last cleanup cycle duration (ms) */
  lastCycleDuration: number
  
  /** Cleanup efficiency score (0-1) */
  efficiency: number
}

/**
 * Browser lifecycle event
 */
export interface BrowserLifecycleEvent {
  /** Event type */
  type: 'beforeunload' | 'unload' | 'visibilitychange' | 'pagehide'
  
  /** Event timestamp */
  timestamp: number
  
  /** Event data */
  data: Record<string, any>
}

/**
 * AutomaticCleanupSystem class
 */
export class AutomaticCleanupSystem {
  private static instance: AutomaticCleanupSystem
  
  /** Configuration */
  private config: CleanupSystemConfig
  
  /** Logger instance */
  private logger: Logger
  
  /** Cleanup targets registry */
  private targets = new Map<string, CleanupTarget>()
  
  /** Cleanup interval handle */
  private cleanupInterval?: NodeJS.Timeout
  
  /** Browser event listeners */
  private browserEventListeners = new Map<string, EventListener>()
  
  /** Cleanup statistics */
  private stats: CleanupStats = {
    totalCleanupOps: 0,
    successfulCleanups: 0,
    failedCleanups: 0,
    totalTargetsRegistered: 0,
    activeTargets: 0,
    orphanedTargetsCleaned: 0,
    weakRefTargetsCollected: 0,
    averageCleanupDuration: 0,
    lastCycleDuration: 0,
    efficiency: 1
  }
  
  /** Performance tracking */
  private performanceMetrics = {
    cleanupDurations: [] as number[],
    cycleStartTimes: [] as number[],
    memoryUsageBefore: [] as number[],
    memoryUsageAfter: [] as number[]
  }
  
  /** Cleanup operation queue */
  private cleanupQueue: string[] = []
  
  /** Currently running cleanup operations */
  private runningCleanupOps = new Set<string>()
  
  /** Lifecycle event handlers */
  private lifecycleHandlers = new Set<(event: BrowserLifecycleEvent) => void>()
  
  constructor(config: Partial<CleanupSystemConfig> = {}, logger: Logger) {
    this.config = {
      enabled: true,
      cleanupInterval: 30000, // 30 seconds
      orphanTimeout: 2 * 60 * 1000, // 2 minutes
      enableWeakRefTracking: typeof WeakRef !== 'undefined',
      enableBrowserHooks: typeof window !== 'undefined',
      enableReactIntegration: true,
      maxCleanupOpsPerCycle: 10,
      enablePerformanceOptimization: true,
      enablePriorityScoring: true,
      ...config
    }
    
    this.logger = logger
    
    if (this.config.enabled) {
      this.startCleanupSystem()
    }
    
    this.logger.info('AutomaticCleanupSystem initialized', {
      config: this.config,
      weakRefSupported: typeof WeakRef !== 'undefined',
      browserSupported: typeof window !== 'undefined'
    })
  }
  
  /**
   * Get singleton instance
   */
  static getInstance(config?: Partial<CleanupSystemConfig>, logger?: Logger): AutomaticCleanupSystem {
    if (!this.instance) {
      if (!logger) {
        throw new Error('Logger required for cleanup system initialization')
      }
      this.instance = new AutomaticCleanupSystem(config, logger)
    }
    return this.instance
  }
  
  /**
   * Register cleanup target
   */
  registerTarget(
    id: string,
    type: string,
    target?: any,
    cleanupFunctions: (() => void | Promise<void>)[] = [],
    options: {
      priority?: number
      isCritical?: boolean
      metadata?: Record<string, any>
    } = {}
  ): void {
    const now = Date.now()
    
    const cleanupTarget: CleanupTarget = {
      id,
      type,
      weakRef: target && this.config.enableWeakRefTracking ? new WeakRef(target) : undefined,
      cleanupFunctions: [...cleanupFunctions],
      registeredAt: now,
      lastActivity: now,
      priority: options.priority || 1,
      metadata: options.metadata || {},
      isCritical: options.isCritical || false
    }
    
    this.targets.set(id, cleanupTarget)
    this.stats.totalTargetsRegistered++
    this.stats.activeTargets++
    
    this.logger.debug('Cleanup target registered', {
      id,
      type,
      hasWeakRef: !!cleanupTarget.weakRef,
      cleanupFunctionCount: cleanupFunctions.length,
      priority: cleanupTarget.priority
    })
  }
  
  /**
   * Unregister cleanup target
   */
  unregisterTarget(id: string): boolean {
    const target = this.targets.get(id)
    if (!target) return false
    
    this.targets.delete(id)
    this.stats.activeTargets = Math.max(0, this.stats.activeTargets - 1)
    
    // Remove from cleanup queue if present
    const queueIndex = this.cleanupQueue.indexOf(id)
    if (queueIndex !== -1) {
      this.cleanupQueue.splice(queueIndex, 1)
    }
    
    this.logger.debug('Cleanup target unregistered', { id })
    return true
  }
  
  /**
   * Add cleanup function to existing target
   */
  addCleanupFunction(targetId: string, cleanupFn: () => void | Promise<void>): boolean {
    const target = this.targets.get(targetId)
    if (!target) return false
    
    target.cleanupFunctions.push(cleanupFn)
    target.lastActivity = Date.now()
    
    this.logger.debug('Cleanup function added', {
      targetId,
      totalFunctions: target.cleanupFunctions.length
    })
    
    return true
  }
  
  /**
   * Update target activity
   */
  updateActivity(targetId: string): boolean {
    const target = this.targets.get(targetId)
    if (!target) return false
    
    target.lastActivity = Date.now()
    return true
  }
  
  /**
   * Force cleanup of specific target
   */
  async forceCleanup(targetId: string): Promise<CleanupResult> {
    const target = this.targets.get(targetId)
    if (!target) {
      return {
        success: false,
        targetId,
        functionsExecuted: 0,
        duration: 0,
        errors: [new Error('Target not found')]
      }
    }
    
    return this.executeCleanup(target)
  }
  
  /**
   * Force cleanup cycle
   */
  async forceCleanupCycle(): Promise<CleanupResult[]> {
    return this.runCleanupCycle()
  }
  
  /**
   * Get cleanup statistics
   */
  getStats(): CleanupStats {
    this.updateStats()
    return { ...this.stats }
  }
  
  /**
   * Get registered targets
   */
  getTargets(type?: string): CleanupTarget[] {
    const targets = Array.from(this.targets.values())
    return type ? targets.filter(t => t.type === type) : targets
  }
  
  /**
   * Check if target still exists (for WeakRef tracking)
   */
  isTargetAlive(targetId: string): boolean {
    const target = this.targets.get(targetId)
    if (!target) return false
    
    if (!target.weakRef) return true // Assume alive if no WeakRef
    
    return target.weakRef.deref() !== undefined
  }
  
  /**
   * Add lifecycle event handler
   */
  onLifecycleEvent(handler: (event: BrowserLifecycleEvent) => void): () => void {
    this.lifecycleHandlers.add(handler)
    return () => this.lifecycleHandlers.delete(handler)
  }
  
  /**
   * Trigger emergency cleanup (for browser unload events)
   */
  async emergencyCleanup(): Promise<void> {
    this.logger.info('Emergency cleanup triggered')
    
    // Cleanup all non-critical targets immediately
    const criticalTargets = Array.from(this.targets.values())
      .filter(t => !t.isCritical)
      .sort((a, b) => b.priority - a.priority) // Higher priority first
    
    const cleanupPromises = criticalTargets.map(target => 
      this.executeCleanup(target).catch(error => {
        this.logger.error('Emergency cleanup failed', {
          targetId: target.id,
          error: error instanceof Error ? error.message : String(error)
        })
      })
    )
    
    // Wait for critical cleanups with timeout
    await Promise.race([
      Promise.allSettled(cleanupPromises),
      new Promise(resolve => setTimeout(resolve, 2000)) // 2 second timeout
    ])
    
    this.logger.info('Emergency cleanup completed')
  }
  
  /**
   * Shutdown cleanup system
   */
  async shutdown(): Promise<void> {
    this.logger.info('Shutting down cleanup system')
    
    // Stop periodic cleanup
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    
    // Remove browser event listeners
    this.removeBrowserEventListeners()
    
    // Perform final cleanup
    await this.emergencyCleanup()
    
    // Clear all data
    this.targets.clear()
    this.cleanupQueue.length = 0
    this.runningCleanupOps.clear()
    this.lifecycleHandlers.clear()
    
    this.logger.info('Cleanup system shutdown complete')
  }
  
  private startCleanupSystem(): void {
    // Start periodic cleanup cycles
    if (this.config.cleanupInterval > 0) {
      this.cleanupInterval = setInterval(() => {
        this.runCleanupCycle().catch(error => {
          this.logger.error('Cleanup cycle failed', {
            error: error instanceof Error ? error.message : String(error)
          })
        })
      }, this.config.cleanupInterval)
    }
    
    // Setup browser event listeners
    if (this.config.enableBrowserHooks) {
      this.setupBrowserEventListeners()
    }
    
    this.logger.info('Cleanup system started')
  }
  
  private async runCleanupCycle(): Promise<CleanupResult[]> {
    const cycleStartTime = Date.now()
    const results: CleanupResult[] = []
    
    this.logger.debug('Starting cleanup cycle', {
      totalTargets: this.targets.size,
      queuedTargets: this.cleanupQueue.length
    })
    
    // Identify targets needing cleanup
    const targetsToClean = this.identifyCleanupTargets()
    
    // Execute cleanup operations (limited by maxCleanupOpsPerCycle)
    const opsToExecute = Math.min(targetsToClean.length, this.config.maxCleanupOpsPerCycle)
    
    for (let i = 0; i < opsToExecute; i++) {
      const target = targetsToClean[i]
      
      if (this.runningCleanupOps.has(target.id)) {
        continue // Skip if already running
      }
      
      this.runningCleanupOps.add(target.id)
      
      try {
        const result = await this.executeCleanup(target)
        results.push(result)
        
        if (result.success) {
          this.unregisterTarget(target.id)
        }
      } catch (error) {
        this.logger.error('Cleanup execution failed', {
          targetId: target.id,
          error: error instanceof Error ? error.message : String(error)
        })
      } finally {
        this.runningCleanupOps.delete(target.id)
      }
    }
    
    const cycleDuration = Date.now() - cycleStartTime
    this.stats.lastCycleDuration = cycleDuration
    
    this.logger.debug('Cleanup cycle completed', {
      duration: cycleDuration,
      targetsProcessed: results.length,
      successfulCleanups: results.filter(r => r.success).length,
      failedCleanups: results.filter(r => !r.success).length
    })
    
    return results
  }
  
  private identifyCleanupTargets(): CleanupTarget[] {
    const now = Date.now()
    const candidates: CleanupTarget[] = []
    
    for (const target of this.targets.values()) {
      // Skip critical targets
      if (target.isCritical) continue
      
      // Skip targets currently being cleaned
      if (this.runningCleanupOps.has(target.id)) continue
      
      let shouldClean = false
      let reason = ''
      
      // Check if WeakRef target has been garbage collected
      if (target.weakRef && target.weakRef.deref() === undefined) {
        shouldClean = true
        reason = 'weakref_collected'
        this.stats.weakRefTargetsCollected++
      }
      
      // Check for orphaned targets (inactive for too long)
      else if ((now - target.lastActivity) > this.config.orphanTimeout) {
        shouldClean = true
        reason = 'orphaned'
        this.stats.orphanedTargetsCleaned++
      }
      
      if (shouldClean) {
        candidates.push(target)
        this.logger.debug('Target marked for cleanup', {
          targetId: target.id,
          reason,
          age: now - target.registeredAt,
          inactivity: now - target.lastActivity
        })
      }
    }
    
    // Sort by priority (higher priority cleaned first) and age (older first)
    if (this.config.enablePriorityScoring) {
      candidates.sort((a, b) => {
        const priorityDiff = b.priority - a.priority
        if (priorityDiff !== 0) return priorityDiff
        return a.registeredAt - b.registeredAt // Older first
      })
    }
    
    return candidates
  }
  
  private async executeCleanup(target: CleanupTarget): Promise<CleanupResult> {
    const startTime = Date.now()
    const errors: Error[] = []
    let functionsExecuted = 0
    
    this.logger.debug('Executing cleanup', {
      targetId: target.id,
      type: target.type,
      functionsCount: target.cleanupFunctions.length
    })
    
    // Execute all cleanup functions
    for (const cleanupFn of target.cleanupFunctions) {
      try {
        const result = cleanupFn()
        
        // Handle async cleanup functions
        if (result && typeof result.then === 'function') {
          await result
        }
        
        functionsExecuted++
      } catch (error) {
        errors.push(error instanceof Error ? error : new Error(String(error)))
        this.logger.error('Cleanup function failed', {
          targetId: target.id,
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }
    
    const duration = Date.now() - startTime
    const success = errors.length === 0
    
    // Update statistics
    this.stats.totalCleanupOps++
    if (success) {
      this.stats.successfulCleanups++
    } else {
      this.stats.failedCleanups++
    }
    
    // Track performance metrics
    if (this.config.enablePerformanceOptimization) {
      this.performanceMetrics.cleanupDurations.push(duration)
      if (this.performanceMetrics.cleanupDurations.length > 100) {
        this.performanceMetrics.cleanupDurations = this.performanceMetrics.cleanupDurations.slice(-100)
      }
    }
    
    const result: CleanupResult = {
      success,
      targetId: target.id,
      functionsExecuted,
      duration,
      errors
    }
    
    this.logger.debug('Cleanup completed', {
      targetId: target.id,
      success,
      duration,
      functionsExecuted,
      errorsCount: errors.length
    })
    
    return result
  }
  
  private setupBrowserEventListeners(): void {
    if (typeof window === 'undefined') return
    
    // Before unload - emergency cleanup
    const beforeUnloadListener = () => {
      this.emitLifecycleEvent('beforeunload', {})
      this.emergencyCleanup().catch(error => {
        this.logger.error('Emergency cleanup failed on beforeunload', { error })
      })
    }
    
    // Page hide - emergency cleanup
    const pageHideListener = () => {
      this.emitLifecycleEvent('pagehide', {})
      this.emergencyCleanup().catch(error => {
        this.logger.error('Emergency cleanup failed on pagehide', { error })
      })
    }
    
    // Visibility change - activity tracking
    const visibilityChangeListener = () => {
      const isHidden = document.hidden
      this.emitLifecycleEvent('visibilitychange', { hidden: isHidden })
      
      if (isHidden) {
        // Page became hidden - good time for cleanup
        this.runCleanupCycle().catch(error => {
          this.logger.error('Cleanup cycle failed on visibility change', { error })
        })
      }
    }
    
    // Register listeners
    window.addEventListener('beforeunload', beforeUnloadListener)
    window.addEventListener('pagehide', pageHideListener)
    document.addEventListener('visibilitychange', visibilityChangeListener)
    
    // Store for cleanup
    this.browserEventListeners.set('beforeunload', beforeUnloadListener)
    this.browserEventListeners.set('pagehide', pageHideListener)
    this.browserEventListeners.set('visibilitychange', visibilityChangeListener)
    
    this.logger.debug('Browser event listeners setup')
  }
  
  private removeBrowserEventListeners(): void {
    if (typeof window === 'undefined') return
    
    for (const [event, listener] of this.browserEventListeners) {
      if (event === 'visibilitychange') {
        document.removeEventListener(event, listener)
      } else {
        window.removeEventListener(event, listener)
      }
    }
    
    this.browserEventListeners.clear()
    this.logger.debug('Browser event listeners removed')
  }
  
  private emitLifecycleEvent(type: BrowserLifecycleEvent['type'], data: Record<string, any>): void {
    const event: BrowserLifecycleEvent = {
      type,
      timestamp: Date.now(),
      data
    }
    
    this.lifecycleHandlers.forEach(handler => {
      try {
        handler(event)
      } catch (error) {
        this.logger.error('Lifecycle event handler failed', {
          type,
          error: error instanceof Error ? error.message : String(error)
        })
      }
    })
    
    this.logger.debug('Lifecycle event emitted', { type, data })
  }
  
  private updateStats(): void {
    this.stats.activeTargets = this.targets.size
    
    // Calculate average cleanup duration
    if (this.performanceMetrics.cleanupDurations.length > 0) {
      const total = this.performanceMetrics.cleanupDurations.reduce((sum, d) => sum + d, 0)
      this.stats.averageCleanupDuration = total / this.performanceMetrics.cleanupDurations.length
    }
    
    // Calculate efficiency
    const totalOps = this.stats.totalCleanupOps
    if (totalOps > 0) {
      this.stats.efficiency = this.stats.successfulCleanups / totalOps
    }
  }
  
  /**
   * Create React cleanup hook integration
   */
  createReactCleanupHook() {
    if (!this.config.enableReactIntegration) {
      throw new Error('React integration not enabled')
    }
    
    return {
      /**
       * Use cleanup hook for React components
       */
      useCleanup: (
        componentId: string,
        cleanupFns: (() => void | Promise<void>)[] = [],
        options: { priority?: number; isCritical?: boolean } = {}
      ) => {
        // This would be implemented as a proper React hook in a real scenario
        // For now, we'll provide the interface
        
        const cleanup = () => {
          this.registerTarget(
            componentId,
            'react-component',
            undefined,
            cleanupFns,
            options
          )
          
          return () => {
            this.unregisterTarget(componentId)
          }
        }
        
        return {
          addCleanupFunction: (fn: () => void | Promise<void>) => {
            this.addCleanupFunction(componentId, fn)
          },
          updateActivity: () => {
            this.updateActivity(componentId)
          },
          cleanup
        }
      }
    }
  }
}