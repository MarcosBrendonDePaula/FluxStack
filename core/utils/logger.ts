/**
 * FluxStack Logger
 * Environment-aware logging system
 */

import { getEnvironmentConfig } from "../config/env"

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

class Logger {
  private static instance: Logger | null = null
  private logLevel: LogLevel

  private constructor() {
    const envConfig = getEnvironmentConfig()
    this.logLevel = envConfig.LOG_LEVEL
  }

  static getInstance(): Logger {
    if (Logger.instance === null) {
      Logger.instance = new Logger()
    }
    return Logger.instance
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
    
    let formatted = `[${timestamp}] ${levelStr} ${message}`
    
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
export const logger = Logger.getInstance()

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
    logger.framework(message, meta)
}