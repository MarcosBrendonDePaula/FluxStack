// 🔥 FluxStack Live Components - Component Registry

import type { 
  LiveComponent, 
  LiveMessage, 
  BroadcastMessage, 
  ComponentDefinition,
  WebSocketData 
} from '../../types/types'
import { stateSignature, SignedState } from './StateSignature'

export class ComponentRegistry {
  private components = new Map<string, LiveComponent>()
  private definitions = new Map<string, ComponentDefinition>()
  private rooms = new Map<string, Set<string>>() // roomId -> componentIds
  private wsConnections = new Map<string, any>() // componentId -> websocket
  private autoDiscoveredComponents = new Map<string, any>() // Auto-discovered component classes
  
  // Register component definition
  registerComponent<TState>(definition: ComponentDefinition<TState>) {
    this.definitions.set(definition.name, definition)
    console.log(`📝 Registered component: ${definition.name}`)
  }

  // Register component class dynamically
  registerComponentClass(name: string, componentClass: any) {
    this.autoDiscoveredComponents.set(name, componentClass)
    console.log(`🔍 Auto-discovered component: ${name}`)
  }

  // Auto-discover components from directory
  async autoDiscoverComponents(componentsPath: string) {
    try {
      const fs = await import('fs')
      const path = await import('path')
      
      if (!fs.existsSync(componentsPath)) {
        console.log(`⚠️ Components path not found: ${componentsPath}`)
        return
      }

      const files = fs.readdirSync(componentsPath)
      
      for (const file of files) {
        if (file.endsWith('.ts') || file.endsWith('.js')) {
          try {
            const fullPath = path.join(componentsPath, file)
            const module = await import(/* @vite-ignore */ fullPath)
            
            // Look for exported classes that extend LiveComponent
            Object.keys(module).forEach(exportName => {
              const exportedItem = module[exportName]
              if (typeof exportedItem === 'function' && 
                  exportedItem.prototype && 
                  this.isLiveComponentClass(exportedItem)) {
                
                const componentName = exportName.replace(/Component$/, '')
                this.registerComponentClass(componentName, exportedItem)
              }
            })
          } catch (error) {
            console.warn(`⚠️ Failed to load component from ${file}:`, error)
          }
        }
      }
    } catch (error) {
      console.error('❌ Auto-discovery failed:', error)
    }
  }

  // Check if a class extends LiveComponent
  private isLiveComponentClass(cls: any): boolean {
    try {
      let prototype = cls.prototype
      while (prototype) {
        if (prototype.constructor.name === 'LiveComponent') {
          return true
        }
        prototype = Object.getPrototypeOf(prototype)
      }
      return false
    } catch {
      return false
    }
  }

  // Mount component instance
  async mountComponent(
    ws: any, 
    componentName: string, 
    props: any = {},
    options?: { room?: string; userId?: string }
  ): Promise<{ componentId: string; initialState: any; signedState: any }> {
    // Try to find component definition first
    let definition = this.definitions.get(componentName)
    let ComponentClass: any = null
    let initialState: any = {}

    if (definition) {
      // Use registered definition
      ComponentClass = definition.component
      initialState = definition.initialState
    } else {
      // Try auto-discovered components
      ComponentClass = this.autoDiscoveredComponents.get(componentName)
      if (!ComponentClass) {
        // Try variations of the name
        const variations = [
          componentName + 'Component',
          componentName.charAt(0).toUpperCase() + componentName.slice(1) + 'Component',
          componentName.charAt(0).toUpperCase() + componentName.slice(1)
        ]
        
        for (const variation of variations) {
          ComponentClass = this.autoDiscoveredComponents.get(variation)
          if (ComponentClass) break
        }
      }
      
      if (!ComponentClass) {
        const availableComponents = [
          ...Array.from(this.definitions.keys()),
          ...Array.from(this.autoDiscoveredComponents.keys())
        ]
        throw new Error(`Component '${componentName}' not found. Available: ${availableComponents.join(', ')}`)
      }
      
      // Create a default initial state for auto-discovered components
      initialState = {}
    }

    // Create component instance with registry methods
    const component = new ComponentClass(
      { ...initialState, ...props },
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
    
    // Send initial state to client with signature
    const signedState = stateSignature.signState(component.id, component.getSerializableState())
    component.emit('STATE_UPDATE', { 
      state: component.getSerializableState(),
      signedState 
    })

    // Return component ID with signed state for immediate persistence
    return { 
      componentId: component.id,
      initialState: component.getSerializableState(),
      signedState 
    }
  }

  // Re-hydrate component with signed client state
  async rehydrateComponent(
    componentId: string,
    componentName: string, 
    signedState: SignedState,
    ws: any,
    options?: { room?: string; userId?: string }
  ): Promise<{ success: boolean; newComponentId?: string; error?: string }> {
    console.log('🔄 Attempting component re-hydration:', {
      oldComponentId: componentId,
      componentName,
      signedState: {
        timestamp: signedState.timestamp,
        version: signedState.version,
        signature: signedState.signature.substring(0, 16) + '...'
      }
    })

    try {
      // Validate signed state integrity
      const validation = stateSignature.validateState(signedState)
      if (!validation.valid) {
        console.warn('❌ State signature validation failed:', validation.error)
        return {
          success: false,
          error: validation.error || 'Invalid state signature'
        }
      }

      // Try to find component definition (same logic as mountComponent)
      let definition = this.definitions.get(componentName)
      let ComponentClass: any = null
      let initialState: any = {}

      if (definition) {
        // Use registered definition
        ComponentClass = definition.component
        initialState = definition.initialState
      } else {
        // Try auto-discovered components
        ComponentClass = this.autoDiscoveredComponents.get(componentName)
        if (!ComponentClass) {
          // Try variations of the name
          const variations = [
            componentName + 'Component',
            componentName.charAt(0).toUpperCase() + componentName.slice(1) + 'Component',
            componentName.charAt(0).toUpperCase() + componentName.slice(1)
          ]
          
          for (const variation of variations) {
            ComponentClass = this.autoDiscoveredComponents.get(variation)
            if (ComponentClass) break
          }
        }
        
        if (!ComponentClass) {
          const availableComponents = [
            ...Array.from(this.definitions.keys()),
            ...Array.from(this.autoDiscoveredComponents.keys())
          ]
          return {
            success: false,
            error: `Component '${componentName}' not found. Available: ${availableComponents.join(', ')}`
          }
        }
      }

      // Extract validated state
      const clientState = stateSignature.extractData(signedState)
      
      // Create new component instance with client state (merge with initial state if from definition)
      const finalState = definition ? { ...initialState, ...clientState } : clientState
      const component = new ComponentClass(finalState, ws, options)
      
      // Store component
      this.components.set(component.id, component)
      this.wsConnections.set(component.id, ws)

      // Setup room if specified
      if (options?.room) {
        this.subscribeToRoom(component.id, options.room)
      }

      // Initialize WebSocket data
      if (!ws.data) {
        ws.data = {
          components: new Map(),
          subscriptions: new Set(),
          userId: options?.userId
        } as WebSocketData
      }

      ws.data.components.set(component.id, component)

      console.log('✅ Component re-hydrated successfully:', {
        oldComponentId: componentId,
        newComponentId: component.id,
        componentName,
        stateVersion: signedState.version
      })
      
      // Send updated state to client (with new signature)
      const newSignedState = stateSignature.signState(
        component.id, 
        component.getSerializableState(),
        signedState.version + 1
      )
      
      component.emit('STATE_REHYDRATED', { 
        state: component.getSerializableState(),
        signedState: newSignedState,
        oldComponentId: componentId,
        newComponentId: component.id
      })

      return {
        success: true,
        newComponentId: component.id
      }

    } catch (error: any) {
      console.error('❌ Component re-hydration failed:', error.message)
      return {
        success: false,
        error: error.message
      }
    }
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
      console.log(`🔄 Component '${componentId}' not found - triggering re-hydration request`)
      // Return special error that triggers re-hydration on client
      throw new Error(`COMPONENT_REHYDRATION_REQUIRED:${componentId}`)
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
    for (const [roomId, components] of Array.from(this.rooms.entries())) {
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
    
    for (const componentId of Array.from(roomComponents)) {
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
          const mountResult = await this.mountComponent(
            ws, 
            message.payload.component, 
            message.payload.props,
            { 
              room: message.payload.room,
              userId: message.userId 
            }
          )
          return { success: true, result: mountResult }

        case 'COMPONENT_UNMOUNT':
          await this.unmountComponent(message.componentId)
          return { success: true }

        case 'CALL_ACTION':
          // Execute action - response depends on expectResponse flag
          const actionResult = await this.executeAction(
            message.componentId,
            message.action!,
            message.payload
          )
          
          // If client expects response, return it
          if (message.expectResponse) {
            return { success: true, result: actionResult }
          }
          
          // Otherwise no return - if state changed, component will emit STATE_UPDATE automatically
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
      
      // Return error for handleActionCall to process
      return { success: false, error: error.message }
    }
  }

  // Cleanup when WebSocket disconnects
  cleanupConnection(ws: any) {
    if (!ws.data?.components) return

    const componentsToCleanup = Array.from(ws.data.components.keys()) as string[]
    
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