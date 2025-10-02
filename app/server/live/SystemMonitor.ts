// 🔥 System Monitor Live Component

import { LiveComponent } from '@/core/types/types'
import { componentRegistry } from '@/core/server/live/ComponentRegistry'

export interface SystemMonitorState {
  // Real-time metrics
  totalComponents: number
  activeConnections: number
  totalRooms: number
  messagesPerSecond: number
  averageResponseTime: number
  
  // Component breakdown
  componentsByType: Record<string, number>
  roomDetails: Record<string, number>
  
  // Performance metrics
  memoryUsage: {
    used: number
    total: number
    percentage: number
  }
  
  // Recent activity
  recentConnections: Array<{
    id: string
    timestamp: number
    componentType: string
    status: 'connected' | 'disconnected' | 'rehydrated'
  }>
  
  recentMessages: Array<{
    id: string
    timestamp: number
    type: string
    componentId: string
    success: boolean
    responseTime?: number
  }>
  
  // System health
  systemHealth: {
    status: 'healthy' | 'warning' | 'critical'
    uptime: number
    lastRestart: number
    errors: number
    warnings: number
  }
  
  // Auto-refresh settings
  autoRefresh: boolean
  refreshInterval: number
  lastUpdated: number
}

export class SystemMonitor extends LiveComponent<SystemMonitorState> {
  private refreshTimer: NodeJS.Timeout | null = null
  private pushTimer: NodeJS.Timeout | null = null
  private messageCount = 0
  private lastMessageTime = Date.now()
  private responseTimes: number[] = []
  private startTime = Date.now()
  private pushInterval = 1000 // Push every 1 second
  private isActive = true // Control flag for stopping all activities
  
  constructor(initialState: SystemMonitorState, ws: any, options?: any) {
    super(initialState, ws, options)
    
    // Set default state
    this.state = {
      totalComponents: 0,
      activeConnections: 0,
      totalRooms: 0,
      messagesPerSecond: 0,
      averageResponseTime: 0,
      componentsByType: {},
      roomDetails: {},
      memoryUsage: {
        used: 0,
        total: 0,
        percentage: 0
      },
      recentConnections: [],
      recentMessages: [],
      systemHealth: {
        status: 'healthy',
        uptime: 0,
        lastRestart: Date.now(),
        errors: 0,
        warnings: 0
      },
      autoRefresh: true,
      refreshInterval: 2000, // 2 seconds
      lastUpdated: Date.now(),
      ...initialState
    }
    
    // Start auto-refresh if enabled
    if (this.state.autoRefresh) {
      this.startAutoRefresh()
    }
    
    // Start automatic push timer
    this.startAutoPush()
    
    // Initial data collection with push
    this.collectMetricsWithPush()
  }

  // Start auto-refresh timer
  async startAutoRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer)
    }
    
    this.refreshTimer = setInterval(() => {
      this.collectMetricsWithPush()
    }, this.state.refreshInterval)
    
    console.log(`🔄 SystemMonitor: Auto-refresh started (${this.state.refreshInterval}ms)`)
  }

  // Stop auto-refresh timer
  async stopAutoRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer)
      this.refreshTimer = null
    }
    
    console.log('⏹️ SystemMonitor: Auto-refresh stopped')
  }

  // Start automatic push timer
  async startAutoPush() {
    if (this.pushTimer) {
      clearInterval(this.pushTimer)
    }
    
    this.pushTimer = setInterval(() => {
      this.sendLiveUpdate()
    }, this.pushInterval)
    
    console.log(`📡 SystemMonitor: Auto-push started (${this.pushInterval}ms)`)
  }

  // Stop automatic push timer
  async stopAutoPush() {
    if (this.pushTimer) {
      clearInterval(this.pushTimer)
      this.pushTimer = null
    }
    
    console.log('⏹️ SystemMonitor: Auto-push stopped')
  }

  // Send live update to frontend
  private sendLiveUpdate() {
    if (!this.isActive) {
      return // Stop sending updates if component is not active
    }
    
    try {
      const quickMetrics = {
        timestamp: Date.now(),
        uptime: Math.round((Date.now() - this.startTime) / 1000),
        connections: componentRegistry.getStats().connections,
        components: componentRegistry.getStats().components,
        memoryPercentage: this.state.memoryUsage.percentage,
        healthStatus: this.state.systemHealth.status,
        lastActivity: Math.max(
          ...this.state.recentMessages.map(m => m.timestamp),
          ...this.state.recentConnections.map(c => c.timestamp),
          0
        )
      }

      this.pushUpdate({
        type: 'LIVE_UPDATE',
        ...quickMetrics
      })

    } catch (error: any) {
      console.warn('⚠️ SystemMonitor: Failed to send live update:', error.message)
    }
  }

  // Toggle auto-refresh
  async toggleAutoRefresh() {
    const newAutoRefresh = !this.state.autoRefresh
    
    this.setState({
      autoRefresh: newAutoRefresh
    })
    
    if (newAutoRefresh) {
      this.startAutoRefresh()
      this.startAutoPush() // Also restart push when enabling
    } else {
      this.stopAutoRefresh()
      this.stopAutoPush() // Also stop push when disabling
    }
    
    this.emit('AUTO_REFRESH_TOGGLED', {
      enabled: newAutoRefresh,
      timestamp: Date.now()
    })
  }

  // Set refresh interval
  async setRefreshInterval(data: { interval: number }) {
    if (data.interval < 500 || data.interval > 60000) {
      throw new Error('Refresh interval must be between 500ms and 60s')
    }
    
    this.setState({
      refreshInterval: data.interval
    })
    
    // Restart auto-refresh with new interval
    if (this.state.autoRefresh) {
      this.startAutoRefresh()
    }
    
    this.emit('REFRESH_INTERVAL_CHANGED', {
      interval: data.interval,
      timestamp: Date.now()
    })
    
    console.log(`⏱️ SystemMonitor: Refresh interval set to ${data.interval}ms`)
  }

  // Set push interval for live updates
  async setPushInterval(data: { interval: number }) {
    if (data.interval < 100 || data.interval > 10000) {
      throw new Error('Push interval must be between 100ms and 10s')
    }
    
    this.pushInterval = data.interval
    
    // Restart push timer with new interval
    this.startAutoPush()
    
    this.emit('PUSH_INTERVAL_CHANGED', {
      interval: data.interval,
      timestamp: Date.now()
    })
    
    console.log(`📡 SystemMonitor: Push interval set to ${data.interval}ms`)
  }

  // Collect all system metrics
  async collectMetrics() {
    try {
      const registryStats = componentRegistry.getStats()
      const memUsage = process.memoryUsage()
      const uptime = Date.now() - this.startTime
      
      // Calculate messages per second
      const now = Date.now()
      const timeDiff = (now - this.lastMessageTime) / 1000
      const messagesPerSecond = timeDiff > 0 ? this.messageCount / timeDiff : 0
      
      // Calculate average response time
      const avgResponseTime = this.responseTimes.length > 0
        ? this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length
        : 0
      
      // Determine system health
      const systemHealth = this.calculateSystemHealth(registryStats, memUsage)
      
      // Update state with new metrics
      this.setState({
        totalComponents: registryStats.components,
        activeConnections: registryStats.connections,
        totalRooms: registryStats.rooms,
        messagesPerSecond: Math.round(messagesPerSecond * 100) / 100,
        averageResponseTime: Math.round(avgResponseTime * 100) / 100,
        componentsByType: this.getComponentsByType(),
        roomDetails: registryStats.roomDetails,
        memoryUsage: {
          used: Math.round(memUsage.heapUsed / 1024 / 1024 * 100) / 100, // MB
          total: Math.round(memUsage.heapTotal / 1024 / 1024 * 100) / 100, // MB
          percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)
        },
        systemHealth: {
          ...this.state.systemHealth,
          status: systemHealth.status,
          uptime: Math.round(uptime / 1000), // seconds
        },
        lastUpdated: Date.now()
      })
      
      // Push automatic update to frontend
      this.pushUpdate({
        type: 'METRICS_UPDATED',
        timestamp: Date.now(),
        metrics: {
          components: registryStats.components,
          connections: registryStats.connections,
          rooms: registryStats.rooms,
          messagesPerSecond: Math.round(messagesPerSecond * 100) / 100,
          memoryUsage: this.state.memoryUsage,
          systemHealth: this.state.systemHealth
        }
      })
      
      this.emit('METRICS_UPDATED', {
        timestamp: Date.now(),
        metrics: {
          components: registryStats.components,
          connections: registryStats.connections,
          rooms: registryStats.rooms,
          messagesPerSecond: Math.round(messagesPerSecond * 100) / 100
        }
      })
      
    } catch (error: any) {
      console.error('❌ SystemMonitor: Error collecting metrics:', error.message)
      this.incrementErrorCount()
    }
  }

  // Calculate system health based on metrics
  private calculateSystemHealth(stats: any, memUsage: any) {
    let status: 'healthy' | 'warning' | 'critical' = 'healthy'
    
    // Check memory usage
    const memPercentage = (memUsage.heapUsed / memUsage.heapTotal) * 100
    if (memPercentage > 90) {
      status = 'critical'
    } else if (memPercentage > 75) {
      status = 'warning'
    }
    
    // Check connection count (arbitrary thresholds)
    if (stats.connections > 100) {
      status = status === 'critical' ? 'critical' : 'warning'
    }
    
    // Check error rate
    if (this.state.systemHealth.errors > 10) {
      status = 'critical'
    } else if (this.state.systemHealth.errors > 5) {
      status = status === 'critical' ? 'critical' : 'warning'
    }
    
    return { status }
  }

  // Get component breakdown by type
  private getComponentsByType(): Record<string, number> {
    // This would ideally be integrated with the registry
    // For now, return mock data based on known components
    return {
      'UserProfile': 1,
      'SidebarNavigation': 1,
      'SystemMonitor': 1,
      'Counter': 0,
      'TestComponent': 0
    }
  }

  // Record a new connection event
  async recordConnection(data: { componentType: string; status: 'connected' | 'disconnected' | 'rehydrated' }) {
    const connectionEvent = {
      id: `conn-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: Date.now(),
      componentType: data.componentType,
      status: data.status
    }
    
    // Add to recent connections (keep last 50)
    const recentConnections = [connectionEvent, ...this.state.recentConnections].slice(0, 50)
    
    this.setState({ recentConnections })
    
    this.emit('CONNECTION_RECORDED', connectionEvent)
    
    console.log(`📊 SystemMonitor: Recorded ${data.status} for ${data.componentType}`)
  }

  // Record a new message event
  async recordMessage(data: { type: string; componentId: string; success: boolean; responseTime?: number }) {
    const messageEvent = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: Date.now(),
      type: data.type,
      componentId: data.componentId,
      success: data.success,
      responseTime: data.responseTime
    }
    
    // Add to recent messages (keep last 100)
    const recentMessages = [messageEvent, ...this.state.recentMessages].slice(0, 100)
    
    this.setState({ recentMessages })
    
    // Update response time tracking
    if (data.responseTime) {
      this.responseTimes.push(data.responseTime)
      if (this.responseTimes.length > 100) {
        this.responseTimes = this.responseTimes.slice(-100)
      }
    }
    
    // Update message count for rate calculation
    this.messageCount++
    
    this.emit('MESSAGE_RECORDED', messageEvent)
  }

  // Increment error count
  private incrementErrorCount() {
    this.setState({
      systemHealth: {
        ...this.state.systemHealth,
        errors: this.state.systemHealth.errors + 1
      }
    })
  }

  // Clear all recent activity
  async clearActivity() {
    this.setState({
      recentConnections: [],
      recentMessages: [],
      systemHealth: {
        ...this.state.systemHealth,
        errors: 0,
        warnings: 0
      }
    })
    
    // Reset counters
    this.messageCount = 0
    this.lastMessageTime = Date.now()
    this.responseTimes = []
    
    this.emit('ACTIVITY_CLEARED', {
      timestamp: Date.now()
    })
    
    console.log('🧹 SystemMonitor: Activity cleared')
  }

  // Get detailed system info
  async getSystemInfo() {
    const info = {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      uptime: process.uptime(),
      pid: process.pid,
      execPath: process.execPath,
      cwd: process.cwd(),
      timestamp: Date.now()
    }
    
    this.emit('SYSTEM_INFO_REQUESTED', info)
    
    return info
  }

  // Force metrics refresh
  async refreshMetrics() {
    await this.collectMetrics()
    
    this.emit('METRICS_REFRESHED', {
      timestamp: Date.now()
    })
    
    console.log('🔄 SystemMonitor: Metrics refreshed manually')
  }

  // Emergency stop - stops everything immediately
  async emergencyStop() {
    console.log('🚨 SystemMonitor: EMERGENCY STOP activated')
    
    // Stop all timers
    this.isActive = false
    
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer)
      this.refreshTimer = null
    }
    if (this.pushTimer) {
      clearInterval(this.pushTimer)
      this.pushTimer = null
    }
    
    // Update state
    this.setState({
      autoRefresh: false
    })
    
    this.emit('EMERGENCY_STOP', {
      timestamp: Date.now(),
      reason: 'Manual emergency stop'
    })
    
    console.log('🛑 SystemMonitor: All activities stopped via emergency stop')
  }

  // Push automatic updates to frontend
  private pushUpdate(data: any) {
    if (!this.isActive) {
      return // Stop all push updates if component is not active
    }
    
    try {
      // Force state synchronization to frontend
      this.emit('AUTO_UPDATE', data)
      
      // Also trigger a state change notification
      this.sendStateUpdate()
      
      console.log('📡 SystemMonitor: Pushed automatic update to frontend', {
        type: data.type,
        timestamp: data.timestamp,
        connections: data.metrics?.connections || 0
      })
      
    } catch (error: any) {
      console.warn('⚠️ SystemMonitor: Failed to push update to frontend:', error.message)
    }
  }

  // Send state update to all connected clients
  private sendStateUpdate() {
    try {
      // This will trigger the useHybridLiveComponent hook to update
      const stateUpdate = {
        componentId: this.id,
        state: this.state,
        timestamp: Date.now(),
        version: this.version || 1
      }
      
      // Emit state change to trigger frontend update
      this.emit('STATE_CHANGED', stateUpdate)
      
    } catch (error: any) {
      console.warn('⚠️ SystemMonitor: Failed to send state update:', error.message)
    }
  }

  // Enhanced metrics collection with automatic frontend push
  async collectMetricsWithPush() {
    await this.collectMetrics()
    
    // Additional push with real-time data
    this.pushUpdate({
      type: 'REAL_TIME_METRICS',
      timestamp: Date.now(),
      realTimeData: {
        uptime: Math.round((Date.now() - this.startTime) / 1000),
        lastUpdated: this.state.lastUpdated,
        autoRefreshActive: this.state.autoRefresh,
        recentActivityCount: this.state.recentMessages.length + this.state.recentConnections.length
      }
    })
  }

  // Stop all activities (method to be called externally)
  async stopAllActivities() {
    this.isActive = false
    
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer)
      this.refreshTimer = null
    }
    if (this.pushTimer) {
      clearInterval(this.pushTimer)
      this.pushTimer = null
    }
    
    console.log('🛑 SystemMonitor: All activities stopped')
  }

  // Cleanup on destroy
  destroy() {
    this.isActive = false
    
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer)
    }
    if (this.pushTimer) {
      clearInterval(this.pushTimer)
    }
    super.destroy()
    console.log('💥 SystemMonitor: Destroyed and cleanup completed')
  }
}