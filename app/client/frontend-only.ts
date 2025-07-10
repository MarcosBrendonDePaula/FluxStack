// Frontend standalone entry point
import { startFrontendOnly } from "../../core/client/standalone"

// Configuração para frontend standalone
const frontendConfig = {
  clientPath: "app/client",
  vitePort: process.env.FRONTEND_PORT || 5173,
  apiUrl: process.env.API_URL || "http://localhost:3001"
}

// Iniciar apenas o frontend
startFrontendOnly(frontendConfig)