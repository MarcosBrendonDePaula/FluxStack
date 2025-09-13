import { swagger } from '@elysiajs/swagger'
import type { Plugin, PluginContext } from '../../types'

export const swaggerPlugin: Plugin = {
  name: 'swagger',
  version: '1.0.0',
  description: 'Enhanced Swagger documentation plugin for FluxStack with customizable options',
  author: 'FluxStack Team',
  priority: 'normal',
  category: 'documentation',
  tags: ['swagger', 'documentation', 'api'],
  dependencies: [], // No dependencies
  
  configSchema: {
    type: 'object',
    properties: {
      enabled: {
        type: 'boolean',
        description: 'Enable Swagger documentation'
      },
      path: {
        type: 'string',
        description: 'Swagger UI path'
      },
      title: {
        type: 'string',
        description: 'API documentation title'
      },
      description: {
        type: 'string',
        description: 'API documentation description'
      },
      version: {
        type: 'string',
        description: 'API version'
      },
      tags: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' }
          },
          required: ['name']
        },
        description: 'API tags for grouping endpoints'
      },
      servers: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            url: { type: 'string' },
            description: { type: 'string' }
          },
          required: ['url']
        },
        description: 'API servers'
      },
      excludePaths: {
        type: 'array',
        items: { type: 'string' },
        description: 'Paths to exclude from documentation'
      },
      security: {
        type: 'object',
        description: 'Security schemes'
      }
    },
    additionalProperties: false
  },
  
  defaultConfig: {
    enabled: true,
    path: '/swagger',
    title: 'FluxStack API',
    description: 'Modern full-stack TypeScript framework with type-safe API endpoints',
    version: '1.0.0',
    tags: [
      { 
        name: 'Health', 
        description: 'Health check endpoints' 
      },
      { 
        name: 'API', 
        description: 'API endpoints' 
      }
    ],
    servers: [],
    excludePaths: [],
    security: {}
  },

  setup: async (context: PluginContext) => {
    const config = getPluginConfig(context)
    
    if (!config.enabled) {
      context.logger.info('Swagger plugin disabled by configuration')
      return
    }

    try {
      // Build servers list
      const servers = config.servers.length > 0 ? config.servers : [
        {
          url: `http://${context.config.server.host}:${context.config.server.port}`,
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
        path: config.path,
        documentation: {
          info: {
            title: config.title || context.config.app?.name || 'FluxStack API',
            version: config.version || context.config.app?.version || '1.0.0',
            description: config.description || context.config.app?.description || 'Modern full-stack TypeScript framework with type-safe API endpoints'
          },
          tags: config.tags,
          servers,
          security: config.security
        },
        exclude: config.excludePaths,
        swaggerOptions: {
          persistAuthorization: true,
          displayRequestDuration: true,
          filter: true,
          showExtensions: true,
          tryItOutEnabled: true
        }
      }

      context.app.use(swagger(swaggerConfig))
      
      context.logger.info(`Swagger documentation enabled at ${config.path}`, {
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
    const config = getPluginConfig(context)
    
    if (config.enabled) {
      const swaggerUrl = `http://${context.config.server.host}:${context.config.server.port}${config.path}`
      context.logger.info(`Swagger documentation available at: ${swaggerUrl}`)
    }
  }
}

// Helper function to get plugin config from context
function getPluginConfig(context: PluginContext) {
  // In a real implementation, this would get the config from the plugin context
  // For now, merge default config with any provided config
  const pluginConfig = context.config.plugins.config?.swagger || {}
  return { ...swaggerPlugin.defaultConfig, ...pluginConfig }
}

export default swaggerPlugin