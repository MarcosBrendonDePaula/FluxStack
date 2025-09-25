/**
 * Configuration Loader for FluxStack
 * Handles loading, merging, and environment variable integration
 */

import { existsSync } from 'fs'
import { join } from 'path'
import type {
    FluxStackConfig
} from './schema'
import {
    defaultFluxStackConfig,
    environmentDefaults
} from './schema'

export interface ConfigLoadOptions {
    configPath?: string
    environment?: string
    envPrefix?: string
    validateSchema?: boolean
}

export interface ConfigLoadResult {
    config: FluxStackConfig
    sources: string[]
    warnings: string[]
    errors: string[]
}

export interface ValidationResult {
    valid: boolean
    errors: ValidationError[]
    warnings: ValidationWarning[]
}

export interface ValidationError {
    path: string
    message: string
    value?: any
}

export interface ValidationWarning {
    path: string
    message: string
    value?: any
}

/**
 * Environment variable mapping for FluxStack configuration
 */
const ENV_MAPPINGS = {
    // App configuration
    'FLUXSTACK_APP_NAME': 'app.name',
    'FLUXSTACK_APP_VERSION': 'app.version',
    'FLUXSTACK_APP_DESCRIPTION': 'app.description',

    // Server configuration
    'PORT': 'server.port',
    'FLUXSTACK_PORT': 'server.port',
    'HOST': 'server.host',
    'FLUXSTACK_API_PREFIX': 'server.apiPrefix',
    'CORS_ORIGINS': 'server.cors.origins',
    'FLUXSTACK_CORS_ORIGINS': 'server.cors.origins',
    'CORS_METHODS': 'server.cors.methods',
    'FLUXSTACK_CORS_METHODS': 'server.cors.methods',
    'CORS_HEADERS': 'server.cors.headers',
    'FLUXSTACK_CORS_HEADERS': 'server.cors.headers',
    'CORS_CREDENTIALS': 'server.cors.credentials',
    'FLUXSTACK_CORS_CREDENTIALS': 'server.cors.credentials',
    'CORS_MAX_AGE': 'server.cors.maxAge',
    'FLUXSTACK_CORS_MAX_AGE': 'server.cors.maxAge',

    // Client configuration
    'VITE_PORT': 'client.port',
    'FLUXSTACK_CLIENT_PORT': 'client.port',
    'FLUXSTACK_PROXY_TARGET': 'client.proxy.target',
    'FLUXSTACK_CLIENT_SOURCEMAPS': 'client.build.sourceMaps',
    'FLUXSTACK_CLIENT_MINIFY': 'client.build.minify',
    'FLUXSTACK_CLIENT_TARGET': 'client.build.target',
    'FLUXSTACK_CLIENT_OUTDIR': 'client.build.outDir',

    // Build configuration
    'FLUXSTACK_BUILD_TARGET': 'build.target',
    'FLUXSTACK_BUILD_OUTDIR': 'build.outDir',
    'FLUXSTACK_BUILD_SOURCEMAPS': 'build.sourceMaps',
    'FLUXSTACK_BUILD_CLEAN': 'build.clean',
    'FLUXSTACK_BUILD_MINIFY': 'build.optimization.minify',
    'FLUXSTACK_BUILD_TREESHAKE': 'build.optimization.treeshake',
    'FLUXSTACK_BUILD_COMPRESS': 'build.optimization.compress',
    'FLUXSTACK_BUILD_SPLIT_CHUNKS': 'build.optimization.splitChunks',
    'FLUXSTACK_BUILD_ANALYZER': 'build.optimization.bundleAnalyzer',

    // Logging configuration
    'LOG_LEVEL': 'logging.level',
    'FLUXSTACK_LOG_LEVEL': 'logging.level',
    'LOG_FORMAT': 'logging.format',
    'FLUXSTACK_LOG_FORMAT': 'logging.format',

    // Monitoring configuration
    'MONITORING_ENABLED': 'monitoring.enabled',
    'FLUXSTACK_MONITORING_ENABLED': 'monitoring.enabled',
    'METRICS_ENABLED': 'monitoring.metrics.enabled',
    'FLUXSTACK_METRICS_ENABLED': 'monitoring.metrics.enabled',
    'METRICS_INTERVAL': 'monitoring.metrics.collectInterval',
    'FLUXSTACK_METRICS_INTERVAL': 'monitoring.metrics.collectInterval',
    'PROFILING_ENABLED': 'monitoring.profiling.enabled',
    'FLUXSTACK_PROFILING_ENABLED': 'monitoring.profiling.enabled',
    'PROFILING_SAMPLE_RATE': 'monitoring.profiling.sampleRate',
    'FLUXSTACK_PROFILING_SAMPLE_RATE': 'monitoring.profiling.sampleRate',

    // Plugin configuration
    'FLUXSTACK_PLUGINS_ENABLED': 'plugins.enabled',
    'FLUXSTACK_PLUGINS_DISABLED': 'plugins.disabled'
} as const

/**
 * Parse environment variable value to appropriate type
 */
function parseEnvValue(value: string, targetType?: string): any {
    if (!value) return undefined

    // Handle different types based on target or value format
    if (targetType === 'number' || /^\d+$/.test(value)) {
        const parsed = parseInt(value, 10)
        return isNaN(parsed) ? undefined : parsed
    }

    if (targetType === 'boolean' || ['true', 'false', '1', '0'].includes(value.toLowerCase())) {
        return ['true', '1'].includes(value.toLowerCase())
    }

    if (targetType === 'array' || value.includes(',')) {
        return value.split(',').map(v => v.trim()).filter(Boolean)
    }

    // Try to parse as JSON for complex objects
    if (value.startsWith('{') || value.startsWith('[')) {
        try {
            return JSON.parse(value)
        } catch {
            // Fall back to string if JSON parsing fails
        }
    }

    return value
}

/**
 * Set nested object property using dot notation
 */
function setNestedProperty(obj: any, path: string, value: any): void {
    const keys = path.split('.')
    let current = obj

    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i]
        if (!(key in current) || typeof current[key] !== 'object') {
            current[key] = {}
        }
        current = current[key]
    }

    current[keys[keys.length - 1]] = value
}

/**
 * Get nested object property using dot notation
 */
function getNestedProperty(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
}

/**
 * Deep merge two configuration objects
 */
function deepMerge(target: any, source: any): any {
    if (!source || typeof source !== 'object') return target
    if (!target || typeof target !== 'object') return source

    const result = { ...target }

    for (const key in source) {
        if (source.hasOwnProperty(key)) {
            if (Array.isArray(source[key])) {
                result[key] = [...source[key]]
            } else if (typeof source[key] === 'object' && source[key] !== null) {
                result[key] = deepMerge(target[key], source[key])
            } else {
                result[key] = source[key]
            }
        }
    }

    return result
}

/**
 * Load configuration from environment variables
 */
function loadFromEnvironment(prefix = 'FLUXSTACK_'): Partial<FluxStackConfig> {
    const config: any = {}

    // Process known environment variable mappings
    for (const [envKey, configPath] of Object.entries(ENV_MAPPINGS)) {
        const envValue = process.env[envKey]
        if (envValue !== undefined && envValue !== '') {
            try {
                // Determine target type from config path
                let targetType = 'string'
                if (configPath.includes('port') || configPath.includes('maxAge') || configPath.includes('collectInterval') || configPath.includes('sampleRate')) {
                    targetType = 'number'
                } else if (configPath.includes('origins') || configPath.includes('methods') || configPath.includes('headers') || configPath.includes('exporters') || configPath.includes('plugins.enabled') || configPath.includes('plugins.disabled')) {
                    targetType = 'array'
                } else if (configPath.includes('enabled') || configPath.includes('credentials') || configPath.includes('minify') || configPath.includes('treeshake') || configPath.includes('compress') || configPath.includes('splitChunks') || configPath.includes('bundleAnalyzer') || configPath.includes('sourceMaps') || configPath.includes('clean')) {
                    targetType = 'boolean'
                }

                const parsedValue = parseEnvValue(envValue, targetType)
                if (parsedValue !== undefined) {
                    setNestedProperty(config, configPath, parsedValue)
                }
            } catch (error) {
                console.warn(`Failed to parse environment variable ${envKey}: ${error}`)
            }
        }
    }

    // Process custom environment variables with prefix
    for (const [key, value] of Object.entries(process.env)) {
        if (key.startsWith(prefix) && !ENV_MAPPINGS[key as keyof typeof ENV_MAPPINGS] && value !== undefined && value !== '') {
            const configKey = key.slice(prefix.length).toLowerCase().replace(/_/g, '.')
            try {
                const parsedValue = parseEnvValue(value!)
                if (parsedValue !== undefined) {
                    if (!config.custom) config.custom = {}
                    config.custom[configKey] = parsedValue
                }
            } catch (error) {
                console.warn(`Failed to parse custom environment variable ${key}: ${error}`)
            }
        }
    }

    return config
}

/**
 * Load configuration from file
 */
async function loadFromFile(configPath: string): Promise<Partial<FluxStackConfig>> {
    if (!existsSync(configPath)) {
        throw new Error(`Configuration file not found: ${configPath}`)
    }

    try {
        // Dynamic import to support both .ts and .js files
        const configModule = await import(configPath)
        const config = configModule.default || configModule.config || configModule

        if (typeof config === 'function') {
            return config()
        }

        return config
    } catch (error) {
        throw new Error(`Failed to load configuration from ${configPath}: ${error}`)
    }
}

/**
 * Find configuration file in common locations
 */
function findConfigFile(startDir = process.cwd()): string | null {
    const configNames = [
        'fluxstack.config.ts',
        'fluxstack.config.js',
        'fluxstack.config.mjs',
        'config/fluxstack.config.ts',
        'config/fluxstack.config.js'
    ]

    for (const name of configNames) {
        const fullPath = join(startDir, name)
        if (existsSync(fullPath)) {
            return fullPath
        }
    }

    return null
}

/**
 * Apply environment-specific configuration
 */
export function applyEnvironmentConfig(
    config: FluxStackConfig,
    environment: string
): FluxStackConfig {
    const envDefaults = environmentDefaults[environment as keyof typeof environmentDefaults]
    const envOverrides = config.environments?.[environment]

    let result = config

    // Apply environment defaults only for values that haven't been explicitly set
    if (envDefaults) {
        result = smartMerge(result, envDefaults)
    }

    // Apply environment-specific overrides from config
    if (envOverrides) {
        result = deepMerge(result, envOverrides)
    }

    return result
}

/**
 * Smart merge that only applies defaults for undefined values
 */
function smartMerge(target: any, defaults: any): any {
    if (!defaults || typeof defaults !== 'object') return target
    if (!target || typeof target !== 'object') return defaults

    const result = { ...target }

    for (const key in defaults) {
        if (defaults.hasOwnProperty(key)) {
            if (target[key] === undefined) {
                // Value not set in target, use default
                result[key] = defaults[key]
            } else if (typeof defaults[key] === 'object' && defaults[key] !== null && !Array.isArray(defaults[key])) {
                // Recursively merge nested objects
                result[key] = smartMerge(target[key], defaults[key])
            }
            // Otherwise keep the target value (don't override)
        }
    }

    return result
}

/**
 * Main configuration loader
 */
export async function loadConfig(options: ConfigLoadOptions = {}): Promise<ConfigLoadResult> {
    const {
        configPath,
        environment = process.env.NODE_ENV || 'development',
        envPrefix = 'FLUXSTACK_',
        validateSchema = true
    } = options

    const sources: string[] = []
    const warnings: string[] = []
    const errors: string[] = []

    try {
        // Start with default configuration
        let config: FluxStackConfig = JSON.parse(JSON.stringify(defaultFluxStackConfig))
        sources.push('defaults')

        // Load from configuration file
        let fileConfig: any = null
        const actualConfigPath = configPath || findConfigFile()
        if (actualConfigPath) {
            try {
                fileConfig = await loadFromFile(actualConfigPath)
                config = deepMerge(config, fileConfig)
                sources.push(`file:${actualConfigPath}`)
            } catch (error) {
                errors.push(`Failed to load config file: ${error}`)
            }
        } else if (configPath) {
            errors.push(`Specified config file not found: ${configPath}`)
        }

        // Load from environment variables
        const envConfig = loadFromEnvironment(envPrefix)
        if (Object.keys(envConfig).length > 0) {
            config = deepMerge(config, envConfig)
            sources.push('environment')
        }

        // Apply environment-specific configuration (only if no file config or env vars override)
        const envDefaults = environmentDefaults[environment as keyof typeof environmentDefaults]
        if (envDefaults) {
            // Apply environment defaults but don't override existing values
            config = smartMerge(config, envDefaults)
            sources.push(`environment:${environment}`)
        }

        // Validate configuration if requested
        if (validateSchema) {
            try {
                const { validateConfig } = await import('./validator')
                const validationResult = validateConfig(config)

                if (!validationResult.valid) {
                    errors.push(...validationResult.errors)
                }

                warnings.push(...validationResult.warnings)
            } catch (error) {
                warnings.push(`Validation failed: ${error}`)
            }
        }

        return {
            config,
            sources,
            warnings,
            errors
        }
    } catch (error) {
        errors.push(`Configuration loading failed: ${error}`)

        return {
            config: defaultFluxStackConfig,
            sources: ['defaults'],
            warnings,
            errors
        }
    }
}

/**
 * Load configuration synchronously (limited functionality)
 */
export function loadConfigSync(options: ConfigLoadOptions = {}): ConfigLoadResult {
    const {
        environment = process.env.NODE_ENV || 'development',
        envPrefix = 'FLUXSTACK_'
    } = options

    const sources: string[] = []
    const warnings: string[] = []
    const errors: string[] = []

    try {
        // Start with default configuration
        let config: FluxStackConfig = JSON.parse(JSON.stringify(defaultFluxStackConfig))
        sources.push('defaults')

        // Load from environment variables
        const envConfig = loadFromEnvironment(envPrefix)
        if (Object.keys(envConfig).length > 0) {
            config = deepMerge(config, envConfig)
            sources.push('environment')
        }

        // Apply environment-specific configuration
        const envDefaults = environmentDefaults[environment as keyof typeof environmentDefaults]
        if (envDefaults) {
            // Apply environment defaults first
            const configWithEnvDefaults = deepMerge(config, envDefaults)
            
            // Re-apply environment variables last (highest priority)
            if (Object.keys(envConfig).length > 0) {
                config = deepMerge(configWithEnvDefaults, envConfig)
            } else {
                config = configWithEnvDefaults
            }
            
            sources.push(`environment:${environment}`)
        } else if (environment !== 'development') {
            // Still add the environment source even if no defaults
            sources.push(`environment:${environment}`)
        }

        return {
            config,
            sources,
            warnings,
            errors
        }
    } catch (error) {
        errors.push(`Synchronous configuration loading failed: ${error}`)

        return {
            config: defaultFluxStackConfig,
            sources: ['defaults'],
            warnings,
            errors
        }
    }
}

/**
 * Get configuration value using dot notation
 */
export function getConfigValue<T = any>(config: FluxStackConfig, path: string): T | undefined
export function getConfigValue<T = any>(config: FluxStackConfig, path: string, defaultValue: T): T
export function getConfigValue<T = any>(config: FluxStackConfig, path: string, defaultValue?: T): T | undefined {
    const value = getNestedProperty(config, path)
    return value !== undefined ? value : defaultValue
}

/**
 * Check if configuration has a specific value
 */
export function hasConfigValue(config: FluxStackConfig, path: string): boolean {
    return getNestedProperty(config, path) !== undefined
}

/**
 * Create a configuration subset for a specific plugin or module
 */
export function createConfigSubset(
    config: FluxStackConfig,
    paths: string[]
): Record<string, any> {
    const subset: Record<string, any> = {}

    for (const path of paths) {
        const value = getNestedProperty(config, path)
        if (value !== undefined) {
            setNestedProperty(subset, path, value)
        }
    }

    return subset
}