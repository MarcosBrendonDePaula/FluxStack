// FluxStack framework exports
export { FluxStackFramework } from '../framework/server'
export { staticPlugin, vitePlugin } from '../plugins/built-in'
export { swaggerPlugin } from '../plugins/built-in/swagger'
export { PluginRegistry } from '../plugins/registry'
export * from '../types'
export * from '../types/types'
export { LiveComponent } from '../types/types'
export { componentRegistry } from './live/ComponentRegistry'
// Live Components exports
export { liveComponentsPlugin } from './live/websocket-plugin'
// Static Files Plugin
export { staticFilesPlugin } from './plugins/static-files-plugin'
