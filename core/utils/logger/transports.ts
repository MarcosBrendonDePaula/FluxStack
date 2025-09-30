/**
 * FluxStack Logger Transports
 * Multiple transport implementations for different logging needs
 */

import { writeFile, mkdir, stat, readdir, unlink } from 'fs/promises'
import { join, dirname } from 'path'
import { createGzip } from 'zlib'
import { pipeline } from 'stream/promises'
import { createReadStream, createWriteStream } from 'fs'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  meta?: any
  context?: any
}

export interface LogTransport {
  name: string
  level: LogLevel
  write(entry: LogEntry): Promise<void> | void
  close?(): Promise<void> | void
}

export interface ConsoleTransportConfig {
  level?: LogLevel
  colors?: boolean
  timestamp?: boolean
}

export interface FileTransportConfig {
  level?: LogLevel
  filename: string
  maxSize?: number // in bytes
  maxFiles?: number
  compress?: boolean
}

export interface JSONTransportConfig {
  level?: LogLevel
  filename?: string
  pretty?: boolean
}

/**
 * Console Transport with colored output for development
 */
export class ConsoleTransport implements LogTransport {
  name = 'console'
  level: LogLevel
  private colors: boolean
  private timestamp: boolean

  private colorMap = {
    debug: '\x1b[36m', // cyan
    info: '\x1b[32m',  // green
    warn: '\x1b[33m',  // yellow
    error: '\x1b[31m', // red
    reset: '\x1b[0m'
  }

  constructor(config: ConsoleTransportConfig = {}) {
    this.level = config.level || 'info'
    this.colors = config.colors !== false
    this.timestamp = config.timestamp !== false
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    }
    return levels[level] >= levels[this.level]
  }

  private formatMessage(entry: LogEntry): string {
    const { timestamp, level, message, meta, context } = entry
    
    let formatted = ''
    
    // Add timestamp
    if (this.timestamp) {
      const color = this.colors ? '\x1b[90m' : '' // gray
      const reset = this.colors ? this.colorMap.reset : ''
      formatted += `${color}[${timestamp}]${reset} `
    }
    
    // Add level with color
    const levelColor = this.colors ? this.colorMap[level] : ''
    const reset = this.colors ? this.colorMap.reset : ''
    const levelStr = level.toUpperCase().padEnd(5)
    formatted += `${levelColor}${levelStr}${reset} `
    
    // Add context if available
    if (context && Object.keys(context).length > 0) {
      const contextStr = Object.entries(context)
        .map(([key, value]) => `${key}=${value}`)
        .join(' ')
      const contextColor = this.colors ? '\x1b[90m' : '' // gray
      formatted += `${contextColor}[${contextStr}]${reset} `
    }
    
    // Add message
    formatted += message
    
    // Add meta if available
    if (meta && typeof meta === 'object') {
      const metaColor = this.colors ? '\x1b[90m' : '' // gray
      formatted += ` ${metaColor}${JSON.stringify(meta)}${reset}`
    } else if (meta !== undefined) {
      formatted += ` ${meta}`
    }
    
    return formatted
  }

  write(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) return
    
    const formatted = this.formatMessage(entry)
    
    // Use appropriate console method
    switch (entry.level) {
      case 'debug':
        console.debug(formatted)
        break
      case 'info':
        console.info(formatted)
        break
      case 'warn':
        console.warn(formatted)
        break
      case 'error':
        console.error(formatted)
        break
    }
  }
}

/**
 * File Transport with rotation and compression
 */
export class FileTransport implements LogTransport {
  name = 'file'
  level: LogLevel
  private filename: string
  private maxSize: number
  private maxFiles: number
  private compress: boolean
  private currentSize = 0

  constructor(config: FileTransportConfig) {
    this.level = config.level || 'info'
    this.filename = config.filename
    this.maxSize = config.maxSize || 10 * 1024 * 1024 // 10MB default
    this.maxFiles = config.maxFiles || 5
    this.compress = config.compress !== false
    
    this.ensureDirectory()
    this.getCurrentSize()
  }

  private async ensureDirectory(): Promise<void> {
    const dir = dirname(this.filename)
    try {
      await mkdir(dir, { recursive: true })
    } catch (error) {
      // Directory might already exist
    }
  }

  private async getCurrentSize(): Promise<void> {
    try {
      const stats = await stat(this.filename)
      this.currentSize = stats.size
    } catch (error) {
      this.currentSize = 0
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    }
    return levels[level] >= levels[this.level]
  }

  private formatMessage(entry: LogEntry): string {
    const { timestamp, level, message, meta, context } = entry
    
    let formatted = `[${timestamp}] ${level.toUpperCase().padEnd(5)}`
    
    // Add context if available
    if (context && Object.keys(context).length > 0) {
      const contextStr = Object.entries(context)
        .map(([key, value]) => `${key}=${value}`)
        .join(' ')
      formatted += ` [${contextStr}]`
    }
    
    formatted += ` ${message}`
    
    // Add meta if available
    if (meta && typeof meta === 'object') {
      formatted += ` ${JSON.stringify(meta)}`
    } else if (meta !== undefined) {
      formatted += ` ${meta}`
    }
    
    return formatted + '\n'
  }

  private async rotateFile(): Promise<void> {
    // Rotate existing files
    for (let i = this.maxFiles - 1; i >= 1; i--) {
      const oldFile = `${this.filename}.${i}`
      const newFile = `${this.filename}.${i + 1}`
      
      try {
        await stat(oldFile)
        if (i === this.maxFiles - 1) {
          // Delete the oldest file
          await unlink(oldFile)
        } else {
          // Rename to next number
          const { rename } = await import('fs/promises')
          await rename(oldFile, newFile)
        }
      } catch (error) {
        // File doesn't exist, continue
      }
    }
    
    // Move current file to .1
    try {
      await stat(this.filename)
      const rotatedFile = `${this.filename}.1`
      
      if (this.compress) {
        // Compress the rotated file
        await this.compressFile(this.filename, `${rotatedFile}.gz`)
        await unlink(this.filename)
      } else {
        const { rename } = await import('fs/promises')
        await rename(this.filename, rotatedFile)
      }
    } catch (error) {
      // File doesn't exist, continue
    }
    
    this.currentSize = 0
  }

  private async compressFile(source: string, destination: string): Promise<void> {
    const gzip = createGzip()
    const sourceStream = createReadStream(source)
    const destStream = createWriteStream(destination)
    
    await pipeline(sourceStream, gzip, destStream)
  }

  async write(entry: LogEntry): Promise<void> {
    if (!this.shouldLog(entry.level)) return
    
    const formatted = this.formatMessage(entry)
    const messageSize = Buffer.byteLength(formatted, 'utf8')
    
    // Check if rotation is needed
    if (this.currentSize + messageSize > this.maxSize) {
      await this.rotateFile()
    }
    
    // Write to file
    await writeFile(this.filename, formatted, { flag: 'a' })
    this.currentSize += messageSize
  }

  async close(): Promise<void> {
    // Nothing to close for file transport
  }
}

/**
 * JSON Transport for structured production logging
 */
export class JSONTransport implements LogTransport {
  name = 'json'
  level: LogLevel
  private filename?: string
  private pretty: boolean

  constructor(config: JSONTransportConfig = {}) {
    this.level = config.level || 'info'
    this.filename = config.filename
    this.pretty = config.pretty || false
    
    if (this.filename) {
      this.ensureDirectory()
    }
  }

  private async ensureDirectory(): Promise<void> {
    if (!this.filename) return
    
    const dir = dirname(this.filename)
    try {
      await mkdir(dir, { recursive: true })
    } catch (error) {
      // Directory might already exist
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    }
    return levels[level] >= levels[this.level]
  }

  private formatEntry(entry: LogEntry): string {
    const jsonEntry = {
      timestamp: entry.timestamp,
      level: entry.level,
      message: entry.message,
      ...(entry.context && { context: entry.context }),
      ...(entry.meta && { meta: entry.meta })
    }
    
    const json = this.pretty 
      ? JSON.stringify(jsonEntry, null, 2)
      : JSON.stringify(jsonEntry)
    
    return json + '\n'
  }

  async write(entry: LogEntry): Promise<void> {
    if (!this.shouldLog(entry.level)) return
    
    const formatted = this.formatEntry(entry)
    
    if (this.filename) {
      // Write to file
      await writeFile(this.filename, formatted, { flag: 'a' })
    } else {
      // Write to console as JSON
      process.stdout.write(formatted)
    }
  }

  async close(): Promise<void> {
    // Nothing to close for JSON transport
  }
}