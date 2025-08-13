import { LiveAction } from '@/core/live'


export class UserListAction extends LiveAction {
    // Add your state properties here
    public exampleProperty: string = ""
    
    // Estado inicial baseado em props
    getInitialState(props: any) {
        return {
            // Return initial state
            exampleProperty: "initial value"
        }
    }
    // Action: Example method
    exampleAction() {
        console.log(`🎯 ${this.constructor.name}.exampleAction() called`)
        
        // Update state
        this.exampleProperty = "action performed"
        
        // Emit event to client
        this.emit('action-completed', {
            componentId: this.$ID,
            newValue: this.exampleProperty,
            timestamp: Date.now()
        })
        
        return { success: true, message: "Action completed successfully" }
    }
}

// Auto-register no sistema
LiveAction.add(UserListAction)