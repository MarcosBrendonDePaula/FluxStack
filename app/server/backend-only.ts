// Backend standalone entry point
import { startBackendOnly } from "@/core/server/standalone"
import { apiRoutes } from "./routes"
import { env } from "@/core/utils/env-runtime"

// Configuração para backend standalone com env dinâmico
const backendConfig = {
  port: env.get('BACKEND_PORT', 3001),  // Casting automático para number
  apiPrefix: env.API_PREFIX             // Direto! (string)
}

console.log(`🚀 Backend standalone: ${env.HOST}:${backendConfig.port}`)

// Iniciar apenas o backend
startBackendOnly(apiRoutes, backendConfig)