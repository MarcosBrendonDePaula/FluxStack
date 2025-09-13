/**
 * FluxStack Logger
 * Environment-aware logging system
 */

// Environment info is handled via process.env directly

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

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
}

class FluxStackLogger implements Logger {
  private static instance: FluxStackLogger | null = null
  private logLevel: LogLevel
  private context: any = {}
  private timers: Map<string, number> = new Map()

  private constructor(context?: any) {
    // Default to 'info' level, can be overridden by config
    this.logLevel = (process.env.LOG_LEVEL as LogLevel) || 'info'
    this.context = context || {}
  }

  static getInstance(): FluxStackLogger {
    if (FluxStackLogger.instance === null) {
      FluxStackLogger.instance = new FluxStackLogger()
    }
    return FluxStackLogger.instance
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

  private formatMessage(level: LogLevel, message: string, meta?: any): string {
    const timestamp = new Date().toISOString()
    const levelStr = level.toUpperCase().padEnd(5)
    
    let formatted = `[${timestamp}] ${levelStr}`
    
    // Add context if available
    if (Object.keys(this.context).length > 0) {
      const contextStr = Object.entries(this.context)
        .map(([key, value]) => `${key}=${value}`)
        .join(' ')
      formatted += ` [${contextStr}]`
    }
    
    formatted += ` ${message}`
    
    if (meta && typeof meta === 'object') {
      formatted += ` ${JSON.stringify(meta)}`
    } else if (meta !== undefined) {
      formatted += ` ${meta}`
    }
    
    return formatted
  }

  debug(message: string, meta?: any): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, meta))
    }
  }

  info(message: string, meta?: any): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message, meta))
    }
  }

  warn(message: string, meta?: any): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, meta))
    }
  }

  error(message: string, meta?: any): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, meta))
    }
  }

  // Contextual logging
  child(context: any): FluxStackLogger {
    return new FluxStackLogger({ ...this.context, ...context })
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
    const statusStr = status ? ` ${status}` : ''
    const durationStr = duration ? ` (${duration}ms)` : ''
    this.info(`${method} ${path}${statusStr}${durationStr}`)
  }

  // Plugin logging
  plugin(pluginName: string, message: string, meta?: any): void {
    this.debug(`[${pluginName}] ${message}`, meta)
  }

  // Framework logging
  framework(message: string, meta?: any): void {
    this.info(`[FluxStack] ${message}`, meta)
  }
}

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
  timeEnd: (label: string) => logger.timeEnd(label)
}