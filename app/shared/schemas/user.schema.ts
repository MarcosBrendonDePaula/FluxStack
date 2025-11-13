import { t, type Static } from 'elysia'
import type { User, CreateUserRequest, UserResponse } from '@/app/shared/types'

/**
 * TypeBox Schema for User
 * Validates against the TypeScript User interface
 */
export const UserSchema = t.Object({
  id: t.Number({ description: 'User ID' }),
  name: t.String({ description: 'User name' }),
  email: t.String({ format: 'email', description: 'User email address' }),
  createdAt: t.Date({ description: 'User creation timestamp' })
}, {
  description: 'User object',
  $id: 'User'
})

/**
 * TypeBox Schema for CreateUserRequest
 * Validates user creation payload
 */
export const CreateUserRequestSchema = t.Object({
  name: t.String({
    minLength: 2,
    description: 'User name (minimum 2 characters)'
  }),
  email: t.String({
    format: 'email',
    description: 'Valid email address'
  })
}, {
  description: 'Request body for creating a new user',
  $id: 'CreateUserRequest'
})

/**
 * TypeBox Schema for UserResponse
 */
export const UserResponseSchema = t.Object({
  success: t.Boolean({ description: 'Operation success status' }),
  user: t.Optional(UserSchema),
  message: t.Optional(t.String({ description: 'Optional message' }))
}, {
  description: 'Response after user operation',
  $id: 'UserResponse'
})

/**
 * Response Schemas for User CRUD operations
 */
export const GetUsersResponseSchema = t.Object({
  users: t.Array(UserSchema, { description: 'List of users' })
}, {
  description: 'Response containing list of all users',
  $id: 'GetUsersResponse'
})

export const GetUserResponseSchema = t.Union([
  t.Object({
    success: t.Literal(true),
    user: UserSchema
  }),
  t.Object({
    success: t.Literal(false),
    error: t.String({ description: 'Error message' })
  })
], {
  description: 'Response for single user retrieval',
  $id: 'GetUserResponse'
})

export const CreateUserResponseSchema = t.Union([
  t.Object({
    success: t.Literal(true),
    user: UserSchema,
    message: t.Optional(t.String())
  }),
  t.Object({
    success: t.Literal(false),
    error: t.String({ description: 'Error message' })
  })
], {
  description: 'Response after attempting to create a user',
  $id: 'CreateUserResponse'
})

export const DeleteUserResponseSchema = t.Union([
  t.Object({
    success: t.Literal(true),
    message: t.String({ description: 'Success message' })
  }),
  t.Object({
    success: t.Literal(false),
    message: t.String({ description: 'Error message' })
  })
], {
  description: 'Result of delete operation',
  $id: 'DeleteUserResponse'
})

export const ErrorResponseSchema = t.Object({
  error: t.String({ description: 'Error message' })
}, {
  description: 'Standard error response',
  $id: 'ErrorResponse'
})

/**
 * Type validation - ensures TypeBox schemas match TypeScript interfaces
 * If these lines don't compile, the schemas are out of sync with the types
 */
type ValidateUser = Static<typeof UserSchema> extends Omit<User, 'createdAt'> & { createdAt: Date } ? true : never
type ValidateCreateUserRequest = Static<typeof CreateUserRequestSchema> extends CreateUserRequest ? true : never
