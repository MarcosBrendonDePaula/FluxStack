// User application entry point
import { FluxStackFramework, vitePlugin, swaggerPlugin, staticPlugin, liveComponentsPlugin, staticFilesPlugin } from "@/core/server"
import { isDevelopment } from "@/core/utils/helpers"
import { DEBUG } from "@/core/utils/logger"
import { apiRoutes } from "./routes"
// Import sistema de env dinâmico simplificado
import { env, helpers } from "@/core/utils/env-runtime-v2"
// Import live components registration
import "./live/register-components"

// Startup info moved to DEBUG level (set LOG_LEVEL=debug to see details)
DEBUG('🔧 Loading dynamic environment configuration...')
DEBUG(`📊 Environment: ${env.NODE_ENV}`)
DEBUG(`🚀 Port: ${env.PORT}`)
DEBUG(`🌐 Host: ${env.HOST}`)

// Criar aplicação com configuração dinâmica simplificada
const app = new FluxStackFramework({
  server: {
    port: env.PORT,                      // Direto! (number)
    host: env.HOST,                      // Direto! (string)
    apiPrefix: env.API_PREFIX,           // Direto! (string)
    cors: {
      origins: env.CORS_ORIGINS,         // Direto! (string[])
      methods: env.get('CORS_METHODS', ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']),
      headers: env.get('CORS_HEADERS', ['*']),
      credentials: env.get('CORS_CREDENTIALS', false)
    },
    middleware: []
  },
  app: {
    name: env.FLUXSTACK_APP_NAME,        // Direto! (string)
    version: env.FLUXSTACK_APP_VERSION   // Direto! (string)
  },
  client: {
    port: env.VITE_PORT,                 // Direto! (number)
    proxy: {
      target: helpers.getServerUrl()     // Helper inteligente
    },
    build: {
      sourceMaps: env.get('CLIENT_SOURCEMAPS', env.NODE_ENV !== 'production'),
      minify: env.get('CLIENT_MINIFY', env.NODE_ENV === 'production'),
      target: env.get('CLIENT_TARGET', 'es2020'),
      outDir: env.get('CLIENT_OUTDIR', 'dist')
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
  

// Adicionar rota de teste para mostrar env dinâmico (antes das rotas)
app.getApp().get('/api/env-test', () => {
  return {
    message: '🔥 Environment Variables Simplificado!',
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: env.NODE_ENV,             // Direto!
      PORT: env.PORT,                     // Direto!
      HOST: env.HOST,                     // Direto!
      DEBUG: env.DEBUG,                   // Direto!
      CORS_ORIGINS: env.CORS_ORIGINS,     // Direto!
      ENABLE_SWAGGER: env.ENABLE_SWAGGER, // Direto!
      
      // Vars customizadas com casting automático
      CUSTOM_VAR: env.get('CUSTOM_VAR', 'not-set'),
      MAX_RETRIES: env.get('MAX_RETRIES', 3),        // number
      ENABLE_CACHE: env.get('ENABLE_CACHE', false),  // boolean
      ALLOWED_IPS: env.get('ALLOWED_IPS', [])        // string[]
    },
    urls: {
      server: helpers.getServerUrl(),     // Helper!
      swagger: `${helpers.getServerUrl()}/swagger`
    },
    note: 'API simplificada com casting automático! 🚀'
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