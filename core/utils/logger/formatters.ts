/**
 * FluxStack Logger Formatters
 * Different formatting strategies for log output
 */

import type { LogEntry, LogLevel } from './transports'

export interface LogFormatter {
  format(entry: LogEntry): string
}

/**
 * Pretty formatter for development with colors and readable layout
 */
export class PrettyFormatter implements LogFormatter {
  private colors: boolean
  private timestamp: boolean

  private colorMap = {
    debug: '\x1b[36m', // cyan
    info: '\x1b[32m',  // green
    warn: '\x1b[33m',  // yellow
    error: '\x1b[31m', // red
    reset: '\x1b[0m',
    gray: '\x1b[90m'
  }

  constructor(options: { colors?: boolean; timestamp?: boolean } = {}) {
    this.colors = options.colors !== false
    this.timestamp = options.timestamp !== false
  }

  format(entry: LogEntry): string {
    const { timestamp, level, message, meta, context } = entry
    
    let formatted = ''
    
    // Add timestamp
    if (this.timestamp) {
      const color = this.colors ? this.colorMap.gray : ''
      const reset = this.colors ? this.colorMap.reset : ''
      formatted += `${color}[${timestamp}]${reset} `
    }
    
    // Add level with color and icon
    const levelColor = this.colors ? this.colorMap[level] : ''
    const reset = this.colors ? this.colorMap.reset : ''
    const levelIcon = this.getLevelIcon(level)
    const levelStr = level.toUpperCase().padEnd(5)
    formatted += `${levelColor}${levelIcon} ${levelStr}${reset} `
    
    // Add context if available
    if (context && Object.keys(context).length > 0) {
      const contextStr = Object.entries(context)
        .map(([key, value]) => `${key}=${value}`)
        .join(' ')
      const contextColor = this.colors ? this.colorMap.gray : ''
      formatted += `${contextColor}[${contextStr}]${reset} `
    }
    
    // Add message
    formatted += message
    
    // Add meta if available
    if (meta && typeof meta === 'object') {
      const metaColor = this.colors ? this.colorMap.gray : ''
      const metaStr = this.formatMeta(meta)
      formatted += ` ${metaColor}${metaStr}${reset}`
    } else if (meta !== undefined) {
      formatted += ` ${meta}`
    }
    
    return formatted
  }

  private getLevelIcon(level: LogLevel): string {
    switch (level) {
      case 'debug': return '🔍'
      case 'info': return 'ℹ️ '
      case 'warn': return '⚠️ '
      case 'error': return '❌'
      default: return '  '
    }
  }

  private formatMeta(meta: any): string {
    if (typeof meta === 'object' && meta !== null) {
      // Pretty print objects with indentation
      return JSON.stringify(meta, null, 2)
        .split('\n')
        .map((line, index) => index === 0 ? line : `    ${line}`)
        .join('\n')
    }
    return String(meta)
  }
}

/**
 * JSON formatter for production with structured output
 */
export class JSONFormatter implements LogFormatter {
  private pretty: boolean

  constructor(options: { pretty?: boolean } = {}) {
    this.pretty = options.pretty || false
  }

  format(entry: LogEntry): string {
    const jsonEntry = {
      '@timestamp': entry.timestamp,
      level: entry.level,
      message: entry.message,
      ...(entry.context && { context: entry.context }),
      ...(entry.meta && { meta: entry.meta })
    }
    
    return this.pretty 
      ? JSON.stringify(jsonEntry, null, 2)
      : JSON.stringify(jsonEntry)
  }
}

/**
 * Simple formatter for basic text output
 */
export class SimpleFormatter implements LogFormatter {
  private timestamp: boolean

  constructor(options: { timestamp?: boolean } = {}) {
    this.timestamp = options.timestamp !== false
  }

  format(entry: LogEntry): string {
    const { timestamp, level, message, meta, context } = entry
    
    let formatted = ''
    
    // Add timestamp
    if (this.timestamp) {
      formatted += `[${timestamp}] `
    }
    
    // Add level
    formatted += `${level.toUpperCase().padEnd(5)} `
    
    // Add context if available
    if (context && Object.keys(context).length > 0) {
      const contextStr = Object.entries(context)
        .map(([key, value]) => `${key}=${value}`)
        .join(' ')
      formatted += `[${contextStr}] `
    }
    
    // Add message
    formatted += message
    
    // Add meta if available
    if (meta && typeof meta === 'object') {
      formatted += ` ${JSON.stringify(meta)}`
    } else if (meta !== undefined) {
      formatted += ` ${meta}`
    }
    
    return formatted
  }
}

/**
 * Syslog formatter for system logging
 */
export class SyslogFormatter implements LogFormatter {
  private facility: number
  private hostname: string

  constructor(options: { facility?: number; hostname?: string } = {}) {
    this.facility = options.facility || 16 // local0
    this.hostname = options.hostname || require('os').hostname()
  }

  format(entry: LogEntry): string {
    const { timestamp, level, message, meta, context } = entry
    
    // Calculate priority (facility * 8 + severity)
    const severity = this.getLevelSeverity(level)
    const priority = this.facility * 8 + severity
    
    // Format timestamp in RFC3339
    const syslogTime = new Date(timestamp).toISOString()
    
    // Build syslog message
    let syslogMessage = `<${priority}>${syslogTime} ${this.hostname} fluxstack: `
    
    // Add context if available
    if (context && Object.keys(context).length > 0) {
      const contextStr = Object.entries(context)
        .map(([key, value]) => `${key}=${value}`)
        .join(' ')
      syslogMessage += `[${contextStr}] `
    }
    
    syslogMessage += message
    
    // Add meta if available
    if (meta && typeof meta === 'object') {
      syslogMessage += ` ${JSON.stringify(meta)}`
    } else if (meta !== undefined) {
      syslogMessage += ` ${meta}`
    }
    
    return syslogMessage
  }

  private getLevelSeverity(level: LogLevel): number {
    switch (level) {
      case 'debug': return 7 // debug
      case 'info': return 6  // info
      case 'warn': return 4  // warning
      case 'error': return 3 // error
      default: return 6
    }
  }
}