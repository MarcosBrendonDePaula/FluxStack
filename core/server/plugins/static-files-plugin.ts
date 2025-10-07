// 🔥 FluxStack Static Files Plugin - Serve Public Files

import { existsSync, statSync } from 'fs'
import { join, extname, resolve } from 'path'
import type { Plugin, PluginContext } from '../plugins/types'

export interface StaticFilesConfig {
  publicDir?: string // Default: 'public'
  uploadsDir?: string // Default: 'uploads'
  cacheMaxAge?: number // Default: 1 year in seconds
  enableUploads?: boolean // Default: true
  enablePublic?: boolean // Default: true
  publicRoute?: string // Default: '/public' (can be '/static' in dev)
  uploadsRoute?: string // Default: '/uploads'
}

export const staticFilesPlugin: Plugin = {
  name: 'static-files',
  version: '1.0.0',
  description: 'Serve static files and uploads with proper caching and security',
  author: 'FluxStack Team',
  priority: 'normal',
  category: 'core',
  tags: ['static', 'files', 'uploads', 'public'],
  
  setup: async (context: PluginContext) => {
    context.logger.debug('📁 Setting up Static Files plugin...')
    
    const config: StaticFilesConfig = {
      publicDir: 'public',
      uploadsDir: 'uploads', 
      cacheMaxAge: 31536000, // 1 year
      enableUploads: true,
      enablePublic: true,
      publicRoute: '/api/static', // Use /api/static in dev to avoid Vite conflicts
      uploadsRoute: '/api/uploads',
      ...context.config.staticFiles
    }
    
    const projectRoot = process.cwd()
    const publicPath = resolve(projectRoot, config.publicDir!)
    const uploadsPath = resolve(projectRoot, config.uploadsDir!)
    
    // MIME types mapping
    const getMimeType = (extension: string): string => {
      const mimeTypes: Record<string, string> = {
        // Images
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg', 
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
        
        // Documents
        '.pdf': 'application/pdf',
        '.txt': 'text/plain',
        '.json': 'application/json',
        '.xml': 'application/xml',
        
        // Web assets
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.html': 'text/html',
        '.htm': 'text/html',
        
        // Fonts
        '.woff': 'font/woff',
        '.woff2': 'font/woff2',
        '.ttf': 'font/ttf',
        '.otf': 'font/otf',
        
        // Audio/Video
        '.mp3': 'audio/mpeg',
        '.mp4': 'video/mp4',
        '.webm': 'video/webm',
        '.ogg': 'audio/ogg'
      }
      
      return mimeTypes[extension.toLowerCase()] || 'application/octet-stream'
    }
    
    // Security check for path traversal
    const isPathSafe = (filePath: string, basePath: string): boolean => {
      const resolvedPath = resolve(basePath, filePath)
      return resolvedPath.startsWith(basePath)
    }
    
    // Generic file serving function
    const serveFile = async (filePath: string, set: any) => {
      try {
        if (!existsSync(filePath)) {
          set.status = 404
          return { 
            error: 'File not found',
            path: filePath.replace(projectRoot, ''),
            timestamp: new Date().toISOString()
          }
        }
        
        const stats = statSync(filePath)
        if (!stats.isFile()) {
          set.status = 404
          return { error: 'Not a file' }
        }
        
        // Set appropriate headers
        const extension = extname(filePath).toLowerCase()
        const mimeType = getMimeType(extension)
        
        set.headers['content-type'] = mimeType
        set.headers['content-length'] = stats.size.toString()
        set.headers['last-modified'] = stats.mtime.toUTCString()
        set.headers['cache-control'] = `public, max-age=${config.cacheMaxAge}`
        set.headers['etag'] = `"${stats.mtime.getTime()}-${stats.size}"`
        
        // Security headers for images
        if (mimeType.startsWith('image/')) {
          set.headers['x-content-type-options'] = 'nosniff'
        }
        
        context.logger.debug(`📁 Serving file: ${filePath.replace(projectRoot, '')}`, {
          size: stats.size,
          mimeType,
          lastModified: stats.mtime
        })
        
        return Bun.file(filePath)
        
      } catch (error: any) {
        context.logger.error('❌ File serving error:', error.message)
        set.status = 500
        return { error: 'Failed to serve file' }
      }
    }
    
    // Add static file routes
    if (config.enablePublic) {
      const publicRoutePattern = `${config.publicRoute}/*`
      context.app.get(publicRoutePattern, ({ params, set }) => {
        const filePath = params['*'] || ''
        
        if (!isPathSafe(filePath, publicPath)) {
          set.status = 400
          return { error: 'Invalid file path' }
        }
        
        const fullPath = join(publicPath, filePath)
        return serveFile(fullPath, set)
      })
      
      context.logger.debug(`📁 Public files route enabled: ${publicRoutePattern} → ${config.publicDir}`)
    }
    
    if (config.enableUploads) {
      const uploadsRoutePattern = `${config.uploadsRoute}/*`
      context.app.get(uploadsRoutePattern, ({ params, set }) => {
        const filePath = params['*'] || ''
        
        if (!isPathSafe(filePath, uploadsPath)) {
          set.status = 400
          return { error: 'Invalid file path' }
        }
        
        const fullPath = join(uploadsPath, filePath)
        return serveFile(fullPath, set)
      })
      
      context.logger.debug(`📁 Uploads route enabled: ${uploadsRoutePattern} → ${config.uploadsDir}`)
    }
    
    // Static files info endpoint
    context.app.get('/api/static/info', () => {
      return {
        success: true,
        config: {
          publicDir: config.publicDir,
          uploadsDir: config.uploadsDir,
          enablePublic: config.enablePublic,
          enableUploads: config.enableUploads,
          cacheMaxAge: config.cacheMaxAge
        },
        paths: {
          publicPath,
          uploadsPath,
          publicUrl: config.publicRoute,
          uploadsUrl: config.uploadsRoute
        },
        timestamp: new Date().toISOString()
      }
    })
    
    // Create directories if they don't exist
    const { mkdir } = await import('fs/promises')
    
    if (config.enablePublic && !existsSync(publicPath)) {
      await mkdir(publicPath, { recursive: true })
      context.logger.debug(`📁 Created public directory: ${publicPath}`)
    }
    
    if (config.enableUploads && !existsSync(uploadsPath)) {
      await mkdir(uploadsPath, { recursive: true })
      await mkdir(join(uploadsPath, 'avatars'), { recursive: true })
      context.logger.debug(`📁 Created uploads directory: ${uploadsPath}`)
    }
    
    context.logger.debug('📁 Static Files plugin setup complete', {
      publicEnabled: config.enablePublic,
      uploadsEnabled: config.enableUploads,
      publicPath: config.enablePublic ? publicPath : 'disabled',
      uploadsPath: config.enableUploads ? uploadsPath : 'disabled'
    })
  },

  onServerStart: async (context: PluginContext) => {
    const config = {
      enablePublic: true,
      enableUploads: true,
      publicRoute: '/api/static',
      uploadsRoute: '/api/uploads',
      ...context.config.staticFiles
    }
    context.logger.debug('📁 Static Files plugin ready', {
      routes: [
        config.enablePublic ? `${config.publicRoute}/*` : null,
        config.enableUploads ? `${config.uploadsRoute}/*` : null,
        '/api/static/info'
      ].filter(Boolean)
    })
  }
}