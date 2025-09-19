import type { Plugin, PluginContext } from "../../types"
import { log } from "../../utils/logger"

export const loggerPlugin: Plugin = {
  name: "logger",
  setup: (context: PluginContext) => {
    log.plugin("logger", "Logger plugin initialized", {
      logLevel: process.env.LOG_LEVEL || context.config.logging?.level || 'info',
      environment: process.env.NODE_ENV || 'development'
    })
    
    // Setup logging hooks on the Elysia app
    context.app.onRequest(({ request }: { request: Request }) => {
      const startTime = Date.now()
      const path = new URL(request.url).pathname
      
      // Store start time for duration calculation
      ;(request as any).__startTime = startTime
      
      log.request(request.method, path)
    })
    
    context.app.onResponse(({ request, set }: { request: Request, set: any }) => {
      const duration = Date.now() - ((request as any).__startTime || Date.now())
      const path = new URL(request.url).pathname
      
      log.request(request.method, path, set.status || 200, duration)
    })
    
    context.app.onError(({ error, request }: { error: Error, request: Request }) => {
      const duration = Date.now() - ((request as any).__startTime || Date.now())
      const path = new URL(request.url).pathname
      
      log.error(`${request.method} ${path} - ${error.message}`, {
        duration,
        stack: error.stack
      })
    })
  }
}