/**
 * Configuration Validation System for FluxStack
 * Provides comprehensive validation with detailed error reporting
 */

import type { FluxStackConfig } from './schema'
import { fluxStackConfigSchema } from './schema'

export interface ValidationError {
  path: string
  message: string
  value?: any
  expected?: string
}

export interface ValidationWarning {
  path: string
  message: string
  suggestion?: string
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  details: {
    errors: ValidationError[]
    warnings: ValidationWarning[]
  }
}

/**
 * JSON Schema validator implementation
 */
class SchemaValidator {
  private validateProperty(
    value: any,
    schema: any,
    path: string = '',
    errors: ValidationError[] = [],
    warnings: ValidationWarning[] = []
  ): void {
    if (schema.type) {
      this.validateType(value, schema, path, errors)
    }
    
    if (schema.properties && typeof value === 'object' && value !== null) {
      this.validateObject(value, schema, path, errors, warnings)
    }
    
    if (schema.items && Array.isArray(value)) {
      this.validateArray(value, schema, path, errors, warnings)
    }
    
    if (schema.enum) {
      this.validateEnum(value, schema, path, errors)
    }
    
    if (schema.pattern && typeof value === 'string') {
      this.validatePattern(value, schema, path, errors)
    }
    
    if (schema.minimum !== undefined && typeof value === 'number') {
      this.validateMinimum(value, schema, path, errors)
    }
    
    if (schema.maximum !== undefined && typeof value === 'number') {
      this.validateMaximum(value, schema, path, errors)
    }
    
    if (schema.minLength !== undefined && typeof value === 'string') {
      this.validateMinLength(value, schema, path, errors)
    }
    
    if (schema.maxLength !== undefined && typeof value === 'string') {
      this.validateMaxLength(value, schema, path, errors)
    }
    
    if (schema.minItems !== undefined && Array.isArray(value)) {
      this.validateMinItems(value, schema, path, errors)
    }
  }
  
  private validateType(value: any, schema: any, path: string, errors: ValidationError[]): void {
    const actualType = Array.isArray(value) ? 'array' : typeof value
    const expectedType = schema.type
    
    if (actualType !== expectedType) {
      errors.push({
        path,
        message: `Expected ${expectedType}, got ${actualType}`,
        value,
        expected: expectedType
      })
    }
  }
  
  private validateObject(
    value: any,
    schema: any,
    path: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // Check required properties
    if (schema.required) {
      for (const requiredProp of schema.required) {
        if (!(requiredProp in value)) {
          errors.push({
            path: path ? `${path}.${requiredProp}` : requiredProp,
            message: `Missing required property '${requiredProp}'`,
            expected: 'required property'
          })
        }
      }
    }
    
    // Validate existing properties
    for (const [key, propValue] of Object.entries(value)) {
      const propPath = path ? `${path}.${key}` : key
      const propSchema = schema.properties?.[key]
      
      if (propSchema) {
        this.validateProperty(propValue, propSchema, propPath, errors, warnings)
      } else if (schema.additionalProperties === false) {
        warnings.push({
          path: propPath,
          message: `Unknown property '${key}'`,
          suggestion: 'Remove this property or add it to the schema'
        })
      }
    }
  }
  
  private validateArray(
    value: any[],
    schema: any,
    path: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    value.forEach((item, index) => {
      const itemPath = `${path}[${index}]`
      this.validateProperty(item, schema.items, itemPath, errors, warnings)
    })
  }
  
  private validateEnum(value: any, schema: any, path: string, errors: ValidationError[]): void {
    if (!schema.enum.includes(value)) {
      errors.push({
        path,
        message: `Value must be one of: ${schema.enum.join(', ')}`,
        value,
        expected: schema.enum.join(' | ')
      })
    }
  }
  
  private validatePattern(value: string, schema: any, path: string, errors: ValidationError[]): void {
    const regex = new RegExp(schema.pattern)
    if (!regex.test(value)) {
      errors.push({
        path,
        message: `Value does not match pattern: ${schema.pattern}`,
        value,
        expected: `pattern: ${schema.pattern}`
      })
    }
  }
  
  private validateMinimum(value: number, schema: any, path: string, errors: ValidationError[]): void {
    if (value < schema.minimum) {
      errors.push({
        path,
        message: `Value must be >= ${schema.minimum}`,
        value,
        expected: `>= ${schema.minimum}`
      })
    }
  }
  
  private validateMaximum(value: number, schema: any, path: string, errors: ValidationError[]): void {
    if (value > schema.maximum) {
      errors.push({
        path,
        message: `Value must be <= ${schema.maximum}`,
        value,
        expected: `<= ${schema.maximum}`
      })
    }
  }
  
  private validateMinLength(value: string, schema: any, path: string, errors: ValidationError[]): void {
    if (value.length < schema.minLength) {
      errors.push({
        path,
        message: `String must be at least ${schema.minLength} characters long`,
        value,
        expected: `length >= ${schema.minLength}`
      })
    }
  }
  
  private validateMaxLength(value: string, schema: any, path: string, errors: ValidationError[]): void {
    if (value.length > schema.maxLength) {
      errors.push({
        path,
        message: `String must be at most ${schema.maxLength} characters long`,
        value,
        expected: `length <= ${schema.maxLength}`
      })
    }
  }
  
  private validateMinItems(value: any[], schema: any, path: string, errors: ValidationError[]): void {
    if (value.length < schema.minItems) {
      errors.push({
        path,
        message: `Array must have at least ${schema.minItems} items`,
        value,
        expected: `length >= ${schema.minItems}`
      })
    }
  }
  
  validate(value: any, schema: any): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []
    
    this.validateProperty(value, schema, '', errors, warnings)
    
    return {
      valid: errors.length === 0,
      errors: errors.map(e => `${e.path}: ${e.message}`),
      warnings: warnings.map(w => `${w.path}: ${w.message}${w.suggestion ? ` (${w.suggestion})` : ''}`),
      details: { errors, warnings }
    }
  }
}

/**
 * Business logic validation rules
 */
class BusinessValidator {
  validate(config: FluxStackConfig): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []
    
    // Port conflict validation
    this.validatePortConflicts(config, errors)
    
    // CORS validation
    this.validateCorsConfiguration(config, warnings)
    
    // Plugin validation
    this.validatePluginConfiguration(config, warnings)
    
    // Build configuration validation
    this.validateBuildConfiguration(config, warnings)
    
    // Environment-specific validation
    this.validateEnvironmentConfiguration(config, warnings)
    
    // Security validation
    this.validateSecurityConfiguration(config, warnings)
    
    return {
      valid: errors.length === 0,
      errors: errors.map(e => `${e.path}: ${e.message}`),
      warnings: warnings.map(w => `${w.path}: ${w.message}${w.suggestion ? ` (${w.suggestion})` : ''}`),
      details: { errors, warnings }
    }
  }
  
  private validatePortConflicts(config: FluxStackConfig, errors: ValidationError[]): void {
    const ports = [config.server.port, config.client.port]
    const uniquePorts = new Set(ports.filter(p => p !== 0)) // 0 means random port
    
    if (uniquePorts.size !== ports.filter(p => p !== 0).length) {
      errors.push({
        path: 'ports',
        message: 'Server and client ports must be different',
        value: { server: config.server.port, client: config.client.port }
      })
    }
  }
  
  private validateCorsConfiguration(config: FluxStackConfig, warnings: ValidationWarning[]): void {
    const { cors } = config.server
    
    // Check for overly permissive CORS
    if (cors.origins.includes('*')) {
      warnings.push({
        path: 'server.cors.origins',
        message: 'Using wildcard (*) for CORS origins is not recommended in production',
        suggestion: 'Specify explicit origins for better security'
      })
    }
    
    // Check for missing common headers
    const commonHeaders = ['Content-Type', 'Authorization']
    const missingHeaders = commonHeaders.filter(h => !cors.headers.includes(h))
    
    if (missingHeaders.length > 0) {
      warnings.push({
        path: 'server.cors.headers',
        message: `Consider adding common headers: ${missingHeaders.join(', ')}`,
        suggestion: 'These headers are commonly needed for API requests'
      })
    }
  }
  
  private validatePluginConfiguration(config: FluxStackConfig, warnings: ValidationWarning[]): void {
    const { enabled, disabled } = config.plugins
    
    // Check for plugins in both enabled and disabled lists
    const conflicts = enabled.filter(p => disabled.includes(p))
    if (conflicts.length > 0) {
      warnings.push({
        path: 'plugins',
        message: `Plugins listed in both enabled and disabled: ${conflicts.join(', ')}`,
        suggestion: 'Remove from one of the lists'
      })
    }
    
    // Check for essential plugins
    const essentialPlugins = ['logger', 'cors']
    const missingEssential = essentialPlugins.filter(p => 
      !enabled.includes(p) || disabled.includes(p)
    )
    
    if (missingEssential.length > 0) {
      warnings.push({
        path: 'plugins.enabled',
        message: `Consider enabling essential plugins: ${missingEssential.join(', ')}`,
        suggestion: 'These plugins provide important functionality'
      })
    }
  }
  
  private validateBuildConfiguration(config: FluxStackConfig, warnings: ValidationWarning[]): void {
    const { build } = config
    
    // Check for development settings in production
    if (process.env.NODE_ENV === 'production') {
      if (!build.optimization.minify) {
        warnings.push({
          path: 'build.optimization.minify',
          message: 'Minification is disabled in production',
          suggestion: 'Enable minification for better performance'
        })
      }
      
      if (!build.optimization.treeshake) {
        warnings.push({
          path: 'build.optimization.treeshake',
          message: 'Tree-shaking is disabled in production',
          suggestion: 'Enable tree-shaking to reduce bundle size'
        })
      }
    }
    
    // Check for conflicting settings
    if (build.optimization.bundleAnalyzer && process.env.NODE_ENV === 'production') {
      warnings.push({
        path: 'build.optimization.bundleAnalyzer',
        message: 'Bundle analyzer is enabled in production',
        suggestion: 'Disable bundle analyzer in production builds'
      })
    }
  }
  
  private validateEnvironmentConfiguration(config: FluxStackConfig, warnings: ValidationWarning[]): void {
    if (config.environments) {
      for (const [env, envConfig] of Object.entries(config.environments)) {
        if (envConfig && typeof envConfig === 'object') {
          // Check for potentially dangerous overrides
          if ('server' in envConfig && envConfig.server && 'port' in envConfig.server) {
            if (envConfig.server.port === 0 && env !== 'test') {
              warnings.push({
                path: `environments.${env}.server.port`,
                message: 'Using random port (0) in non-test environment',
                suggestion: 'Specify a fixed port for predictable deployments'
              })
            }
          }
        }
      }
    }
  }
  
  private validateSecurityConfiguration(config: FluxStackConfig, warnings: ValidationWarning[]): void {
    // Check for missing authentication configuration in production
    if (process.env.NODE_ENV === 'production' && !config.auth?.secret) {
      warnings.push({
        path: 'auth.secret',
        message: 'No authentication secret configured for production',
        suggestion: 'Set JWT_SECRET environment variable for secure authentication'
      })
    }
    
    // Check for weak authentication settings
    if (config.auth?.secret && config.auth.secret.length < 32) {
      warnings.push({
        path: 'auth.secret',
        message: 'Authentication secret is too short',
        suggestion: 'Use at least 32 characters for better security'
      })
    }
    
    // Check for insecure CORS in production
    if (process.env.NODE_ENV === 'production' && config.server.cors.credentials) {
      const hasWildcard = config.server.cors.origins.includes('*')
      if (hasWildcard) {
        warnings.push({
          path: 'server.cors',
          message: 'CORS credentials enabled with wildcard origins in production',
          suggestion: 'Specify explicit origins when using credentials'
        })
      }
    }
  }
}

/**
 * Main configuration validator
 */
export function validateConfig(config: FluxStackConfig): ValidationResult {
  const schemaValidator = new SchemaValidator()
  const businessValidator = new BusinessValidator()
  
  // Validate against JSON schema
  const schemaResult = schemaValidator.validate(config, fluxStackConfigSchema)
  
  // Validate business rules
  const businessResult = businessValidator.validate(config)
  
  // Combine results
  return {
    valid: schemaResult.valid && businessResult.valid,
    errors: [...schemaResult.errors, ...businessResult.errors],
    warnings: [...schemaResult.warnings, ...businessResult.warnings],
    details: {
      errors: [...schemaResult.details.errors, ...businessResult.details.errors],
      warnings: [...schemaResult.details.warnings, ...businessResult.details.warnings]
    }
  }
}

/**
 * Validate configuration and throw on errors
 */
export function validateConfigStrict(config: FluxStackConfig): void {
  const result = validateConfig(config)
  
  if (!result.valid) {
    const errorMessage = [
      'Configuration validation failed:',
      ...result.errors.map(e => `  - ${e}`),
      ...(result.warnings.length > 0 ? ['Warnings:', ...result.warnings.map(w => `  - ${w}`)] : [])
    ].join('\n')
    
    throw new Error(errorMessage)
  }
}

/**
 * Create a configuration validator for a specific environment
 */
export function createEnvironmentValidator(environment: string) {
  return (config: FluxStackConfig): ValidationResult => {
    // Apply environment-specific validation rules
    const result = validateConfig(config)
    
    // Add environment-specific warnings/errors
    if (environment === 'production') {
      // Additional production validations
      if (config.logging.level === 'debug') {
        result.warnings.push('Debug logging enabled in production - consider using "warn" or "error"')
      }
      
      if (!config.monitoring.enabled) {
        result.warnings.push('Monitoring is disabled in production - consider enabling for better observability')
      }
    }
    
    if (environment === 'development') {
      // Additional development validations
      if (config.build.optimization.minify) {
        result.warnings.push('Minification enabled in development - this may slow down builds')
      }
    }
    
    return result
  }
}

/**
 * Validate partial configuration (useful for updates)
 */
export function validatePartialConfig(
  partialConfig: Partial<FluxStackConfig>,
  baseConfig: FluxStackConfig
): ValidationResult {
  // Merge partial config with base config
  const mergedConfig = { ...baseConfig, ...partialConfig }
  
  // Validate the merged configuration
  return validateConfig(mergedConfig)
}

/**
 * Get validation suggestions for improving configuration
 */
export function getConfigSuggestions(config: FluxStackConfig): string[] {
  const result = validateConfig(config)
  const suggestions: string[] = []
  
  // Extract suggestions from warnings
  for (const warning of result.details.warnings) {
    if (warning.suggestion) {
      suggestions.push(`${warning.path}: ${warning.suggestion}`)
    }
  }
  
  // Add general suggestions based on configuration
  if (!config.monitoring.enabled) {
    suggestions.push('Consider enabling monitoring for better observability')
  }
  
  if (config.plugins.enabled.length === 0) {
    suggestions.push('Consider enabling some plugins to extend functionality')
  }
  
  if (!config.database && !config.custom?.database) {
    suggestions.push('Consider adding database configuration if your app needs persistence')
  }
  
  return suggestions
}