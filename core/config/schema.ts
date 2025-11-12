/**
 * ⚠️ DEPRECATED - Enhanced Configuration Schema for FluxStack
 *
 * This file is DEPRECATED and maintained only for backward compatibility.
 * Please use the new modular config system from /config instead:
 *
 * ✅ NEW WAY:
 * ```ts
 * import { appConfig, serverConfig, clientConfig } from '@/config'
 * ```
 *
 * ❌ OLD WAY (DEPRECATED):
 * ```ts
 * import { FluxStackConfig } from '@/core/config/schema'
 * ```
 *
 * The modular system provides:
 * - Better organization (separated by domain)
 * - Automatic validation
 * - Type inference
 * - Laravel-style declarative schemas
 *
 * This file will be removed in a future version.
 * @deprecated Use /config modular system instead
 */


export type LogLevel = 'debug' | 'info' | 'warn' | 'error'
export type BuildTarget = 'bun' | 'node' | 'docker'
export type LogFormat = 'json' | 'pretty'
export type StorageType = 'localStorage' | 'sessionStorage'

// Core configuration interfaces
export interface AppConfig {
  name: string
  version: string
  description?: string
}

export interface CorsConfig {
  origins: string[]
  methods: string[]
  headers: string[]
  credentials?: boolean
  maxAge?: number
}

export interface MiddlewareConfig {
  name: string
  enabled: boolean
  config?: Record<string, any>
}

export interface ServerConfig {
  port: number
  host: string
  apiPrefix: string
  cors: CorsConfig
  middleware: MiddlewareConfig[]
  showBanner?: boolean // Show startup banner (default: true)
}

export interface ProxyConfig {
  target: string
  changeOrigin?: boolean
  pathRewrite?: Record<string, string>
}

export interface ClientBuildConfig {
  sourceMaps: boolean
  minify: boolean
  target: string
  outDir: string
}

export interface ClientConfig {
  port: number
  proxy: ProxyConfig
  build: ClientBuildConfig
}

export interface OptimizationConfig {
  minify: boolean
  treeshake: boolean
  compress: boolean
  splitChunks: boolean
  bundleAnalyzer: boolean
}

export interface BuildConfig {
  target: BuildTarget
  mode?: 'development' | 'production' | 'test'
  outDir: string
  optimization: OptimizationConfig
  sourceMaps: boolean
  minify: boolean
  treeshake: boolean
  compress?: boolean
  removeUnusedCSS?: boolean
  optimizeImages?: boolean
  bundleAnalysis?: boolean
  clean: boolean
  optimize?: boolean
  external?: string[]
}

export interface LogTransportConfig {
  type: 'console' | 'file' | 'http'
  level: LogLevel
  format: LogFormat
  options?: Record<string, any>
}

export interface LoggingConfig {
  level: LogLevel
  format: LogFormat
  transports: LogTransportConfig[]
  context?: Record<string, any>
}

export interface MetricsConfig {
  enabled: boolean
  collectInterval: number
  httpMetrics: boolean
  systemMetrics: boolean
  customMetrics: boolean
}

export interface ProfilingConfig {
  enabled: boolean
  sampleRate: number
  memoryProfiling: boolean
  cpuProfiling: boolean
}

export interface MonitoringConfig {
  enabled: boolean
  metrics: MetricsConfig
  profiling: ProfilingConfig
  exporters: string[]
}

export interface PluginConfig {
  enabled: string[]
  disabled: string[]
  config: Record<string, any>
}

export interface DatabaseConfig {
  url?: string
  host?: string
  port?: number
  database?: string
  user?: string
  password?: string
  ssl?: boolean
  poolSize?: number
}

export interface AuthConfig {
  secret?: string
  expiresIn?: string
  algorithm?: string
  issuer?: string
}

export interface EmailConfig {
  host?: string
  port?: number
  user?: string
  password?: string
  secure?: boolean
  from?: string
}

export interface StorageConfig {
  uploadPath?: string
  maxFileSize?: number
  allowedTypes?: string[]
  provider?: 'local' | 's3' | 'gcs'
  config?: Record<string, any>
}

// Main configuration interface
export interface FluxStackConfig {
  // Core settings
  app: AppConfig

  // Server configuration
  server: ServerConfig

  // Client configuration
  client: ClientConfig

  // Build configuration
  build: BuildConfig

  // Plugin configuration
  plugins: PluginConfig

  // Logging configuration
  logging: LoggingConfig

  // Monitoring configuration
  monitoring: MonitoringConfig

  // Optional service configurations
  database?: DatabaseConfig
  auth?: AuthConfig
  email?: EmailConfig
  storage?: StorageConfig
  staticFiles?: {
    publicDir?: string
    uploadsDir?: string
    cacheMaxAge?: number
    enableUploads?: boolean
    enablePublic?: boolean
    publicRoute?: string
    uploadsRoute?: string
  }

  // Environment-specific overrides
  environments?: {
    development?: Partial<FluxStackConfig>
    production?: Partial<FluxStackConfig>
    test?: Partial<FluxStackConfig>
    [key: string]: Partial<FluxStackConfig> | undefined
  }

  // Custom configuration
  custom?: Record<string, any>
}

// JSON Schema for validation
export const fluxStackConfigSchema = {
  type: 'object',
  properties: {
    app: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          minLength: 1,
          description: 'Application name'
        },
        version: {
          type: 'string',
          pattern: '^\\d+\\.\\d+\\.\\d+',
          description: 'Application version (semver format)'
        },
        description: {
          type: 'string',
          description: 'Application description'
        }
      },
      required: ['name', 'version'],
      additionalProperties: false
    },

    server: {
      type: 'object',
      properties: {
        port: {
          type: 'number',
          minimum: 1,
          maximum: 65535,
          description: 'Server port number'
        },
        host: {
          type: 'string',
          description: 'Server host address'
        },
        apiPrefix: {
          type: 'string',
          pattern: '^/',
          description: 'API route prefix'
        },
        cors: {
          type: 'object',
          properties: {
            origins: {
              type: 'array',
              items: { type: 'string' },
              minItems: 1,
              description: 'Allowed CORS origins'
            },
            methods: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD']
              },
              description: 'Allowed HTTP methods'
            },
            headers: {
              type: 'array',
              items: { type: 'string' },
              description: 'Allowed headers'
            },
            credentials: {
              type: 'boolean',
              description: 'Allow credentials in CORS requests'
            },
            maxAge: {
              type: 'number',
              minimum: 0,
              description: 'CORS preflight cache duration'
            }
          },
          required: ['origins', 'methods', 'headers'],
          additionalProperties: false
        },
        middleware: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              enabled: { type: 'boolean' },
              config: { type: 'object' }
            },
            required: ['name', 'enabled'],
            additionalProperties: false
          }
        }
      },
      required: ['port', 'host', 'apiPrefix', 'cors', 'middleware'],
      additionalProperties: false
    },

    client: {
      type: 'object',
      properties: {
        port: {
          type: 'number',
          minimum: 1,
          maximum: 65535,
          description: 'Client development server port'
        },
        proxy: {
          type: 'object',
          properties: {
            target: { type: 'string' },
            changeOrigin: { type: 'boolean' },
            pathRewrite: {
              type: 'object',
              additionalProperties: { type: 'string' }
            }
          },
          required: ['target'],
          additionalProperties: false
        },
        build: {
          type: 'object',
          properties: {
            sourceMaps: { type: 'boolean' },
            minify: { type: 'boolean' },
            target: { type: 'string' },
            outDir: { type: 'string' }
          },
          required: ['sourceMaps', 'minify', 'target', 'outDir'],
          additionalProperties: false
        }
      },
      required: ['port', 'proxy', 'build'],
      additionalProperties: false
    },

    build: {
      type: 'object',
      properties: {
        target: {
          type: 'string',
          enum: ['bun', 'node', 'docker'],
          description: 'Build target runtime'
        },
        outDir: {
          type: 'string',
          description: 'Build output directory'
        },
        mode: {
          type: 'string',
          enum: ['development', 'production', 'test'],
          description: 'Build mode'
        },
        optimization: {
          type: 'object',
          properties: {
            minify: { type: 'boolean' },
            treeshake: { type: 'boolean' },
            compress: { type: 'boolean' },
            splitChunks: { type: 'boolean' },
            bundleAnalyzer: { type: 'boolean' }
          },
          required: ['minify', 'treeshake', 'compress', 'splitChunks', 'bundleAnalyzer'],
          additionalProperties: false
        },
        sourceMaps: { type: 'boolean' },
        minify: { type: 'boolean' },
        treeshake: { type: 'boolean' },
        compress: { type: 'boolean' },
        removeUnusedCSS: { type: 'boolean' },
        optimizeImages: { type: 'boolean' },
        bundleAnalysis: { type: 'boolean' },
        clean: { type: 'boolean' },
        optimize: { type: 'boolean' },
        external: {
          type: 'array',
          items: { type: 'string' },
          description: 'External dependencies to exclude from bundle'
        }
      },
      required: ['target', 'outDir', 'optimization', 'sourceMaps', 'minify', 'treeshake', 'clean'],
      additionalProperties: false
    },

    plugins: {
      type: 'object',
      properties: {
        enabled: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of enabled plugins'
        },
        disabled: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of disabled plugins'
        },
        config: {
          type: 'object',
          description: 'Plugin-specific configuration'
        }
      },
      required: ['enabled', 'disabled', 'config'],
      additionalProperties: false
    },

    logging: {
      type: 'object',
      properties: {
        level: {
          type: 'string',
          enum: ['debug', 'info', 'warn', 'error'],
          description: 'Minimum log level'
        },
        format: {
          type: 'string',
          enum: ['json', 'pretty'],
          description: 'Log output format'
        },
        transports: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['console', 'file', 'http']
              },
              level: {
                type: 'string',
                enum: ['debug', 'info', 'warn', 'error']
              },
              format: {
                type: 'string',
                enum: ['json', 'pretty']
              },
              options: { type: 'object' }
            },
            required: ['type', 'level', 'format'],
            additionalProperties: false
          }
        },
        context: { type: 'object' }
      },
      required: ['level', 'format', 'transports'],
      additionalProperties: false
    },

    monitoring: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean' },
        metrics: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            collectInterval: { type: 'number', minimum: 1000 },
            httpMetrics: { type: 'boolean' },
            systemMetrics: { type: 'boolean' },
            customMetrics: { type: 'boolean' }
          },
          required: ['enabled', 'collectInterval', 'httpMetrics', 'systemMetrics', 'customMetrics'],
          additionalProperties: false
        },
        profiling: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            sampleRate: { type: 'number', minimum: 0, maximum: 1 },
            memoryProfiling: { type: 'boolean' },
            cpuProfiling: { type: 'boolean' }
          },
          required: ['enabled', 'sampleRate', 'memoryProfiling', 'cpuProfiling'],
          additionalProperties: false
        },
        exporters: {
          type: 'array',
          items: { type: 'string' }
        }
      },
      required: ['enabled', 'metrics', 'profiling', 'exporters'],
      additionalProperties: false
    },

    // Optional configurations
    database: {
      type: 'object',
      properties: {
        url: { type: 'string' },
        host: { type: 'string' },
        port: { type: 'number', minimum: 1, maximum: 65535 },
        database: { type: 'string' },
        user: { type: 'string' },
        password: { type: 'string' },
        ssl: { type: 'boolean' },
        poolSize: { type: 'number', minimum: 1 }
      },
      additionalProperties: false
    },

    auth: {
      type: 'object',
      properties: {
        secret: { type: 'string', minLength: 32 },
        expiresIn: { type: 'string' },
        algorithm: { type: 'string' },
        issuer: { type: 'string' }
      },
      additionalProperties: false
    },

    email: {
      type: 'object',
      properties: {
        host: { type: 'string' },
        port: { type: 'number', minimum: 1, maximum: 65535 },
        user: { type: 'string' },
        password: { type: 'string' },
        secure: { type: 'boolean' },
        from: { type: 'string' }
      },
      additionalProperties: false
    },

    storage: {
      type: 'object',
      properties: {
        uploadPath: { type: 'string' },
        maxFileSize: { type: 'number', minimum: 1 },
        allowedTypes: {
          type: 'array',
          items: { type: 'string' }
        },
        provider: {
          type: 'string',
          enum: ['local', 's3', 'gcs']
        },
        config: { type: 'object' }
      },
      additionalProperties: false
    },

    environments: {
      type: 'object',
      additionalProperties: {
        // Recursive reference to partial config
        type: 'object'
      }
    },

    custom: {
      type: 'object',
      description: 'Custom application-specific configuration'
    }
  },
  required: ['app', 'server', 'client', 'build', 'plugins', 'logging', 'monitoring'],
  additionalProperties: false
}

// Default configuration values
export const defaultFluxStackConfig: FluxStackConfig = {
  app: {
    name: 'fluxstack-app',
    version: '1.0.0',
    description: 'A FluxStack application'
  },

  server: {
    port: 3000,
    host: 'localhost',
    apiPrefix: '/api',
    cors: {
      origins: ['http://localhost:3000', 'http://localhost:5173'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      headers: ['Content-Type', 'Authorization'],
      credentials: true,
      maxAge: 86400
    },
    middleware: []
  },

  client: {
    port: 5173,
    proxy: {
      target: 'http://localhost:3000',
      changeOrigin: true
    },
    build: {
      sourceMaps: true,
      minify: false,
      target: 'esnext',
      outDir: 'dist/client'
    }
  },

  build: {
    target: 'bun',
    mode: 'production',
    outDir: 'dist',
    optimization: {
      minify: true,
      treeshake: true,
      compress: true,
      splitChunks: true,
      bundleAnalyzer: false
    },
    sourceMaps: true,
    minify: true,
    treeshake: true,
    compress: true,
    removeUnusedCSS: false,
    optimizeImages: false,
    bundleAnalysis: false,
    clean: true,
    optimize: true,
    external: []
  },

  plugins: {
    enabled: ['logger', 'swagger', 'vite', 'cors'],
    disabled: [],
    config: {}
  },

  logging: {
    level: 'info',
    format: 'pretty',
    transports: [
      {
        type: 'console',
        level: 'info',
        format: 'pretty'
      }
    ]
  },

  monitoring: {
    enabled: false,
    metrics: {
      enabled: false,
      collectInterval: 5000,
      httpMetrics: true,
      systemMetrics: true,
      customMetrics: false
    },
    profiling: {
      enabled: false,
      sampleRate: 0.1,
      memoryProfiling: false,
      cpuProfiling: false
    },
    exporters: []
  }
}

// Environment-specific default overrides
export const environmentDefaults = {
  development: {
    logging: {
      level: 'debug' as LogLevel,
      format: 'pretty' as LogFormat
    },
    client: {
      build: {
        minify: false,
        sourceMaps: true
      }
    },
    build: {
      optimization: {
        minify: false,
        compress: false
      }
    }
  },

  production: {
    logging: {
      level: 'warn' as LogLevel,
      format: 'json' as LogFormat,
      transports: [
        {
          type: 'console' as const,
          level: 'warn' as LogLevel,
          format: 'json' as LogFormat
        },
        {
          type: 'file' as const,
          level: 'error' as LogLevel,
          format: 'json' as LogFormat,
          options: {
            filename: 'logs/error.log',
            maxSize: '10m',
            maxFiles: 5
          }
        }
      ]
    },
    monitoring: {
      enabled: true,
      metrics: {
        enabled: true,
        httpMetrics: true,
        systemMetrics: true
      }
    },
    build: {
      optimization: {
        minify: true,
        treeshake: true,
        compress: true,
        splitChunks: true
      }
    }
  },

  test: {
    logging: {
      level: 'error' as LogLevel,
      format: 'json' as LogFormat
    },
    server: {
      port: 0 // Use random available port
    },
    client: {
      port: 0 // Use random available port
    }
  }
} as const