// Shared API types between client and server
export interface User {
  id: number
  name: string
  email: string
  createdAt: string
}

export interface CreateUserRequest {
  name: string
  email: string
}

export interface CreateUserResponse {
  success: boolean
  user: User
}

export interface GetUsersResponse {
  users: User[]
}

export interface HealthResponse {
  status: string
  timestamp: string
  uptime: number
}

export interface APIResponse {
  message: string
}