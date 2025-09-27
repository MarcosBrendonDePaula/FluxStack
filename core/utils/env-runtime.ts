/**
 * Runtime Environment Loader V2 - Simplified API
 * Mais elegante com casting automático e acesso direto
 */

/**
 * Enhanced environment variable loader with smart casting
 */
class SmartEnvLoader {
  private envAccessor: () => Record<string, string | undefined>

  constructor() {
    this.envAccessor = this.createDynamicAccessor()
  }

  private createDynamicAccessor(): () => Record<string, string | undefined> {
    const globalScope = globalThis as any
    
    return () => {
      // Try Bun.env first (most reliable in Bun runtime)
      if (globalScope['Bun'] && globalScope['Bun']['env']) {
        return globalScope['Bun']['env']
      }
      
      // Fallback to process.env with dynamic access
      if (globalScope['process'] && globalScope['process']['env']) {
        return globalScope['process']['env']
      }
      
      // Final fallback
      const proc = eval('typeof process !== "undefined" ? process : null')
      return proc?.env || {}
    }
  }

  /**
   * Smart get with automatic type conversion based on default value
   */
  get<T>(key: string, defaultValue?: T): T {
    const env = this.envAccessor()
    const value = env[key]
    
    if (!value || value === '') {
      return defaultValue as T
    }

    // Auto-detect type from default value
    if (typeof defaultValue === 'number') {
      const parsed = parseInt(value, 10)
      return (isNaN(parsed) ? defaultValue : parsed) as T
    }

    if (typeof defaultValue === 'boolean') {
      return ['true', '1', 'yes', 'on'].includes(value.toLowerCase()) as T
    }

    if (Array.isArray(defaultValue)) {
      return value.split(',').map(v => v.trim()).filter(Boolean) as T
    }

    if (typeof defaultValue === 'object' && defaultValue !== null) {
      try {
        return JSON.parse(value) as T
      } catch {
        return defaultValue
      }
    }

    return value as T
  }

  /**
   * Check if environment variable exists
   */
  has(key: string): boolean {
    const env = this.envAccessor()
    return key in env && env[key] !== undefined && env[key] !== ''
  }

  /**
   * Get all environment variables
   */
  all(): Record<string, string> {
    const env = this.envAccessor()
    const result: Record<string, string> = {}
    
    for (const [key, value] of Object.entries(env)) {
      if (value !== undefined && value !== '') {
        result[key] = value
      }
    }
    
    return result
  }
}

// Create singleton instance
const smartEnv = new SmartEnvLoader()

/**
 * Simplified env API with smart casting
 */
export const env = {
  /**
   * Smart get - automatically casts based on default value type
   * Usage:
   *   env.get('PORT', 3000)           -> number
   *   env.get('DEBUG', false)         -> boolean
   *   env.get('ORIGINS', ['*'])       -> string[]
   *   env.get('HOST', 'localhost')    -> string
   */
  get: <T>(key: string, defaultValue?: T): T => smartEnv.get(key, defaultValue),

  /**
   * Check if env var exists
   */
  has: (key: string) => smartEnv.has(key),

  /**
   * Get number value
   */
  num: (key: string, defaultValue?: number) => Number(smartEnv.get(key, defaultValue?.toString() || '0')),

  /**
   * Get boolean value
   */
  bool: (key: string, defaultValue?: boolean) => smartEnv.get(key, defaultValue?.toString() || 'false') === 'true',

  /**
   * Get array value
   */
  array: (key: string, defaultValue?: string[]) => smartEnv.get(key, defaultValue?.join(',') || '').split(',').filter(Boolean),

  /**
   * Get all env vars
   */
  all: () => smartEnv.all(),

  // Common environment variables as properties with smart defaults
  get NODE_ENV() { return this.get('NODE_ENV', 'development') },
  get PORT() { return this.get('PORT', 3000) },
  get HOST() { return this.get('HOST', 'localhost') },
  get DEBUG() { return this.get('DEBUG', false) },
  get LOG_LEVEL() { return this.get('LOG_LEVEL', 'info') },
  get DATABASE_URL() { return this.get('DATABASE_URL', '') },
  get JWT_SECRET() { return this.get('JWT_SECRET', '') },
  get CORS_ORIGINS() { return this.get('CORS_ORIGINS', ['*']) },
  get VITE_PORT() { return this.get('VITE_PORT', 5173) },
  get API_PREFIX() { return this.get('API_PREFIX', '/api') },

  // App specific
  get FLUXSTACK_APP_NAME() { return this.get('FLUXSTACK_APP_NAME', 'FluxStack') },
  get FLUXSTACK_APP_VERSION() { return this.get('FLUXSTACK_APP_VERSION', '1.0.0') },

  // Monitoring
  get ENABLE_MONITORING() { return this.get('ENABLE_MONITORING', false) },
  get ENABLE_SWAGGER() { return this.get('ENABLE_SWAGGER', true) },
  get ENABLE_METRICS() { return this.get('ENABLE_METRICS', false) },

  // Database
  get DB_HOST() { return this.get('DB_HOST', 'localhost') },
  get DB_PORT() { return this.get('DB_PORT', 5432) },
  get DB_NAME() { return this.get('DB_NAME', '') },
  get DB_USER() { return this.get('DB_USER', '') },
  get DB_PASSWORD() { return this.get('DB_PASSWORD', '') },
  get DB_SSL() { return this.get('DB_SSL', false) },

  // SMTP
  get SMTP_HOST() { return this.get('SMTP_HOST', '') },
  get SMTP_PORT() { return this.get('SMTP_PORT', 587) },
  get SMTP_USER() { return this.get('SMTP_USER', '') },
  get SMTP_PASSWORD() { return this.get('SMTP_PASSWORD', '') },
  get SMTP_SECURE() { return this.get('SMTP_SECURE', false) }
}

/**
 * Create namespaced environment access
 * Usage: const db = createNamespace('DATABASE_')
 *        db.get('URL') -> reads DATABASE_URL
 */
export function createNamespace(prefix: string) {
  return {
    get: <T>(key: string, defaultValue?: T): T => 
      smartEnv.get(`${prefix}${key}`, defaultValue),
    
    has: (key: string) => smartEnv.has(`${prefix}${key}`),
    
    all: () => {
      const allEnv = smartEnv.all()
      const namespaced: Record<string, string> = {}
      
      for (const [key, value] of Object.entries(allEnv)) {
        if (key.startsWith(prefix)) {
          namespaced[key.slice(prefix.length)] = value
        }
      }
      
      return namespaced
    }
  }
}

/**
 * Environment validation
 */
export const validate = {
  require(keys: string[]): void {
    const missing = keys.filter(key => !smartEnv.has(key))
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
    }
  },

  oneOf(key: string, validValues: string[]): void {
    const value = smartEnv.get(key, '')
    if (value && !validValues.includes(value)) {
      throw new Error(`${key} must be one of: ${validValues.join(', ')}, got: ${value}`)
    }
  },

  validate(key: string, validator: (value: string) => boolean, errorMessage: string): void {
    const value = smartEnv.get(key, '')
    if (value && !validator(value)) {
      throw new Error(`${key}: ${errorMessage}`)
    }
  }
}

/**
 * Convenience functions
 */
export const helpers = {
  isDevelopment: () => env.NODE_ENV === 'development',
  isProduction: () => env.NODE_ENV === 'production',
  isTest: () => env.NODE_ENV === 'test',
  
  getDatabaseUrl: () => {
    const url = env.DATABASE_URL
    if (url) return url
    
    const { DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD } = env
    if (DB_HOST && DB_NAME) {
      const auth = DB_USER ? `${DB_USER}:${DB_PASSWORD}@` : ''
      return `postgres://${auth}${DB_HOST}:${DB_PORT}/${DB_NAME}`
    }
    
    return null
  },

  getServerUrl: () => `http://${env.HOST}:${env.PORT}`,
  getClientUrl: () => `http://${env.HOST}:${env.VITE_PORT}`
}

export default env

// Legacy exports for compatibility
export const runtimeEnv = env
export const envValidation = validate
export const createEnvNamespace = createNamespace