// Client-side Live Action utilities
// Permite acesso aos estados iniciais registrados pelos componentes

class LiveActionClientRegistry {
    private static clientStateRegistry = new Map<string, (props: any) => Record<string, any>>()
    
    // Registrar estado inicial do cliente (usado pelo frontend)
    public static registerClientState(componentName: string, stateFunction: (props: any) => Record<string, any>) {
        const normalizedName = componentName.toLowerCase()
        this.clientStateRegistry.set(normalizedName, stateFunction)
        console.log(`🔌 Client state registered: ${normalizedName}`)
    }
    
    // Obter estado inicial para o cliente
    public static getClientInitialState(componentName: string, props: any): Record<string, any> {
        const normalizedName = componentName.toLowerCase().replace('action', '')
        
        // Tentar com 'action' no final
        let stateFunction = this.clientStateRegistry.get(`${normalizedName}action`)
        
        // Fallback: tentar sem 'action'
        if (!stateFunction) {
            stateFunction = this.clientStateRegistry.get(normalizedName)
        }
        
        if (stateFunction) {
            return stateFunction(props)
        }
        
        console.warn(`⚠️  No client state registered for component: ${componentName}`)
        return {}
    }
    
    // Listar componentes registrados (para debug)
    public static listRegisteredComponents(): string[] {
        return Array.from(this.clientStateRegistry.keys())
    }
    
    // Limpar registro (para testes)
    public static clear() {
        this.clientStateRegistry.clear()
    }
}

export { LiveActionClientRegistry }