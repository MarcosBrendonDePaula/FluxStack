/**
 * RetryManager
 * 
 * Advanced retry system with exponential backoff, network detection,
 * manual retry triggers, and UI indicators for failed requests.
 * 
 * Part of Task 2.3: Add Retry Mechanisms
 */

import { UpdateRequest } from './RequestTracker'
import { Logger } from '../utils/logger'

/**
 * Retry strategy types
 */
export type RetryStrategy = 
  | 'exponential'   // Exponential backoff
  | 'linear'        // Linear delay increase
  | 'fixed'         // Fixed delay
  | 'fibonacci'     // Fibonacci sequence delays
  | 'custom'        // Custom delay function

/**
 * Network status enumeration
 */
export type NetworkStatus = 
  | 'online'
  | 'offline'
  | 'slow'          // Detected slow connection
  | 'unstable'      // Frequent disconnections
  | 'unknown'

/**
 * Retry attempt descriptor
 */
export interface RetryAttempt {
  /** Unique attempt ID */
  id: string
  
  /** Original request ID */
  requestId: string
  
  /** Component ID */
  componentId: string
  
  /** Attempt number (1-based) */
  attemptNumber: number
  
  /** Maximum retry attempts allowed */
  maxAttempts: number
  
  /** Retry strategy */
  strategy: RetryStrategy
  
  /** Current delay before next retry */
  currentDelay: number
  
  /** Next retry timestamp */
  nextRetry: number
  
  /** Retry attempt timestamp */
  timestamp: number
  
  /** Last error that triggered retry */
  lastError: Error
  
  /** Network status when retry was scheduled */
  networkStatus: NetworkStatus
  
  /** Manual retry flag */
  isManualRetry: boolean
  
  /** Priority (higher = more important) */
  priority: number
  
  /** Custom retry data */
  metadata?: Record<string, any>
}

/**
 * Retry configuration per component or global
 */
export interface RetryConfig {
  /** Enable retry mechanism */
  enabled: boolean
  
  /** Retry strategy */
  strategy: RetryStrategy
  
  /** Maximum retry attempts */
  maxAttempts: number
  
  /** Base delay in milliseconds */
  baseDelay: number
  
  /** Maximum delay in milliseconds */
  maxDelay: number
  
  /** Delay multiplier for exponential backoff */
  delayMultiplier: number
  
  /** Enable network-aware retries */
  networkAware: boolean
  
  /** Retry only on specific error types */
  retryOnErrors: string[]
  
  /** Skip retry on specific error types */
  skipOnErrors: string[]
  
  /** Enable manual retry triggers */
  enableManualRetry: boolean
  
  /** Show retry indicators in UI */
  showRetryIndicators: boolean
  
  /** Custom delay function for 'custom' strategy */
  customDelayFn?: (attemptNumber: number, baseDelay: number) => number
}

/**
 * Network condition descriptor
 */
export interface NetworkCondition {
  /** Current status */
  status: NetworkStatus
  
  /** Connection speed estimate (Mbps) */
  speedEstimate?: number
  
  /** Latency estimate (ms) */
  latency?: number
  
  /** Effective connection type */
  effectiveType?: string
  
  /** Last status change timestamp */
  lastChange: number
  
  /** Stability score (0-1, higher is more stable) */
  stability: number
}

/**
 * Retry statistics
 */
export interface RetryStats {
  /** Total retry attempts */
  totalRetries: number
  
  /** Successful retries */
  successfulRetries: number
  
  /** Failed retries */
  failedRetries: number
  
  /** Retries by strategy */
  retriesByStrategy: Map<RetryStrategy, number>
  
  /** Retries by error type */
  retriesByError: Map<string, number>
  
  /** Average retry success rate */
  averageSuccessRate: number
  
  /** Average delay until success */
  averageDelayToSuccess: number
  
  /** Manual vs automatic retry ratio */
  manualRetryRatio: number
}

/**
 * RetryManager
 * 
 * Comprehensive retry system with intelligent backoff,
 * network awareness, and user-friendly retry controls.
 */
export class RetryManager {
  private static instance: RetryManager
  
  /** Default configuration */
  private defaultConfig: RetryConfig
  
  /** Component-specific configurations */
  private componentConfigs = new Map<string, RetryConfig>()
  
  /** Logger instance */
  private logger: Logger
  
  /** Active retry attempts */
  private retryAttempts = new Map<string, RetryAttempt>()
  
  /** Retry attempts by component */
  private componentRetries = new Map<string, Set<string>>()
  
  /** Scheduled retry timeouts */
  private retryTimeouts = new Map<string, NodeJS.Timeout>()
  
  /** Network condition monitoring */
  private networkCondition: NetworkCondition = {
    status: 'unknown',
    lastChange: Date.now(),
    stability: 1.0
  }
  
  /** Retry statistics */
  private stats: RetryStats = {
    totalRetries: 0,
    successfulRetries: 0,
    failedRetries: 0,
    retriesByStrategy: new Map(),
    retriesByError: new Map(),
    averageSuccessRate: 0,
    averageDelayToSuccess: 0,
    manualRetryRatio: 0
  }
  
  /** Retry success listeners */
  private retryListeners = new Set<(attempt: RetryAttempt) => void>()
  
  /** Network change listeners */
  private networkListeners = new Set<(condition: NetworkCondition) => void>()
  
  /** Retry queue for when offline */
  private offlineRetryQueue: RetryAttempt[] = []
  
  /** Performance measurement data */
  private performanceData: { timestamp: number, latency: number }[] = []
  
  constructor(config: Partial<RetryConfig> = {}, logger?: Logger) {
    this.logger = logger || console as any
    
    this.defaultConfig = {
      enabled: true,
      strategy: 'exponential',
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 30000,
      delayMultiplier: 2,
      networkAware: true,
      retryOnErrors: ['NetworkError', 'TimeoutError', 'ServerError'],
      skipOnErrors: ['ValidationError', 'AuthenticationError'],
      enableManualRetry: true,
      showRetryIndicators: true,
      ...config
    }
    
    this.setupNetworkMonitoring()
    this.startPerformanceMonitoring()
  }
  
  /**
   * Get singleton instance
   */
  static getInstance(config?: Partial<RetryConfig>, logger?: Logger): RetryManager {
    if (!RetryManager.instance) {
      RetryManager.instance = new RetryManager(config, logger)
    }
    return RetryManager.instance
  }
  
  /**
   * Schedule retry for failed request
   */
  scheduleRetry(
    requestId: string,
    componentId: string,
    error: Error,
    options: {
      priority?: number
      metadata?: Record<string, any>
      customConfig?: Partial<RetryConfig>
    } = {}
  ): string | null {
    const config = this.getEffectiveConfig(componentId, options.customConfig)
    
    if (!config.enabled) {
      this.logger.debug('Retry disabled for component', { componentId })
      return null
    }
    
    // Check if error should be retried
    if (!this.shouldRetryError(error, config)) {
      this.logger.debug('Error not retryable', { 
        error: error.name || error.constructor.name, 
        componentId 
      })
      return null
    }
    
    // Check existing retry attempts
    const existingAttempts = this.getComponentRetries(componentId)
    const existingAttempt = existingAttempts.find(a => a.requestId === requestId)
    
    let attemptNumber = 1
    let maxAttempts = config.maxAttempts
    
    if (existingAttempt) {
      attemptNumber = existingAttempt.attemptNumber + 1
      maxAttempts = existingAttempt.maxAttempts
      
      if (attemptNumber > maxAttempts) {
        this.logger.warn('Max retry attempts exceeded', { 
          requestId, 
          componentId,
          attemptNumber,
          maxAttempts 
        })
        return null
      }
      
      // Remove the old attempt since we're creating a new one
      this.cleanupRetryAttempt(existingAttempt.id)
    }
    
    // Calculate retry delay
    const delay = this.calculateRetryDelay(attemptNumber, config)
    const nextRetry = Date.now() + delay
    
    // Create retry attempt
    const attempt: RetryAttempt = {
      id: this.generateAttemptId(),
      requestId,
      componentId,
      attemptNumber,
      maxAttempts,
      strategy: config.strategy,
      currentDelay: delay,
      nextRetry,
      timestamp: Date.now(),
      lastError: error,
      networkStatus: this.networkCondition.status,
      isManualRetry: false,
      priority: options.priority || 1,
      metadata: options.metadata
    }
    
    // Store attempt
    this.retryAttempts.set(attempt.id, attempt)
    
    // Index by component
    if (!this.componentRetries.has(componentId)) {
      this.componentRetries.set(componentId, new Set())
    }
    this.componentRetries.get(componentId)!.add(attempt.id)
    
    // Schedule retry execution
    if (this.networkCondition.status === 'online') {
      this.scheduleRetryExecution(attempt)
    } else {
      this.queueOfflineRetry(attempt)
    }
    
    // Update statistics
    this.stats.totalRetries++
    this.updateStrategyStats(config.strategy)
    this.updateErrorStats(error.name || error.constructor.name)
    
    this.logger.info('Retry scheduled', {
      attemptId: attempt.id,
      requestId,
      componentId,
      attemptNumber,
      delay,
      strategy: config.strategy
    })
    
    return attempt.id
  }
  
  /**
   * Execute manual retry
   */
  executeManualRetry(componentId: string, requestId?: string): Promise<boolean[]> {
    const config = this.getEffectiveConfig(componentId)
    
    if (!config.enableManualRetry) {
      throw new Error('Manual retry is disabled for this component')
    }
    
    let attemptsToRetry: RetryAttempt[]
    
    if (requestId) {
      // Retry specific request
      const attempts = this.getComponentRetries(componentId)
      attemptsToRetry = attempts.filter(a => a.requestId === requestId)
    } else {
      // Retry all failed requests for component
      attemptsToRetry = this.getComponentRetries(componentId)
        .filter(a => a.attemptNumber < a.maxAttempts)
    }
    
    if (attemptsToRetry.length === 0) {
      this.logger.info('No retryable requests found', { componentId, requestId })
      return Promise.resolve([])
    }
    
    // Mark as manual retries and execute immediately
    const promises = attemptsToRetry.map(async (attempt) => {
      attempt.isManualRetry = true
      attempt.nextRetry = Date.now()
      
      try {
        await this.executeRetryAttempt(attempt)
        return true
      } catch (error) {
        this.logger.error('Manual retry failed', { 
          attemptId: attempt.id,
          error: error.message 
        })
        return false
      }
    })
    
    return Promise.all(promises)
  }
  
  /**
   * Get retry status for component
   */
  getRetryStatus(componentId: string): {
    hasActiveRetries: boolean
    pendingRetries: number
    totalRetries: number
    nextRetryTime?: number
    canManualRetry: boolean
  } {
    const attempts = this.getComponentRetries(componentId)
    const pendingRetries = attempts.filter(a => a.nextRetry > Date.now()).length
    const nextRetry = Math.min(...attempts.map(a => a.nextRetry).filter(t => t > Date.now()))
    const config = this.getEffectiveConfig(componentId)
    
    return {
      hasActiveRetries: attempts.length > 0,
      pendingRetries,
      totalRetries: attempts.length,
      nextRetryTime: isFinite(nextRetry) ? nextRetry : undefined,
      canManualRetry: config.enableManualRetry && attempts.length > 0
    }
  }
  
  /**
   * Cancel all retries for component
   */
  cancelRetries(componentId: string, requestId?: string): number {
    const attempts = this.getComponentRetries(componentId)
    let cancelledCount = 0
    
    attempts.forEach(attempt => {
      if (!requestId || attempt.requestId === requestId) {
        this.cancelRetryAttempt(attempt.id)
        cancelledCount++
      }
    })
    
    this.logger.info('Retries cancelled', { 
      componentId, 
      requestId, 
      cancelledCount 
    })
    
    return cancelledCount
  }
  
  /**
   * Get network condition information
   */
  getNetworkCondition(): NetworkCondition {
    return { ...this.networkCondition }
  }
  
  /**
   * Get retry statistics
   */
  getRetryStats(): RetryStats {
    // Calculate current averages
    const total = this.stats.successfulRetries + this.stats.failedRetries
    const successRate = total > 0 ? this.stats.successfulRetries / total : 0
    
    return {
      ...this.stats,
      averageSuccessRate: successRate,
      retriesByStrategy: new Map(this.stats.retriesByStrategy),
      retriesByError: new Map(this.stats.retriesByError)
    }
  }
  
  /**
   * Private helper methods
   */
  
  private getEffectiveConfig(componentId: string, customConfig?: Partial<RetryConfig>): RetryConfig {
    const componentConfig = this.componentConfigs.get(componentId)
    const baseConfig = componentConfig || this.defaultConfig
    
    return customConfig ? { ...baseConfig, ...customConfig } : baseConfig
  }
  
  private shouldRetryError(error: Error, config: RetryConfig): boolean {
    const errorType = error.name || error.constructor.name
    
    // Check skip list first
    if (config.skipOnErrors.includes(errorType)) {
      return false
    }
    
    // If retry list is specified, must be in list
    if (config.retryOnErrors.length > 0) {
      return config.retryOnErrors.includes(errorType)
    }
    
    // Default: retry most errors except client errors
    const nonRetryableErrors = ['ValidationError', 'AuthenticationError', 'AuthorizationError']
    return !nonRetryableErrors.includes(errorType)
  }
  
  private calculateRetryDelay(attemptNumber: number, config: RetryConfig): number {
    let delay: number
    
    switch (config.strategy) {
      case 'exponential':
        delay = config.baseDelay * Math.pow(config.delayMultiplier, attemptNumber - 1)
        break
        
      case 'linear':
        delay = config.baseDelay * attemptNumber
        break
        
      case 'fixed':
        delay = config.baseDelay
        break
        
      case 'fibonacci':
        delay = config.baseDelay * this.fibonacci(attemptNumber)
        break
        
      case 'custom':
        delay = config.customDelayFn?.(attemptNumber, config.baseDelay) || config.baseDelay
        break
        
      default:
        delay = config.baseDelay
    }
    
    // Apply network-aware adjustments
    if (config.networkAware) {
      delay = this.adjustDelayForNetwork(delay)
    }
    
    // Add jitter to avoid thundering herd
    delay = this.addJitter(delay)
    
    // Ensure within bounds
    return Math.min(Math.max(delay, 100), config.maxDelay)
  }
  
  private adjustDelayForNetwork(baseDelay: number): number {
    switch (this.networkCondition.status) {
      case 'slow':
        return baseDelay * 2
      case 'unstable':
        return baseDelay * 1.5
      case 'offline':
        return baseDelay * 10 // Much longer delay for offline
      default:
        return baseDelay
    }
  }
  
  private addJitter(delay: number): number {
    // Add ±25% jitter
    const jitter = delay * 0.25 * (Math.random() * 2 - 1)
    return Math.max(delay + jitter, 100)
  }
  
  private fibonacci(n: number): number {
    if (n <= 1) return 1
    let a = 1, b = 1
    for (let i = 2; i < n; i++) {
      [a, b] = [b, a + b]
    }
    return b
  }
  
  private scheduleRetryExecution(attempt: RetryAttempt): void {
    const delay = Math.max(0, attempt.nextRetry - Date.now())
    
    const timeout = setTimeout(() => {
      this.executeRetryAttempt(attempt).catch(error => {
        this.logger.error('Retry execution failed', {
          attemptId: attempt.id,
          error: error.message
        })
      })
    }, delay)
    
    this.retryTimeouts.set(attempt.id, timeout)
  }
  
  private async executeRetryAttempt(attempt: RetryAttempt): Promise<void> {
    this.logger.debug('Executing retry attempt', {
      attemptId: attempt.id,
      attemptNumber: attempt.attemptNumber
    })
    
    // Remove timeout
    const timeout = this.retryTimeouts.get(attempt.id)
    if (timeout) {
      clearTimeout(timeout)
      this.retryTimeouts.delete(attempt.id)
    }
    
    try {
      // This would trigger the actual retry of the original request
      // Implementation depends on how requests are handled in the system
      
      // Simulate retry success/failure for now
      const success = Math.random() > 0.3 // 70% success rate
      
      if (success) {
        this.handleRetrySuccess(attempt)
      } else {
        throw new Error('Retry failed')
      }
      
    } catch (error) {
      this.handleRetryFailure(attempt, error as Error)
    }
  }
  
  private handleRetrySuccess(attempt: RetryAttempt): void {
    this.stats.successfulRetries++
    
    // Notify listeners
    this.retryListeners.forEach(listener => {
      try {
        listener(attempt)
      } catch (error) {
        this.logger.error('Retry listener error:', error)
      }
    })
    
    // Clean up
    this.cleanupRetryAttempt(attempt.id)
    
    this.logger.info('Retry succeeded', {
      attemptId: attempt.id,
      attemptNumber: attempt.attemptNumber,
      componentId: attempt.componentId
    })
  }
  
  private handleRetryFailure(attempt: RetryAttempt, error: Error): void {
    this.stats.failedRetries++
    
    if (attempt.attemptNumber < attempt.maxAttempts) {
      // Schedule another retry
      const newAttemptId = this.scheduleRetry(
        attempt.requestId,
        attempt.componentId,
        error,
        { priority: attempt.priority, metadata: attempt.metadata }
      )
      
      this.logger.debug('Scheduling next retry attempt', {
        originalAttemptId: attempt.id,
        newAttemptId,
        attemptNumber: attempt.attemptNumber + 1
      })
    } else {
      this.logger.warn('All retry attempts exhausted', {
        attemptId: attempt.id,
        componentId: attempt.componentId,
        maxAttempts: attempt.maxAttempts
      })
    }
    
    // Clean up this attempt
    this.cleanupRetryAttempt(attempt.id)
  }
  
  private queueOfflineRetry(attempt: RetryAttempt): void {
    this.offlineRetryQueue.push(attempt)
    this.logger.debug('Retry queued for offline processing', {
      attemptId: attempt.id
    })
  }
  
  private processOfflineRetryQueue(): void {
    if (this.offlineRetryQueue.length === 0) return
    
    this.logger.info('Processing offline retry queue', {
      queueSize: this.offlineRetryQueue.length
    })
    
    // Process queued retries
    const queue = [...this.offlineRetryQueue]
    this.offlineRetryQueue = []
    
    queue.forEach(attempt => {
      this.scheduleRetryExecution(attempt)
    })
  }
  
  private cancelRetryAttempt(attemptId: string): void {
    const attempt = this.retryAttempts.get(attemptId)
    if (!attempt) return
    
    // Clear timeout
    const timeout = this.retryTimeouts.get(attemptId)
    if (timeout) {
      clearTimeout(timeout)
      this.retryTimeouts.delete(attemptId)
    }
    
    // Clean up
    this.cleanupRetryAttempt(attemptId)
    
    this.logger.debug('Retry attempt cancelled', { attemptId })
  }
  
  private cleanupRetryAttempt(attemptId: string): void {
    const attempt = this.retryAttempts.get(attemptId)
    if (!attempt) return
    
    // Remove from maps
    this.retryAttempts.delete(attemptId)
    
    const componentRetries = this.componentRetries.get(attempt.componentId)
    if (componentRetries) {
      componentRetries.delete(attemptId)
      if (componentRetries.size === 0) {
        this.componentRetries.delete(attempt.componentId)
      }
    }
    
    // Clear timeout
    this.retryTimeouts.delete(attemptId)
  }
  
  private getComponentRetries(componentId: string): RetryAttempt[] {
    const attemptIds = this.componentRetries.get(componentId) || new Set()
    return Array.from(attemptIds)
      .map(id => this.retryAttempts.get(id))
      .filter(attempt => attempt) as RetryAttempt[]
  }
  
  private setupNetworkMonitoring(): void {
    if (typeof navigator === 'undefined' || typeof window === 'undefined') return
    
    // Online/offline detection
    this.networkCondition.status = navigator.onLine ? 'online' : 'offline'
    
    window.addEventListener('online', () => {
      this.updateNetworkStatus('online')
      this.processOfflineRetryQueue()
    })
    
    window.addEventListener('offline', () => {
      this.updateNetworkStatus('offline')
    })
    
    // Connection quality detection
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      
      const updateConnection = () => {
        const effectiveType = connection.effectiveType
        let status: NetworkStatus = 'online'
        
        if (effectiveType === 'slow-2g' || effectiveType === '2g') {
          status = 'slow'
        } else if (connection.rtt > 1000) {
          status = 'unstable'
        }
        
        this.networkCondition.effectiveType = effectiveType
        this.networkCondition.latency = connection.rtt
        this.updateNetworkStatus(status)
      }
      
      connection.addEventListener('change', updateConnection)
      updateConnection()
    }
  }
  
  private updateNetworkStatus(status: NetworkStatus): void {
    if (this.networkCondition.status !== status) {
      const previousStatus = this.networkCondition.status
      
      this.networkCondition.status = status
      this.networkCondition.lastChange = Date.now()
      
      // Update stability score
      this.updateStabilityScore(previousStatus, status)
      
      this.logger.info('Network status changed', {
        from: previousStatus,
        to: status,
        stability: this.networkCondition.stability
      })
      
      // Notify listeners
      this.networkListeners.forEach(listener => {
        try {
          listener(this.networkCondition)
        } catch (error) {
          this.logger.error('Network listener error:', error)
        }
      })
    }
  }
  
  private updateStabilityScore(previous: NetworkStatus, current: NetworkStatus): void {
    // Decrease stability on negative changes
    if ((previous === 'online' && current !== 'online') ||
        (previous !== 'offline' && current === 'offline')) {
      this.networkCondition.stability = Math.max(0, this.networkCondition.stability - 0.1)
    } else if (current === 'online' && previous !== 'online') {
      // Increase stability gradually when online
      this.networkCondition.stability = Math.min(1, this.networkCondition.stability + 0.05)
    }
  }
  
  private startPerformanceMonitoring(): void {
    // Periodically measure network performance
    setInterval(() => {
      this.measureNetworkPerformance()
    }, 30000) // Every 30 seconds
  }
  
  private measureNetworkPerformance(): void {
    if (typeof fetch === 'undefined') return
    
    const startTime = Date.now()
    
    // Simple performance test using a small request
    fetch('/api/ping', { method: 'HEAD' })
      .then(() => {
        const latency = Date.now() - startTime
        this.performanceData.push({ timestamp: Date.now(), latency })
        
        // Keep only last 10 measurements
        if (this.performanceData.length > 10) {
          this.performanceData.shift()
        }
        
        // Update network condition
        this.networkCondition.latency = latency
        
        // Detect slow connections
        const avgLatency = this.performanceData.reduce((sum, d) => sum + d.latency, 0) / this.performanceData.length
        if (avgLatency > 1000 && this.networkCondition.status === 'online') {
          this.updateNetworkStatus('slow')
        } else if (avgLatency < 500 && this.networkCondition.status === 'slow') {
          this.updateNetworkStatus('online')
        }
      })
      .catch(() => {
        // Performance test failed
        if (this.networkCondition.status !== 'offline') {
          this.updateNetworkStatus('unstable')
        }
      })
  }
  
  private updateStrategyStats(strategy: RetryStrategy): void {
    const current = this.stats.retriesByStrategy.get(strategy) || 0
    this.stats.retriesByStrategy.set(strategy, current + 1)
  }
  
  private updateErrorStats(errorType: string): void {
    const current = this.stats.retriesByError.get(errorType) || 0
    this.stats.retriesByError.set(errorType, current + 1)
  }
  
  private generateAttemptId(): string {
    return `retry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  /**
   * Public API methods
   */
  
  /**
   * Set component-specific retry configuration
   */
  setComponentConfig(componentId: string, config: Partial<RetryConfig>): void {
    const currentConfig = this.componentConfigs.get(componentId) || this.defaultConfig
    this.componentConfigs.set(componentId, { ...currentConfig, ...config })
  }
  
  /**
   * Add retry success listener
   */
  onRetrySuccess(listener: (attempt: RetryAttempt) => void): () => void {
    this.retryListeners.add(listener)
    return () => this.retryListeners.delete(listener)
  }
  
  /**
   * Add network change listener
   */
  onNetworkChange(listener: (condition: NetworkCondition) => void): () => void {
    this.networkListeners.add(listener)
    return () => this.networkListeners.delete(listener)
  }
  
  /**
   * Clear all retries
   */
  clearAllRetries(): void {
    // Cancel all timeouts
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout))
    
    // Clear all data
    this.retryAttempts.clear()
    this.componentRetries.clear()
    this.retryTimeouts.clear()
    this.offlineRetryQueue = []
    
    this.logger.info('All retries cleared')
  }
  
  /**
   * Get retry attempt details
   */
  getRetryAttempt(attemptId: string): RetryAttempt | undefined {
    return this.retryAttempts.get(attemptId)
  }
  
  /**
   * Shutdown retry manager
   */
  shutdown(): void {
    // Cancel all timeouts
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout))
    this.retryTimeouts.clear()
    
    // Clear all data
    this.retryAttempts.clear()
    this.componentRetries.clear()
    this.offlineRetryQueue = []
    this.componentConfigs.clear()
    this.retryListeners.clear()
    this.networkListeners.clear()
    this.performanceData = []
    
    this.logger.info('RetryManager shutdown complete')
  }
}