import { treaty } from '@elysiajs/eden'

// Criar um cliente Eden genérico para produção
export const api = treaty('http://localhost:3000', {
  // Em produção, usar a mesma origem
  ...(typeof window !== 'undefined' && {
    fetch: {
      credentials: 'same-origin'
    }
  })
})

// Types para as respostas da API
export interface ApiResponse {
  message: string
}

export interface User {
  id: number
  name: string
  email: string
  createdAt?: string
}

export interface UsersResponse {
  users: User[]
}

export interface CreateUserRequest {
  name: string
  email: string
}

export interface UserResponse {
  success: boolean
  user?: User
  message?: string
}