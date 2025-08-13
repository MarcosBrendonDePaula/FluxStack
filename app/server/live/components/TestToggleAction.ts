import { LiveAction, SimpleAction, SimpleLifecycle, SimpleValidate, Validators, ValidationMessages } from '@/core'

export class TestToggleAction extends LiveAction {

    public isEnabled: boolean = false

    public label: string = 'Toggle'

    getInitialState(props: any) {
        return {
            isEnabled: props.isEnabled || false,
            label: props.label || 'Toggle'
        }
    }

    @SimpleLifecycle('mount')
    mount() {
        console.log(`🔌 ${this.constructor.name} component ${this.$ID} mounted`)
        // Initialize component state
        // Setup event listeners
        // Load initial data
    }

    @SimpleAction('Toggle state')
    toggle() {
        console.log(`🎯 ${this.constructor.name}.toggle() called`)
        
        // Update state
        this.isEnabled = !this.isEnabled
        
        // Emit events
        this.emit('toggled', { componentId: this.$ID, timestamp: Date.now() })
        
        return { success: true, message: "toggle completed successfully" }
    }

    @SimpleAction('Enable toggle')
    enable() {
        console.log(`🎯 ${this.constructor.name}.enable() called`)
        
        // Update state
        // Add your state updates here
        
        // Emit events
        this.emit('enabled', { componentId: this.$ID, timestamp: Date.now() })
        
        return { success: true, message: "enable completed successfully" }
    }

    @SimpleAction('Disable toggle')
    disable() {
        console.log(`🎯 ${this.constructor.name}.disable() called`)
        
        // Update state
        // Add your state updates here
        
        // Emit events
        this.emit('disabled', { componentId: this.$ID, timestamp: Date.now() })
        
        return { success: true, message: "disable completed successfully" }
    }
}

// Auto-register the component
LiveAction.add(TestToggleAction)