// Eden Treaty API Client - Full Type Inference
import { treaty } from '@elysiajs/eden'
import type { App } from '../../../server/app'

// Get base URL dynamically
const getBaseUrl = () => {
  if (typeof window === 'undefined') return 'http://localhost:3000'
  
  // In production, use current origin
  if (window.location.hostname !== 'localhost') {
    return window.location.origin
  }
  
  // In development, use backend server (port 3000 for integrated mode)
  return 'http://localhost:3000'
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

// Minimal wrapper that preserves Eden's automatic type inference
export async function apiCall(apiPromise: Promise<any>) {
  const { data, error } = await apiPromise
  
  if (error) {
    throw new APIException({
      message: error.value?.message || 'API Error',
      status: error.status,
      code: error.value?.code,
      details: error.value
    })
  }
  
  return data // ✨ Preserva a inferência automática do Eden
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