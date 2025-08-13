import { Elysia } from "elysia"
import { usersRoutes } from "./users.routes"
import { memoryRoutes } from "./memory"

export const apiRoutes = new Elysia({ prefix: "/api" })
  .get("/", () => ({ message: "🔥 Hot Reload funcionando! FluxStack API v1.4.0 ⚡" }), {
    detail: {
      tags: ['Health'],
      summary: 'API Root',
      description: 'Returns a welcome message from the FluxStack API'
    }
  })
  .get("/health", () => ({ 
    status: "🚀 Hot Reload ativo!", 
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
    version: "1.4.0",
    environment: "development"
  }), {
    detail: {
      tags: ['Health'],
      summary: 'Health Check',
      description: 'Returns the current health status of the API server'
    }
  })
  .use(usersRoutes)
  .use(memoryRoutes)