// Export the main app instance and type for Eden Treaty
import { apiRoutes } from "./routes"
import { Elysia } from "elysia"

/**
 * App Instance - Single Source of Truth
 *
 * This instance is used by:
 * - index.ts (full-stack mode)
 * - backend-only.ts (backend standalone mode)
 * - Eden Treaty client (type inference)
 *
 * This ensures that the type exported for Eden Treaty is exactly
 * the same as what the server uses.
 */
export const appInstance = new Elysia()
  .use(apiRoutes)

// Export the type correctly for Eden Treaty
export type App = typeof appInstance