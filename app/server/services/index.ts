/**
 * Service Registry
 * Configures and exports all application services
 */

import type { FluxStackConfig } from '../../../core/config'
import type { Logger } from '../../../core/utils/logger/index'
import { ServiceContainer } from './ServiceContainer'
import { UserService } from './UserService'
import { NotificationService } from './NotificationService'

/**
 * Create and configure the service container
 */
export function createServiceContainer(config: FluxStackConfig, logger: Logger): ServiceContainer {
  const container = new ServiceContainer(config, logger)

  // Register all services
  container.registerMany([
    {
      name: 'userService',
      constructor: UserService,
      singleton: true
    },
    {
      name: 'notificationService',
      constructor: NotificationService,
      dependencies: [], // Could depend on userService if needed
      singleton: true
    }
  ])

  return container
}

// Re-export service classes and types
export { BaseService } from './BaseService'
export { ServiceContainer } from './ServiceContainer'
export { UserService } from './UserService'
export { NotificationService } from './NotificationService'

export type { ServiceContext, ServiceContainer as IServiceContainer } from './BaseService'
export type { ServiceDefinition } from './ServiceContainer'
export type { User, CreateUserData, UpdateUserData } from './UserService'
export type { 
  Notification, 
  CreateNotificationData 
} from './NotificationService'