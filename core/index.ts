/**
 * FluxStack Core
 * Main exports for the FluxStack framework
 */

// Framework core (primary exports)
export { FluxStackFramework } from './framework/server'
export { FluxStackClient } from './framework/client'

// Server components (includes config types via re-export)
export * from './server'

// Client components
export * from './client'

// Testing utilities
export * from './testing'

// Build system
export * from './build'

// CLI and generators
export * from './cli/generators'

// Plugin system (avoid wildcard to prevent conflicts)
export { PluginRegistry } from './plugins/registry'
export { PluginDiscovery, pluginDiscovery } from './plugins/discovery'
export { PluginManager } from './plugins/manager'
export { PluginUtils } from './plugins'

// Utilities
export * from './utils/logger'
// Note: errors are already exported via ./server (BuildError), avoid duplicate export

// Version
export { FLUXSTACK_VERSION } from './utils/version'