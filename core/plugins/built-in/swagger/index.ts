import { swagger } from '@elysiajs/swagger'
import type { FluxStack, PluginContext } from '@/core/plugins/types'
import { appConfig } from '@/config/app.config'
import { serverConfig } from '@/config/server.config'
import { pluginsConfig } from '@/config/plugins.config'

type Plugin = FluxStack.Plugin

/**
 * Auto-discovers tags from registered routes in the Elysia app
 * @param app - The Elysia application instance
 * @returns Array of unique tags with auto-generated descriptions
 */
function autoDiscoverTags(app: any): Array<{ name: string; description: string }> {
  const tagMap = new Map<string, string>()

  // Default tag descriptions (used as fallback)
  const defaultDescriptions: Record<string, string> = {
    'Health': 'Health check and system status endpoints',
    'API': 'General API endpoints',
    'Users': 'User management endpoints',
    'Authentication': 'Authentication and authorization endpoints',
    'Development': 'Development and debugging endpoints',
    'Configuration': 'Configuration and settings endpoints',
    'CRUD': 'Create, Read, Update, Delete operations',
    'Static Files': 'Static file serving endpoints',
    'Live Components': 'Real-time live components endpoints',
    'WebSocket': 'WebSocket connection endpoints',
    'Monitoring': 'Monitoring and metrics endpoints',
    'Performance': 'Performance tracking endpoints',
    'Security': 'Security-related endpoints',
    'Crypto': 'Cryptographic operations endpoints',
    'Debug': 'Debug and diagnostic endpoints',
    'Connections': 'Connection management endpoints',
    'Pools': 'Connection pool endpoints',
    'Alerts': 'Alert management endpoints'
  }

  try {
    // Try multiple ways to access routes from Elysia app
    const routesArray = app.routes || app._routes || (app as any).router?.history || []

    if (Array.isArray(routesArray) && routesArray.length > 0) {
      for (const route of routesArray) {
        // Extract tags from multiple possible locations
        const tags =
          route?.schema?.detail?.tags ||
          route?.hooks?.detail?.tags ||
          route?.detail?.tags ||
          route?.tags ||
          []

        if (Array.isArray(tags)) {
          for (const tag of tags) {
            if (typeof tag === 'string' && !tagMap.has(tag)) {
              const description = defaultDescriptions[tag] || `${tag} related endpoints`
              tagMap.set(tag, description)
            }
          }
        }
      }
    }

    // Also check for tags in decorators (for grouped routes)
    if (app.decorator && typeof app.decorator === 'object') {
      const decoratorTags = (app.decorator as any).tags || []
      if (Array.isArray(decoratorTags)) {
        for (const tag of decoratorTags) {
          if (typeof tag === 'string' && !tagMap.has(tag)) {
            const description = defaultDescriptions[tag] || `${tag} related endpoints`
            tagMap.set(tag, description)
          }
        }
      }
    }
  } catch (error) {
    console.warn('Failed to auto-discover tags from routes:', error)
  }

  // Convert map to array and sort alphabetically
  const discoveredTags = Array.from(tagMap.entries())
    .map(([name, description]) => ({ name, description }))
    .sort((a, b) => a.name.localeCompare(b.name))

  // If no tags were discovered, return empty array (Swagger will auto-discover from routes)
  // This is intentional - Elysia Swagger already auto-discovers tags from routes
  // We're just providing descriptions here
  return discoveredTags
}

// Default configuration values (can be overridden via env vars in pluginsConfig)
const DEFAULTS = {
  enabled: true,
  path: pluginsConfig.swaggerPath,
  title: pluginsConfig.swaggerTitle,
  description: pluginsConfig.swaggerDescription,
  version: pluginsConfig.swaggerVersion,
  // Tags will be discovered automatically from routes at runtime
  // Users can optionally add custom tag descriptions via config
  customTagDescriptions: {} as Record<string, string>,
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
          // Tags are auto-discovered by Elysia Swagger from route definitions
          // No need to pre-define - they come from route.detail.tags automatically
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

      // Auto-discover tags from registered routes
      const discoveredTags = autoDiscoverTags(context.app)
      if (discoveredTags.length > 0) {
        context.logger.debug(`📋 Swagger tags auto-discovered from routes (${discoveredTags.length} tags):`, {
          tags: discoveredTags.map(t => t.name).join(', ')
        })
      } else {
        context.logger.debug('📋 No tags discovered yet - tags will be shown as routes are added')
      }
    }
  }
}

// ==========================================
// 🏷️  AUTO-DISCOVERY OF TAGS
// ==========================================
//
// ✨ FULLY AUTOMATIC - No manual configuration needed!
//
// The Swagger plugin automatically discovers tags from your routes.
// Just add tags to your route definitions and they appear in Swagger:
//
// Example 1 - Simple route with tags:
// app.get('/products', handler, {
//   detail: {
//     tags: ['Products', 'Catalog']  // ✅ Automatically discovered!
//   }
// })
//
// Example 2 - Grouped routes:
// export const usersRoutes = new Elysia({ prefix: '/users', tags: ['Users'] })
//   .get('/', handler, {
//     detail: {
//       tags: ['Users', 'CRUD']  // ✅ Both tags auto-discovered!
//     }
//   })
//
// 📝 Custom Tag Descriptions (optional):
// If you want custom descriptions instead of auto-generated ones,
// add them to your app config (not in the core!):
//
// // config/plugins.config.ts (user file)
// export const pluginsConfig = {
//   swagger: {
//     customTagDescriptions: {
//       'Products': 'Product catalog and inventory management',
//       'Orders': 'Order processing and fulfillment'
//     }
//   }
// }
//
// How it works:
// 1. Developer creates routes with tags
// 2. Swagger automatically detects all tags
// 3. Tags appear in Swagger UI instantly
// 4. Auto-generated descriptions (or custom if configured)
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