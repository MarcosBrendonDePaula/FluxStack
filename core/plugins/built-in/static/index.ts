import { join } from "path"
import type { Plugin } from "../../../plugins/types"
import { proxyToVite } from "../vite"

export const staticPlugin: Plugin = {
  name: "static",
  version: "1.0.0",
  description: "Static file serving plugin for FluxStack",
  setup: async (context) => {
    context.logger.info("Static files plugin activated")
    
    // Setup static file handling in Elysia
    context.app.get("/*", async ({ request }) => {
      const url = new URL(request.url)
      
      // Skip API routes
      if (url.pathname.startsWith(context.config.server.apiPrefix)) {
        return
      }
      
      if (context.config.client) {
        const clientPort = context.config.client.port || 5173
        
        // Proxy to Vite in development
        return proxyToVite(request, clientPort)
      }
      
      // Serve static files in production
      const clientDistPath = join(process.cwd(), "dist", "client")
      const filePath = join(clientDistPath, url.pathname)
      
      // Serve index.html for SPA routes
      if (!url.pathname.includes(".")) {
        return Bun.file(join(clientDistPath, "index.html"))
      }
      
      return Bun.file(filePath)
    })
  }
}