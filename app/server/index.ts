// User application entry point
import { FluxStackFramework, loggerPlugin, vitePlugin } from "@/core/server"
import { apiRoutes } from "./routes"

// Criar aplicação com framework
const app = new FluxStackFramework({
  port: 3000,
  apiPrefix: "/api",
  clientPath: "app/client"
})

// Usar plugins
app
  .use(loggerPlugin)
  .use(vitePlugin)

// Registrar rotas da aplicação
app.routes(apiRoutes)

// Configurar proxy/static files
const framework = app.getApp()
const context = app.getContext()

if (context.isDevelopment) {
  // Proxy para Vite em desenvolvimento
  framework.get("*", async ({ request }) => {
    const url = new URL(request.url)
    
    if (url.pathname.startsWith("/api")) {
      return new Response("Not Found", { status: 404 })
    }
    
    try {
      const viteUrl = `http://localhost:${context.config.vitePort}${url.pathname}${url.search}`
      const response = await fetch(viteUrl)
      return response
    } catch (error) {
      return new Response("Vite server not ready", { status: 503 })
    }
  })
} else {
  // Servir arquivos estáticos em produção
  const { join } = await import("path")
  
  framework.get("*", ({ request }) => {
    const url = new URL(request.url)
    const clientDistPath = join(process.cwd(), "app/client/dist")
    const filePath = join(clientDistPath, url.pathname)
    
    if (!url.pathname.includes(".")) {
      return Bun.file(join(clientDistPath, "index.html"))
    }
    
    return Bun.file(filePath)
  })
}

// Iniciar servidor
app.listen()

// Exportar tipo da aplicação para Eden
export type App = typeof framework