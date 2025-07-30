import { Elysia } from "elysia"
import type { FluxStackConfig, FluxStackContext, Plugin } from "../types"
import { getEnvironmentConfig, isDevelopment, isProduction } from "../config/env"

export class FluxStackFramework {
  private app: Elysia
  private context: FluxStackContext
  private plugins: Plugin[] = []

  constructor(config: FluxStackConfig = {}) {
    const envConfig = getEnvironmentConfig()
    
    this.context = {
      config: {
        port: envConfig.PORT,
        vitePort: envConfig.FRONTEND_PORT,
        clientPath: "app/client",
        apiPrefix: "/api",
        cors: {
          origins: envConfig.CORS_ORIGINS,
          methods: envConfig.CORS_METHODS,
          headers: envConfig.CORS_HEADERS
        },
        build: {
          outDir: envConfig.BUILD_OUTDIR,
          target: envConfig.BUILD_TARGET
        },
        // Allow user config to override environment config
        ...config
      },
      isDevelopment: isDevelopment(),
      isProduction: isProduction(),
      envConfig
    }

    this.app = new Elysia()
    this.setupCors()
  }

  private setupCors() {
    const { cors } = this.context.config
    
    this.app
      .onRequest(({ set }) => {
        set.headers["Access-Control-Allow-Origin"] = cors?.origins?.join(", ") || "*"
        set.headers["Access-Control-Allow-Methods"] = cors?.methods?.join(", ") || "*"
        set.headers["Access-Control-Allow-Headers"] = cors?.headers?.join(", ") || "*"
      })
      .options("*", ({ set }) => {
        set.status = 200
        return ""
      })
  }

  use(plugin: Plugin) {
    this.plugins.push(plugin)
    plugin.setup(this.context)
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
    this.app.listen(this.context.config.port!, () => {
      console.log(`🚀 API ready at http://localhost:${this.context.config.port}/api`)
      console.log(`📋 Health check: http://localhost:${this.context.config.port}/api/health`)
      console.log()
      callback?.()
    })
  }
}