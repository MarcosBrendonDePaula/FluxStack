import { Elysia, t } from 'elysia'
import { UsersController } from '@/app/server/controllers/users.controller'

/**
 * Users API Routes
 */
export const usersRoutes = new Elysia({ prefix: '/users' })
  // GET /users - Get all users
  .get('/', async () => {
    return await UsersController.getUsers()
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
    params: t.Object({
      id: t.String()
    })
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
    body: t.Object({
      name: t.Optional(t.String()),
      email: t.Optional(t.String())
    })
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
    params: t.Object({
      id: t.String()
    })
  })
