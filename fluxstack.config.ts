/**
 * FluxStack Configuration
 * Enhanced configuration with comprehensive settings and environment support
 */

import type { FluxStackConfig } from './core/config/schema'
import { getEnvironmentInfo } from './core/config/env'

// Get current environment information
const env = getEnvironmentInfo()

// Main FluxStack configuration
export const config: FluxStackConfig = {
  // Application metadata
  app: {
    name: process.env.FLUXSTACK_APP_NAME || 'fluxstack-app',
    version: process.env.FLUXSTACK_APP_VERSION || '1.0.0',
    description: process.env.FLUXSTACK_APP_DESCRIPTION || 'A FluxStack application'
  },

  // Server configuration
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    host: process.env.HOST || 'localhost',
    apiPrefix: process.env.FLUXSTACK_API_PREFIX || '/api',
    cors: {
      origins: process.env.CORS_ORIGINS?.split(',') || [
        'http://localhost:3000',
        'http://localhost:5173'
      ],
      methods: process.env.CORS_METHODS?.split(',') || [
        'GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'
      ],
      headers: process.env.CORS_HEADERS?.split(',') || [
        'Content-Type', 'Authorization'
      ],
      credentials: process.env.CORS_CREDENTIALS === 'true',
      maxAge: parseInt(process.env.CORS_MAX_AGE || '86400', 10)
    },
    middleware: []
  },

  // Client configuration
  client: {
    port: parseInt(process.env.VITE_PORT || process.env.CLIENT_PORT || '5173', 10),
    proxy: {
      target: process.env.VITE_API_URL || process.env.API_URL || 'http://localhost:3000',
      changeOrigin: true
    },
    build: {
      sourceMaps: env.isDevelopment,
      minify: env.isProduction,
      target: 'esnext',
      outDir: 'dist/client'
    }
  },

  // Build configuration
  build: {
    target: (process.env.BUILD_TARGET as any) || 'bun',
    outDir: process.env.BUILD_OUTDIR || 'dist',
    optimization: {
      minify: env.isProduction,
      treeshake: env.isProduction,
      compress: env.isProduction,
      splitChunks: true,
      bundleAnalyzer: env.isDevelopment && process.env.ANALYZE === 'true'
    },
    sourceMaps: !env.isProduction,
    clean: true
  },

  // Plugin configuration
  plugins: {
    enabled: process.env.FLUXSTACK_PLUGINS_ENABLED?.split(',') || [
      'logger',
      'swagger',
      'vite',
      'cors'
    ],
    disabled: process.env.FLUXSTACK_PLUGINS_DISABLED?.split(',') || [],
    config: {
      // Plugin-specific configurations can be added here
      logger: {
        // Logger plugin config will be handled by logging section
      },
      swagger: {
        title: process.env.SWAGGER_TITLE || 'FluxStack API',
        version: process.env.SWAGGER_VERSION || '1.0.0',
        description: process.env.SWAGGER_DESCRIPTION || 'API documentation for FluxStack application'
      }
    }
  },

  // Logging configuration
  logging: {
    level: (process.env.LOG_LEVEL as any) || (env.isDevelopment ? 'debug' : 'info'),
    format: (process.env.LOG_FORMAT as any) || (env.isDevelopment ? 'pretty' : 'json'),
    transports: [
      {
        type: 'console',
        level: (process.env.LOG_LEVEL as any) || (env.isDevelopment ? 'debug' : 'info'),
        format: (process.env.LOG_FORMAT as any) || (env.isDevelopment ? 'pretty' : 'json')
      }
    ]
  },

  // Monitoring configuration
  monitoring: {
    enabled: process.env.MONITORING_ENABLED === 'true' || env.isProduction,
    metrics: {
      enabled: process.env.METRICS_ENABLED === 'true' || env.isProduction,
      collectInterval: parseInt(process.env.METRICS_INTERVAL || '5000', 10),
      httpMetrics: true,
      systemMetrics: true,
      customMetrics: false
    },
    profiling: {
      enabled: process.env.PROFILING_ENABLED === 'true',
      sampleRate: parseFloat(process.env.PROFILING_SAMPLE_RATE || '0.1'),
      memoryProfiling: false,
      cpuProfiling: false
    },
    exporters: process.env.MONITORING_EXPORTERS?.split(',') || []
  },

  // Optional database configuration
  ...(process.env.DATABASE_URL || process.env.DATABASE_HOST ? {
    database: {
      url: process.env.DATABASE_URL,
      host: process.env.DATABASE_HOST,
      port: process.env.DATABASE_PORT ? parseInt(process.env.DATABASE_PORT, 10) : undefined,
      database: process.env.DATABASE_NAME,
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      ssl: process.env.DATABASE_SSL === 'true',
      poolSize: process.env.DATABASE_POOL_SIZE ? parseInt(process.env.DATABASE_POOL_SIZE, 10) : undefined
    }
  } : {}),

  // Optional authentication configuration
  ...(process.env.JWT_SECRET ? {
    auth: {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
      algorithm: process.env.JWT_ALGORITHM || 'HS256',
      issuer: process.env.JWT_ISSUER
    }
  } : {}),

  // Optional email configuration
  ...(process.env.SMTP_HOST ? {
    email: {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587,
      user: process.env.SMTP_USER,
      password: process.env.SMTP_PASSWORD,
      secure: process.env.SMTP_SECURE === 'true',
      from: process.env.SMTP_FROM
    }
  } : {}),

  // Optional storage configuration
  ...(process.env.UPLOAD_PATH || process.env.STORAGE_PROVIDER ? {
    storage: {
      uploadPath: process.env.UPLOAD_PATH,
      maxFileSize: process.env.MAX_FILE_SIZE ? parseInt(process.env.MAX_FILE_SIZE, 10) : undefined,
      allowedTypes: process.env.ALLOWED_FILE_TYPES?.split(','),
      provider: (process.env.STORAGE_PROVIDER as any) || 'local',
      config: process.env.STORAGE_CONFIG ? JSON.parse(process.env.STORAGE_CONFIG) : {}
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
          minify: false,
          sourceMaps: true,
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
          minify: true,
          sourceMaps: false,
          target: 'es2020',
          outDir: 'dist'
        }
      },
      build: {
        target: 'bun',
        outDir: 'dist',
        optimization: {
          minify: true,
          treeshake: true,
          compress: true,
          splitChunks: true,
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