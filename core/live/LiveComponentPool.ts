/**
 * LiveComponentPool
 * 
 * Implements instance pooling for LiveAction components to reduce
 * memory allocation/deallocation overhead and improve performance.
 * 
 * Features:
 * - Per-component-type pool management
 * - Acquire/release pattern for instance reuse
 * - Pool size limits and cleanup strategies
 * - Health monitoring and metrics
 * - Automatic cleanup of idle instances
 */

import type { Logger } from '../types'

/**
 * Pool configuration interface
 */
export interface PoolConfig {
  /** Maximum number of instances to keep in pool */
  maxPoolSize: number
  
  /** Minimum number of instances to keep warm */
  minPoolSize: number
  
  /** Time before idle instance is eligible for cleanup (ms) */
  maxIdleTime: number
  
  /** How often to run cleanup cycle (ms) */
  cleanupInterval: number
  
  /** Enable pool health monitoring */
  enableMonitoring: boolean
  
  /** Metrics collection interval (ms) */
  metricsInterval: number
  
  /** Enable automatic pool scaling */
  enableAutoScaling: boolean
  
  /** Target utilization for scaling decisions (0-1) */
  targetUtilization: number
}

/**
 * Pool instance metadata
 */
export interface PoolInstance<T = any> {
  /** The actual instance */
  instance: T
  
  /** When instance was created */
  createdAt: number
  
  /** When instance was last used */
  lastUsedAt: number
  
  /** How many times instance has been reused */
  useCount: number
  
  /** Whether instance is currently in use */
  inUse: boolean
  
  /** Instance initialization function */
  initFn?: () => void
  
  /** Instance cleanup function */
  cleanupFn?: () => void
}

/**
 * Pool metrics and statistics
 */
export interface PoolMetrics {
  /** Total instances in pool */
  totalInstances: number
  
  /** Currently available instances */
  availableInstances: number
  
  /** Currently in-use instances */
  inUseInstances: number
  
  /** Total acquire requests */
  totalAcquires: number
  
  /** Total release requests */
  totalReleases: number
  
  /** Cache hit rate (reused instances / total acquires) */
  hitRate: number
  
  /** Average instance lifespan (ms) */
  averageLifespan: number
  
  /** Average reuse count per instance */
  averageReuseCount: number
  
  /** Memory usage estimate (bytes) */
  memoryUsage: number
  
  /** Pool efficiency score (0-1) */
  efficiency: number
}

/**
 * Pool health status
 */
export interface PoolHealth {
  /** Pool status: healthy, warning, critical */
  status: 'healthy' | 'warning' | 'critical'
  
  /** Health issues detected */
  issues: string[]
  
  /** Recommendations for improvement */
  recommendations: string[]
  
  /** Current pool utilization (0-1) */
  utilization: number
  
  /** Pool performance trend */
  trend: 'improving' | 'stable' | 'degrading'
}

/**
 * LiveComponentPool class for instance management
 */
export class LiveComponentPool<T = any> {
  private static pools = new Map<string, LiveComponentPool>()
  
  /** Pool configuration */
  private config: PoolConfig
  
  /** Logger instance */
  private logger: Logger
  
  /** Component type identifier */
  private componentType: string
  
  /** Pool instances storage */
  private instances = new Map<string, PoolInstance<T>>()
  
  /** Available instances queue (LIFO for better cache locality) */
  private availableQueue: string[] = []
  
  /** Instance factory function */
  private instanceFactory: () => T
  
  /** Instance reset function */
  private instanceResetFn?: (instance: T) => void
  
  /** Cleanup interval handle */
  private cleanupInterval?: NodeJS.Timeout
  
  /** Metrics collection interval handle */
  private metricsInterval?: NodeJS.Timeout
  
  /** Pool metrics */
  private metrics: PoolMetrics = {
    totalInstances: 0,
    availableInstances: 0,
    inUseInstances: 0,
    totalAcquires: 0,
    totalReleases: 0,
    hitRate: 0,
    averageLifespan: 0,
    averageReuseCount: 0,
    memoryUsage: 0,
    efficiency: 0
  }
  
  /** Historical metrics for trend analysis */
  private metricsHistory: PoolMetrics[] = []
  
  constructor(
    componentType: string,
    instanceFactory: () => T,
    config: Partial<PoolConfig> = {},
    logger: Logger,
    instanceResetFn?: (instance: T) => void
  ) {
    this.componentType = componentType
    this.instanceFactory = instanceFactory
    this.instanceResetFn = instanceResetFn
    this.logger = logger
    
    this.config = {
      maxPoolSize: 20,
      minPoolSize: 2,
      maxIdleTime: 5 * 60 * 1000, // 5 minutes
      cleanupInterval: 60 * 1000, // 1 minute
      enableMonitoring: true,
      metricsInterval: 30 * 1000, // 30 seconds
      enableAutoScaling: true,
      targetUtilization: 0.7,
      ...config
    }
    
    this.startPeriodicTasks()
    this.warmupPool()
    
    this.logger.info('LiveComponentPool created', {
      componentType,
      config: this.config
    })
  }
  
  /**
   * Get or create pool for component type
   */
  static getPool<T>(
    componentType: string,
    instanceFactory: () => T,
    config?: Partial<PoolConfig>,
    logger?: Logger,
    instanceResetFn?: (instance: T) => void
  ): LiveComponentPool<T> {
    if (!this.pools.has(componentType)) {
      if (!logger) {
        throw new Error('Logger required for new pool creation')
      }
      
      const pool = new LiveComponentPool(
        componentType,
        instanceFactory,
        config,
        logger,
        instanceResetFn
      )
      this.pools.set(componentType, pool as LiveComponentPool)
    }
    
    return this.pools.get(componentType) as LiveComponentPool<T>
  }
  
  /**
   * Acquire instance from pool
   */
  acquire(): T {
    this.metrics.totalAcquires++
    
    // Try to reuse existing instance
    const instanceId = this.availableQueue.pop()
    if (instanceId) {
      const poolInstance = this.instances.get(instanceId)!
      poolInstance.inUse = true
      poolInstance.lastUsedAt = Date.now()
      poolInstance.useCount++
      
      this.updateAvailableCount()
      
      this.logger.debug('Instance acquired from pool', {
        componentType: this.componentType,
        instanceId,
        useCount: poolInstance.useCount
      })
      
      return poolInstance.instance
    }
    
    // Create new instance if pool not at capacity
    if (this.instances.size < this.config.maxPoolSize) {
      const instance = this.createNewInstance()
      this.logger.debug('New instance created', {
        componentType: this.componentType,
        totalInstances: this.instances.size
      })
      return instance
    }
    
    // Pool is full, create temporary instance (not pooled)
    this.logger.warn('Pool capacity reached, creating temporary instance', {
      componentType: this.componentType,
      maxPoolSize: this.config.maxPoolSize
    })
    
    return this.instanceFactory()
  }
  
  /**
   * Release instance back to pool
   */
  release(instance: T): boolean {
    this.metrics.totalReleases++
    
    // Find instance in pool
    let poolInstance: PoolInstance<T> | undefined
    let instanceId: string | undefined
    
    for (const [id, poolInst] of this.instances) {
      if (poolInst.instance === instance) {
        poolInstance = poolInst
        instanceId = id
        break
      }
    }
    
    if (!poolInstance || !instanceId) {
      this.logger.debug('Instance not from pool, cannot release', {
        componentType: this.componentType
      })
      return false
    }
    
    if (!poolInstance.inUse) {
      this.logger.warn('Instance already released', {
        componentType: this.componentType,
        instanceId
      })
      return false
    }
    
    // Reset instance if reset function provided
    if (this.instanceResetFn) {
      try {
        this.instanceResetFn(instance)
      } catch (error) {
        this.logger.error('Instance reset failed, removing from pool', {
          componentType: this.componentType,
          instanceId,
          error: error instanceof Error ? error.message : String(error)
        })
        this.removeInstance(instanceId)
        return false
      }
    }
    
    // Return to available queue
    poolInstance.inUse = false
    poolInstance.lastUsedAt = Date.now()
    this.availableQueue.push(instanceId)
    
    this.updateAvailableCount()
    
    this.logger.debug('Instance released to pool', {
      componentType: this.componentType,
      instanceId,
      availableCount: this.availableQueue.length
    })
    
    return true
  }
  
  /**
   * Get pool metrics
   */
  getMetrics(): PoolMetrics {
    this.updateMetrics()
    return { ...this.metrics }
  }
  
  /**
   * Get pool health status
   */
  getHealth(): PoolHealth {
    const utilization = this.metrics.inUseInstances / this.metrics.totalInstances || 0
    const issues: string[] = []
    const recommendations: string[] = []
    
    // Check for issues
    if (utilization > 0.9) {
      issues.push('High pool utilization')
      recommendations.push('Consider increasing maxPoolSize')
    }
    
    if (this.metrics.hitRate < 0.5) {
      issues.push('Low cache hit rate')
      recommendations.push('Instances may not be suitable for pooling')
    }
    
    if (this.metrics.averageLifespan < this.config.maxIdleTime * 0.1) {
      issues.push('Very short instance lifespan')
      recommendations.push('Consider reducing pool size or increasing maxIdleTime')
    }
    
    // Determine status
    let status: PoolHealth['status'] = 'healthy'
    if (issues.length > 2) status = 'critical'
    else if (issues.length > 0) status = 'warning'
    
    // Calculate trend
    let trend: PoolHealth['trend'] = 'stable'
    if (this.metricsHistory.length >= 2) {
      const recent = this.metricsHistory[this.metricsHistory.length - 1]
      const previous = this.metricsHistory[this.metricsHistory.length - 2]
      
      if (recent.efficiency > previous.efficiency * 1.05) {
        trend = 'improving'
      } else if (recent.efficiency < previous.efficiency * 0.95) {
        trend = 'degrading'
      }
    }
    
    return {
      status,
      issues,
      recommendations,
      utilization,
      trend
    }
  }
  
  /**
   * Clear all instances from pool
   */
  clear(): void {
    // Clean up all instances
    for (const [instanceId, poolInstance] of this.instances) {
      if (poolInstance.cleanupFn) {
        try {
          poolInstance.cleanupFn()
        } catch (error) {
          this.logger.error('Instance cleanup failed', {
            componentType: this.componentType,
            instanceId,
            error: error instanceof Error ? error.message : String(error)
          })
        }
      }
    }
    
    this.instances.clear()
    this.availableQueue.length = 0
    this.updateAvailableCount()
    
    this.logger.info('Pool cleared', {
      componentType: this.componentType
    })
  }
  
  /**
   * Shutdown pool
   */
  shutdown(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval)
    }
    
    this.clear()
    LiveComponentPool.pools.delete(this.componentType)
    
    this.logger.info('Pool shutdown', {
      componentType: this.componentType
    })
  }
  
  /**
   * Force pool scaling based on current demand
   */
  scale(): void {
    if (!this.config.enableAutoScaling) return
    
    const utilization = this.metrics.inUseInstances / this.metrics.totalInstances || 0
    const targetUtilization = this.config.targetUtilization
    
    if (utilization > targetUtilization && this.instances.size < this.config.maxPoolSize) {
      // Scale up
      const instancesToAdd = Math.min(
        Math.ceil((utilization - targetUtilization) * this.instances.size),
        this.config.maxPoolSize - this.instances.size
      )
      
      for (let i = 0; i < instancesToAdd; i++) {
        this.createPooledInstance()
      }
      
      this.logger.info('Pool scaled up', {
        componentType: this.componentType,
        added: instancesToAdd,
        totalInstances: this.instances.size
      })
      
    } else if (utilization < targetUtilization * 0.5 && this.availableQueue.length > this.config.minPoolSize) {
      // Scale down
      const instancesToRemove = Math.min(
        Math.floor((targetUtilization * 0.5 - utilization) * this.instances.size),
        this.availableQueue.length - this.config.minPoolSize
      )
      
      for (let i = 0; i < instancesToRemove && this.availableQueue.length > this.config.minPoolSize; i++) {
        const instanceId = this.availableQueue.shift()!
        this.removeInstance(instanceId)
      }
      
      this.logger.info('Pool scaled down', {
        componentType: this.componentType,
        removed: instancesToRemove,
        totalInstances: this.instances.size
      })
    }
  }
  
  private createNewInstance(): T {
    const instance = this.instanceFactory()
    const instanceId = this.generateInstanceId()
    
    const poolInstance: PoolInstance<T> = {
      instance,
      createdAt: Date.now(),
      lastUsedAt: Date.now(),
      useCount: 1,
      inUse: true
    }
    
    this.instances.set(instanceId, poolInstance)
    this.updateAvailableCount()
    
    return instance
  }
  
  private createPooledInstance(): string {
    const instance = this.instanceFactory()
    const instanceId = this.generateInstanceId()
    
    const poolInstance: PoolInstance<T> = {
      instance,
      createdAt: Date.now(),
      lastUsedAt: Date.now(),
      useCount: 0,
      inUse: false
    }
    
    this.instances.set(instanceId, poolInstance)
    this.availableQueue.push(instanceId)
    this.updateAvailableCount()
    
    return instanceId
  }
  
  private removeInstance(instanceId: string): void {
    const poolInstance = this.instances.get(instanceId)
    if (!poolInstance) return
    
    if (poolInstance.cleanupFn) {
      try {
        poolInstance.cleanupFn()
      } catch (error) {
        this.logger.error('Instance cleanup failed', {
          componentType: this.componentType,
          instanceId,
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }
    
    this.instances.delete(instanceId)
    const queueIndex = this.availableQueue.indexOf(instanceId)
    if (queueIndex !== -1) {
      this.availableQueue.splice(queueIndex, 1)
    }
    
    this.updateAvailableCount()
  }
  
  private warmupPool(): void {
    const instancesToCreate = Math.max(0, this.config.minPoolSize)
    
    for (let i = 0; i < instancesToCreate; i++) {
      this.createPooledInstance()
    }
    
    this.logger.info('Pool warmed up', {
      componentType: this.componentType,
      instances: instancesToCreate
    })
  }
  
  private startPeriodicTasks(): void {
    if (this.config.cleanupInterval > 0) {
      this.cleanupInterval = setInterval(() => {
        this.cleanupIdleInstances()
      }, this.config.cleanupInterval)
    }
    
    if (this.config.enableMonitoring && this.config.metricsInterval > 0) {
      this.metricsInterval = setInterval(() => {
        this.updateMetrics()
        this.collectMetricsHistory()
        if (this.config.enableAutoScaling) {
          this.scale()
        }
      }, this.config.metricsInterval)
    }
  }
  
  private cleanupIdleInstances(): void {
    const now = Date.now()
    const instancesToRemove: string[] = []
    
    for (const [instanceId, poolInstance] of this.instances) {
      if (!poolInstance.inUse && 
          (now - poolInstance.lastUsedAt) > this.config.maxIdleTime &&
          this.availableQueue.length > this.config.minPoolSize) {
        instancesToRemove.push(instanceId)
      }
    }
    
    instancesToRemove.forEach(instanceId => {
      this.removeInstance(instanceId)
    })
    
    if (instancesToRemove.length > 0) {
      this.logger.debug('Cleaned up idle instances', {
        componentType: this.componentType,
        cleaned: instancesToRemove.length,
        remaining: this.instances.size
      })
    }
  }
  
  private updateMetrics(): void {
    const inUseCount = Array.from(this.instances.values())
      .filter(inst => inst.inUse).length
    
    const totalUseCount = Array.from(this.instances.values())
      .reduce((sum, inst) => sum + inst.useCount, 0)
    
    const totalLifespan = Array.from(this.instances.values())
      .reduce((sum, inst) => sum + (Date.now() - inst.createdAt), 0)
    
    this.metrics = {
      totalInstances: this.instances.size,
      availableInstances: this.availableQueue.length,
      inUseInstances: inUseCount,
      totalAcquires: this.metrics.totalAcquires,
      totalReleases: this.metrics.totalReleases,
      hitRate: this.metrics.totalAcquires > 0 ? 
        (this.metrics.totalReleases / this.metrics.totalAcquires) : 0,
      averageLifespan: this.instances.size > 0 ? totalLifespan / this.instances.size : 0,
      averageReuseCount: this.instances.size > 0 ? totalUseCount / this.instances.size : 0,
      memoryUsage: this.estimateMemoryUsage(),
      efficiency: this.calculateEfficiency()
    }
  }
  
  private collectMetricsHistory(): void {
    this.metricsHistory.push({ ...this.metrics })
    
    // Keep only last 100 metrics entries
    if (this.metricsHistory.length > 100) {
      this.metricsHistory = this.metricsHistory.slice(-100)
    }
  }
  
  private estimateMemoryUsage(): number {
    // Very rough estimate - in real implementation, this would be more sophisticated
    return this.instances.size * 1024 // 1KB per instance estimate
  }
  
  private calculateEfficiency(): number {
    if (this.metrics.totalAcquires === 0) return 0
    
    // Efficiency is a combination of hit rate, utilization, and resource usage
    const hitRateScore = this.metrics.hitRate
    const utilizationScore = Math.min(this.metrics.inUseInstances / this.config.maxPoolSize, 1)
    const reuseScore = Math.min(this.metrics.averageReuseCount / 10, 1) // Normalize to 0-1
    
    return (hitRateScore * 0.4 + utilizationScore * 0.3 + reuseScore * 0.3)
  }
  
  private updateAvailableCount(): void {
    this.metrics.availableInstances = this.availableQueue.length
    this.metrics.inUseInstances = Array.from(this.instances.values())
      .filter(inst => inst.inUse).length
  }
  
  private generateInstanceId(): string {
    return `pool_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  /**
   * Get all pools statistics
   */
  static getAllPoolsStats(): Record<string, PoolMetrics> {
    const stats: Record<string, PoolMetrics> = {}
    
    for (const [componentType, pool] of this.pools) {
      stats[componentType] = pool.getMetrics()
    }
    
    return stats
  }
  
  /**
   * Shutdown all pools
   */
  static shutdownAll(): void {
    for (const pool of this.pools.values()) {
      pool.shutdown()
    }
    this.pools.clear()
  }
}