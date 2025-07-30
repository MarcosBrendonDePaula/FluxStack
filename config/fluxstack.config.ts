import type { FluxStackConfig } from "../core/types"
import { getEnvironmentConfig } from "../core/config/env"

// Get environment configuration
const envConfig = getEnvironmentConfig()

export const config: FluxStackConfig = {
  port: envConfig.PORT,
  vitePort: envConfig.FRONTEND_PORT,
  clientPath: "app/client",
  apiPrefix: "/api",
  cors: {
    origins: envConfig.CORS_ORIGINS,
    methods: envConfig.CORS_METHODS,
    headers: envConfig.CORS_HEADERS
  },
  build: {
    outDir: envConfig.BUILD_OUTDIR,
    target: envConfig.BUILD_TARGET
  }
}

// Export environment config for direct access
export { envConfig }