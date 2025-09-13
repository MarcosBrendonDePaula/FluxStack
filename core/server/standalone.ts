// Standalone backend server (sem frontend integrado)
import { FluxStackFramework, loggerPlugin } from "./index"
import { getEnvironmentInfo } from "../config/env"

export const createStandaloneServer = (userConfig: any = {}) => {
  const envInfo = getEnvironmentInfo()
  
  const app = new FluxStackFramework({
    server: {
      port: userConfig.port || process.env.BACKEND_PORT || 3000,
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
    ...userConfig
  })

  // Plugin de logging silencioso para standalone
  const silentLogger = {
    name: "silent-logger",
    setup: () => ({
      onRequest: ({ request, path }) => {
        // Log mais limpo para backend standalone
        const timestamp = new Date().toLocaleTimeString()
        console.log(`[${timestamp}] ${request.method} ${path}`)
      }
    })
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