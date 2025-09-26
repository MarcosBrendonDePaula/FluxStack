// 🔥 FluxStack Live Components - Component Registry

import type { 
  LiveComponent, 
  LiveMessage, 
  BroadcastMessage, 
  ComponentDefinition,
  WebSocketData 
} from './types'

export class ComponentRegistry {
  private components = new Map<string, LiveComponent>()
  private definitions = new Map<string, ComponentDefinition>()
  private rooms = new Map<string, Set<string>>() // roomId -> componentIds
  private wsConnections = new Map<string, any>() // componentId -> websocket
  
  // Register component definition
  registerComponent<TState>(definition: ComponentDefinition<TState>) {
    this.definitions.set(definition.name, definition)
    console.log(`📝 Registered component: ${definition.name}`)
  }

  // Mount component instance
  async mountComponent(
    ws: any, 
    componentName: string, 
    props: any = {},
    options?: { room?: string; userId?: string }
  ): Promise<string> {
    const definition = this.definitions.get(componentName)
    if (!definition) {
      throw new Error(`Component '${componentName}' not found. Available: ${Array.from(this.definitions.keys()).join(', ')}`)
    }

    // Create component instance with registry methods
    const ComponentClass = definition.component as any
    const component = new ComponentClass(
      { ...definition.initialState, ...props },
      ws,
      options
    )

    // Inject registry methods
    component.broadcastToRoom = (message: BroadcastMessage) => {
      this.broadcastToRoom(message, component.id)
    }

    // Store component and connection
    this.components.set(component.id, component)
    this.wsConnections.set(component.id, ws)

    // Subscribe to room if specified
    if (options?.room) {
      this.subscribeToRoom(component.id, options.room)
    }

    // Initialize WebSocket data if needed
    if (!ws.data) {
      ws.data = {
        components: new Map(),
        subscriptions: new Set(),
        userId: options?.userId
      } as WebSocketData
    }

    ws.data.components.set(component.id, component)

    console.log(`🚀 Mounted component: ${componentName} (${component.id})`)
    
    // Send initial state to client
    component.emit('STATE_UPDATE', { state: component.getSerializableState() })

    return component.id
  }

  // Unmount component
  async unmountComponent(componentId: string) {
    const component = this.components.get(componentId)
    if (!component) return

    // Cleanup
    component.destroy()
    
    // Remove from room subscriptions
    this.unsubscribeFromAllRooms(componentId)
    
    // Remove from maps
    this.components.delete(componentId)
    this.wsConnections.delete(componentId)

    console.log(`🗑️ Unmounted component: ${componentId}`)
  }

  // Execute action on component
  async executeAction(componentId: string, action: string, payload: any): Promise<any> {
    const component = this.components.get(componentId)
    if (!component) {
      throw new Error(`Component '${componentId}' not found`)
    }

    try {
      return await component.executeAction(action, payload)
    } catch (error: any) {
      console.error(`❌ Error executing action '${action}' on component '${componentId}':`, error.message)
      throw error
    }
  }

  // Update component property
  updateProperty(componentId: string, property: string, value: any) {
    const component = this.components.get(componentId)
    if (!component) {
      throw new Error(`Component '${componentId}' not found`)
    }

    // Update state
    const updates = { [property]: value }
    component.setState(updates)

    console.log(`📝 Updated property '${property}' on component '${componentId}'`)
  }

  // Subscribe component to room
  subscribeToRoom(componentId: string, roomId: string) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set())
    }
    
    this.rooms.get(roomId)!.add(componentId)
    console.log(`📡 Component '${componentId}' subscribed to room '${roomId}'`)
  }

  // Unsubscribe component from room
  unsubscribeFromRoom(componentId: string, roomId: string) {
    const room = this.rooms.get(roomId)
    if (room) {
      room.delete(componentId)
      if (room.size === 0) {
        this.rooms.delete(roomId)
      }
    }
    console.log(`📡 Component '${componentId}' unsubscribed from room '${roomId}'`)
  }

  // Unsubscribe from all rooms
  private unsubscribeFromAllRooms(componentId: string) {
    for (const [roomId, components] of this.rooms.entries()) {
      if (components.has(componentId)) {
        this.unsubscribeFromRoom(componentId, roomId)
      }
    }
  }

  // Broadcast message to room
  broadcastToRoom(message: BroadcastMessage, senderComponentId?: string) {
    if (!message.room) return

    const roomComponents = this.rooms.get(message.room)
    if (!roomComponents) return

    const broadcastMessage: LiveMessage = {
      type: 'BROADCAST',
      componentId: senderComponentId || 'system',
      payload: {
        type: message.type,
        data: message.payload
      },
      timestamp: Date.now(),
      room: message.room
    }

    let broadcastCount = 0
    
    for (const componentId of roomComponents) {
      // Skip sender if excludeUser is specified
      const component = this.components.get(componentId)
      if (message.excludeUser && component?.userId === message.excludeUser) {
        continue
      }

      const ws = this.wsConnections.get(componentId)
      if (ws && ws.send) {
        ws.send(JSON.stringify(broadcastMessage))
        broadcastCount++
      }
    }

    console.log(`📡 Broadcast '${message.type}' to room '${message.room}': ${broadcastCount} recipients`)
  }

  // Handle WebSocket message
  async handleMessage(ws: any, message: LiveMessage): Promise<any> {
    try {
      switch (message.type) {
        case 'COMPONENT_MOUNT':
          const componentId = await this.mountComponent(
            ws, 
            message.payload.component, 
            message.payload.props,
            { 
              room: message.payload.room,
              userId: message.userId 
            }
          )
          return { success: true, result: { componentId } }

        case 'COMPONENT_UNMOUNT':
          await this.unmountComponent(message.componentId)
          return { success: true }

        case 'CALL_ACTION':
          // Execute action - no response needed, let backend decide if state changes
          await this.executeAction(
            message.componentId,
            message.action!,
            message.payload
          )
          // No return - if state changed, component will emit STATE_UPDATE automatically
          return null

        case 'PROPERTY_UPDATE':
          this.updateProperty(
            message.componentId,
            message.property!,
            message.payload.value
          )
          return { success: true }

        default:
          console.warn(`⚠️ Unknown message type: ${message.type}`)
          return { success: false, error: 'Unknown message type' }
      }
    } catch (error: any) {
      console.error('❌ Registry error:', error.message)
      
      // Send error back to client
      const errorMessage: LiveMessage = {
        type: 'ERROR',
        componentId: message.componentId || 'system',
        payload: {
          error: error.message,
          action: message.action,
          originalMessage: message.type
        },
        timestamp: Date.now()
      }
      
      ws.send(JSON.stringify(errorMessage))
      
      return { success: false, error: error.message }
    }
  }

  // Cleanup when WebSocket disconnects
  cleanupConnection(ws: any) {
    if (!ws.data?.components) return

    const componentsToCleanup = Array.from(ws.data.components.keys())
    
    for (const componentId of componentsToCleanup) {
      this.unmountComponent(componentId)
    }

    console.log(`🧹 Cleaned up ${componentsToCleanup.length} components from disconnected WebSocket`)
  }

  // Get statistics
  getStats() {
    return {
      components: this.components.size,
      definitions: this.definitions.size,
      rooms: this.rooms.size,
      connections: this.wsConnections.size,
      roomDetails: Object.fromEntries(
        Array.from(this.rooms.entries()).map(([roomId, components]) => [
          roomId,
          components.size
        ])
      )
    }
  }

  // Get component by ID
  getComponent(componentId: string): LiveComponent | undefined {
    return this.components.get(componentId)
  }

  // Get all components in room
  getRoomComponents(roomId: string): LiveComponent[] {
    const componentIds = this.rooms.get(roomId) || new Set()
    return Array.from(componentIds)
      .map(id => this.components.get(id))
      .filter(Boolean) as LiveComponent[]
  }
}

// Global registry instance
export const componentRegistry = new ComponentRegistry()