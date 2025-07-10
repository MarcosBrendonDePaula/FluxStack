// Script específico para produção
process.env.NODE_ENV = "production"

import { Elysia } from "elysia"
import { join } from "path"
import { corsMiddleware } from "./middleware/cors"
import { loggerMiddleware } from "./middleware/logger"
import { apiRoutes } from "./routes"

const config = {
  port: process.env.PORT || 3000,
  clientDistPath: "src/client/dist"
}

const app = new Elysia()
  .use(corsMiddleware)
  .use(loggerMiddleware)
  .use(apiRoutes)

// Servir arquivos estáticos do React
app.get("*", ({ request }) => {
  const url = new URL(request.url)
  const filePath = join(process.cwd(), config.clientDistPath, url.pathname)
  
  // Servir index.html para rotas SPA
  if (!url.pathname.includes(".")) {
    return Bun.file(join(process.cwd(), config.clientDistPath, "index.html"))
  }
  
  return Bun.file(filePath)
})

app.listen(config.port, () => {
  console.log(`🦊 Elysia server (PRODUÇÃO) rodando em http://localhost:${config.port}`)
  console.log(`📁 Servindo arquivos estáticos de: ${config.clientDistPath}`)
})

export type App = typeof app