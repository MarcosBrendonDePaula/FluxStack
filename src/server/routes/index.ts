import { Elysia } from "elysia"
import { usersRoutes } from "./users.routes"

export const apiRoutes = new Elysia({ prefix: "/api" })
  .get("/", () => ({ message: "Hello from FluxStack API!" }))
  .get("/health", () => ({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  }))
  .use(usersRoutes)