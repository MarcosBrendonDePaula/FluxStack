import type { Plugin, PluginContext, RequestContext, ResponseContext, ErrorContext } from "../../types"

export const loggerPlugin: Plugin = {
  name: "logger",
  version: "1.0.0",
  description: "Enhanced logging plugin for FluxStack with request/response logging",
  author: "FluxStack Team",
  priority: "highest", // Logger should run first
  category: "core",
  tags: ["logging", "monitoring"],
  
  configSchema: {
    type: "object",
    properties: {
      logRequests: {
        type: "boolean",
        description: "Enable request logging"
      },
      logResponses: {
        type: "boolean", 
        description: "Enable response logging"
      },
      logErrors: {
        type: "boolean",
        description: "Enable error logging"
      },
      includeHeaders: {
        type: "boolean",
        description: "Include headers in request/response logs"
      },
      includeBody: {
        type: "boolean",
        description: "Include body in request/response logs"
      },
      slowRequestThreshold: {
        type: "number",
        minimum: 0,
        description: "Threshold in ms to log slow requests"
      }
    },
    additionalProperties: false
  },
  
  defaultConfig: {
    logRequests: process.env.ENABLE_REQUEST_LOGS === 'true',
    logResponses: process.env.ENABLE_REQUEST_LOGS === 'true',
    logErrors: true,
    includeHeaders: false,
    includeBody: false,
    slowRequestThreshold: 1000
  },

  setup: async (context: PluginContext) => {
    context.logger.info("Enhanced logger plugin initialized", {
      environment: context.config.app?.name || 'fluxstack',
      logLevel: context.config.logging.level,
      format: context.config.logging.format
    })
  },

  onServerStart: async (context: PluginContext) => {
    context.logger.info("Logger plugin: Server started", {
      port: context.config.server.port,
      host: context.config.server.host,
      apiPrefix: context.config.server.apiPrefix
    })
  },

  onServerStop: async (context: PluginContext) => {
    context.logger.info("Logger plugin: Server stopped")
  },

  onRequest: async (context: RequestContext) => {
    const config = getPluginConfig(context)
    
    if (!config.logRequests) return

    const logData: any = {
      method: context.method,
      path: context.path,
      userAgent: context.headers['user-agent'],
      ip: context.headers['x-forwarded-for'] || context.headers['x-real-ip'] || 'unknown'
    }

    if (config.includeHeaders) {
      logData.headers = context.headers
    }

    if (config.includeBody && context.body) {
      logData.body = context.body
    }

    // Use a logger from context if available, otherwise create one
    const logger = (context as any).logger || console
    if (typeof logger.info === 'function') {
      logger.info(`→ ${context.method} ${context.path}`, logData)
    }
  },

  onResponse: async (context: ResponseContext) => {
    const config = getPluginConfig(context)
    
    if (!config.logResponses) return

    const logData: any = {
      method: context.method,
      path: context.path,
      statusCode: context.statusCode,
      duration: context.duration,
      size: context.size
    }

    if (config.includeHeaders) {
      const headers: Record<string, string> = {}
      context.response.headers.forEach((value, key) => {
        headers[key] = value
      })
      logData.responseHeaders = headers
    }

    // Determine log level based on status code and duration
    let logLevel = 'info'
    if (context.statusCode >= 400) {
      logLevel = 'warn'
    }
    if (context.statusCode >= 500) {
      logLevel = 'error'
    }
    if (context.duration > config.slowRequestThreshold) {
      logLevel = 'warn'
    }

    const logger = (context as any).logger || console
    const logMessage = `← ${context.method} ${context.path} ${context.statusCode} ${context.duration}ms`
    
    if (typeof logger[logLevel] === 'function') {
      logger[logLevel](logMessage, logData)
    }
  },

  onError: async (context: ErrorContext) => {
    const config = getPluginConfig(context)
    
    if (!config.logErrors) return

    // Skip logging for NOT_FOUND errors unless explicitly enabled
    if (context.error.message === 'NOT_FOUND' && !process.env.ENABLE_NOT_FOUND_LOGS) {
      return
    }

    const logData: any = {
      method: context.method,
      path: context.path,
      duration: context.duration,
      error: {
        name: context.error.name,
        message: context.error.message,
        stack: context.error.stack
      }
    }

    if (config.includeHeaders) {
      logData.headers = context.headers
    }

    const logger = (context as any).logger || console
    if (typeof logger.error === 'function') {
      logger.error(`✗ ${context.method} ${context.path} - ${context.error.message}`, logData)
    }
  }
}

// Helper function to get plugin config from context
function getPluginConfig(_context: any) {
  // In a real implementation, this would get the config from the plugin context
  // For now, return default config
  return loggerPlugin.defaultConfig || {}
}

export default loggerPlugin