/**
 * Environment Configuration System
 * Centralizes all environment variable handling for FluxStack
 */

export interface EnvironmentConfig {
  // Core application settings
  NODE_ENV: 'development' | 'production' | 'test'
  HOST: string
  
  // Server configuration
  PORT: number
  FRONTEND_PORT: number
  BACKEND_PORT: number
  
  // API configuration
  VITE_API_URL: string
  API_URL: string
  
  // CORS configuration
  CORS_ORIGINS: string[]
  CORS_METHODS: string[]
  CORS_HEADERS: string[]
  
  // Logging
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error'
  
  // Build configuration
  BUILD_TARGET: string
  BUILD_OUTDIR: string
  
  // Database (optional)
  DATABASE_URL?: string
  DATABASE_HOST?: string
  DATABASE_PORT?: number
  DATABASE_NAME?: string
  DATABASE_USER?: string
  DATABASE_PASSWORD?: string
  
  // Authentication (optional)
  JWT_SECRET?: string
  JWT_EXPIRES_IN?: string
  
  // External services (optional)
  STRIPE_SECRET_KEY?: string
  STRIPE_PUBLISHABLE_KEY?: string
  
  // Email service (optional)
  SMTP_HOST?: string
  SMTP_PORT?: number
  SMTP_USER?: string
  SMTP_PASS?: string
  
  // File upload (optional)
  UPLOAD_PATH?: string
  MAX_FILE_SIZE?: number
}

/**
 * Default environment configuration
 */
const defaultConfig: EnvironmentConfig = {
  NODE_ENV: 'development',
  HOST: 'localhost',
  PORT: 3000,
  FRONTEND_PORT: 5173,
  BACKEND_PORT: 3001,
  VITE_API_URL: 'http://localhost:3000',
  API_URL: 'http://localhost:3001',
  CORS_ORIGINS: ['http://localhost:3000', 'http://localhost:5173'],
  CORS_METHODS: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  CORS_HEADERS: ['Content-Type', 'Authorization'],
  LOG_LEVEL: 'info',
  BUILD_TARGET: 'bun',
  BUILD_OUTDIR: 'dist'
}

/**
 * Parse environment variable to appropriate type
 */
function parseEnvValue(value: string | undefined, defaultValue: any): any {
  if (value === undefined) return defaultValue
  
  // Handle arrays (comma-separated values)
  if (Array.isArray(defaultValue)) {
    return value.split(',').map(v => v.trim())
  }
  
  // Handle numbers
  if (typeof defaultValue === 'number') {
    const parsed = parseInt(value, 10)
    return isNaN(parsed) ? defaultValue : parsed
  }
  
  // Handle booleans
  if (typeof defaultValue === 'boolean') {
    return value.toLowerCase() === 'true'
  }
  
  // Handle strings
  return value
}

/**
 * Load and validate environment configuration
 */
export function loadEnvironmentConfig(): EnvironmentConfig {
  const config: EnvironmentConfig = {} as EnvironmentConfig
  
  // Load each configuration value
  for (const [key, defaultValue] of Object.entries(defaultConfig)) {
    const envValue = process.env[key]
    config[key as keyof EnvironmentConfig] = parseEnvValue(envValue, defaultValue) as any
  }
  
  // Load optional values
  const optionalKeys: (keyof EnvironmentConfig)[] = [
    'DATABASE_URL', 'DATABASE_HOST', 'DATABASE_PORT', 'DATABASE_NAME', 
    'DATABASE_USER', 'DATABASE_PASSWORD', 'JWT_SECRET', 'JWT_EXPIRES_IN',
    'STRIPE_SECRET_KEY', 'STRIPE_PUBLISHABLE_KEY', 'SMTP_HOST', 'SMTP_PORT',
    'SMTP_USER', 'SMTP_PASS', 'UPLOAD_PATH', 'MAX_FILE_SIZE'
  ]
  
  for (const key of optionalKeys) {
    const envValue = process.env[key]
    if (envValue !== undefined) {
      if (key.includes('PORT') || key === 'MAX_FILE_SIZE') {
        config[key] = parseInt(envValue, 10) as any
      } else {
        config[key] = envValue as any
      }
    }
  }
  
  return config
}

/**
 * Validate required environment variables
 */
export function validateEnvironmentConfig(config: EnvironmentConfig): void {
  const errors: string[] = []
  
  // Validate NODE_ENV
  if (!['development', 'production', 'test'].includes(config.NODE_ENV)) {
    errors.push('NODE_ENV must be one of: development, production, test')
  }
  
  // Validate ports
  if (config.PORT < 1 || config.PORT > 65535) {
    errors.push('PORT must be between 1 and 65535')
  }
  
  if (config.FRONTEND_PORT < 1 || config.FRONTEND_PORT > 65535) {
    errors.push('FRONTEND_PORT must be between 1 and 65535')
  }
  
  if (config.BACKEND_PORT < 1 || config.BACKEND_PORT > 65535) {
    errors.push('BACKEND_PORT must be between 1 and 65535')
  }
  
  // Validate log level
  if (!['debug', 'info', 'warn', 'error'].includes(config.LOG_LEVEL)) {
    errors.push('LOG_LEVEL must be one of: debug, info, warn, error')
  }
  
  // Validate CORS origins
  if (!Array.isArray(config.CORS_ORIGINS) || config.CORS_ORIGINS.length === 0) {
    errors.push('CORS_ORIGINS must be a non-empty array')
  }
  
  if (errors.length > 0) {
    throw new Error(`Environment configuration errors:\n${errors.join('\n')}`)
  }
}

/**
 * Get environment configuration (singleton)
 */
let environmentConfig: EnvironmentConfig | null = null

export function getEnvironmentConfig(): EnvironmentConfig {
  if (environmentConfig === null) {
    environmentConfig = loadEnvironmentConfig()
    validateEnvironmentConfig(environmentConfig)
  }
  
  return environmentConfig
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  return getEnvironmentConfig().NODE_ENV === 'development'
}

/**
 * Check if running in production mode
 */
export function isProduction(): boolean {
  return getEnvironmentConfig().NODE_ENV === 'production'
}

/**
 * Check if running in test mode
 */
export function isTest(): boolean {
  return getEnvironmentConfig().NODE_ENV === 'test'
}

/**
 * Get database configuration if available
 */
export function getDatabaseConfig() {
  const config = getEnvironmentConfig()
  
  if (config.DATABASE_URL) {
    return { url: config.DATABASE_URL }
  }
  
  if (config.DATABASE_HOST && config.DATABASE_NAME) {
    return {
      host: config.DATABASE_HOST,
      port: config.DATABASE_PORT || 5432,
      database: config.DATABASE_NAME,
      user: config.DATABASE_USER,
      password: config.DATABASE_PASSWORD
    }
  }
  
  return null
}

/**
 * Get authentication configuration if available
 */
export function getAuthConfig() {
  const config = getEnvironmentConfig()
  
  if (config.JWT_SECRET) {
    return {
      secret: config.JWT_SECRET,
      expiresIn: config.JWT_EXPIRES_IN || '24h'
    }
  }
  
  return null
}

/**
 * Get SMTP configuration if available
 */
export function getSmtpConfig() {
  const config = getEnvironmentConfig()
  
  if (config.SMTP_HOST && config.SMTP_USER && config.SMTP_PASS) {
    return {
      host: config.SMTP_HOST,
      port: config.SMTP_PORT || 587,
      user: config.SMTP_USER,
      pass: config.SMTP_PASS
    }
  }
  
  return null
}