/**
 * Service Container
 * Manages service instances and dependency injection
 */

import type { FluxStackConfig } from '../../../core/config'
import type { Logger } from '../../../core/utils/logger/index'
import { BaseService, type ServiceContext, type ServiceContainer as IServiceContainer } from './BaseService'

export type ServiceConstructor<T extends BaseService = BaseService> = new (context: ServiceContext) => T

export interface ServiceDefinition {
  name: string
  constructor: ServiceConstructor
  dependencies?: string[]
  singleton?: boolean
}

export class ServiceContainer implements IServiceContainer {
  private services: Map<string, BaseService> = new Map()
  private definitions: Map<string, ServiceDefinition> = new Map()
  private instances: Map<string, BaseService> = new Map()
  private initializing: Set<string> = new Set()
  private initialized: Set<string> = new Set()

  constructor(
    private config: FluxStackConfig,
    private logger: Logger
  ) {}

  /**
   * Register a service definition
   */
  register<T extends BaseService>(definition: ServiceDefinition): void {
    this.definitions.set(definition.name, definition)
    this.logger.debug(`Registered service: ${definition.name}`)
  }

  /**
   * Register multiple services
   */
  registerMany(definitions: ServiceDefinition[]): void {
    definitions.forEach(def => this.register(def))
  }

  /**
   * Get a service instance
   */
  get<T extends BaseService>(name: string): T {
    // Return existing instance if available
    if (this.instances.has(name)) {
      return this.instances.get(name) as T
    }

    // Get service definition
    const definition = this.definitions.get(name)
    if (!definition) {
      throw new Error(`Service '${name}' not registered`)
    }

    // Check for circular dependencies
    if (this.initializing.has(name)) {
      throw new Error(`Circular dependency detected for service '${name}'`)
    }

    // Create and initialize service
    this.initializing.add(name)
    
    try {
      // Resolve dependencies first
      const dependencies = this.resolveDependencies(definition.dependencies || [])
      
      // Create service context
      const context: ServiceContext = {
        config: this.config,
        logger: this.logger,
        services: dependencies
      }

      // Create service instance
      const service = new definition.constructor(context)
      
      // Store instance if singleton (default behavior)
      if (definition.singleton !== false) {
        this.instances.set(name, service)
      }

      this.initializing.delete(name)
      return service as T
    } catch (error) {
      this.initializing.delete(name)
      throw error
    }
  }

  /**
   * Initialize all registered services
   */
  async initializeAll(): Promise<void> {
    const serviceNames = Array.from(this.definitions.keys())
    
    this.logger.info(`Initializing ${serviceNames.length} services...`)
    
    // Resolve initialization order based on dependencies
    const initOrder = this.resolveInitializationOrder()
    
    for (const serviceName of initOrder) {
      if (!this.initialized.has(serviceName)) {
        await this.initializeService(serviceName)
      }
    }
    
    this.logger.info('All services initialized successfully')
  }

  /**
   * Initialize a specific service
   */
  async initializeService(name: string): Promise<void> {
    if (this.initialized.has(name)) {
      return
    }

    const service = this.get(name)
    
    try {
      await service.initialize()
      this.initialized.add(name)
      this.logger.debug(`Service '${name}' initialized`)
    } catch (error) {
      this.logger.error(`Failed to initialize service '${name}'`, { error })
      throw error
    }
  }

  /**
   * Cleanup all services
   */
  async cleanup(): Promise<void> {
    this.logger.info('Cleaning up services...')
    
    // Cleanup in reverse order
    const services = Array.from(this.instances.values()).reverse()
    
    for (const service of services) {
      try {
        await service.cleanup()
      } catch (error) {
        this.logger.error('Service cleanup error', { error })
      }
    }
    
    this.instances.clear()
    this.initialized.clear()
    
    this.logger.info('Services cleanup completed')
  }

  /**
   * Check if a service is registered
   */
  has(name: string): boolean {
    return this.definitions.has(name)
  }

  /**
   * Get all registered service names
   */
  getServiceNames(): string[] {
    return Array.from(this.definitions.keys())
  }

  /**
   * Resolve dependencies for a service
   */
  private resolveDependencies(dependencies: string[]): IServiceContainer {
    const resolved: IServiceContainer = {}
    
    for (const dep of dependencies) {
      resolved[dep] = this.get(dep)
    }
    
    return resolved
  }

  /**
   * Resolve initialization order based on dependencies
   */
  private resolveInitializationOrder(): string[] {
    const visited = new Set<string>()
    const visiting = new Set<string>()
    const order: string[] = []

    const visit = (serviceName: string) => {
      if (visited.has(serviceName)) {
        return
      }

      if (visiting.has(serviceName)) {
        throw new Error(`Circular dependency detected: ${serviceName}`)
      }

      visiting.add(serviceName)

      const definition = this.definitions.get(serviceName)
      if (definition && definition.dependencies) {
        for (const dep of definition.dependencies) {
          visit(dep)
        }
      }

      visiting.delete(serviceName)
      visited.add(serviceName)
      order.push(serviceName)
    }

    for (const serviceName of this.definitions.keys()) {
      visit(serviceName)
    }

    return order
  }

  // Implement IServiceContainer interface
  [key: string]: any
}