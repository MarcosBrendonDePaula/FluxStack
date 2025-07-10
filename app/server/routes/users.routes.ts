import { Elysia, t } from "elysia"
import { UsersController } from "../controllers/users.controller"

export const usersRoutes = new Elysia({ prefix: "/users" })
  .get("/", () => UsersController.getUsers())
  
  .get("/:id", ({ params: { id } }) => {
    const userId = parseInt(id)
    const result = UsersController.getUserById(userId)
    
    if (!result) {
      return { error: "Usuário não encontrado" }
    }
    
    return result
  }, {
    params: t.Object({
      id: t.String()
    })
  })
  
  .post("/", async ({ body, set }) => {
    try {
      return await UsersController.createUser(body)
    } catch (error) {
      set.status = 400
      return { 
        success: false, 
        error: "Dados inválidos", 
        details: error.message 
      }
    }
  }, {
    body: t.Object({
      name: t.String({ minLength: 2 }),
      email: t.String({ format: "email" })
    }),
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
    })
  })