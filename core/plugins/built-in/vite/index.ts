import type { FluxStack, PluginContext, RequestContext } from "../../types"
import { createServer, type ViteDevServer } from 'vite'
import { FLUXSTACK_VERSION } from "../../../utils/version"

type Plugin = FluxStack.Plugin

let viteServer: ViteDevServer | null = null

export const vitePlugin: Plugin = {
  name: "vite",
  version: FLUXSTACK_VERSION,
  description: "Enhanced Vite integration plugin for FluxStack with improved error handling and monitoring",
  author: "FluxStack Team",
  priority: 800, // Should run early to setup proxying
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
      context.logger.debug('Vite plugin disabled or no client configuration found')
      return
    }

    const vitePort = config.port || context.config.client.port || 5173
    const viteHost = config.host || "localhost"

    // Import group logger utilities
    const { startGroup, endGroup, logInGroup } = await import('../../../utils/logger/group-logger')

    try {
      startGroup({
        title: 'Vite Development Server',
        icon: '🎨',
        color: 'magenta',
        collapsed: true
      })

      logInGroup(`Starting on ${viteHost}:${vitePort}`, '📍')

      // Start Vite dev server programmatically
      viteServer = await createServer({
        configFile: './vite.config.ts',
        // Don't override root - let vite.config.ts handle it
        server: {
          port: vitePort,
          host: viteHost,
          strictPort: true
        },
        logLevel: 'warn' // Suppress Vite's verbose logs
      })

      await viteServer.listen()

      // Custom URL display instead of viteServer.printUrls()
      logInGroup(`Local: http://${viteHost}:${vitePort}/`, '✅')
      logInGroup('Hot reload coordination active', '🔄')

      endGroup()
      console.log('') // Separator line

        // Store Vite config in context for later use
        ; (context as any).viteConfig = {
          port: vitePort,
          host: viteHost,
          ...config,
          server: viteServer
        }

      // Setup cleanup on process exit
      const cleanup = async () => {
        if (viteServer) {
          context.logger.debug('🛑 Stopping Vite server...')
          await viteServer.close()
          viteServer = null
        }
      }

      process.on('SIGINT', cleanup)
      process.on('SIGTERM', cleanup)
      process.on('exit', cleanup)

    } catch (error) {
      // Check if error is related to port already in use
      const errorMessage = error instanceof Error ? error.message : String(error)
      const isPortInUse = errorMessage.includes('EADDRINUSE') ||
                         errorMessage.includes('address already in use') ||
                         errorMessage.includes('Port') && errorMessage.includes('is in use')

      if (isPortInUse) {
        endGroup()
        console.log('') // Separator line
        context.logger.error(`❌ Failed to start Vite: Port ${vitePort} is already in use`)
        context.logger.info(`💡 Try one of these solutions:`)
        context.logger.info(`   1. Stop the process using port ${vitePort}`)
        context.logger.info(`   2. Change VITE_PORT in your .env file`)
        context.logger.info(`   3. Kill the process: ${process.platform === 'win32' ? `netstat -ano | findstr :${vitePort}` : `lsof -ti:${vitePort} | xargs kill -9`}`)
        process.exit(1)
      } else {
        context.logger.error('❌ Failed to start Vite server:', errorMessage)
        context.logger.debug('Full error:', error)
        context.logger.debug('⚠️ Falling back to monitoring mode...')

        // Fallback to monitoring if programmatic start fails
        ; (context as any).viteConfig = {
          port: vitePort,
          host: viteHost,
          ...config
        }
        monitorVite(context, viteHost, vitePort, config)
      }
    }
  },

  onServerStart: async (context: PluginContext) => {
    const config = getPluginConfig(context)
    const viteConfig = (context as any).viteConfig

    if (config.enabled && viteConfig) {
      context.logger.debug(`Vite integration active - monitoring ${viteConfig.host}:${viteConfig.port}`)
    }
  },

  onBeforeRoute: async (requestContext: RequestContext) => {
    // Skip API routes and swagger - let them be handled by backend
    if (requestContext.path.startsWith("/api") || requestContext.path.startsWith("/swagger")) {
      return
    }

    // For Vite internal routes, proxy directly to Vite server
    if (requestContext.path.startsWith("/@") ||           // All Vite internal routes (/@vite/, /@fs/, /@react-refresh, etc.)
      requestContext.path.startsWith("/__vite") ||      // Vite HMR and dev routes
      requestContext.path.startsWith("/node_modules") || // Direct node_modules access
      requestContext.path.includes("/.vite/") ||        // Vite cache and deps
      requestContext.path.endsWith(".js.map") ||        // Source maps
      requestContext.path.endsWith(".css.map")) {       // CSS source maps

      // Use fixed configuration for Vite proxy
      const viteHost = "localhost"
      const vitePort = 5173

      try {
        const url = new URL(requestContext.request.url)
        const viteUrl = `http://${viteHost}:${vitePort}${requestContext.path}${url.search}`

        // Forward request to Vite
        const response = await fetch(viteUrl, {
          method: requestContext.method,
          headers: requestContext.headers,
          body: requestContext.method !== 'GET' && requestContext.method !== 'HEAD' ? requestContext.request.body : undefined
        })

        // Return the Vite response
        const body = await response.arrayBuffer()

        requestContext.handled = true
        requestContext.response = new Response(body, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers
        })

      } catch (viteError) {
        // If Vite fails, let the request continue to normal routing (will become 404)
        // Only log if explicitly enabled for debugging
        const { clientConfig } = await import('@/config/client.config')
        if (clientConfig.vite.enableLogging) {
          console.warn(`Vite proxy error: ${viteError}`)
        }
      }
      return
    }

    // Use fixed configuration for simplicity - Vite should be running on port 5173
    const viteHost = "localhost"
    const vitePort = 5173

    try {
      const url = new URL(requestContext.request.url)
      const viteUrl = `http://${viteHost}:${vitePort}${requestContext.path}${url.search}`

      // Forward request to Vite
      const response = await fetch(viteUrl, {
        method: requestContext.method,
        headers: requestContext.headers,
        body: requestContext.method !== 'GET' && requestContext.method !== 'HEAD' ? requestContext.request.body : undefined
      })

      // If Vite responds successfully, handle the request
      if (response.ok || response.status < 500) {
        // Return a proper Response object with all headers and status
        const body = await response.arrayBuffer()

        requestContext.handled = true
        requestContext.response = new Response(body, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers
        })
      }

    } catch (viteError) {
      // If Vite fails, let the request continue to normal routing (will become 404)
      // Only log if explicitly enabled for debugging
      const { clientConfig } = await import('@/config/client.config')
      if (clientConfig.vite.enableLogging) {
        console.warn(`Vite proxy error: ${viteError}`)
      }
    }
  }
}

// Helper function to get plugin config
function getPluginConfig(context: PluginContext) {
  const pluginConfig = context.config.plugins.config?.vite || {}
  return { ...vitePlugin.defaultConfig, ...pluginConfig }
}

// Monitor Vite server status with automatic port detection
async function monitorVite(
  context: PluginContext,
  host: string,
  initialPort: number,
  config: any
) {
  let retries = 0
  let isConnected = false
  let actualPort = initialPort
  let portDetected = false

  const checkVite = async () => {
    try {
      // If we haven't found the correct port yet, try to detect it
      if (!portDetected) {
        const detectedPort = await detectVitePort(host, initialPort)
        if (detectedPort !== null) {
          actualPort = detectedPort
          portDetected = true
          // Update the context with the detected port
          if ((context as any).viteConfig) {
            ; (context as any).viteConfig.port = actualPort
          }
        }
      }

      const isRunning = await checkViteRunning(host, actualPort, config.timeout)

      if (isRunning && !isConnected) {
        isConnected = true
        retries = 0
        if (actualPort !== initialPort) {
          context.logger.debug(`✓ Vite server detected on ${host}:${actualPort} (auto-detected from port ${initialPort})`)
        } else {
          context.logger.debug(`✓ Vite server detected on ${host}:${actualPort}`)
        }
        context.logger.debug("Hot reload coordination active")
      } else if (!isRunning && isConnected) {
        isConnected = false
        context.logger.warn(`✗ Vite server disconnected from ${host}:${actualPort}`)
        // Reset port detection when disconnected
        portDetected = false
        actualPort = initialPort
      } else if (!isRunning) {
        retries++
        if (retries <= config.maxRetries) {
          if (portDetected) {
            context.logger.debug(`Waiting for Vite server on ${host}:${actualPort}... (${retries}/${config.maxRetries})`)
          } else {
            context.logger.debug(`Detecting Vite server port... (${retries}/${config.maxRetries})`)
          }
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

// Auto-detect Vite port by trying common ports
async function detectVitePort(host: string, startPort: number): Promise<number | null> {
  // Try the initial port first, then common alternatives
  const portsToTry = [
    startPort,
    startPort + 1,
    startPort + 2,
    startPort + 3,
    5174, // Common Vite alternative
    5175,
    5176,
    3000, // Sometimes Vite might use this
    4173  // Another common alternative
  ]

  for (const port of portsToTry) {
    try {
      const isRunning = await checkViteRunning(host, port, 1000)
      if (isRunning) {
        return port
      }
    } catch (error) {
      // Continue trying other ports
    }
  }

  return null
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

// Note: Proxy logic is now handled directly in the onBeforeRoute hook above

export default vitePlugin