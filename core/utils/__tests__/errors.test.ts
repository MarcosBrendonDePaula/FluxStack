/**
 * Tests for Enhanced Error Handling System
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  FluxStackError,
  ValidationError,
  InvalidInputError,
  MissingRequiredFieldError,
  NotFoundError,
  ResourceNotFoundError,
  EndpointNotFoundError,
  UnauthorizedError,
  InvalidTokenError,
  TokenExpiredError,
  ForbiddenError,
  InsufficientPermissionsError,
  ConflictError,
  ResourceAlreadyExistsError,
  RateLimitExceededError,
  InternalServerError,
  DatabaseError,
  ExternalServiceError,
  ServiceUnavailableError,
  MaintenanceModeError,
  PluginError,
  PluginNotFoundError,
  ConfigError,
  InvalidConfigError,
  BuildError,
  CompilationError,
  isFluxStackError,
  isOperationalError,
  createErrorFromCode,
  wrapError,
  type ErrorMetadata
} from '../errors'

describe('Enhanced Error Classes', () => {
  describe('FluxStackError', () => {
    it('should create error with all properties', () => {
      const context = { field: 'email', value: 'invalid' }
      const metadata: ErrorMetadata = { correlationId: 'test-123', userId: 'user-456' }
      const error = new FluxStackError(
        'Test error', 
        'TEST_ERROR', 
        400, 
        context, 
        metadata, 
        true, 
        'User friendly message'
      )

      expect(error.message).toBe('Test error')
      expect(error.code).toBe('TEST_ERROR')
      expect(error.statusCode).toBe(400)
      expect(error.context).toBe(context)
      expect(error.metadata).toBe(metadata)
      expect(error.isOperational).toBe(true)
      expect(error.userMessage).toBe('User friendly message')
      expect(error.timestamp).toBeInstanceOf(Date)
      expect(error.name).toBe('FluxStackError')
    })

    it('should default to status code 500 and operational true', () => {
      const error = new FluxStackError('Test error', 'TEST_ERROR')
      expect(error.statusCode).toBe(500)
      expect(error.isOperational).toBe(true)
    })

    it('should serialize to JSON correctly', () => {
      const metadata = { correlationId: 'test-123' }
      const error = new FluxStackError('Test error', 'TEST_ERROR', 400, { test: true }, metadata)
      const json = error.toJSON()

      expect(json.name).toBe('FluxStackError')
      expect(json.message).toBe('Test error')
      expect(json.code).toBe('TEST_ERROR')
      expect(json.statusCode).toBe(400)
      expect(json.context).toEqual({ test: true })
      expect(json.metadata).toBe(metadata)
      expect(json.timestamp).toBeInstanceOf(Date)
      expect(json.stack).toBeDefined()
    })

    it('should create response format correctly', () => {
      const metadata = { correlationId: 'test-123' }
      const error = new FluxStackError(
        'Test error', 
        'TEST_ERROR', 
        400, 
        { test: true }, 
        metadata,
        true,
        'User message'
      )
      const response = error.toResponse(false)

      expect(response.error.message).toBe('User message')
      expect(response.error.code).toBe('TEST_ERROR')
      expect(response.error.statusCode).toBe(400)
      expect(response.error.details).toEqual({ test: true })
      expect(response.error.correlationId).toBe('test-123')
      expect(response.error.stack).toBeUndefined()
    })

    it('should include stack trace in development mode', () => {
      const error = new FluxStackError('Test error', 'TEST_ERROR', 400)
      const response = error.toResponse(true)

      expect(response.error.stack).toBeDefined()
    })

    it('should add metadata correctly', () => {
      const error = new FluxStackError('Test error', 'TEST_ERROR')
      const newMetadata = { correlationId: 'new-123', userId: 'user-789' }
      const errorWithMetadata = error.withMetadata(newMetadata)

      expect(errorWithMetadata.metadata).toEqual(newMetadata)
      expect(errorWithMetadata.message).toBe('Test error')
      expect(errorWithMetadata.code).toBe('TEST_ERROR')
    })

    it('should add correlation ID correctly', () => {
      const error = new FluxStackError('Test error', 'TEST_ERROR')
      const errorWithCorrelationId = error.withCorrelationId('corr-123')

      expect(errorWithCorrelationId.metadata.correlationId).toBe('corr-123')
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

      expect(error.message).toBe('Authentication required')
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

  describe('New Error Classes', () => {
    describe('InvalidInputError', () => {
      it('should create invalid input error with field context', () => {
        const error = new InvalidInputError('email', 'invalid@')

        expect(error.message).toBe('Invalid input for field: email')
        expect(error.code).toBe('INVALID_INPUT')
        expect(error.statusCode).toBe(400)
        expect(error.context).toEqual({ field: 'email', value: 'invalid@' })
        expect(error.userMessage).toBe('The value provided for email is not valid')
      })
    })

    describe('MissingRequiredFieldError', () => {
      it('should create missing field error', () => {
        const error = new MissingRequiredFieldError('password')

        expect(error.message).toBe('Missing required field: password')
        expect(error.code).toBe('MISSING_REQUIRED_FIELD')
        expect(error.statusCode).toBe(400)
        expect(error.context).toEqual({ field: 'password' })
        expect(error.userMessage).toBe('The field password is required')
      })
    })

    describe('ResourceNotFoundError', () => {
      it('should create resource not found error', () => {
        const error = new ResourceNotFoundError('User', '123')

        expect(error.message).toBe("User with identifier '123' not found")
        expect(error.code).toBe('RESOURCE_NOT_FOUND')
        expect(error.statusCode).toBe(404)
        expect(error.context).toEqual({ resourceType: 'User', identifier: '123' })
        expect(error.userMessage).toBe('The requested user could not be found')
      })
    })

    describe('EndpointNotFoundError', () => {
      it('should create endpoint not found error', () => {
        const error = new EndpointNotFoundError('POST', '/api/invalid')

        expect(error.message).toBe('Endpoint not found: POST /api/invalid')
        expect(error.code).toBe('ENDPOINT_NOT_FOUND')
        expect(error.statusCode).toBe(404)
        expect(error.context).toEqual({ method: 'POST', path: '/api/invalid' })
        expect(error.userMessage).toBe('The requested API endpoint does not exist')
      })
    })

    describe('InvalidTokenError', () => {
      it('should create invalid token error', () => {
        const error = new InvalidTokenError()

        expect(error.message).toBe('Invalid authentication token')
        expect(error.code).toBe('INVALID_TOKEN')
        expect(error.statusCode).toBe(401)
        expect(error.userMessage).toBe('Your session has expired. Please log in again')
      })
    })

    describe('TokenExpiredError', () => {
      it('should create token expired error', () => {
        const error = new TokenExpiredError()

        expect(error.message).toBe('Authentication token has expired')
        expect(error.code).toBe('TOKEN_EXPIRED')
        expect(error.statusCode).toBe(401)
        expect(error.userMessage).toBe('Your session has expired. Please log in again')
      })
    })

    describe('InsufficientPermissionsError', () => {
      it('should create insufficient permissions error', () => {
        const error = new InsufficientPermissionsError('admin')

        expect(error.message).toBe('Insufficient permissions: admin required')
        expect(error.code).toBe('INSUFFICIENT_PERMISSIONS')
        expect(error.statusCode).toBe(403)
        expect(error.context).toEqual({ requiredPermission: 'admin' })
        expect(error.userMessage).toBe('You do not have the required permissions for this action')
      })
    })

    describe('ResourceAlreadyExistsError', () => {
      it('should create resource already exists error', () => {
        const error = new ResourceAlreadyExistsError('User', 'john@example.com')

        expect(error.message).toBe("User with identifier 'john@example.com' already exists")
        expect(error.code).toBe('RESOURCE_ALREADY_EXISTS')
        expect(error.statusCode).toBe(409)
        expect(error.context).toEqual({ resourceType: 'User', identifier: 'john@example.com' })
        expect(error.userMessage).toBe('A user with that identifier already exists')
      })
    })

    describe('RateLimitExceededError', () => {
      it('should create rate limit exceeded error', () => {
        const error = new RateLimitExceededError(100, 60000)

        expect(error.message).toBe('Rate limit exceeded: 100 requests per 60000ms')
        expect(error.code).toBe('RATE_LIMIT_EXCEEDED')
        expect(error.statusCode).toBe(429)
        expect(error.context).toEqual({ limit: 100, windowMs: 60000 })
        expect(error.userMessage).toBe('Too many requests. Please try again later')
      })
    })

    describe('DatabaseError', () => {
      it('should create database error', () => {
        const error = new DatabaseError('SELECT', { table: 'users' })

        expect(error.message).toBe('Database operation failed: SELECT')
        expect(error.code).toBe('DATABASE_ERROR')
        expect(error.statusCode).toBe(500)
        expect(error.context).toEqual({ operation: 'SELECT', details: { table: 'users' } })
        expect(error.userMessage).toBe('A database error occurred. Please try again later')
        expect(error.isOperational).toBe(false)
      })
    })

    describe('ExternalServiceError', () => {
      it('should create external service error', () => {
        const error = new ExternalServiceError('PaymentAPI', { timeout: true })

        expect(error.message).toBe('External service error: PaymentAPI')
        expect(error.code).toBe('EXTERNAL_SERVICE_ERROR')
        expect(error.statusCode).toBe(500)
        expect(error.context).toEqual({ service: 'PaymentAPI', details: { timeout: true } })
        expect(error.userMessage).toBe('An external service is currently unavailable. Please try again later')
        expect(error.isOperational).toBe(false)
      })
    })

    describe('MaintenanceModeError', () => {
      it('should create maintenance mode error', () => {
        const error = new MaintenanceModeError('in 2 hours')

        expect(error.message).toBe('Service is under maintenance')
        expect(error.code).toBe('MAINTENANCE_MODE')
        expect(error.statusCode).toBe(503)
        expect(error.context).toEqual({ estimatedDuration: 'in 2 hours' })
        expect(error.userMessage).toBe('The service is under maintenance. Expected to be back in 2 hours')
      })

      it('should create maintenance mode error without duration', () => {
        const error = new MaintenanceModeError()

        expect(error.userMessage).toBe('The service is under maintenance. Please try again later')
      })
    })

    describe('PluginError', () => {
      it('should create plugin error', () => {
        const error = new PluginError('auth-plugin', 'Configuration invalid', { config: 'missing' })

        expect(error.message).toBe('Plugin error in auth-plugin: Configuration invalid')
        expect(error.code).toBe('PLUGIN_ERROR')
        expect(error.statusCode).toBe(500)
        expect(error.context).toEqual({ pluginName: 'auth-plugin', config: 'missing' })
        expect(error.userMessage).toBe('A plugin error occurred. Please contact support if this persists')
        expect(error.isOperational).toBe(false)
      })
    })

    describe('PluginNotFoundError', () => {
      it('should create plugin not found error', () => {
        const error = new PluginNotFoundError('missing-plugin')

        expect(error.message).toBe('Plugin not found: missing-plugin')
        expect(error.code).toBe('PLUGIN_NOT_FOUND')
        expect(error.statusCode).toBe(404)
        expect(error.context).toEqual({ pluginName: 'missing-plugin' })
        expect(error.userMessage).toBe("The requested plugin 'missing-plugin' is not available")
      })
    })

    describe('ConfigError', () => {
      it('should create config error', () => {
        const error = new ConfigError('Invalid database URL', { url: 'invalid' })

        expect(error.message).toBe('Configuration error: Invalid database URL')
        expect(error.code).toBe('CONFIG_ERROR')
        expect(error.statusCode).toBe(500)
        expect(error.context).toEqual({ url: 'invalid' })
        expect(error.userMessage).toBe('A configuration error occurred. Please check your settings')
        expect(error.isOperational).toBe(false)
      })
    })

    describe('InvalidConfigError', () => {
      it('should create invalid config error', () => {
        const error = new InvalidConfigError('port', '99999')

        expect(error.message).toBe('Invalid configuration for field: port')
        expect(error.code).toBe('INVALID_CONFIG')
        expect(error.statusCode).toBe(500)
        expect(error.context).toEqual({ field: 'port', value: '99999' })
        expect(error.userMessage).toBe('Invalid configuration detected. Please check your settings')
        expect(error.isOperational).toBe(false)
      })
    })

    describe('BuildError', () => {
      it('should create build error', () => {
        const error = new BuildError('Compilation failed', { file: 'main.ts' })

        expect(error.message).toBe('Build error: Compilation failed')
        expect(error.code).toBe('BUILD_ERROR')
        expect(error.statusCode).toBe(500)
        expect(error.context).toEqual({ file: 'main.ts' })
        expect(error.userMessage).toBe('A build error occurred')
        expect(error.isOperational).toBe(false)
      })
    })

    describe('CompilationError', () => {
      it('should create compilation error', () => {
        const error = new CompilationError('main.ts', { line: 42, column: 10 })

        expect(error.message).toBe('Compilation failed for file: main.ts')
        expect(error.code).toBe('COMPILATION_ERROR')
        expect(error.statusCode).toBe(500)
        expect(error.context).toEqual({ file: 'main.ts', details: { line: 42, column: 10 } })
        expect(error.userMessage).toBe('Compilation failed')
        expect(error.isOperational).toBe(false)
      })
    })
  })

  describe('Utility Functions', () => {
    describe('isFluxStackError', () => {
      it('should return true for FluxStackError instances', () => {
        const error = new FluxStackError('Test', 'TEST')
        expect(isFluxStackError(error)).toBe(true)
      })

      it('should return true for FluxStackError subclasses', () => {
        const error = new ValidationError('Test')
        expect(isFluxStackError(error)).toBe(true)
      })

      it('should return false for regular Error instances', () => {
        const error = new Error('Test')
        expect(isFluxStackError(error)).toBe(false)
      })

      it('should return false for non-error objects', () => {
        expect(isFluxStackError({})).toBe(false)
        expect(isFluxStackError(null)).toBe(false)
        expect(isFluxStackError('error')).toBe(false)
      })
    })

    describe('isOperationalError', () => {
      it('should return true for operational FluxStackError', () => {
        const error = new ValidationError('Test')
        expect(isOperationalError(error)).toBe(true)
      })

      it('should return false for non-operational FluxStackError', () => {
        const error = new InternalServerError()
        expect(isOperationalError(error)).toBe(false)
      })

      it('should return false for regular Error instances', () => {
        const error = new Error('Test')
        expect(isOperationalError(error)).toBe(false)
      })
    })

    describe('createErrorFromCode', () => {
      it('should create ValidationError from VALIDATION_ERROR code', () => {
        const error = createErrorFromCode('VALIDATION_ERROR', 'Test message')
        expect(error).toBeInstanceOf(ValidationError)
        expect(error.message).toBe('Test message')
      })

      it('should create InvalidInputError from INVALID_INPUT code', () => {
        const error = createErrorFromCode('INVALID_INPUT', undefined, { field: 'email', value: 'invalid' })
        expect(error).toBeInstanceOf(InvalidInputError)
        expect(error.context?.field).toBe('email')
      })

      it('should create ResourceNotFoundError from RESOURCE_NOT_FOUND code', () => {
        const error = createErrorFromCode('RESOURCE_NOT_FOUND', undefined, { resourceType: 'User', identifier: '123' })
        expect(error).toBeInstanceOf(ResourceNotFoundError)
        expect(error.context?.resourceType).toBe('User')
        expect(error.context?.identifier).toBe('123')
      })

      it('should create generic FluxStackError for unknown codes', () => {
        const error = createErrorFromCode('UNKNOWN_CODE', 'Test message')
        expect(error).toBeInstanceOf(FluxStackError)
        expect(error.code).toBe('UNKNOWN_CODE')
        expect(error.message).toBe('Test message')
      })

      it('should include metadata in created errors', () => {
        const metadata = { correlationId: 'test-123' }
        const error = createErrorFromCode('VALIDATION_ERROR', 'Test', undefined, metadata)
        expect(error.metadata).toBe(metadata)
      })
    })

    describe('wrapError', () => {
      it('should return FluxStackError unchanged', () => {
        const originalError = new ValidationError('Test')
        const wrappedError = wrapError(originalError)
        expect(wrappedError).toBe(originalError)
      })

      it('should add metadata to existing FluxStackError', () => {
        const originalError = new ValidationError('Test')
        const metadata = { correlationId: 'test-123' }
        const wrappedError = wrapError(originalError, metadata)
        expect(wrappedError.metadata).toEqual(metadata)
        expect(wrappedError).not.toBe(originalError) // Should be a new instance
      })

      it('should wrap regular Error as InternalServerError', () => {
        const originalError = new Error('Regular error')
        const wrappedError = wrapError(originalError)
        expect(wrappedError).toBeInstanceOf(InternalServerError)
        expect(wrappedError.message).toBe('Regular error')
        expect(wrappedError.context?.originalError).toBe('Error')
      })

      it('should include metadata when wrapping regular Error', () => {
        const originalError = new Error('Regular error')
        const metadata = { correlationId: 'test-123' }
        const wrappedError = wrapError(originalError, metadata)
        expect(wrappedError.metadata).toBe(metadata)
      })
    })
  })
})