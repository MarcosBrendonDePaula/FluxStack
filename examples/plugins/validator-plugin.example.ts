/**
 * Example: Auto-Validator Plugin
 * Demonstrates use of Validation hooks and Filters
 */

import type { FluxStack, RequestContext, ValidationContext, ErrorContext } from "@/core/plugins/types"

type Plugin = FluxStack.Plugin

export const autoValidatorPlugin: Plugin = {
  name: 'auto-validator',
  version: '1.0.0',
  description: 'Automatic request/response validation plugin',
  author: 'FluxStack Team',
  category: 'validation',
  tags: ['validation', 'security', 'data-integrity'],
  priority: 'high',

  // ✅ Validate request body
  onRequestBody: async (ctx: RequestContext) => {
    // Check if route has validation schema
    const route = (ctx as any).route
    if (!route?.validation?.body) return

    const validationCtx: ValidationContext = {
      data: ctx.body,
      schema: route.validation.body,
      errors: [],
      valid: true,
      validationType: 'body'
    }

    // Perform validation
    await validateAgainstSchema(validationCtx)

    if (!validationCtx.valid) {
      throw new ValidationError('Invalid request body', validationCtx.errors)
    }

    // Update body with sanitized data if available
    if (validationCtx.sanitized) {
      ctx.body = validationCtx.sanitized
    }
  },

  // ✅ Validate query params
  onRequestQuery: async (ctx: RequestContext) => {
    const route = (ctx as any).route
    if (!route?.validation?.query) return

    const validationCtx: ValidationContext = {
      data: ctx.query,
      schema: route.validation.query,
      errors: [],
      valid: true,
      validationType: 'query'
    }

    await validateAgainstSchema(validationCtx)

    if (!validationCtx.valid) {
      throw new ValidationError('Invalid query parameters', validationCtx.errors)
    }

    if (validationCtx.sanitized) {
      ctx.query = validationCtx.sanitized
    }
  },

  // ✅ Validate route params
  onRequestParams: async (ctx: RequestContext) => {
    const route = (ctx as any).route
    if (!route?.validation?.params) return

    const validationCtx: ValidationContext = {
      data: ctx.params,
      schema: route.validation.params,
      errors: [],
      valid: true,
      validationType: 'params'
    }

    await validateAgainstSchema(validationCtx)

    if (!validationCtx.valid) {
      throw new ValidationError('Invalid route parameters', validationCtx.errors)
    }
  },

  // ✅ Generic validation hook
  onValidate: async (ctx: ValidationContext) => {
    // Apply custom business rules
    if (ctx.data.email && !isValidEmail(ctx.data.email)) {
      ctx.errors.push({
        field: 'email',
        message: 'Invalid email format',
        value: ctx.data.email,
        rule: 'email'
      })
      ctx.valid = false
    }

    // Check for SQL injection attempts
    if (ctx.data.query && containsSQLInjection(ctx.data.query)) {
      ctx.errors.push({
        field: 'query',
        message: 'Potential SQL injection detected',
        value: '[REDACTED]',
        rule: 'security'
      })
      ctx.valid = false
    }
  },

  // ✅ Sanitize data
  onSanitize: async (ctx: ValidationContext) => {
    const sanitized = { ...ctx.data }

    // Remove sensitive fields
    delete sanitized.password
    delete sanitized.token
    delete sanitized.apiKey
    delete sanitized.secret

    // Trim strings
    for (const [key, value] of Object.entries(sanitized)) {
      if (typeof value === 'string') {
        sanitized[key] = value.trim()
      }
    }

    // Escape HTML
    for (const [key, value] of Object.entries(sanitized)) {
      if (typeof value === 'string') {
        sanitized[key] = escapeHTML(value)
      }
    }

    ctx.sanitized = sanitized
  },

  // ✅ Handle validation errors
  onValidationError: async (ctx: ErrorContext) => {
    const error = ctx.error as any

    if (error.validationErrors) {
      ctx.response = new Response(
        JSON.stringify({
          error: 'Validation failed',
          message: error.message,
          errors: error.validationErrors,
          timestamp: Date.now()
        }),
        {
          status: 422,
          headers: { 'Content-Type': 'application/json' }
        }
      )

      ctx.handled = true
      ctx.errorType = 'validation'
    }
  },

  // ✅ Filters for data transformation
  filters: {
    // Filter request body - sanitize before processing
    filterRequestBody: async (data: any, ctx: RequestContext) => {
      if (!data) return data

      const sanitized = { ...data }

      // Remove empty strings
      for (const [key, value] of Object.entries(sanitized)) {
        if (value === '') {
          delete sanitized[key]
        }
      }

      // Convert string numbers to actual numbers
      for (const [key, value] of Object.entries(sanitized)) {
        if (typeof value === 'string' && /^\d+$/.test(value)) {
          sanitized[key] = parseInt(value, 10)
        }
      }

      return sanitized
    },

    // Filter response body - remove sensitive data
    filterResponseBody: async (data: any) => {
      if (!data) return data

      const filtered = JSON.parse(JSON.stringify(data))

      // Recursively remove sensitive fields
      const removeSensitiveFields = (obj: any): void => {
        if (typeof obj !== 'object' || obj === null) return

        const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'privateKey']

        for (const field of sensitiveFields) {
          if (field in obj) {
            delete obj[field]
          }
        }

        for (const value of Object.values(obj)) {
          if (typeof value === 'object') {
            removeSensitiveFields(value)
          }
        }
      }

      removeSensitiveFields(filtered)

      return filtered
    }
  }
}

// Helper functions
async function validateAgainstSchema(ctx: ValidationContext): Promise<void> {
  // Mock validation - in production use Zod, Joi, etc
  const schema = ctx.schema

  for (const [field, rules] of Object.entries(schema)) {
    const value = ctx.data[field]

    if (rules.required && !value) {
      ctx.errors.push({
        field,
        message: `${field} is required`,
        value
      })
      ctx.valid = false
    }

    if (rules.type && typeof value !== rules.type) {
      ctx.errors.push({
        field,
        message: `${field} must be of type ${rules.type}`,
        value
      })
      ctx.valid = false
    }
  }
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function containsSQLInjection(query: string): boolean {
  const sqlKeywords = ['DROP', 'DELETE', 'INSERT', 'UPDATE', 'SELECT', '--', ';']
  return sqlKeywords.some(keyword => query.toUpperCase().includes(keyword))
}

function escapeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

class ValidationError extends Error {
  validationErrors: any[]

  constructor(message: string, errors: any[]) {
    super(message)
    this.name = 'ValidationError'
    this.validationErrors = errors
  }
}

export default autoValidatorPlugin
