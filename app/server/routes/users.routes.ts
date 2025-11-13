import { Elysia, t } from 'elysia'
import { UsersController } from '@/app/server/controllers/users.controller'

// ===== Request/Response Schemas =====

const UserSchema = t.Object({
  id: t.Number(),
  name: t.String(),
  email: t.String()
}, {
  description: 'User object'
})

const CreateUserRequestSchema = t.Object({
  name: t.String({ minLength: 2, description: 'User name (minimum 2 characters)' }),
  email: t.String({ format: 'email', description: 'Valid email address' })
}, {
  description: 'Request body for creating a new user'
})

const CreateUserResponseSchema = t.Union([
  t.Object({
    success: t.Literal(true),
    user: UserSchema,
    message: t.Optional(t.String())
  }),
  t.Object({
    success: t.Literal(false),
    error: t.String()
  })
], {
  description: 'Response after attempting to create a user'
})

const GetUsersResponseSchema = t.Object({
  success: t.Boolean(),
  users: t.Array(UserSchema),
  count: t.Number()
}, {
  description: 'List of all users'
})

const GetUserResponseSchema = t.Union([
  t.Object({
    success: t.Literal(true),
    user: UserSchema
  }),
  t.Object({
    success: t.Literal(false),
    error: t.String()
  })
], {
  description: 'Single user or error'
})

const DeleteUserResponseSchema = t.Union([
  t.Object({
    success: t.Literal(true),
    message: t.String()
  }),
  t.Object({
    success: t.Literal(false),
    message: t.String()
  })
], {
  description: 'Result of delete operation'
})

const ErrorResponseSchema = t.Object({
  error: t.String()
}, {
  description: 'Error response'
})

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
  .post('/', async ({ body, set }) => {
    // Validate required fields
    if (!body.name || !body.email) {
      set.status = 400
      return {
        success: false,
        error: 'Nome e email são obrigatórios'
      }
    }

    // Validate name length
    if (body.name.length < 2) {
      set.status = 400
      return {
        success: false,
        error: 'Nome deve ter pelo menos 2 caracteres'
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      set.status = 400
      return {
        success: false,
        error: 'Email inválido'
      }
    }

    const result = await UsersController.createUser(body)

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
