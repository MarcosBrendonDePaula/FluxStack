/**
 * FluxStack Configuration
 * ✅ Using declarative config system with schema validation and type inference
 * Laravel-inspired declarative configuration with full type safety
 */

import type { FluxStackConfig } from './core/config/schema'
import { defineConfig, config as configHelpers } from './core/utils/config-schema'
import { env, helpers } from './core/utils/env'

console.log(`🔧 Loading FluxStack config for ${env.NODE_ENV} environment`)

// ============================================================================
// 📋 DECLARATIVE CONFIG SCHEMAS
// ============================================================================

/**
 * Application Configuration Schema
 */
const appConfigSchema = {
  name: configHelpers.string('FLUXSTACK_APP_NAME', 'FluxStack', true),
  version: configHelpers.string('FLUXSTACK_APP_VERSION', '1.7.4', true),
  description: configHelpers.string('FLUXSTACK_APP_DESCRIPTION', 'A FluxStack application')
} as const

/**
 * CORS Configuration Schema
 */
const corsConfigSchema = {
  origins: configHelpers.array('CORS_ORIGINS', ['http://localhost:3000', 'http://localhost:5173']),
  methods: configHelpers.array('CORS_METHODS', ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']),
  headers: configHelpers.array('CORS_HEADERS', ['Content-Type', 'Authorization']),
  credentials: configHelpers.boolean('CORS_CREDENTIALS', false),
  maxAge: configHelpers.number('CORS_MAX_AGE', 86400)
} as const

/**
 * Server Configuration Schema
 */
const serverConfigSchema = {
  port: configHelpers.number('PORT', 3000, true),
  host: configHelpers.string('HOST', 'localhost', true),
  apiPrefix: configHelpers.string('API_PREFIX', '/api', true)
} as const

/**
 * Client Proxy Configuration Schema
 */
const clientProxyConfigSchema = {
  target: {
    type: 'string' as const,
    env: 'PROXY_TARGET',
    default: helpers.getServerUrl(),
    required: false
  },
  changeOrigin: configHelpers.boolean('PROXY_CHANGE_ORIGIN', true)
} as const

/**
 * Client Build Configuration Schema
 */
const clientBuildConfigSchema = {
  sourceMaps: configHelpers.boolean('CLIENT_SOURCEMAPS', helpers.isDevelopment()),
  minify: configHelpers.boolean('CLIENT_MINIFY', helpers.isProduction()),
  target: configHelpers.string('CLIENT_TARGET', 'esnext'),
  outDir: configHelpers.string('CLIENT_OUTDIR', 'dist/client')
} as const

/**
 * Client Configuration Schema
 */
const clientConfigSchema = {
  port: configHelpers.number('VITE_PORT', 5173, true)
} as const

/**
 * Build Optimization Configuration Schema
 */
const buildOptimizationConfigSchema = {
  minify: configHelpers.boolean('BUILD_MINIFY', helpers.isProduction()),
  treeshake: configHelpers.boolean('BUILD_TREESHAKE', helpers.isProduction()),
  compress: configHelpers.boolean('BUILD_COMPRESS', helpers.isProduction()),
  splitChunks: configHelpers.boolean('BUILD_SPLIT_CHUNKS', true),
  bundleAnalyzer: configHelpers.boolean('BUILD_ANALYZER', helpers.isDevelopment())
} as const

/**
 * Build Configuration Schema
 */
const buildConfigSchema = {
  target: configHelpers.enum('BUILD_TARGET', ['bun', 'node', 'docker'] as const, 'bun'),
  outDir: configHelpers.string('BUILD_OUTDIR', 'dist'),
  sourceMaps: configHelpers.boolean('BUILD_SOURCEMAPS', !helpers.isProduction()),
  minify: configHelpers.boolean('BUILD_MINIFY', helpers.isProduction()),
  treeshake: configHelpers.boolean('BUILD_TREESHAKE', helpers.isProduction()),
  clean: configHelpers.boolean('BUILD_CLEAN', true)
} as const

/**
 * Plugins Configuration Schema
 */
const pluginsConfigSchema = {
  enabled: configHelpers.array('FLUXSTACK_PLUGINS_ENABLED', ['logger', 'swagger', 'vite', 'cors', 'static-files', 'crypto-auth']),
  disabled: configHelpers.array('FLUXSTACK_PLUGINS_DISABLED', [])
} as const

/**
 * Logging Configuration Schema
 */
const loggingConfigSchema = {
  level: configHelpers.enum('LOG_LEVEL', ['debug', 'info', 'warn', 'error'] as const, helpers.isDevelopment() ? 'debug' : 'info'),
  format: configHelpers.enum('LOG_FORMAT', ['json', 'pretty'] as const, helpers.isDevelopment() ? 'pretty' : 'json')
} as const

/**
 * Monitoring Metrics Configuration Schema
 */
const monitoringMetricsConfigSchema = {
  enabled: configHelpers.boolean('ENABLE_METRICS', false),
  collectInterval: configHelpers.number('METRICS_INTERVAL', 5000),
  httpMetrics: configHelpers.boolean('HTTP_METRICS', true),
  systemMetrics: configHelpers.boolean('SYSTEM_METRICS', true),
  customMetrics: configHelpers.boolean('CUSTOM_METRICS', false)
} as const

/**
 * Monitoring Profiling Configuration Schema
 */
const monitoringProfilingConfigSchema = {
  enabled: configHelpers.boolean('PROFILING_ENABLED', false),
  sampleRate: configHelpers.number('PROFILING_SAMPLE_RATE', 0.1),
  memoryProfiling: configHelpers.boolean('MEMORY_PROFILING', false),
  cpuProfiling: configHelpers.boolean('CPU_PROFILING', false)
} as const

/**
 * Monitoring Configuration Schema
 */
const monitoringConfigSchema = {
  enabled: configHelpers.boolean('ENABLE_MONITORING', false),
  exporters: configHelpers.array('MONITORING_EXPORTERS', [])
} as const

/**
 * Database Configuration Schema (Optional)
 */
const databaseConfigSchema = {
  url: configHelpers.string('DATABASE_URL', ''),
  host: configHelpers.string('DB_HOST', ''),
  port: configHelpers.number('DB_PORT', 5432),
  database: configHelpers.string('DB_NAME', ''),
  user: configHelpers.string('DB_USER', ''),
  password: configHelpers.string('DB_PASSWORD', ''),
  ssl: configHelpers.boolean('DB_SSL', false),
  poolSize: configHelpers.number('DB_POOL_SIZE', 10)
} as const

/**
 * Auth Configuration Schema (Optional)
 */
const authConfigSchema = {
  secret: configHelpers.string('JWT_SECRET', ''),
  expiresIn: configHelpers.string('JWT_EXPIRES_IN', '24h'),
  algorithm: configHelpers.string('JWT_ALGORITHM', 'HS256'),
  issuer: configHelpers.string('JWT_ISSUER', '')
} as const

/**
 * Email Configuration Schema (Optional)
 */
const emailConfigSchema = {
  host: configHelpers.string('SMTP_HOST', ''),
  port: configHelpers.number('SMTP_PORT', 587),
  user: configHelpers.string('SMTP_USER', ''),
  password: configHelpers.string('SMTP_PASSWORD', ''),
  secure: configHelpers.boolean('SMTP_SECURE', false),
  from: configHelpers.string('SMTP_FROM', '')
} as const

/**
 * Storage Configuration Schema (Optional)
 */
const storageConfigSchema = {
  uploadPath: configHelpers.string('UPLOAD_PATH', ''),
  maxFileSize: configHelpers.number('MAX_FILE_SIZE', 10485760), // 10MB
  allowedTypes: configHelpers.array('ALLOWED_FILE_TYPES', []),
  provider: configHelpers.enum('STORAGE_PROVIDER', ['local', 's3', 'gcs'] as const, 'local')
} as const

// ============================================================================
// ⚡ LOAD CONFIGURATIONS USING DECLARATIVE SYSTEM
// ============================================================================

const appConfig = defineConfig(appConfigSchema)
const corsConfig = defineConfig(corsConfigSchema)
const serverConfig = defineConfig(serverConfigSchema)
const clientProxyConfig = defineConfig(clientProxyConfigSchema)
const clientBuildConfig = defineConfig(clientBuildConfigSchema)
const clientConfig = defineConfig(clientConfigSchema)
const buildOptimizationConfig = defineConfig(buildOptimizationConfigSchema)
const buildConfig = defineConfig(buildConfigSchema)
const pluginsConfig = defineConfig(pluginsConfigSchema)
const loggingConfig = defineConfig(loggingConfigSchema)
const monitoringMetricsConfig = defineConfig(monitoringMetricsConfigSchema)
const monitoringProfilingConfig = defineConfig(monitoringProfilingConfigSchema)
const monitoringConfig = defineConfig(monitoringConfigSchema)

// Optional configs (only load if env vars are present)
const databaseConfig = (env.has('DATABASE_URL') || env.has('DATABASE_HOST'))
  ? defineConfig(databaseConfigSchema)
  : undefined

const authConfig = env.has('JWT_SECRET')
  ? defineConfig(authConfigSchema)
  : undefined

const emailConfig = env.has('SMTP_HOST')
  ? defineConfig(emailConfigSchema)
  : undefined

const storageConfig = (env.has('UPLOAD_PATH') || env.has('STORAGE_PROVIDER'))
  ? defineConfig(storageConfigSchema)
  : undefined

// ============================================================================
// 🚀 MAIN FLUXSTACK CONFIGURATION
// ============================================================================

export const config: FluxStackConfig = {
  // Application metadata
  app: appConfig,

  // Server configuration
  server: {
    ...serverConfig,
    cors: corsConfig,
    middleware: []
  },

  // Client configuration
  client: {
    ...clientConfig,
    proxy: clientProxyConfig,
    build: clientBuildConfig
  },

  // Build configuration
  build: {
    ...buildConfig,
    optimization: buildOptimizationConfig
  },

  // Plugin configuration
  plugins: {
    ...pluginsConfig,
    config: {
      logger: {
        // Logger plugin config handled by logging section
      },
      swagger: {
        title: env.get('SWAGGER_TITLE', 'FluxStack API'),
        version: env.get('SWAGGER_VERSION', '1.7.4'),
        description: env.get('SWAGGER_DESCRIPTION', 'API documentation for FluxStack application')
      },
      staticFiles: {
        publicDir: env.get('STATIC_PUBLIC_DIR', 'public'),
        uploadsDir: env.get('STATIC_UPLOADS_DIR', 'uploads'),
        cacheMaxAge: env.get('STATIC_CACHE_MAX_AGE', 31536000), // 1 year
        enableUploads: env.get('STATIC_ENABLE_UPLOADS', true),
        enablePublic: env.get('STATIC_ENABLE_PUBLIC', true)
      }
      // ✅ crypto-auth manages its own configuration
      // See: plugins/crypto-auth/config/index.ts
    }
  },

  // Logging configuration
  logging: {
    ...loggingConfig,
    transports: [
      {
        type: 'console' as const,
        level: loggingConfig.level,
        format: loggingConfig.format
      }
    ]
  },

  // Monitoring configuration
  monitoring: {
    ...monitoringConfig,
    metrics: monitoringMetricsConfig,
    profiling: monitoringProfilingConfig
  },

  // Optional configurations (only included if env vars are set)
  ...(databaseConfig ? { database: databaseConfig } : {}),
  ...(authConfig ? { auth: authConfig } : {}),
  ...(emailConfig ? { email: emailConfig } : {}),
  ...(storageConfig ? {
    storage: {
      ...storageConfig,
      config: env.get('STORAGE_CONFIG', {})
    }
  } : {}),

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
            format: 'pretty'
          }
        ]
      },
      client: {
        port: 5173,
        proxy: { target: 'http://localhost:3000' },
        build: {
          sourceMaps: true,
          minify: false,
          target: 'es2020',
          outDir: 'dist'
        }
      },
      build: {
        target: 'bun',
        outDir: 'dist',
        optimization: {
          minify: false,
          compress: false,
          treeshake: false,
          splitChunks: false,
          bundleAnalyzer: false
        },
        sourceMaps: true,
        minify: false,
        treeshake: false,
        clean: true
      },
      monitoring: {
        enabled: false,
        metrics: { enabled: false, collectInterval: 5000, httpMetrics: false, systemMetrics: false, customMetrics: false },
        profiling: { enabled: false, sampleRate: 0.1, memoryProfiling: false, cpuProfiling: false },
        exporters: []
      }
    },

    production: {
      logging: {
        level: 'warn',
        format: 'json',
        transports: [
          {
            type: 'console',
            level: 'warn',
            format: 'json'
          },
          {
            type: 'file',
            level: 'error',
            format: 'json',
            options: {
              filename: 'logs/error.log',
              maxSize: '10m',
              maxFiles: 5
            }
          }
        ]
      },
      client: {
        port: 5173,
        proxy: { target: 'http://localhost:3000' },
        build: {
          sourceMaps: false,
          minify: true,
          target: 'es2020',
          outDir: 'dist'
        }
      },
      build: {
        target: 'bun',
        outDir: 'dist',
        optimization: {
          minify: true,
          treeshake: false,
          compress: false,
          splitChunks: false,
          bundleAnalyzer: false
        },
        sourceMaps: false,
        minify: true,
        treeshake: false,
        clean: true
      },
      monitoring: {
        enabled: true,
        metrics: {
          enabled: true,
          collectInterval: 10000,
          httpMetrics: true,
          systemMetrics: true,
          customMetrics: false
        },
        profiling: {
          enabled: true,
          sampleRate: 0.01, // Lower sample rate in production
          memoryProfiling: true,
          cpuProfiling: false
        },
        exporters: ['console', 'file']
      }
    },

    test: {
      logging: {
        level: 'error',
        format: 'json',
        transports: [
          {
            type: 'console',
            level: 'error',
            format: 'json'
          }
        ]
      },
      server: {
        port: 0, // Use random available port
        host: 'localhost',
        apiPrefix: '/api',
        cors: { origins: [], methods: [], headers: [] },
        middleware: []
      },
      client: {
        port: 0, // Use random available port
        proxy: { target: 'http://localhost:3000' },
        build: { sourceMaps: true, minify: false, target: 'es2020', outDir: 'dist' }
      },
      monitoring: {
        enabled: false,
        metrics: { enabled: false, collectInterval: 5000, httpMetrics: false, systemMetrics: false, customMetrics: false },
        profiling: { enabled: false, sampleRate: 0.1, memoryProfiling: false, cpuProfiling: false },
        exporters: []
      }
    }
  },

  // Custom configuration for application-specific settings
  custom: {
    // Add any custom configuration here
    // This will be merged with environment variables prefixed with FLUXSTACK_
  }
}

// Export as default for ES modules
export default config

// Named export for backward compatibility
export { config as fluxStackConfig }

// Export type for TypeScript users
export type { FluxStackConfig } from './core/config/schema'