import { join } from "path"
import type { Plugin, PluginContext } from "../../types"
import { proxyToVite } from "./vite"

export const staticPlugin: Plugin = {
  name: "static",
  setup: (context: PluginContext) => {
    console.log(`📁 Static files plugin ativado`)
    
    // Setup static file serving on the Elysia app
    context.app.get("*", async ({ request }: { request: Request }) => {
      if (context.utils.isDevelopment()) {
        // Proxy para Vite em desenvolvimento
        const vitePort = context.config.client?.port || 5173
        return proxyToVite(request, vitePort)
      } else {
        // Servir arquivos estáticos em produção
        const url = new URL(request.url)
        const clientDistPath = join(process.cwd(), context.config.client?.build?.outDir || "dist/client")
        const filePath = join(clientDistPath, url.pathname)
        
        // Servir index.html para rotas SPA
        if (!url.pathname.includes(".")) {
          return Bun.file(join(clientDistPath, "index.html"))
        }
        
        return Bun.file(filePath)
      }
    })
  }
}