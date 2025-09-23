import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiCall, getErrorMessage, APIException } from '@/app/client/src/lib/eden-api'

describe('Eden API Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('apiCall', () => {
    it('should return data on successful API response', async () => {
      const mockData = { users: [{ id: 1, name: 'Test' }] }
      const mockPromise = Promise.resolve({
        data: mockData,
        error: null,
        status: 200,
        response: new Response()
      })

      const result = await apiCall(mockPromise)
      expect(result).toEqual(mockData)
    })

    it('should throw APIException on error response', async () => {
      const mockError = { 
        status: 400,
        value: {
          message: 'Validation failed', 
          code: 'VALIDATION_ERROR',
          details: { field: 'email' }
        }
      }
      const mockPromise = Promise.resolve({
        data: null,
        error: mockError,
        status: 400,
        response: new Response()
      })

      await expect(apiCall(mockPromise)).rejects.toThrow(APIException)
      
      try {
        await apiCall(mockPromise)
      } catch (error) {
        expect(error).toBeInstanceOf(APIException)
        expect((error as APIException).message).toBe('Validation failed')
        expect((error as APIException).status).toBe(400)
        expect((error as APIException).code).toBe('VALIDATION_ERROR')
        expect((error as APIException).details).toEqual(mockError.value)
      }
    })

    it('should handle network errors', async () => {
      const networkError = new Error('Network error')
      const mockPromise = Promise.reject(networkError)

      await expect(apiCall(mockPromise)).rejects.toThrow(APIException)
      
      try {
        await apiCall(mockPromise)
      } catch (error) {
        expect(error).toBeInstanceOf(APIException)
        expect((error as APIException).message).toBe('Network error')
        expect((error as APIException).status).toBe(500)
        expect((error as APIException).code).toBe('NETWORK_ERROR')
      }
    })

    it('should handle unknown errors', async () => {
      const unknownError = 'Some string error'
      const mockPromise = Promise.reject(unknownError)

      await expect(apiCall(mockPromise)).rejects.toThrow(APIException)
      
      try {
        await apiCall(mockPromise)
      } catch (error) {
        expect(error).toBeInstanceOf(APIException)
        expect((error as APIException).message).toBe('Unknown error')
        expect((error as APIException).status).toBe(500)
        expect((error as APIException).code).toBe('NETWORK_ERROR')
      }
    })
  })

  describe('getErrorMessage', () => {
    it('should return specific messages for different status codes', () => {
      const badRequestError = new APIException({
        message: 'Custom message',
        status: 400
      })
      expect(getErrorMessage(badRequestError)).toBe('Custom message')

      const unauthorizedError = new APIException({
        message: 'Custom auth message',
        status: 401
      })
      expect(getErrorMessage(unauthorizedError)).toBe('Acesso não autorizado')

      const forbiddenError = new APIException({
        message: 'Forbidden',
        status: 403
      })
      expect(getErrorMessage(forbiddenError)).toBe('Acesso negado')

      const notFoundError = new APIException({
        message: 'Not found',
        status: 404
      })
      expect(getErrorMessage(notFoundError)).toBe('Recurso não encontrado')

      const validationError = new APIException({
        message: 'Validation error',
        status: 422
      })
      expect(getErrorMessage(validationError)).toBe('Dados de entrada inválidos')

      const serverError = new APIException({
        message: 'Server error',
        status: 500
      })
      expect(getErrorMessage(serverError)).toBe('Erro interno do servidor')
    })

    it('should return generic message for unknown status codes', () => {
      const unknownError = new APIException({
        message: 'Custom error',
        status: 418 // I'm a teapot
      })
      expect(getErrorMessage(unknownError)).toBe('Custom error')
    })

    it('should handle regular Error objects', () => {
      const regularError = new Error('Regular error message')
      expect(getErrorMessage(regularError)).toBe('Regular error message')
    })

    it('should handle unknown error types', () => {
      expect(getErrorMessage('string error')).toBe('Erro desconhecido')
      expect(getErrorMessage(null)).toBe('Erro desconhecido')
      expect(getErrorMessage(undefined)).toBe('Erro desconhecido')
      expect(getErrorMessage({ unknownProp: 'value' })).toBe('Erro desconhecido')
    })

    it('should fallback to default messages when APIException has no message', () => {
      const errorWithoutMessage = new APIException({
        message: '',
        status: 401
      })
      expect(getErrorMessage(errorWithoutMessage)).toBe('Acesso não autorizado')
    })
  })

  describe('APIException', () => {
    it('should create APIException with all properties', () => {
      const errorData = {
        message: 'Test error',
        status: 400,
        code: 'TEST_ERROR',
        details: { field: 'test' }
      }

      const exception = new APIException(errorData)

      expect(exception.message).toBe('Test error')
      expect(exception.status).toBe(400)
      expect(exception.code).toBe('TEST_ERROR')
      expect(exception.details).toEqual({ field: 'test' })
      expect(exception.name).toBe('APIException')
      expect(exception).toBeInstanceOf(Error)
    })

    it('should create APIException with minimal properties', () => {
      const errorData = {
        message: 'Minimal error',
        status: 500
      }

      const exception = new APIException(errorData)

      expect(exception.message).toBe('Minimal error')
      expect(exception.status).toBe(500)
      expect(exception.code).toBeUndefined()
      expect(exception.details).toBeUndefined()
    })
  })
})