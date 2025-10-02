/**
 * FluxStack Configuration
 * Enhanced configuration with comprehensive settings and environment support
 * Updated to use dynamic environment variables
 */

import type { FluxStackConfig } from './core/config/schema'
import { env, helpers } from './core/utils/env-runtime-v2'

console.log(`🔧 Loading FluxStack config for ${env.NODE_ENV} environment`)

// Main FluxStack configuration with dynamic env vars
export const config: FluxStackConfig = {
  // Application metadata
  app: {
    name: env.FLUXSTACK_APP_NAME,        // Direto! (string)
    version: env.FLUXSTACK_APP_VERSION,  // Direto! (string)
    description: env.get('FLUXSTACK_APP_DESCRIPTION', 'A FluxStack application')
  },

  // Server configuration
  server: {
    port: env.PORT,                      // Direto! (number)
    host: env.HOST,                      // Direto! (string)
    apiPrefix: env.API_PREFIX,           // Direto! (string)
    cors: {
      origins: env.CORS_ORIGINS,           // Direto! (string[])
      methods: env.get('CORS_METHODS', ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']),
      headers: env.get('CORS_HEADERS', ['Content-Type', 'Authorization']),
      credentials: env.get('CORS_CREDENTIALS', false),  // boolean casting
      maxAge: env.get('CORS_MAX_AGE', 86400)           // number casting
    },
    middleware: []
  },

  // Client configuration
  client: {
    port: env.VITE_PORT,                 // Direto! (number)
    proxy: {
      target: helpers.getServerUrl(),    // Helper inteligente
      changeOrigin: env.get('PROXY_CHANGE_ORIGIN', true)
    },
    build: {
      sourceMaps: env.get('CLIENT_SOURCEMAPS', helpers.isDevelopment()),
      target: env.get('CLIENT_TARGET', 'esnext'),
      outDir: env.get('CLIENT_OUTDIR', 'dist/client')
    }
  },

  // Build configuration
  build: {
    target: env.get('BUILD_TARGET', 'bun'),   // string casting
    outDir: env.get('BUILD_OUTDIR', 'dist'),  // string
    optimization: {
      treeshake: env.get('BUILD_TREESHAKE', helpers.isProduction()),
      compress: env.get('BUILD_COMPRESS', helpers.isProduction()),
      splitChunks: env.get('BUILD_SPLIT_CHUNKS', true),
      bundleAnalyzer: env.get('BUILD_ANALYZER', helpers.isDevelopment())
    },
    sourceMaps: env.get('BUILD_SOURCEMAPS', !helpers.isProduction()),
    clean: env.get('BUILD_CLEAN', true)
  },

  // Plugin configuration
  plugins: {
    enabled: env.get('FLUXSTACK_PLUGINS_ENABLED', ['logger', 'swagger', 'vite', 'cors', 'static-files', 'crypto-auth']),
    disabled: env.get('FLUXSTACK_PLUGINS_DISABLED', []),
    config: {
      // Plugin-specific configurations can be added here
      logger: {
        // Logger plugin config will be handled by logging section
      },
      swagger: {
        title: env.get('SWAGGER_TITLE', 'FluxStack API'),
        version: env.get('SWAGGER_VERSION', '1.0.0'),
        description: env.get('SWAGGER_DESCRIPTION', 'API documentation for FluxStack application')
      },
      staticFiles: {
        publicDir: env.get('STATIC_PUBLIC_DIR', 'public'),
        uploadsDir: env.get('STATIC_UPLOADS_DIR', 'uploads'),
        cacheMaxAge: env.get('STATIC_CACHE_MAX_AGE', 31536000), // 1 year
        enableUploads: env.get('STATIC_ENABLE_UPLOADS', true),
        enablePublic: env.get('STATIC_ENABLE_PUBLIC', true)
      },
      'crypto-auth': {
        enabled: env.get('CRYPTO_AUTH_ENABLED', true),
        sessionTimeout: env.get('CRYPTO_AUTH_SESSION_TIMEOUT', 1800000), // 30 minutos
        maxTimeDrift: env.get('CRYPTO_AUTH_MAX_TIME_DRIFT', 300000), // 5 minutos
        adminKeys: env.get('CRYPTO_AUTH_ADMIN_KEYS', []),
        protectedRoutes: env.get('CRYPTO_AUTH_PROTECTED_ROUTES', ['/api/admin/*', '/api/protected/*']),
        publicRoutes: env.get('CRYPTO_AUTH_PUBLIC_ROUTES', ['/api/auth/*', '/api/health', '/api/docs']),
        enableMetrics: env.get('CRYPTO_AUTH_ENABLE_METRICS', true)
      }
    }
  },

  // Logging configuration
  logging: {
    level: env.LOG_LEVEL as any,         // Direto! (com smart default)
    format: env.get('LOG_FORMAT', helpers.isDevelopment() ? 'pretty' : 'json'),
    transports: [
      {
        type: 'console' as const,
        level: env.LOG_LEVEL as any,     // Direto! (com smart default)
        format: env.get('LOG_FORMAT', helpers.isDevelopment() ? 'pretty' : 'json')
      }
    ]
  },

  // Monitoring configuration
  monitoring: {
    enabled: env.ENABLE_MONITORING,      // Direto! (boolean)
    metrics: {
      enabled: env.ENABLE_METRICS,       // Direto! (boolean)
      collectInterval: env.get('METRICS_INTERVAL', 5000),  // number casting
      httpMetrics: env.get('HTTP_METRICS', true),
      systemMetrics: env.get('SYSTEM_METRICS', true),
      customMetrics: env.get('CUSTOM_METRICS', false)
    },
    profiling: {
      enabled: env.get('PROFILING_ENABLED', false),
      sampleRate: env.get('PROFILING_SAMPLE_RATE', 0.1),   // number casting
      memoryProfiling: env.get('MEMORY_PROFILING', false),
      cpuProfiling: env.get('CPU_PROFILING', false)
    },
    exporters: env.get('MONITORING_EXPORTERS', [])         // array casting
  },

  // Optional database configuration
  ...(env.has('DATABASE_URL') || env.has('DATABASE_HOST') ? {
    database: {
      url: env.DATABASE_URL,               // Direto! (string)
      host: env.DB_HOST,                   // Direto! (string)
      port: env.DB_PORT,                   // Direto! (number)
      database: env.DB_NAME,               // Direto! (string)
      user: env.DB_USER,                   // Direto! (string)
      password: env.DB_PASSWORD,           // Direto! (string)
      ssl: env.DB_SSL,                     // Direto! (boolean)
      poolSize: env.get('DB_POOL_SIZE', 10)  // number casting
    }
  } : {}),

  // Optional authentication configuration
  ...(env.has('JWT_SECRET') ? {
    auth: {
      secret: env.JWT_SECRET,              // Direto! (string)
      expiresIn: env.get('JWT_EXPIRES_IN', '24h'),
      algorithm: env.get('JWT_ALGORITHM', 'HS256'),
      issuer: env.get('JWT_ISSUER')
    }
  } : {}),

  // Optional email configuration
  ...(env.has('SMTP_HOST') ? {
    email: {
      host: env.SMTP_HOST,                 // Direto! (string)
      port: env.SMTP_PORT,                 // Direto! (number)
      user: env.SMTP_USER,                 // Direto! (string)
      password: env.SMTP_PASSWORD,         // Direto! (string)
      secure: env.SMTP_SECURE,             // Direto! (boolean)
      from: env.get('SMTP_FROM')
    }
  } : {}),

  // Optional storage configuration
  ...(env.has('UPLOAD_PATH') || env.has('STORAGE_PROVIDER') ? {
    storage: {
      uploadPath: env.get('UPLOAD_PATH'),
      maxFileSize: env.get('MAX_FILE_SIZE', 10485760),  // 10MB default
      allowedTypes: env.get('ALLOWED_FILE_TYPES', []),  // array casting
      provider: env.get('STORAGE_PROVIDER', 'local'),
      config: env.get('STORAGE_CONFIG', {})             // object casting
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
          target: 'es2020',
          outDir: 'dist'
        }
      },
      build: {
        target: 'bun',
        outDir: 'dist',
        optimization: {
          compress: false,
          treeshake: false,
          splitChunks: false,
          bundleAnalyzer: false
        },
        sourceMaps: true,
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
          target: 'es2020',
          outDir: 'dist'
        }
      },
      build: {
        target: 'bun',
        outDir: 'dist',
        optimization: {
          treeshake: false,
          compress: false,
          splitChunks: false,
          bundleAnalyzer: false
        },
        sourceMaps: false,
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
        build: { sourceMaps: true, target: 'es2020', outDir: 'dist' }
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