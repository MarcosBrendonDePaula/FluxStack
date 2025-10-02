// 🔥 Register all live components
// Import all components to ensure they're included in the bundle

import { CounterComponent } from "./CounterComponent"
import { FluxStackConfig } from "./FluxStackConfig"
import { LiveClockComponent } from "./LiveClockComponent"
import { SidebarNavigation } from "./SidebarNavigation"
import { SystemMonitor } from "./SystemMonitor"
import { SystemMonitorIntegration } from "./SystemMonitorIntegration"
import { TesteComponent } from "./TesteComponent"
import { UserProfileComponent } from "./UserProfileComponent"
import { componentRegistry } from "@/core/server/live/ComponentRegistry"

// Register all components statically for production bundle
function registerAllComponents() {
  try {
    // Register each component individually
    componentRegistry.registerComponentClass('Counter', CounterComponent)
    componentRegistry.registerComponentClass('FluxStackConfig', FluxStackConfig)
    componentRegistry.registerComponentClass('LiveClock', LiveClockComponent)
    componentRegistry.registerComponentClass('SidebarNavigation', SidebarNavigation)
    componentRegistry.registerComponentClass('SystemMonitor', SystemMonitor)
    componentRegistry.registerComponentClass('SystemMonitorIntegration', SystemMonitorIntegration)
    componentRegistry.registerComponentClass('Teste', TesteComponent)
    componentRegistry.registerComponentClass('UserProfile', UserProfileComponent)
    
    console.log('📝 Live components registered successfully!')
  } catch (error) {
    console.warn('⚠️ Error registering components:', error)
  }
}

// Auto-register components
registerAllComponents()

// Export all components to ensure they're included in the bundle
export { 
  CounterComponent,
  FluxStackConfig,
  LiveClockComponent,
  SidebarNavigation,
  SystemMonitor,
  SystemMonitorIntegration,
  TesteComponent,
  UserProfileComponent
}