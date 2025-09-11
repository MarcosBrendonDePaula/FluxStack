import { Counter } from '../components/live/Counter'
import { Clock } from '../components/live/Clock'
import { Calculator } from '../components/live/Calculator'
import { Toast } from '../components/live/Toast'
import { UserProfile } from '../components/live/UserProfile'
import { ExampleEnhanced } from '../components/live/ExampleEnhanced'
import { TestCounterFixed } from '../components/live/TestCounterFixed'
import { TestToggle } from '../components/live/TestToggle'
import { Menu } from '../components/live/Menu'

export function LiveComponentsPage() {
    return (
        <div className="live-components-page">
            {/* Header */}
            <div className="page-header">
                <h1>🔥 Live Components Playground</h1>
                <p className="page-subtitle">
                    Interactive components with real-time state synchronization via WebSocket
                </p>
            </div>

            {/* Navigation Tabs */}
            <div className="component-sections">
                {/* Counter Test Section */}
                <section className="component-section">
                    <h2>🧪 Counter Isolation Test</h2>
                    <p>Testing individual component state isolation with UUID temporary system</p>
                    
                    <div className="components-grid">
                        <Counter 
                            componentId="main-counter"
                            initialCount={0}
                            step={1}
                            label="Counter A"
                            maxCount={50}
                            onCountChanged={(data) => console.log('🔢 Counter A changed:', data)}
                            showDebug={true}
                        />
                        <Counter 
                            componentId="main-counter1"
                            initialCount={0}
                            step={2}
                            label="Counter B"
                            maxCount={100}
                            onCountChanged={(data) => console.log('🔢 Counter B changed:', data)}
                            showDebug={true}
                        />
                        <Counter 
                            componentId="main-counter2"
                            initialCount={0}
                            step={5}
                            label="Counter C"
                            maxCount={200}
                            onCountChanged={(data) => console.log('🔢 Counter C changed:', data)}
                            showDebug={true}
                        />
                    </div>

                    <div className="info-card">
                        <h3>🧪 Test Instructions:</h3>
                        <ol>
                            <li>🔍 <strong>Open DevTools Console</strong>: Press F12 to see detailed logs</li>
                            <li>🎯 <strong>Click Different Counters</strong>: Each should increment independently</li>
                            <li>📊 <strong>Check Debug Info</strong>: Click "Debug Info" on each counter to see component state</li>
                            <li>🆔 <strong>Verify Component IDs</strong>: Each counter should have unique backend-generated ID</li>
                            <li>⚡ <strong>Test Actions</strong>: Try +10, Reset, Random buttons on different counters</li>
                            <li>🔄 <strong>Observe Logs</strong>: Look for tempUUID → finalID mapping in console</li>
                        </ol>
                        
                        <div className="expected-logs">
                            <h4>📋 Expected Console Logs:</h4>
                            <pre><code>🔌 [FRONTEND] Setting up: CounterAction (user ID: main-counter) | Temp UUID: abc-123
🆔 [BACKEND] Generated ID: main-counter-xyz789 | For temp UUID: abc-123  
🆔 [FRONTEND] Backend generated ID: main-counter-xyz789 | Replacing temp: abc-123
🎯 [FRONTEND] Calling CounterAction.increment() on main-counter-xyz789</code></pre>
                        </div>
                    </div>
                </section>

                {/* Menu Navigation Section */}
                <section className="component-section">
                    <h2>🗂️ Menu Navigation Component</h2>
                    <p>Sistema completo de menu hierárquico com submenus expansíveis e busca</p>
                    
                    <div className="components-grid">
                        <Menu 
                            componentId="main-menu"
                            allowMultipleExpanded={true}
                            defaultExpandedIds={['dashboard']}
                            theme="light"
                            showControls={true}
                            onMenuExpanded={(data) => console.log('🔽 Menu expandido:', data)}
                            onMenuCollapsed={(data) => console.log('🔼 Menu colapsado:', data)}
                            onItemSelected={(data) => {
                                console.log('🎯 Item selecionado:', data)
                                if (data.wasRedirected) {
                                    console.log('🔄 REDIRECIONAMENTO DETECTADO!')
                                    console.log(`   Clicou em: ${data.originalItemId}`)
                                    console.log(`   Redirecionado para: ${data.itemId}`)
                                    alert(`🔄 Redirecionamento!\n\nVocê clicou em "${data.originalItemId}" mas foi redirecionado para "${data.item.title}"`)
                                }
                            }}
                            onThemeChanged={(data) => console.log('🎨 Tema alterado:', data)}
                            onSearchPerformed={(data) => console.log('🔍 Busca realizada:', data)}
                            onMenuRedirected={(data) => {
                                console.log('🔄 REDIRECIONAMENTO AUTOMÁTICO:', data)
                                alert(`🔄 Redirecionamento Automático!\n\nDe: ${data.from}\nPara: ${data.to}\nMotivo: ${data.reason}`)
                            }}
                        />
                    </div>

                    <div className="info-card">
                        <h3>🧪 Funcionalidades do Menu:</h3>
                        <ol>
                            <li>🗂️ <strong>Estrutura Hierárquica</strong>: Menus e submenus com múltiplos níveis</li>
                            <li>🔄 <strong>Expansão/Colapso</strong>: Clique na seta para expandir/colapsar submenus</li>
                            <li>🎯 <strong>Seleção de Itens</strong>: Clique no item para ver o conteúdo no painel lateral</li>
                            <li>🔍 <strong>Busca Inteligente</strong>: Digite na caixa de busca para filtrar itens</li>
                            <li>⬇️⬆️ <strong>Controles Globais</strong>: Botões para expandir/colapsar todos os menus</li>
                            <li>🌙☀️ <strong>Modo Escuro/Claro</strong>: Alterne entre temas light e dark</li>
                            <li>📊 <strong>Estado Sincronizado</strong>: Estado mantido entre todos os clientes conectados</li>
                            <li>🎯 <strong>TESTE: Redirecionamento</strong>: Clique em "Analytics" para ser redirecionado para "Usuários"</li>
                        </ol>
                        
                        <div className="test-highlight" style={{
                            backgroundColor: '#fff3cd',
                            border: '1px solid #ffeaa7',
                            borderRadius: '8px',
                            padding: '12px',
                            marginTop: '16px'
                        }}>
                            <h4 style={{ margin: '0 0 8px 0', color: '#856404' }}>🧪 Teste de Redirecionamento Ativo</h4>
                            <p style={{ margin: 0, color: '#856404', fontSize: '14px' }}>
                                Clique no item <strong>"Analytics"</strong> no Dashboard para testar o redirecionamento automático para o menu "Usuários". 
                                Você verá alertas e logs no console mostrando o redirecionamento.
                            </p>
                        </div>
                        
                        <div className="expected-logs">
                            <h4>📋 Estrutura de Dados do Menu:</h4>
                            <pre><code>📊 Dashboard
├── 📈 Analytics
└── 📋 Relatórios
    ├── 📅 Mensais
    └── 📆 Anuais
👥 Usuários
├── 📋 Listar Usuários
├── 🔐 Perfis e Permissões
└── 📊 Atividade dos Usuários
⚙️ Configurações
├── 🎛️ Geral
├── 🛡️ Segurança
└── 🔗 Integrações</code></pre>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    )
}