import { swagger } from '@elysiajs/swagger'
import type { FluxStack, PluginContext } from '@/core/plugins/types'
import { appConfig } from '@/config/app.config'
import { serverConfig } from '@/config/server.config'
import { pluginsConfig } from '@/config/plugins.config'

type Plugin = FluxStack.Plugin

// Default configuration values (can be overridden via env vars in pluginsConfig)
const DEFAULTS = {
  enabled: true,
  path: pluginsConfig.swaggerPath,
  title: pluginsConfig.swaggerTitle,
  description: pluginsConfig.swaggerDescription,
  version: pluginsConfig.swaggerVersion,
  servers: [] as Array<{ url: string; description: string }>,
  excludePaths: [] as string[],
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

      // Simple Swagger configuration - Elysia handles everything else automatically
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
        swaggerOptions: {
          persistAuthorization: true,
          displayRequestDuration: true,
          filter: true,
          showExtensions: true,
          tryItOutEnabled: true
        }
      }

      // That's it! Elysia Swagger auto-discovers everything else
      context.app.use(swagger(swaggerConfig))

      context.logger.debug(`Swagger documentation enabled at ${DEFAULTS.path}`, {
        title: swaggerConfig.documentation.info.title,
        version: swaggerConfig.documentation.info.version,
        servers: servers.length
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
// 🏷️  AUTOMATIC TAG DISCOVERY
// ==========================================
//
// ✨ 100% AUTOMATIC - Elysia Swagger handles everything!
//
// Just add tags to your routes and they appear in Swagger automatically:
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
// That's it! No configuration needed.
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
