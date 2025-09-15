/**
 * NetworkStatusManager - Online/Offline Detection & Connection Management
 * 
 * Implements comprehensive network status monitoring including connection detection,
 * automatic queue processing when online, connection retry logic with exponential
 * backoff, offline indicators, and manual sync triggers.
 * 
 * Features:
 * - Real-time network status monitoring
 * - Automatic queue processing when connection restored
 * - Connection retry logic with exponential backoff
 * - Offline/online state management for UI components
 * - Manual synchronization triggers
 * - Connection quality assessment
 * - Bandwidth estimation and adaptive behavior
 * - Event-driven status notifications
 */

import { LiveOfflineManager } from './LiveOfflineManager'
import { LiveEventBus } from './LiveEventBus'

export interface NetworkStatus {
  /** Whether device is online */
  online: boolean
  
  /** Connection type */
  connectionType: 'wifi' | 'cellular' | 'ethernet' | 'bluetooth' | 'other' | 'unknown'
  
  /** Connection quality */
  quality: 'excellent' | 'good' | 'fair' | 'poor' | 'unknown'
  
  /** Estimated bandwidth in Mbps */
  bandwidth?: number
  
  /** Round-trip time in milliseconds */
  rtt?: number
  
  /** Whether connection is metered */
  metered: boolean
  
  /** Last successful connection timestamp */
  lastOnline?: number
  
  /** Last disconnect timestamp */
  lastOffline?: number
  
  /** Connection stability (0-1 scale) */
  stability: number
  
  /** Custom status metadata */
  metadata: {
    /** Status detection timestamp */
    detectedAt: number
    
    /** Detection method */
    detectionMethod: 'navigator' | 'ping' | 'fetch' | 'websocket' | 'manual'
    
    /** Custom metadata */
    custom?: Record<string, any>
  }
}

export interface ConnectionRetryConfig {
  /** Maximum retry attempts */
  maxAttempts: number
  
  /** Initial retry delay in milliseconds */
  initialDelay: number
  
  /** Maximum retry delay in milliseconds */
  maxDelay: number
  
  /** Backoff multiplier */
  backoffMultiplier: number
  
  /** Jitter factor (0-1) */
  jitterFactor: number
  
  /** Reset retry count after successful connection duration */
  resetAfter: number
}

export interface SyncOptions {
  /** Force sync regardless of connection quality */
  force?: boolean
  
  /** Maximum actions to sync at once */
  batchSize?: number
  
  /** Timeout for sync operation */
  timeout?: number
  
  /** Prioritize actions by component IDs */
  prioritizeComponents?: string[]
  
  /** Skip actions older than this timestamp */
  skipOlderThan?: number
  
  /** Custom sync metadata */
  metadata?: Record<string, any>
}

export interface NetworkManagerConfig {
  /** Enable automatic network monitoring */
  enableMonitoring?: boolean
  
  /** Network status check interval in milliseconds */
  checkInterval?: number
  
  /** URLs to ping for connectivity testing */
  pingUrls?: string[]
  
  /** Ping timeout in milliseconds */
  pingTimeout?: number
  
  /** Connection retry configuration */
  retryConfig?: Partial<ConnectionRetryConfig>
  
  /** Enable automatic sync when online */
  autoSync?: boolean
  
  /** Minimum connection quality for auto sync */
  minQualityForSync?: NetworkStatus['quality']
  
  /** Enable bandwidth monitoring */
  enableBandwidthMonitoring?: boolean
  
  /** Bandwidth test URL */
  bandwidthTestUrl?: string
  
  /** Enable debug logging */
  enableDebug?: boolean
}

export interface SyncResult {
  /** Whether sync was successful */
  success: boolean
  
  /** Number of actions synced */
  actionsSynced: number
  
  /** Number of actions failed */
  actionsFailed: number
  
  /** Sync duration in milliseconds */
  duration: number
  
  /** Sync errors */
  errors: Array<{
    actionId: string
    error: string
    details?: any
  }>
  
  /** Sync metadata */
  metadata: {
    /** Sync start timestamp */
    startedAt: number
    
    /** Sync completion timestamp */
    completedAt: number
    
    /** Network status during sync */
    networkStatus: NetworkStatus
    
    /** Custom metadata */
    custom?: Record<string, any>
  }
}

/**
 * NetworkStatusManager
 * 
 * Manages network status monitoring and automatic sync operations
 */
export class NetworkStatusManager {
  private config: Required<NetworkManagerConfig>
  private offlineManager: LiveOfflineManager
  private eventBus: LiveEventBus
  
  private currentStatus: NetworkStatus
  private monitoringInterval?: NodeJS.Timeout
  private retryTimeout?: NodeJS.Timeout
  private retryAttempts = 0
  private connectionHistory: NetworkStatus[] = []
  private syncInProgress = false
  private bandwidthHistory: number[] = []
  
  constructor(
    offlineManager: LiveOfflineManager,
    eventBus: LiveEventBus,
    config: NetworkManagerConfig = {}
  ) {
    this.offlineManager = offlineManager
    this.eventBus = eventBus
    
    this.config = {
      enableMonitoring: config.enableMonitoring ?? true,
      checkInterval: config.checkInterval ?? 5000,
      pingUrls: config.pingUrls ?? [
        'https://www.google.com/favicon.ico',
        'https://www.cloudflare.com/favicon.ico',
        'https://www.github.com/favicon.ico'
      ],
      pingTimeout: config.pingTimeout ?? 5000,
      retryConfig: {
        maxAttempts: 10,
        initialDelay: 1000,
        maxDelay: 30000,
        backoffMultiplier: 2,
        jitterFactor: 0.1,
        resetAfter: 60000,
        ...config.retryConfig
      },
      autoSync: config.autoSync ?? true,
      minQualityForSync: config.minQualityForSync ?? 'fair',
      enableBandwidthMonitoring: config.enableBandwidthMonitoring ?? false,
      bandwidthTestUrl: config.bandwidthTestUrl ?? '',
      enableDebug: config.enableDebug ?? false
    }
    
    // Initialize with current browser status
    this.currentStatus = this.createInitialStatus()
    
    this.setupEventListeners()
    
    if (this.config.enableMonitoring) {
      this.startMonitoring()
    }
  }
  
  /**
   * Get current network status
   */
  getStatus(): NetworkStatus {
    return { ...this.currentStatus }
  }
  
  /**
   * Check network status manually
   */
  async checkStatus(): Promise<NetworkStatus> {
    const status = await this.detectNetworkStatus()
    this.updateStatus(status)
    return status
  }
  
  /**
   * Force manual sync
   */
  async syncNow(options: SyncOptions = {}): Promise<SyncResult> {
    if (this.syncInProgress) {
      throw new Error('Sync already in progress')
    }
    
    const {
      force = false,
      batchSize = 50,
      timeout = 30000,
      prioritizeComponents = [],
      skipOlderThan,
      metadata
    } = options
    
    this.syncInProgress = true
    const startTime = Date.now()
    
    try {
      // Check connection if not forced
      if (!force && !this.isGoodConnectionForSync()) {
        throw new Error('Connection quality insufficient for sync')
      }
      
      // Get pending actions
      let pendingActions = this.offlineManager.getPendingActions()
      
      // Apply filters
      if (skipOlderThan) {
        pendingActions = pendingActions.filter(action => action.timestamp >= skipOlderThan)
      }
      
      // Prioritize components
      if (prioritizeComponents.length > 0) {
        pendingActions.sort((a, b) => {
          const aPriority = prioritizeComponents.indexOf(a.componentId)
          const bPriority = prioritizeComponents.indexOf(b.componentId)
          
          if (aPriority !== -1 && bPriority !== -1) {
            return aPriority - bPriority
          }
          if (aPriority !== -1) return -1
          if (bPriority !== -1) return 1
          return b.priority - a.priority
        })
      }
      
      // Limit batch size
      pendingActions = pendingActions.slice(0, batchSize)
      
      let actionsSynced = 0
      let actionsFailed = 0
      const errors: SyncResult['errors'] = []
      
      // Process actions
      for (const action of pendingActions) {
        try {
          // Simulate sync operation
          await this.syncAction(action)
          this.offlineManager.markActionCompleted(action.id)
          actionsSynced++
          
          if (this.config.enableDebug) {
            console.log(`[NetworkStatusManager] Synced action: ${action.id}`)
          }
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          this.offlineManager.markActionFailed(action.id, {
            code: 'SYNC_ERROR',
            message: errorMessage,
            details: error
          })
          
          errors.push({
            actionId: action.id,
            error: errorMessage,
            details: error
          })
          
          actionsFailed++
        }
      }
      
      const duration = Date.now() - startTime
      
      const result: SyncResult = {
        success: actionsFailed === 0,
        actionsSynced,
        actionsFailed,
        duration,
        errors,
        metadata: {
          startedAt: startTime,
          completedAt: Date.now(),
          networkStatus: this.getStatus(),
          custom: metadata
        }
      }
      
      // Emit sync completed event
      this.eventBus.emit('network', 'sync.completed', result)
      
      if (this.config.enableDebug) {
        console.log(`[NetworkStatusManager] Sync completed: ${actionsSynced} synced, ${actionsFailed} failed`)
      }
      
      return result
      
    } finally {
      this.syncInProgress = false
    }
  }
  
  /**
   * Test connection quality
   */
  async testConnection(): Promise<{
    online: boolean
    quality: NetworkStatus['quality']
    rtt?: number
    bandwidth?: number
  }> {
    const results = await Promise.allSettled(
      this.config.pingUrls.map(url => this.pingUrl(url))
    )
    
    const successfulPings = results.filter(result => result.status === 'fulfilled')
    const online = successfulPings.length > 0
    
    if (!online) {
      return { online: false, quality: 'poor' }
    }
    
    const rtts = successfulPings
      .map(result => (result as PromiseFulfilledResult<number>).value)
      .filter(rtt => rtt > 0)
    
    const avgRtt = rtts.length > 0 ? rtts.reduce((sum, rtt) => sum + rtt, 0) / rtts.length : undefined
    
    let quality: NetworkStatus['quality'] = 'unknown'
    if (avgRtt !== undefined) {
      if (avgRtt < 50) quality = 'excellent'
      else if (avgRtt < 150) quality = 'good'
      else if (avgRtt < 300) quality = 'fair'
      else quality = 'poor'
    }
    
    const bandwidth = this.config.enableBandwidthMonitoring 
      ? await this.estimateBandwidth()
      : undefined
    
    return {
      online,
      quality,
      rtt: avgRtt,
      bandwidth
    }
  }
  
  /**
   * Get connection history
   */
  getConnectionHistory(): NetworkStatus[] {
    return [...this.connectionHistory]
  }
  
  /**
   * Get connection statistics
   */
  getConnectionStats() {
    const history = this.connectionHistory.slice(-100) // Last 100 status updates
    
    if (history.length === 0) {
      return {
        totalChecks: 0,
        onlinePercentage: 0,
        averageRtt: 0,
        averageBandwidth: 0,
        qualityDistribution: {}
      }
    }
    
    const onlineCount = history.filter(status => status.online).length
    const onlinePercentage = (onlineCount / history.length) * 100
    
    const rtts = history.filter(status => status.rtt).map(status => status.rtt!)
    const averageRtt = rtts.length > 0 ? rtts.reduce((sum, rtt) => sum + rtt, 0) / rtts.length : 0
    
    const bandwidths = history.filter(status => status.bandwidth).map(status => status.bandwidth!)
    const averageBandwidth = bandwidths.length > 0 ? bandwidths.reduce((sum, bw) => sum + bw, 0) / bandwidths.length : 0
    
    const qualityDistribution = history.reduce((acc, status) => {
      acc[status.quality] = (acc[status.quality] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return {
      totalChecks: history.length,
      onlinePercentage,
      averageRtt,
      averageBandwidth,
      qualityDistribution
    }
  }
  
  /**
   * Reset connection retry counter
   */
  resetRetryCounter(): void {
    this.retryAttempts = 0
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout)
      this.retryTimeout = undefined
    }
  }
  
  /**
   * Dispose network manager
   */
  dispose(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = undefined
    }
    
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout)
      this.retryTimeout = undefined
    }
    
    this.removeEventListeners()
    
    if (this.config.enableDebug) {
      console.log('[NetworkStatusManager] Disposed')
    }
  }
  
  // Private methods
  
  private createInitialStatus(): NetworkStatus {
    return {
      online: navigator.onLine ?? true,
      connectionType: this.detectConnectionType(),
      quality: 'unknown',
      metered: false,
      stability: 1.0,
      metadata: {
        detectedAt: Date.now(),
        detectionMethod: 'navigator'
      }
    }
  }
  
  private setupEventListeners(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline.bind(this))
      window.addEventListener('offline', this.handleOffline.bind(this))
    }
  }
  
  private removeEventListeners(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline.bind(this))
      window.removeEventListener('offline', this.handleOffline.bind(this))
    }
  }
  
  private async handleOnline(): Promise<void> {
    if (this.config.enableDebug) {
      console.log('[NetworkStatusManager] Browser online event')
    }
    
    const status = await this.detectNetworkStatus()
    this.updateStatus(status)
    
    // Reset retry counter on successful connection
    this.resetRetryCounter()
    
    // Auto sync if enabled
    if (this.config.autoSync && this.isGoodConnectionForSync()) {
      try {
        await this.syncNow({ force: false })
      } catch (error) {
        if (this.config.enableDebug) {
          console.error('[NetworkStatusManager] Auto sync failed:', error)
        }
      }
    }
  }
  
  private handleOffline(): void {
    if (this.config.enableDebug) {
      console.log('[NetworkStatusManager] Browser offline event')
    }
    
    const status: NetworkStatus = {
      ...this.currentStatus,
      online: false,
      quality: 'poor',
      lastOffline: Date.now(),
      metadata: {
        detectedAt: Date.now(),
        detectionMethod: 'navigator'
      }
    }
    
    this.updateStatus(status)
    this.scheduleRetry()
  }
  
  private startMonitoring(): void {
    this.monitoringInterval = setInterval(async () => {
      try {
        const status = await this.detectNetworkStatus()
        this.updateStatus(status)
        
        // Auto sync if conditions are met
        if (this.config.autoSync && status.online && this.isGoodConnectionForSync()) {
          const pendingActions = this.offlineManager.getPendingActions()
          if (pendingActions.length > 0 && !this.syncInProgress) {
            await this.syncNow({ force: false, batchSize: 10 })
          }
        }
      } catch (error) {
        if (this.config.enableDebug) {
          console.error('[NetworkStatusManager] Monitoring error:', error)
        }
      }
    }, this.config.checkInterval)
  }
  
  private async detectNetworkStatus(): Promise<NetworkStatus> {
    const connectionTest = await this.testConnection()
    
    const status: NetworkStatus = {
      online: connectionTest.online,
      connectionType: this.detectConnectionType(),
      quality: connectionTest.quality,
      bandwidth: connectionTest.bandwidth,
      rtt: connectionTest.rtt,
      metered: this.detectMeteredConnection(),
      lastOnline: connectionTest.online ? Date.now() : this.currentStatus.lastOnline,
      lastOffline: !connectionTest.online ? Date.now() : this.currentStatus.lastOffline,
      stability: this.calculateStability(connectionTest.online),
      metadata: {
        detectedAt: Date.now(),
        detectionMethod: 'ping'
      }
    }
    
    return status
  }
  
  private detectConnectionType(): NetworkStatus['connectionType'] {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as any).connection
      if (connection && connection.type) {
        return connection.type as NetworkStatus['connectionType']
      }
    }
    return 'unknown'
  }
  
  private detectMeteredConnection(): boolean {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as any).connection
      return connection?.saveData === true
    }
    return false
  }
  
  private calculateStability(isOnline: boolean): number {
    const recentHistory = this.connectionHistory.slice(-10)
    if (recentHistory.length === 0) return 1.0
    
    const onlineCount = recentHistory.filter(status => status.online).length
    return onlineCount / recentHistory.length
  }
  
  private async pingUrl(url: string): Promise<number> {
    const startTime = Date.now()
    
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.config.pingTimeout)
      
      await fetch(url, {
        method: 'HEAD',
        mode: 'no-cors',
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      return Date.now() - startTime
      
    } catch (error) {
      return -1 // Failed ping
    }
  }
  
  private async estimateBandwidth(): Promise<number | undefined> {
    if (!this.config.bandwidthTestUrl) return undefined
    
    try {
      const startTime = Date.now()
      const response = await fetch(this.config.bandwidthTestUrl)
      const data = await response.blob()
      const duration = Date.now() - startTime
      
      // Calculate bandwidth in Mbps
      const sizeInBits = data.size * 8
      const durationInSeconds = duration / 1000
      const bandwidth = (sizeInBits / durationInSeconds) / (1024 * 1024)
      
      this.bandwidthHistory.push(bandwidth)
      if (this.bandwidthHistory.length > 10) {
        this.bandwidthHistory.shift()
      }
      
      return bandwidth
      
    } catch (error) {
      return undefined
    }
  }
  
  private updateStatus(newStatus: NetworkStatus): void {
    const previousStatus = this.currentStatus
    this.currentStatus = newStatus
    
    // Add to history
    this.connectionHistory.push(newStatus)
    if (this.connectionHistory.length > 1000) {
      this.connectionHistory.shift()
    }
    
    // Emit status change event if changed
    if (previousStatus.online !== newStatus.online) {
      this.eventBus.emit('network', 'status.changed', {
        previous: previousStatus,
        current: newStatus
      })
      
      if (this.config.enableDebug) {
        console.log(`[NetworkStatusManager] Status changed: ${previousStatus.online ? 'online' : 'offline'} -> ${newStatus.online ? 'online' : 'offline'}`)
      }
    }
  }
  
  private isGoodConnectionForSync(): boolean {
    if (!this.currentStatus.online) return false
    
    const qualityOrder = ['poor', 'fair', 'good', 'excellent']
    const currentIndex = qualityOrder.indexOf(this.currentStatus.quality)
    const minIndex = qualityOrder.indexOf(this.config.minQualityForSync)
    
    return currentIndex >= minIndex
  }
  
  private scheduleRetry(): void {
    if (this.retryAttempts >= this.config.retryConfig.maxAttempts) {
      if (this.config.enableDebug) {
        console.log('[NetworkStatusManager] Max retry attempts reached')
      }
      return
    }
    
    const delay = Math.min(
      this.config.retryConfig.initialDelay * Math.pow(this.config.retryConfig.backoffMultiplier, this.retryAttempts),
      this.config.retryConfig.maxDelay
    )
    
    // Add jitter
    const jitter = delay * this.config.retryConfig.jitterFactor * Math.random()
    const finalDelay = delay + jitter
    
    this.retryTimeout = setTimeout(async () => {
      this.retryAttempts++
      
      if (this.config.enableDebug) {
        console.log(`[NetworkStatusManager] Retry attempt ${this.retryAttempts}/${this.config.retryConfig.maxAttempts}`)
      }
      
      const status = await this.detectNetworkStatus()
      this.updateStatus(status)
      
      if (!status.online) {
        this.scheduleRetry()
      } else {
        this.resetRetryCounter()
      }
    }, finalDelay)
  }
  
  private async syncAction(action: any): Promise<void> {
    // Simulate network request
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50))
    
    // Simulate occasional failures
    if (Math.random() < 0.05) { // 5% failure rate
      throw new Error('Network sync failed')
    }
  }
}

// Export types for external use
export type {
  NetworkStatus,
  ConnectionRetryConfig,
  SyncOptions,
  NetworkManagerConfig,
  SyncResult
}