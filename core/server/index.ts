// FluxStack framework exports
export { FluxStackFramework } from "../framework/server"
export { loggerPlugin } from "../plugins/built-in/logger"
export { vitePlugin } from "../plugins/built-in/vite"
export { staticPlugin } from "../plugins/built-in/static"
export { swaggerPlugin } from "../plugins/built-in/swagger"
export { PluginRegistry } from "../plugins/registry"
export * from "../types"

// Live Components exports
export { liveComponentsPlugin } from "../live/websocket-plugin"
export { componentRegistry } from "../live/ComponentRegistry"
export { LiveComponent } from "../live/types"
export * from "../live/types"