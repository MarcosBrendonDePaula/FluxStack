import { LiveAction, SimpleAction, SimpleLifecycle, SimpleValidate, Validators, ValidationMessages } from '@/core'

interface MenuItem {
    id: string
    title: string
    icon?: string
    content?: string
    children?: MenuItem[]
    isExpanded?: boolean
    isActive?: boolean
    level?: number
}

interface MenuProps {
    items?: MenuItem[]
    allowMultipleExpanded?: boolean
    defaultExpandedIds?: string[]
    theme?: 'light' | 'dark'
}

export class MenuAction extends LiveAction {
    items: MenuItem[] = []
    originalItems: MenuItem[] = [] // Store clean original items
    allowMultipleExpanded: boolean = false
    expandedItems: string[] = [] // Use array instead of Set for better serialization
    activeItem: string | null = null
    theme: 'light' | 'dark' = 'light'

    async getInitialState(props: MenuProps) {
        // Menu data declarado diretamente no backend do LiveComponent
        const menuData = this.getMenuData()
        
        this.originalItems = menuData
        this.items = this.processMenuItems(menuData)
        this.allowMultipleExpanded = props.allowMultipleExpanded || false
        this.theme = props.theme || 'light'
        
        // Expandir itens padrão se especificados
        if (props.defaultExpandedIds) {
            this.expandedItems = [...props.defaultExpandedIds]
        }

        console.log('📂 Menu carregado com', menuData.length, 'itens principais')
        console.log('📋 Items processados:', this.items.length)
        console.log('🔄 Estado retornado:', {
            itemsCount: this.items.length,
            expandedItems: this.expandedItems,
            activeItem: this.activeItem,
            theme: this.theme
        })

        return {
            items: this.items,
            expandedItems: this.expandedItems,
            activeItem: this.activeItem,
            allowMultipleExpanded: this.allowMultipleExpanded,
            theme: this.theme
        }
    }

    @SimpleLifecycle('mount')
    mount() {
        console.log('Menu component mounted with', this.items.length, 'items')
    }

    @SimpleLifecycle('unmount')
    unmount() {
        console.log('Menu component unmounted')
        this.expandedItems = []
    }

    private processMenuItems(items: MenuItem[], level: number = 0): MenuItem[] {
        // Ensure expandedItems is always an array
        if (!Array.isArray(this.expandedItems)) {
            this.expandedItems = []
        }
        
        return items.map(item => {
            // Create clean item without processed properties
            const cleanItem: MenuItem = {
                id: item.id,
                title: item.title,
                icon: item.icon,
                content: item.content,
                children: item.children
            }
            
            return {
                ...cleanItem,
                level,
                isExpanded: this.expandedItems.includes(item.id),
                isActive: this.activeItem === item.id,
                children: cleanItem.children ? this.processMenuItems(cleanItem.children, level + 1) : undefined
            }
        })
    }

    @SimpleAction('Alternar expansão de menu')
    @SimpleValidate(Validators.required, ValidationMessages.required)
    toggleMenu(itemId: string) {
        // Ensure expandedItems is always an array
        if (!Array.isArray(this.expandedItems)) {
            this.expandedItems = []
        }
        
        if (this.expandedItems.includes(itemId)) {
            this.expandedItems = this.expandedItems.filter(id => id !== itemId)
            this.emit('menu-collapsed', { itemId, expandedCount: this.expandedItems.length })
        } else {
            // Se não permite múltiplos expandidos, colapsa todos os outros
            if (!this.allowMultipleExpanded) {
                this.expandedItems = []
            }
            this.expandedItems.push(itemId)
            this.emit('menu-expanded', { itemId, expandedCount: this.expandedItems.length })
        }

        // Reprocessar itens para atualizar estado de expansão
        this.items = this.processMenuItems(this.originalItems)

        return {
            success: true,
            expandedItems: this.expandedItems,
            items: this.items
        }
    }

    @SimpleAction('Selecionar item do menu')
    @SimpleValidate(Validators.required, ValidationMessages.required)
    selectItem(itemId: string) {
        const previousActive = this.activeItem
        
        // 🎯 TESTE: Se clicar em Analytics, redirecionar para Usuários
        if (itemId === 'analytics') {
            console.log('🔄 REDIRECIONAMENTO: Analytics -> Usuários detectado!')
            this.activeItem = 'users' // Redirecionar para o menu Usuários
            
            // Emitir evento especial para o redirecionamento
            this.emit('menu-redirected', {
                from: 'analytics',
                to: 'users',
                reason: 'Teste de redirecionamento automático'
            })
        } else {
            this.activeItem = itemId
        }

        // Reprocessar itens para atualizar estado ativo
        this.items = this.processMenuItems(this.originalItems)

        // Buscar o item selecionado para retornar o conteúdo (usar o ID redirecionado se aplicável)
        const finalItemId = this.activeItem
        const selectedItem = this.findItemById(finalItemId)
        
        this.emit('item-selected', { 
            itemId: finalItemId, 
            originalItemId: itemId, // ID original clicado
            previousActive, 
            item: selectedItem,
            wasRedirected: itemId !== finalItemId
        })

        return {
            success: true,
            activeItem: this.activeItem,
            selectedContent: selectedItem?.content || '',
            selectedTitle: selectedItem?.title || '',
            items: this.items,
            redirected: itemId !== finalItemId,
            originalItemId: itemId,
            finalItemId: finalItemId
        }
    }

    @SimpleAction('Expandir todos os menus')
    expandAll() {
        // Ensure expandedItems is always an array
        if (!Array.isArray(this.expandedItems)) {
            this.expandedItems = []
        }
        
        const allIds = this.getAllItemIds(this.originalItems)
        this.expandedItems = [...allIds]
        this.items = this.processMenuItems(this.originalItems)

        this.emit('all-menus-expanded', { expandedCount: this.expandedItems.length })

        return {
            success: true,
            expandedItems: this.expandedItems,
            items: this.items
        }
    }

    @SimpleAction('Colapsar todos os menus')
    collapseAll() {
        // Ensure expandedItems is always an array
        if (!Array.isArray(this.expandedItems)) {
            this.expandedItems = []
        }
        
        this.expandedItems = []
        this.items = this.processMenuItems(this.originalItems)

        this.emit('all-menus-collapsed', { expandedCount: 0 })

        return {
            success: true,
            expandedItems: [],
            items: this.items
        }
    }

    @SimpleAction('Alternar tema do menu')
    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light'
        
        this.emit('theme-changed', { theme: this.theme })

        return {
            success: true,
            theme: this.theme
        }
    }

    @SimpleAction('Buscar itens do menu')
    @SimpleValidate(Validators.stringRange(0, 100), ValidationMessages.stringRange(0, 100))
    searchItems(query: string) {
        if (!query.trim()) {
            // Se query vazia, retorna todos os itens
            return {
                success: true,
                searchResults: this.items,
                searchQuery: query,
                resultCount: this.countAllItems(this.originalItems)
            }
        }

        const searchResults = this.filterItemsByQuery(this.originalItems, query.toLowerCase())
        
        this.emit('search-performed', { 
            query, 
            resultCount: this.countAllItems(searchResults) 
        })

        return {
            success: true,
            searchResults,
            searchQuery: query,
            resultCount: this.countAllItems(searchResults)
        }
    }

    private findItemById(id: string, items: MenuItem[] = this.originalItems): MenuItem | null {
        for (const item of items) {
            if (item.id === id) return item
            if (item.children) {
                const found = this.findItemById(id, item.children)
                if (found) return found
            }
        }
        return null
    }

    private getAllItemIds(items: MenuItem[]): string[] {
        const ids: string[] = []
        for (const item of items) {
            ids.push(item.id)
            if (item.children) {
                ids.push(...this.getAllItemIds(item.children))
            }
        }
        return ids
    }

    private countAllItems(items: MenuItem[]): number {
        let count = items.length
        for (const item of items) {
            if (item.children) {
                count += this.countAllItems(item.children)
            }
        }
        return count
    }

    private filterItemsByQuery(items: MenuItem[], query: string): MenuItem[] {
        const filtered: MenuItem[] = []
        
        for (const item of items) {
            const matchesTitle = item.title.toLowerCase().includes(query)
            const matchesContent = item.content?.toLowerCase().includes(query) || false
            
            let filteredChildren: MenuItem[] = []
            if (item.children) {
                filteredChildren = this.filterItemsByQuery(item.children, query)
            }

            if (matchesTitle || matchesContent || filteredChildren.length > 0) {
                filtered.push({
                    ...item,
                    children: filteredChildren.length > 0 ? filteredChildren : item.children,
                    isExpanded: filteredChildren.length > 0 // Auto-expandir se tem filhos que correspondem
                })
            }
        }
        
        return filtered
    }

    // Menu data declarado diretamente no backend LiveComponent
    private getMenuData(): MenuItem[] {
        return [
            {
                id: 'dashboard',
                title: 'Dashboard',
                icon: '📊',
                content: 'Dashboard principal com métricas e estatísticas gerais do sistema. Monitore KPIs, vendas, usuários ativos e performance em tempo real.',
                children: [
                    {
                        id: 'analytics',
                        title: 'Analytics',
                        icon: '📈',
                        content: 'Análises detalhadas de performance e uso da aplicação. Inclui relatórios de conversão, comportamento do usuário e tendências de mercado.'
                    },
                    {
                        id: 'reports',
                        title: 'Relatórios',
                        icon: '📋',
                        content: 'Central de relatórios gerenciais e operacionais do sistema com dados consolidados.',
                        children: [
                            {
                                id: 'monthly',
                                title: 'Mensais',
                                icon: '📅',
                                content: 'Relatórios mensais consolidados com todas as métricas importantes: vendas, crescimento, custos e ROI.'
                            },
                            {
                                id: 'yearly',
                                title: 'Anuais',
                                icon: '📆',
                                content: 'Relatórios anuais com comparativos históricos, projeções e análise de tendências de longo prazo.'
                            },
                            {
                                id: 'quarterly',
                                title: 'Trimestrais',
                                icon: '🗓️',
                                content: 'Análises trimestrais para acompanhamento de metas e planejamento estratégico.'
                            }
                        ]
                    }
                ]
            },
            {
                id: 'users',
                title: 'Usuários',
                icon: '👥',
                content: 'Gerenciamento completo de usuários e permissões do sistema. Controle de acesso, perfis e atividades.',
                children: [
                    {
                        id: 'user-list',
                        title: 'Listar Usuários',
                        icon: '📋',
                        content: 'Lista completa de todos os usuários cadastrados no sistema com filtros avançados e paginação.'
                    },
                    {
                        id: 'user-roles',
                        title: 'Perfis e Permissões',
                        icon: '🔐',
                        content: 'Configuração de perfis de acesso e permissões específicas por módulo e funcionalidade.',
                        children: [
                            {
                                id: 'admin-roles',
                                title: 'Perfis Administrativos',
                                icon: '👑',
                                content: 'Gerenciamento de perfis com privilégios administrativos e super usuários.'
                            },
                            {
                                id: 'user-roles-standard',
                                title: 'Perfis Padrão',
                                icon: '👤',
                                content: 'Configuração de perfis padrão para usuários finais e operadores.'
                            }
                        ]
                    },
                    {
                        id: 'user-activity',
                        title: 'Atividade dos Usuários',
                        icon: '📊',
                        content: 'Monitor de atividades e logs de acesso dos usuários com histórico detalhado.'
                    }
                ]
            },
            {
                id: 'settings',
                title: 'Configurações',
                icon: '⚙️',
                content: 'Configurações gerais do sistema e preferências administrativas. Personalização e ajustes avançados.',
                children: [
                    {
                        id: 'general',
                        title: 'Geral',
                        icon: '🎛️',
                        content: 'Configurações gerais da aplicação: idioma, timezone, formatos de data e parâmetros básicos.'
                    },
                    {
                        id: 'security',
                        title: 'Segurança',
                        icon: '🛡️',
                        content: 'Configurações de segurança: autenticação, políticas de senha, 2FA e auditoria.',
                        children: [
                            {
                                id: 'auth-settings',
                                title: 'Autenticação',
                                icon: '🔑',
                                content: 'Configurações de métodos de autenticação: SSO, LDAP, OAuth e autenticação local.'
                            },
                            {
                                id: 'password-policy',
                                title: 'Política de Senhas',
                                icon: '🔒',
                                content: 'Definição de regras para senhas: complexidade, expiração e histórico.'
                            }
                        ]
                    },
                    {
                        id: 'integrations',
                        title: 'Integrações',
                        icon: '🔗',
                        content: 'Configuração de APIs externas e integrações com outros sistemas: CRM, ERP, pagamentos.'
                    }
                ]
            },
            {
                id: 'finance',
                title: 'Financeiro',
                icon: '💰',
                content: 'Módulo financeiro completo com controle de receitas, despesas e fluxo de caixa.',
                children: [
                    {
                        id: 'accounts',
                        title: 'Contas',
                        icon: '🏦',
                        content: 'Gerenciamento de contas bancárias, cartões e meios de pagamento.'
                    },
                    {
                        id: 'transactions',
                        title: 'Transações',
                        icon: '💳',
                        content: 'Histórico completo de transações financeiras com categorização automática.',
                        children: [
                            {
                                id: 'income',
                                title: 'Receitas',
                                icon: '📈',
                                content: 'Controle detalhado de todas as receitas e entradas financeiras.'
                            },
                            {
                                id: 'expenses',
                                title: 'Despesas',
                                icon: '📉',
                                content: 'Gestão completa de despesas com categorização e controle orçamentário.'
                            }
                        ]
                    }
                ]
            }
        ]
    }

}

LiveAction.add(MenuAction)