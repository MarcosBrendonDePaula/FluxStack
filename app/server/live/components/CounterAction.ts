import { LiveAction } from '@/core/live'

export class CounterAction extends LiveAction {
    public count = 0
    public step = 1
    public label = "Counter"
    public maxCount = 100
    public minCount = 0
    
    // Estado inicial baseado em props
    getInitialState(props: any) {
        return {
            count: props.initialCount || 0,
            step: props.step || 1,
            label: props.label || "Counter",
            maxCount: props.maxCount || 100,
            minCount: props.minCount || 0
        }
    }
    
    // Action: Incrementar
    increment() {
        if (this.count + this.step <= this.maxCount) {
            this.count += this.step
            this.emit('count-changed', { 
                count: this.count, 
                componentId: this.$ID,
                action: 'increment'
            })
        } else {
            this.emit('limit-reached', { 
                limit: this.maxCount,
                type: 'max',
                componentId: this.$ID
            })
        }
    }
    
    // Action: Decrementar  
    decrement() {
        if (this.count - this.step >= this.minCount) {
            this.count -= this.step
            this.emit('count-changed', { 
                count: this.count,
                componentId: this.$ID,
                action: 'decrement'
            })
        } else {
            this.emit('limit-reached', { 
                limit: this.minCount,
                type: 'min',
                componentId: this.$ID
            })
        }
    }
    
    // Action: Definir step
    setStep(newStep: number) {
        if (newStep > 0) {
            this.step = newStep
            this.emit('step-changed', { 
                step: this.step,
                componentId: this.$ID
            })
        }
    }
    
    // Action: Resetar
    reset() {
        this.count = this.$props.initialCount || 0
        this.emit('counter-reset', { 
            count: this.count,
            componentId: this.$ID
        })
    }
    
    // Action: Definir valor direto
    setValue(newValue: number) {
        if (newValue >= this.minCount && newValue <= this.maxCount) {
            this.count = newValue
            this.emit('value-set', { 
                count: this.count,
                componentId: this.$ID
            })
        } else {
            this.emit('invalid-value', { 
                attempted: newValue,
                min: this.minCount,
                max: this.maxCount,
                componentId: this.$ID
            })
        }
    }
    
    // Action: Incrementar múltiplo
    incrementBy(amount: number) {
        const newValue = this.count + amount
        if (newValue <= this.maxCount) {
            this.count = newValue
            this.emit('count-changed', { 
                count: this.count,
                componentId: this.$ID,
                action: 'incrementBy',
                amount
            })
        } else {
            this.emit('limit-reached', { 
                limit: this.maxCount,
                type: 'max',
                attempted: newValue,
                componentId: this.$ID
            })
        }
    }
    
    // Computed property (getter) - sincronizado automaticamente
    get isAtMax() {
        return this.count >= this.maxCount
    }
    
    get isAtMin() {
        return this.count <= this.minCount
    }
    
    get percentage() {
        return ((this.count - this.minCount) / (this.maxCount - this.minCount)) * 100
    }
}

// Auto-register no sistema
LiveAction.add(CounterAction)