// User application entry point
import { FluxStackFramework, vitePlugin, swaggerPlugin, staticPlugin, liveComponentsPlugin, staticFilesPlugin } from "@/core/server"
import { isDevelopment } from "@/core/utils/helpers"
import { DEBUG } from "@/core/utils/logger"
import { apiRoutes } from "./routes"
import { helpers } from "@/core/utils/env"
import { serverConfig } from "@/config/server.config"
import { appConfig } from "@/config/app.config"
import { loggerConfig } from "@/config/logger.config"
import "./live/register-components"

// Startup info moved to DEBUG level (set LOG_LEVEL=debug to see details)
DEBUG('🔧 Loading declarative configuration...')
DEBUG(`📊 Environment: ${appConfig.env}`)
DEBUG(`🚀 Port: ${serverConfig.port}`)
DEBUG(`🌐 Host: ${serverConfig.host}`)

// Criar aplicação com configuração declarativa
const app = new FluxStackFramework({
  server: {
    port: serverConfig.port,
    host: serverConfig.host,
    apiPrefix: serverConfig.apiPrefix,
    cors: {
      origins: serverConfig.corsOrigins,
      methods: serverConfig.corsMethods,
      headers: serverConfig.corsHeaders,
      credentials: serverConfig.corsCredentials
    },
    middleware: []
  },
  app: {
    name: serverConfig.appName,
    version: serverConfig.appVersion
  },
  client: {
    port: serverConfig.clientPort,
    proxy: {
      target: helpers.getServerUrl()
    },
    build: {
      sourceMaps: serverConfig.clientSourceMaps,
      minify: false,
      target: serverConfig.clientTarget as any,
      outDir: serverConfig.clientOutDir
    }
  }
})


// Usar plugins de infraestrutura primeiro (Logger é core, não é plugin)

// Usar plugins condicionalmente baseado no ambiente
if (isDevelopment()) {
  app.use(vitePlugin)
} else {
  app.use(staticPlugin)
}

// Add static files AFTER Vite to avoid conflicts, but BEFORE Live Components
app.use(staticFilesPlugin) // Add Static Files support 
app.use(liveComponentsPlugin) // Add Live Components support
  

// Adicionar rota de teste para mostrar config declarativo (antes das rotas)
app.getApp().get('/api/env-test', () => {
  return {
    message: '⚡ Declarative Config System!',
    timestamp: new Date().toISOString(),
    serverConfig: {
      port: serverConfig.port,
      host: serverConfig.host,
      apiPrefix: serverConfig.apiPrefix,
      appName: serverConfig.appName,
      appVersion: serverConfig.appVersion,
      cors: {
        origins: serverConfig.corsOrigins,
        methods: serverConfig.corsMethods,
        credentials: serverConfig.corsCredentials
      },
      client: {
        port: serverConfig.clientPort,
        target: serverConfig.clientTarget,
        sourceMaps: serverConfig.clientSourceMaps
      },
      features: {
        enableSwagger: serverConfig.enableSwagger,
        enableMetrics: serverConfig.enableMetrics,
        enableMonitoring: serverConfig.enableMonitoring
      }
    },
    environment: {
      NODE_ENV: appConfig.env,
      DEBUG: appConfig.debug,
      LOG_LEVEL: loggerConfig.level
    },
    urls: {
      server: helpers.getServerUrl(),
      client: helpers.getClientUrl(),
      swagger: `${helpers.getServerUrl()}/swagger`
    },
    system: {
      version: 'declarative-config',
      features: ['type-safe', 'validated', 'declarative', 'runtime-reload']
    }
  }
})

// Registrar rotas da aplicação DEPOIS da rota de teste
app.routes(apiRoutes)

// Swagger por último para descobrir todas as rotas
app.use(swaggerPlugin)

// Iniciar servidor (banner displayed by framework)
app.listen()



// Exportar tipo da aplicação para Eden Treaty (método correto)
export type App = typeof app