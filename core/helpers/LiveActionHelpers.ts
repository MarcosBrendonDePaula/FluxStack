/**
 * LiveAction Helper Functions
 * IntelliSense-friendly utilities for easier LiveAction development
 */

import { LiveAction } from '@/core/live'
import { generateShortUUID } from '../utils/uuid'

// Type-safe method caller
export function createTypedAction<TProps = any, TState = any>() {
    return {
        // Helper to define initial state with type safety
        defineState: <S extends Record<string, any>>(
            stateFactory: (props: TProps) => S
        ): ((props: TProps) => S) => {
            return stateFactory
        },

        // Helper to define action methods with type safety
        defineAction: <TArgs extends any[] = [], TReturn = any>(
            action: (this: LiveAction & TState, ...args: TArgs) => TReturn
        ) => {
            return action
        },

        // Helper to emit typed events
        defineEvent: <TEventData = any>(eventName: string) => {
            return {
                emit: (instance: LiveAction, data: TEventData) => {
                    instance.emit(eventName, data)
                },
                broadcast: (instance: LiveAction, data: TEventData) => {
                    instance.broadcast(eventName, data)
                }
            }
        }
    }
}

// Property descriptor helpers for better IntelliSense
export const StateProperty = {
    string: (defaultValue = '') => ({
        default: defaultValue,
        type: 'string' as const,
        validate: (value: any): value is string => typeof value === 'string'
    }),
    
    number: (defaultValue = 0) => ({
        default: defaultValue,
        type: 'number' as const,
        validate: (value: any): value is number => typeof value === 'number' && !isNaN(value)
    }),
    
    boolean: (defaultValue = false) => ({
        default: defaultValue,
        type: 'boolean' as const,
        validate: (value: any): value is boolean => typeof value === 'boolean'
    }),
    
    array: <T = any>(defaultValue: T[] = []) => ({
        default: defaultValue,
        type: 'array' as const,
        validate: (value: any): value is T[] => Array.isArray(value)
    }),
    
    object: <T = Record<string, any>>(defaultValue: T = {} as T) => ({
        default: defaultValue,
        type: 'object' as const,
        validate: (value: any): value is T => typeof value === 'object' && value !== null && !Array.isArray(value)
    })
}

// Event name constants for IntelliSense
export const CommonEvents = {
    // Lifecycle events
    COMPONENT_MOUNTED: 'component:mounted',
    COMPONENT_UNMOUNTED: 'component:unmounted',
    COMPONENT_UPDATED: 'component:updated',
    
    // Action events  
    ACTION_STARTED: 'action:started',
    ACTION_COMPLETED: 'action:completed',
    ACTION_FAILED: 'action:failed',
    
    // State events
    STATE_CHANGED: 'state:changed',
    PROPERTY_UPDATED: 'property:updated',
    
    // User events
    USER_INTERACTION: 'user:interaction',
    FORM_SUBMITTED: 'form:submitted',
    VALIDATION_FAILED: 'validation:failed',
    
    // System events
    ERROR_OCCURRED: 'error:occurred',
    WARNING_ISSUED: 'warning:issued',
    DEBUG_INFO: 'debug:info'
} as const

// Utility functions
export const LiveActionUtils = {
    // Generate unique component ID
    generateId: (prefix = 'component') => {
        return `${prefix}-${generateShortUUID()}`
    },

    // Validate component state
    validateState: <T extends Record<string, any>>(
        state: T, 
        schema: Record<keyof T, (value: any) => boolean>
    ) => {
        const errors: string[] = []
        
        for (const [key, validator] of Object.entries(schema)) {
            if (!validator(state[key])) {
                errors.push(`Invalid value for property '${key}'`)
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors
        }
    },

    // Deep clone state object
    cloneState: <T>(state: T): T => {
        if (state === null || typeof state !== 'object') return state
        if (state instanceof Date) return new Date(state.getTime()) as unknown as T
        if (Array.isArray(state)) return state.map(item => LiveActionUtils.cloneState(item)) as unknown as T
        
        const cloned = {} as T
        for (const key in state) {
            if (state.hasOwnProperty(key)) {
                cloned[key] = LiveActionUtils.cloneState(state[key])
            }
        }
        return cloned
    },

    // Debounce utility for actions
    debounce: <T extends (...args: any[]) => any>(
        func: T, 
        wait: number
    ): ((...args: Parameters<T>) => void) => {
        let timeout: NodeJS.Timeout | null = null
        
        return (...args: Parameters<T>) => {
            if (timeout) clearTimeout(timeout)
            timeout = setTimeout(() => func(...args), wait)
        }
    },

    // Throttle utility for actions
    throttle: <T extends (...args: any[]) => any>(
        func: T, 
        limit: number
    ): ((...args: Parameters<T>) => void) => {
        let inThrottle: boolean = false
        
        return (...args: Parameters<T>) => {
            if (!inThrottle) {
                func(...args)
                inThrottle = true
                setTimeout(() => inThrottle = false, limit)
            }
        }
    },

    // Format error messages
    formatError: (error: Error | string) => {
        if (typeof error === 'string') return error
        return `${error.name}: ${error.message}`
    },

    // Log component activity with styling
    logActivity: (component: string, action: string, data?: any) => {
        const timestamp = new Date().toISOString().split('T')[1].split('.')[0]
        const prefix = `[${timestamp}] 🔥 ${component}`
        
        if (data) {
            console.log(`${prefix} → ${action}:`, data)
        } else {
            console.log(`${prefix} → ${action}`)
        }
    }
}

// Class builder helper for fluent API
export class LiveActionBuilder<TProps = any, TState = any> {
    private _className: string
    private _props: TProps = {} as TProps
    private _initialState: (props: TProps) => TState = () => ({} as TState)
    private _actions: Record<string, Function> = {}
    private _lifecycle: Partial<{
        mount: Function
        unmount: Function
        update: Function
    }> = {}

    constructor(className: string) {
        this._className = className
    }

    // Define props interface
    withProps<P = any>(): LiveActionBuilder<P, TState> {
        return this as any
    }

    // Define initial state
    withInitialState<S = any>(stateFactory: (props: TProps) => S): LiveActionBuilder<TProps, S> {
        this._initialState = stateFactory as any
        return this as any
    }

    // Add action method
    withAction<TArgs extends any[] = [], TReturn = any>(
        name: string,
        action: (this: LiveAction & TState, ...args: TArgs) => TReturn
    ) {
        this._actions[name] = action
        return this
    }

    // Add lifecycle method
    withLifecycle(
        phase: 'mount' | 'unmount' | 'update',
        handler: (this: LiveAction & TState) => void
    ) {
        this._lifecycle[phase] = handler
        return this
    }

    // Build the class
    build(): new () => LiveAction {
        const className = this._className
        const initialState = this._initialState
        const actions = this._actions
        const lifecycle = this._lifecycle

        class GeneratedLiveAction extends LiveAction {
            getInitialState(props: TProps) {
                return initialState(props)
            }

            mount() {
                if (lifecycle.mount) {
                    lifecycle.mount.call(this)
                }
            }

            unmount() {
                if (lifecycle.unmount) {
                    lifecycle.unmount.call(this)
                }
            }
        }

        // Add action methods
        Object.entries(actions).forEach(([name, action]) => {
            (GeneratedLiveAction.prototype as any)[name] = action
        })

        // Set class name for debugging
        Object.defineProperty(GeneratedLiveAction, 'name', { value: className })

        return GeneratedLiveAction as any
    }
}

// Factory function for the builder
export const createLiveAction = (className: string) => {
    return new LiveActionBuilder(className)
}

// Type definitions for better IntelliSense
export interface LiveActionConfig<TProps = any, TState = any> {
    name: string
    props?: TProps
    initialState: (props: TProps) => TState
    actions: Record<string, Function>
    lifecycle?: {
        mount?: Function
        unmount?: Function
        update?: Function
    }
    events?: Record<string, string>
}

// Create typed LiveAction from config
export function createTypedLiveAction<TProps = any, TState = any>(
    config: LiveActionConfig<TProps, TState>
) {
    return createLiveAction(config.name)
        .withProps<TProps>()
        .withInitialState(config.initialState)
}