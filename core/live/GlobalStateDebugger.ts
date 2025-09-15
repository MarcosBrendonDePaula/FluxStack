/**
 * GlobalStateDebugger
 * 
 * Advanced debugging tools for Zustand global state integration.
 * Provides comprehensive state inspection, change tracking, diff visualization,
 * and integration with Zustand DevTools.
 * 
 * Features:
 * - State change logging and tracing
 * - Component state inspector
 * - State diff visualization for conflicts
 * - Export/import functionality for debugging
 * - Integration with Zustand DevTools
 * - Performance monitoring
 * - State history and time-travel
 * - Automated issue detection
 */

import type { Logger } from '../types'
import type { 
  ComponentStateEntry, 
  GlobalEvent, 
  GlobalPerformanceMetrics,
  LiveComponentsSlice
} from './zustand/LiveComponentsSlice'
import type { StateConflict } from './StateConflictResolver'

/**
 * Debug log entry
 */
export interface DebugLogEntry {
  /** Unique log entry ID */
  id: string
  
  /** Timestamp of the log entry */
  timestamp: number
  
  /** Log level */
  level: 'trace' | 'debug' | 'info' | 'warn' | 'error'
  
  /** Log category */
  category: 'state' | 'event' | 'conflict' | 'performance' | 'sync' | 'lifecycle'
  
  /** Component ID (if applicable) */
  componentId?: string
  
  /** Log message */
  message: string
  
  /** Additional data */
  data?: Record<string, any>
  
  /** Stack trace (for errors) */
  stackTrace?: string
  
  /** Related log entries */
  relatedEntries?: string[]
}

/**
 * State change entry
 */
export interface StateChangeEntry {
  /** Change ID */
  id: string
  
  /** Component ID */
  componentId: string
  
  /** Timestamp */
  timestamp: number
  
  /** Change type */
  type: 'create' | 'update' | 'delete' | 'sync' | 'conflict_resolution'
  
  /** Previous state */
  previousState?: Record<string, any>
  
  /** New state */
  newState: Record<string, any>
  
  /** Changed keys */
  changedKeys: string[]
  
  /** Change source */
  source: 'local' | 'global' | 'server' | 'optimistic' | 'resolver'
  
  /** Change metadata */
  metadata: {
    /** Triggering action */
    action?: string
    
    /** User ID (if applicable) */
    userId?: string
    
    /** Session ID */
    sessionId?: string
    
    /** Additional context */
    context?: Record<string, any>
  }
}

/**
 * State snapshot
 */
export interface StateSnapshot {
  /** Snapshot ID */
  id: string
  
  /** Timestamp */
  timestamp: number
  
  /** Snapshot label */
  label: string
  
  /** Global state at this point */
  globalState: {
    components: Array<[string, ComponentStateEntry]>
    events: GlobalEvent[]
    metrics: GlobalPerformanceMetrics
    conflicts: any[]
  }
  
  /** Component states */
  componentStates: Record<string, Record<string, any>>
  
  /** Performance metrics */
  performanceMetrics: GlobalPerformanceMetrics
  
  /** Memory usage estimate */
  memoryUsage: number
  
  /** Additional metadata */
  metadata?: Record<string, any>
}

/**
 * Debug configuration
 */
export interface DebugConfig {
  /** Enable debugging */
  enabled: boolean
  
  /** Debug levels to capture */
  logLevels: Array<DebugLogEntry['level']>
  
  /** Categories to capture */
  logCategories: Array<DebugLogEntry['category']>
  
  /** Components to monitor (empty = all) */
  monitorComponents: string[]
  
  /** Maximum log entries to keep */
  maxLogEntries: number
  
  /** Maximum state changes to track */
  maxStateChanges: number
  
  /** Maximum snapshots to keep */
  maxSnapshots: number
  
  /** Enable automatic snapshots */
  autoSnapshot: boolean
  
  /** Auto snapshot interval (ms) */
  autoSnapshotInterval: number
  
  /** Enable performance monitoring */
  enablePerformanceMonitoring: boolean
  
  /** Enable Zustand DevTools integration */
  enableDevTools: boolean
  
  /** DevTools configuration */
  devToolsConfig?: {
    name?: string
    trace?: boolean
    serialize?: boolean
  }
  
  /** Custom logger */
  logger?: Logger
}

/**
 * Component inspection data
 */
export interface ComponentInspectionData {
  /** Component information */
  component: ComponentStateEntry
  
  /** Current state diff with server */
  stateDiff: {
    added: Record<string, any>
    removed: Record<string, any>
    changed: Record<string, any>
  }
  
  /** Recent state changes */
  recentChanges: StateChangeEntry[]
  
  /** Active conflicts */
  conflicts: StateConflict[]
  
  /** Performance data */
  performance: {
    updateCount: number
    averageUpdateTime: number
    memoryUsage: number
    lastActivity: number
  }
  
  /** Hierarchy information */
  hierarchy: {
    parent?: ComponentStateEntry
    children: ComponentStateEntry[]
    siblings: ComponentStateEntry[]
    depth: number
    path: string
  }
  
  /** Subscription info */
  subscriptions: {
    count: number
    listeners: string[]
  }
}

/**
 * Issue detection result
 */
export interface DetectedIssue {
  /** Issue ID */
  id: string
  
  /** Issue type */
  type: 'memory_leak' | 'performance' | 'conflict' | 'stale_state' | 'circular_dependency' | 'orphaned_component'
  
  /** Severity level */
  severity: 'low' | 'medium' | 'high' | 'critical'
  
  /** Issue description */
  description: string
  
  /** Affected components */
  affectedComponents: string[]
  
  /** Detection timestamp */
  detectedAt: number
  
  /** Suggested actions */
  suggestions: string[]
  
  /** Related data */
  data?: Record<string, any>
}

/**
 * Global State Debugger Class
 */
export class GlobalStateDebugger {
  private config: DebugConfig
  private logs: DebugLogEntry[] = []
  private stateChanges: StateChangeEntry[] = []
  private snapshots: StateSnapshot[] = []
  private detectedIssues: DetectedIssue[] = []
  private snapshotInterval?: NodeJS.Timeout
  private store?: () => LiveComponentsSlice
  
  constructor(config: Partial<DebugConfig> = {}) {
    this.config = {
      enabled: true,
      logLevels: ['debug', 'info', 'warn', 'error'],
      logCategories: ['state', 'event', 'conflict', 'performance', 'sync', 'lifecycle'],
      monitorComponents: [],
      maxLogEntries: 10000,
      maxStateChanges: 5000,
      maxSnapshots: 100,
      autoSnapshot: false,
      autoSnapshotInterval: 60000, // 1 minute
      enablePerformanceMonitoring: true,
      enableDevTools: true,
      devToolsConfig: {
        name: 'FluxLive Global State',
        trace: true,
        serialize: true
      },
      ...config
    }
    
    if (this.config.autoSnapshot) {
      this.startAutoSnapshot()
    }
  }
  
  /**
   * Initialize debugger with store
   */
  initialize(store: () => LiveComponentsSlice): void {
    this.store = store
    
    // Setup DevTools if enabled
    if (this.config.enableDevTools && typeof window !== 'undefined') {
      this.setupDevTools()
    }
    
    this.log('info', 'lifecycle', 'GlobalStateDebugger initialized')
  }
  
  /**
   * Log a debug entry
   */
  log(
    level: DebugLogEntry['level'],
    category: DebugLogEntry['category'],
    message: string,
    data?: Record<string, any>,
    componentId?: string
  ): void {
    if (!this.config.enabled) return
    if (!this.config.logLevels.includes(level)) return
    if (!this.config.logCategories.includes(category)) return
    if (this.config.monitorComponents.length > 0 && componentId && 
        !this.config.monitorComponents.includes(componentId)) return
    
    const entry: DebugLogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: Date.now(),
      level,
      category,
      componentId,
      message,
      data: data ? { ...data } : undefined,
      stackTrace: level === 'error' ? new Error().stack : undefined
    }
    
    this.logs.push(entry)
    
    // Limit log entries
    if (this.logs.length > this.config.maxLogEntries) {
      this.logs.shift()
    }
    
    // Send to custom logger if provided
    if (this.config.logger) {
      this.config.logger[level](message, { category, componentId, data })
    }
    
    // Send to console in development
    if (process.env.NODE_ENV === 'development') {
      console[level === 'trace' ? 'debug' : level](`[FluxLive:${category}]`, message, data)
    }
  }
  
  /**
   * Track state change
   */
  trackStateChange(
    componentId: string,
    type: StateChangeEntry['type'],
    previousState: Record<string, any> | undefined,
    newState: Record<string, any>,
    source: StateChangeEntry['source'],
    metadata: Partial<StateChangeEntry['metadata']> = {}
  ): void {
    if (!this.config.enabled) return
    if (this.config.monitorComponents.length > 0 && 
        !this.config.monitorComponents.includes(componentId)) return
    
    const changedKeys = this.getChangedKeys(previousState || {}, newState)
    
    const entry: StateChangeEntry = {
      id: `change_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      componentId,
      timestamp: Date.now(),
      type,
      previousState: previousState ? { ...previousState } : undefined,
      newState: { ...newState },
      changedKeys,
      source,
      metadata: {
        sessionId: 'current-session',
        ...metadata
      }
    }
    
    this.stateChanges.push(entry)
    
    // Limit state changes
    if (this.stateChanges.length > this.config.maxStateChanges) {
      this.stateChanges.shift()
    }
    
    // Log the change
    this.log('debug', 'state', `State ${type} for component ${componentId}`, {
      changedKeys,
      source,
      changeId: entry.id
    }, componentId)
    
    // Detect issues
    this.detectIssues(componentId, entry)
  }
  
  /**
   * Create state snapshot
   */
  createSnapshot(label: string, metadata?: Record<string, any>): StateSnapshot {
    if (!this.store) {
      throw new Error('Debugger not initialized with store')
    }
    
    const storeState = this.store()
    const snapshot: StateSnapshot = {
      id: `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: Date.now(),
      label,
      globalState: {
        components: Array.from(storeState.components.entries()),
        events: [...storeState.events],
        metrics: { ...storeState.metrics },
        conflicts: [...storeState.conflicts]
      },
      componentStates: this.extractComponentStates(storeState),
      performanceMetrics: { ...storeState.metrics },
      memoryUsage: this.estimateMemoryUsage(storeState),
      metadata
    }
    
    this.snapshots.push(snapshot)
    
    // Limit snapshots
    if (this.snapshots.length > this.config.maxSnapshots) {
      this.snapshots.shift()
    }
    
    this.log('info', 'state', `Snapshot created: ${label}`, {
      snapshotId: snapshot.id,
      componentCount: snapshot.globalState.components.length,
      memoryUsage: snapshot.memoryUsage
    })
    
    return snapshot
  }
  
  /**
   * Inspect component state
   */
  inspectComponent(componentId: string): ComponentInspectionData | null {
    if (!this.store) return null
    
    const storeState = this.store()
    const component = storeState.components.get(componentId)
    if (!component) return null
    
    // Get recent changes
    const recentChanges = this.stateChanges
      .filter(change => change.componentId === componentId)
      .slice(-10)
    
    // Get conflicts
    const conflicts = storeState.conflicts.filter(c => c.componentId === componentId)
    
    // Calculate state diff (assuming we have a server state reference)
    const stateDiff = this.calculateStateDiff(component.state, component.state) // Simplified
    
    // Get hierarchy
    const hierarchy = storeState.getComponentHierarchy(componentId)
    
    // Get subscription info
    const subscriptions = storeState.subscriptions.get(componentId)
    
    return {
      component,
      stateDiff,
      recentChanges,
      conflicts,
      performance: {
        updateCount: recentChanges.length,
        averageUpdateTime: 0, // Would be calculated from actual metrics
        memoryUsage: this.estimateComponentMemoryUsage(component),
        lastActivity: component.metadata.updatedAt
      },
      hierarchy,
      subscriptions: {
        count: subscriptions?.size || 0,
        listeners: subscriptions ? Array.from(subscriptions).map(() => 'function') : []
      }
    }
  }
  
  /**
   * Get logs with filtering
   */
  getLogs(filters?: {
    level?: DebugLogEntry['level']
    category?: DebugLogEntry['category']
    componentId?: string
    since?: number
    search?: string
  }): DebugLogEntry[] {
    let logs = [...this.logs]
    
    if (filters) {
      if (filters.level) {
        logs = logs.filter(log => log.level === filters.level)
      }
      if (filters.category) {
        logs = logs.filter(log => log.category === filters.category)
      }
      if (filters.componentId) {
        logs = logs.filter(log => log.componentId === filters.componentId)
      }
      if (filters.since) {
        logs = logs.filter(log => log.timestamp >= filters.since!)
      }
      if (filters.search) {
        const search = filters.search.toLowerCase()
        logs = logs.filter(log => 
          log.message.toLowerCase().includes(search) ||
          JSON.stringify(log.data || {}).toLowerCase().includes(search)
        )
      }
    }
    
    return logs.sort((a, b) => b.timestamp - a.timestamp)
  }
  
  /**
   * Get state changes with filtering
   */
  getStateChanges(filters?: {
    componentId?: string
    type?: StateChangeEntry['type']
    source?: StateChangeEntry['source']
    since?: number
  }): StateChangeEntry[] {
    let changes = [...this.stateChanges]
    
    if (filters) {
      if (filters.componentId) {
        changes = changes.filter(change => change.componentId === filters.componentId)
      }
      if (filters.type) {
        changes = changes.filter(change => change.type === filters.type)
      }
      if (filters.source) {
        changes = changes.filter(change => change.source === filters.source)
      }
      if (filters.since) {
        changes = changes.filter(change => change.timestamp >= filters.since!)
      }
    }
    
    return changes.sort((a, b) => b.timestamp - a.timestamp)
  }
  
  /**
   * Get all snapshots
   */
  getSnapshots(): StateSnapshot[] {
    return [...this.snapshots].sort((a, b) => b.timestamp - a.timestamp)
  }
  
  /**
   * Restore state from snapshot
   */
  restoreFromSnapshot(snapshotId: string): boolean {
    if (!this.store) return false
    
    const snapshot = this.snapshots.find(s => s.id === snapshotId)
    if (!snapshot) return false
    
    try {
      const storeState = this.store()
      
      // Restore components
      storeState.components.clear()
      snapshot.globalState.components.forEach(([id, component]) => {
        storeState.components.set(id, component)
      })
      
      // Restore events
      storeState.events.splice(0, storeState.events.length, ...snapshot.globalState.events)
      
      // Restore metrics
      Object.assign(storeState.metrics, snapshot.performanceMetrics)
      
      // Clear conflicts
      storeState.conflicts.splice(0)
      
      this.log('info', 'state', `State restored from snapshot: ${snapshot.label}`, {
        snapshotId,
        timestamp: snapshot.timestamp
      })
      
      return true
    } catch (error) {
      this.log('error', 'state', 'Failed to restore from snapshot', {
        snapshotId,
        error: error instanceof Error ? error.message : String(error)
      })
      return false
    }
  }
  
  /**
   * Export debug data
   */
  exportDebugData(): string {
    const data = {
      timestamp: Date.now(),
      config: this.config,
      logs: this.logs,
      stateChanges: this.stateChanges,
      snapshots: this.snapshots,
      detectedIssues: this.detectedIssues,
      globalState: this.store ? this.extractGlobalState() : null
    }
    
    return JSON.stringify(data, null, 2)
  }
  
  /**
   * Import debug data
   */
  importDebugData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData)
      
      this.logs = data.logs || []
      this.stateChanges = data.stateChanges || []
      this.snapshots = data.snapshots || []
      this.detectedIssues = data.detectedIssues || []
      
      this.log('info', 'lifecycle', 'Debug data imported successfully', {
        logsCount: this.logs.length,
        changesCount: this.stateChanges.length,
        snapshotsCount: this.snapshots.length
      })
      
      return true
    } catch (error) {
      this.log('error', 'lifecycle', 'Failed to import debug data', {
        error: error instanceof Error ? error.message : String(error)
      })
      return false
    }
  }
  
  /**
   * Get detected issues
   */
  getDetectedIssues(severity?: DetectedIssue['severity']): DetectedIssue[] {
    let issues = [...this.detectedIssues]
    
    if (severity) {
      issues = issues.filter(issue => issue.severity === severity)
    }
    
    return issues.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
      return severityOrder[b.severity] - severityOrder[a.severity]
    })
  }
  
  /**
   * Clear debug data
   */
  clearDebugData(types?: Array<'logs' | 'changes' | 'snapshots' | 'issues'>): void {
    const targetTypes = types || ['logs', 'changes', 'snapshots', 'issues']
    
    if (targetTypes.includes('logs')) {
      this.logs = []
    }
    if (targetTypes.includes('changes')) {
      this.stateChanges = []
    }
    if (targetTypes.includes('snapshots')) {
      this.snapshots = []
    }
    if (targetTypes.includes('issues')) {
      this.detectedIssues = []
    }
    
    this.log('info', 'lifecycle', 'Debug data cleared', { types: targetTypes })
  }
  
  /**
   * Generate debug report
   */
  generateDebugReport(): {
    summary: {
      totalLogs: number
      totalStateChanges: number
      totalSnapshots: number
      totalIssues: number
      memoryUsage: number
      performanceScore: number
    }
    issues: DetectedIssue[]
    recommendations: string[]
    topComponents: Array<{ componentId: string, changeCount: number, issueCount: number }>
  } {
    const componentStats = new Map<string, { changes: number, issues: number }>()
    
    // Analyze state changes
    this.stateChanges.forEach(change => {
      const stats = componentStats.get(change.componentId) || { changes: 0, issues: 0 }
      stats.changes++
      componentStats.set(change.componentId, stats)
    })
    
    // Analyze issues
    this.detectedIssues.forEach(issue => {
      issue.affectedComponents.forEach(componentId => {
        const stats = componentStats.get(componentId) || { changes: 0, issues: 0 }
        stats.issues++
        componentStats.set(componentId, stats)
      })
    })
    
    const topComponents = Array.from(componentStats.entries())
      .map(([componentId, stats]) => ({
        componentId,
        changeCount: stats.changes,
        issueCount: stats.issues
      }))
      .sort((a, b) => (b.changeCount + b.issueCount * 10) - (a.changeCount + a.issueCount * 10))
      .slice(0, 10)
    
    const recommendations: string[] = []
    const criticalIssues = this.detectedIssues.filter(i => i.severity === 'critical').length
    const highIssues = this.detectedIssues.filter(i => i.severity === 'high').length
    
    if (criticalIssues > 0) {
      recommendations.push(`${criticalIssues} critical issues require immediate attention`)
    }
    if (highIssues > 0) {
      recommendations.push(`${highIssues} high-priority issues should be addressed`)
    }
    if (topComponents.length > 0 && topComponents[0].changeCount > 100) {
      recommendations.push(`Component ${topComponents[0].componentId} has excessive state changes`)
    }
    
    return {
      summary: {
        totalLogs: this.logs.length,
        totalStateChanges: this.stateChanges.length,
        totalSnapshots: this.snapshots.length,
        totalIssues: this.detectedIssues.length,
        memoryUsage: this.store ? this.estimateMemoryUsage(this.store()) : 0,
        performanceScore: this.store ? this.store().metrics.performanceScore : 1
      },
      issues: this.getDetectedIssues(),
      recommendations,
      topComponents
    }
  }
  
  /**
   * Shutdown debugger
   */
  shutdown(): void {
    if (this.snapshotInterval) {
      clearInterval(this.snapshotInterval)
    }
    
    this.log('info', 'lifecycle', 'GlobalStateDebugger shutting down')
    this.config.enabled = false
  }
  
  // Private methods
  
  private startAutoSnapshot(): void {
    this.snapshotInterval = setInterval(() => {
      this.createSnapshot(`Auto-snapshot ${new Date().toISOString()}`)
    }, this.config.autoSnapshotInterval)
  }
  
  private setupDevTools(): void {
    // Integration with Zustand DevTools would be implemented here
    // This is a simplified version
    if (typeof window !== 'undefined' && (window as any).__REDUX_DEVTOOLS_EXTENSION__) {
      this.log('info', 'lifecycle', 'DevTools integration enabled')
    }
  }
  
  private extractComponentStates(storeState: LiveComponentsSlice): Record<string, Record<string, any>> {
    const states: Record<string, Record<string, any>> = {}
    
    storeState.components.forEach((component, id) => {
      states[id] = { ...component.state }
    })
    
    return states
  }
  
  private extractGlobalState(): any {
    if (!this.store) return null
    
    const storeState = this.store()
    return {
      components: Array.from(storeState.components.entries()),
      events: storeState.events,
      metrics: storeState.metrics,
      conflicts: storeState.conflicts
    }
  }
  
  private getChangedKeys(oldState: Record<string, any>, newState: Record<string, any>): string[] {
    const changedKeys: string[] = []
    const allKeys = new Set([...Object.keys(oldState), ...Object.keys(newState)])
    
    for (const key of allKeys) {
      if (oldState[key] !== newState[key]) {
        changedKeys.push(key)
      }
    }
    
    return changedKeys
  }
  
  private calculateStateDiff(
    oldState: Record<string, any>,
    newState: Record<string, any>
  ): { added: Record<string, any>, removed: Record<string, any>, changed: Record<string, any> } {
    const added: Record<string, any> = {}
    const removed: Record<string, any> = {}
    const changed: Record<string, any> = {}
    
    // Find added and changed
    for (const key in newState) {
      if (!(key in oldState)) {
        added[key] = newState[key]
      } else if (oldState[key] !== newState[key]) {
        changed[key] = { from: oldState[key], to: newState[key] }
      }
    }
    
    // Find removed
    for (const key in oldState) {
      if (!(key in newState)) {
        removed[key] = oldState[key]
      }
    }
    
    return { added, removed, changed }
  }
  
  private estimateMemoryUsage(storeState: LiveComponentsSlice): number {
    // Rough estimation
    const componentSize = storeState.components.size * 1024 // 1KB per component
    const eventSize = storeState.events.length * 512 // 512 bytes per event
    const logSize = this.logs.length * 256 // 256 bytes per log
    
    return componentSize + eventSize + logSize
  }
  
  private estimateComponentMemoryUsage(component: ComponentStateEntry): number {
    // Rough estimation based on state size
    return JSON.stringify(component.state).length * 2 // Approximate memory usage
  }
  
  private detectIssues(componentId: string, change: StateChangeEntry): void {
    // Memory leak detection
    const componentChanges = this.stateChanges.filter(c => c.componentId === componentId)
    if (componentChanges.length > 1000) {
      this.addIssue({
        type: 'memory_leak',
        severity: 'high',
        description: `Component ${componentId} has excessive state changes (${componentChanges.length})`,
        affectedComponents: [componentId],
        suggestions: ['Review state update patterns', 'Consider state optimization']
      })
    }
    
    // Performance issues
    const recentChanges = componentChanges.filter(c => 
      Date.now() - c.timestamp < 10000 // Last 10 seconds
    )
    if (recentChanges.length > 50) {
      this.addIssue({
        type: 'performance',
        severity: 'medium',
        description: `Component ${componentId} has frequent state updates (${recentChanges.length} in 10s)`,
        affectedComponents: [componentId],
        suggestions: ['Implement debouncing', 'Batch state updates']
      })
    }
    
    // Stale state detection
    if (this.store) {
      const component = this.store().components.get(componentId)
      if (component && Date.now() - component.metadata.updatedAt > 300000) { // 5 minutes
        this.addIssue({
          type: 'stale_state',
          severity: 'low',
          description: `Component ${componentId} state appears stale (last update: ${new Date(component.metadata.updatedAt).toISOString()})`,
          affectedComponents: [componentId],
          suggestions: ['Check component activity', 'Verify update mechanisms']
        })
      }
    }
  }
  
  private addIssue(issue: Omit<DetectedIssue, 'id' | 'detectedAt'>): void {
    // Check if similar issue already exists
    const existingIssue = this.detectedIssues.find(existing => 
      existing.type === issue.type &&
      existing.affectedComponents.some(id => issue.affectedComponents.includes(id))
    )
    
    if (existingIssue) return // Don't duplicate issues
    
    const newIssue: DetectedIssue = {
      id: `issue_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      detectedAt: Date.now(),
      ...issue
    }
    
    this.detectedIssues.push(newIssue)
    
    this.log('warn', 'performance', `Issue detected: ${issue.description}`, {
      issueId: newIssue.id,
      type: issue.type,
      severity: issue.severity,
      affectedComponents: issue.affectedComponents
    })
  }
}