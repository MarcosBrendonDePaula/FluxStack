// Export the main app type for Eden Treaty
import { apiRoutes } from "./routes"
import { Elysia } from "elysia"
import { liveComponentsPlugin } from "../../core/server"

// Create the full app structure that matches the server
const appInstance = new Elysia()
  .use(liveComponentsPlugin) // Add live components support
  .use(apiRoutes)

// Export the type correctly for Eden Treaty
export type App = typeof appInstance