/**
 * FluxLivePlugin
 * 
 * FluxStack server framework plugin for integrating FluxLive system.
 * Provides WebSocket endpoints, component lifecycle management,
 * and real-time communication infrastructure.
 */

import type { Plugin, FluxStackContext } from '../types'
import { ComponentIsolationManager } from './ComponentIsolationManager'
import { ComponentCleanupManager } from './ComponentCleanupManager'
import { WebSocketManager } from './WebSocketManager'
import { LiveComponentStateBridge } from './LiveComponentStateBridge'
import { LiveComponentEventSystem } from './LiveComponentEventSystem'
import { Logger } from '../utils/logger'

/**
 * FluxLive plugin configuration
 */
export interface FluxLiveConfig {
  /** Enable FluxLive system */
  enabled: boolean
  
  /** WebSocket endpoint path */
  websocketPath: string
  
  /** WebSocket server options */
  websocketOptions: {
    port?: number
    host?: string
    perMessageDeflate?: boolean
    maxPayload?: number
    maxCompressedSize?: number
    idleTimeout?: number
  }
  
  /** Component cleanup configuration */
  cleanup: {
    enableGarbageCollection: boolean
    gcInterval: number
    staleThreshold: number
    maxCleanupBatch: number
    enableBrowserCloseDetection: boolean
  }
  
  /** State bridge configuration */
  stateBridge: {
    enableOptimisticUpdates: boolean
    conflictStrategy: 'server_wins' | 'client_wins' | 'last_write_wins' | 'merge'
    enablePersistence: boolean
    debounceDelay: number
  }
  
  /** Event system configuration */
  eventSystem: {
    maxQueueSize: number
    processingTimeout: number
    enableBatching: boolean
    batchSize: number
    enableHistory: boolean
  }
}

/**
 * WebSocket connection info
 */
interface WSConnection {
  id: string
  clientId: string
  ws: any // WebSocket from Elysia
  lastHeartbeat: number
  componentIds: Set<string>
}

/**
 * FluxLive plugin implementation
 */
export const fluxLivePlugin: Plugin = {
  name: 'fluxlive',
  setup(context: FluxStackContext, app: any) {
    const config = getFluxLiveConfig(context)
    if (!config.enabled) return
    
    const logger = context.logger || console as any
    
    // Initialize FluxLive managers
    const isolationManager = new ComponentIsolationManager(logger)
    const cleanupManager = new ComponentCleanupManager(isolationManager, config.cleanup, logger)
    const wsManager = new WebSocketManager({
      url: `ws://${config.websocketOptions.host || 'localhost'}:${config.websocketOptions.port || 3000}${config.websocketPath}`,
      maxReconnectAttempts: 10,
      reconnectDelay: 1000,
      heartbeatInterval: 30000,
      maxQueueSize: 100,
      connectionTimeout: 10000,
      enableBatching: true,
      batchSize: 10,
      batchTimeout: 100
    }, logger)
    
    const stateBridge = new LiveComponentStateBridge(
      wsManager, 
      isolationManager, 
      config.stateBridge, 
      logger
    )
    
    const eventSystem = new LiveComponentEventSystem(
      wsManager, 
      isolationManager, 
      config.eventSystem, 
      logger
    )
    
    // Store instances in context for access by other plugins/routes
    context.fluxLive = {
      isolationManager,
      cleanupManager,
      wsManager,
      stateBridge,
      eventSystem
    }
    
    // Track WebSocket connections
    const connections = new Map<string, WSConnection>()
    
    // Setup WebSocket endpoint
    app.ws(config.websocketPath, {
      // WebSocket upgrade handler
      upgrade(res: any, req: any, context: any) {
        logger.debug('WebSocket upgrade request', { 
          url: req.getUrl(),
          headers: req.getHeaders?.() 
        })
        
        res.upgrade({
          clientId: generateClientId(),
          userAgent: req.getHeader('user-agent'),
          remoteAddress: req.getRemoteAddress?.()
        }, 
        req.getHeader('sec-websocket-key'),
        req.getHeader('sec-websocket-protocol'),
        req.getHeader('sec-websocket-extensions'),
        context)
      },
      
      // WebSocket connection handler
      open(ws: any) {
        const connectionId = generateConnectionId()
        const clientId = ws.data?.clientId || generateClientId()
        
        const connection: WSConnection = {
          id: connectionId,
          clientId,
          ws,
          lastHeartbeat: Date.now(),
          componentIds: new Set()
        }
        
        connections.set(connectionId, connection)
        
        logger.info('WebSocket client connected', { 
          connectionId, 
          clientId,
          totalConnections: connections.size
        })
        
        // Send welcome message
        ws.send(JSON.stringify({
          type: 'welcome',
          connectionId,
          clientId,
          timestamp: Date.now()
        }))
        
        // Setup heartbeat
        const heartbeatInterval = setInterval(() => {
          if (ws.readyState === 1) { // OPEN
            ws.send(JSON.stringify({
              type: 'heartbeat',
              timestamp: Date.now()
            }))
          } else {
            clearInterval(heartbeatInterval)
          }
        }, 30000)
        
        ws.data.heartbeatInterval = heartbeatInterval
      },
      
      // WebSocket message handler
      message(ws: any, message: any) {
        const connection = findConnectionByWS(connections, ws)
        if (!connection) return
        
        try {
          const data = typeof message === 'string' ? JSON.parse(message) : message
          handleWebSocketMessage(connection, data, {
            isolationManager,
            cleanupManager,
            stateBridge,
            eventSystem,
            logger
          })
        } catch (error) {
          logger.error('WebSocket message processing error:', error)
          ws.send(JSON.stringify({
            type: 'error',
            error: 'Invalid message format'
          }))
        }
      },
      
      // WebSocket close handler
      close(ws: any, code: number, message: any) {
        const connection = findConnectionByWS(connections, ws)
        if (!connection) return
        
        logger.info('WebSocket client disconnected', {
          connectionId: connection.id,
          clientId: connection.clientId,
          code,
          message
        })
        
        // Cleanup components for this client
        if (connection.componentIds.size > 0) {
          cleanupManager.cleanupComponents(
            Array.from(connection.componentIds),
            'websocket_disconnect'
          ).catch(error => {
            logger.error('Error cleaning up components on disconnect:', error)
          })
        }
        
        // Clear heartbeat interval
        if (ws.data.heartbeatInterval) {
          clearInterval(ws.data.heartbeatInterval)
        }
        
        connections.delete(connection.id)
      }
    })
    
    // Add REST API endpoints for FluxLive
    setupFluxLiveRoutes(app, {
      isolationManager,
      cleanupManager,
      stateBridge,
      eventSystem,
      connections,
      logger
    })
    
    logger.info('FluxLive plugin initialized', {
      websocketPath: config.websocketPath,
      websocketPort: config.websocketOptions.port
    })
  }
}

/**
 * Get FluxLive configuration with defaults
 */
function getFluxLiveConfig(context: FluxStackContext): FluxLiveConfig {
  const defaultConfig: FluxLiveConfig = {
    enabled: true,
    websocketPath: '/fluxlive',
    websocketOptions: {
      port: 3000,
      host: 'localhost',
      perMessageDeflate: false,
      maxPayload: 1024 * 1024, // 1MB
      maxCompressedSize: 1024 * 1024,
      idleTimeout: 60
    },
    cleanup: {
      enableGarbageCollection: true,
      gcInterval: 5 * 60 * 1000, // 5 minutes
      staleThreshold: 30 * 60 * 1000, // 30 minutes
      maxCleanupBatch: 50,
      enableBrowserCloseDetection: true
    },
    stateBridge: {
      enableOptimisticUpdates: true,
      conflictStrategy: 'last_write_wins',
      enablePersistence: false,
      debounceDelay: 100
    },
    eventSystem: {
      maxQueueSize: 1000,
      processingTimeout: 5000,
      enableBatching: true,
      batchSize: 10,
      enableHistory: true
    }
  }
  
  // Merge with user configuration
  return {
    ...defaultConfig,
    ...context.config?.fluxLive
  }
}

/**
 * Handle WebSocket messages
 */
async function handleWebSocketMessage(
  connection: WSConnection,
  message: any,
  managers: {
    isolationManager: ComponentIsolationManager
    cleanupManager: ComponentCleanupManager
    stateBridge: LiveComponentStateBridge
    eventSystem: LiveComponentEventSystem
    logger: Logger
  }
) {
  const { isolationManager, cleanupManager, stateBridge, eventSystem, logger } = managers
  
  switch (message.type) {
    case 'heartbeat_response':
      connection.lastHeartbeat = Date.now()
      break
      
    case 'component_mount':
      await handleComponentMount(connection, message, { isolationManager, cleanupManager, logger })
      break
      
    case 'component_unmount':
      await handleComponentUnmount(connection, message, { isolationManager, cleanupManager, logger })
      break
      
    case 'state_update':
      await handleStateUpdate(connection, message, { stateBridge, logger })
      break
      
    case 'method_call':
      await handleMethodCall(connection, message, { isolationManager, logger })
      break
      
    case 'event_emit':
      await handleEventEmit(connection, message, { eventSystem, logger })
      break
      
    case 'sync_request':
      await handleSyncRequest(connection, message, { stateBridge, logger })
      break
      
    default:
      logger.warn('Unknown WebSocket message type:', message.type)
      connection.ws.send(JSON.stringify({
        type: 'error',
        error: `Unknown message type: ${message.type}`,
        replyTo: message.id
      }))
  }
}

/**
 * Handle component mount
 */
async function handleComponentMount(
  connection: WSConnection,
  message: any,
  managers: { isolationManager: ComponentIsolationManager, cleanupManager: ComponentCleanupManager, logger: Logger }
) {
  const { isolationManager, cleanupManager, logger } = managers
  
  try {
    const { actionName, props = {}, parentId } = message.payload
    
    // Create component instance
    const identity = isolationManager.createInstance(actionName, props, connection.clientId, parentId)
    
    // Register for cleanup
    cleanupManager.registerComponent(identity.componentId, connection.ws)
    
    // Track component in connection
    connection.componentIds.add(identity.componentId)
    
    // Send response
    connection.ws.send(JSON.stringify({
      type: 'component_mounted',
      payload: {
        componentId: identity.componentId,
        identity
      },
      replyTo: message.id
    }))
    
    logger.debug('Component mounted', {
      componentId: identity.componentId,
      actionName,
      clientId: connection.clientId
    })
    
  } catch (error) {
    logger.error('Component mount failed:', error)
    connection.ws.send(JSON.stringify({
      type: 'error',
      error: error.message,
      replyTo: message.id
    }))
  }
}

/**
 * Handle component unmount
 */
async function handleComponentUnmount(
  connection: WSConnection,
  message: any,
  managers: { isolationManager: ComponentIsolationManager, cleanupManager: ComponentCleanupManager, logger: Logger }
) {
  const { cleanupManager, logger } = managers
  
  try {
    const { componentId } = message.payload
    
    // Cleanup component
    await cleanupManager.cleanupComponent(componentId, 'component_unmount')
    
    // Remove from connection tracking
    connection.componentIds.delete(componentId)
    
    // Send response
    connection.ws.send(JSON.stringify({
      type: 'component_unmounted',
      payload: { componentId },
      replyTo: message.id
    }))
    
    logger.debug('Component unmounted', { componentId, clientId: connection.clientId })
    
  } catch (error) {
    logger.error('Component unmount failed:', error)
    connection.ws.send(JSON.stringify({
      type: 'error',
      error: error.message,
      replyTo: message.id
    }))
  }
}

/**
 * Handle state update
 */
async function handleStateUpdate(
  connection: WSConnection,
  message: any,
  managers: { stateBridge: LiveComponentStateBridge, logger: Logger }
) {
  const { stateBridge, logger } = managers
  
  try {
    const stateChange = message.payload
    
    // Apply state change
    await stateBridge.updateState(
      stateChange.componentId,
      stateChange.operation,
      stateChange.path,
      stateChange.value,
      false // Not optimistic on server
    )
    
    // Broadcast to other clients
    broadcastToOtherClients(connection, {
      type: 'state_update',
      payload: stateChange
    })
    
    // Send confirmation
    connection.ws.send(JSON.stringify({
      type: 'state_update_confirmed',
      payload: { changeId: stateChange.id },
      replyTo: message.id
    }))
    
  } catch (error) {
    logger.error('State update failed:', error)
    connection.ws.send(JSON.stringify({
      type: 'error',
      error: error.message,
      replyTo: message.id
    }))
  }
}

/**
 * Handle method call
 */
async function handleMethodCall(
  connection: WSConnection,
  message: any,
  managers: { isolationManager: ComponentIsolationManager, logger: Logger }
) {
  const { isolationManager, logger } = managers
  
  try {
    const { componentId, methodName, args = [] } = message.payload
    
    const instance = isolationManager.getInstance(componentId)
    if (!instance) {
      throw new Error(`Component not found: ${componentId}`)
    }
    
    // Call method on component instance
    const result = await instance.callMethod?.(methodName, args)
    
    // Send response
    connection.ws.send(JSON.stringify({
      type: 'method_result',
      payload: { result },
      replyTo: message.id
    }))
    
  } catch (error) {
    logger.error('Method call failed:', error)
    connection.ws.send(JSON.stringify({
      type: 'error',
      error: error.message,
      replyTo: message.id
    }))
  }
}

/**
 * Handle event emit
 */
async function handleEventEmit(
  connection: WSConnection,
  message: any,
  managers: { eventSystem: LiveComponentEventSystem, logger: Logger }
) {
  const { eventSystem, logger } = managers
  
  try {
    const eventData = message.payload
    
    // Emit event through event system
    await eventSystem.emit(
      eventData.componentId,
      eventData.name,
      eventData.payload,
      {
        type: eventData.type,
        scope: eventData.scope,
        targetId: eventData.targetId,
        priority: eventData.priority
      }
    )
    
    // Send confirmation
    connection.ws.send(JSON.stringify({
      type: 'event_emitted',
      payload: { eventId: eventData.id },
      replyTo: message.id
    }))
    
  } catch (error) {
    logger.error('Event emit failed:', error)
    connection.ws.send(JSON.stringify({
      type: 'error',
      error: error.message,
      replyTo: message.id
    }))
  }
}

/**
 * Handle sync request
 */
async function handleSyncRequest(
  connection: WSConnection,
  message: any,
  managers: { stateBridge: LiveComponentStateBridge, logger: Logger }
) {
  const { stateBridge, logger } = managers
  
  try {
    const { componentId, currentVersion } = message.payload
    
    // Get current state
    const currentState = stateBridge.getState(componentId)
    
    // Send sync response
    connection.ws.send(JSON.stringify({
      type: 'sync_response',
      payload: {
        componentId,
        state: currentState,
        version: currentVersion + 1 // Increment version
      },
      replyTo: message.id
    }))
    
  } catch (error) {
    logger.error('Sync request failed:', error)
    connection.ws.send(JSON.stringify({
      type: 'error',
      error: error.message,
      replyTo: message.id
    }))
  }
}

/**
 * Setup REST API routes for FluxLive management
 */
function setupFluxLiveRoutes(app: any, managers: any) {
  const { isolationManager, cleanupManager, stateBridge, eventSystem, connections, logger } = managers
  
  // Get system status
  app.get('/api/fluxlive/status', () => {
    return {
      status: 'active',
      connections: connections.size,
      components: isolationManager.getAllComponents().length,
      uptime: process.uptime()
    }
  })
  
  // Get component list
  app.get('/api/fluxlive/components', () => {
    return {
      components: isolationManager.getAllComponents(),
      total: isolationManager.getAllComponents().length
    }
  })
  
  // Get component details
  app.get('/api/fluxlive/components/:id', ({ params }: { params: { id: string } }) => {
    const instance = isolationManager.getInstance(params.id)
    if (!instance) {
      return { error: 'Component not found' }
    }
    
    return {
      component: instance,
      subscriptions: eventSystem.getComponentSubscriptions(params.id)
    }
  })
  
  // Get cleanup statistics
  app.get('/api/fluxlive/cleanup/stats', () => {
    return cleanupManager.getCleanupStats()
  })
  
  // Force garbage collection
  app.post('/api/fluxlive/cleanup/gc', async () => {
    const result = await cleanupManager.forceGarbageCollection()
    return result
  })
  
  // Get event metrics
  app.get('/api/fluxlive/events/metrics', () => {
    return eventSystem.getMetrics()
  })
  
  // Get event history
  app.get('/api/fluxlive/events/history', () => {
    return {
      events: eventSystem.getEventHistory(),
      deadLetterQueue: eventSystem.getDeadLetterQueue()
    }
  })
  
  // Get WebSocket connections
  app.get('/api/fluxlive/connections', () => {
    return {
      connections: Array.from(connections.values()).map(conn => ({
        id: conn.id,
        clientId: conn.clientId,
        lastHeartbeat: conn.lastHeartbeat,
        componentCount: conn.componentIds.size,
        components: Array.from(conn.componentIds)
      })),
      total: connections.size
    }
  })
}

/**
 * Utility functions
 */
function findConnectionByWS(connections: Map<string, WSConnection>, ws: any): WSConnection | undefined {
  for (const connection of connections.values()) {
    if (connection.ws === ws) {
      return connection
    }
  }
  return undefined
}

function broadcastToOtherClients(excludeConnection: WSConnection, message: any) {
  // This would broadcast to other connections
  // Implementation depends on how connections are managed globally
}

function generateClientId(): string {
  return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

function generateConnectionId(): string {
  return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Export configuration type for TypeScript users
export type { FluxLiveConfig }