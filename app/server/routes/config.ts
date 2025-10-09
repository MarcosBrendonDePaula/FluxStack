/**
 * Config Management Routes
 * Allows runtime configuration reload and inspection
 */

import { Elysia, t } from 'elysia'
import { appRuntimeConfig } from '@/config/runtime.config'

export const configRoutes = new Elysia({ prefix: '/config' })
  /**
   * Get current runtime configuration
   */
  .get('/', () => {
    return {
      success: true,
      config: appRuntimeConfig.values,
      timestamp: new Date().toISOString()
    }
  }, {
    detail: {
      summary: 'Get current runtime configuration',
      tags: ['Config']
    }
  })

  /**
   * Reload configuration from environment
   */
  .post('/reload', () => {
    try {
      const oldConfig = { ...appRuntimeConfig.values }
      const newConfig = appRuntimeConfig.reload()

      // Find changed fields
      const changes: Record<string, { old: any, new: any }> = {}
      for (const key in newConfig) {
        if (oldConfig[key] !== newConfig[key]) {
          changes[key] = {
            old: oldConfig[key],
            new: newConfig[key]
          }
        }
      }

      return {
        success: true,
        message: 'Configuration reloaded successfully',
        changes,
        timestamp: new Date().toISOString()
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }
    }
  }, {
    detail: {
      summary: 'Reload configuration from environment variables',
      description: 'Reloads configuration without restarting the server. Validates new values before applying.',
      tags: ['Config']
    }
  })

  /**
   * Get specific config field
   */
  .get('/:field', ({ params: { field } }) => {
    const value = appRuntimeConfig.get(field as any)

    if (value === undefined) {
      return {
        success: false,
        error: `Field '${field}' not found`,
        timestamp: new Date().toISOString()
      }
    }

    return {
      success: true,
      field,
      value,
      type: typeof value,
      timestamp: new Date().toISOString()
    }
  }, {
    detail: {
      summary: 'Get specific configuration field',
      tags: ['Config']
    },
    params: t.Object({
      field: t.String()
    })
  })

  /**
   * Check if config field exists
   */
  .get('/:field/exists', ({ params: { field } }) => {
    const exists = appRuntimeConfig.has(field as any)

    return {
      success: true,
      field,
      exists,
      timestamp: new Date().toISOString()
    }
  }, {
    detail: {
      summary: 'Check if configuration field exists',
      tags: ['Config']
    },
    params: t.Object({
      field: t.String()
    })
  })

  /**
   * Health check for config system
   */
  .get('/health', () => {
    try {
      const config = appRuntimeConfig.values

      return {
        success: true,
        status: 'healthy',
        fieldsLoaded: Object.keys(config).length,
        timestamp: new Date().toISOString()
      }
    } catch (error: any) {
      return {
        success: false,
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      }
    }
  }, {
    detail: {
      summary: 'Config system health check',
      tags: ['Config']
    }
  })
