import { swagger } from '@elysiajs/swagger'
import type { Plugin } from '../../../plugins/types'

export const swaggerPlugin: Plugin = {
  name: 'swagger',
  version: '1.0.0',
  description: 'Swagger documentation plugin for FluxStack',
  setup: async (context) => {
    context.app.use(swagger({
      path: '/swagger',
      documentation: {
        info: {
          title: context.config.app?.name || 'FluxStack API',
          version: context.config.app?.version || '1.0.0',
          description: context.config.app?.description || 'Modern full-stack TypeScript framework with type-safe API endpoints'
        },
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
        servers: [
          {
            url: `http://localhost:${context.config.server.port}`,
            description: 'Development server'
          }
        ]
      }
    }))
  }
}