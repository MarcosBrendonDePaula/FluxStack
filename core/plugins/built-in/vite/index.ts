import { join } from "path"
import type { Plugin, PluginContext, RequestContext } from "../../types"

export const vitePlugin: Plugin = {
  name: "vite",
  version: "1.0.0",
  description: "Enhanced Vite integration plugin for FluxStack with improved error handling and monitoring",
  author: "FluxStack Team",
  priority: "high", // Should run early to setup proxying
  category: "development",
  tags: ["vite", "development", "hot-reload"],
  dependencies: [], // No dependencies
  
  configSchema: {
    type: "object",
    properties: {
      enabled: {
        type: "boolean",
        description: "Enable Vite integration"
      },
      port: {
        type: "number",
        minimum: 1,
        maximum: 65535,
        description: "Vite development server port"
      },
      host: {
        type: "string",
        description: "Vite development server host"
      },
      checkInterval: {
        type: "number",
        minimum: 100,
        description: "Interval to check if Vite is running (ms)"
      },
      maxRetries: {
        type: "number",
        minimum: 1,
        description: "Maximum retries to connect to Vite"
      },
      timeout: {
        type: "number",
        minimum: 100,
        description: "Timeout for Vite requests (ms)"
      },
      proxyPaths: {
        type: "array",
        items: { type: "string" },
        description: "Paths to proxy to Vite (defaults to all non-API paths)"
      },
      excludePaths: {
        type: "array", 
        items: { type: "string" },
        description: "Paths to exclude from Vite proxying"
      }
    },
    additionalProperties: false
  },
  
  defaultConfig: {
    enabled: true,
    port: 5173,
    host: "localhost",
    checkInterval: 2000,
    maxRetries: 10,
    timeout: 5000,
    proxyPaths: [],
    excludePaths: []
  },

  setup: async (context: PluginContext) => {
    const config = getPluginConfig(context)
    
    if (!config.enabled || !context.config.client) {
      context.logger.info('Vite plugin disabled or no client configuration found')
      return
    }
    
    const vitePort = config.port || context.config.client.port || 5173
    const viteHost = config.host || "localhost"
    
    context.logger.info(`Setting up Vite integration on ${viteHost}:${vitePort}`)
    
    // Store Vite config in context for later use
    ;(context as any).viteConfig = {
      port: vitePort,
      host: viteHost,
      ...config
    }
    
    // Start monitoring Vite in the background
    monitorVite(context, viteHost, vitePort, config)
  },

  onServerStart: async (context: PluginContext) => {
    const config = getPluginConfig(context)
    const viteConfig = (context as any).viteConfig
    
    if (config.enabled && viteConfig) {
      context.logger.info(`Vite integration active - monitoring ${viteConfig.host}:${viteConfig.port}`)
    }
  },

  onRequest: async (requestContext: RequestContext) => {
    // This would be called by the static plugin or routing system
    // to determine if a request should be proxied to Vite
    const url = new URL(requestContext.request.url)
    
    // Skip API routes
    if (url.pathname.startsWith('/api')) {
      return
    }
    
    // This is where we'd implement the proxying logic
    // In practice, this would be handled by the static plugin
  }
}

// Helper function to get plugin config
function getPluginConfig(context: PluginContext) {
  const pluginConfig = context.config.plugins.config?.vite || {}
  return { ...vitePlugin.defaultConfig, ...pluginConfig }
}

// Monitor Vite server status
async function monitorVite(
  context: PluginContext, 
  host: string, 
  port: number, 
  config: any
) {
  let retries = 0
  let isConnected = false
  
  const checkVite = async () => {
    try {
      const isRunning = await checkViteRunning(host, port, config.timeout)
      
      if (isRunning && !isConnected) {
        isConnected = true
        retries = 0
        context.logger.info(`✓ Vite server detected on ${host}:${port}`)
        context.logger.info("Hot reload coordination active")
      } else if (!isRunning && isConnected) {
        isConnected = false
        context.logger.warn(`✗ Vite server disconnected from ${host}:${port}`)
      } else if (!isRunning) {
        retries++
        if (retries <= config.maxRetries) {
          context.logger.debug(`Waiting for Vite server... (${retries}/${config.maxRetries})`)
        } else if (retries === config.maxRetries + 1) {
          context.logger.warn(`Vite server not found after ${config.maxRetries} attempts. Development features may be limited.`)
        }
      }
    } catch (error) {
      if (isConnected) {
        context.logger.error('Error checking Vite server status', { error })
      }
    }
    
    // Continue monitoring
    setTimeout(checkVite, config.checkInterval)
  }
  
  // Start monitoring after a brief delay
  setTimeout(checkVite, 1000)
}

// Check if Vite is running
async function checkViteRunning(host: string, port: number, timeout: number = 1000): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)
    
    const response = await fetch(`http://${host}:${port}`, {
      signal: controller.signal,
      method: 'HEAD' // Use HEAD to minimize data transfer
    })
    
    clearTimeout(timeoutId)
    return response.status >= 200 && response.status < 500
  } catch (error) {
    return false
  }
}

// Proxy request to Vite server
export const proxyToVite = async (
  request: Request, 
  viteHost: string = "localhost",
  vitePort: number = 5173,
  timeout: number = 5000
): Promise<Response> => {
  const url = new URL(request.url)
  
  // Don't proxy API routes
  if (url.pathname.startsWith("/api")) {
    return new Response("Not Found", { status: 404 })
  }
  
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)
    
    const viteUrl = `http://${viteHost}:${vitePort}${url.pathname}${url.search}`
    
    const response = await fetch(viteUrl, {
      method: request.method,
      headers: request.headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return new Response("Vite server timeout", { status: 504 })
    }
    return new Response("Vite server not available", { status: 503 })
  }
}

export default vitePlugin