import { swagger } from '@elysiajs/swagger'
import type { FluxStack, PluginContext } from '@/core/plugins/types'
import { appConfig } from '@/config/app.config'
import { serverConfig } from '@/config/server.config'
import { pluginsConfig } from '@/config/plugins.config'

type Plugin = FluxStack.Plugin

/**
 * Generates an automatic description for a tag based on its name
 * @param tagName - The tag name
 * @returns Auto-generated description
 */
function generateTagDescription(tagName: string): string {
  // Convert PascalCase/camelCase to words
  const words = tagName
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .toLowerCase()

  return `${words.charAt(0).toUpperCase() + words.slice(1)} endpoints`
}

/**
 * Auto-discovers tags from registered routes in the Elysia app
 * @param app - The Elysia application instance
 * @param customDescriptions - Optional custom tag descriptions from config
 * @returns Array of unique tags with descriptions
 */
function autoDiscoverTags(
  app: any,
  customDescriptions: Record<string, string> = {}
): Array<{ name: string; description: string }> {
  const tagMap = new Map<string, string>()

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
              // Use custom description if provided, otherwise auto-generate
              const description = customDescriptions[tag] || generateTagDescription(tag)
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
            const description = customDescriptions[tag] || generateTagDescription(tag)
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

      // Auto-discover tags from registered routes with custom descriptions (if any)
      const discoveredTags = autoDiscoverTags(context.app, DEFAULTS.customTagDescriptions)
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
// ✨ 100% AUTOMATIC - Zero hardcoded configuration!
//
// The Swagger plugin automatically discovers tags from your routes and
// generates descriptions intelligently based on tag names.
//
// Example 1 - Simple route with tags:
// app.get('/products', handler, {
//   detail: {
//     tags: ['Products', 'Catalog']
//   }
// })
// Result: ✅ "Products endpoints", "Catalog endpoints"
//
// Example 2 - PascalCase tags (auto-formatted):
// app.get('/users', handler, {
//   detail: {
//     tags: ['UserManagement', 'CRUD']
//   }
// })
// Result: ✅ "User management endpoints", "C r u d endpoints"
//
// Example 3 - Grouped routes:
// export const ordersRoutes = new Elysia({ prefix: '/orders', tags: ['Orders'] })
//   .get('/', handler, { detail: { tags: ['Orders', 'Processing'] } })
// Result: ✅ "Orders endpoints", "Processing endpoints"
//
// 📝 Custom Tag Descriptions (optional):
// If you want specific descriptions instead of auto-generated ones,
// add them to your config (NOT in the core!):
//
// // config/plugins.config.ts (user editable file)
// export const pluginsConfig = {
//   // ... other configs
//   swagger: {
//     customTagDescriptions: {
//       'Products': 'Product catalog and inventory management',
//       'Orders': 'Order processing and fulfillment'
//     }
//   }
// }
//
// 🚀 How it works:
// 1. Developer creates routes with tags (e.g., tags: ['MyFeature'])
// 2. Swagger automatically discovers all tags from routes
// 3. Descriptions auto-generated: 'MyFeature' → 'My feature endpoints'
// 4. Custom descriptions override auto-generated ones (if configured)
// 5. Tags appear in Swagger UI instantly with descriptions
//
// ✅ No need to edit core files - everything is automatic!
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