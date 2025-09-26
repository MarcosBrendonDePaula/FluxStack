// 🔥 FluxStack Live Components - WebSocket Plugin

import { WebSocketServer } from 'ws'
import { componentRegistry } from './ComponentRegistry'
import type { LiveMessage } from './types'

let wsServer: WebSocketServer | null = null

export const liveComponentsPlugin = {
  name: 'live-components',
  version: '1.0.0',
  dependencies: [],
  
  setup: async (context: any) => {
    console.log('🔌 Setting up Live Components plugin...')
    
    // Add routes to the app
    context.app
      .get('/api/live/websocket-info', () => {
        return {
          success: true,
          message: 'Live Components WebSocket available',
          endpoint: 'ws://localhost:3001/live',
          status: wsServer ? 'running' : 'initializing'
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
          uptime: process.uptime(),
          timestamp: new Date().toISOString()
        }
      })
  },

  onServerStart: async (context: any) => {
    // Initialize WebSocket server when main server starts
    if (!wsServer) {
      wsServer = new WebSocketServer({ 
        port: 3001, // Different port for WebSocket
        path: '/live'
      })

      wsServer.on('connection', (ws, request) => {
        const connectionId = `ws-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        console.log(`🔌 Live Components WebSocket connected: ${connectionId}`)
        
        // Store connection data
        ;(ws as any).data = {
          connectionId,
          components: new Map(),
          subscriptions: new Set(),
          connectedAt: new Date()
        }

        // Send connection confirmation
        ws.send(JSON.stringify({
          type: 'CONNECTION_ESTABLISHED',
          connectionId,
          timestamp: Date.now()
        }))

        // Handle incoming messages
        ws.on('message', async (rawMessage) => {
          try {
            let message: LiveMessage
            
            if (typeof rawMessage === 'string') {
              message = JSON.parse(rawMessage)
            } else {
              message = JSON.parse(rawMessage.toString())
            }

            // Add connection metadata
            message.timestamp = Date.now()
            
            console.log(`📨 Received message:`, {
              type: message.type,
              componentId: message.componentId,
              action: message.action,
              property: message.property
            })

            // Handle message through registry
            const result = await componentRegistry.handleMessage(ws, message)
            
            // Only send response if result is not null
            if (result !== null) {
              const response = {
                type: message.expectResponse ? 'ACTION_RESPONSE' : 'MESSAGE_RESPONSE',
                originalType: message.type,
                componentId: message.componentId,
                success: result.success,
                result: result.result,
                error: result.error,
                requestId: message.requestId, // Include requestId for request-response
                timestamp: Date.now()
              }

              ws.send(JSON.stringify(response))
            }

          } catch (error: any) {
            console.error('❌ WebSocket message error:', error.message)
            
            // Send error response
            const errorResponse = {
              type: 'ERROR',
              requestId: message.requestId, // Include requestId even for errors
              error: error.message,
              timestamp: Date.now()
            }
            
            ws.send(JSON.stringify(errorResponse))
          }
        })

        // Handle connection close
        ws.on('close', () => {
          console.log(`❌ Live Components WebSocket disconnected: ${connectionId}`)
          componentRegistry.cleanupConnection(ws)
        })

        // Handle errors
        ws.on('error', (error) => {
          console.error('❌ WebSocket error:', error)
          componentRegistry.cleanupConnection(ws)
        })
      })

      wsServer.on('listening', () => {
        console.log('🔌 Live Components WebSocket Server listening on port 3001')
      })

      wsServer.on('error', (error) => {
        console.error('❌ WebSocket Server error:', error)
      })
    }
  },

  onServerStop: async (context: any) => {
    if (wsServer) {
      wsServer.close()
      wsServer = null
      console.log('🔌 Live Components WebSocket Server stopped')
    }
  }
}