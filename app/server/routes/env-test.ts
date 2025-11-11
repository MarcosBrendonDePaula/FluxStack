/**
 * 🔧 Environment Test Route
 * Displays current configuration for debugging purposes
 */

import { Elysia } from 'elysia'
import { appConfig } from '@/config/app.config'
import { serverConfig } from '@/config/server.config'
import { loggerConfig } from '@/config/logger.config'
import { appRuntimeConfig } from '@/config/runtime.config'
import { helpers } from '@/core/utils/env'

/**
 * Environment test endpoint
 * Shows declarative config system information
 */
export const envTestRoute = new Elysia({ prefix: '/api' })
  .get('/env-test', () => {
    return {
      message: '⚡ Declarative Config System!',
      timestamp: new Date().toISOString(),
      serverConfig: {
        port: serverConfig.server.port,
        host: serverConfig.server.host,
        apiPrefix: serverConfig.server.apiPrefix,
        appName: appConfig.name,
        appVersion: appConfig.version,
        cors: {
          origins: serverConfig.cors.origins,
          methods: serverConfig.cors.methods,
          credentials: serverConfig.cors.credentials
        },
        client: {
          port: serverConfig.server.backendPort,
          target: 'es2020',
          sourceMaps: false
        },
        features: {
          enableSwagger: appRuntimeConfig.values.enableSwagger,
          enableMetrics: appRuntimeConfig.values.enableMetrics,
          enableMonitoring: appRuntimeConfig.values.enableMonitoring
        }
      },
      environment: {
        NODE_ENV: appConfig.env,
        DEBUG: appRuntimeConfig.values.enableDebugMode,
        LOG_LEVEL: loggerConfig.level
      },
      urls: {
        server: helpers.getServerUrl(),
        client: helpers.getClientUrl(),
        swagger: `${helpers.getServerUrl()}/swagger`
      },
      system: {
        version: 'declarative-config',
        features: ['type-safe', 'validated', 'declarative', 'runtime-reload']
      }
    }
  })
