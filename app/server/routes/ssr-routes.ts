/**
 * SSR Routes
 * Handles server-side rendering for the main application
 */

import { Elysia } from 'elysia'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export const ssrRoutes = new Elysia({ prefix: '' })
  .get('/', async ({ set }) => {
    try {
      // In development, this will be handled by Vite
      // In production, we'll serve the SSR-rendered HTML
      if (process.env.NODE_ENV === 'production') {
        const templatePath = resolve(__dirname, '../../../app/client/index-ssr.html')
        const serverBundlePath = resolve(__dirname, '../../../dist/server/entry-server.js')

        try {
          const template = readFileSync(templatePath, 'utf-8')
          const ssrModule = await import(serverBundlePath)

          // Render the React app on the server
          const appHtml = ssrModule.render()

          // Inject the rendered HTML into the template
          const html = template.replace('<!--ssr-outlet-->', appHtml)

          set.headers['Content-Type'] = 'text/html; charset=utf-8'
          return html
        } catch (error) {
          console.error('SSR rendering error:', error)
          // Fallback to client-side rendering
          const fallbackTemplate = readFileSync(
            resolve(__dirname, '../../../app/client/index.html'),
            'utf-8'
          )
          set.headers['Content-Type'] = 'text/html; charset=utf-8'
          return fallbackTemplate
        }
      }

      // In development, return a placeholder
      set.headers['Content-Type'] = 'text/html; charset=utf-8'
      return `
        <!DOCTYPE html>
        <html>
          <head>
            <title>FluxStack - SSR Development</title>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          </head>
          <body>
            <div id="root"></div>
            <script type="module" src="/@vite/client"></script>
            <script type="module" src="/src/entry-client.tsx"></script>
          </body>
        </html>
      `
    } catch (error) {
      console.error('Error serving SSR page:', error)
      set.status = 500
      return 'Internal Server Error'
    }
  })

export default ssrRoutes
