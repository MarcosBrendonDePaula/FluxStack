// User application entry point
import { FluxStackFramework, vitePlugin, swaggerPlugin, staticPlugin, liveComponentsPlugin, staticFilesPlugin } from "@/core/server"
import { isDevelopment } from "@/core/utils/helpers"
import { DEBUG } from "@/core/utils/logger"
import { appInstance } from "./app"
import { helpers } from "@/core/utils/env"
import { serverConfig } from "@/config/server.config"
import { appConfig } from "@/config/app.config"
import { loggerConfig } from "@/config/logger.config"
import cryptoAuthPlugin from "@/plugins/crypto-auth"
import "./live/register-components"

// Startup info moved to DEBUG level (set LOG_LEVEL=debug to see details)
DEBUG('🔧 Loading declarative configuration...')
DEBUG(`📊 Environment: ${appConfig.env}`)
DEBUG(`🚀 Port: ${serverConfig.server.port}`)
DEBUG(`🌐 Host: ${serverConfig.server.host}`)

// Criar aplicação com configuração declarativa
const app = new FluxStackFramework({
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
})


// Usar plugins de infraestrutura primeiro (Logger é core, não é plugin)

// Registrar plugin de autenticação ANTES dos outros plugins
app.use(cryptoAuthPlugin)

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
      port: serverConfig.server.port,
      host: serverConfig.server.host,
      apiPrefix: serverConfig.server.apiPrefix,
      appName: appConfig.name,
      appVersion: appConfig.version,
      cors: {
        origins: serverConfig.cors.origins,
        methods: serverConfig.cors.methods,
        credentials: serverConfig.cors.credentials
      },
      client: {
        port: serverConfig.server.backendPort,
        target: 'es2020',
        sourceMaps: false
      },
      features: {
        enableSwagger: appConfig.enableSwagger,
        enableMetrics: appConfig.enableMetrics,
        enableMonitoring: appConfig.enableMonitoring
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
app.routes(appInstance)

// Swagger por último para descobrir todas as rotas
app.use(swaggerPlugin)

// Iniciar servidor (banner displayed by framework)
app.listen()



// Exportar tipo da aplicação para Eden Treaty (método correto)
export type App = typeof app