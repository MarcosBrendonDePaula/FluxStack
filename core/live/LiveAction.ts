import type { ElysiaWS } from 'elysia/ws'
import { hydrationManager } from './HydrationManager'

export type LiveActionRequest = {
    componentId: string
    componentName: string
    clientState: Record<string, any>
    methodName: string
    params: any[]
    ws: ElysiaWS
    // Hydration support
    fingerprint?: string
    hydrationAttempt?: boolean
}

export abstract class LiveAction {
    private static registry = new Map<string, typeof LiveAction>()
    private static clientStateRegistry = new Map<string, (props: any) => Record<string, any>>()
    private static instanceRegistry = new Map<string, LiveAction>()
    
    public $ID!: string
    public ws!: ElysiaWS
    public $props: Record<string, any> = {}
    
    // Estado inicial baseado em props
    abstract getInitialState(props: any): Record<string, any>
    
    // Registry system - auto-registro de componentes
    public static add(actionClass: typeof LiveAction) {
        const componentName = actionClass.name.toLowerCase()
        this.registry.set(componentName, actionClass)
        
        // Registrar função de estado inicial do cliente
        // Cria uma instância temporária para obter o estado inicial
        try {
            // @ts-expect-error - Constructor instantiation
            const tempInstance: LiveAction = new actionClass()
            const getClientInitialState = (props: any) => {
                return tempInstance.getInitialState(props || {})
            }
            this.clientStateRegistry.set(componentName, getClientInitialState)
            console.log(`🔌 Live component registered: ${componentName} (with client state)`)
        } catch (error) {
            console.warn(`⚠️  Could not register client state for ${componentName}:`, error)
            this.clientStateRegistry.set(componentName, () => ({}))
            console.log(`🔌 Live component registered: ${componentName} (fallback state)`)
        }
    }
    
    public static get(name: string): typeof LiveAction | undefined {
        return this.registry.get(name.toLowerCase())
    }
    
    // Obter estado inicial para o cliente (frontend)
    public static getClientInitialState(componentName: string, props: any): Record<string, any> {
        const normalizedName = componentName.toLowerCase().replace('action', '')
        const stateFunction = this.clientStateRegistry.get(`${normalizedName}action`)
        
        if (stateFunction) {
            return stateFunction(props)
        }
        
        // Fallback: tentar buscar diretamente pelo nome
        const directStateFunction = this.clientStateRegistry.get(normalizedName)
        if (directStateFunction) {
            return directStateFunction(props)
        }
        
        console.warn(`⚠️  No client state registered for component: ${componentName}`)
        return {}
    }
    
    // Clean up persistent instance (when component unmounts)
    public static destroyInstance(componentId: string) {
        const instance = this.instanceRegistry.get(componentId)
        if (instance) {
            // Call unmount lifecycle if available
            if (typeof instance.unmount === 'function') {
                instance.unmount()
            }
            
            this.instanceRegistry.delete(componentId)
            console.log(`🗑️  Destroyed persistent instance for ${componentId}`)
        }
        
        // Also remove from hydration manager
        hydrationManager.removeSession(componentId)
    }
    
    // Create hydration snapshot
    public static createHydrationSnapshot(
        componentId: string,
        componentName: string,
        state: Record<string, any>,
        props: Record<string, any>
    ): string {
        return hydrationManager.storeSnapshot(componentId, componentName, state, props)
    }
    
    // Attempt hydration recovery
    public static attemptHydration(
        componentId: string,
        componentName: string,
        clientFingerprint?: string,
        clientState?: Record<string, any>
    ): { success: boolean; instance?: LiveAction; reason?: string } {
        // Try to hydrate from stored snapshot
        const hydrationResult = hydrationManager.attemptHydration(componentId, clientFingerprint || '', clientState)
        
        if (!hydrationResult.success) {
            console.log(`⚠️  Hydration failed for ${componentId}: ${hydrationResult.reason}`)
            return { success: false, reason: hydrationResult.reason }
        }
        
        // Create new instance with hydrated state
        const ActionClass = this.get(componentName)
        if (!ActionClass) {
            return { success: false, reason: 'component_not_found' }
        }
        
        try {
            // @ts-expect-error - Constructor instantiation
            const instance: LiveAction = new ActionClass()
            instance.$ID = componentId
            
            // Hydrate with recovered state
            this.hydrate(instance, hydrationResult.state!, {})
            
            // Store in registry
            this.instanceRegistry.set(componentId, instance)
            
            console.log(`✨ Successfully hydrated instance for ${componentId}`)
            return { success: true, instance }
            
        } catch (error) {
            console.error(`❌ Error creating hydrated instance for ${componentId}:`, error)
            return { success: false, reason: 'hydration_error' }
        }
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
            // ✨ Use persistent instance, attempt hydration, or create new one
            let instance = this.instanceRegistry.get(opts.componentId)
            let isNewInstance = false
            let isHydrated = false
            
            if (!instance) {
                // Try hydration first if fingerprint provided
                if (opts.fingerprint && opts.hydrationAttempt) {
                    const hydrationResult = this.attemptHydration(
                        opts.componentId,
                        opts.componentName,
                        opts.fingerprint,
                        opts.clientState
                    )
                    
                    if (hydrationResult.success && hydrationResult.instance) {
                        instance = hydrationResult.instance
                        isHydrated = true
                        console.log(`🔄 Hydrated instance for ${opts.componentId}`)
                    }
                }
                
                // Create new instance if hydration failed
                if (!instance) {
                    // @ts-expect-error - Constructor instantiation
                    instance = new ActionClass()
                    instance.ws = opts.ws
                    instance.$ID = opts.componentId
                    
                    // Merge initial state (with props) + client state
                    const initialState = instance.getInitialState(opts.clientState.$props || {})
                    const fullState = { ...initialState, ...opts.clientState }
                    
                    this.hydrate(instance, fullState, opts.clientState.$props)
                    
                    // Store persistent instance
                    this.instanceRegistry.set(opts.componentId, instance)
                    isNewInstance = true
                    console.log(`🏗️  Created persistent instance for ${opts.componentId}`)
                }
            } else {
                // Update existing instance with latest WebSocket and props
                instance.ws = opts.ws
                instance.$props = opts.clientState.$props || {}
                
                // Only update state from client if it's different (avoid overwriting server state)
                if (!isHydrated) {
                    this.hydrate(instance, opts.clientState, opts.clientState.$props)
                }
                console.log(`🔄 Reusing persistent instance for ${opts.componentId}`)
            }
            
            // Update WebSocket reference (always needed)
            instance.ws = opts.ws
            
            // Call requested method
            const method = instance[opts.methodName]
            if (typeof method === 'function') {
                try {
                    const result = method.apply(instance, opts.params)
                    
                    // Handle promises (async functions)
                    if (result instanceof Promise) {
                        result
                            .then((asyncResult) => {
                                // Send updated state + async result back to client
                                const newState = this.serializeState(instance)
                                console.log(`✅ Async function ${opts.methodName} completed for ${instance.$ID}`)
                                instance.ws.send(JSON.stringify({
                                    updates: [{
                                        type: 'function_result',
                                        id: instance.$ID,
                                        methodName: opts.methodName,
                                        result: asyncResult,
                                        state: newState,
                                        isAsync: true,
                                        error: null
                                    }]
                                }))
                            })
                            .catch((error) => {
                                console.error(`❌ Async error in ${opts.componentName}.${opts.methodName}:`, error)
                                const currentState = this.serializeState(instance)
                                instance.ws.send(JSON.stringify({
                                    updates: [{
                                        type: 'function_error',
                                        id: instance.$ID,
                                        methodName: opts.methodName,
                                        error: error.message || 'Unknown async error',
                                        state: {
                                            ...currentState,
                                            __functionResult: {
                                                methodName: opts.methodName,
                                                isAsync: true,
                                                isLoading: false,
                                                result: null,
                                                error: error.message || 'Unknown async error'
                                            }
                                        },
                                        isAsync: true
                                    }]
                                }))
                            })
                        
                        // Return current state + loading indicator for async
                        const currentState = this.serializeState(instance)
                        return {
                            ...currentState,
                            __functionResult: {
                                methodName: opts.methodName,
                                isAsync: true,
                                isLoading: true,
                                result: null,
                                error: null
                            }
                        }
                    }
                    
                    // Handle synchronous functions with return values
                    const currentState = this.serializeState(instance)
                    return {
                        ...currentState,
                        __functionResult: {
                            methodName: opts.methodName,
                            isAsync: false,
                            isLoading: false,
                            result: result,
                            error: null
                        }
                    }
                    
                } catch (error) {
                    // Handle synchronous function errors
                    console.error(`❌ Sync error in ${opts.componentName}.${opts.methodName}:`, error)
                    const currentState = this.serializeState(instance)
                    return {
                        ...currentState,
                        __functionResult: {
                            methodName: opts.methodName,
                            isAsync: false,
                            isLoading: false,
                            result: null,
                            error: error instanceof Error ? error.message : 'Unknown sync error'
                        }
                    }
                }
            } else {
                console.warn(`⚠️  Method '${opts.methodName}' not found on '${opts.componentName}'`)
                return null
            }
            
            // Return serialized state
            const finalState = this.serializeState(instance)
            
            // 💾 Create hydration snapshot after successful operation
            const fingerprint = this.createHydrationSnapshot(
                opts.componentId,
                opts.componentName,
                finalState,
                opts.clientState.$props || {}
            )
            
            // Add fingerprint to state for client storage
            finalState.__fingerprint = fingerprint
            
            console.log(`📤 Returning state for ${opts.componentName}[${opts.componentId}]:`, { 
                ...(finalState.count !== undefined && { count: finalState.count, step: finalState.step }),
                ...(finalState.currentTime !== undefined && { currentTime: finalState.currentTime, isRunning: finalState.isRunning }),
                fingerprint: fingerprint.substring(0, 8) + '...'
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