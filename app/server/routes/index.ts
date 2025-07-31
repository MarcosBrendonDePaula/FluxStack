import { Elysia } from "elysia"
import { usersRoutes } from "./users.routes"

export const apiRoutes = new Elysia({ prefix: "/api" })
  .get("/", () => ({ message: "Hello from FluxStack API!" }), {
    detail: {
      tags: ['Health'],
      summary: 'API Root',
      description: 'Returns a welcome message from the FluxStack API'
    }
  })
  .get("/health", () => ({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  }), {
    detail: {
      tags: ['Health'],
      summary: 'Health Check',
      description: 'Returns the current health status of the API server'
    }
  })
  .use(usersRoutes)