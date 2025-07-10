// Backend standalone entry point
import { startBackendOnly } from "@/core/server/standalone"
import { apiRoutes } from "./routes"

// Configuração para backend standalone
const backendConfig = {
  port: process.env.BACKEND_PORT || 3001,
  apiPrefix: "/api"
}

// Iniciar apenas o backend
startBackendOnly(apiRoutes, backendConfig)