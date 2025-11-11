/**
 * FluxStack Core
 * Main exports for the FluxStack framework
 */

// Server exports
export * from './server/services/index.js'
export * from './server/middleware/index.js'

// Client exports  
export * from './client/index.js'
export * from './client/state/index.js'
export * from './client/hooks/index.js'

// Testing exports
export * from './testing/index.js'

// Existing exports
export * from './build/index.js'
export * from './cli/generators/index.js'
export * from './config/index.js'
export * from './framework/server.js'
export * from './framework/client.js'
export * from './plugins/index.js'
export * from './utils/logger/index.js'
export * from './utils/errors/index.js'
// Version exports
export { FLUXSTACK_VERSION, getVersion, getVersionInfo } from './utils/version.js'