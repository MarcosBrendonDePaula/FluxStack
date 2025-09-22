import { join, extname } from "path"
import { existsSync, statSync } from "fs"
import type { Plugin, PluginContext } from "../../types"

export const staticPlugin: Plugin = {
  name: "static",
  version: "1.0.0",
  description: "Enhanced static file serving plugin for FluxStack with caching and compression",
  author: "FluxStack Team",
  priority: "low", // Should run after other plugins
  category: "core",
  tags: ["static", "files", "spa"],
  dependencies: [], // No hard dependencies, but works with vite plugin
  
  configSchema: {
    type: "object",
    properties: {
      enabled: {
        type: "boolean",
        description: "Enable static file serving"
      },
      publicDir: {
        type: "string",
        description: "Public directory for static files"
      },
      distDir: {
        type: "string", 
        description: "Distribution directory for built files"
      },
      indexFile: {
        type: "string",
        description: "Index file for SPA routing"
      },
      cacheControl: {
        type: "object",
        properties: {
          enabled: { type: "boolean" },
          maxAge: { type: "number" },
          immutable: { type: "boolean" }
        },
        description: "Cache control settings"
      },
      compression: {
        type: "object",
        properties: {
          enabled: { type: "boolean" },
          types: {
            type: "array",
            items: { type: "string" }
          }
        },
        description: "Compression settings"
      },
      spa: {
        type: "object",
        properties: {
          enabled: { type: "boolean" },
          fallback: { type: "string" }
        },
        description: "Single Page Application settings"
      },
      excludePaths: {
        type: "array",
        items: { type: "string" },
        description: "Paths to exclude from static serving"
      }
    },
    additionalProperties: false
  },
  
  defaultConfig: {
    enabled: true,
    publicDir: "public",
    distDir: "dist/client",
    indexFile: "index.html",
    cacheControl: {
      enabled: true,
      maxAge: 31536000, // 1 year for assets
      immutable: true
    },
    compression: {
      enabled: true,
      types: [".js", ".css", ".html", ".json", ".svg"]
    },
    spa: {
      enabled: true,
      fallback: "index.html"
    },
    excludePaths: []
  },

  setup: async (context: PluginContext) => {
    const config = getPluginConfig(context)
    
    if (!config.enabled) {
      context.logger.info('Static files plugin disabled by configuration')
      return
    }

    context.logger.info("Enhanced static files plugin activated", {
      publicDir: config.publicDir,
      distDir: config.distDir,
      spa: config.spa.enabled,
      compression: config.compression.enabled
    })
    
    // Setup static file handling in Elysia
    context.app.get("/*", async ({ request, set }: { request: Request, set: any }) => {
      const url = new URL(request.url)
      
      // Skip API routes
      if (url.pathname.startsWith(context.config.server.apiPrefix)) {
        return
      }
      
      // Skip excluded paths
      if (config.excludePaths.some((path: string) => url.pathname.startsWith(path))) {
        return
      }
      
      try {
        // Note: Vite proxy is now handled by the Vite plugin via onBeforeRoute hook
        // This plugin only handles static files serving in production or fallback
        
        // Serve static files
        return await serveStaticFile(url.pathname, config, context, set)
        
      } catch (error) {
        context.logger.error("Error serving static file", { 
          path: url.pathname, 
          error: error instanceof Error ? error.message : String(error)
        })
        
        set.status = 500
        return "Internal Server Error"
      }
    })
  },

  onServerStart: async (context: PluginContext) => {
    const config = getPluginConfig(context)
    
    if (config.enabled) {
      const mode = context.utils.isDevelopment() ? 'development' : 'production'
      context.logger.info(`Static files plugin ready in ${mode} mode`, {
        publicDir: config.publicDir,
        distDir: config.distDir,
        spa: config.spa.enabled
      })
    }
  }
}

// Helper function to get plugin config
function getPluginConfig(context: PluginContext) {
  const pluginConfig = context.config.plugins.config?.static || {}
  return { ...staticPlugin.defaultConfig, ...pluginConfig }
}

// Serve static file
async function serveStaticFile(
  pathname: string, 
  config: any, 
  context: PluginContext,
  set: any
): Promise<any> {
  const isDev = context.utils.isDevelopment()
  
  // Determine base directory with production path fix
  let baseDir: string
  
  if (isDev && existsSync(config.publicDir)) {
    baseDir = config.publicDir
  } else {
    // In production, check if we're running from dist/ directory
    const isRunningFromDist = process.cwd().endsWith('dist') || process.cwd().includes('dist')
    
    if (isRunningFromDist) {
      // Running from dist/ - use relative paths
      baseDir = existsSync('client') ? 'client' : config.distDir
    } else {
      // Running from project root - use configured path
      baseDir = config.distDir
    }
  }
  
  if (!existsSync(baseDir)) {
    context.logger.warn(`Static directory not found: ${baseDir}`)
    set.status = 404
    return "Not Found"
  }
  
  // Clean pathname
  const cleanPath = pathname === '/' ? `/${config.indexFile}` : pathname
  const filePath = join(process.cwd(), baseDir, cleanPath)
  
  // Security check - prevent directory traversal
  const resolvedPath = join(process.cwd(), baseDir)
  if (!filePath.startsWith(resolvedPath)) {
    set.status = 403
    return "Forbidden"
  }
  
  // Check if file exists
  if (!existsSync(filePath)) {
    // For SPA, serve index.html for non-file routes
    if (config.spa.enabled && !pathname.includes('.')) {
      const indexPath = join(process.cwd(), baseDir, config.spa.fallback)
      if (existsSync(indexPath)) {
        return serveFile(indexPath, config, set, context)
      }
    }
    
    set.status = 404
    return "Not Found"
  }
  
  // Check if it's a directory
  const stats = statSync(filePath)
  if (stats.isDirectory()) {
    const indexPath = join(filePath, config.indexFile)
    if (existsSync(indexPath)) {
      return serveFile(indexPath, config, set, context)
    }
    
    set.status = 404
    return "Not Found"
  }
  
  return serveFile(filePath, config, set, context)
}

// Serve individual file
function serveFile(filePath: string, config: any, set: any, context: PluginContext) {
  const ext = extname(filePath)
  const file = Bun.file(filePath)
  
  // Set content type
  const mimeTypes: Record<string, string> = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject'
  }
  
  const contentType = mimeTypes[ext] || 'application/octet-stream'
  set.headers['Content-Type'] = contentType
  
  // Set cache headers
  if (config.cacheControl.enabled) {
    if (ext === '.html') {
      // Don't cache HTML files aggressively
      set.headers['Cache-Control'] = 'no-cache'
    } else {
      // Cache assets aggressively
      const maxAge = config.cacheControl.maxAge
      const cacheControl = config.cacheControl.immutable 
        ? `public, max-age=${maxAge}, immutable`
        : `public, max-age=${maxAge}`
      set.headers['Cache-Control'] = cacheControl
    }
  }
  
  // Add compression hint if enabled
  if (config.compression.enabled && config.compression.types.includes(ext)) {
    set.headers['Vary'] = 'Accept-Encoding'
  }
  
  context.logger.debug(`Serving static file: ${filePath}`, {
    contentType,
    size: file.size
  })
  
  return file
}

export default staticPlugin