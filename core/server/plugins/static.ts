import { join } from "path"
import type { Plugin } from "../../types"
import { proxyToVite } from "./vite"

export const staticPlugin: Plugin = {
  name: "static",
  setup: (context) => {
    console.log(`📁 Static files plugin ativado`)
    
    return {
      handler: async (request: Request) => {
        if (context.isDevelopment) {
          // Proxy para Vite em desenvolvimento
          return proxyToVite(request, context.config.vitePort!)
        } else {
          // Servir arquivos estáticos em produção
          const url = new URL(request.url)
          const clientDistPath = join(process.cwd(), context.config.clientPath!, "dist")
          const filePath = join(clientDistPath, url.pathname)
          
          // Servir index.html para rotas SPA
          if (!url.pathname.includes(".")) {
            return Bun.file(join(clientDistPath, "index.html"))
          }
          
          return Bun.file(filePath)
        }
      }
    }
  }
}