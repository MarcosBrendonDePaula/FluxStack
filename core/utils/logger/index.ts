/**
 * FluxStack Logger
 * Enhanced logging system with multiple transports and formatters
 */

import { ConsoleTransport, FileTransport, JSONTransport } from './transports'
import { PrettyFormatter, JSONFormatter, SimpleFormatter } from './formatters'
import type { LogTransport, LogEntry, LogLevel } from './transports'
import type { LogFormatter } from './formatters'

export type { LogLevel, LogTransport, LogEntry } from './transports'
export type { LogFormatter } from './formatters'

export interface Logger {
  debug(message: string, meta?: any): void
  info(message: string, meta?: any): void
  warn(message: string, meta?: any): void
  error(message: string, meta?: any): void
  
  // Contextual logging
  child(context: any): Logger
  
  // Performance logging
  time(label: string): void
  timeEnd(label: string): void
  
  // Request logging
  request(method: string, path: string, status?: number, duration?: number): void
  
  // Transport management
  addTransport(transport: LogTransport): void
  removeTransport(name: string): void
  
  // Cleanup
  close(): Promise<void>
}

export interface LoggerConfig {
  level?: LogLevel
  transports?: LogTransport[]
  defaultMeta?: any
}

class FluxStackLogger implements Logger {
  private static instance: FluxStackLogger | null = null
  private logLevel: LogLevel
  private context: any = {}
  private timers: Map<string, number> = new Map()
  private transports: Map<string, LogTransport> = new Map()
  private defaultMeta: any = {}

  constructor(config?: LoggerConfig) {
    this.logLevel = config?.level || (process.env.LOG_LEVEL as LogLevel) || 'info'
    this.context = {}
    this.defaultMeta = config?.defaultMeta || {}
    
    // Setup default transports if none provided
    if (config?.transports) {
      config.transports.forEach(transport => {
        this.transports.set(transport.name, transport)
      })
    } else {
      this.setupDefaultTransports()
    }
  }

  static getInstance(config?: LoggerConfig): FluxStackLogger {
    if (FluxStackLogger.instance === null) {
      FluxStackLogger.instance = new FluxStackLogger(config)
    }
    return FluxStackLogger.instance
  }

  private setupDefaultTransports(): void {
    const isDevelopment = process.env.NODE_ENV !== 'production'
    
    if (isDevelopment) {
      // Development: Pretty console output
      this.transports.set('console', new ConsoleTransport({
        level: this.logLevel,
        colors: true,
        timestamp: true
      }))
    } else {
      // Production: JSON output for structured logging
      this.transports.set('json', new JSONTransport({
        level: this.logLevel,
        pretty: false
      }))
      
      // Also add file transport for production
      this.transports.set('file', new FileTransport({
        level: this.logLevel,
        filename: 'logs/fluxstack.log',
        maxSize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
        compress: true
      }))
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    }

    return levels[level] >= levels[this.logLevel]
  }

  private async writeToTransports(level: LogLevel, message: string, meta?: any): Promise<void> {
    if (!this.shouldLog(level)) return

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      meta: { ...this.defaultMeta, ...meta },
      context: Object.keys(this.context).length > 0 ? this.context : undefined
    }

    // Write to all transports
    const writePromises = Array.from(this.transports.values()).map(async transport => {
      try {
        await transport.write(entry)
      } catch (error) {
        // Fallback to console if transport fails
        console.error(`Transport ${transport.name} failed:`, error)
      }
    })

    await Promise.all(writePromises)
  }

  debug(message: string, meta?: any): void {
    this.writeToTransports('debug', message, meta).catch(err => {
      console.error('Logger error:', err)
    })
  }

  info(message: string, meta?: any): void {
    this.writeToTransports('info', message, meta).catch(err => {
      console.error('Logger error:', err)
    })
  }

  warn(message: string, meta?: any): void {
    this.writeToTransports('warn', message, meta).catch(err => {
      console.error('Logger error:', err)
    })
  }

  error(message: string, meta?: any): void {
    this.writeToTransports('error', message, meta).catch(err => {
      console.error('Logger error:', err)
    })
  }

  // Contextual logging
  child(context: any): FluxStackLogger {
    const childLogger = new FluxStackLogger({
      level: this.logLevel,
      transports: Array.from(this.transports.values()),
      defaultMeta: this.defaultMeta
    })
    childLogger.context = { ...this.context, ...context }
    return childLogger
  }

  // Performance logging
  time(label: string): void {
    this.timers.set(label, Date.now())
  }

  timeEnd(label: string): void {
    const startTime = this.timers.get(label)
    if (startTime) {
      const duration = Date.now() - startTime
      this.info(`Timer ${label}: ${duration}ms`)
      this.timers.delete(label)
    }
  }

  // HTTP request logging
  request(method: string, path: string, status?: number, duration?: number): void {
    const meta: any = { method, path }
    if (status) meta.status = status
    if (duration) meta.duration = duration
    
    const statusStr = status ? ` ${status}` : ''
    const durationStr = duration ? ` (${duration}ms)` : ''
    this.info(`${method} ${path}${statusStr}${durationStr}`, meta)
  }

  // Transport management
  addTransport(transport: LogTransport): void {
    this.transports.set(transport.name, transport)
  }

  removeTransport(name: string): void {
    const transport = this.transports.get(name)
    if (transport && transport.close) {
      const closeResult = transport.close()
      if (closeResult instanceof Promise) {
        closeResult.catch(console.error)
      }
    }
    this.transports.delete(name)
  }

  // Cleanup
  async close(): Promise<void> {
    const closePromises = Array.from(this.transports.values())
      .filter(transport => transport.close)
      .map(transport => transport.close!())
    
    await Promise.all(closePromises)
    this.transports.clear()
  }

  // Plugin logging
  plugin(pluginName: string, message: string, meta?: any): void {
    this.debug(`[${pluginName}] ${message}`, { plugin: pluginName, ...meta })
  }

  // Framework logging
  framework(message: string, meta?: any): void {
    this.info(`[FluxStack] ${message}`, { component: 'framework', ...meta })
  }
}

// Export transport and formatter classes
export { ConsoleTransport, FileTransport, JSONTransport } from './transports'
export { PrettyFormatter, JSONFormatter, SimpleFormatter } from './formatters'

// Export performance utilities
export { 
  RequestLogger, 
  PerformanceLogger, 
  createRequestLoggingMiddleware 
} from './performance'
export type { RequestContext, PerformanceTimer } from './performance'

// Export middleware utilities
export {
  createElysiaLoggerMiddleware,
  createDatabaseLoggerMiddleware,
  createPluginLoggerMiddleware,
  createBuildLoggerMiddleware
} from './middleware'

// Export singleton instance
export const logger = FluxStackLogger.getInstance()

// Export convenience functions
export const log = {
  debug: (message: string, meta?: any) => logger.debug(message, meta),
  info: (message: string, meta?: any) => logger.info(message, meta),
  warn: (message: string, meta?: any) => logger.warn(message, meta),
  error: (message: string, meta?: any) => logger.error(message, meta),
  request: (method: string, path: string, status?: number, duration?: number) => 
    logger.request(method, path, status, duration),
  plugin: (pluginName: string, message: string, meta?: any) => 
    logger.plugin(pluginName, message, meta),
  framework: (message: string, meta?: any) => 
    logger.framework(message, meta),
  child: (context: any) => logger.child(context),
  time: (label: string) => logger.time(label),
  timeEnd: (label: string) => logger.timeEnd(label),
  addTransport: (transport: LogTransport) => logger.addTransport(transport),
  removeTransport: (name: string) => logger.removeTransport(name),
  close: () => logger.close()
}

// Factory function for creating configured loggers
export function createLogger(config: LoggerConfig): Logger {
  return new FluxStackLogger(config)
}