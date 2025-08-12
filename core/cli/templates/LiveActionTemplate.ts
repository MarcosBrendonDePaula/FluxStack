/**
 * LiveAction Template
 * Template for generating new LiveAction components
 */

export const liveActionTemplate = (componentName: string, options: {
    hasProps?: boolean
    hasLifecycle?: boolean
    hasEvents?: boolean
    methods?: string[]
}) => {
    const className = `${componentName}Action`
    const propsInterface = options.hasProps ? `
interface ${componentName}Props {
    // Add your props here
    // example: title?: string
    // example: isVisible?: boolean
}` : ''

    const stateProperties = options.hasProps ? `
    // Add your state properties here
    // example: public title: string = ""
    // example: public isVisible: boolean = false` : `
    // Add your state properties here
    public exampleProperty: string = ""`

    const propsParam = options.hasProps ? `props: ${componentName}Props` : 'props: any'

    const initialState = options.hasProps ? `
        return {
            // Return initial state based on props
            // example: title: props.title || "Default Title"
            // example: isVisible: props.isVisible ?? true
            exampleProperty: "initial value"
        }` : `
        return {
            // Return initial state
            exampleProperty: "initial value"
        }`

    const lifecycleMethods = options.hasLifecycle ? `
    
    // Lifecycle: Called when component mounts
    mount() {
        console.log(\`🔌 \${this.constructor.name} component \${this.$ID} mounted\`)
        // Add mount logic here
    }
    
    // Lifecycle: Called when component unmounts  
    unmount() {
        console.log(\`🗑️  \${this.constructor.name} component \${this.$ID} unmounted\`)
        // Add cleanup logic here
    }` : ''

    const eventMethods = options.hasEvents ? `
    
    // Example: Emit event to client
    private notifyClient(eventName: string, data?: any) {
        this.emit(eventName, {
            componentId: this.$ID,
            timestamp: Date.now(),
            ...data
        })
    }
    
    // Example: Broadcast to all components of this type
    private broadcastToAll(eventName: string, data?: any) {
        this.broadcast(eventName, {
            componentName: this.constructor.name,
            timestamp: Date.now(),
            ...data
        })
    }` : ''

    const methodsCode = options.methods?.map(method => `
    // Action: ${method}
    ${method}() {
        // Add your logic here
        console.log(\`🎯 \${this.constructor.name}.${method}() called\`)
        
        // Example: Update state
        // this.exampleProperty = "new value"
        
        // Example: Emit event
        // this.emit('${method.toLowerCase()}-completed', { success: true })
        
        return { success: true, message: "${method} completed" }
    }`).join('') || `
    // Action: Example method
    exampleAction() {
        console.log(\`🎯 \${this.constructor.name}.exampleAction() called\`)
        
        // Update state
        this.exampleProperty = "action performed"
        
        // Emit event to client
        this.emit('action-completed', {
            componentId: this.$ID,
            newValue: this.exampleProperty,
            timestamp: Date.now()
        })
        
        return { success: true, message: "Action completed successfully" }
    }`

    return `import { LiveAction } from '@/core/live'
${propsInterface}

export class ${className} extends LiveAction {${stateProperties}
    
    // Estado inicial baseado em props
    getInitialState(${propsParam}) {${initialState}
    }${lifecycleMethods}${methodsCode}${eventMethods}
}

// Auto-register no sistema
LiveAction.add(${className})`
}

export const frontendComponentTemplate = (componentName: string, options: {
    hasProps?: boolean
    hasEvents?: boolean
    hasControls?: boolean
    methods?: string[]
}) => {
    const interfaceName = `${componentName}Props`
    const actionName = `${componentName}Action`

    const propsInterface = options.hasProps ? `
interface ${interfaceName} {
    // Add your props here
    // example: title?: string
    // example: isVisible?: boolean
    componentId?: string
    
    // Livewire-style event handlers
    ${options.hasEvents ? `onActionCompleted?: (data: { componentId: string, newValue: string, timestamp: number }) => void
    // Add more event handlers as needed` : '// Add event handlers here'}
}` : `
interface ${interfaceName} {
    componentId?: string
    
    // Livewire-style event handlers
    ${options.hasEvents ? `onActionCompleted?: (data: { componentId: string, newValue: string, timestamp: number }) => void` : '// Add event handlers here'}
}`

    const propsDestructure = options.hasProps ? `{
    // Add your props with defaults here
    // example: title = "Default Title",
    // example: isVisible = true,
    componentId,
    // Event handlers
    ${options.hasEvents ? 'onActionCompleted' : '// Event handlers here'}
}` : `{
    componentId,
    // Event handlers
    ${options.hasEvents ? 'onActionCompleted' : '// Event handlers here'}
}`

    const eventHandlers = options.hasEvents ? `eventHandlers: {
            onActionCompleted
            // Add more event handlers here
        }` : `eventHandlers: {
            // Add event handlers here
        }`

    const controls = options.hasControls ? `
            {/* Controls */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: '0.5rem',
                marginTop: '1rem'
            }}>
                <button
                    onClick={() => callMethod('exampleAction')}
                    disabled={loading}
                    style={{
                        padding: '0.75rem',
                        border: 'none',
                        borderRadius: '8px',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '0.9rem'
                    }}
                >
                    {loading ? '🔄 Loading...' : '🎯 Example Action'}
                </button>
                
                {/* Add more buttons here */}
            </div>` : ''

    const stateDisplay = `
            {/* State Display */}
            <div style={{
                background: '#f8fafc',
                padding: '1rem',
                borderRadius: '8px',
                marginTop: '1rem'
            }}>
                <h4 style={{ margin: '0 0 0.5rem 0' }}>📊 Component State:</h4>
                <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
                    <div><strong>Example Property:</strong> {state.exampleProperty || 'Not set'}</div>
                    {/* Add more state properties display here */}
                </div>
            </div>`

    return `import { useLive } from '@/hooks/useLive'
${propsInterface}

export function ${componentName}(${propsDestructure}: ${interfaceName}) {
    const { 
        state, 
        loading, 
        error, 
        connected, 
        callMethod,
        componentId: id
    } = useLive({
        name: '${actionName}',
        props: { /* Pass props here */ },
        componentId,
        ${eventHandlers}
    })

    return (
        <div style={{
            border: '2px solid #e5e7eb',
            borderRadius: '12px',
            padding: '1.5rem',
            margin: '1rem',
            background: '#ffffff',
            minWidth: '300px',
            maxWidth: '500px'
        }}>
            {/* Header */}
            <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem'
            }}>
                <h3 style={{ margin: 0 }}>${componentName}</h3>
                <div style={{ 
                    fontSize: '0.8rem',
                    color: connected ? '#10b981' : '#ef4444',
                    fontWeight: 'bold'
                }}>
                    {connected ? '🟢 Live' : '🔴 Offline'}
                </div>
            </div>

            ${stateDisplay}${controls}

            {/* Error Display */}
            {error && (
                <div style={{
                    marginTop: '1rem',
                    padding: '0.75rem',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '8px',
                    color: '#991b1b',
                    fontSize: '0.875rem'
                }}>
                    ❌ {error}
                </div>
            )}

            {/* Debug Info */}
            <div style={{ 
                fontSize: '0.75rem',
                opacity: 0.7,
                textAlign: 'center',
                marginTop: '1rem',
                padding: '0.5rem',
                background: '#f9fafb',
                borderRadius: '6px'
            }}>
                ID: {id}
            </div>
        </div>
    )
}`
}