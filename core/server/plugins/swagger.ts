import { swagger } from '@elysiajs/swagger'
import type { Plugin, FluxStackContext } from '../../types'

export const swaggerPlugin: Plugin = {
  name: 'swagger',
  setup(context: FluxStackContext, app: any) {
    app.use(swagger({
      path: '/swagger',
      documentation: {
        info: {
          title: 'FluxStack API',
          version: '1.0.0',
          description: 'Modern full-stack TypeScript framework with type-safe API endpoints'
        },
        tags: [
          { 
            name: 'Health', 
            description: 'Health check endpoints' 
          },
          { 
            name: 'Users', 
            description: 'User management endpoints' 
          }
        ],
        servers: [
          {
            url: `http://localhost:${context.config.port}`,
            description: 'Development server'
          }
        ]
      }
    }))
  }
}