import { swagger } from '@elysiajs/swagger'
import type { FluxStack, PluginContext } from '@/core/plugins/types'
import { appConfig } from '@/config/app.config'
import { serverConfig } from '@/config/server.config'
import { pluginsConfig } from '@/config/plugins.config'

type Plugin = FluxStack.Plugin

/**
 * Parse servers from config string
 * Format: "url1|description1,url2|description2"
 */
function parseServersFromConfig(serversString: string): Array<{ url: string; description: string }> {
  if (!serversString || serversString.trim() === '') {
    return []
  }

  return serversString.split(',').map(server => {
    const [url, description] = server.split('|').map(s => s.trim())
    return {
      url: url || '',
      description: description || 'Server'
    }
  }).filter(s => s.url !== '')
}

// Configuration from config/plugins.config.ts (user editable)
const DEFAULTS = {
  enabled: pluginsConfig.swaggerEnabled,
  path: pluginsConfig.swaggerPath,
  title: pluginsConfig.swaggerTitle,
  description: pluginsConfig.swaggerDescription,
  version: pluginsConfig.swaggerVersion,
  excludePaths: pluginsConfig.swaggerExcludePaths,
  servers: parseServersFromConfig(pluginsConfig.swaggerServers),

  // Swagger UI options
  swaggerOptions: {
    persistAuthorization: pluginsConfig.swaggerPersistAuthorization,
    displayRequestDuration: pluginsConfig.swaggerDisplayRequestDuration,
    filter: pluginsConfig.swaggerEnableFilter,
    showExtensions: pluginsConfig.swaggerShowExtensions,
    tryItOutEnabled: pluginsConfig.swaggerTryItOutEnabled
  },

  // Authentication
  authEnabled: pluginsConfig.swaggerAuthEnabled,
  authUsername: pluginsConfig.swaggerAuthUsername,
  authPassword: pluginsConfig.swaggerAuthPassword,

  // Security (can be extended via env vars if needed)
  securitySchemes: {},
  globalSecurity: [] as Array<Record<string, any>>
}

export const swaggerPlugin: Plugin = {
  name: 'swagger',
  version: '1.0.0',
  description: 'Swagger documentation plugin for FluxStack with automatic tag discovery',
  author: 'FluxStack Team',
  priority: 500,
  category: 'documentation',
  tags: ['swagger', 'documentation', 'api'],
  dependencies: [],

  setup: async (context: PluginContext) => {
    if (!DEFAULTS.enabled) {
      context.logger.debug('Swagger plugin disabled by configuration')
      return
    }

    try {
      // Build servers list
      const servers = DEFAULTS.servers.length > 0 ? DEFAULTS.servers : [
        {
          url: `http://${serverConfig.server.host}:${serverConfig.server.port}`,
          description: 'Development server'
        }
      ]

      // Add production server if in production
      if (context.utils.isProduction()) {
        servers.push({
          url: 'https://api.example.com', // This would be configured
          description: 'Production server'
        })
      }

      // Simple Swagger configuration - all options from config/plugins.config.ts
      const swaggerConfig = {
        path: DEFAULTS.path,
        documentation: {
          info: {
            title: DEFAULTS.title || appConfig.name || 'FluxStack API',
            version: DEFAULTS.version || appConfig.version,
            description: DEFAULTS.description || appConfig.description || 'Modern full-stack TypeScript framework with type-safe API endpoints'
          },
          servers,

          // Add security schemes if defined
          ...(Object.keys(DEFAULTS.securitySchemes).length > 0 && {
            components: {
              securitySchemes: DEFAULTS.securitySchemes
            }
          }),

          // Add global security if defined
          ...(DEFAULTS.globalSecurity.length > 0 && {
            security: DEFAULTS.globalSecurity
          })
        },
        exclude: DEFAULTS.excludePaths,
        swaggerOptions: DEFAULTS.swaggerOptions
      }

      // Add Basic Auth middleware if enabled
      if (DEFAULTS.authEnabled && DEFAULTS.authPassword) {
        context.app.onBeforeHandle({ as: 'global' }, ({ request, set, path }) => {
          // Only protect Swagger routes
          if (!path.startsWith(DEFAULTS.path)) {
            return
          }

          const authHeader = request.headers.get('authorization')

          if (!authHeader || !authHeader.startsWith('Basic ')) {
            set.status = 401
            set.headers['WWW-Authenticate'] = 'Basic realm="Swagger Documentation"'
            return {
              error: 'Authentication required',
              message: 'Please provide valid credentials to access Swagger documentation'
            }
          }

          // Decode Basic Auth credentials
          const base64Credentials = authHeader.substring(6)
          const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8')
          const [username, password] = credentials.split(':')

          // Validate credentials
          if (username !== DEFAULTS.authUsername || password !== DEFAULTS.authPassword) {
            set.status = 401
            set.headers['WWW-Authenticate'] = 'Basic realm="Swagger Documentation"'
            return {
              error: 'Invalid credentials',
              message: 'The provided username or password is incorrect'
            }
          }

          // Credentials valid, continue to Swagger
        })

        context.logger.debug(`🔒 Swagger authentication enabled (username: ${DEFAULTS.authUsername})`)
      }

      // That's it! Elysia Swagger auto-discovers everything else
      context.app.use(swagger(swaggerConfig))

      context.logger.debug(`Swagger documentation enabled at ${DEFAULTS.path}`, {
        title: swaggerConfig.documentation.info.title,
        version: swaggerConfig.documentation.info.version,
        servers: servers.length,
        authEnabled: DEFAULTS.authEnabled
      })
    } catch (error) {
      context.logger.error('Failed to setup Swagger plugin', { error })
      throw error
    }
  },

  onServerStart: async (context: PluginContext) => {
    if (DEFAULTS.enabled) {
      const swaggerUrl = `http://${serverConfig.server.host}:${serverConfig.server.port}${DEFAULTS.path}`
      context.logger.debug(`📋 Swagger documentation available at: ${swaggerUrl}`)
    }
  }
}

// ==========================================
// ⚙️  SWAGGER CONFIGURATION
// ==========================================
//
// All Swagger options are configurable via:
// 📁 config/plugins.config.ts (user editable)
// 🌍 Environment variables (.env file)
//
// Available configurations:
//
// 1️⃣ Basic Settings:
//   - SWAGGER_ENABLED (default: true)
//   - SWAGGER_TITLE (default: 'FluxStack API')
//   - SWAGGER_VERSION (default: app version)
//   - SWAGGER_DESCRIPTION (default: 'API documentation...')
//   - SWAGGER_PATH (default: '/swagger')
//
// 2️⃣ Advanced Options:
//   - SWAGGER_EXCLUDE_PATHS (array, default: [])
//   - SWAGGER_SERVERS (format: "url1|desc1,url2|desc2")
//     Example: "https://api.prod.com|Production,https://staging.com|Staging"
//
// 3️⃣ Swagger UI Options:
//   - SWAGGER_PERSIST_AUTH (default: true)
//   - SWAGGER_DISPLAY_DURATION (default: true)
//   - SWAGGER_ENABLE_FILTER (default: true)
//   - SWAGGER_SHOW_EXTENSIONS (default: true)
//   - SWAGGER_TRY_IT_OUT (default: true)
//
// 4️⃣ Authentication (Basic Auth):
//   - SWAGGER_AUTH_ENABLED (default: false)
//   - SWAGGER_AUTH_USERNAME (default: 'admin')
//   - SWAGGER_AUTH_PASSWORD (required if auth enabled)
//
// Example .env configuration:
// ```
// SWAGGER_ENABLED=true
// SWAGGER_TITLE=My API
// SWAGGER_PATH=/api-docs
// SWAGGER_SERVERS=https://api.myapp.com|Production,https://staging.myapp.com|Staging
// SWAGGER_EXCLUDE_PATHS=/internal,/admin
//
// # Protect Swagger with Basic Auth
// SWAGGER_AUTH_ENABLED=true
// SWAGGER_AUTH_USERNAME=admin
// SWAGGER_AUTH_PASSWORD=super-secret-password
// ```
//
// 🔒 When authentication is enabled:
// - Browser will prompt for username/password
// - All Swagger routes are protected (UI + JSON spec)
// - Credentials are validated using Basic Auth
// - Perfect for staging/production environments
//
// ==========================================
// 🏷️  AUTOMATIC TAG DISCOVERY
// ==========================================
//
// ✨ 100% AUTOMATIC - Just add tags to your routes!
//
// Example 1 - Simple route:
// app.get('/products', handler, {
//   detail: {
//     summary: 'Get all products',
//     tags: ['Products', 'Catalog']  // ✅ Auto-discovered!
//   }
// })
//
// Example 2 - Grouped routes:
// export const ordersRoutes = new Elysia({ prefix: '/orders', tags: ['Orders'] })
//   .get('/', handler, {
//     detail: {
//       summary: 'List orders',
//       tags: ['Orders', 'Management']  // ✅ Auto-discovered!
//     }
//   })
//
// Elysia Swagger automatically:
// - Discovers all tags from routes
// - Organizes endpoints by tag
// - Generates OpenAPI spec
// - Creates interactive UI
//
// ==========================================
// 🔐 SECURITY CONFIGURATION
// ==========================================
//
// To enable security in your FluxStack app, configure like this:
//
// plugins: {
//   config: {
//     swagger: {
//       securitySchemes: {
//         bearerAuth: {
//           type: 'http',
//           scheme: 'bearer',
//           bearerFormat: 'JWT'
//         },
//         apiKeyAuth: {
//           type: 'apiKey',
//           in: 'header',
//           name: 'X-API-Key'
//         }
//       },
//       globalSecurity: [
//         { bearerAuth: [] }  // Apply JWT auth globally
//       ]
//     }
//   }
// }
//
// Then in your routes, you can override per endpoint:
// app.get('/public', handler, {
//   detail: { security: [] }  // No auth required
// })
//
// app.get('/private', handler, {
//   detail: {
//     security: [{ apiKeyAuth: [] }]  // API key required
//   }
// })

export default swaggerPlugin
