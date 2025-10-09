// Backend standalone entry point
import { startBackendOnly } from "@/core/server/standalone"
import { apiRoutes } from "./routes"
import { serverConfig } from "@/config/server.config"

// Configuração para backend standalone usando config declarativo
const backendConfig = {
  port: serverConfig.backendPort,
  apiPrefix: serverConfig.apiPrefix
}

console.log(`🚀 Backend standalone: ${serverConfig.host}:${backendConfig.port}`)

// Iniciar apenas o backend
startBackendOnly(apiRoutes, backendConfig)