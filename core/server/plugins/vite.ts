import type { Plugin, PluginContext, RequestContext } from "../../types"

export const vitePlugin: Plugin = {
  name: "vite",
  setup: (context: PluginContext) => {
    if (!context.utils.isDevelopment()) return
    
    const vitePort = context.config.client?.port || 5173
    
    // Wait for Vite to start (when using concurrently)
    setTimeout(async () => {
      const isViteRunning = await checkViteRunning(vitePort)
      
      if (isViteRunning) {
        context.logger.info(`✓ Vite server detected on localhost:${vitePort}`)
        context.logger.info('Hot reload coordination active')
      }
    }, 2000)
    
    context.logger.info(`Setting up Vite integration on localhost:${vitePort}`)
  },

  onBeforeRoute: async (context: RequestContext) => {
    // Skip API routes and swagger - let them be handled by backend
    if (context.path.startsWith("/api") || context.path.startsWith("/swagger")) {
      return
    }
    
    // For all other routes, try to proxy to Vite
    const vitePort = 5173 // TODO: Get from config context
    
    try {
      const url = new URL(context.request.url)
      const viteUrl = `http://localhost:${vitePort}${context.path}${url.search}`
      
      // Forward request to Vite
      const response = await fetch(viteUrl, {
        method: context.method,
        headers: context.headers
      })
      
      // If Vite responds successfully, handle the request
      if (response.ok || response.status < 500) {
        // Return a proper Response object with all headers and status
        const body = await response.arrayBuffer()
        
        context.handled = true
        context.response = new Response(body, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers
        })
      }
      
    } catch (viteError) {
      // If Vite fails, let the request continue to normal routing (will become 404)
      console.warn(`Vite proxy error: ${viteError}`)
    }
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