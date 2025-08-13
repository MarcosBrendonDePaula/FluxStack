import { LiveAction, SimpleAction, SimpleLifecycle, SimpleValidate, Validators, ValidationMessages } from '@/core'

export class TestCounterFixedAction extends LiveAction {

    public count: number = 0

    public step: number = 1

    getInitialState(props: any) {
        return {
            count: props.count || 0,
            step: props.step || 1
        }
    }

    @SimpleLifecycle('mount')
    mount() {
        console.log(`🔌 ${this.constructor.name} component ${this.$ID} mounted`)
        // Initialize component state
        // Setup event listeners
        // Load initial data
    }

    @SimpleAction('Increment counter')
    increment() {
        console.log(`🎯 ${this.constructor.name}.increment() called`)
        
        // Update state
        this.count = this.count + this.step
        
        // Emit events
        this.emit('count-changed', { componentId: this.$ID, timestamp: Date.now() })
        
        return { success: true, message: "increment completed successfully" }
    }

    @SimpleAction('Decrement counter')
    decrement() {
        console.log(`🎯 ${this.constructor.name}.decrement() called`)
        
        // Update state
        this.count = this.count - this.step
        
        // Emit events
        this.emit('count-changed', { componentId: this.$ID, timestamp: Date.now() })
        
        return { success: true, message: "decrement completed successfully" }
    }

    @SimpleAction('Reset counter')
    reset() {
        console.log(`🎯 ${this.constructor.name}.reset() called`)
        
        // Update state
        this.count = 0
        
        // Emit events
        this.emit('count-reset', { componentId: this.$ID, timestamp: Date.now() })
        
        return { success: true, message: "reset completed successfully" }
    }
}

// Auto-register the component
LiveAction.add(TestCounterFixedAction)