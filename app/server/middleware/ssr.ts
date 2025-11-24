/**
 * SSR Middleware for Elysia.js
 * Handles server-side rendering of React components
 */

import { Elysia } from 'elysia'
import { readFileSync } from 'fs'
import { resolve } from 'path'

interface SSROptions {
  enabled?: boolean
  distPath?: string
  templatePath?: string
}

export function createSSRMiddleware(options: SSROptions = {}) {
  const {
    enabled = process.env.NODE_ENV === 'production',
    distPath = resolve(process.cwd(), 'dist'),
    templatePath = resolve(process.cwd(), 'app/client/index-ssr.html')
  } = options

  return new Elysia({ name: 'ssr' })
    .derive(async () => {
      let template: string | null = null
      let ssrModule: any = null

      // Load template and SSR module in production
      if (enabled) {
        try {
          template = readFileSync(templatePath, 'utf-8')
          const serverBundlePath = resolve(distPath, 'server', 'entry-server.js')
          ssrModule = await import(serverBundlePath)
        } catch (error) {
          console.error('Failed to load SSR assets:', error)
        }
      }

      return {
        template,
        ssrModule
      }
    })
    .get('/*', async ({ template, ssrModule, path, set }) => {
      // Skip SSR for API routes, static files, and swagger
      if (
        path.startsWith('/api') ||
        path.startsWith('/swagger') ||
        path.startsWith('/public') ||
        path.includes('.')
      ) {
        return null // Let other handlers process these
      }

      // If SSR is not enabled or assets not loaded, return null
      if (!enabled || !template || !ssrModule) {
        return null
      }

      try {
        // Render the React app on the server
        const appHtml = ssrModule.render()

        // Inject the rendered HTML into the template
        const html = template.replace('<!--ssr-outlet-->', appHtml)

        set.headers['Content-Type'] = 'text/html; charset=utf-8'
        return html
      } catch (error) {
        console.error('SSR rendering error:', error)
        set.status = 500
        return 'Internal Server Error'
      }
    })
}

export default createSSRMiddleware
