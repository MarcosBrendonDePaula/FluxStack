/**
 * FluxStack Core
 * Main exports for the FluxStack framework
 */

// Server exports
export * from './server/services/index'
export * from './server/middleware/index'

// Client exports
export * from './client/index'
export * from './client/state/index'
export * from './client/hooks/index'

// Testing exports
export * from './testing/index'

// Existing exports
export * from './build/index'
export * from './cli/generators/index'
export * from './config/index'
export * from './framework/server'
export * from './framework/client'
export * from './plugins/index'
export * from './utils/logger/index'
export * from './utils/errors/index'

// Version exports
export { FLUXSTACK_VERSION, getVersion, getVersionInfo } from './utils/version'