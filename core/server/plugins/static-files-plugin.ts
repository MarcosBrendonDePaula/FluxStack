// 🔥 FluxStack Static Files Plugin - Serve Public Files & Uploads

import { existsSync, statSync } from 'fs'
import { mkdir } from 'fs/promises'
import { resolve } from 'path'
import type { Plugin, PluginContext } from '../../plugins/types'

export const staticFilesPlugin: Plugin = {
  name: 'static-files',
  description: 'Serve static files and uploads',
  author: 'FluxStack Team',
  priority: 'normal',
  category: 'core',
  tags: ['static', 'files', 'uploads'],

  setup: async (context: PluginContext) => {
    const projectRoot = process.cwd()
    const publicDir = resolve(projectRoot, 'public')
    const uploadsDir = resolve(projectRoot, 'uploads')

    // Create directories if they don't exist
    await mkdir(publicDir, { recursive: true })
    await mkdir(uploadsDir, { recursive: true })
    await mkdir(resolve(uploadsDir, 'avatars'), { recursive: true })

    // Helper to serve files from a directory
    const serveFile = (baseDir: string) => ({ params, set }: any) => {
      const requestedPath = params['*'] || ''
      const filePath = resolve(baseDir, requestedPath)

      // Path traversal protection
      if (!filePath.startsWith(baseDir)) {
        set.status = 400
        return { error: 'Invalid path' }
      }

      // Check if file exists
      if (!existsSync(filePath)) {
        set.status = 404
        return { error: 'File not found' }
      }

      // Check if it's a file (not directory)
      try {
        if (!statSync(filePath).isFile()) {
          set.status = 404
          return { error: 'Not a file' }
        }
      } catch {
        set.status = 404
        return { error: 'File not found' }
      }

      // Set cache header (1 year)
      set.headers['cache-control'] = 'public, max-age=31536000'

      // Bun.file() handles: content-type, content-length, streaming
      return Bun.file(filePath)
    }

    // Register routes
    context.app.get('/api/static/*', serveFile(publicDir))
    context.app.get('/api/uploads/*', serveFile(uploadsDir))

    context.logger.debug('📁 Static files plugin ready', {
      routes: ['/api/static/*', '/api/uploads/*']
    })
  }
}
