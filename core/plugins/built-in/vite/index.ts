import { join } from "path"
import type { Plugin } from "../../../plugins/types"

export const vitePlugin: Plugin = {
  name: "vite",
  version: "1.0.0",
  description: "Vite integration plugin for FluxStack",
  setup: async (context) => {
    if (!context.config.client) return
    
    const vitePort = context.config.client.port || 5173
    
    // Wait for Vite to start (when using concurrently)
    setTimeout(async () => {
      const isViteRunning = await checkViteRunning(vitePort)
      
      if (isViteRunning) {
        context.logger.info(`Vite detected on port ${vitePort}`)
        context.logger.info("Hot reload coordinated via concurrently")
      }
    }, 2000)
    
    // Don't block server startup
    context.logger.info(`Waiting for Vite on port ${vitePort}...`)
  }
}

async function checkViteRunning(port: number): Promise<boolean> {
  try {
    const response = await fetch(`http://localhost:${port}`, {
      signal: AbortSignal.timeout(1000)
    })
    return response.status >= 200 && response.status < 500
  } catch (error) {
    return false
  }
}

export const proxyToVite = async (request: Request, vitePort: number) => {
  const url = new URL(request.url)
  
  if (url.pathname.startsWith("/api")) {
    return new Response("Not Found", { status: 404 })
  }
  
  try {
    const viteUrl = `http://localhost:${vitePort}${url.pathname}${url.search}`
    const response = await fetch(viteUrl)
    return response
  } catch (error) {
    return new Response("Vite server not ready", { status: 503 })
  }
}