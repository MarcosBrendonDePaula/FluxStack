import { useLive } from '@/hooks/useLive'
import { useState, useEffect } from 'react'

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
    componentId?: string
    showControls?: boolean
    
    // Event handlers
    onMenuExpanded?: (data: { itemId: string, expandedCount: number }) => void
    onMenuCollapsed?: (data: { itemId: string, expandedCount: number }) => void
    onItemSelected?: (data: { itemId: string, previousActive: string | null, item: MenuItem }) => void
    onThemeChanged?: (data: { theme: 'light' | 'dark' }) => void
    onSearchPerformed?: (data: { query: string, resultCount: number }) => void
    onMenuRedirected?: (data: { from: string, to: string, reason: string }) => void
}

export function Menu({
    items,
    allowMultipleExpanded = false,
    defaultExpandedIds,
    theme = 'light',
    componentId,
    showControls = true,
    onMenuExpanded,
    onMenuCollapsed,
    onItemSelected,
    onThemeChanged,
    onSearchPerformed,
    onMenuRedirected
}: MenuProps) {
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedContent, setSelectedContent] = useState('')
    const [selectedTitle, setSelectedTitle] = useState('')

    const {
        state,
        loading,
        error,
        connected,
        callMethod,
        componentId: id
    } = useLive({
        name: 'MenuAction',
        props: { items, allowMultipleExpanded, defaultExpandedIds, theme },
        componentId,
        eventHandlers: {
            onMenuExpanded: (data) => {
                console.log('🔽 Menu expanded:', data)
                onMenuExpanded?.(data)
            },
            onMenuCollapsed: (data) => {
                console.log('🔼 Menu collapsed:', data)
                onMenuCollapsed?.(data)
            },
            onItemSelected: (data) => {
                console.log('🎯 Item selected:', data)
                setSelectedContent(data.item?.content || '')
                setSelectedTitle(data.item?.title || '')
                onItemSelected?.(data)
            },
            onThemeChanged: (data) => {
                console.log('🎨 Theme changed:', data)
                onThemeChanged?.(data)
            },
            onSearchPerformed: (data) => {
                console.log('🔍 Search performed:', data)
                onSearchPerformed?.(data)
            },
            onMenuRedirected: (data) => {
                console.log('🔄 Menu redirected:', data)
                onMenuRedirected?.(data)
            }
        }
    })

    const handleToggleMenu = (itemId: string) => {
        callMethod('toggleMenu', itemId)
    }

    const handleSelectItem = async (itemId: string) => {
        const result = await callMethod('selectItem', itemId)
        if (result?.selectedContent) {
            setSelectedContent(result.selectedContent)
            setSelectedTitle(result.selectedTitle)
        }
    }

    const handleSearch = async () => {
        await callMethod('searchItems', searchQuery)
    }

    const handleExpandAll = () => {
        callMethod('expandAll')
    }

    const handleCollapseAll = () => {
        callMethod('collapseAll')
    }

    const handleToggleTheme = () => {
        callMethod('toggleTheme')
    }

    const renderMenuItem = (item: MenuItem) => {
        const hasChildren = item.children && item.children.length > 0
        const isExpanded = state.expandedItems?.includes(item.id) || false
        const isActive = state.activeItem === item.id
        const level = item.level || 0

        const isDark = state.theme === 'dark'

        return (
            <div key={item.id} className="menu-item-container">
                <div 
                    className="menu-item"
                    style={{
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: isActive 
                            ? (isDark 
                                ? 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)'
                                : 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)')
                            : (isDark ? 'transparent' : 'transparent'),
                        color: isActive 
                            ? (isDark ? '#ffffff' : '#1e40af')
                            : (isDark ? '#e5e7eb' : '#374151'),
                        borderRadius: level === 0 ? '12px' : '8px',
                        border: isActive 
                            ? `2px solid ${isDark ? '#3b82f6' : '#2563eb'}`
                            : `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                        margin: '4px 8px',
                        paddingLeft: `${level * 24 + 16}px`,
                        paddingRight: '16px',
                        paddingTop: level === 0 ? '16px' : '12px',
                        paddingBottom: level === 0 ? '16px' : '12px',
                        boxShadow: isActive 
                            ? (isDark 
                                ? '0 4px 12px rgba(59, 130, 246, 0.3), 0 2px 4px rgba(0, 0, 0, 0.1)'
                                : '0 4px 12px rgba(37, 99, 235, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1)')
                            : (isDark 
                                ? '0 1px 3px rgba(0, 0, 0, 0.3)'
                                : '0 1px 3px rgba(0, 0, 0, 0.1)'),
                        background: isActive && isDark 
                            ? 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)'
                            : isActive && !isDark
                            ? 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)'
                            : isDark ? '#1f2937' : '#ffffff'
                    }}
                    onMouseEnter={(e) => {
                        if (!isActive) {
                            e.currentTarget.style.backgroundColor = isDark ? '#374151' : '#f8fafc'
                            e.currentTarget.style.borderColor = isDark ? '#4b5563' : '#cbd5e1'
                            e.currentTarget.style.transform = 'translateY(-1px)'
                            e.currentTarget.style.boxShadow = isDark 
                                ? '0 4px 12px rgba(0, 0, 0, 0.4), 0 2px 4px rgba(0, 0, 0, 0.2)'
                                : '0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1)'
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (!isActive) {
                            e.currentTarget.style.backgroundColor = isDark ? '#1f2937' : '#ffffff'
                            e.currentTarget.style.borderColor = isDark ? '#374151' : '#e5e7eb'
                            e.currentTarget.style.transform = 'translateY(0)'
                            e.currentTarget.style.boxShadow = isDark 
                                ? '0 1px 3px rgba(0, 0, 0, 0.3)'
                                : '0 1px 3px rgba(0, 0, 0, 0.1)'
                        }
                    }}
                    onClick={() => handleSelectItem(item.id)}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {/* Hierarchical connection lines for submenus */}
                        {level > 0 && (
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                marginRight: '8px',
                                position: 'relative'
                            }}>
                                {/* Connection line */}
                                <div 
                                    style={{
                                        width: '2px',
                                        height: '20px',
                                        background: `linear-gradient(to bottom, ${isDark ? '#6366f1' : '#8b5cf6'} 0%, transparent 100%)`,
                                        position: 'absolute',
                                        left: '-12px',
                                        top: '-10px'
                                    }}
                                />
                                {/* Dot indicator */}
                                <div 
                                    style={{
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        background: `linear-gradient(135deg, ${isDark ? '#6366f1' : '#8b5cf6'} 0%, ${isDark ? '#8b5cf6' : '#a855f7'} 100%)`,
                                        border: `2px solid ${isDark ? '#1f2937' : '#ffffff'}`,
                                        boxShadow: `0 0 0 1px ${isDark ? '#4c1d95' : '#c084fc'}`,
                                        marginRight: level > 1 ? '4px' : '8px'
                                    }}
                                />
                                {/* Additional dot for deeper levels */}
                                {level > 1 && (
                                    <div 
                                        style={{
                                            width: '6px',
                                            height: '6px',
                                            borderRadius: '50%',
                                            backgroundColor: isDark ? '#6b7280' : '#9ca3af',
                                            marginRight: '8px',
                                            opacity: 0.7
                                        }}
                                    />
                                )}
                            </div>
                        )}
                        
                        {/* Icon with enhanced styling */}
                        {item.icon && (
                            <div 
                                style={{
                                    fontSize: level > 0 ? '16px' : '20px',
                                    width: level > 0 ? '24px' : '32px',
                                    height: level > 0 ? '24px' : '32px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '8px',
                                    backgroundColor: isActive 
                                        ? (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(30, 64, 175, 0.1)')
                                        : (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'),
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                {item.icon}
                            </div>
                        )}
                        
                        {/* Title with better typography */}
                        <span 
                            style={{
                                fontWeight: isActive ? '600' : level === 0 ? '500' : '400',
                                fontSize: level > 1 ? '13px' : level > 0 ? '14px' : '16px',
                                letterSpacing: level === 0 ? '0.025em' : '0.01em',
                                lineHeight: '1.5'
                            }}
                        >
                            {item.title}
                        </span>
                    </div>
                    
                    {hasChildren && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                handleToggleMenu(item.id)
                            }}
                            style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                backgroundColor: isActive 
                                    ? (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(30, 64, 175, 0.1)')
                                    : 'transparent',
                                border: `1px solid ${isDark ? '#4b5563' : '#d1d5db'}`,
                                color: isActive 
                                    ? (isDark ? '#ffffff' : '#1e40af')
                                    : (isDark ? '#9ca3af' : '#6b7280'),
                                cursor: 'pointer',
                                transform: `rotate(${isExpanded ? '90deg' : '0deg'})`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = isDark ? '#4b5563' : '#e5e7eb'
                                e.currentTarget.style.borderColor = isDark ? '#6b7280' : '#9ca3af'
                                e.currentTarget.style.transform = `rotate(${isExpanded ? '90deg' : '0deg'}) scale(1.1)`
                                e.currentTarget.style.color = isDark ? '#f3f4f6' : '#374151'
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = isActive 
                                    ? (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(30, 64, 175, 0.1)')
                                    : 'transparent'
                                e.currentTarget.style.borderColor = isDark ? '#4b5563' : '#d1d5db'
                                e.currentTarget.style.transform = `rotate(${isExpanded ? '90deg' : '0deg'}) scale(1)`
                                e.currentTarget.style.color = isActive 
                                    ? (isDark ? '#ffffff' : '#1e40af')
                                    : (isDark ? '#9ca3af' : '#6b7280')
                            }}
                        >
                            <svg 
                                width="12" 
                                height="12" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="2"
                            >
                                <path d="M9 18l6-6-6-6"/>
                            </svg>
                        </button>
                    )}
                </div>
                
                {hasChildren && isExpanded && (
                    <div className="submenu">
                        {item.children!.map(child => renderMenuItem(child))}
                    </div>
                )}
            </div>
        )
    }

    const displayItems = searchQuery.trim() ? state.searchResults || [] : state.items || []
    const isDark = state.theme === 'dark'

    // Auto-initialize menu state if empty
    useEffect(() => {
        if (connected && (!state.items || state.items.length === 0)) {
            // Small delay to ensure connection is established
            setTimeout(() => {
                callMethod('expandAll')
            }, 1000)
        }
    }, [connected, state.items, callMethod])

    return (
        <div 
            className="menu-component"
            style={{
                border: `1px solid ${isDark ? '#374151' : '#e2e8f0'}`,
                borderRadius: '20px',
                background: isDark 
                    ? 'linear-gradient(145deg, #111827 0%, #1f2937 100%)'
                    : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
                margin: '1rem',
                minWidth: '450px',
                maxWidth: '900px',
                boxShadow: isDark 
                    ? '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)'
                    : '0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)',
                overflow: 'hidden',
                backdropFilter: 'blur(10px)'
            }}
        >
            {/* Header */}
            <div 
                style={{
                    padding: '1.5rem',
                    background: isDark 
                        ? 'linear-gradient(135deg, #1e40af 0%, #3730a3 100%)'
                        : 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                    borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                    backdropFilter: 'blur(10px)'
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ 
                        margin: 0, 
                        color: isDark ? '#ffffff' : '#1e40af',
                        fontSize: '24px',
                        fontWeight: '700',
                        letterSpacing: '-0.025em',
                        textShadow: isDark ? '0 1px 2px rgba(0, 0, 0, 0.5)' : 'none'
                    }}>
                        🗂️ Menu Navegação
                    </h3>
                    <div style={{ 
                        fontSize: '12px',
                        color: connected ? '#10b981' : '#ef4444',
                        fontWeight: '600',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        backgroundColor: connected 
                            ? 'rgba(16, 185, 129, 0.1)' 
                            : 'rgba(239, 68, 68, 0.1)',
                        border: `1px solid ${connected ? '#10b981' : '#ef4444'}`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}>
                        {connected ? '🟢 Online' : '🔴 Offline'}
                    </div>
                </div>

                {/* Search */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '1.5rem' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <input
                            type="text"
                            placeholder="Buscar menus..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            style={{
                                width: '100%',
                                padding: '12px 16px 12px 44px',
                                border: `2px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                                borderRadius: '15px',
                                backgroundColor: isDark 
                                    ? 'rgba(255, 255, 255, 0.05)' 
                                    : 'rgba(255, 255, 255, 0.8)',
                                color: isDark ? '#ffffff' : '#1f2937',
                                fontSize: '14px',
                                outline: 'none',
                                transition: 'all 0.3s ease',
                                backdropFilter: 'blur(10px)',
                                boxSizing: 'border-box'
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = isDark ? '#3b82f6' : '#2563eb'
                                e.target.style.boxShadow = `0 0 0 3px ${isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(37, 99, 235, 0.1)'}`
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                                e.target.style.boxShadow = 'none'
                            }}
                            disabled={loading}
                        />
                        <div style={{
                            position: 'absolute',
                            left: '16px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)',
                            fontSize: '16px'
                        }}>
                            🔍
                        </div>
                    </div>
                    <button
                        onClick={handleSearch}
                        disabled={loading}
                        style={{
                            padding: '12px 20px',
                            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '15px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontWeight: '600',
                            fontSize: '14px',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                            minWidth: '80px'
                        }}
                        onMouseEnter={(e) => {
                            if (!loading) {
                                e.currentTarget.style.transform = 'translateY(-2px)'
                                e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)'
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!loading) {
                                e.currentTarget.style.transform = 'translateY(0)'
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)'
                            }
                        }}
                    >
                        Buscar
                    </button>
                </div>

                {/* Controls */}
                {showControls && (
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <button
                            onClick={handleExpandAll}
                            disabled={loading}
                            style={{
                                padding: '10px 16px',
                                background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                fontSize: '13px',
                                fontWeight: '600',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 3px 10px rgba(16, 185, 129, 0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                            onMouseEnter={(e) => {
                                if (!loading) {
                                    e.currentTarget.style.transform = 'translateY(-2px)'
                                    e.currentTarget.style.boxShadow = '0 5px 15px rgba(16, 185, 129, 0.4)'
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!loading) {
                                    e.currentTarget.style.transform = 'translateY(0)'
                                    e.currentTarget.style.boxShadow = '0 3px 10px rgba(16, 185, 129, 0.3)'
                                }
                            }}
                        >
                            ⬇️ Expandir Todos
                        </button>
                        <button
                            onClick={handleCollapseAll}
                            disabled={loading}
                            style={{
                                padding: '10px 16px',
                                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                fontSize: '13px',
                                fontWeight: '600',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 3px 10px rgba(245, 158, 11, 0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                            onMouseEnter={(e) => {
                                if (!loading) {
                                    e.currentTarget.style.transform = 'translateY(-2px)'
                                    e.currentTarget.style.boxShadow = '0 5px 15px rgba(245, 158, 11, 0.4)'
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!loading) {
                                    e.currentTarget.style.transform = 'translateY(0)'
                                    e.currentTarget.style.boxShadow = '0 3px 10px rgba(245, 158, 11, 0.3)'
                                }
                            }}
                        >
                            ⬆️ Colapsar Todos
                        </button>
                        <button
                            onClick={handleToggleTheme}
                            disabled={loading}
                            style={{
                                padding: '10px 16px',
                                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                fontSize: '13px',
                                fontWeight: '600',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 3px 10px rgba(139, 92, 246, 0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                            onMouseEnter={(e) => {
                                if (!loading) {
                                    e.currentTarget.style.transform = 'translateY(-2px)'
                                    e.currentTarget.style.boxShadow = '0 5px 15px rgba(139, 92, 246, 0.4)'
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!loading) {
                                    e.currentTarget.style.transform = 'translateY(0)'
                                    e.currentTarget.style.boxShadow = '0 3px 10px rgba(139, 92, 246, 0.3)'
                                }
                            }}
                        >
                            {isDark ? '☀️' : '🌙'} Tema
                        </button>
                    </div>
                )}
            </div>

            {/* Menu Content */}
            <div style={{ display: 'flex', minHeight: '450px', borderRadius: '0 0 20px 20px', overflow: 'hidden' }}>
                {/* Menu Tree */}
                <div 
                    style={{
                        flex: 1,
                        background: isDark 
                            ? 'linear-gradient(180deg, #1f2937 0%, #111827 100%)'
                            : 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
                        borderRight: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                        maxHeight: '500px',
                        overflowY: 'auto',
                        padding: '16px 8px'
                    }}
                >
                    {displayItems.length > 0 ? (
                        displayItems.map(item => renderMenuItem(item))
                    ) : (
                        <div 
                            style={{
                                padding: '2rem',
                                textAlign: 'center',
                                color: isDark ? '#9ca3af' : '#6b7280'
                            }}
                        >
                            {searchQuery.trim() ? '🔍 Nenhum resultado encontrado' : '📂 Nenhum item no menu'}
                        </div>
                    )}
                </div>

                {/* Content Panel */}
                <div 
                    style={{
                        flex: 1,
                        padding: '24px',
                        background: isDark 
                            ? 'linear-gradient(180deg, #111827 0%, #0f172a 100%)'
                            : 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)'
                    }}
                >
                    {selectedTitle ? (
                        <div style={{
                            background: isDark 
                                ? 'rgba(255, 255, 255, 0.05)'
                                : 'rgba(255, 255, 255, 0.8)',
                            borderRadius: '16px',
                            padding: '24px',
                            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                            backdropFilter: 'blur(10px)',
                            boxShadow: isDark 
                                ? '0 8px 32px rgba(0, 0, 0, 0.3)'
                                : '0 8px 32px rgba(0, 0, 0, 0.1)'
                        }}>
                            <h4 style={{ 
                                margin: '0 0 20px 0', 
                                color: isDark ? '#ffffff' : '#1e40af',
                                fontSize: '20px',
                                fontWeight: '700',
                                letterSpacing: '-0.025em',
                                background: isDark 
                                    ? 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)'
                                    : 'linear-gradient(135deg, #1e40af 0%, #7c3aed 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                                paddingBottom: '12px',
                                borderBottom: `2px solid ${isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(30, 64, 175, 0.2)'}`
                            }}>
                                {selectedTitle}
                            </h4>
                            <p style={{ 
                                color: isDark ? '#e5e7eb' : '#475569',
                                lineHeight: '1.7',
                                fontSize: '15px',
                                margin: 0
                            }}>
                                {selectedContent}
                            </p>
                        </div>
                    ) : (
                        <div 
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '100%',
                                color: isDark ? '#9ca3af' : '#6b7280',
                                textAlign: 'center'
                            }}
                        >
                            <div style={{ 
                                fontSize: '4rem', 
                                marginBottom: '24px',
                                background: isDark 
                                    ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                                    : 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text'
                            }}>
                                📝
                            </div>
                            <p style={{
                                fontSize: '16px',
                                fontWeight: '500',
                                margin: 0,
                                opacity: 0.8
                            }}>
                                Selecione um item do menu para ver o conteúdo
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div 
                    style={{
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: '8px',
                        padding: '0.75rem',
                        margin: '1rem',
                        color: '#991b1b',
                        fontSize: '0.875rem'
                    }}
                >
                    ❌ {error}
                </div>
            )}

            {/* Loading Indicator */}
            {loading && (
                <div 
                    style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        fontSize: '1rem'
                    }}
                >
                    ⏳
                </div>
            )}

            {/* Status Info */}
            <div 
                style={{
                    padding: '0.75rem 1rem',
                    backgroundColor: isDark ? '#374151' : '#f1f5f9',
                    borderTop: `1px solid ${isDark ? '#4b5563' : '#e2e8f0'}`,
                    fontSize: '0.75rem',
                    color: isDark ? '#9ca3af' : '#64748b',
                    display: 'flex',
                    justifyContent: 'space-between'
                }}
            >
                <span>
                    📊 Itens: {displayItems.length} | 
                    🔄 Expandidos: {state.expandedItems?.length || 0} |
                    🎯 Ativo: {state.activeItem || 'nenhum'}
                </span>
                <span>ID: {id}</span>
            </div>
        </div>
    )
}