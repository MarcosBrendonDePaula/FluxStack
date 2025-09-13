/**
 * Tests for Error Handling System
 */

import { describe, it, expect } from 'vitest'
import {
  FluxStackError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  InternalServerError,
  ServiceUnavailableError
} from '../errors'

describe('Error Classes', () => {
  describe('FluxStackError', () => {
    it('should create error with all properties', () => {
      const context = { field: 'email', value: 'invalid' }
      const error = new FluxStackError('Test error', 'TEST_ERROR', 400, context)

      expect(error.message).toBe('Test error')
      expect(error.code).toBe('TEST_ERROR')
      expect(error.statusCode).toBe(400)
      expect(error.context).toBe(context)
      expect(error.timestamp).toBeInstanceOf(Date)
      expect(error.name).toBe('FluxStackError')
    })

    it('should default to status code 500', () => {
      const error = new FluxStackError('Test error', 'TEST_ERROR')
      expect(error.statusCode).toBe(500)
    })

    it('should serialize to JSON correctly', () => {
      const error = new FluxStackError('Test error', 'TEST_ERROR', 400, { test: true })
      const json = error.toJSON()

      expect(json.name).toBe('FluxStackError')
      expect(json.message).toBe('Test error')
      expect(json.code).toBe('TEST_ERROR')
      expect(json.statusCode).toBe(400)
      expect(json.context).toEqual({ test: true })
      expect(json.timestamp).toBeInstanceOf(Date)
      expect(json.stack).toBeDefined()
    })
  })

  describe('ValidationError', () => {
    it('should create validation error with correct defaults', () => {
      const error = new ValidationError('Invalid input')

      expect(error.message).toBe('Invalid input')
      expect(error.code).toBe('VALIDATION_ERROR')
      expect(error.statusCode).toBe(400)
      expect(error.name).toBe('ValidationError')
    })

    it('should include context', () => {
      const context = { field: 'email', rule: 'required' }
      const error = new ValidationError('Email is required', context)

      expect(error.context).toBe(context)
    })
  })

  describe('NotFoundError', () => {
    it('should create not found error', () => {
      const error = new NotFoundError('User')

      expect(error.message).toBe('User not found')
      expect(error.code).toBe('NOT_FOUND')
      expect(error.statusCode).toBe(404)
      expect(error.name).toBe('NotFoundError')
    })
  })

  describe('UnauthorizedError', () => {
    it('should create unauthorized error with default message', () => {
      const error = new UnauthorizedError()

      expect(error.message).toBe('Unauthorized')
      expect(error.code).toBe('UNAUTHORIZED')
      expect(error.statusCode).toBe(401)
      expect(error.name).toBe('UnauthorizedError')
    })

    it('should create unauthorized error with custom message', () => {
      const error = new UnauthorizedError('Invalid token')

      expect(error.message).toBe('Invalid token')
    })
  })

  describe('ForbiddenError', () => {
    it('should create forbidden error', () => {
      const error = new ForbiddenError('Access denied')

      expect(error.message).toBe('Access denied')
      expect(error.code).toBe('FORBIDDEN')
      expect(error.statusCode).toBe(403)
      expect(error.name).toBe('ForbiddenError')
    })
  })

  describe('ConflictError', () => {
    it('should create conflict error', () => {
      const error = new ConflictError('Resource already exists')

      expect(error.message).toBe('Resource already exists')
      expect(error.code).toBe('CONFLICT')
      expect(error.statusCode).toBe(409)
      expect(error.name).toBe('ConflictError')
    })
  })

  describe('InternalServerError', () => {
    it('should create internal server error with default message', () => {
      const error = new InternalServerError()

      expect(error.message).toBe('Internal server error')
      expect(error.code).toBe('INTERNAL_SERVER_ERROR')
      expect(error.statusCode).toBe(500)
      expect(error.name).toBe('InternalServerError')
    })
  })

  describe('ServiceUnavailableError', () => {
    it('should create service unavailable error', () => {
      const error = new ServiceUnavailableError('Database is down')

      expect(error.message).toBe('Database is down')
      expect(error.code).toBe('SERVICE_UNAVAILABLE')
      expect(error.statusCode).toBe(503)
      expect(error.name).toBe('ServiceUnavailableError')
    })
  })
})