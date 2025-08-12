/**
 * Exemplo prático de como usar os novos helpers para facilitar definição de classes
 * Este é um exemplo demonstrando todas as funcionalidades criadas
 */

import { LiveAction, SimpleAction, SimpleLifecycle, SimpleValidate, Validators, ValidationMessages } from '@/core'

// Interface tipada para props
interface ExampleEnhancedProps {
    title?: string
    maxItems?: number
    isEnabled?: boolean
}

// Estado tipado
interface ExampleEnhancedState {
    title: string
    items: string[]
    counter: number
    isEnabled: boolean
    lastAction: string
}

// Exemplo de classe usando helpers simples (sem problemas de tipos)
export class ExampleEnhancedAction extends LiveAction {
    // Propriedades de estado
    title: string = 'Exemplo Enhanced'
    items: string[] = []
    counter: number = 0
    isEnabled: boolean = true
    lastAction: string = ''

    // Estado inicial tipado
    getInitialState(props: ExampleEnhancedProps): ExampleEnhancedState {
        return {
            title: props.title || this.title,
            items: [],
            counter: 0,
            isEnabled: props.isEnabled ?? true,
            lastAction: 'initialized'
        }
    }

    // Lifecycle com decorator simples
    @SimpleLifecycle('mount')
    mount() {
        this.lastAction = 'mounted'
    }

    @SimpleLifecycle('unmount')
    unmount() {
        this.lastAction = 'unmounted'
    }

    // Ação com validação simples
    @SimpleAction('Adicionar item à lista com validação')
    @SimpleValidate(
        Validators.safeString(2, 50),
        ValidationMessages.safeString(2, 50)
    )
    addItem(item: string) {
        // Validação já aplicada automaticamente pelos decorators
        this.items.push(item)
        this.counter++
        this.lastAction = `addItem: ${item}`
        
        // Emitir eventos manualmente
        this.emit('item-added', { 
            item, 
            totalItems: this.items.length,
            counter: this.counter
        })
        
        return { 
            success: true, 
            item, 
            totalItems: this.items.length,
            counter: this.counter
        }
    }

    // Ação com validação condicional
    @SimpleAction('Remover item (apenas se habilitado)')
    removeItem(index: number) {
        if (!this.isEnabled) {
            throw new Error('Ação desabilitada')
        }

        if (index < 0 || index >= this.items.length) {
            throw new Error('Índice inválido')
        }

        const removedItem = this.items.splice(index, 1)[0]
        this.counter++
        this.lastAction = `removeItem: ${removedItem}`

        this.emit('item-removed', { removedItem, totalItems: this.items.length })

        return { 
            success: true, 
            removedItem, 
            totalItems: this.items.length 
        }
    }

    // Ação que emite evento customizado
    @SimpleAction('Limpar todos os itens')
    clearAll() {
        const clearedCount = this.items.length
        this.items = []
        this.counter++
        this.lastAction = 'clearAll'

        this.broadcast('all-items-cleared', { clearedCount, message: `${clearedCount} itens removidos` })

        return { 
            success: true, 
            clearedCount, 
            message: `${clearedCount} itens removidos` 
        }
    }

    // Ação com validações múltiplas
    @SimpleAction('Atualizar título com validação avançada')
    @SimpleValidate(
        Validators.safeString(3, 100),
        ValidationMessages.safeString(3, 100)
    )
    updateTitle(newTitle: string) {
        this.title = newTitle
        this.counter++
        this.lastAction = `updateTitle: ${newTitle}`

        this.emit('title-updated', { title: this.title })

        return { 
            success: true, 
            title: this.title,
            message: 'Título atualizado com sucesso'
        }
    }

    // Ação para alternar estado
    @SimpleAction('Alternar estado habilitado/desabilitado')
    toggle() {
        this.isEnabled = !this.isEnabled
        this.counter++
        this.lastAction = `toggle: ${this.isEnabled ? 'enabled' : 'disabled'}`

        this.emit('state-toggled', { isEnabled: this.isEnabled, status: this.isEnabled ? 'Habilitado' : 'Desabilitado' })

        return { 
            success: true, 
            isEnabled: this.isEnabled,
            status: this.isEnabled ? 'Habilitado' : 'Desabilitado'
        }
    }

    // Método privado para notificação (helper)
    private notifyChange(action: string, data: any = {}) {
        this.emit('component-changed', {
            componentId: this.$ID,
            action,
            timestamp: Date.now(),
            state: {
                title: this.title,
                itemCount: this.items.length,
                counter: this.counter,
                isEnabled: this.isEnabled,
                lastAction: this.lastAction
            },
            ...data
        })
    }

    // Ação que demonstra uso do helper privado
    @SimpleAction('Resetar componente para estado inicial')
    reset() {
        this.title = 'Exemplo Enhanced'
        this.items = []
        this.counter = 0
        this.isEnabled = true
        this.lastAction = 'reset'

        this.notifyChange('reset', { 
            message: 'Componente resetado para estado inicial' 
        })

        return { 
            success: true, 
            message: 'Reset realizado com sucesso',
            state: {
                title: this.title,
                itemsCount: this.items.length,
                counter: this.counter,
                isEnabled: this.isEnabled
            }
        }
    }

    // Método para obter estatísticas (demonstra getters)
    @SimpleAction('Obter estatísticas do componente')
    getStats() {
        return {
            success: true,
            stats: {
                title: this.title,
                totalItems: this.items.length,
                items: [...this.items], // Cópia para evitar mutação
                totalActions: this.counter,
                isEnabled: this.isEnabled,
                lastAction: this.lastAction,
                uptime: Date.now() - (this as any).createdAt || 0
            }
        }
    }
}

// Registro manual (simples e funcional)
LiveAction.add(ExampleEnhancedAction)