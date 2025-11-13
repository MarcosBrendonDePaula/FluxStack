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

// Pre-defined tags with descriptions for common FluxStack routes
// These tags provide documentation in Swagger UI
// The Swagger plugin will also auto-discover additional tags from routes
const SYSTEM_TAGS = [
  { name: 'Health', description: 'Health check and system status endpoints' },
  { name: 'API', description: 'General API endpoints' },
  { name: 'Users', description: 'User management endpoints' },
  { name: 'CRUD', description: 'Create, Read, Update, Delete operations' },
  { name: 'Authentication', description: 'Authentication and authorization endpoints' },
  { name: 'Security', description: 'Security-related endpoints' },
  { name: 'Crypto', description: 'Cryptographic operations endpoints' },
  { name: 'Development', description: 'Development and debugging endpoints' },
  { name: 'Configuration', description: 'Configuration and settings endpoints' },
  { name: 'Debug', description: 'Debug and diagnostic endpoints' },
  { name: 'Static Files', description: 'Static file serving endpoints' },
  { name: 'Live Components', description: 'Real-time live components endpoints' },
  { name: 'WebSocket', description: 'WebSocket connection endpoints' },
  { name: 'Monitoring', description: 'Monitoring and metrics endpoints' },
  { name: 'Performance', description: 'Performance tracking endpoints' },
  { name: 'Connections', description: 'Connection management endpoints' },
  { name: 'Pools', description: 'Connection pool endpoints' },
  { name: 'Alerts', description: 'Alert management endpoints' }
]

// Default configuration values (can be overridden via env vars in pluginsConfig)
const DEFAULTS = {
  enabled: true,
  path: pluginsConfig.swaggerPath,
  title: pluginsConfig.swaggerTitle,
  description: pluginsConfig.swaggerDescription,
  version: pluginsConfig.swaggerVersion,
  tags: SYSTEM_TAGS, // System tags with descriptions
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
          // System tags with descriptions for FluxStack routes
          // Swagger will also auto-discover additional tags from routes
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

      // Log system tags
      context.logger.debug(`📋 Swagger tags configured (${SYSTEM_TAGS.length} tags):`, {
        tags: SYSTEM_TAGS.map(t => t.name).join(', ')
      })

      // Try auto-discovery for debugging (to see if we can detect additional tags)
      const discoveredTags = autoDiscoverTags(context.app)
      if (discoveredTags.length > SYSTEM_TAGS.length) {
        const newTags = discoveredTags.filter(dt => !SYSTEM_TAGS.find(st => st.name === dt.name))
        if (newTags.length > 0) {
          context.logger.debug(`📋 Additional tags detected from routes:`, {
            tags: newTags.map(t => t.name).join(', ')
          })
        }
      }
    }
  }
}

// ==========================================
// 🏷️  AUTO-DISCOVERY OF TAGS
// ==========================================
//
// The Swagger plugin automatically discovers tags from your routes!
// Just define tags in your route definitions:
//
// Example:
// export const usersRoutes = new Elysia({ prefix: '/users', tags: ['Users'] })
//   .get('/', handler, {
//     detail: {
//       tags: ['Users', 'CRUD']  // These tags are auto-discovered!
//     }
//   })
//
// The plugin will:
// 1. Scan all registered routes
// 2. Extract unique tags
// 3. Generate descriptions automatically
// 4. Sort tags alphabetically
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