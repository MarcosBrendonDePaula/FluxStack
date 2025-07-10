import { Elysia } from "elysia"
import { join } from "path"
import { config } from "./config"
import { corsMiddleware } from "./middleware/cors"
import { loggerMiddleware } from "./middleware/logger"
import { apiRoutes } from "./routes"
import { startViteServer, stopViteServer, proxyToVite } from "./utils/vite"

const app = new Elysia()
  .use(corsMiddleware)
  .use(loggerMiddleware)
  .use(apiRoutes)

// Iniciar Vite em desenvolvimento
if (config.isDevelopment) {
  startViteServer()
}

// Servir arquivos estáticos do React em produção
if (!config.isDevelopment) {
  app.get("*", ({ request }) => {
    const url = new URL(request.url)
    const filePath = join(process.cwd(), config.clientDistPath, url.pathname)
    
    // Servir index.html para rotas SPA
    if (!url.pathname.includes(".")) {
      return Bun.file(join(process.cwd(), config.clientDistPath, "index.html"))
    }
    
    return Bun.file(filePath)
  })
} else {
  // Proxy para Vite em desenvolvimento
  app.get("*", ({ request }) => proxyToVite(request))
}

app.listen(config.port, () => {
  console.log(`🦊 Elysia server rodando em http://localhost:${config.port}`)
  if (config.isDevelopment) {
    console.log(`📱 Frontend React em http://localhost:${config.port}`)
    console.log(`🔧 Vite dev server em http://localhost:${config.vitePort}`)
  }
})

// Exportar tipo da API para uso no frontend
export type App = typeof app

// Cleanup do processo Vite ao finalizar
process.on("SIGINT", () => {
  stopViteServer()
  process.exit(0)
})