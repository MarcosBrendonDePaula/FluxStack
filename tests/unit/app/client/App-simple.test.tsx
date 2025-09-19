import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { getErrorMessage, APIException } from '@/app/client/src/lib/eden-api'

// Simple component test without full App complexity
function SimpleHeader({ title }: { title: string }) {
  return (
    <header>
      <div>{title}</div>
    </header>
  )
}

describe('Simple App Components', () => {
  describe('Header Component', () => {
    it('should render header with title', () => {
      render(<SimpleHeader title="🔥 FluxStack v1.4.0" />)
      
      expect(screen.getByText('🔥 FluxStack v1.4.0')).toBeInTheDocument()
    })
  })

  describe('Error Handling Utilities', () => {
    it('should handle API exceptions correctly', () => {
      const apiError = new APIException({
        message: 'Test error',
        status: 400,
        code: 'TEST_ERROR'
      })

      const message = getErrorMessage(apiError)
      expect(message).toBe('Test error')
    })

    it('should handle different status codes', () => {
      const unauthorizedError = new APIException({
        message: 'Unauthorized',
        status: 401
      })

      const message = getErrorMessage(unauthorizedError)
      expect(message).toBe('Acesso não autorizado')
    })

    it('should handle regular errors', () => {
      const regularError = new Error('Regular error')
      const message = getErrorMessage(regularError)
      expect(message).toBe('Regular error')
    })

    it('should handle unknown errors', () => {
      const message = getErrorMessage('string error')
      expect(message).toBe('Erro desconhecido')
    })
  })
})