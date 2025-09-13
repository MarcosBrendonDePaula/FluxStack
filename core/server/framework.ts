import { Elysia } from "elysia"
import type { FluxStackConfig, FluxStackContext, Plugin } from "../types"
import type { PluginContext, PluginUtils } from "../plugins/types"
import { getConfigSync, getEnvironmentInfo } from "../config"
import { logger } from "../utils/logger"
import { createTimer, formatBytes, isProduction, isDevelopment } from "../utils/helpers"

export class FluxStackFramework {
  private app: Elysia
  private context: FluxStackContext
  private pluginContext: PluginContext
  private plugins: Plugin[] = []

  constructor(config?: Partial<FluxStackConfig>) {
    // Load the full configuration
    const fullConfig = config ? { ...getConfigSync(), ...config } : getConfigSync()
    const envInfo = getEnvironmentInfo()

    this.context = {
      config: fullConfig,
      isDevelopment: envInfo.isDevelopment,
      isProduction: envInfo.isProduction,
      isTest: envInfo.isTest,
      environment: envInfo.name
    }

    this.app = new Elysia()

    // Create plugin utilities
    const pluginUtils: PluginUtils = {
      createTimer,
      formatBytes,
      isProduction,
      isDevelopment
    }

    // Create plugin context
    this.pluginContext = {
      config: fullConfig,
      logger: logger,
      app: this.app,
      utils: pluginUtils
    }

    this.setupCors()
  }

  private setupCors() {
    const { cors } = this.context.config.server

    this.app
      .onRequest(({ set }) => {
        set.headers["Access-Control-Allow-Origin"] = cors.origins.join(", ") || "*"
        set.headers["Access-Control-Allow-Methods"] = cors.methods.join(", ") || "*"
        set.headers["Access-Control-Allow-Headers"] = cors.headers.join(", ") || "*"
        if (cors.credentials) {
          set.headers["Access-Control-Allow-Credentials"] = "true"
        }
      })
      .options("*", ({ set }) => {
        set.status = 200
        return ""
      })
  }

  use(plugin: Plugin) {
    this.plugins.push(plugin)
    if (plugin.setup) {
      plugin.setup(this.pluginContext)
    }
    return this
  }

  routes(routeModule: any) {
    this.app.use(routeModule)
    return this
  }

  getApp() {
    return this.app
  }

  getContext() {
    return this.context
  }

  listen(callback?: () => void) {
    const port = this.context.config.server.port
    const apiPrefix = this.context.config.server.apiPrefix

    this.app.listen(port, () => {
      console.log(`🚀 API ready at http://localhost:${port}${apiPrefix}`)
      console.log(`📋 Health check: http://localhost:${port}${apiPrefix}/health`)
      console.log()
      callback?.()
    })
  }
}