/**
 * Centralized TypeBox Schemas
 *
 * This module exports all TypeBox schemas used for runtime validation
 * and OpenAPI documentation generation.
 *
 * All schemas are kept in sync with their corresponding TypeScript interfaces
 * defined in @/app/shared/types
 */

export {
  // User schemas
  UserSchema,
  CreateUserRequestSchema,
  UserResponseSchema,

  // Response schemas
  GetUsersResponseSchema,
  GetUserResponseSchema,
  CreateUserResponseSchema,
  DeleteUserResponseSchema,
  ErrorResponseSchema
} from './user.schema'
