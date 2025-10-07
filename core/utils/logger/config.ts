/**
 * FluxStack Logger Configuration
 * Centralized configuration for the logging system
 */

export interface LoggerConfig {
  level: 'debug' | 'info' | 'warn' | 'error'
  dateFormat: string
  logToFile: boolean
  maxSize: string
  maxFiles: string
  objectDepth: number
  enableColors: boolean
  enableStackTrace: boolean
}

/**
 * Get logger configuration from environment variables
 */
export function getLoggerConfig(): LoggerConfig {
  return {
    level: (process.env.LOG_LEVEL as LoggerConfig['level']) || 'info',
    dateFormat: process.env.LOG_DATE_FORMAT || 'YYYY-MM-DD HH:mm:ss',
    logToFile: process.env.LOG_TO_FILE === 'true',
    maxSize: process.env.LOG_MAX_SIZE || '20m',
    maxFiles: process.env.LOG_MAX_FILES || '14d',
    objectDepth: parseInt(process.env.LOG_OBJECT_DEPTH || '4'),
    enableColors: process.env.LOG_COLORS !== 'false',
    enableStackTrace: process.env.LOG_STACK_TRACE !== 'false'
  }
}

export const LOGGER_CONFIG = getLoggerConfig()
