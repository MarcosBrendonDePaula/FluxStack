/**
 * MemoryLeakDetector
 * 
 * Advanced memory leak detection system for FluxLive components.
 * Monitors component instances, event listeners, WebSocket connections,
 * and state objects for potential memory leaks.
 */

import { ComponentIdentity, MemoryStats } from './types'
import { ComponentIsolationManager } from './ComponentIsolationManager'
import { Logger } from '../utils/logger'

/**
 * Memory leak types
 */
export type MemoryLeakType = 
  | 'orphaned_instance'
  | 'stale_websocket'
  | 'unreleased_event_listener'
  | 'circular_reference'
  | 'large_state_object'
  | 'zombie_component'
  | 'duplicate_instance'

/**
 * Memory leak severity levels
 */
export type LeakSeverity = 'low' | 'medium' | 'high' | 'critical'

/**
 * Memory leak detection result
 */
export interface MemoryLeak {
  /** Unique leak identifier */
  id: string
  
  /** Type of memory leak */
  type: MemoryLeakType
  
  /** Severity level */
  severity: LeakSeverity
  
  /** Component ID affected */
  componentId: string
  
  /** Component type */
  componentType: string
  
  /** Description of the leak */
  description: string
  
  /** Estimated memory impact (bytes) */
  estimatedMemory: number
  
  /** When the leak was detected */
  detectedAt: number
  
  /** How long the leak has existed */
  ageMs: number
  
  /** Additional context data */
  context?: any
  
  /** Suggested fix */
  suggestedFix?: string
}

/**
 * Detection configuration
 */
export interface LeakDetectionConfig {
  /** Enable orphaned instance detection */
  detectOrphanedInstances: boolean
  
  /** Enable stale WebSocket detection */
  detectStaleWebSockets: boolean
  
  /** Enable event listener leak detection */
  detectEventListenerLeaks: boolean
  
  /** Enable circular reference detection */
  detectCircularReferences: boolean
  
  /** Enable large state object detection */
  detectLargeStateObjects: boolean
  
  /** Maximum state object size (bytes) */
  maxStateSize: number
  
  /** Stale threshold (ms) */
  staleThreshold: number
  
  /** Detection interval (ms) */
  detectionInterval: number
  
  /** Maximum leaks to track */
  maxTrackedLeaks: number
}

/**
 * Memory usage snapshot
 */
export interface MemorySnapshot {
  /** Timestamp of snapshot */
  timestamp: number
  
  /** Total memory usage */
  totalMemory: number
  
  /** Memory by component type */
  memoryByType: Map<string, number>
  
  /** Number of active components */
  activeComponents: number
  
  /** Number of detected leaks */
  detectedLeaks: number
  
  /** Heap usage (if available) */
  heapUsed?: number
  
  /** External memory (if available) */
  external?: number
}

/**
 * MemoryLeakDetector
 * 
 * Continuously monitors for memory leaks and provides
 * detailed analysis and remediation suggestions.
 */
export class MemoryLeakDetector {
  private static instance: MemoryLeakDetector
  
  /** Isolation manager reference */
  private isolationManager: ComponentIsolationManager
  
  /** Logger instance */
  private logger: Logger
  
  /** Detection configuration */
  private config: LeakDetectionConfig
  
  /** Detected memory leaks */
  private detectedLeaks = new Map<string, MemoryLeak>()
  
  /** Memory usage history */
  private memoryHistory: MemorySnapshot[] = []
  
  /** Component creation timestamps */
  private componentCreationTimes = new Map<string, number>()
  
  /** WebSocket tracking */
  private websocketTracking = new Map<string, {
    websocket: WebSocket
    createdAt: number
    lastActivity: number
  }>()
  
  /** Event listener tracking */
  private eventListenerTracking = new Map<string, {
    listeners: string[]
    createdAt: number
  }>()
  
  /** State size tracking */
  private stateSizeTracking = new Map<string, number>()
  
  /** Detection interval handle */
  private detectionInterval: NodeJS.Timeout | null = null
  
  /** Leak ID counter */
  private leakIdCounter = 0
  
  constructor(
    isolationManager: ComponentIsolationManager,
    config: Partial<LeakDetectionConfig> = {},
    logger?: Logger
  ) {
    this.isolationManager = isolationManager
    this.logger = logger || console as any
    
    this.config = {
      detectOrphanedInstances: true,
      detectStaleWebSockets: true,
      detectEventListenerLeaks: true,
      detectCircularReferences: true,
      detectLargeStateObjects: true,
      maxStateSize: 1024 * 1024, // 1MB
      staleThreshold: 30 * 60 * 1000, // 30 minutes
      detectionInterval: 2 * 60 * 1000, // 2 minutes
      maxTrackedLeaks: 1000,
      ...config
    }
    
    this.startDetection()
  }
  
  /**
   * Get singleton instance
   */
  static getInstance(
    isolationManager?: ComponentIsolationManager,
    config?: Partial<LeakDetectionConfig>,
    logger?: Logger
  ): MemoryLeakDetector {
    if (!MemoryLeakDetector.instance && isolationManager) {
      MemoryLeakDetector.instance = new MemoryLeakDetector(
        isolationManager,
        config,
        logger
      )
    }
    return MemoryLeakDetector.instance
  }
  
  /**
   * Register component for leak detection
   */
  registerComponent(componentId: string): void {
    this.componentCreationTimes.set(componentId, Date.now())
  }
  
  /**
   * Register WebSocket for tracking
   */
  registerWebSocket(componentId: string, websocket: WebSocket): void {
    this.websocketTracking.set(componentId, {
      websocket,
      createdAt: Date.now(),
      lastActivity: Date.now()
    })
  }
  
  /**
   * Update WebSocket activity
   */
  updateWebSocketActivity(componentId: string): void {
    const tracking = this.websocketTracking.get(componentId)
    if (tracking) {
      tracking.lastActivity = Date.now()
    }
  }
  
  /**
   * Register event listeners for tracking
   */
  registerEventListeners(componentId: string, listeners: string[]): void {
    this.eventListenerTracking.set(componentId, {
      listeners: [...listeners],
      createdAt: Date.now()
    })
  }
  
  /**
   * Update component state size
   */
  updateStateSize(componentId: string, stateSize: number): void {
    this.stateSizeTracking.set(componentId, stateSize)
  }
  
  /**
   * Run comprehensive leak detection
   */
  async detectLeaks(): Promise<MemoryLeak[]> {
    const detectedLeaks: MemoryLeak[] = []
    
    try {
      // Take memory snapshot
      const snapshot = this.takeMemorySnapshot()
      this.memoryHistory.push(snapshot)
      
      // Trim history if too large
      if (this.memoryHistory.length > 100) {
        this.memoryHistory = this.memoryHistory.slice(-50)
      }
      
      // Run individual detection methods
      if (this.config.detectOrphanedInstances) {
        detectedLeaks.push(...await this.detectOrphanedInstances())
      }
      
      if (this.config.detectStaleWebSockets) {
        detectedLeaks.push(...await this.detectStaleWebSockets())
      }
      
      if (this.config.detectEventListenerLeaks) {
        detectedLeaks.push(...await this.detectEventListenerLeaks())
      }
      
      if (this.config.detectCircularReferences) {
        detectedLeaks.push(...await this.detectCircularReferences())
      }
      
      if (this.config.detectLargeStateObjects) {
        detectedLeaks.push(...await this.detectLargeStateObjects())
      }
      
      // Additional detection methods
      detectedLeaks.push(...await this.detectZombieComponents())
      detectedLeaks.push(...await this.detectDuplicateInstances())
      
      // Store detected leaks
      for (const leak of detectedLeaks) {
        this.detectedLeaks.set(leak.id, leak)
      }
      
      // Trim stored leaks if too many
      if (this.detectedLeaks.size > this.config.maxTrackedLeaks) {
        const leaksArray = Array.from(this.detectedLeaks.values())
        leaksArray.sort((a, b) => a.detectedAt - b.detectedAt)
        const toRemove = leaksArray.slice(0, leaksArray.length - this.config.maxTrackedLeaks)
        for (const leak of toRemove) {
          this.detectedLeaks.delete(leak.id)
        }
      }
      
      if (detectedLeaks.length > 0) {
        this.logger.warn(`Detected ${detectedLeaks.length} memory leaks`, {
          leakTypes: detectedLeaks.map(l => l.type),
          severities: detectedLeaks.map(l => l.severity)
        })
      }
      
    } catch (error) {
      this.logger.error('Leak detection failed:', error)
    }
    
    return detectedLeaks
  }
  
  /**
   * Get all detected leaks
   */
  getAllLeaks(): MemoryLeak[] {
    return Array.from(this.detectedLeaks.values())
  }
  
  /**
   * Get leaks by severity
   */
  getLeaksBySeverity(severity: LeakSeverity): MemoryLeak[] {
    return this.getAllLeaks().filter(leak => leak.severity === severity)
  }
  
  /**
   * Get leaks by component
   */
  getLeaksByComponent(componentId: string): MemoryLeak[] {
    return this.getAllLeaks().filter(leak => leak.componentId === componentId)
  }
  
  /**
   * Clear resolved leak
   */
  clearLeak(leakId: string): void {
    this.detectedLeaks.delete(leakId)
  }
  
  /**
   * Get memory usage trend
   */
  getMemoryTrend(periodMs: number = 30 * 60 * 1000): {
    trend: 'increasing' | 'decreasing' | 'stable'
    changeRate: number
    snapshots: MemorySnapshot[]
  } {
    const cutoff = Date.now() - periodMs
    const recentSnapshots = this.memoryHistory.filter(s => s.timestamp > cutoff)
    
    if (recentSnapshots.length < 2) {
      return {
        trend: 'stable',
        changeRate: 0,
        snapshots: recentSnapshots
      }
    }
    
    const first = recentSnapshots[0]
    const last = recentSnapshots[recentSnapshots.length - 1]
    const changeRate = (last.totalMemory - first.totalMemory) / (last.timestamp - first.timestamp)
    
    let trend: 'increasing' | 'decreasing' | 'stable'
    if (Math.abs(changeRate) < 0.01) {
      trend = 'stable'
    } else if (changeRate > 0) {
      trend = 'increasing'
    } else {
      trend = 'decreasing'
    }
    
    return {
      trend,
      changeRate,
      snapshots: recentSnapshots
    }
  }
  
  /**
   * Cleanup component tracking
   */
  cleanupComponent(componentId: string): void {
    this.componentCreationTimes.delete(componentId)
    this.websocketTracking.delete(componentId)
    this.eventListenerTracking.delete(componentId)
    this.stateSizeTracking.delete(componentId)
    
    // Remove leaks for this component
    for (const [leakId, leak] of this.detectedLeaks) {
      if (leak.componentId === componentId) {
        this.detectedLeaks.delete(leakId)
      }
    }
  }
  
  /**
   * Shutdown detector
   */
  shutdown(): void {
    if (this.detectionInterval) {
      clearInterval(this.detectionInterval)
      this.detectionInterval = null
    }
    
    // Clear all tracking maps
    this.componentCreationTimes.clear()
    this.websocketTracking.clear()
    this.eventListenerTracking.clear()
    this.stateSizeTracking.clear()
    this.detectedLeaks.clear()
    this.memoryHistory = []
    
    this.logger.info('MemoryLeakDetector shutdown complete')
  }
  
  /**
   * Start automatic detection
   */
  private startDetection(): void {
    if (this.detectionInterval) {
      clearInterval(this.detectionInterval)
    }
    
    this.detectionInterval = setInterval(() => {
      this.detectLeaks().catch(error => {
        this.logger.error('Automatic leak detection failed:', error)
      })
    }, this.config.detectionInterval)
    
    this.logger.info('Memory leak detection started', {
      interval: this.config.detectionInterval
    })
  }
  
  /**
   * Take memory usage snapshot
   */
  private takeMemorySnapshot(): MemorySnapshot {
    const stats = this.isolationManager.getMemoryStats()
    const allComponents = this.isolationManager.getAllComponents()
    
    let heapUsed: number | undefined
    let external: number | undefined
    
    // Get Node.js memory usage if available
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const memUsage = process.memoryUsage()
      heapUsed = memUsage.heapUsed
      external = memUsage.external
    }
    
    return {
      timestamp: Date.now(),
      totalMemory: stats.totalMemoryUsage,
      memoryByType: new Map(stats.memoryByType),
      activeComponents: allComponents.length,
      detectedLeaks: this.detectedLeaks.size,
      heapUsed,
      external
    }
  }
  
  /**
   * Detect orphaned instances
   */
  private async detectOrphanedInstances(): Promise<MemoryLeak[]> {
    const leaks: MemoryLeak[] = []
    const allComponents = this.isolationManager.getAllComponents()
    
    for (const component of allComponents) {
      const instance = this.isolationManager.getInstance(component.componentId)
      if (!instance) {
        const createdAt = this.componentCreationTimes.get(component.componentId) || component.createdAt
        const ageMs = Date.now() - createdAt
        
        leaks.push({
          id: `orphaned-${++this.leakIdCounter}`,
          type: 'orphaned_instance',
          severity: ageMs > this.config.staleThreshold ? 'high' : 'medium',
          componentId: component.componentId,
          componentType: component.componentType,
          description: `Component identity exists but instance is missing`,
          estimatedMemory: 1024, // Estimated
          detectedAt: Date.now(),
          ageMs,
          suggestedFix: 'Clean up component identity or recreate instance'
        })
      }
    }
    
    return leaks
  }
  
  /**
   * Detect stale WebSocket connections
   */
  private async detectStaleWebSockets(): Promise<MemoryLeak[]> {
    const leaks: MemoryLeak[] = []
    const now = Date.now()
    
    for (const [componentId, tracking] of this.websocketTracking) {
      const { websocket, lastActivity } = tracking
      const ageMs = now - lastActivity
      
      if (ageMs > this.config.staleThreshold || websocket.readyState !== WebSocket.OPEN) {
        const component = this.isolationManager.getIdentity(componentId)
        
        leaks.push({
          id: `stale-ws-${++this.leakIdCounter}`,
          type: 'stale_websocket',
          severity: 'medium',
          componentId,
          componentType: component?.componentType || 'unknown',
          description: `WebSocket connection is stale or closed but not cleaned up`,
          estimatedMemory: 512,
          detectedAt: now,
          ageMs,
          context: { readyState: websocket.readyState },
          suggestedFix: 'Close and clean up WebSocket connection'
        })
      }
    }
    
    return leaks
  }
  
  /**
   * Detect event listener leaks
   */
  private async detectEventListenerLeaks(): Promise<MemoryLeak[]> {
    const leaks: MemoryLeak[] = []
    
    // This is a simplified implementation
    // In a real scenario, you'd track actual event listeners
    for (const [componentId, tracking] of this.eventListenerTracking) {
      const component = this.isolationManager.getIdentity(componentId)
      
      if (!component && tracking.listeners.length > 0) {
        leaks.push({
          id: `event-leak-${++this.leakIdCounter}`,
          type: 'unreleased_event_listener',
          severity: 'medium',
          componentId,
          componentType: 'unknown',
          description: `Event listeners not cleaned up after component removal`,
          estimatedMemory: tracking.listeners.length * 64,
          detectedAt: Date.now(),
          ageMs: Date.now() - tracking.createdAt,
          context: { listeners: tracking.listeners },
          suggestedFix: 'Remove event listeners before component cleanup'
        })
      }
    }
    
    return leaks
  }
  
  /**
   * Detect circular references (simplified)
   */
  private async detectCircularReferences(): Promise<MemoryLeak[]> {
    const leaks: MemoryLeak[] = []
    
    // Simplified circular reference detection
    // In practice, this would be much more sophisticated
    const allComponents = this.isolationManager.getAllComponents()
    
    for (const component of allComponents) {
      // Check for potential circular parent-child relationships
      if (component.parentId) {
        const visited = new Set<string>()
        let current = component.componentId
        
        while (current) {
          if (visited.has(current)) {
            leaks.push({
              id: `circular-${++this.leakIdCounter}`,
              type: 'circular_reference',
              severity: 'high',
              componentId: component.componentId,
              componentType: component.componentType,
              description: `Circular reference detected in component hierarchy`,
              estimatedMemory: 2048,
              detectedAt: Date.now(),
              ageMs: Date.now() - component.createdAt,
              context: { circularPath: Array.from(visited) },
              suggestedFix: 'Fix component hierarchy to remove circular references'
            })
            break
          }
          
          visited.add(current)
          const parent = this.isolationManager.getIdentity(current)
          current = parent?.parentId || ''
        }
      }
    }
    
    return leaks
  }
  
  /**
   * Detect large state objects
   */
  private async detectLargeStateObjects(): Promise<MemoryLeak[]> {
    const leaks: MemoryLeak[] = []
    
    for (const [componentId, stateSize] of this.stateSizeTracking) {
      if (stateSize > this.config.maxStateSize) {
        const component = this.isolationManager.getIdentity(componentId)
        
        leaks.push({
          id: `large-state-${++this.leakIdCounter}`,
          type: 'large_state_object',
          severity: stateSize > this.config.maxStateSize * 2 ? 'high' : 'medium',
          componentId,
          componentType: component?.componentType || 'unknown',
          description: `Component state object is unusually large`,
          estimatedMemory: stateSize,
          detectedAt: Date.now(),
          ageMs: component ? Date.now() - component.createdAt : 0,
          context: { stateSize },
          suggestedFix: 'Optimize state structure or implement state pagination'
        })
      }
    }
    
    return leaks
  }
  
  /**
   * Detect zombie components (components that should be cleaned up)
   */
  private async detectZombieComponents(): Promise<MemoryLeak[]> {
    const leaks: MemoryLeak[] = []
    const now = Date.now()
    
    for (const [componentId, createdAt] of this.componentCreationTimes) {
      const ageMs = now - createdAt
      const component = this.isolationManager.getIdentity(componentId)
      
      // Component exists in our tracking but not in isolation manager
      if (!component && ageMs > this.config.staleThreshold) {
        leaks.push({
          id: `zombie-${++this.leakIdCounter}`,
          type: 'zombie_component',
          severity: 'medium',
          componentId,
          componentType: 'unknown',
          description: `Component exists in tracking but not in active registry`,
          estimatedMemory: 512,
          detectedAt: now,
          ageMs,
          suggestedFix: 'Remove component from tracking or reinitialize'
        })
      }
    }
    
    return leaks
  }
  
  /**
   * Detect duplicate component instances
   */
  private async detectDuplicateInstances(): Promise<MemoryLeak[]> {
    const leaks: MemoryLeak[] = []
    const componentsByType = new Map<string, ComponentIdentity[]>()
    
    // Group components by type and props hash
    const allComponents = this.isolationManager.getAllComponents()
    for (const component of allComponents) {
      const key = `${component.componentType}-${component.fingerprint}`
      if (!componentsByType.has(key)) {
        componentsByType.set(key, [])
      }
      componentsByType.get(key)!.push(component)
    }
    
    // Check for potential duplicates
    for (const [key, components] of componentsByType) {
      if (components.length > 1) {
        // Check if components have very similar creation times (potential duplicates)
        const sorted = components.sort((a, b) => a.createdAt - b.createdAt)
        for (let i = 1; i < sorted.length; i++) {
          const timeDiff = sorted[i].createdAt - sorted[i - 1].createdAt
          if (timeDiff < 1000) { // Created within 1 second
            leaks.push({
              id: `duplicate-${++this.leakIdCounter}`,
              type: 'duplicate_instance',
              severity: 'low',
              componentId: sorted[i].componentId,
              componentType: sorted[i].componentType,
              description: `Potential duplicate component instance`,
              estimatedMemory: 1024,
              detectedAt: Date.now(),
              ageMs: Date.now() - sorted[i].createdAt,
              context: { 
                duplicateOf: sorted[i - 1].componentId,
                timeDiff 
              },
              suggestedFix: 'Check component creation logic for race conditions'
            })
          }
        }
      }
    }
    
    return leaks
  }
}