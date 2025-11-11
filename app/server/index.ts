/**
 * 🚀 FluxStack Application Server Entry Point
 * Main server configuration and initialization
 */

// ===== Core Framework =====
import { FluxStackFramework } from "@/core/server"
import { isDevelopment } from "@/core/utils/helpers"
import { DEBUG } from "@/core/utils/logger"
import { helpers } from "@/core/utils/env"

// ===== Configuration =====
import { appConfig } from "@/config/app.config"
import { serverConfig } from "@/config/server.config"

// ===== Plugins =====
import {
  vitePlugin,
  swaggerPlugin,
  staticPlugin,
  liveComponentsPlugin,
  staticFilesPlugin
} from "@/core/server"
import cryptoAuthPlugin from "@/plugins/crypto-auth"

// ===== Application Routes =====
import { appInstance } from "./app"

// NOTE: Live Components auto-discovery is handled by liveComponentsPlugin
// No need to import "./live/register-components" anymore

// ===== Startup Logging =====
DEBUG('🔧 Loading declarative configuration...')
DEBUG(`📊 Environment: ${appConfig.env}`)
DEBUG(`🚀 Port: ${serverConfig.server.port}`)
DEBUG(`🌐 Host: ${serverConfig.server.host}`)

// ===== Framework Configuration Helper =====
/**
 * Creates FluxStack framework configuration from declarative configs
 */
function createFrameworkConfig() {
  return {
    server: {
      port: serverConfig.server.port,
      host: serverConfig.server.host,
      apiPrefix: serverConfig.server.apiPrefix,
      cors: {
        origins: serverConfig.cors.origins,
        methods: serverConfig.cors.methods,
        headers: serverConfig.cors.headers,
        credentials: serverConfig.cors.credentials
      },
      middleware: []
    },
    app: {
      name: appConfig.name,
      version: appConfig.version
    },
    client: {
      port: serverConfig.server.backendPort,
      proxy: {
        target: helpers.getServerUrl()
      },
      build: {
        sourceMaps: false,
        minify: false,
        target: 'es2020' as any,
        outDir: 'dist'
      }
    }
  }
}

// ===== Initialize Application =====
const app = new FluxStackFramework(createFrameworkConfig())

// ===== Register Plugins =====
// Note: Logger is part of core, not a plugin

// 1. Authentication plugin (must be registered first)
app.use(cryptoAuthPlugin)

// 2. Development/Production plugins (conditional)
if (isDevelopment()) {
  app.use(vitePlugin)  // Development: Vite dev server
} else {
  app.use(staticPlugin)  // Production: Static file serving
}

// 3. Static files (after Vite, before Live Components to avoid conflicts)
app.use(staticFilesPlugin)

// 4. Live Components (WebSocket support)
app.use(liveComponentsPlugin)

// ===== Register Routes =====
// Note: Routes are now registered in app.ts (including envTestRoute)
app.routes(appInstance)

// ===== Final Setup =====

// Swagger documentation (must be last to discover all routes)
app.use(swaggerPlugin)

// ===== Start Server =====
// Banner will be displayed automatically by the framework
app.listen()

// ===== Eden Treaty Type Export =====
// Export application type for type-safe client communication
export type App = typeof app