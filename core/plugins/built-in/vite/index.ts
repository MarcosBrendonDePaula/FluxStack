import type { FluxStack, PluginContext, RequestContext } from "@/core/plugins/types"
import { FLUXSTACK_VERSION } from "@/core/utils/version"
import { clientConfig } from '@/config/client.config'
import { isDevelopment } from "@/core/utils/helpers"
import { join } from "path"
import { statSync, existsSync } from "fs"

type Plugin = FluxStack.Plugin

// Dynamic import type for vite
type ViteDevServer = Awaited<ReturnType<typeof import('vite')['createServer']>>
let viteServer: ViteDevServer | null = null

// Default configuration values (uses clientConfig from /config)
const DEFAULTS = {
  enabled: true,
  port: clientConfig.vite.port,
  host: clientConfig.vite.host,
  checkInterval: 2000,
  maxRetries: 10,
  timeout: 5000,
  proxyPaths: [] as string[],
  excludePaths: [] as string[],
  // Static file serving (production) - uses clientConfig
  publicDir: clientConfig.build.outDir,
  indexFile: "index.html"
}

/**
 * Helper to safely parse request.url which might be relative or absolute
 */
function parseRequestURL(request: Request): URL {
  try {
    // Try parsing as absolute URL first
    return new URL(request.url)
  } catch {
    // If relative, use host from headers or default to localhost
    const host = request.headers.get('host') || 'localhost'
    const protocol = request.headers.get('x-forwarded-proto') || 'http'
    return new URL(request.url, `${protocol}://${host}`)
  }
}

export const vitePlugin: Plugin = {
  name: "vite",
  version: FLUXSTACK_VERSION,
  description: "Enhanced Vite integration plugin for FluxStack with improved error handling and monitoring",
  author: "FluxStack Team",
  priority: 800, // Should run early to setup proxying
  category: "development",
  tags: ["vite", "development", "hot-reload"],
  dependencies: [],

  setup: async (context: PluginContext) => {
    if (!DEFAULTS.enabled) {
      context.logger.debug('Vite plugin disabled or no client configuration found')
      return
    }

    // Production mode: setup static file serving
    if (!isDevelopment()) {
      context.logger.debug("Production mode: static file serving enabled", {
        publicDir: DEFAULTS.publicDir
      })

      // Static fallback handler (runs last)
      const staticFallback = (c: any) => {
        const req = c.request
        if (!req) return

        const url = new URL(req.url)
        let pathname = decodeURIComponent(url.pathname)

        // Determine base directory using path discovery
        let baseDir: string

        // Production: try paths in order of preference
        if (existsSync('client')) {
          // Found client/ in current directory (running from dist/)
          baseDir = 'client'
        } else if (existsSync('dist/client')) {
          // Found dist/client/ (running from project root)
          baseDir = 'dist/client'
        } else {
          // Fallback to configured path
          baseDir = DEFAULTS.publicDir
        }

        // Root or empty path → index.html
        if (pathname === '/' || pathname === '') {
          pathname = `/${DEFAULTS.indexFile}`
        }

        const filePath = join(baseDir, pathname)

        try {
          const info = statSync(filePath)

          // File exists → serve it
          if (info.isFile()) {
            return Bun.file(filePath)
          }
        } catch (_) {
          // File not found → continue
        }

        // SPA fallback: serve index.html for non-file routes
        const indexPath = join(baseDir, DEFAULTS.indexFile)
        try {
          statSync(indexPath) // Ensure index exists
          return Bun.file(indexPath)
        } catch (_) {
          // Index not found → let request continue (404)
        }
      }

      // Register as catch-all fallback (runs after all other routes)
      context.app.all('*', staticFallback)
      return
    }

    // Development mode: Vite dev server
    const vitePort = DEFAULTS.port || clientConfig.vite.port || 5173
    const viteHost = DEFAULTS.host || "localhost"

    // Import group logger utilities
    const { startGroup, endGroup, logInGroup } = await import('@/core/utils/logger/group-logger')

    try {
      // Dynamic import of vite to avoid bundling in production
      const { createServer } = await import('vite')

      // Start Vite dev server programmatically (silently)
      viteServer = await createServer({
        configFile: './vite.config.ts',
        // Don't override root - let vite.config.ts handle it
        server: {
          port: vitePort,
          host: viteHost,
          strictPort: true
        },
        logLevel: 'silent' // Suppress all Vite logs
      })

      await viteServer.listen()

      context.logger.debug(`Vite server started on ${viteHost}:${vitePort} (internal proxy)`)
      context.logger.debug('Hot reload coordination active')

        // Store Vite config in context for later use
        ; (context as any).viteConfig = {
          port: vitePort,
          host: viteHost,
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
          host: viteHost
        }
        monitorVite(context, viteHost, vitePort)
      }
    }
  },

  onServerStart: async (context: PluginContext) => {
    if (!DEFAULTS.enabled) return

    if (!isDevelopment()) {
      context.logger.debug(`Static files ready`, {
        publicDir: DEFAULTS.publicDir,
        indexFile: DEFAULTS.indexFile
      })
      return
    }

    const viteConfig = (context as any).viteConfig
    if (viteConfig) {
      context.logger.debug(`Vite integration active - monitoring ${viteConfig.host}:${viteConfig.port}`)
    }
  },

  onBeforeRoute: async (requestContext: RequestContext) => {
    // Production mode: static serving handled by catch-all route in setup
    if (!isDevelopment()) return

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
        const url = parseRequestURL(requestContext.request)
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
      const url = parseRequestURL(requestContext.request)
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

// Monitor Vite server status with automatic port detection
async function monitorVite(
  context: PluginContext,
  host: string,
  initialPort: number
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

      const isRunning = await checkViteRunning(host, actualPort, DEFAULTS.timeout)

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
        if (retries <= DEFAULTS.maxRetries) {
          if (portDetected) {
            context.logger.debug(`Waiting for Vite server on ${host}:${actualPort}... (${retries}/${DEFAULTS.maxRetries})`)
          } else {
            context.logger.debug(`Detecting Vite server port... (${retries}/${DEFAULTS.maxRetries})`)
          }
        } else if (retries === DEFAULTS.maxRetries + 1) {
          context.logger.warn(`Vite server not found after ${DEFAULTS.maxRetries} attempts. Development features may be limited.`)
        }
      }
    } catch (error) {
      if (isConnected) {
        context.logger.error('Error checking Vite server status', { error })
      }
    }

    // Continue monitoring
    setTimeout(checkVite, DEFAULTS.checkInterval)
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