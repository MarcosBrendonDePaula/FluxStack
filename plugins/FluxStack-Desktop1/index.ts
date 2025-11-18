import type { ErrorContext, FluxStack, PluginContext, RequestContext, ResponseContext } from "@/core/plugins/types"
// ✅ Plugin imports its own configuration
import { FluxStackDesktop1Config } from './config'

/**
 * FluxStackDesktop1 Plugin
 * A FluxStack plugin
 */
export class FluxStackDesktop1Plugin implements FluxStack.Plugin {
  name = 'FluxStack-Desktop1'
  version = '1.0.0'

  /**
   * Setup hook - called when plugin is loaded
   */
  async setup(context: PluginContext): Promise<void> {
    // Check if plugin is enabled
    if (!FluxStackDesktop1Config.enabled) {
      context.logger.info(`[FluxStack-Desktop1] Plugin disabled by configuration`)
      return
    }

    console.log(`[FluxStack-Desktop1] Plugin initialized`)

    // Add your initialization logic here
    // Example: Register middleware, setup database connections, etc.
  }

  /**
   * Server start hook - called when server starts
   */
  async onServerStart?(context: PluginContext): Promise<void> {
    if (!FluxStackDesktop1Config.enabled) return

    console.log(`[FluxStack-Desktop1] Server started`)

    // Add logic to run when server starts
  }

  /**
   * Request hook - called on each request
   */
  async onRequest?(context: RequestContext): Promise<void> {
    if (!FluxStackDesktop1Config.enabled) return

    // Add request processing logic
  }

  /**
   * Response hook - called on each response
   */
  async onResponse?(context: ResponseContext): Promise<void> {
    if (!FluxStackDesktop1Config.enabled) return

    // Add response processing logic
  }

  /**
   * Error hook - called when errors occur
   */
  async onError?(context: ErrorContext): Promise<void> {
    console.error(`[FluxStack-Desktop1] Error:`, context.error)

    // Add error handling logic
  }
}

// Export plugin instance
export default new FluxStackDesktop1Plugin()
