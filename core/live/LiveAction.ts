import type { ElysiaWS } from 'elysia/ws'

export type LiveActionRequest = {
    componentId: string
    componentName: string
    clientState: Record<string, any>
    methodName: string
    params: any[]
    ws: ElysiaWS
}

export abstract class LiveAction {
    private static registry = new Map<string, typeof LiveAction>()
    
    public $ID!: string
    public ws!: ElysiaWS
    public $props: Record<string, any> = {}
    
    // Estado inicial baseado em props
    abstract getInitialState(props: any): Record<string, any>
    
    // Registry system - auto-registro de componentes
    public static add(actionClass: typeof LiveAction) {
        const componentName = actionClass.name.toLowerCase()
        this.registry.set(componentName, actionClass)
        console.log(`🔌 Live component registered: ${componentName}`)
    }
    
    public static get(name: string): typeof LiveAction | undefined {
        return this.registry.get(name.toLowerCase())
    }
    
    // Hydration - restaura estado do cliente no servidor
    private static hydrate(instance: LiveAction, state: Record<string, any>, props: any) {
        // Set props first
        instance.$props = props || {}
        
        // Then hydrate state (avoid overwriting methods)
        for (const key in state) {
            if (key !== '$props' && 
                !key.startsWith('$') && 
                typeof instance[key] !== 'function') {
                instance[key] = state[key]
            }
        }
    }
    
    // Main trigger - executa ações dos componentes
    public static trigger(opts: LiveActionRequest): Record<string, any> | null {
        const ActionClass = this.get(opts.componentName)
        if (!ActionClass) {
            console.error(`❌ Live component not found: ${opts.componentName}`)
            return null
        }
        
        try {
            // @ts-expect-error - Constructor instantiation
            const instance: LiveAction = new ActionClass()
            instance.ws = opts.ws
            instance.$ID = opts.componentId
            
            // Merge initial state (with props) + client state
            const initialState = instance.getInitialState(opts.clientState.$props || {})
            const fullState = { ...initialState, ...opts.clientState }
            
            this.hydrate(instance, fullState, opts.clientState.$props)
            
            // Call requested method
            const method = instance[opts.methodName]
            if (typeof method === 'function') {
                const result = method.apply(instance, opts.params)
                
                // Handle promises
                if (result instanceof Promise) {
                    result
                        .then(() => {
                            // Send updated state after async operation
                            const newState = this.serializeState(instance)
                            console.log(`🔄 Sending async state update for ${instance.$ID}:`, { count: newState.count })
                            instance.ws.send(JSON.stringify({
                                updates: [{
                                    type: 'state_update',
                                    id: instance.$ID,
                                    state: newState
                                }]
                            }))
                        })
                        .catch((error) => {
                            console.error(`❌ Async error in ${opts.componentName}.${opts.methodName}:`, error)
                            instance.ws.send(JSON.stringify({
                                updates: [{
                                    type: 'error',
                                    componentId: instance.$ID,
                                    error: error.message || 'Unknown async error'
                                }]
                            }))
                        })
                    
                    // Return current state immediately (async will update later)
                    return this.serializeState(instance)
                }
            } else {
                console.warn(`⚠️  Method '${opts.methodName}' not found on '${opts.componentName}'`)
                return null
            }
            
            // Return serialized state
            const finalState = this.serializeState(instance)
            console.log(`📤 Returning state for ${opts.componentName}[${opts.componentId}]:`, { 
                ...(finalState.count !== undefined && { count: finalState.count, step: finalState.step }),
                ...(finalState.currentTime !== undefined && { currentTime: finalState.currentTime, isRunning: finalState.isRunning })
            })
            return finalState
            
        } catch (error) {
            console.error(`❌ Error in ${opts.componentName}.${opts.methodName}:`, error)
            opts.ws.send(JSON.stringify({
                updates: [{
                    type: 'error',
                    componentId: opts.componentId,
                    error: error instanceof Error ? error.message : 'Unknown error'
                }]
            }))
            return null
        }
    }
    
    // Serialize state for client (exclude methods, ws, etc.)
    private static serializeState(instance: LiveAction): Record<string, any> {
        const state: Record<string, any> = { 
            $props: instance.$props,
            $ID: instance.$ID
        }
        
        for (const key in instance) {
            if (key !== 'ws' && 
                key !== '$props' && 
                !key.startsWith('_') && 
                typeof instance[key] !== 'function') {
                state[key] = instance[key]
            }
        }
        
        return state
    }
    
    // Helper para emitir eventos para o cliente
    protected emit(event: string, data?: any) {
        if (this.ws && this.ws.raw.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                updates: [{
                    type: 'event',
                    componentId: this.$ID,
                    event,
                    data
                }]
            }))
        }
    }
    
    // Helper para broadcast para todos os componentes do mesmo tipo
    protected broadcast(event: string, data?: any) {
        if (this.ws) {
            const topic = `component.${this.constructor.name.toLowerCase()}`
            this.ws.publish(topic, JSON.stringify({
                updates: [{
                    type: 'broadcast',
                    componentName: this.constructor.name,
                    event,
                    data
                }]
            }))
        }
    }
    
    // Lifecycle hooks (opcional - implementadas pelas classes filhas)
    mount?(props: any): void | Promise<void>
    unmount?(): void | Promise<void>
    
    // Authorization (opcional - implementada pelas classes filhas)
    authorize?(action: string, user?: any): boolean
}