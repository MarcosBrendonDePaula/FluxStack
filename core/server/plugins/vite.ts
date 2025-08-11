import { join } from "path"
import type { Plugin } from "../../types"

export const vitePlugin: Plugin = {
  name: "vite",
  setup: async (context, app) => {
    if (!context.isDevelopment) return
    
    const vitePort = context.config.vitePort || 5173
    
    // Wait for Vite to start (when using concurrently)
    setTimeout(async () => {
      const isViteRunning = await checkViteRunning(vitePort)
      
      if (isViteRunning) {
        console.log(`   ✅ Vite detectado na porta ${vitePort}`)
        console.log("   🔄 Hot reload coordenado via concurrently")
      }
    }, 2000)
    
    // Don't block server startup
    console.log(`   🔄 Aguardando Vite na porta ${vitePort}...`)
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