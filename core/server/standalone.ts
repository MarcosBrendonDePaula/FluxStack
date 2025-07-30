// Standalone backend server (sem frontend integrado)
import { FluxStackFramework, loggerPlugin } from "./index"
import { getEnvironmentConfig } from "../config/env"

export const createStandaloneServer = (userConfig: any = {}) => {
  const envConfig = getEnvironmentConfig()
  
  const app = new FluxStackFramework({
    port: userConfig.port || envConfig.BACKEND_PORT,
    apiPrefix: userConfig.apiPrefix || "/api",
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
  const envConfig = getEnvironmentConfig()
  const port = config.port || envConfig.BACKEND_PORT
  
  console.log(`🦊 FluxStack Backend`)
  console.log(`🚀 http://${envConfig.HOST}:${port}`)
  console.log(`📋 Health: http://${envConfig.HOST}:${port}/health`)
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