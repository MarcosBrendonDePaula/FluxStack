/**
 * Validation Middleware
 * Provides request validation using schemas
 */

import type { Context } from 'elysia'

export interface ValidationSchema {
  body?: Record<string, any>
  query?: Record<string, any>
  params?: Record<string, any>
}

export interface ValidationError {
  field: string
  message: string
  value?: any
}

/**
 * Create validation middleware for a specific schema
 */
export const validationMiddleware = (schema: ValidationSchema) => ({
  name: 'validation',
  
  beforeHandle: async (context: Context) => {
    const errors: ValidationError[] = []

    // Validate body
    if (schema.body && context.body) {
      const bodyErrors = validateObject(context.body, schema.body, 'body')
      errors.push(...bodyErrors)
    }

    // Validate query parameters
    if (schema.query && context.query) {
      const queryErrors = validateObject(context.query, schema.query, 'query')
      errors.push(...queryErrors)
    }

    // Validate path parameters
    if (schema.params && context.params) {
      const paramErrors = validateObject(context.params, schema.params, 'params')
      errors.push(...paramErrors)
    }

    if (errors.length > 0) {
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          details: errors
        }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' } 
        }
      )
    }
  }
})

/**
 * Validate an object against a schema
 */
function validateObject(
  obj: any, 
  schema: Record<string, any>, 
  prefix: string
): ValidationError[] {
  const errors: ValidationError[] = []

  for (const [field, rules] of Object.entries(schema)) {
    const value = obj[field]
    const fieldPath = `${prefix}.${field}`

    // Check required fields
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push({
        field: fieldPath,
        message: `${field} is required`,
        value
      })
      continue
    }

    // Skip validation if field is not required and not present
    if (!rules.required && (value === undefined || value === null)) {
      continue
    }

    // Type validation
    if (rules.type) {
      const typeError = validateType(value, rules.type, fieldPath)
      if (typeError) {
        errors.push(typeError)
        continue
      }
    }

    // String validations
    if (rules.type === 'string' && typeof value === 'string') {
      if (rules.minLength && value.length < rules.minLength) {
        errors.push({
          field: fieldPath,
          message: `${field} must be at least ${rules.minLength} characters`,
          value
        })
      }

      if (rules.maxLength && value.length > rules.maxLength) {
        errors.push({
          field: fieldPath,
          message: `${field} must be no more than ${rules.maxLength} characters`,
          value
        })
      }

      if (rules.pattern && !new RegExp(rules.pattern).test(value)) {
        errors.push({
          field: fieldPath,
          message: `${field} format is invalid`,
          value
        })
      }

      if (rules.email && !isValidEmail(value)) {
        errors.push({
          field: fieldPath,
          message: `${field} must be a valid email address`,
          value
        })
      }
    }

    // Number validations
    if (rules.type === 'number' && typeof value === 'number') {
      if (rules.min !== undefined && value < rules.min) {
        errors.push({
          field: fieldPath,
          message: `${field} must be at least ${rules.min}`,
          value
        })
      }

      if (rules.max !== undefined && value > rules.max) {
        errors.push({
          field: fieldPath,
          message: `${field} must be no more than ${rules.max}`,
          value
        })
      }
    }

    // Array validations
    if (rules.type === 'array' && Array.isArray(value)) {
      if (rules.minItems && value.length < rules.minItems) {
        errors.push({
          field: fieldPath,
          message: `${field} must have at least ${rules.minItems} items`,
          value
        })
      }

      if (rules.maxItems && value.length > rules.maxItems) {
        errors.push({
          field: fieldPath,
          message: `${field} must have no more than ${rules.maxItems} items`,
          value
        })
      }
    }

    // Enum validation
    if (rules.enum && !rules.enum.includes(value)) {
      errors.push({
        field: fieldPath,
        message: `${field} must be one of: ${rules.enum.join(', ')}`,
        value
      })
    }
  }

  return errors
}

/**
 * Validate value type
 */
function validateType(value: any, expectedType: string, fieldPath: string): ValidationError | null {
  const actualType = Array.isArray(value) ? 'array' : typeof value

  if (actualType !== expectedType) {
    return {
      field: fieldPath,
      message: `Expected ${expectedType}, got ${actualType}`,
      value
    }
  }

  return null
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Common validation schemas
 */
export const commonSchemas = {
  createUser: {
    body: {
      name: {
        type: 'string',
        required: true,
        minLength: 2,
        maxLength: 100
      },
      email: {
        type: 'string',
        required: true,
        email: true,
        maxLength: 255
      }
    }
  },

  updateUser: {
    params: {
      id: {
        type: 'string',
        required: true,
        pattern: '^\\d+$'
      }
    },
    body: {
      name: {
        type: 'string',
        required: false,
        minLength: 2,
        maxLength: 100
      },
      email: {
        type: 'string',
        required: false,
        email: true,
        maxLength: 255
      }
    }
  },

  pagination: {
    query: {
      page: {
        type: 'string',
        required: false,
        pattern: '^\\d+$'
      },
      limit: {
        type: 'string',
        required: false,
        pattern: '^\\d+$'
      }
    }
  }
}