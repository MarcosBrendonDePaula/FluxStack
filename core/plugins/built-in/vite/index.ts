import type { FluxStack, PluginContext, RequestContext } from "@/core/plugins/types"
import { FLUXSTACK_VERSION } from "@/core/utils/version"
import { clientConfig } from '@/config/client.config'
import { pluginsConfig } from '@/config/plugins.config'
import { isDevelopment } from "@/core/utils/helpers"
import { join } from "path"
import { statSync, existsSync } from "fs"

type Plugin = FluxStack.Plugin

// Plugin priority (higher = runs earlier)
const PLUGIN_PRIORITY = 800

// Configuration constants
const CONFIG = {
  publicDir: clientConfig.build.outDir,
  indexFile: "index.html"
}

/**
 * Discover the base directory for static files
 */
function discoverBaseDir(): string {
  if (existsSync('client')) {
    return 'client' // Running from dist/
  }
  if (existsSync('dist/client')) {
    return 'dist/client' // Running from project root
  }
  return CONFIG.publicDir // Fallback
}

/**
 * Create static file fallback handler for production
 */
function createStaticFallback() {
  return (c: { request?: Request }) => {
    const req = c.request
    if (!req) return

    const url = new URL(req.url)
    let pathname = decodeURIComponent(url.pathname)
    const baseDir = discoverBaseDir()

    // Root or empty path → index.html
    if (pathname === '/' || pathname === '') {
      pathname = `/${CONFIG.indexFile}`
    }

    const filePath = join(baseDir, pathname)

    try {
      const info = statSync(filePath)
      if (info.isFile()) {
        return Bun.file(filePath)
      }
    } catch {
      // File not found → continue
    }

    // SPA fallback: serve index.html for non-file routes
    const indexPath = join(baseDir, CONFIG.indexFile)
    try {
      statSync(indexPath)
      return Bun.file(indexPath)
    } catch {
      // Index not found → let request continue (404)
    }
  }
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

/**
 * Proxy request to Vite dev server
 */
async function proxyToVite(requestContext: RequestContext): Promise<void> {
  const viteHost = clientConfig.vite.host
  const vitePort = clientConfig.vite.port

  try {
    const url = parseRequestURL(requestContext.request)
    const viteUrl = `http://${viteHost}:${vitePort}${requestContext.path}${url.search}`

    const response = await fetch(viteUrl, {
      method: requestContext.method,
      headers: requestContext.headers,
      body: requestContext.method !== 'GET' && requestContext.method !== 'HEAD'
        ? requestContext.request.body
        : undefined
    })

    const body = await response.arrayBuffer()

    requestContext.handled = true
    requestContext.response = new Response(body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    })
  } catch (viteError) {
    if (clientConfig.vite.enableLogging) {
      console.warn(`Vite proxy error: ${viteError}`)
    }
  }
}

export const vitePlugin: Plugin = {
  name: "vite",
  version: FLUXSTACK_VERSION,
  description: "Enhanced Vite integration plugin for FluxStack with improved error handling and monitoring",
  author: "FluxStack Team",
  priority: PLUGIN_PRIORITY,
  category: "development",
  tags: ["vite", "development", "hot-reload"],
  dependencies: [],

  setup: async (context: PluginContext) => {
    if (!pluginsConfig.viteEnabled) {
      context.logger.debug('Vite plugin disabled')
      return
    }

    // Production mode: setup static file serving
    if (!isDevelopment()) {
      context.logger.debug("Production mode: static file serving enabled", {
        publicDir: CONFIG.publicDir
      })

      // Register as catch-all fallback (runs after all other routes)
      context.app.all('*', createStaticFallback())
      return
    }

    // Development mode: import and setup Vite dev server
    const { setupViteDev } = await import('./vite-dev')
    await setupViteDev(context)
  },

  onServerStart: async (context: PluginContext) => {
    if (!pluginsConfig.viteEnabled) return

    if (!isDevelopment()) {
      context.logger.debug(`Static files ready`, {
        publicDir: CONFIG.publicDir,
        indexFile: CONFIG.indexFile
      })
      return
    }

    context.logger.debug(`Vite integration active - monitoring ${clientConfig.vite.host}:${clientConfig.vite.port}`)
  },

  onBeforeRoute: async (requestContext: RequestContext) => {
    // Production mode: static serving handled by catch-all route in setup
    if (!isDevelopment()) return
    const path = requestContext.path

    const shouldSkip = pluginsConfig.viteExcludePaths.some(prefix => {
      return path === prefix || path.startsWith(prefix + '/')
    })

    if (shouldSkip) {
      return
    }

    // Proxy all remaining requests to Vite dev server
    await proxyToVite(requestContext)
  }
}

export default vitePlugin