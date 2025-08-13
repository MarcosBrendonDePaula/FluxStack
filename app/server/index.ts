// User application entry point
import { FluxStackFramework, loggerPlugin, vitePlugin, swaggerPlugin, corsPlugin } from "@/core/server"
import { livePlugin } from "@/core/server/plugins/live"
import { apiRoutes } from "./routes"

// Import live components to auto-register them
import "./live"

// Criar aplicação com framework
const app = new FluxStackFramework({
  port: 3000,
  apiPrefix: "/api",
  clientPath: "app/client"
})


// Usar plugins básicos primeiro (CORS primeiro!)
app
  .use(corsPlugin)      // CORS deve ser o primeiro para funcionar corretamente
  .use(swaggerPlugin)
  .use(loggerPlugin)
  .use(livePlugin)      // Live Components WebSocket
  .use(vitePlugin)
  

// Registrar rotas da aplicação ANTES do Swagger
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

// Exportar tipo da aplicação para Eden Treaty (método correto)
export type App = typeof framework