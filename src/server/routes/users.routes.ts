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
  
  .post("/", ({ body }) => UsersController.createUser(body), {
    body: t.Object({
      name: t.String({ minLength: 2 }),
      email: t.String({ format: "email" })
    })
  })
  
  .delete("/:id", ({ params: { id } }) => {
    const userId = parseInt(id)
    return UsersController.deleteUser(userId)
  }, {
    params: t.Object({
      id: t.String()
    })
  })