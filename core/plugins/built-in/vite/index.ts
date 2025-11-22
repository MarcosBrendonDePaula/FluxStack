import type { FluxStack, PluginContext, RequestContext } from "@/core/plugins/types"
import { FLUXSTACK_VERSION } from "@/core/utils/version"
import { clientConfig } from '@/config/client.config'
import { isDevelopment } from "@/core/utils/helpers"
import { join } from "path"
import { statSync, existsSync } from "fs"

type Plugin = FluxStack.Plugin

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

    // Development mode: import and setup Vite dev server
    const { setupViteDev } = await import('./vite-dev')
    await setupViteDev(context)
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
      if (clientConfig.vite.enableLogging) {
        console.warn(`Vite proxy error: ${viteError}`)
      }
    }
  }
}


export default vitePlugin