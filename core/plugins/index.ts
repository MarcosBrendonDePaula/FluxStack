/**
 * FluxStack Plugin System
 * Main exports for the plugin system
 */

export { PluginRegistry } from "./registry"
export * from "./types"

// Built-in plugins
export { loggerPlugin } from "./built-in/logger"
export { swaggerPlugin } from "./built-in/swagger"
export { vitePlugin } from "./built-in/vite"
export { staticPlugin } from "./built-in/static"