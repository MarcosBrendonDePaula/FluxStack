/**
 * CounterAction
 * 
 * Exemplo de Live Action para o backend que funciona com o LiveCounter frontend
 */

interface CounterState {
  count: number
  lastUpdate: number
  userId: string
}

interface CounterProps {
  initialCount?: number
  userId: string
}

export class CounterAction {
  private state: CounterState
  private props: CounterProps
  
  constructor(props: CounterProps) {
    this.props = props
    this.state = {
      count: props.initialCount || 0,
      lastUpdate: Date.now(),
      userId: props.userId
    }
  }

  // Getter para o estado atual
  getState(): CounterState {
    return { ...this.state }
  }

  // Métodos que podem ser chamados do frontend
  async increment(): Promise<CounterState> {
    this.state.count += 1
    this.state.lastUpdate = Date.now()
    
    // Simular algum processamento assíncrono
    await new Promise(resolve => setTimeout(resolve, 100))
    
    console.log(`[CounterAction] User ${this.state.userId} incremented to ${this.state.count}`)
    
    return this.getState()
  }

  async decrement(): Promise<CounterState> {
    this.state.count -= 1
    this.state.lastUpdate = Date.now()
    
    await new Promise(resolve => setTimeout(resolve, 100))
    
    console.log(`[CounterAction] User ${this.state.userId} decremented to ${this.state.count}`)
    
    return this.getState()
  }

  async reset(): Promise<CounterState> {
    this.state.count = this.props.initialCount || 0
    this.state.lastUpdate = Date.now()
    
    await new Promise(resolve => setTimeout(resolve, 100))
    
    console.log(`[CounterAction] User ${this.state.userId} reset counter`)
    
    return this.getState()
  }

  async setCount(value: number): Promise<CounterState> {
    if (typeof value !== 'number' || isNaN(value)) {
      throw new Error('Value must be a valid number')
    }
    
    this.state.count = value
    this.state.lastUpdate = Date.now()
    
    await new Promise(resolve => setTimeout(resolve, 100))
    
    console.log(`[CounterAction] User ${this.state.userId} set count to ${this.state.count}`)
    
    return this.getState()
  }

  // Método para atualizar props
  updateProps(newProps: Partial<CounterProps>): void {
    this.props = { ...this.props, ...newProps }
  }

  // Método de cleanup quando o componente é desmontado
  async cleanup(): Promise<void> {
    console.log(`[CounterAction] Cleanup for user ${this.state.userId}`)
  }

  // Método para serializar o estado para persistência
  serialize(): any {
    return {
      state: this.state,
      props: this.props
    }
  }

  // Método para restaurar de estado serializado
  static deserialize(data: any): CounterAction {
    const action = new CounterAction(data.props)
    action.state = data.state
    return action
  }
}