/**
 * Base Service Class
 * Provides common functionality for all services
 */

import type { FluxStackConfig } from '../../../core/config'
import type { Logger } from '../../../core/utils/logger/index'

export interface ServiceContext {
  config: FluxStackConfig
  logger: Logger
  services?: ServiceContainer
}

export interface ServiceContainer {
  [key: string]: BaseService
}

export abstract class BaseService {
  protected config: FluxStackConfig
  protected logger: Logger
  protected services?: ServiceContainer

  constructor(context: ServiceContext) {
    this.config = context.config
    this.logger = context.logger.child({ service: this.constructor.name })
    this.services = context.services
  }

  /**
   * Initialize the service
   * Override this method to perform service-specific initialization
   */
  async initialize(): Promise<void> {
    this.logger.debug('Service initialized')
  }

  /**
   * Cleanup the service
   * Override this method to perform service-specific cleanup
   */
  async cleanup(): Promise<void> {
    this.logger.debug('Service cleaned up')
  }

  /**
   * Get another service from the container
   */
  protected getService<T extends BaseService>(serviceName: string): T {
    if (!this.services || !this.services[serviceName]) {
      throw new Error(`Service '${serviceName}' not found`)
    }
    return this.services[serviceName] as T
  }

  /**
   * Validate required parameters
   */
  protected validateRequired(params: Record<string, any>, required: string[]): void {
    const missing = required.filter(key => 
      params[key] === undefined || params[key] === null || params[key] === ''
    )
    
    if (missing.length > 0) {
      throw new Error(`Missing required parameters: ${missing.join(', ')}`)
    }
  }

  /**
   * Handle service errors with consistent logging
   */
  protected handleError(error: Error, context?: Record<string, any>): never {
    this.logger.error('Service error', {
      error: error.message,
      stack: error.stack,
      context
    })
    throw error
  }

  /**
   * Execute with error handling and logging
   */
  protected async executeWithLogging<T>(
    operation: string,
    fn: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T> {
    const startTime = Date.now()
    
    try {
      this.logger.debug(`Starting ${operation}`, context)
      const result = await fn()
      const duration = Date.now() - startTime
      
      this.logger.debug(`Completed ${operation}`, { 
        duration: `${duration}ms`,
        ...context 
      })
      
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      
      this.logger.error(`Failed ${operation}`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: `${duration}ms`,
        ...context
      })
      
      throw error
    }
  }
}