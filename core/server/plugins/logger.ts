import type { Plugin } from "../../types"
import { log } from "../../utils/logger"

export const loggerPlugin: Plugin = {
  name: "logger",
  setup: (context, app) => {
    log.plugin("logger", "Logger plugin initialized", {
      logLevel: process.env.LOG_LEVEL || context.config.logging?.level || 'info',
      environment: process.env.NODE_ENV || 'development'
    })
    
    // Plugin será aplicado ao Elysia pelo framework
    return {
      onRequest: ({ request, path }) => {
        const startTime = Date.now()
        
        // Store start time for duration calculation
        ;(request as any).__startTime = startTime
        
        log.request(request.method, path)
      },
      onResponse: ({ request, set }) => {
        const duration = Date.now() - ((request as any).__startTime || Date.now())
        const path = new URL(request.url).pathname
        
        log.request(request.method, path, set.status || 200, duration)
      },
      onError: ({ error, request, path }) => {
        const duration = Date.now() - ((request as any).__startTime || Date.now())
        
        log.error(`${request.method} ${path} - ${error.message}`, {
          duration,
          stack: error.stack
        })
      }
    }
  }
}