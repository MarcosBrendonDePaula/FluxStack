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
  tags: [
    { name: 'Health', description: 'Health check endpoints' },
    { name: 'API', description: 'API endpoints' }
  ],
  servers: [] as Array<{ url: string; description: string }>,
  excludePaths: [] as string[],
  securitySchemes: {},
  globalSecurity: [] as Array<Record<string, any>>
}

export const swaggerPlugin: Plugin = {
  name: 'swagger',
  version: '1.0.0',
  description: 'Enhanced Swagger documentation plugin for FluxStack with customizable options',
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

      const swaggerConfig = {
        path: DEFAULTS.path,
        documentation: {
          info: {
            title: DEFAULTS.title || appConfig.name || 'FluxStack API',
            version: DEFAULTS.version || appConfig.version,
            description: DEFAULTS.description || appConfig.description || 'Modern full-stack TypeScript framework with type-safe API endpoints'
          },
          tags: DEFAULTS.tags,
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
      context.logger.debug(`Swagger documentation available at: ${swaggerUrl}`)
    }
  }
}

// Example usage for security configuration:
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