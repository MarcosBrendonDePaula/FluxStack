// Eden Treaty API Client
import { treaty } from '@elysiajs/eden'
import type { App } from '../../../server/app'

// Get base URL dynamically (runtime detection)
const getBaseUrl = () => {
  if (typeof window === 'undefined') {
    return 'http://localhost:3000'
  }

  const currentHost = window.location.hostname
  const currentPort = window.location.port
  const currentProtocol = window.location.protocol

  if (currentPort.trim().length > 0) {
    return `${currentProtocol}//${currentHost}:${currentPort}`
  }

  return `${currentProtocol}//${currentHost}`
}

// Create Eden Treaty client with proper typing
const client = treaty<App>(getBaseUrl())

// Export the client's API directly to get proper type inference
export const api = client.api

// Enhanced error handling
export interface APIError {
  message: string
  status: number
  code?: string
  details?: any
}

export class APIException extends Error {
  status: number
  code?: string
  details?: any

  constructor(error: APIError) {
    super(error.message)
    this.name = 'APIException'
    this.status = error.status
    this.code = error.code
    this.details = error.details
  }
}

// Wrapper for API calls with error handling (Eden Treaty compatible)
export async function apiCall<T>(
  apiPromise: Promise<{ data: T; error: any; status: number; response: Response }>
): Promise<T> {
  try {
    const result = await apiPromise

    if (result.error) {
      throw new APIException({
        message: result.error.message || 'API Error',
        status: result.status,
        code: result.error.code,
        details: result.error
      })
    }

    return result.data
  } catch (error) {
    if (error instanceof APIException) {
      throw error
    }

    // Network or other errors
    throw new APIException({
      message: error instanceof Error ? error.message : 'Unknown error',
      status: 500,
      code: 'NETWORK_ERROR'
    })
  }
}

// User-friendly error messages
export function getErrorMessage(error: unknown): string {
  if (error instanceof APIException) {
    switch (error.status) {
      case 400:
        return error.message || 'Dados inválidos fornecidos'
      case 401:
        return 'Acesso não autorizado'
      case 403:
        return 'Acesso negado'
      case 404:
        return 'Recurso não encontrado'
      case 422:
        return 'Dados de entrada inválidos'
      case 500:
        return 'Erro interno do servidor'
      default:
        return error.message || 'Erro desconhecido'
    }
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Erro desconhecido'
}