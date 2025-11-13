import { Elysia, t } from 'elysia'
import { UsersController } from '@/app/server/controllers/users.controller'
import type { CreateUserRequest } from '@/app/shared/types'
import {
  CreateUserRequestSchema,
  GetUsersResponseSchema,
  GetUserResponseSchema,
  CreateUserResponseSchema,
  DeleteUserResponseSchema,
  ErrorResponseSchema
} from '@/app/shared/schemas'

/**
 * Users API Routes
 */
export const usersRoutes = new Elysia({ prefix: '/users', tags: ['Users'] })
  // GET /users - Get all users
  .get('/', async () => {
    return await UsersController.getUsers()
  }, {
    detail: {
      summary: 'Get All Users',
      description: 'Retrieves a list of all registered users',
      tags: ['Users', 'CRUD']
    },
    response: GetUsersResponseSchema
  })

  // GET /users/:id - Get user by ID
  .get('/:id', async ({ params, set }) => {
    const id = parseInt(params.id)

    // Handle invalid ID
    if (isNaN(id)) {
      set.status = 400
      return { error: 'ID inválido' }
    }

    const result = await UsersController.getUserById(id)

    if (!result) {
      set.status = 404
      return { error: 'Usuário não encontrado' }
    }

    return result
  }, {
    detail: {
      summary: 'Get User by ID',
      description: 'Retrieves a single user by their unique identifier',
      tags: ['Users', 'CRUD']
    },
    params: t.Object({
      id: t.String({ description: 'User ID' })
    }),
    response: {
      200: GetUserResponseSchema,
      400: ErrorResponseSchema,
      404: ErrorResponseSchema
    }
  })

  // POST /users - Create new user
  .post('/', async ({ body }) => {
    // Schema validation is handled automatically by Elysia
    // Body is validated against CreateUserRequestSchema
    const result = await UsersController.createUser(body as CreateUserRequest)

    // If email is duplicate, still return 200 but with success: false
    if (!result.success) {
      return result
    }

    return result
  }, {
    detail: {
      summary: 'Create New User',
      description: 'Creates a new user with name and email. Email must be unique.',
      tags: ['Users', 'CRUD']
    },
    body: CreateUserRequestSchema,
    response: {
      200: CreateUserResponseSchema,
      400: t.Object({
        success: t.Literal(false),
        error: t.String()
      })
    }
  })

  // DELETE /users/:id - Delete user
  .delete('/:id', async ({ params, set }) => {
    const id = parseInt(params.id)

    if (isNaN(id)) {
      set.status = 400
      return {
        success: false,
        message: 'ID inválido'
      }
    }

    const result = await UsersController.deleteUser(id)

    if (!result.success) {
      // Don't set 404 status, just return success: false
      return result
    }

    return result
  }, {
    detail: {
      summary: 'Delete User',
      description: 'Deletes a user by their ID',
      tags: ['Users', 'CRUD']
    },
    params: t.Object({
      id: t.String({ description: 'User ID to delete' })
    }),
    response: {
      200: DeleteUserResponseSchema,
      400: t.Object({
        success: t.Literal(false),
        message: t.String()
      })
    }
  })
