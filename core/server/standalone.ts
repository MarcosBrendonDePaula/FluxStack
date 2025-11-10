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
    app: { name: 'FluxStack Backend', version: '1.7.4' },
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

/**
 * Create a simple table-like output
 */
function printTable(data: Record<string, string>, title?: string) {
  const maxKeyLength = Math.max(...Object.keys(data).map(k => k.length))
  const maxValueLength = Math.max(...Object.values(data).map(v => v.length))
  const tableWidth = maxKeyLength + maxValueLength + 7

  const border = '─'.repeat(tableWidth)

  if (title) {
    console.log(`┌${border}┐`)
    const padding = Math.floor((tableWidth - title.length) / 2)
    console.log(`│${' '.repeat(padding)}${title}${' '.repeat(tableWidth - padding - title.length)}│`)
    console.log(`├${border}┤`)
  } else {
    console.log(`┌${border}┐`)
  }

  Object.entries(data).forEach(([key, value]) => {
    const keyPadded = key.padEnd(maxKeyLength)
    const valuePadded = value.padEnd(maxValueLength)
    console.log(`│ ${keyPadded} │ ${valuePadded} │`)
  })

  console.log(`└${border}┘`)
}

export const startBackendOnly = async (userRoutes?: any, config: any = {}) => {
  const port = config.port || process.env.BACKEND_PORT || 3000
  const host = config.host || process.env.HOST || 'localhost'
  const apiPrefix = config.apiPrefix || '/api'

  // Display server information in a clean table
  printTable({
    'Mode': 'Backend Standalone',
    'Server': `http://${host}:${port}`,
    'API Prefix': apiPrefix,
    'Health Check': `http://${host}:${port}/health`,
    'Hot Reload': 'Enabled'
  }, 'FluxStack Backend Server')

  console.log()

  const app = createStandaloneServer(config)
  
  if (userRoutes) {
    app.routes(userRoutes)
  }

  // Adicionar rotas básicas para backend standalone
  const framework = app.getApp()
  
  // Health check
  framework.get("/health", () => ({ 
    status: "ok", 
    mode: "backend-only",
    timestamp: new Date().toISOString(),
    port
  }))
  
  // Rota raiz informativa para backend standalone
  framework.get("/", () => ({
    message: "🦊 FluxStack Backend Server",
    mode: "backend-only",
    endpoints: {
      health: "/health",
      api: "/api/*",
      docs: "/swagger"
    },
    frontend: {
      note: "Frontend não está rodando neste servidor",
      recommendation: "Use 'bun run dev' para modo integrado ou 'bun run dev:frontend' para frontend standalone"
    },
    timestamp: new Date().toISOString()
  }))

  // Override do listen para não mostrar mensagens do framework
  const context = app.getContext()
  framework.listen(context.config.port!, () => {
    // Mensagem já foi mostrada acima, não repetir
  })

  return app
}