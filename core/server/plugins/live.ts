import { Plugin, FluxStackContext } from '@/core/types'
import { LiveAction } from '@/core/live'

export const livePlugin: Plugin = {
    name: 'live',
    setup(context: FluxStackContext, app: any) {
        console.log('🔥 FluxStack Live Components plugin loaded')
        
        // WebSocket route for live components
        app.ws('/live', {
            message: handleLiveMessage,
            open: (ws: any) => {
                console.log(`🔌 Live client connected: ${ws.id}`)
                
                // Subscribe to broadcasts
                ws.subscribe('component.broadcast')
            },
            close: (ws: any) => {
                console.log(`❌ Live client disconnected: ${ws.id}`)
            }
        })
        
        console.log('📡 Live WebSocket endpoint registered at /live')
    }
}

async function handleLiveMessage(ws: any, message: any) {
    try {
        // Handle both string and object messages
        const parsedMessage = typeof message === 'string' ? JSON.parse(message) : message
        const result: any = { updates: [] }
        
        if (parsedMessage.updates && Array.isArray(parsedMessage.updates)) {
            for (const update of parsedMessage.updates) {
                switch (update.type) {
                    case 'callMethod':
                        const { payload } = update
                        const { 
                            name: componentName, 
                            id: instanceId, 
                            methodName, 
                            params, 
                            state: clientState 
                        } = payload
                        
                        console.log(`🎯 Live action: ${componentName}.${methodName}(${params?.length || 0} params)`)
                        
                        const newState = LiveAction.trigger({
                            componentName,
                            clientState,
                            methodName,
                            params: params || [],
                            ws,
                            componentId: instanceId
                        })
                        
                        if (newState) {
                            result.updates.push({
                                type: "state_update",
                                id: instanceId,
                                state: newState
                            })
                        }
                        break
                        
                    case 'mount':
                        console.log(`🏗️  Mounting component: ${update.componentName}`)
                        // Component mounting logic if needed
                        break
                        
                    case 'unmount':
                        console.log(`🗑️  Unmounting component: ${update.componentId}`)
                        // Destroy persistent instance
                        LiveAction.destroyInstance(update.componentId)
                        break
                        
                    case 'getInitialState':
                        const { componentName: requestedComponent, props: requestedProps } = update
                        console.log(`📊 Getting initial state for: ${requestedComponent}`)
                        
                        const initialState = LiveAction.getClientInitialState(requestedComponent, requestedProps)
                        result.updates.push({
                            type: 'initial_state',
                            componentName: requestedComponent,
                            state: initialState
                        })
                        break
                        
                    default:
                        console.warn(`⚠️  Unknown live update type: ${update.type}`)
                }
            }
        }
        
        // Send response if we have updates
        if (ws.raw.readyState === WebSocket.OPEN && result.updates.length > 0) {
            ws.send(JSON.stringify(result))
        }
        
    } catch (error) {
        console.error('❌ Live message error:', error)
        
        if (ws.raw.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                updates: [{
                    type: 'error',
                    error: error instanceof Error ? error.message : 'Unknown error'
                }]
            }))
        }
    }
}