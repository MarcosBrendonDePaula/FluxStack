// Standalone backend server (sem frontend integrado)
import { FluxStackFramework } from "./index"
import type { Plugin, PluginContext } from "../types"

export const createStandaloneServer = (userConfig: any = {}) => {
  const app = new FluxStackFramework({
    server: {
      port: userConfig.port || parseInt(process.env.BACKEND_PORT || '3000'),
      host: 'localhost',
      apiPrefix: userConfig.apiPrefix || "/api",
      cors: {
        origins: ['*'],
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        headers: ['Content-Type', 'Authorization'],
        credentials: false,
        maxAge: 86400
      },
      middleware: []
    },
    app: { name: 'FluxStack Backend', version: '1.0.0' },
    client: { port: 5173, proxy: { target: 'http://localhost:3000' }, build: { sourceMaps: true, minify: false, target: 'es2020', outDir: 'dist' } },
    ...userConfig
  })

  // Plugin de logging silencioso para standalone
  const silentLogger: Plugin = {
    name: "silent-logger",
    setup: (context: PluginContext) => {
      context.app.onRequest(({ request }: { request: Request }) => {
        // Log mais limpo para backend standalone
        const timestamp = new Date().toLocaleTimeString()
        const path = new URL(request.url).pathname
        console.log(`[${timestamp}] ${request.method} ${path}`)
      })
    }
  }

  app.use(silentLogger)
  return app
}

export const startBackendOnly = async (userRoutes?: any, config: any = {}) => {
  const port = config.port || process.env.BACKEND_PORT || 3000
  const host = process.env.HOST || 'localhost'
  
  console.log(`🦊 FluxStack Backend`)
  console.log(`🚀 http://${host}:${port}`)
  console.log(`📋 Health: http://${host}:${port}/health`)
  console.log()

  const app = createStandaloneServer(config)
  
  if (userRoutes) {
    app.routes(userRoutes)
  }

  // Adicionar rota de health check
  const framework = app.getApp()
  framework.get("/health", () => ({ 
    status: "ok", 
    mode: "backend-only",
    timestamp: new Date().toISOString(),
    port
  }))

  // Override do listen para não mostrar mensagens do framework
  const context = app.getContext()
  framework.listen(context.config.port!, () => {
    // Mensagem já foi mostrada acima, não repetir
  })

  return app
}