// Types compartilhados entre cliente e servidor
export interface User {
  id: number
  name: string
  email: string
  createdAt?: Date
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

export interface ApiResponse {
  message: string
}

export interface UsersResponse {
  users: User[]
}