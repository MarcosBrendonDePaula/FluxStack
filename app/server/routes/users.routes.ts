import { Elysia, t } from "elysia"
import { UsersController } from "../controllers/users.controller"

export const usersRoutes = new Elysia({ prefix: "/users" })
  .get("/", () => UsersController.getUsers(), {
    response: t.Object({
      users: t.Array(t.Object({
        id: t.Number(),
        name: t.String(),
        email: t.String(),
        createdAt: t.Date()
      }))
    }),
    detail: {
      tags: ['Users'],
      summary: 'List Users',
      description: 'Retrieve a list of all users in the system'
    }
  })
  
  .get("/:id", async ({ params: { id } }) => {
    const userId = parseInt(id)
    const result = await UsersController.getUserById(userId)
    
    if (!result) {
      return { error: "Usuário não encontrado" }
    }
    
    return result
  }, {
    params: t.Object({
      id: t.String()
    }),
    response: t.Object({
      user: t.Object({
        id: t.Number(),
        name: t.String(),
        email: t.String(),
        createdAt: t.Date()
      })
    }),
    detail: {
      tags: ['Users'],
      summary: 'Get User by ID',
      description: 'Retrieve a specific user by their ID'
    }
  })
  
  .post("/", async ({ body, set }) => {
    try {
      return await UsersController.createUser(body as any)
    } catch (error) {
      set.status = 400
      return { 
        success: false, 
        error: "Dados inválidos", 
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }, {
    body: t.Object({
      name: t.String({ minLength: 2 }),
      email: t.String({ format: "email" })
    }),
    response: t.Object({
      success: t.Boolean(),
      user: t.Optional(t.Object({
        id: t.Number(),
        name: t.String(),
        email: t.String(),
        createdAt: t.Date()
      })),
      message: t.Optional(t.String())
    }),
    detail: {
      tags: ['Users'],
      summary: 'Create User',
      description: 'Create a new user with name and email'
    },
    error({ code, error, set }) {
      switch (code) {
        case 'VALIDATION':
          set.status = 400
          return {
            success: false,
            error: "Dados inválidos",
            details: error.message
          }
        default:
          set.status = 500
          return {
            success: false,
            error: "Erro interno do servidor"
          }
      }
    }
  })
  
  .delete("/:id", ({ params: { id } }) => {
    const userId = parseInt(id)
    return UsersController.deleteUser(userId)
  }, {
    params: t.Object({
      id: t.String()
    }),
    response: t.Object({
      success: t.Boolean(),
      user: t.Optional(t.Object({
        id: t.Number(),
        name: t.String(),
        email: t.String(),
        createdAt: t.Date()
      })),
      message: t.Optional(t.String())
    }),
    detail: {
      tags: ['Users'],
      summary: 'Delete User',
      description: 'Delete a user by their ID'
    }
  })