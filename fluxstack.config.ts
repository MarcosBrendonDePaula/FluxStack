/**
 * FluxStack Configuration
 * Enhanced configuration with comprehensive settings and environment support
 * Updated to use dynamic environment variables
 */

import type { FluxStackConfig } from './core/config/schema'
// Environment helpers
const env = process.env
const helpers = {
  isDevelopment: () => env.NODE_ENV === 'development' || !env.NODE_ENV,
  isProduction: () => env.NODE_ENV === 'production',
  isTest: () => env.NODE_ENV === 'test'
}

console.log(`🔧 Loading FluxStack config for ${env.NODE_ENV} environment`)

// Main FluxStack configuration with dynamic env vars
export const config: FluxStackConfig = {
  // Application metadata
  app: {
    name: env.FLUXSTACK_APP_NAME,        // Direto! (string)
    version: env.FLUXSTACK_APP_VERSION,  // Direto! (string)
    description: env.FLUXSTACK_APP_DESCRIPTION || 'A FluxStack application'
  },

  // Server configuration
  server: {
    port: env.PORT,                      // Direto! (number)
    host: env.HOST,                      // Direto! (string)
    apiPrefix: env.API_PREFIX,           // Direto! (string)
    cors: {
      origins: env.CORS_ORIGINS,           // Direto! (string[])
      methods: env.CORS_METHODS ? JSON.parse(env.CORS_METHODS) : ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      headers: env.CORS_HEADERS ? JSON.parse(env.CORS_HEADERS) : ['Content-Type', 'Authorization'],
      credentials: env.CORS_CREDENTIALS === 'true' || false,
      maxAge: parseInt(env.CORS_MAX_AGE || '86400')
    },
    middleware: []
  },

  // Client configuration
  client: {
    port: env.VITE_PORT,                 // Direto! (number)
    proxy: {
      target: env.SERVER_URL || 'http://localhost:3000',    // Helper inteligente
      changeOrigin: env.PROXY_CHANGE_ORIGIN === 'true' || true
    },
    build: {
      sourceMaps: env.CLIENT_SOURCEMAPS === 'true' || helpers.isDevelopment(),
      target: env.CLIENT_TARGET || 'esnext',
      outDir: env.CLIENT_OUTDIR || 'dist/client'
    }
  },

  // Build configuration
  build: {
    target: env.BUILD_TARGET || 'bun',   // string casting
    outDir: env.BUILD_OUTDIR || 'dist',  // string
    optimization: {
      treeshake: env.BUILD_TREESHAKE === 'true' || helpers.isProduction(),
      compress: env.BUILD_COMPRESS === 'true' || helpers.isProduction(),
      splitChunks: env.BUILD_SPLIT_CHUNKS === 'true' || true,
      bundleAnalyzer: env.BUILD_ANALYZER === 'true' || helpers.isDevelopment()
    },
    sourceMaps: env.BUILD_SOURCEMAPS === 'true' || !helpers.isProduction(),
    clean: env.BUILD_CLEAN === 'true' || true
  },

  // Plugin configuration
  plugins: {
    enabled: env.FLUXSTACK_PLUGINS_ENABLED ? JSON.parse(env.FLUXSTACK_PLUGINS_ENABLED) : ['logger', 'swagger', 'vite', 'cors', 'static-files', 'crypto-auth'],
    disabled: env.FLUXSTACK_PLUGINS_DISABLED ? JSON.parse(env.FLUXSTACK_PLUGINS_DISABLED) : [],
    config: {
      // Plugin-specific configurations can be added here
      logger: {
        // Logger plugin config will be handled by logging section
      },
      swagger: {
        title: env.SWAGGER_TITLE || 'FluxStack API',
        version: env.SWAGGER_VERSION || '1.0.0',
        description: env.SWAGGER_DESCRIPTION || 'API documentation for FluxStack application'
      },
      staticFiles: {
        publicDir: env.STATIC_PUBLIC_DIR || 'public',
        uploadsDir: env.STATIC_UPLOADS_DIR || 'uploads',
        cacheMaxAge: parseInt(env.STATIC_CACHE_MAX_AGE || '31536000'), // 1 year
        enableUploads: env.STATIC_ENABLE_UPLOADS === 'true' || true,
        enablePublic: env.STATIC_ENABLE_PUBLIC === 'true' || true
      },
      'crypto-auth': {
        enabled: env.CRYPTO_AUTH_ENABLED === 'true' || true,
        sessionTimeout: parseInt(env.CRYPTO_AUTH_SESSION_TIMEOUT || '1800000'), // 30 minutos
        maxTimeDrift: parseInt(env.CRYPTO_AUTH_MAX_TIME_DRIFT || '300000'), // 5 minutos
        adminKeys: env.CRYPTO_AUTH_ADMIN_KEYS ? JSON.parse(env.CRYPTO_AUTH_ADMIN_KEYS) : [],
        protectedRoutes: env.CRYPTO_AUTH_PROTECTED_ROUTES ? JSON.parse(env.CRYPTO_AUTH_PROTECTED_ROUTES) : ['/api/admin/*', '/api/protected/*'],
        publicRoutes: env.CRYPTO_AUTH_PUBLIC_ROUTES ? JSON.parse(env.CRYPTO_AUTH_PUBLIC_ROUTES) : ['/api/auth/*', '/api/health', '/api/docs'],
        enableMetrics: env.CRYPTO_AUTH_ENABLE_METRICS === 'true' || true
      }
    }
  },

  // Logging configuration
  logging: {
    level: env.LOG_LEVEL as any,         // Direto! (com smart default)
    format: env.LOG_FORMAT || (helpers.isDevelopment() ? 'pretty' : 'json'),
    transports: [
      {
        type: 'console' as const,
        level: env.LOG_LEVEL as any,     // Direto! (com smart default)
        format: env.LOG_FORMAT || (helpers.isDevelopment() ? 'pretty' : 'json')
      }
    ]
  },

  // Monitoring configuration
  monitoring: {
    enabled: env.ENABLE_MONITORING,      // Direto! (boolean)
    metrics: {
      enabled: env.ENABLE_METRICS,       // Direto! (boolean)
      collectInterval: parseInt(env.METRICS_INTERVAL || '5000'),  // number casting
      httpMetrics: env.HTTP_METRICS === 'true' || true,
      systemMetrics: env.SYSTEM_METRICS === 'true' || true,
      customMetrics: env.CUSTOM_METRICS === 'true' || false
    },
    profiling: {
      enabled: env.PROFILING_ENABLED === 'true' || false,
      sampleRate: parseFloat(env.PROFILING_SAMPLE_RATE || '0.1'),   // number casting
      memoryProfiling: env.MEMORY_PROFILING === 'true' || false,
      cpuProfiling: env.CPU_PROFILING === 'true' || false
    },
    exporters: env.MONITORING_EXPORTERS ? JSON.parse(env.MONITORING_EXPORTERS) : []         // array casting
  },

  // Optional database configuration
  ...(env.DATABASE_URL || env.DATABASE_HOST ? {
    database: {
      url: env.DATABASE_URL,               // Direto! (string)
      host: env.DB_HOST,                   // Direto! (string)
      port: env.DB_PORT,                   // Direto! (number)
      database: env.DB_NAME,               // Direto! (string)
      user: env.DB_USER,                   // Direto! (string)
      password: env.DB_PASSWORD,           // Direto! (string)
      ssl: env.DB_SSL,                     // Direto! (boolean)
      poolSize: parseInt(env.DB_POOL_SIZE || '10')  // number casting
    }
  } : {}),

  // Optional authentication configuration
  ...(env.JWT_SECRET ? {
    auth: {
      secret: env.JWT_SECRET,              // Direto! (string)
      expiresIn: env.JWT_EXPIRES_IN || '24h',
      algorithm: env.JWT_ALGORITHM || 'HS256',
      issuer: env.JWT_ISSUER
    }
  } : {}),

  // Optional email configuration
  ...(env.SMTP_HOST ? {
    email: {
      host: env.SMTP_HOST,                 // Direto! (string)
      port: env.SMTP_PORT,                 // Direto! (number)
      user: env.SMTP_USER,                 // Direto! (string)
      password: env.SMTP_PASSWORD,         // Direto! (string)
      secure: env.SMTP_SECURE,             // Direto! (boolean)
      from: env.SMTP_FROM
    }
  } : {}),

  // Optional storage configuration
  ...(env.UPLOAD_PATH || env.STORAGE_PROVIDER ? {
    storage: {
      uploadPath: env.UPLOAD_PATH,
      maxFileSize: parseInt(env.MAX_FILE_SIZE || '10485760'),  // 10MB default
      allowedTypes: env.ALLOWED_FILE_TYPES ? JSON.parse(env.ALLOWED_FILE_TYPES) : [],  // array casting
      provider: env.STORAGE_PROVIDER || 'local',
      config: env.STORAGE_CONFIG ? JSON.parse(env.STORAGE_CONFIG) : {}             // object casting
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