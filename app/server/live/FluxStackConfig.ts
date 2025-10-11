// 🔥 FluxStack Configuration Live Component

import { LiveComponent } from '@/core/types/types'
import { appConfig } from '@/config/app.config'
import { serverConfig } from '@/config/server.config'
import { loggerConfig } from '@/config/logger.config'
import { systemConfig, systemRuntimeInfo } from '@/config/system.config'

export interface FluxStackConfigState {
  // Environment Configuration
  environment: 'development' | 'production' | 'test'
  port: number
  host: string
  apiPrefix: string
  
  // Framework Information
  framework: {
    name: string
    version: string
    description: string
    author: string
    license: string
  }
  
  // Plugin Configuration
  plugins: Array<{
    name: string
    version: string
    enabled: boolean
    dependencies: string[]
    config?: Record<string, any>
  }>
  
  // Runtime Configuration
  runtime: {
    nodeVersion: string
    bunVersion: string
    platform: string
    architecture: string
    cpuCount: number
    totalMemory: number
    workingDirectory: string
    executablePath: string
  }
  
  // Live Components Configuration
  liveComponents: {
    enabled: boolean
    autoDiscovery: boolean
    websocketPath: string
    signatureSecret: string
    maxConnections: number
    timeout: number
  }
  
  // Vite Configuration
  vite: {
    enabled: boolean
    port: number
    host: string
    hmr: boolean
    publicDir: string
    buildDir: string
  }
  
  // Static Files Configuration
  staticFiles: {
    enabled: boolean
    publicPath: string
    uploadsPath: string
    maxFileSize: number
    allowedExtensions: string[]
  }
  
  // Swagger Configuration
  swagger: {
    enabled: boolean
    title: string
    version: string
    description: string
    path: string
  }
  
  // Security Configuration
  security: {
    cors: {
      enabled: boolean
      origins: string[]
      credentials: boolean
    }
    rateLimit: {
      enabled: boolean
      windowMs: number
      maxRequests: number
    }
    helmet: {
      enabled: boolean
      options: Record<string, any>
    }
  }
  
  // Performance Configuration
  performance: {
    compression: boolean
    cache: {
      enabled: boolean
      maxAge: number
      strategy: string
    }
    clustering: {
      enabled: boolean
      workers: number
    }
  }
  
  // Database Configuration (if applicable)
  database: {
    enabled: boolean
    type?: string
    host?: string
    port?: number
    name?: string
    ssl?: boolean
  }
  
  // Logging Configuration
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error'
    format: 'json' | 'pretty' | 'compact'
    file: {
      enabled: boolean
      path?: string
      maxSize?: string
      maxFiles?: number
    }
    console: {
      enabled: boolean
      colors: boolean
    }
  }
  
  // Advanced Configuration
  advanced: {
    hotReload: boolean
    typeChecking: boolean
    sourceMap: boolean
    minification: boolean
    bundleAnalyzer: boolean
  }
  
  lastUpdated: number
}

export class FluxStackConfig extends LiveComponent<FluxStackConfigState> {
  
  constructor(initialState: FluxStackConfigState, ws: any, options?: any) {
    super(initialState, ws, options)
    
    // Set default state with real configuration
    this.state = {
      environment: appConfig.env,
      port: serverConfig.port,
      host: serverConfig.host,
      apiPrefix: serverConfig.apiPrefix,
      
      framework: {
        name: 'FluxStack',
        version: '1.5.3',
        description: 'Modern Full-Stack TypeScript Framework with Live Components',
        author: 'FluxStack Team',
        license: 'MIT'
      },
      
      plugins: this.getPluginConfiguration(),
      runtime: this.getRuntimeConfiguration(),
      liveComponents: this.getLiveComponentsConfiguration(),
      vite: this.getViteConfiguration(),
      staticFiles: this.getStaticFilesConfiguration(),
      swagger: this.getSwaggerConfiguration(),
      security: this.getSecurityConfiguration(),
      performance: this.getPerformanceConfiguration(),
      database: this.getDatabaseConfiguration(),
      logging: this.getLoggingConfiguration(),
      advanced: this.getAdvancedConfiguration(),
      
      lastUpdated: Date.now(),
      ...initialState
    }
    
    console.log('⚙️ FluxStackConfig component created:', this.id)
  }

  // Get plugin configuration
  private getPluginConfiguration() {
    return [
      {
        name: 'logger',
        version: '1.0.0',
        enabled: true,
        dependencies: [],
        config: {
          level: loggerConfig.level,
          format: 'pretty'
        }
      },
      {
        name: 'vite',
        version: '1.0.0',
        enabled: true,
        dependencies: [],
        config: {
          port: 5173,
          hmr: true
        }
      },
      {
        name: 'static-files',
        version: '1.0.0',
        enabled: true,
        dependencies: [],
        config: {
          publicPath: 'public',
          uploadsPath: 'uploads'
        }
      },
      {
        name: 'live-components',
        version: '1.0.0',
        enabled: true,
        dependencies: [],
        config: {
          websocketPath: '/api/live/ws',
          autoDiscovery: true
        }
      },
      {
        name: 'swagger',
        version: '1.0.0',
        enabled: true,
        dependencies: [],
        config: {
          path: '/swagger',
          title: 'FluxStack API'
        }
      }
    ]
  }

  // Get runtime configuration
  private getRuntimeConfiguration() {
    return {
      nodeVersion: systemRuntimeInfo.nodeVersion,
      bunVersion: systemRuntimeInfo.bunVersion,
      platform: systemRuntimeInfo.platform,
      architecture: systemRuntimeInfo.architecture,
      cpuCount: systemRuntimeInfo.cpuCount,
      totalMemory: systemRuntimeInfo.totalMemory,
      workingDirectory: systemRuntimeInfo.workingDirectory,
      executablePath: systemRuntimeInfo.executablePath
    }
  }

  // Get Live Components configuration
  private getLiveComponentsConfiguration() {
    return {
      enabled: true,
      autoDiscovery: true,
      websocketPath: '/api/live/ws',
      signatureSecret: '***hidden***',
      maxConnections: 1000,
      timeout: 30000
    }
  }

  // Get Vite configuration
  private getViteConfiguration() {
    return {
      enabled: true,
      port: 5173,
      host: 'localhost',
      hmr: true,
      publicDir: 'public',
      buildDir: 'dist'
    }
  }

  // Get Static Files configuration
  private getStaticFilesConfiguration() {
    return {
      enabled: true,
      publicPath: 'public',
      uploadsPath: 'uploads',
      maxFileSize: 10 * 1024 * 1024, // 10MB
      allowedExtensions: ['.jpg', '.png', '.gif', '.pdf', '.txt', '.json']
    }
  }

  // Get Swagger configuration
  private getSwaggerConfiguration() {
    return {
      enabled: true,
      title: 'FluxStack API',
      version: '1.0.0',
      description: 'Modern Full-Stack TypeScript Framework API',
      path: '/swagger'
    }
  }

  // Get Security configuration
  private getSecurityConfiguration() {
    return {
      cors: {
        enabled: true,
        origins: ['http://localhost:5173', 'http://localhost:3000'],
        credentials: true
      },
      rateLimit: {
        enabled: false,
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 100
      },
      helmet: {
        enabled: false,
        options: {}
      }
    }
  }

  // Get Performance configuration
  private getPerformanceConfiguration() {
    return {
      compression: true,
      cache: {
        enabled: false,
        maxAge: 3600,
        strategy: 'memory'
      },
      clustering: {
        enabled: false,
        workers: 1
      }
    }
  }

  // Get Database configuration
  private getDatabaseConfiguration() {
    return {
      enabled: false,
      type: undefined,
      host: undefined,
      port: undefined,
      name: undefined,
      ssl: false
    }
  }

  // Get Logging configuration
  private getLoggingConfiguration() {
    return {
      level: loggerConfig.level as 'debug' | 'info' | 'warn' | 'error',
      format: 'pretty' as 'json' | 'pretty' | 'compact',
      file: {
        enabled: loggerConfig.logToFile,
        path: loggerConfig.logToFile ? 'logs/app.log' : undefined,
        maxSize: loggerConfig.maxSize,
        maxFiles: parseInt(loggerConfig.maxFiles) || undefined
      },
      console: {
        enabled: true,
        colors: loggerConfig.enableColors
      }
    }
  }

  // Get Advanced configuration
  private getAdvancedConfiguration() {
    return {
      hotReload: true,
      typeChecking: true,
      sourceMap: true,
      minification: false,
      bundleAnalyzer: false
    }
  }

  // Refresh all configuration
  async refreshConfiguration() {
    this.setState({
      plugins: this.getPluginConfiguration(),
      runtime: this.getRuntimeConfiguration(),
      liveComponents: this.getLiveComponentsConfiguration(),
      vite: this.getViteConfiguration(),
      staticFiles: this.getStaticFilesConfiguration(),
      swagger: this.getSwaggerConfiguration(),
      security: this.getSecurityConfiguration(),
      performance: this.getPerformanceConfiguration(),
      database: this.getDatabaseConfiguration(),
      logging: this.getLoggingConfiguration(),
      advanced: this.getAdvancedConfiguration(),
      lastUpdated: Date.now()
    })
    
    this.emit('CONFIGURATION_REFRESHED', {
      timestamp: Date.now()
    })
    
    console.log('🔄 FluxStackConfig: Configuration refreshed')
  }

  // Update specific configuration section
  async updateConfiguration(data: { section: string; config: Record<string, any> }) {
    const { section, config } = data

    if (!this.state[section as keyof FluxStackConfigState]) {
      throw new Error(`Invalid configuration section: ${section}`)
    }

    const currentSection = this.state[section as keyof FluxStackConfigState]
    const updatedSection = typeof currentSection === 'object' && currentSection !== null
      ? { ...currentSection as object, ...config }
      : config

    this.setState({
      [section]: updatedSection,
      lastUpdated: Date.now()
    } as Partial<FluxStackConfigState>)
    
    this.emit('CONFIGURATION_UPDATED', {
      section,
      config,
      timestamp: Date.now()
    })
    
    console.log(`⚙️ FluxStackConfig: Updated section '${section}'`, config)
  }

  // Get environment variables
  async getEnvironmentVariables() {
    const envVars = {
      NODE_ENV: appConfig.env,
      PORT: serverConfig.port.toString(),
      HOST: serverConfig.host,
      LOG_LEVEL: loggerConfig.level,
      // Add other non-sensitive env vars from system config
      PWD: systemConfig.pwd || undefined,
      PATH: systemConfig.path ? '***truncated***' : undefined,
      USER: systemConfig.currentUser,
      HOME: systemConfig.homeDirectory || undefined
    }

    this.emit('ENVIRONMENT_VARIABLES_REQUESTED', {
      count: Object.keys(envVars).length,
      timestamp: Date.now()
    })

    return envVars
  }

  // Export configuration as JSON
  async exportConfiguration() {
    const config = {
      ...this.state,
      exportedAt: new Date().toISOString(),
      exportedBy: 'FluxStack Configuration Manager'
    }
    
    this.emit('CONFIGURATION_EXPORTED', {
      timestamp: Date.now()
    })
    
    console.log('📤 FluxStackConfig: Configuration exported')
    return config
  }

  // Validate configuration
  async validateConfiguration() {
    const issues: string[] = []
    
    // Check port conflicts
    if (this.state.port === this.state.vite.port) {
      issues.push('Server port conflicts with Vite port')
    }
    
    // Check memory usage
    if (this.state.runtime.totalMemory < 2) {
      issues.push('Low system memory (< 2GB)')
    }
    
    // Check required directories
    if (!this.state.staticFiles.publicPath) {
      issues.push('Public directory not configured')
    }
    
    const result = {
      valid: issues.length === 0,
      issues,
      timestamp: Date.now()
    }
    
    this.emit('CONFIGURATION_VALIDATED', result)
    
    console.log(`✅ FluxStackConfig: Validation ${result.valid ? 'passed' : 'failed'}`, 
                { issues: issues.length })
    
    return result
  }

  // Get system health based on configuration
  async getSystemHealth() {
    const health = {
      status: 'healthy' as 'healthy' | 'warning' | 'critical',
      checks: {
        memory: this.state.runtime.totalMemory > 1,
        plugins: this.state.plugins.every(p => p.enabled),
        liveComponents: this.state.liveComponents.enabled,
        vite: this.state.vite.enabled,
        swagger: this.state.swagger.enabled
      },
      score: 0,
      timestamp: Date.now()
    }
    
    const passed = Object.values(health.checks).filter(Boolean).length
    health.score = Math.round((passed / Object.keys(health.checks).length) * 100)
    
    if (health.score < 60) health.status = 'critical'
    else if (health.score < 80) health.status = 'warning'
    
    this.emit('SYSTEM_HEALTH_CHECKED', health)
    
    return health
  }
}