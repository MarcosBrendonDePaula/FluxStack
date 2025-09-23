// Export the main app type for Eden Treaty
import { apiRoutes } from "./routes"
import { Elysia } from "elysia"

// Create the full app structure that matches the server
const appInstance = new Elysia()
  .use(apiRoutes)

// Export the type correctly for Eden Treaty
export type App = typeof appInstance