import { Elysia } from "elysia"
import type { FluxStackConfig, FluxStackContext, Plugin } from "../types"

export class FluxStackFramework {
  private app: Elysia
  private context: FluxStackContext
  private plugins: Plugin[] = []

  constructor(config: FluxStackConfig = {}) {
    this.context = {
      config: {
        port: 3000,
        vitePort: 5173,
        clientPath: "app/client",
        apiPrefix: "/api",
        cors: {
          origins: ["*"],
          methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
          headers: ["Content-Type", "Authorization"]
        },
        build: {
          outDir: "dist",
          target: "bun"
        },
        ...config
      },
      isDevelopment: process.env.NODE_ENV !== "production",
      isProduction: process.env.NODE_ENV === "production"
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