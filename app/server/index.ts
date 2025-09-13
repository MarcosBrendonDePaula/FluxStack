// User application entry point
import { FluxStackFramework, loggerPlugin, vitePlugin, swaggerPlugin } from "@/core/server"
import { apiRoutes } from "./routes"

// Criar aplicação com framework
const app = new FluxStackFramework({
  port: 3000,
  apiPrefix: "/api",
  clientPath: "app/client"
})


// Usar plugins básicos primeiro
app
  .use(swaggerPlugin)
  .use(loggerPlugin)
  .use(vitePlugin)
  

// Registrar rotas da aplicação ANTES do Swagger
app.routes(apiRoutes)



// Configurar proxy/static files
const framework = app.getApp()
const context = app.getContext()

if (context.isDevelopment) {
  // Import the proxy function from the Vite plugin
  const { proxyToVite } = await import("@/core/plugins/built-in/vite")
  
  // Proxy para Vite em desenvolvimento com detecção automática de porta
  framework.get("*", async ({ request }) => {
    const url = new URL(request.url)
    
    if (url.pathname.startsWith("/api")) {
      return new Response("Not Found", { status: 404 })
    }
    
    // Use the intelligent proxy function that auto-detects the port
    const vitePort = context.config.client?.port || 5173
    return await proxyToVite(request, "localhost", vitePort, 5000)
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