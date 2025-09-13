#!/usr/bin/env bun

/**
 * Manual Test Script for FluxStack Configuration System
 * Tests real-world scenarios and edge cases
 */

import { 
  getConfig, 
  getConfigSync, 
  validateConfig,
  createPluginConfig,
  isFeatureEnabled,
  getDatabaseConfig,
  getAuthConfig,
  env
} from '../index'
import { writeFileSync, unlinkSync, existsSync } from 'fs'
import { join } from 'path'

class ManualConfigTester {
  private testConfigPath = join(process.cwd(), 'manual-test.config.ts')
  private overrideConfigPath = join(process.cwd(), 'override-test.config.ts')
  private pluginConfigPath = join(process.cwd(), 'plugin-test.config.ts')
  private originalEnv: Record<string, string | undefined> = {}

  async runAllTests(): Promise<void> {
    console.log('🔧 FluxStack Configuration Manual Tests')
    console.log('=' .repeat(60))
    console.log()

    try {
      await this.testBasicConfiguration()
      await this.testEnvironmentVariables()
      await this.testFileConfiguration()
      await this.testEnvironmentOverrides()
      await this.testValidation()
      await this.testPluginConfiguration()
      await this.testServiceConfigurations()
      await this.testErrorHandling()
      await this.testBackwardCompatibility()

      console.log()
      console.log('🎉 All manual tests completed successfully!')
    } catch (error) {
      console.error('❌ Manual test failed:', error)
      process.exit(1)
    } finally {
      this.cleanup()
    }
  }

  private async testBasicConfiguration(): Promise<void> {
    console.log('📋 Testing Basic Configuration Loading...')
    
    const config = getConfigSync()
    
    this.assert(config.app.name === 'fluxstack-app', 'Default app name should be set')
    this.assert(config.server.port === 3000, 'Default server port should be 3000')
    this.assert(config.client.port === 5173, 'Default client port should be 5173')
    this.assert(config.server.apiPrefix === '/api', 'Default API prefix should be /api')
    this.assert(Array.isArray(config.server.cors.origins), 'CORS origins should be an array')
    
    console.log('✅ Basic configuration loading works')
  }

  private async testEnvironmentVariables(): Promise<void> {
    console.log('📋 Testing Environment Variable Loading...')
    
    // Backup original environment
    this.backupEnvironment()
    
    // Set test environment variables
    process.env.NODE_ENV = 'development'
    process.env.PORT = '4000'
    process.env.HOST = 'test-host'
    process.env.FLUXSTACK_APP_NAME = 'env-test-app'
    process.env.FLUXSTACK_APP_VERSION = '3.0.0'
    process.env.LOG_LEVEL = 'debug'
    process.env.CORS_ORIGINS = 'http://localhost:3000,https://example.com'
    process.env.CORS_CREDENTIALS = 'true'
    process.env.DATABASE_URL = 'postgresql://localhost:5432/testdb'
    process.env.JWT_SECRET = 'test-secret-key-with-sufficient-length-for-security'
    process.env.MONITORING_ENABLED = 'true'
    
    const config = getConfigSync()
    
    this.assert(config.server.port === 4000, 'Port should be loaded from env')
    this.assert(config.server.host === 'test-host', 'Host should be loaded from env')
    this.assert(config.app.name === 'env-test-app', 'App name should be loaded from env')
    this.assert(config.app.version === '3.0.0', 'App version should be loaded from env')
    this.assert(config.logging.level === 'debug', 'Log level should be loaded from env')
    this.assert(config.server.cors.credentials === true, 'CORS credentials should be boolean')
    this.assert(config.database?.url === 'postgresql://localhost:5432/testdb', 'Database URL should be loaded')
    this.assert(config.auth?.secret === 'test-secret-key-with-sufficient-length-for-security', 'JWT secret should be loaded')
    this.assert(config.monitoring.enabled === true, 'Monitoring should be enabled from env')
    
    // Test array parsing
    this.assert(
      config.server.cors.origins.includes('https://example.com'), 
      'CORS origins should include parsed values'
    )
    
    console.log('✅ Environment variable loading works')
    
    // Restore environment
    this.restoreEnvironment()
  }

  private async testFileConfiguration(): Promise<void> {
    console.log('📋 Testing File Configuration Loading...')
    
    // Ensure clean environment for file test
    this.backupEnvironment()
    delete process.env.PORT
    delete process.env.HOST
    
    const testConfig = `
import type { FluxStackConfig } from '../schema'

const config: FluxStackConfig = {
  app: {
    name: 'file-config-app',
    version: '4.0.0',
    description: 'App loaded from file'
  },
  server: {
    port: 8080,
    host: 'file-host',
    apiPrefix: '/api/v4',
    cors: {
      origins: ['http://file-origin.com'],
      methods: ['GET', 'POST', 'PUT'],
      headers: ['Content-Type', 'Authorization', 'X-Custom-Header'],
      credentials: false,
      maxAge: 3600
    },
    middleware: [
      { name: 'logger', enabled: true },
      { name: 'cors', enabled: true }
    ]
  },
  client: {
    port: 5173,
    proxy: {
      target: 'http://localhost:3000'
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
    outDir: 'dist',
    optimization: {
      minify: true,
      treeshake: true,
      compress: true,
      splitChunks: true,
      bundleAnalyzer: false
    },
    sourceMaps: true,
    clean: true
  },
  plugins: {
    enabled: ['logger', 'swagger', 'custom'],
    disabled: ['deprecated'],
    config: {
      swagger: {
        title: 'File Config API',
        version: '4.0.0',
        description: 'API from file configuration'
      },
      custom: {
        feature: 'file-enabled',
        timeout: 10000
      }
    }
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
  },
  custom: {
    fileFeature: true,
    fileTimeout: 5000,
    fileArray: ['item1', 'item2', 'item3']
  }
}

export default config
    `
    
    writeFileSync(this.testConfigPath, testConfig)
    
    const config = await getConfig({ configPath: this.testConfigPath })
    

    
    this.assert(config.app.name === 'file-config-app', 'App name should be loaded from file')
    this.assert(config.server.port === 8080, 'Port should be loaded from file')
    this.assert(config.server.apiPrefix === '/api/v4', 'API prefix should be loaded from file')
    this.assert(config.server.cors.maxAge === 3600, 'CORS maxAge should be loaded from file')
    this.assert(config.server.middleware.length === 2, 'Middleware should be loaded from file')
    this.assert(config.plugins.enabled.includes('custom'), 'Custom plugin should be enabled')
    this.assert(config.custom?.fileFeature === true, 'Custom config should be loaded')
    
    console.log('✅ File configuration loading works')
    
    this.restoreEnvironment()
  }

  private async testEnvironmentOverrides(): Promise<void> {
    console.log('📋 Testing Environment Override Precedence...')
    
    // Create file config
    const fileConfig = `
      export default {
        app: { name: 'file-app', version: '1.0.0' },
        server: { port: 3000, host: 'file-host' },
        logging: { level: 'info' }
      }
    `
    
    writeFileSync(this.overrideConfigPath, fileConfig)
    
    // Set environment variables that should override file config
    this.backupEnvironment()
    // Clear any existing HOST variable that might interfere
    delete process.env.HOST
    process.env.NODE_ENV = 'custom' // Use custom environment to avoid predefined overrides
    process.env.PORT = '9000'
    process.env.FLUXSTACK_APP_NAME = 'env-override-app'
    process.env.FLUXSTACK_LOG_LEVEL = 'error' // Use FLUXSTACK_ prefix to avoid conflicts
    
    const config = await getConfig({ configPath: this.overrideConfigPath })
    
    // Environment should override file
    this.assert(config.server.port === 9000, 'Env PORT should override file port')
    this.assert(config.app.name === 'env-override-app', 'Env app name should override file')
    this.assert(config.logging.level === 'error', 'Env log level should override file')
    
    // File values should remain for non-overridden values
    
    this.assert(config.app.version === '1.0.0', 'File version should remain')
    this.assert(config.server.host === 'file-host', 'File host should remain')
    
    console.log('✅ Environment override precedence works')
    
    this.restoreEnvironment()
  }

  private async testValidation(): Promise<void> {
    console.log('📋 Testing Configuration Validation...')
    
    // Test valid configuration
    const validConfig = getConfigSync()
    const validResult = validateConfig(validConfig)
    
    this.assert(validResult.valid === true, 'Default config should be valid')
    this.assert(validResult.errors.length === 0, 'Default config should have no errors')
    
    // Test invalid configuration
    const invalidConfig = {
      ...validConfig,
      app: { ...validConfig.app, name: '' }, // Invalid empty name
      server: { ...validConfig.server, port: 70000 } // Invalid port
    }
    
    const invalidResult = validateConfig(invalidConfig)
    
    this.assert(invalidResult.valid === false, 'Invalid config should fail validation')
    this.assert(invalidResult.errors.length > 0, 'Invalid config should have errors')
    
    console.log('✅ Configuration validation works')
  }

  private async testPluginConfiguration(): Promise<void> {
    console.log('📋 Testing Plugin Configuration...')
    
    const fileConfig = `
import type { FluxStackConfig } from '../schema'

const config: FluxStackConfig = {
  app: {
    name: 'plugin-test-app',
    version: '1.0.0'
  },
  server: {
    port: 3000,
    host: 'localhost',
    apiPrefix: '/api',
    cors: {
      origins: ['http://localhost:3000'],
      methods: ['GET', 'POST'],
      headers: ['Content-Type']
    },
    middleware: []
  },
  client: {
    port: 5173,
    proxy: {
      target: 'http://localhost:3000'
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
    outDir: 'dist',
    optimization: {
      minify: true,
      treeshake: true,
      compress: true,
      splitChunks: true,
      bundleAnalyzer: false
    },
    sourceMaps: true,
    clean: true
  },
  plugins: {
    enabled: ['logger', 'swagger', 'custom'],
    disabled: ['deprecated'],
    config: {
      logger: {
        level: 'debug',
        format: 'json',
        transports: ['console', 'file']
      },
      swagger: {
        title: 'Plugin Test API',
        version: '1.0.0',
        servers: [{ url: 'http://localhost:3000' }]
      },
      custom: {
        feature: 'enabled',
        timeout: 5000,
        retries: 3
      }
    }
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
  },
  custom: {
    logger: {
      customTransport: true
    },
    swagger: {
      theme: 'dark'
    }
  }
}

export default config
    `
    
    writeFileSync(this.pluginConfigPath, fileConfig)
    const config = await getConfig({ configPath: this.pluginConfigPath })
    
    // Test plugin configuration extraction
    const loggerConfig = createPluginConfig(config, 'logger')
    const swaggerConfig = createPluginConfig(config, 'swagger')
    const customConfig = createPluginConfig(config, 'custom')
    
    this.assert(loggerConfig.level === 'debug', 'Logger config should be extracted')
    this.assert(loggerConfig.customTransport === true, 'Custom logger config should be merged')
    
    this.assert(swaggerConfig.title === 'Plugin Test API', 'Swagger config should be extracted')
    this.assert(swaggerConfig.theme === 'dark', 'Custom swagger config should be merged')
    
    this.assert(customConfig.feature === 'enabled', 'Custom plugin config should be extracted')
    
    // Test feature detection
    this.assert(isFeatureEnabled(config, 'logger') === true, 'Logger should be enabled')
    this.assert(isFeatureEnabled(config, 'swagger') === true, 'Swagger should be enabled')
    this.assert(isFeatureEnabled(config, 'deprecated') === false, 'Deprecated should be disabled')
    
    console.log('✅ Plugin configuration works')
  }

  private async testServiceConfigurations(): Promise<void> {
    console.log('📋 Testing Service Configuration Extraction...')
    
    this.backupEnvironment()
    
    // Set service environment variables
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/testdb'
    process.env.DATABASE_SSL = 'true'
    process.env.DATABASE_POOL_SIZE = '20'
    
    process.env.JWT_SECRET = 'super-secret-jwt-key-for-testing-purposes-only'
    process.env.JWT_EXPIRES_IN = '7d'
    process.env.JWT_ALGORITHM = 'HS512'
    
    process.env.SMTP_HOST = 'smtp.example.com'
    process.env.SMTP_PORT = '587'
    process.env.SMTP_USER = 'test@example.com'
    process.env.SMTP_PASSWORD = 'smtp-password'
    process.env.SMTP_SECURE = 'true'
    
    const config = getConfigSync()
    
    // Test database configuration
    const dbConfig = getDatabaseConfig(config)
    this.assert(dbConfig !== null, 'Database config should be available')
    this.assert(dbConfig?.url === 'postgresql://user:pass@localhost:5432/testdb', 'DB URL should match')
    this.assert(dbConfig?.ssl === true, 'DB SSL should be enabled')
    this.assert(dbConfig?.poolSize === 20, 'DB pool size should be set')
    
    // Test auth configuration
    const authConfig = getAuthConfig(config)
    this.assert(authConfig !== null, 'Auth config should be available')
    this.assert(authConfig?.secret === 'super-secret-jwt-key-for-testing-purposes-only', 'JWT secret should match')
    this.assert(authConfig?.expiresIn === '7d', 'JWT expiry should match')
    this.assert(authConfig?.algorithm === 'HS512', 'JWT algorithm should match')
    
    // Test email configuration
    this.assert(config.email?.host === 'smtp.example.com', 'SMTP host should be set')
    this.assert(config.email?.port === 587, 'SMTP port should be set')
    this.assert(config.email?.secure === true, 'SMTP secure should be enabled')
    
    console.log('✅ Service configuration extraction works')
    
    this.restoreEnvironment()
  }

  private async testErrorHandling(): Promise<void> {
    console.log('📋 Testing Error Handling...')
    
    // Test missing config file
    const configWithMissingFile = await getConfig({ 
      configPath: 'non-existent-config.ts' 
    })
    
    this.assert(configWithMissingFile.app.name === 'fluxstack-app', 'Should fall back to defaults')
    
    // Test malformed config file
    const malformedConfig = `
      export default {
        app: {
          name: 'malformed'
          // Missing comma and other syntax errors
        }
        server: {
          port: 'not-a-number'
        }
      }
    `
    
    writeFileSync(this.testConfigPath, malformedConfig)
    
    const configWithMalformedFile = await getConfig({ 
      configPath: this.testConfigPath 
    })
    
    // Should still provide a valid configuration
    this.assert(typeof configWithMalformedFile.server.port === 'number', 'Port should be a number')
    
    console.log('✅ Error handling works')
  }

  private async testBackwardCompatibility(): Promise<void> {
    console.log('📋 Testing Backward Compatibility...')
    
    const config = getConfigSync()
    
    // Test legacy config import
    try {
      // const legacyConfig = await import('../../fluxstack.config') // Temporarily disabled
      // this.assert(typeof legacyConfig.config === 'object', 'Legacy config should be available') // Temporarily disabled
    } catch (error) {
      console.warn('⚠️  Legacy config import test skipped (expected in some environments)')
    }
    
    // Test environment utilities
    this.backupEnvironment()
    process.env.NODE_ENV = 'development'
    
    this.assert(typeof env.isDevelopment() === 'boolean', 'Environment utilities should work')
    this.assert(env.isDevelopment() === true, 'Should detect development environment')
    this.assert(env.isProduction() === false, 'Should detect non-production environment')
    
    console.log('✅ Backward compatibility works')
    
    this.restoreEnvironment()
  }

  private backupEnvironment(): void {
    this.originalEnv = { ...process.env }
  }

  private restoreEnvironment(): void {
    // Clear all environment variables
    Object.keys(process.env).forEach(key => {
      delete process.env[key]
    })
    
    // Restore original environment
    Object.assign(process.env, this.originalEnv)
  }

  private cleanup(): void {
    if (existsSync(this.testConfigPath)) {
      unlinkSync(this.testConfigPath)
    }
    if (existsSync(this.overrideConfigPath)) {
      unlinkSync(this.overrideConfigPath)
    }
    if (existsSync(this.pluginConfigPath)) {
      unlinkSync(this.pluginConfigPath)
    }
    this.restoreEnvironment()
  }

  private assert(condition: boolean, message: string): void {
    if (!condition) {
      throw new Error(`Assertion failed: ${message}`)
    }
  }
}

// Main execution
async function main() {
  const tester = new ManualConfigTester()
  await tester.runAllTests()
}

if (import.meta.main) {
  main().catch(error => {
    console.error('❌ Manual test failed:', error)
    process.exit(1)
  })
}