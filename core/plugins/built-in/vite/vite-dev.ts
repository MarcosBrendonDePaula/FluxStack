import type { PluginContext } from "@/core/plugins/types"
import { clientConfig } from '@/config/client.config'

// Dynamic import type for vite
type ViteDevServer = Awaited<ReturnType<typeof import('vite')['createServer']>>

// Store vite server instance
let viteServer: ViteDevServer | null = null

// Default configuration values
const DEFAULTS = {
  port: clientConfig.vite.port,
  host: clientConfig.vite.host
}

/**
 * Setup Vite development server
 * This file is only imported in development mode
 */
export async function setupViteDev(context: PluginContext): Promise<void> {
  const vitePort = DEFAULTS.port || clientConfig.vite.port || 5173
  const viteHost = DEFAULTS.host || "localhost"

  // Import group logger utilities
  const { endGroup } = await import('@/core/utils/logger/group-logger')

  try {
    // Dynamic import of vite
    const { createServer } = await import('vite')

    // Start Vite dev server programmatically (silently)
    viteServer = await createServer({
      configFile: './vite.config.ts',
      server: {
        port: vitePort,
        host: viteHost,
        strictPort: true
      },
      logLevel: 'silent'
    })

    await viteServer.listen()

    context.logger.debug(`Vite server started on ${viteHost}:${vitePort} (internal proxy)`)
    context.logger.debug('Hot reload coordination active')

    // Store Vite config in context for later use
    ;(context as any).viteConfig = {
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
    }
  }
}
