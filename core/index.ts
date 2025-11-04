/**
 * FluxStack Core
 * Main exports for the FluxStack framework
 */

// Server exports
export * from './server/services/index.ts'
export * from './server/middleware/index.ts'

// Client exports
export * from './client/index.ts'
export * from './client/state/index.ts'
export * from './client/hooks/index.ts'

// Testing exports
export * from './testing/index.ts'

// Existing exports
export * from './build/index.ts'
export * from './cli/generators/index.ts'
export * from './config/index.ts'
export * from './framework/server.ts'
export * from './framework/client.ts'
export * from './plugins/index.ts'
export * from './utils/logger/index.ts'
export * from './utils/errors/index.ts'

// Version exports
export { FLUXSTACK_VERSION, getVersion, getVersionInfo } from './utils/version.ts'