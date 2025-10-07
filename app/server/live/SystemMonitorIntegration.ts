// 🔥 System Monitor Integration - Auto-capture metrics from Live Components

import { componentRegistry } from '../../../core/server/live/ComponentRegistry'

export class SystemMonitorIntegration {
  private static instance: SystemMonitorIntegration | null = null
  private systemMonitorId: string | null = null
  
  private constructor() {
    this.setupHooks()
  }
  
  public static getInstance(): SystemMonitorIntegration {
    if (!SystemMonitorIntegration.instance) {
      SystemMonitorIntegration.instance = new SystemMonitorIntegration()
    }
    return SystemMonitorIntegration.instance
  }
  
  // Set the system monitor component ID
  public setSystemMonitorId(componentId: string) {
    this.systemMonitorId = componentId
    console.log(`📊 SystemMonitor integration activated: ${componentId}`)
  }
  
  // Get system monitor component
  private getSystemMonitor() {
    if (!this.systemMonitorId) return null
    return componentRegistry.getComponent(this.systemMonitorId)
  }
  
  // Setup hooks to capture Live Component events
  private setupHooks() {
    // Override the original mountComponent method
    const originalMountComponent = componentRegistry.mountComponent.bind(componentRegistry)
    componentRegistry.mountComponent = async (...args) => {
      const result = await originalMountComponent(...args)
      
      // Record connection event
      this.recordConnection(args[1], 'connected')
      
      return result
    }
    
    // Override the original unmountComponent method
    const originalUnmountComponent = componentRegistry.unmountComponent.bind(componentRegistry)
    componentRegistry.unmountComponent = async (componentId) => {
      const component = componentRegistry.getComponent(componentId)
      const componentType = component?.constructor.name || 'Unknown'
      
      await originalUnmountComponent(componentId)
      
      // Record disconnection event
      this.recordConnection(componentType, 'disconnected')
    }
    
    // Override the original rehydrateComponent method
    const originalRehydrateComponent = componentRegistry.rehydrateComponent.bind(componentRegistry)
    componentRegistry.rehydrateComponent = async (...args) => {
      const result = await originalRehydrateComponent(...args)
      
      if (result.success) {
        // Record rehydration event
        this.recordConnection(args[1], 'rehydrated')
      }
      
      return result
    }
    
    // Override the original executeAction method
    const originalExecuteAction = componentRegistry.executeAction.bind(componentRegistry)
    componentRegistry.executeAction = async (componentId, action, payload) => {
      const startTime = Date.now()
      let success = false
      
      try {
        const result = await originalExecuteAction(componentId, action, payload)
        success = true
        return result
      } catch (error) {
        success = false
        throw error
      } finally {
        const responseTime = Date.now() - startTime
        
        // Record message event
        this.recordMessage(action, componentId, success, responseTime)
      }
    }

    // Setup completed - logged in auto-discovery group
  }
  
  // Record a connection event
  private recordConnection(componentType: string, status: 'connected' | 'disconnected' | 'rehydrated') {
    const monitor = this.getSystemMonitor()
    if (!monitor) return
    
    try {
      monitor.executeAction('recordConnection', {
        componentType,
        status
      }).catch(error => {
        console.warn('⚠️ Failed to record connection event:', error.message)
      })
    } catch (error) {
      console.warn('⚠️ Error recording connection event:', error)
    }
  }
  
  // Record a message event
  private recordMessage(type: string, componentId: string, success: boolean, responseTime?: number) {
    const monitor = this.getSystemMonitor()
    if (!monitor) return
    
    try {
      monitor.executeAction('recordMessage', {
        type,
        componentId,
        success,
        responseTime
      }).catch(error => {
        console.warn('⚠️ Failed to record message event:', error.message)
      })
    } catch (error) {
      console.warn('⚠️ Error recording message event:', error)
    }
  }
  
  // Manually trigger metrics collection for all monitors
  public triggerMetricsCollection() {
    const monitor = this.getSystemMonitor()
    if (!monitor) return
    
    try {
      monitor.executeAction('collectMetrics', {}).catch(error => {
        console.warn('⚠️ Failed to trigger metrics collection:', error.message)
      })
    } catch (error) {
      console.warn('⚠️ Error triggering metrics collection:', error)
    }
  }
  
  // Get current system stats
  public getSystemStats() {
    return componentRegistry.getStats()
  }
}

// Export singleton instance
export const systemMonitorIntegration = SystemMonitorIntegration.getInstance()