/**
 * FluxStack Logger - Main Entry Point
 * Unified logging system based on Winston with automatic module detection
 */

import chalk from 'chalk'
import { getCallerInfo, formatCallerInfo } from './stack-trace'
import { getColorForModule } from './colors'
import { getLoggerForModule } from './winston-logger'
import {
  formatMessage,
  formatSection,
  formatImportant,
  formatOperationStart,
  formatOperationSuccess
} from './formatter'

// Re-export types and utilities
export { LOGGER_CONFIG } from './config'
export type { LoggerConfig } from './config'
export type { CallerInfo } from './stack-trace'
export { clearColorCache } from './colors'
export { clearCallerCache } from './stack-trace'
export { clearLoggerCache } from './winston-logger'

// Export Logger type from winston
import type winston from 'winston'
export type Logger = winston.Logger

// Re-export banner utilities for custom banners
export { displayStartupBanner, type StartupInfo } from './startup-banner'

/**
 * Core log function that handles all log levels
 */
function logMessage(level: 'debug' | 'info' | 'warn' | 'error', message: unknown, ...args: unknown[]): void {
  const { file: callerFile, line: callerLine, function: callerFunction } = getCallerInfo()
  const logger = getLoggerForModule(callerFile)
  const moduleColor = getColorForModule(callerFile)

  // Format caller context
  const context = formatCallerInfo(
    { file: callerFile, line: callerLine, function: callerFunction },
    (str) => moduleColor(str)
  )

  // Format the message
  const finalMessage = formatMessage(message, args)

  // Log with appropriate level
  logger.log({
    level,
    message: `${context} ${finalMessage}`
  })
}

/**
 * Log info message
 */
export function LOG(message: unknown, ...args: unknown[]): void {
  logMessage('info', message, ...args)
}

/**
 * Log warning message
 */
export function WARN(message: unknown, ...args: unknown[]): void {
  logMessage('warn', message, ...args)
}

/**
 * Log error message
 */
export function ERROR(message: unknown, ...args: unknown[]): void {
  logMessage('error', message, ...args)
}

/**
 * Log debug message
 */
export function DEBUG(message: unknown, ...args: unknown[]): void {
  logMessage('debug', message, ...args)
}

/**
 * Log operation start
 */
export function START(operation: string, details?: unknown): void {
  const message = formatOperationStart(operation)
  if (details) {
    logMessage('info', message, details)
  } else {
    logMessage('info', message)
  }
}

/**
 * Log operation success
 */
export function SUCCESS(operation: string, details?: unknown): void {
  const message = formatOperationSuccess(operation)
  if (details) {
    logMessage('info', message, details)
  } else {
    logMessage('info', message)
  }
}

/**
 * Log important information
 */
export function IMPORTANT(title: string, message: unknown): void {
  const formattedTitle = chalk.bold.cyan(formatImportant(title))
  logMessage('info', `${formattedTitle}\n${formatMessage(message)}`)
}

/**
 * Log a section (group of related logs)
 */
export function SECTION(sectionName: string, callback: () => void): void {
  const sectionTitle = chalk.bold.cyan(formatSection(sectionName))
  logMessage('info', sectionTitle)
  callback()
  logMessage('info', chalk.bold.cyan(formatSection(`FIM: ${sectionName}`)))
}

/**
 * HTTP request logging (compatibility with Elysia)
 */
export function request(method: string, path: string, status?: number, duration?: number): void {
  const statusStr = status ? ` ${status}` : ''
  const durationStr = duration ? ` (${duration}ms)` : ''
  LOG(`${method} ${path}${statusStr}${durationStr}`)
}

/**
 * Plugin logging (compatibility with plugin system)
 */
export function plugin(pluginName: string, message: string, meta?: unknown): void {
  DEBUG(`[${pluginName}] ${message}`, meta)
}

/**
 * Framework logging (compatibility with framework)
 */
export function framework(message: string, meta?: unknown): void {
  LOG(`[FluxStack] ${message}`, meta)
}

/**
 * Performance timing
 */
const timers = new Map<string, number>()

export function time(label: string): void {
  timers.set(label, Date.now())
}

export function timeEnd(label: string): void {
  const startTime = timers.get(label)
  if (startTime) {
    const duration = Date.now() - startTime
    LOG(`Timer ${label}: ${duration}ms`)
    timers.delete(label)
  } else {
    WARN(`Timer not found: ${label}`)
  }
}

/**
 * Clear all caches (useful for testing)
 */
export function clearCache(): void {
  const { clearColorCache } = require('./colors')
  const { clearCallerCache } = require('./stack-trace')
  const { clearLoggerCache } = require('./winston-logger')

  clearColorCache()
  clearCallerCache()
  clearLoggerCache()
}

/**
 * Legacy compatibility - logger object with methods
 */
export const logger = {
  debug: DEBUG,
  info: LOG,
  warn: WARN,
  error: ERROR,
  request,
  plugin,
  framework,
  time,
  timeEnd
}

/**
 * Convenience log object (similar to old implementation)
 */
export const log = {
  debug: DEBUG,
  info: LOG,
  warn: WARN,
  error: ERROR,
  request,
  plugin,
  framework,
  time,
  timeEnd
}

/**
 * Default export for easy importing
 */
export default {
  LOG,
  WARN,
  ERROR,
  DEBUG,
  START,
  SUCCESS,
  IMPORTANT,
  SECTION,
  request,
  plugin,
  framework,
  time,
  timeEnd,
  logger,
  log,
  clearCache
}
