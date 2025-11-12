// 🔥 FluxStack Live Components - Enhanced WebSocket Plugin with Connection Management

import { componentRegistry } from './ComponentRegistry'
import { fileUploadManager } from './FileUploadManager'
import { connectionManager } from './WebSocketConnectionManager'
import { performanceMonitor } from './LiveComponentPerformanceMonitor'
import type { LiveMessage, FileUploadStartMessage, FileUploadChunkMessage, FileUploadCompleteMessage } from '@/core/plugins/types'
import type { Plugin, PluginContext } from '@/core/index'
import { t } from 'elysia'
import path from 'path'

// Helper function to send debug logs to client
function sendDebugLog(ws: any, type: string, message: string, data?: any) {
  if (ws.data?.debugMode) {
    ws.send(JSON.stringify({
      type: 'DEBUG_LOG',
      logType: type,
      message,
      data,
      timestamp: Date.now()
    }))
  }
}

export const liveComponentsPlugin: Plugin = {
  name: 'live-components',
  version: '1.0.0',
  description: 'Real-time Live Components with Elysia native WebSocket support',
  author: 'FluxStack Team',
  priority: 'normal',
  category: 'core',
  tags: ['websocket', 'real-time', 'live-components'],
  
  setup: async (context: PluginContext) => {
    context.logger.debug('🔌 Setting up Live Components plugin with Elysia WebSocket...')
    
    // Auto-discover components from app/server/live directory
    const componentsPath = path.join(process.cwd(), 'app', 'server', 'live')
    await componentRegistry.autoDiscoverComponents(componentsPath)
    context.logger.debug('🔍 Component auto-discovery completed')
    
    // Add WebSocket route for Live Components
    context.app
      .ws('/api/live/ws', {
        body: t.Object({
          type: t.String(),
          componentId: t.String(),
          action: t.Optional(t.String()),
          payload: t.Optional(t.Any()),
          timestamp: t.Optional(t.Number()),
          userId: t.Optional(t.String()),
          room: t.Optional(t.String()),
          requestId: t.Optional(t.String()),
          expectResponse: t.Optional(t.Boolean()),
          // File upload specific fields
          uploadId: t.Optional(t.String()),
          filename: t.Optional(t.String()),
          fileType: t.Optional(t.String()),
          fileSize: t.Optional(t.Number()),
          chunkSize: t.Optional(t.Number()),
          chunkIndex: t.Optional(t.Number()),
          totalChunks: t.Optional(t.Number()),
          data: t.Optional(t.String()),
          hash: t.Optional(t.String())
        }),
        
        open(ws) {
          const connectionId = `ws-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          // console.log(`🔌 Live Components WebSocket connected: ${connectionId}`)
          
          // Register connection with enhanced connection manager
          connectionManager.registerConnection(ws, connectionId, 'live-components')
          
          // Initialize and store connection data in ws.data
          if (!ws.data) {
            ws.data = {}
          }
          ws.data.connectionId = connectionId
          ws.data.components = new Map()
          ws.data.subscriptions = new Set()
          ws.data.connectedAt = new Date()
          ws.data.debugMode = false // Debug mode flag
          
          // Send connection confirmation
          ws.send(JSON.stringify({
            type: 'CONNECTION_ESTABLISHED',
            connectionId,
            timestamp: Date.now(),
            features: {
              compression: true,
              encryption: true,
              offlineQueue: true,
              loadBalancing: true
            }
          }))
        },
        
        async message(ws, message: LiveMessage) {
          try {
            // Add connection metadata
            message.timestamp = Date.now()

            // Uncomment for debugging:
            // console.log(`📨 Received message:`, {
            //   type: message.type,
            //   componentId: message.componentId,
            //   action: message.action,
            //   requestId: message.requestId
            // })

            // Handle different message types
            switch (message.type) {
              case 'COMPONENT_MOUNT':
                await handleComponentMount(ws, message)
                break
              case 'COMPONENT_REHYDRATE':
                await handleComponentRehydrate(ws, message)
                break
              case 'COMPONENT_UNMOUNT':
                await handleComponentUnmount(ws, message)
                break
              case 'CALL_ACTION':
                await handleActionCall(ws, message)
                break
              case 'PROPERTY_UPDATE':
                await handlePropertyUpdate(ws, message)
                break
              case 'COMPONENT_PING':
                await handleComponentPing(ws, message)
                break
              case 'FILE_UPLOAD_START':
                await handleFileUploadStart(ws, message as FileUploadStartMessage)
                break
              case 'FILE_UPLOAD_CHUNK':
                await handleFileUploadChunk(ws, message as FileUploadChunkMessage)
                break
              case 'FILE_UPLOAD_COMPLETE':
                await handleFileUploadComplete(ws, message as unknown as FileUploadCompleteMessage)
                break
              case 'SET_DEBUG_MODE':
                if (ws.data) {
                  ws.data.debugMode = message.payload?.enabled || false
                  sendDebugLog(ws, 'system', `Debug mode ${ws.data.debugMode ? 'enabled' : 'disabled'} on server`)
                }
                break
              default:
                console.warn(`❌ Unknown message type: ${message.type}`)
                ws.send(JSON.stringify({
                  type: 'ERROR',
                  error: `Unknown message type: ${message.type}`,
                  timestamp: Date.now()
                }))
            }
          } catch (error) {
            console.error('❌ WebSocket message error:', error)
            ws.send(JSON.stringify({
              type: 'ERROR',
              error: error instanceof Error ? error.message : 'Unknown error',
              timestamp: Date.now()
            }))
          }
        },
        
        close(ws) {
          const connectionId = ws.data?.connectionId
          // console.log(`🔌 Live Components WebSocket disconnected: ${connectionId}`)
          
          // Cleanup connection in connection manager
          if (connectionId) {
            connectionManager.cleanupConnection(connectionId)
          }
          
          // Cleanup components for this connection
          componentRegistry.cleanupConnection(ws)
        }
      })
      
      // Add Live Components info routes
      .get('/api/live/websocket-info', () => {
        return {
          success: true,
          message: 'Live Components WebSocket available via Elysia',
          endpoint: 'ws://localhost:3000/api/live/ws',
          status: 'running',
          connectionManager: connectionManager.getSystemStats()
        }
      })
      .get('/api/live/stats', () => {
        const stats = componentRegistry.getStats()
        return {
          success: true,
          stats,
          timestamp: new Date().toISOString()
        }
      })
      .get('/api/live/health', () => {
        return {
          success: true,
          service: 'FluxStack Live Components',
          status: 'operational',
          components: componentRegistry.getStats().components,
          connections: connectionManager.getSystemStats(),
          uptime: process.uptime(),
          timestamp: new Date().toISOString()
        }
      })
      .get('/api/live/connections', () => {
        return {
          success: true,
          connections: connectionManager.getAllConnectionMetrics(),
          systemStats: connectionManager.getSystemStats(),
          timestamp: new Date().toISOString()
        }
      })
      .get('/api/live/connections/:connectionId', ({ params }) => {
        const metrics = connectionManager.getConnectionMetrics(params.connectionId)
        if (!metrics) {
          return {
            success: false,
            error: 'Connection not found'
          }
        }
        return {
          success: true,
          connection: metrics,
          timestamp: new Date().toISOString()
        }
      })
      .get('/api/live/pools/:poolId/stats', ({ params }) => {
        const stats = connectionManager.getPoolStats(params.poolId)
        if (!stats) {
          return {
            success: false,
            error: 'Pool not found'
          }
        }
        return {
          success: true,
          pool: params.poolId,
          stats,
          timestamp: new Date().toISOString()
        }
      })
      .get('/api/live/performance/dashboard', () => {
        return {
          success: true,
          dashboard: performanceMonitor.generateDashboard(),
          timestamp: new Date().toISOString()
        }
      })
      .get('/api/live/performance/components/:componentId', ({ params }) => {
        const metrics = performanceMonitor.getComponentMetrics(params.componentId)
        if (!metrics) {
          return {
            success: false,
            error: 'Component metrics not found'
          }
        }
        
        const alerts = performanceMonitor.getComponentAlerts(params.componentId)
        const suggestions = performanceMonitor.getComponentSuggestions(params.componentId)
        
        return {
          success: true,
          component: params.componentId,
          metrics,
          alerts,
          suggestions,
          timestamp: new Date().toISOString()
        }
      })
      .post('/api/live/performance/alerts/:alertId/resolve', ({ params }) => {
        const resolved = performanceMonitor.resolveAlert(params.alertId)
        return {
          success: resolved,
          message: resolved ? 'Alert resolved' : 'Alert not found',
          timestamp: new Date().toISOString()
        }
      })
  },

  onServerStart: async (context: PluginContext) => {
    context.logger.debug('🔌 Live Components WebSocket ready on /api/live/ws')
  }
}

// Handler functions for WebSocket messages
async function handleComponentMount(ws: any, message: LiveMessage) {
  sendDebugLog(ws, 'component', `Mounting component: ${message.payload?.componentName}`, {
    componentId: message.componentId
  })

  const result = await componentRegistry.handleMessage(ws, message)

  if (result !== null) {
    if (result.success) {
      sendDebugLog(ws, 'component', `Component mounted successfully: ${message.payload?.componentName}`, {
        componentId: message.componentId,
        newComponentId: result.result?.componentId
      })
    } else {
      sendDebugLog(ws, 'error', `Component mount failed: ${result.error}`, {
        componentId: message.componentId
      })
    }

    const response = {
      type: 'COMPONENT_MOUNTED',
      componentId: message.componentId,
      success: result.success,
      result: result.result,
      error: result.error,
      requestId: message.requestId,
      timestamp: Date.now()
    }
    ws.send(JSON.stringify(response))
  }
}

async function handleComponentRehydrate(ws: any, message: LiveMessage) {
  sendDebugLog(ws, 'rehydration', `Processing component re-hydration request`, {
    componentId: message.componentId,
    componentName: message.payload?.componentName
  })

  try {
    const { componentName, signedState, room, userId } = message.payload || {}

    if (!componentName || !signedState) {
      throw new Error('Missing componentName or signedState in rehydration payload')
    }

    const result = await componentRegistry.rehydrateComponent(
      message.componentId,
      componentName,
      signedState,
      ws,
      { room, userId }
    )

    if (result.success) {
      sendDebugLog(ws, 'rehydration', `Component re-hydrated successfully`, {
        oldComponentId: message.componentId,
        newComponentId: result.newComponentId,
        componentName
      })
    } else {
      sendDebugLog(ws, 'error', `Component re-hydration failed: ${result.error}`, {
        componentId: message.componentId
      })
    }

    const response = {
      type: 'COMPONENT_REHYDRATED',
      componentId: message.componentId,
      success: result.success,
      result: {
        newComponentId: result.newComponentId,
        ...result
      },
      error: result.error,
      requestId: message.requestId,
      timestamp: Date.now()
    }

    ws.send(JSON.stringify(response))

  } catch (error: any) {
    console.error('❌ Re-hydration handler error:', error.message)
    
    const errorResponse = {
      type: 'COMPONENT_REHYDRATED',
      componentId: message.componentId,
      success: false,
      error: error.message,
      requestId: message.requestId,
      timestamp: Date.now()
    }
    
    ws.send(JSON.stringify(errorResponse))
  }
}

async function handleComponentUnmount(ws: any, message: LiveMessage) {
  const result = await componentRegistry.handleMessage(ws, message)
  
  if (result !== null) {
    const response = {
      type: 'COMPONENT_UNMOUNTED',
      componentId: message.componentId,
      success: result.success,
      requestId: message.requestId,
      timestamp: Date.now()
    }
    ws.send(JSON.stringify(response))
  }
}

async function handleActionCall(ws: any, message: LiveMessage) {
  const result = await componentRegistry.handleMessage(ws, message)
  
  if (result !== null) {
    const response = {
      type: message.expectResponse ? 'ACTION_RESPONSE' : 'MESSAGE_RESPONSE',
      originalType: message.type,
      componentId: message.componentId,
      success: result.success,
      result: result.result,
      error: result.error,
      requestId: message.requestId,
      timestamp: Date.now()
    }
    ws.send(JSON.stringify(response))
  }
}

async function handlePropertyUpdate(ws: any, message: LiveMessage) {
  const result = await componentRegistry.handleMessage(ws, message)

  if (result !== null) {
    const response = {
      type: 'PROPERTY_UPDATED',
      componentId: message.componentId,
      success: result.success,
      result: result.result,
      error: result.error,
      requestId: message.requestId,
      timestamp: Date.now()
    }
    ws.send(JSON.stringify(response))
  }
}

async function handleComponentPing(ws: any, message: LiveMessage) {
  // Update component's last activity timestamp
  const updated = componentRegistry.updateComponentActivity(message.componentId)

  // Send pong response
  const response = {
    type: 'COMPONENT_PONG',
    componentId: message.componentId,
    success: updated,
    requestId: message.requestId,
    timestamp: Date.now()
  }

  ws.send(JSON.stringify(response))
}

// File Upload Handler Functions
async function handleFileUploadStart(ws: any, message: FileUploadStartMessage) {
  // console.log('📤 Starting file upload:', message.uploadId)
  
  const result = await fileUploadManager.startUpload(message)
  
  const response = {
    type: 'FILE_UPLOAD_START_RESPONSE',
    componentId: message.componentId,
    uploadId: message.uploadId,
    success: result.success,
    error: result.error,
    requestId: message.requestId,
    timestamp: Date.now()
  }
  
  ws.send(JSON.stringify(response))
}

async function handleFileUploadChunk(ws: any, message: FileUploadChunkMessage) {
  // console.log(`📦 Receiving chunk ${message.chunkIndex + 1} for upload ${message.uploadId}`)
  
  const progressResponse = await fileUploadManager.receiveChunk(message, ws)
  
  if (progressResponse) {
    ws.send(JSON.stringify(progressResponse))
  } else {
    // Send error response
    const errorResponse = {
      type: 'FILE_UPLOAD_ERROR',
      componentId: message.componentId,
      uploadId: message.uploadId,
      error: 'Failed to process chunk',
      requestId: message.requestId,
      timestamp: Date.now()
    }
    ws.send(JSON.stringify(errorResponse))
  }
}

async function handleFileUploadComplete(ws: any, message: FileUploadCompleteMessage) {
  // console.log('✅ Completing file upload:', message.uploadId)
  
  const completeResponse = await fileUploadManager.completeUpload(message)
  ws.send(JSON.stringify(completeResponse))
}