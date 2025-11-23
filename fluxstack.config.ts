/**
 * FluxStack Configuration
 * ✅ Refactored to use modular config system from /config
 *
 * This file composes configs from /config into the FluxStackConfig format
 * required by core/config/schema.ts for backward compatibility
 */

// Import modular configs
import { appConfig } from './config/app.config'
import { clientConfig } from './config/client.config'
import { databaseConfig } from './config/database.config'
import { loggerConfig } from './config/logger.config'
import { monitoringConfig } from './config/monitoring.config'
import { pluginsConfig } from './config/plugins.config'
import { serverConfig } from './config/server.config'
import { servicesConfig } from './config/services.config'
import type { FluxStackConfig } from './core/config/schema'
import { helpers } from './core/utils/env'

console.log(`🔧 Loading FluxStack config for ${appConfig.env} environment`)

// ============================================================================
// 🚀 MAIN FLUXSTACK CONFIGURATION (Composed from /config)
// ============================================================================

export const config: FluxStackConfig = {
  // Application metadata
  app: {
    name: appConfig.name,
    version: appConfig.version,
    description: appConfig.description,
  },

  // Server configuration
  server: {
    port: serverConfig.server.port,
    host: serverConfig.server.host,
    apiPrefix: serverConfig.server.apiPrefix,
    cors: {
      origins: serverConfig.cors.origins,
      methods: serverConfig.cors.methods,
      headers: serverConfig.cors.headers,
      credentials: serverConfig.cors.credentials,
      maxAge: serverConfig.cors.maxAge,
    },
    middleware: [],
    showBanner: serverConfig.server.showBanner,
  },

  // Client configuration
  client: {
    port: clientConfig.vite.port,
    proxy: {
      target: clientConfig.proxy.target || helpers.getServerUrl(),
      changeOrigin: clientConfig.proxy.changeOrigin,
    },
    build: {
      sourceMaps: clientConfig.build.sourceMaps,
      minify: clientConfig.build.minify,
      target: clientConfig.build.target,
      outDir: clientConfig.build.outDir,
    },
  },

  // Build configuration
  build: {
    target: 'bun',
    mode: appConfig.env as 'development' | 'production' | 'test',
    outDir: 'dist',
    optimization: {
      minify: helpers.isProduction(),
      treeshake: helpers.isProduction(),
      compress: helpers.isProduction(),
      splitChunks: true,
      bundleAnalyzer: helpers.isDevelopment(),
    },
    sourceMaps: !helpers.isProduction(),
    minify: helpers.isProduction(),
    treeshake: helpers.isProduction(),
    clean: true,
  },

  // Plugin configuration
  plugins: {
    enabled: pluginsConfig.enabled,
    disabled: pluginsConfig.disabled,
    config: {
      logger: {
        // Logger plugin config handled by logging section
      },
      swagger: {
        title: pluginsConfig.swaggerTitle,
        version: pluginsConfig.swaggerVersion,
        description: pluginsConfig.swaggerDescription,
      },
      staticFiles: {
        publicDir: pluginsConfig.staticPublicDir,
        uploadsDir: pluginsConfig.staticUploadsDir,
        cacheMaxAge: pluginsConfig.staticCacheMaxAge,
        enableUploads: pluginsConfig.staticEnableUploads,
        enablePublic: pluginsConfig.staticEnablePublic,
      },
      // ✅ crypto-auth manages its own configuration
      // See: plugins/crypto-auth/config/index.ts
    },
  },

  // Logging configuration
  logging: {
    level: loggerConfig.level,
    format: helpers.isDevelopment() ? 'pretty' : 'json',
    transports: [
      {
        type: 'console' as const,
        level: loggerConfig.level,
        format: helpers.isDevelopment() ? 'pretty' : 'json',
      },
    ],
  },

  // Monitoring configuration
  monitoring: {
    enabled: monitoringConfig.monitoring.enabled,
    metrics: {
      enabled: monitoringConfig.metrics.enabled,
      collectInterval: monitoringConfig.metrics.collectInterval,
      httpMetrics: monitoringConfig.metrics.httpMetrics,
      systemMetrics: monitoringConfig.metrics.systemMetrics,
      customMetrics: monitoringConfig.metrics.customMetrics,
    },
    profiling: {
      enabled: monitoringConfig.profiling.enabled,
      sampleRate: monitoringConfig.profiling.sampleRate,
      memoryProfiling: monitoringConfig.profiling.memoryProfiling,
      cpuProfiling: monitoringConfig.profiling.cpuProfiling,
    },
    exporters: monitoringConfig.monitoring.exporters,
  },

  // Optional configurations (only included if configured)
  ...(databaseConfig.url || databaseConfig.host
    ? {
        database: {
          url: databaseConfig.url,
          host: databaseConfig.host,
          port: databaseConfig.port,
          database: databaseConfig.database,
          user: databaseConfig.user,
          password: databaseConfig.password,
          ssl: databaseConfig.ssl,
          poolSize: databaseConfig.poolMax,
        },
      }
    : {}),

  ...(servicesConfig.jwt.secret
    ? {
        auth: {
          secret: servicesConfig.jwt.secret,
          expiresIn: servicesConfig.jwt.expiresIn,
          algorithm: servicesConfig.jwt.algorithm,
          issuer: servicesConfig.jwt.issuer,
        },
      }
    : {}),

  ...(servicesConfig.email.host
    ? {
        email: {
          host: servicesConfig.email.host,
          port: servicesConfig.email.port,
          user: servicesConfig.email.user,
          password: servicesConfig.email.password,
          secure: servicesConfig.email.secure,
          from: servicesConfig.email.from,
        },
      }
    : {}),

  ...(servicesConfig.storage.uploadPath
    ? {
        storage: {
          uploadPath: servicesConfig.storage.uploadPath,
          maxFileSize: servicesConfig.storage.maxFileSize,
          allowedTypes: servicesConfig.storage.allowedTypes,
          provider: servicesConfig.storage.provider,
          config: {},
        },
      }
    : {}),

  // Environment-specific overrides
  environments: {
    development: {
      logging: {
        level: 'debug',
        format: 'pretty',
        transports: [
          {
            type: 'console',
            level: 'debug',
            format: 'pretty',
          },
        ],
      },
      client: {
        port: 5173,
        proxy: { target: 'http://localhost:3000' },
        build: {
          sourceMaps: true,
          minify: false,
          target: 'es2020',
          outDir: 'dist',
        },
      },
      build: {
        target: 'bun',
        outDir: 'dist',
        optimization: {
          minify: false,
          compress: false,
          treeshake: false,
          splitChunks: false,
          bundleAnalyzer: false,
        },
        sourceMaps: true,
        minify: false,
        treeshake: false,
        clean: true,
      },
      monitoring: {
        enabled: false,
        metrics: {
          enabled: false,
          collectInterval: 5000,
          httpMetrics: false,
          systemMetrics: false,
          customMetrics: false,
        },
        profiling: { enabled: false, sampleRate: 0.1, memoryProfiling: false, cpuProfiling: false },
        exporters: [],
      },
    },

    production: {
      logging: {
        level: 'warn',
        format: 'json',
        transports: [
          {
            type: 'console',
            level: 'warn',
            format: 'json',
          },
          {
            type: 'file',
            level: 'error',
            format: 'json',
            options: {
              filename: 'logs/error.log',
              maxSize: '10m',
              maxFiles: 5,
            },
          },
        ],
      },
      client: {
        port: 5173,
        proxy: { target: 'http://localhost:3000' },
        build: {
          sourceMaps: false,
          minify: true,
          target: 'es2020',
          outDir: 'dist',
        },
      },
      build: {
        target: 'bun',
        outDir: 'dist',
        optimization: {
          minify: true,
          treeshake: false,
          compress: false,
          splitChunks: false,
          bundleAnalyzer: false,
        },
        sourceMaps: false,
        minify: true,
        treeshake: false,
        clean: true,
      },
      monitoring: {
        enabled: true,
        metrics: {
          enabled: true,
          collectInterval: 10000,
          httpMetrics: true,
          systemMetrics: true,
          customMetrics: false,
        },
        profiling: {
          enabled: true,
          sampleRate: 0.01, // Lower sample rate in production
          memoryProfiling: true,
          cpuProfiling: false,
        },
        exporters: ['console', 'file'],
      },
    },

    test: {
      logging: {
        level: 'error',
        format: 'json',
        transports: [
          {
            type: 'console',
            level: 'error',
            format: 'json',
          },
        ],
      },
      server: {
        port: 0, // Use random available port
        host: 'localhost',
        apiPrefix: '/api',
        cors: { origins: [], methods: [], headers: [] },
        middleware: [],
      },
      client: {
        port: 0, // Use random available port
        proxy: { target: 'http://localhost:3000' },
        build: { sourceMaps: true, minify: false, target: 'es2020', outDir: 'dist' },
      },
      monitoring: {
        enabled: false,
        metrics: {
          enabled: false,
          collectInterval: 5000,
          httpMetrics: false,
          systemMetrics: false,
          customMetrics: false,
        },
        profiling: { enabled: false, sampleRate: 0.1, memoryProfiling: false, cpuProfiling: false },
        exporters: [],
      },
    },
  },

  // Custom configuration for application-specific settings
  custom: {
    // Add any custom configuration here
    // This will be merged with environment variables prefixed with FLUXSTACK_
  },
}

// Export as default for ES modules
export default config

// Named export for backward compatibility
export { config as fluxStackConfig }

// Export type for TypeScript users
export type { FluxStackConfig } from './core/config/schema'
