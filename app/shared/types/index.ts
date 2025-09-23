// Shared types between server and client
export interface User {
  id: number
  name: string
  email: string
  createdAt: Date
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