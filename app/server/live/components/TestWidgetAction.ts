import { LiveAction } from '@/core/live'

interface TestWidgetProps {
    // Add your props here
    // example: title?: string
    // example: isVisible?: boolean
}

export class TestWidgetAction extends LiveAction {
    // Add your state properties here
    // example: public title: string = ""
    // example: public isVisible: boolean = false
    
    // Estado inicial baseado em props
    getInitialState(props: TestWidgetProps) {
        return {
            // Return initial state based on props
            // example: title: props.title || "Default Title"
            // example: isVisible: props.isVisible ?? true
            exampleProperty: "initial value"
        }
    }
    // Action: loadData
    loadData() {
        // Add your logic here
        console.log(`🎯 ${this.constructor.name}.${method}() called`)
        
        // Example: Update state
        // this.exampleProperty = "new value"
        
        // Example: Emit event
        // this.emit('loaddata-completed', { success: true })
        
        return { success: true, message: "loadData completed" }
    }
}

// Auto-register no sistema
LiveAction.add(TestWidgetAction)