// FluxStack framework exports
export { FluxStackFramework } from "../framework/server"
export { vitePlugin } from "../plugins/built-in/vite"
export { staticPlugin } from "../plugins/built-in/static"
export { swaggerPlugin } from "../plugins/built-in/swagger"
export { PluginRegistry } from "../plugins/registry"
export * from "../types"

// Live Components exports
export { liveComponentsPlugin } from "./live/websocket-plugin"
export { componentRegistry } from "./live/ComponentRegistry"
export { LiveComponent } from "../types/types"

// Static Files Plugin
export { staticFilesPlugin } from "./plugins/static-files-plugin"

export * from "../types/types"