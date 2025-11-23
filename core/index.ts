/**
 * FluxStack Core
 * Main exports for the FluxStack framework
 */

// Build system
export * from './build'
// CLI and generators
export * from './cli/generators'
// Client components
export * from './client'
export { FluxStackClient } from './framework/client'
// Framework core (primary exports)
export { FluxStackFramework } from './framework/server'
export { PluginUtils } from './plugins'
export { PluginDiscovery, pluginDiscovery } from './plugins/discovery'
export { PluginManager } from './plugins/manager'
// Plugin system (avoid wildcard to prevent conflicts)
export { PluginRegistry } from './plugins/registry'
// Server components (includes config types via re-export)
export * from './server'
// Testing utilities
export * from './testing'

// Utilities
export * from './utils/logger'
// Note: errors are already exported via ./server (BuildError), avoid duplicate export

// Version
export { FLUXSTACK_VERSION } from './utils/version'
