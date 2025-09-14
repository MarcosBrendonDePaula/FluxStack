/**
 * LivePerformanceMonitor
 * 
 * Advanced memory tracking and leak detection system for LiveAction components.
 * Provides real-time monitoring, alerts, and automated cleanup recommendations.
 * 
 * Features:
 * - Real-time memory usage tracking
 * - Memory leak detection and alerts
 * - Instance lifecycle monitoring
 * - Automatic stale reference cleanup
 * - Development-time debugging tools
 * - Performance trend analysis
 */

import type { Logger } from '../types'

/**
 * Memory monitoring configuration
 */
export interface MemoryMonitorConfig {
  /** Enable memory monitoring */
  enabled: boolean
  
  /** Monitoring interval (ms) */
  monitoringInterval: number
  
  /** Memory threshold for warnings (MB) */
  memoryWarningThreshold: number
  
  /** Memory threshold for critical alerts (MB) */
  memoryCriticalThreshold: number
  
  /** Maximum number of instances before alert */
  instanceCountThreshold: number
  
  /** Time before considering instance stale (ms) */
  staleInstanceTimeout: number
  
  /** Enable automatic cleanup */
  enableAutoCleanup: boolean
  
  /** Development mode features */
  developmentMode: boolean
  
  /** Collect detailed metrics */
  collectDetailedMetrics: boolean
  
  /** Memory sample history size */
  memorySampleHistorySize: number
}

/**
 * Memory usage sample
 */
export interface MemorySample {
  /** Sample timestamp */
  timestamp: number
  
  /** Total memory usage (bytes) */
  totalMemory: number
  
  /** Used memory (bytes) */
  usedMemory: number
  
  /** Memory usage by component type */
  componentMemory: Record<string, number>
  
  /** Total component instances */
  totalInstances: number
  
  /** Active component instances */
  activeInstances: number
  
  /** Stale instances detected */
  staleInstances: number
}

/**
 * Memory leak detection result
 */
export interface MemoryLeak {
  /** Leak type */
  type: 'instance_accumulation' | 'memory_growth' | 'stale_references' | 'circular_references'
  
  /** Severity level */
  severity: 'low' | 'medium' | 'high' | 'critical'
  
  /** Component type involved */
  componentType: string
  
  /** Leak description */
  description: string
  
  /** Evidence supporting leak detection */
  evidence: {
    /** Current instance count */
    instanceCount: number
    
    /** Memory growth rate (bytes/minute) */
    memoryGrowthRate: number
    
    /** Average instance age (ms) */
    averageInstanceAge: number
    
    /** Stale instance count */
    staleInstanceCount: number
  }
  
  /** Recommended actions */
  recommendations: string[]
  
  /** Detection timestamp */
  detectedAt: number
}

/**
 * Performance alert
 */
export interface PerformanceAlert {
  /** Alert type */
  type: 'memory_warning' | 'memory_critical' | 'leak_detected' | 'performance_degraded'
  
  /** Alert message */
  message: string
  
  /** Component type (if applicable) */
  componentType?: string
  
  /** Alert data */
  data: Record<string, any>
  
  /** Alert timestamp */
  timestamp: number
  
  /** Alert acknowledged */
  acknowledged: boolean
}

/**
 * Instance tracking information
 */
export interface InstanceInfo {
  /** Instance ID */
  id: string
  
  /** Component type */
  componentType: string
  
  /** Creation timestamp */
  createdAt: number
  
  /** Last activity timestamp */
  lastActivity: number
  
  /** Instance properties */
  properties: Record<string, any>
  
  /** Memory usage estimate */
  memoryUsage: number
  
  /** Whether instance is considered stale */
  isStale: boolean
  
  /** Instance lifecycle state */
  state: 'created' | 'active' | 'idle' | 'disposed'
}

/**
 * Performance statistics
 */
export interface PerformanceStats {
  /** Current memory usage (bytes) */
  currentMemory: number
  
  /** Peak memory usage (bytes) */
  peakMemory: number
  
  /** Memory growth rate (bytes/minute) */
  memoryGrowthRate: number
  
  /** Total instances created */
  totalInstancesCreated: number
  
  /** Currently active instances */
  activeInstances: number
  
  /** Instances cleaned up */
  instancesCleanedUp: number
  
  /** Memory leaks detected */
  leaksDetected: number
  
  /** Performance alerts */
  alertsGenerated: number
  
  /** Average instance lifespan (ms) */
  averageInstanceLifespan: number
  
  /** Memory efficiency score (0-1) */
  memoryEfficiency: number
}

/**
 * LivePerformanceMonitor class
 */
export class LivePerformanceMonitor {
  private static instance: LivePerformanceMonitor
  
  /** Configuration */
  private config: MemoryMonitorConfig
  
  /** Logger instance */
  private logger: Logger
  
  /** Monitoring interval handle */
  private monitoringInterval?: NodeJS.Timeout
  
  /** Tracked instances */
  private trackedInstances = new Map<string, InstanceInfo>()
  
  /** Memory sample history */
  private memorySamples: MemorySample[] = []
  
  /** Detected memory leaks */
  private detectedLeaks = new Map<string, MemoryLeak>()
  
  /** Performance alerts */
  private alerts: PerformanceAlert[] = []
  
  /** Performance statistics */
  private stats: PerformanceStats = {
    currentMemory: 0,
    peakMemory: 0,
    memoryGrowthRate: 0,
    totalInstancesCreated: 0,
    activeInstances: 0,
    instancesCleanedUp: 0,
    leaksDetected: 0,
    alertsGenerated: 0,
    averageInstanceLifespan: 0,
    memoryEfficiency: 1
  }
  
  /** Cleanup functions by instance */
  private cleanupFunctions = new Map<string, (() => void)[]>()
  
  /** Component type registrations */
  private componentTypes = new Set<string>()
  
  /** Alert listeners */
  private alertListeners = new Set<(alert: PerformanceAlert) => void>()
  
  constructor(config: Partial<MemoryMonitorConfig> = {}, logger: Logger) {
    this.config = {
      enabled: true,
      monitoringInterval: 30000, // 30 seconds
      memoryWarningThreshold: 50, // 50 MB
      memoryCriticalThreshold: 100, // 100 MB
      instanceCountThreshold: 100,
      staleInstanceTimeout: 5 * 60 * 1000, // 5 minutes
      enableAutoCleanup: true,
      developmentMode: process.env.NODE_ENV === 'development',
      collectDetailedMetrics: true,
      memorySampleHistorySize: 100,
      ...config
    }
    
    this.logger = logger
    
    if (this.config.enabled) {
      this.startMonitoring()
    }
    
    this.logger.info('LivePerformanceMonitor initialized', {
      config: this.config
    })
  }
  
  /**
   * Get singleton instance
   */
  static getInstance(config?: Partial<MemoryMonitorConfig>, logger?: Logger): LivePerformanceMonitor {
    if (!this.instance) {
      if (!logger) {
        throw new Error('Logger required for monitor initialization')
      }
      this.instance = new LivePerformanceMonitor(config, logger)
    }
    return this.instance
  }
  
  /**
   * Track new component instance
   */
  trackInstance(
    instanceId: string,
    componentType: string,
    properties: Record<string, any> = {},
    memoryUsage?: number
  ): void {
    const now = Date.now()
    
    const instanceInfo: InstanceInfo = {
      id: instanceId,
      componentType,
      createdAt: now,
      lastActivity: now,
      properties,
      memoryUsage: memoryUsage || this.estimateInstanceMemory(componentType, properties),
      isStale: false,
      state: 'created'
    }
    
    this.trackedInstances.set(instanceId, instanceInfo)
    this.componentTypes.add(componentType)
    this.stats.totalInstancesCreated++
    this.stats.activeInstances++
    
    this.logger.debug('Instance tracked', {
      instanceId,
      componentType,
      totalInstances: this.trackedInstances.size
    })
  }
  
  /**
   * Update instance activity
   */
  updateInstanceActivity(instanceId: string, state?: InstanceInfo['state']): void {
    const instance = this.trackedInstances.get(instanceId)
    if (!instance) return
    
    instance.lastActivity = Date.now()
    if (state) {
      instance.state = state
    }
    
    // Reset stale flag if active
    if (state === 'active') {
      instance.isStale = false
    }
  }
  
  /**
   * Untrack instance (instance disposed)
   */
  untrackInstance(instanceId: string): void {
    const instance = this.trackedInstances.get(instanceId)
    if (!instance) return
    
    // Execute cleanup functions
    const cleanupFns = this.cleanupFunctions.get(instanceId)
    if (cleanupFns) {
      cleanupFns.forEach(fn => {
        try {
          fn()
        } catch (error) {
          this.logger.error('Cleanup function failed', {
            instanceId,
            error: error instanceof Error ? error.message : String(error)
          })
        }
      })
      this.cleanupFunctions.delete(instanceId)
    }
    
    this.trackedInstances.delete(instanceId)
    this.stats.activeInstances = Math.max(0, this.stats.activeInstances - 1)
    this.stats.instancesCleanedUp++
    
    // Update average lifespan
    const lifespan = Date.now() - instance.createdAt
    const totalLifespan = this.stats.averageInstanceLifespan * this.stats.instancesCleanedUp
    this.stats.averageInstanceLifespan = (totalLifespan + lifespan) / (this.stats.instancesCleanedUp + 1)
    
    this.logger.debug('Instance untracked', {
      instanceId,
      lifespan,
      remainingInstances: this.trackedInstances.size
    })
  }
  
  /**
   * Register cleanup function for instance
   */
  registerCleanupFunction(instanceId: string, cleanupFn: () => void): void {
    if (!this.cleanupFunctions.has(instanceId)) {
      this.cleanupFunctions.set(instanceId, [])
    }
    this.cleanupFunctions.get(instanceId)!.push(cleanupFn)
  }
  
  /**
   * Get current performance statistics
   */
  getStats(): PerformanceStats {
    this.updateStats()
    return { ...this.stats }
  }
  
  /**
   * Get detected memory leaks
   */
  getDetectedLeaks(): MemoryLeak[] {
    return Array.from(this.detectedLeaks.values())
  }
  
  /**
   * Get performance alerts
   */
  getAlerts(unacknowledgedOnly: boolean = false): PerformanceAlert[] {
    return this.alerts.filter(alert => !unacknowledgedOnly || !alert.acknowledged)
  }
  
  /**
   * Acknowledge alert
   */
  acknowledgeAlert(timestamp: number): void {
    const alert = this.alerts.find(a => a.timestamp === timestamp)
    if (alert) {
      alert.acknowledged = true
    }
  }
  
  /**
   * Get memory usage history
   */
  getMemoryHistory(): MemorySample[] {
    return [...this.memorySamples]
  }
  
  /**
   * Get tracked instances
   */
  getTrackedInstances(componentType?: string): InstanceInfo[] {
    const instances = Array.from(this.trackedInstances.values())
    return componentType ? instances.filter(i => i.componentType === componentType) : instances
  }
  
  /**
   * Force memory leak detection scan
   */
  detectMemoryLeaks(): MemoryLeak[] {
    const leaks: MemoryLeak[] = []
    
    // Analyze each component type
    for (const componentType of this.componentTypes) {
      const instances = this.getTrackedInstances(componentType)
      
      // Check for instance accumulation
      if (instances.length > this.config.instanceCountThreshold) {
        const leak = this.createInstanceAccumulationLeak(componentType, instances)
        leaks.push(leak)
      }
      
      // Check for stale references
      const staleInstances = instances.filter(i => this.isInstanceStale(i))
      if (staleInstances.length > instances.length * 0.3) { // 30% stale threshold
        const leak = this.createStaleReferenceLeak(componentType, instances, staleInstances)
        leaks.push(leak)
      }
    }
    
    // Check for overall memory growth
    if (this.memorySamples.length >= 2) {
      const leak = this.detectMemoryGrowthLeak()
      if (leak) {
        leaks.push(leak)
      }
    }
    
    // Store detected leaks
    leaks.forEach(leak => {
      const key = `${leak.type}_${leak.componentType}_${Date.now()}`
      this.detectedLeaks.set(key, leak)
    })
    
    this.stats.leaksDetected += leaks.length
    
    // Generate alerts for new leaks
    leaks.forEach(leak => {
      this.generateAlert('leak_detected', `Memory leak detected: ${leak.description}`, leak.componentType, {
        leak
      })
    })
    
    return leaks
  }
  
  /**
   * Force cleanup of stale instances
   */
  cleanupStaleInstances(): number {
    const staleInstances: string[] = []
    
    for (const [instanceId, instance] of this.trackedInstances) {
      if (this.isInstanceStale(instance)) {
        staleInstances.push(instanceId)
      }
    }
    
    staleInstances.forEach(instanceId => {
      this.logger.warn('Cleaning up stale instance', { instanceId })
      this.untrackInstance(instanceId)
    })
    
    return staleInstances.length
  }
  
  /**
   * Add alert listener
   */
  onAlert(listener: (alert: PerformanceAlert) => void): () => void {
    this.alertListeners.add(listener)
    return () => this.alertListeners.delete(listener)
  }
  
  /**
   * Generate performance report
   */
  generateReport(): string {
    const stats = this.getStats()
    const leaks = this.getDetectedLeaks()
    const alerts = this.getAlerts(true) // Unacknowledged only
    
    const report = `
LivePerformanceMonitor Report
============================

Performance Statistics:
- Current Memory: ${(stats.currentMemory / 1024 / 1024).toFixed(2)} MB
- Peak Memory: ${(stats.peakMemory / 1024 / 1024).toFixed(2)} MB
- Memory Growth Rate: ${(stats.memoryGrowthRate / 1024).toFixed(2)} KB/min
- Active Instances: ${stats.activeInstances}
- Total Instances Created: ${stats.totalInstancesCreated}
- Instances Cleaned Up: ${stats.instancesCleanedUp}
- Average Instance Lifespan: ${(stats.averageInstanceLifespan / 1000).toFixed(2)}s
- Memory Efficiency: ${(stats.memoryEfficiency * 100).toFixed(1)}%

Memory Leaks Detected: ${leaks.length}
${leaks.map(leak => `- ${leak.type} in ${leak.componentType} (${leak.severity}): ${leak.description}`).join('\n')}

Unacknowledged Alerts: ${alerts.length}
${alerts.map(alert => `- ${alert.type}: ${alert.message}`).join('\n')}

Component Breakdown:
${Array.from(this.componentTypes).map(type => {
  const instances = this.getTrackedInstances(type)
  const staleCount = instances.filter(i => this.isInstanceStale(i)).length
  const totalMemory = instances.reduce((sum, i) => sum + i.memoryUsage, 0)
  return `- ${type}: ${instances.length} instances, ${staleCount} stale, ${(totalMemory / 1024).toFixed(2)} KB`
}).join('\n')}
    `.trim()
    
    return report
  }
  
  /**
   * Shutdown monitor
   */
  shutdown(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
    }
    
    // Cleanup all tracked instances
    this.trackedInstances.clear()
    this.cleanupFunctions.clear()
    this.detectedLeaks.clear()
    this.alerts.length = 0
    this.memorySamples.length = 0
    
    this.logger.info('LivePerformanceMonitor shutdown')
  }
  
  private startMonitoring(): void {
    if (this.config.monitoringInterval <= 0) return
    
    this.monitoringInterval = setInterval(() => {
      this.collectMemorySample()
      this.detectMemoryLeaks()
      
      if (this.config.enableAutoCleanup) {
        this.cleanupStaleInstances()
      }
      
      this.updateStats()
      this.checkThresholds()
    }, this.config.monitoringInterval)
    
    this.logger.debug('Memory monitoring started', {
      interval: this.config.monitoringInterval
    })
  }
  
  private collectMemorySample(): void {
    const now = Date.now()
    const totalMemory = this.calculateTotalMemory()
    const componentMemory: Record<string, number> = {}
    
    // Calculate memory by component type
    for (const componentType of this.componentTypes) {
      const instances = this.getTrackedInstances(componentType)
      componentMemory[componentType] = instances.reduce((sum, i) => sum + i.memoryUsage, 0)
    }
    
    const sample: MemorySample = {
      timestamp: now,
      totalMemory,
      usedMemory: totalMemory, // Simplified for this implementation
      componentMemory,
      totalInstances: this.trackedInstances.size,
      activeInstances: Array.from(this.trackedInstances.values()).filter(i => i.state === 'active').length,
      staleInstances: Array.from(this.trackedInstances.values()).filter(i => this.isInstanceStale(i)).length
    }
    
    this.memorySamples.push(sample)
    
    // Keep history size manageable
    if (this.memorySamples.length > this.config.memorySampleHistorySize) {
      this.memorySamples = this.memorySamples.slice(-this.config.memorySampleHistorySize)
    }
    
    // Update peak memory
    if (totalMemory > this.stats.peakMemory) {
      this.stats.peakMemory = totalMemory
    }
  }
  
  private updateStats(): void {
    const currentMemory = this.calculateTotalMemory()
    this.stats.currentMemory = currentMemory
    this.stats.activeInstances = this.trackedInstances.size
    
    // Calculate memory growth rate
    if (this.memorySamples.length >= 2) {
      const recent = this.memorySamples[this.memorySamples.length - 1]
      const previous = this.memorySamples[0]
      const timeDiff = recent.timestamp - previous.timestamp
      const memoryDiff = recent.totalMemory - previous.totalMemory
      this.stats.memoryGrowthRate = (memoryDiff / timeDiff) * 60000 // bytes per minute
    }
    
    // Calculate memory efficiency
    const expectedMemory = this.stats.activeInstances * 1024 // 1KB per instance baseline
    this.stats.memoryEfficiency = expectedMemory > 0 ? Math.min(expectedMemory / currentMemory, 1) : 1
  }
  
  private checkThresholds(): void {
    const currentMemoryMB = this.stats.currentMemory / 1024 / 1024
    
    if (currentMemoryMB > this.config.memoryCriticalThreshold) {
      this.generateAlert('memory_critical', 
        `Critical memory usage: ${currentMemoryMB.toFixed(2)}MB exceeds ${this.config.memoryCriticalThreshold}MB threshold`,
        undefined,
        { currentMemory: currentMemoryMB, threshold: this.config.memoryCriticalThreshold }
      )
    } else if (currentMemoryMB > this.config.memoryWarningThreshold) {
      this.generateAlert('memory_warning',
        `High memory usage: ${currentMemoryMB.toFixed(2)}MB exceeds ${this.config.memoryWarningThreshold}MB threshold`,
        undefined,
        { currentMemory: currentMemoryMB, threshold: this.config.memoryWarningThreshold }
      )
    }
  }
  
  private calculateTotalMemory(): number {
    return Array.from(this.trackedInstances.values())
      .reduce((sum, instance) => sum + instance.memoryUsage, 0)
  }
  
  private estimateInstanceMemory(componentType: string, properties: Record<string, any>): number {
    // Simple memory estimation - in real implementation, this would be more sophisticated
    const baseMemory = 1024 // 1KB base
    const propertyMemory = Object.keys(properties).length * 100 // 100 bytes per property
    return baseMemory + propertyMemory
  }
  
  private isInstanceStale(instance: InstanceInfo): boolean {
    const now = Date.now()
    return (now - instance.lastActivity) > this.config.staleInstanceTimeout
  }
  
  private createInstanceAccumulationLeak(componentType: string, instances: InstanceInfo[]): MemoryLeak {
    const now = Date.now()
    const totalMemory = instances.reduce((sum, i) => sum + i.memoryUsage, 0)
    const averageAge = instances.reduce((sum, i) => sum + (now - i.createdAt), 0) / instances.length
    const staleCount = instances.filter(i => this.isInstanceStale(i)).length
    
    return {
      type: 'instance_accumulation',
      severity: instances.length > this.config.instanceCountThreshold * 2 ? 'critical' : 'high',
      componentType,
      description: `Excessive instance accumulation detected: ${instances.length} instances`,
      evidence: {
        instanceCount: instances.length,
        memoryGrowthRate: this.stats.memoryGrowthRate,
        averageInstanceAge: averageAge,
        staleInstanceCount: staleCount
      },
      recommendations: [
        'Implement proper instance cleanup',
        'Check for memory leaks in component lifecycle',
        'Consider implementing instance pooling',
        'Review component creation patterns'
      ],
      detectedAt: now
    }
  }
  
  private createStaleReferenceLeak(componentType: string, instances: InstanceInfo[], staleInstances: InstanceInfo[]): MemoryLeak {
    const now = Date.now()
    const staleRatio = staleInstances.length / instances.length
    const averageAge = staleInstances.reduce((sum, i) => sum + (now - i.createdAt), 0) / staleInstances.length
    
    return {
      type: 'stale_references',
      severity: staleRatio > 0.5 ? 'high' : 'medium',
      componentType,
      description: `High stale instance ratio: ${(staleRatio * 100).toFixed(1)}% of instances are stale`,
      evidence: {
        instanceCount: instances.length,
        memoryGrowthRate: this.stats.memoryGrowthRate,
        averageInstanceAge: averageAge,
        staleInstanceCount: staleInstances.length
      },
      recommendations: [
        'Implement automatic cleanup for idle instances',
        'Review instance activity tracking',
        'Check for proper event listener cleanup',
        'Implement instance timeout mechanisms'
      ],
      detectedAt: now
    }
  }
  
  private detectMemoryGrowthLeak(): MemoryLeak | null {
    if (this.memorySamples.length < 3) return null
    
    // Check if memory is consistently growing
    const recentSamples = this.memorySamples.slice(-5) // Last 5 samples
    let growthStreak = 0
    
    for (let i = 1; i < recentSamples.length; i++) {
      if (recentSamples[i].totalMemory > recentSamples[i - 1].totalMemory) {
        growthStreak++
      } else {
        growthStreak = 0
      }
    }
    
    // If memory has grown in 3+ consecutive samples
    if (growthStreak >= 3 && this.stats.memoryGrowthRate > 1024 * 10) { // 10KB/min threshold
      return {
        type: 'memory_growth',
        severity: this.stats.memoryGrowthRate > 1024 * 100 ? 'critical' : 'high', // 100KB/min critical
        componentType: 'global',
        description: `Continuous memory growth detected: ${(this.stats.memoryGrowthRate / 1024).toFixed(2)} KB/min`,
        evidence: {
          instanceCount: this.stats.activeInstances,
          memoryGrowthRate: this.stats.memoryGrowthRate,
          averageInstanceAge: this.stats.averageInstanceLifespan,
          staleInstanceCount: Array.from(this.trackedInstances.values()).filter(i => this.isInstanceStale(i)).length
        },
        recommendations: [
          'Profile memory usage to identify leak sources',
          'Check for circular references',
          'Review event listener management',
          'Implement periodic garbage collection triggers'
        ],
        detectedAt: Date.now()
      }
    }
    
    return null
  }
  
  private generateAlert(
    type: PerformanceAlert['type'],
    message: string,
    componentType?: string,
    data: Record<string, any> = {}
  ): void {
    const alert: PerformanceAlert = {
      type,
      message,
      componentType,
      data,
      timestamp: Date.now(),
      acknowledged: false
    }
    
    this.alerts.push(alert)
    this.stats.alertsGenerated++
    
    // Notify listeners
    this.alertListeners.forEach(listener => {
      try {
        listener(alert)
      } catch (error) {
        this.logger.error('Alert listener error', {
          error: error instanceof Error ? error.message : String(error)
        })
      }
    })
    
    this.logger.warn('Performance alert generated', {
      type,
      message,
      componentType,
      data
    })
  }
}