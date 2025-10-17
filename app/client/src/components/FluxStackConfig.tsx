// 🔥 FluxStack Configuration Viewer Component

import { useState } from 'react'
import { useHybridLiveComponent } from '@/core/client'
import { 
  FaCog, 
  FaServer, 
  FaPlug, 
  FaLock, 
  FaDatabase,
  FaCode,
  FaInfoCircle,
  FaSync,
  FaDownload,
  FaCheckCircle,
  FaTimesCircle,
  FaEye,
  FaEyeSlash,
  FaCopy,
  FaTerminal,
  FaMemory,
  FaFolder,
  FaGlobe,
  FaBolt,
  FaRocket,
  FaTools,
  FaTachometerAlt
} from 'react-icons/fa'

export interface FluxStackConfigState {
  environment: 'development' | 'production' | 'test'
  port: number
  host: string
  apiPrefix: string
  framework: {
    name: string
    version: string
    description: string
    author: string
    license: string
  }
  plugins: Array<{
    name: string
    version: string
    enabled: boolean
    dependencies: string[]
    config?: Record<string, any>
  }>
  runtime: {
    nodeVersion: string
    bunVersion: string
    platform: string
    architecture: string
    cpuCount: number
    totalMemory: number
    workingDirectory: string
    executablePath: string
  }
  liveComponents: {
    enabled: boolean
    autoDiscovery: boolean
    websocketPath: string
    signatureSecret: string
    maxConnections: number
    timeout: number
  }
  vite: {
    enabled: boolean
    port: number
    host: string
    hmr: boolean
    publicDir: string
    buildDir: string
  }
  staticFiles: {
    enabled: boolean
    publicPath: string
    uploadsPath: string
    maxFileSize: number
    allowedExtensions: string[]
  }
  swagger: {
    enabled: boolean
    title: string
    version: string
    description: string
    path: string
  }
  security: {
    cors: {
      enabled: boolean
      origins: string[]
      credentials: boolean
    }
    rateLimit: {
      enabled: boolean
      windowMs: number
      maxRequests: number
    }
    helmet: {
      enabled: boolean
      options: Record<string, any>
    }
  }
  performance: {
    compression: boolean
    cache: {
      enabled: boolean
      maxAge: number
      strategy: string
    }
    clustering: {
      enabled: boolean
      workers: number
    }
  }
  database: {
    enabled: boolean
    type?: string
    host?: string
    port?: number
    name?: string
    ssl?: boolean
  }
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error'
    format: 'json' | 'pretty' | 'compact'
    file: {
      enabled: boolean
      path?: string
      maxSize?: string
      maxFiles?: number
    }
    console: {
      enabled: boolean
      colors: boolean
    }
  }
  advanced: {
    hotReload: boolean
    typeChecking: boolean
    sourceMap: boolean
    minification: boolean
    bundleAnalyzer: boolean
  }
  lastUpdated: number
}

const initialState: FluxStackConfigState = {
  environment: 'development',
  port: 3000,
  host: 'localhost',
  apiPrefix: '/api',
  framework: {
    name: 'FluxStack',
    version: '1.5.0',
    description: 'Loading...',
    author: 'FluxStack Team',
    license: 'MIT'
  },
  plugins: [],
  runtime: {
    nodeVersion: 'Loading...',
    bunVersion: 'Loading...',
    platform: 'Loading...',
    architecture: 'Loading...',
    cpuCount: 0,
    totalMemory: 0,
    workingDirectory: 'Loading...',
    executablePath: 'Loading...'
  },
  liveComponents: {
    enabled: false,
    autoDiscovery: false,
    websocketPath: '/api/live/ws',
    signatureSecret: '***hidden***',
    maxConnections: 1000,
    timeout: 30000
  },
  vite: {
    enabled: false,
    port: 5173,
    host: 'localhost',
    hmr: false,
    publicDir: 'public',
    buildDir: 'dist'
  },
  staticFiles: {
    enabled: false,
    publicPath: 'public',
    uploadsPath: 'uploads',
    maxFileSize: 0,
    allowedExtensions: []
  },
  swagger: {
    enabled: false,
    title: 'FluxStack API',
    version: '1.0.0',
    description: 'Loading...',
    path: '/swagger'
  },
  security: {
    cors: {
      enabled: false,
      origins: [],
      credentials: false
    },
    rateLimit: {
      enabled: false,
      windowMs: 0,
      maxRequests: 0
    },
    helmet: {
      enabled: false,
      options: {}
    }
  },
  performance: {
    compression: false,
    cache: {
      enabled: false,
      maxAge: 0,
      strategy: 'memory'
    },
    clustering: {
      enabled: false,
      workers: 0
    }
  },
  database: {
    enabled: false
  },
  logging: {
    level: 'info',
    format: 'pretty',
    file: {
      enabled: false
    },
    console: {
      enabled: true,
      colors: true
    }
  },
  advanced: {
    hotReload: false,
    typeChecking: false,
    sourceMap: false,
    minification: false,
    bundleAnalyzer: false
  },
  lastUpdated: Date.now()
}

export function FluxStackConfig() {
  const { state, call, callAndWait, connected, status, error } = useHybridLiveComponent<FluxStackConfigState>(
    'FluxStackConfig',
    initialState,
    { debug: true }
  )

  const [activeTab, setActiveTab] = useState<string>('overview')
  const [showSensitive, setShowSensitive] = useState(false)

  // Show loading state
  if (!connected || status !== 'synced') {
    const getStatusMessage = () => {
      switch (status) {
        case 'connecting':
          return '🔄 Conectando configuração...'
        case 'reconnecting':
          return '🔄 Reconectando configuração...'
        case 'mounting':
          return '🚀 Carregando configuração...'
        case 'loading':
          return '⏳ Carregando...'
        case 'error':
          return '❌ Erro na configuração'
        default:
          return '🔄 Preparando configuração...'
      }
    }

    return (
      <div style={{
        padding: '2rem',
        textAlign: 'center',
        color: '#6b7280'
      }}>
        <FaCog size={48} style={{ marginBottom: '1rem', animation: 'spin 2s linear infinite' }} />
        <p style={{ fontSize: '1.1rem' }}>{getStatusMessage()}</p>
        {error && (
          <p style={{ fontSize: '0.9rem', marginTop: '0.5rem', color: '#ef4444' }}>
            {error}
          </p>
        )}
      </div>
    )
  }

  const handleRefreshConfiguration = async () => {
    try {
      await call('refreshConfiguration')
    } catch (error) {
      console.error('Refresh configuration error:', error)
    }
  }

  const handleExportConfiguration = async () => {
    try {
      const config = await call('exportConfiguration')
      const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `fluxstack-config-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export configuration error:', error)
    }
  }

  const handleValidateConfiguration = async () => {
    try {
      const result = await callAndWait('validateConfiguration')
      alert(`Validation ${result.valid ? 'passed' : 'failed'}!\n\nIssues: ${result.issues?.join(', ') || 'None'}`)
    } catch (error) {
      console.error('Validate configuration error:', error)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // Could show a toast notification here
    })
  }

  const formatBytes = (bytes: number) => {
    const gb = bytes
    return `${gb} GB`
  }

  const formatMs = (ms: number) => {
    if (ms >= 60000) return `${Math.round(ms / 60000)}min`
    if (ms >= 1000) return `${Math.round(ms / 1000)}s`
    return `${ms}ms`
  }

  const getStatusIcon = (enabled: boolean) => {
    return enabled ? 
      <FaCheckCircle style={{ color: '#10b981' }} /> : 
      <FaTimesCircle style={{ color: '#ef4444' }} />
  }

  const getEnvironmentColor = () => {
    switch (state.environment) {
      case 'production': return '#ef4444'
      case 'development': return '#10b981'
      case 'test': return '#f59e0b'
      default: return '#6b7280'
    }
  }

  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: FaInfoCircle },
    { id: 'runtime', label: 'Runtime', icon: FaTerminal },
    { id: 'plugins', label: 'Plugins', icon: FaPlug },
    { id: 'livecomponents', label: 'Live Components', icon: FaRocket },
    { id: 'security', label: 'Segurança', icon: FaLock },
    { id: 'performance', label: 'Performance', icon: FaBolt },
    { id: 'advanced', label: 'Avançado', icon: FaTools }
  ]

  return (
    <div style={{
      padding: '2rem',
      maxWidth: '1400px',
      margin: '0 auto'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '2rem',
        padding: '1.5rem',
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <FaCog size={32} style={{ color: '#6b7280' }} />
          <div>
            <h1 style={{ color: '#374151', margin: 0, fontSize: '1.8rem' }}>
              🔥 {state.framework.name} Configuration
            </h1>
            <p style={{ color: '#6b7280', margin: 0, fontSize: '1rem' }}>
              v{state.framework.version} • Environment: 
              <span style={{ 
                color: getEnvironmentColor(), 
                fontWeight: 'bold',
                marginLeft: '0.5rem',
                textTransform: 'uppercase'
              }}>
                {state.environment}
              </span>
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setShowSensitive(!showSensitive)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              cursor: 'pointer',
              backgroundColor: 'white',
              color: '#6b7280',
              fontSize: '0.9rem'
            }}
          >
            {showSensitive ? <FaEyeSlash /> : <FaEye />}
            {showSensitive ? 'Ocultar' : 'Mostrar'} Sensíveis
          </button>
          
          <button
            onClick={handleRefreshConfiguration}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              cursor: 'pointer',
              backgroundColor: 'white',
              color: '#3b82f6',
              fontSize: '0.9rem'
            }}
          >
            <FaSync />
            Atualizar
          </button>

          <button
            onClick={handleValidateConfiguration}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              cursor: 'pointer',
              backgroundColor: 'white',
              color: '#10b981',
              fontSize: '0.9rem'
            }}
          >
            <FaCheckCircle />
            Validar
          </button>

          <button
            onClick={handleExportConfiguration}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              cursor: 'pointer',
              backgroundColor: '#3b82f6',
              color: 'white',
              fontSize: '0.9rem'
            }}
          >
            <FaDownload />
            Exportar
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '0.5rem',
        marginBottom: '2rem',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        overflowX: 'auto'
      }}>
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: isActive ? '#3b82f6' : 'transparent',
                color: isActive ? 'white' : '#6b7280',
                fontSize: '0.9rem',
                fontWeight: isActive ? 'bold' : 'normal',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '2rem',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        minHeight: '600px'
      }}>
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            <h2 style={{ color: '#374151', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FaInfoCircle />
              Visão Geral do Sistema
            </h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1.5rem',
              marginBottom: '2rem'
            }}>
              {/* Framework Info */}
              <div style={{
                padding: '1.5rem',
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                border: '1px solid #e2e8f0'
              }}>
                <h3 style={{ color: '#374151', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FaRocket style={{ color: '#3b82f6' }} />
                  Framework
                </h3>
                <div style={{ color: '#6b7280', lineHeight: 1.6 }}>
                  <p><strong>Nome:</strong> {state.framework.name}</p>
                  <p><strong>Versão:</strong> {state.framework.version}</p>
                  <p><strong>Licença:</strong> {state.framework.license}</p>
                  <p><strong>Descrição:</strong> {state.framework.description}</p>
                </div>
              </div>

              {/* Server Info */}
              <div style={{
                padding: '1.5rem',
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                border: '1px solid #e2e8f0'
              }}>
                <h3 style={{ color: '#374151', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FaServer style={{ color: '#10b981' }} />
                  Servidor
                </h3>
                <div style={{ color: '#6b7280', lineHeight: 1.6 }}>
                  <p><strong>Host:</strong> {state.host}</p>
                  <p><strong>Porta:</strong> {state.port}</p>
                  <p><strong>API Prefix:</strong> {state.apiPrefix}</p>
                  <p><strong>Ambiente:</strong> 
                    <span style={{ 
                      color: getEnvironmentColor(), 
                      fontWeight: 'bold',
                      marginLeft: '0.5rem'
                    }}>
                      {state.environment.toUpperCase()}
                    </span>
                  </p>
                </div>
              </div>

              {/* System Resources */}
              <div style={{
                padding: '1.5rem',
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                border: '1px solid #e2e8f0'
              }}>
                <h3 style={{ color: '#374151', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FaMemory style={{ color: '#f59e0b' }} />
                  Recursos do Sistema
                </h3>
                <div style={{ color: '#6b7280', lineHeight: 1.6 }}>
                  <p><strong>CPUs:</strong> {state.runtime.cpuCount} cores</p>
                  <p><strong>Memória:</strong> {formatBytes(state.runtime.totalMemory)}</p>
                  <p><strong>Plataforma:</strong> {state.runtime.platform} ({state.runtime.architecture})</p>
                  <p><strong>Node:</strong> {state.runtime.nodeVersion}</p>
                </div>
              </div>
            </div>

            {/* Quick Status */}
            <div style={{
              padding: '1.5rem',
              backgroundColor: '#f0f9ff',
              borderRadius: '12px',
              border: '1px solid #0ea5e9'
            }}>
              <h3 style={{ color: '#0369a1', marginBottom: '1rem' }}>
                🎯 Status dos Componentes
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0369a1' }}>
                  {getStatusIcon(state.liveComponents.enabled)}
                  <span>Live Components</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0369a1' }}>
                  {getStatusIcon(state.vite.enabled)}
                  <span>Vite Dev Server</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0369a1' }}>
                  {getStatusIcon(state.staticFiles.enabled)}
                  <span>Static Files</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0369a1' }}>
                  {getStatusIcon(state.swagger.enabled)}
                  <span>Swagger Documentation</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Runtime Tab */}
        {activeTab === 'runtime' && (
          <div>
            <h2 style={{ color: '#374151', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FaTerminal />
              Informações de Runtime
            </h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
              gap: '1.5rem'
            }}>
              {/* Runtime Versions */}
              <div style={{
                padding: '1.5rem',
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                border: '1px solid #e2e8f0'
              }}>
                <h3 style={{ color: '#374151', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FaCode style={{ color: '#3b82f6' }} />
                  Versões
                </h3>
                <div style={{ color: '#6b7280', lineHeight: 1.8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span>Node.js:</span>
                    <span style={{ fontFamily: 'monospace', color: '#374151' }}>{state.runtime.nodeVersion}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span>Bun:</span>
                    <span style={{ fontFamily: 'monospace', color: '#374151' }}>{state.runtime.bunVersion}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span>Plataforma:</span>
                    <span style={{ fontFamily: 'monospace', color: '#374151' }}>{state.runtime.platform}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Arquitetura:</span>
                    <span style={{ fontFamily: 'monospace', color: '#374151' }}>{state.runtime.architecture}</span>
                  </div>
                </div>
              </div>

              {/* System Resources */}
              <div style={{
                padding: '1.5rem',
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                border: '1px solid #e2e8f0'
              }}>
                <h3 style={{ color: '#374151', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FaMemory style={{ color: '#10b981' }} />
                  Recursos
                </h3>
                <div style={{ color: '#6b7280', lineHeight: 1.8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span>CPUs:</span>
                    <span style={{ fontFamily: 'monospace', color: '#374151' }}>{state.runtime.cpuCount} cores</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span>Memória Total:</span>
                    <span style={{ fontFamily: 'monospace', color: '#374151' }}>{formatBytes(state.runtime.totalMemory)}</span>
                  </div>
                </div>
              </div>

              {/* Paths */}
              <div style={{
                padding: '1.5rem',
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                gridColumn: '1 / -1'
              }}>
                <h3 style={{ color: '#374151', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FaFolder style={{ color: '#f59e0b' }} />
                  Caminhos do Sistema
                </h3>
                <div style={{ color: '#6b7280', lineHeight: 1.8 }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: 'bold' }}>Diretório de Trabalho:</span>
                      <button
                        onClick={() => copyToClipboard(state.runtime.workingDirectory)}
                        style={{
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.75rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          backgroundColor: 'white',
                          cursor: 'pointer'
                        }}
                      >
                        <FaCopy />
                      </button>
                    </div>
                    <span style={{ 
                      fontFamily: 'monospace', 
                      color: '#374151',
                      backgroundColor: '#f3f4f6',
                      padding: '0.5rem',
                      borderRadius: '4px',
                      display: 'block',
                      wordBreak: 'break-all'
                    }}>
                      {state.runtime.workingDirectory}
                    </span>
                  </div>
                  
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: 'bold' }}>Executável:</span>
                      <button
                        onClick={() => copyToClipboard(state.runtime.executablePath)}
                        style={{
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.75rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          backgroundColor: 'white',
                          cursor: 'pointer'
                        }}
                      >
                        <FaCopy />
                      </button>
                    </div>
                    <span style={{ 
                      fontFamily: 'monospace', 
                      color: '#374151',
                      backgroundColor: '#f3f4f6',
                      padding: '0.5rem',
                      borderRadius: '4px',
                      display: 'block',
                      wordBreak: 'break-all'
                    }}>
                      {showSensitive ? state.runtime.executablePath : '***hidden***'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Plugins Tab */}
        {activeTab === 'plugins' && (
          <div>
            <h2 style={{ color: '#374151', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FaPlug />
              Plugins Instalados ({state.plugins.length})
            </h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
              gap: '1.5rem'
            }}>
              {state.plugins.map((plugin, index) => (
                <div key={index} style={{
                  padding: '1.5rem',
                  backgroundColor: plugin.enabled ? '#f0fdf4' : '#fef2f2',
                  borderRadius: '12px',
                  border: `1px solid ${plugin.enabled ? '#16a34a' : '#dc2626'}`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <h3 style={{ 
                      color: '#374151', 
                      margin: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      {getStatusIcon(plugin.enabled)}
                      {plugin.name}
                    </h3>
                    <span style={{
                      backgroundColor: plugin.enabled ? '#16a34a' : '#dc2626',
                      color: 'white',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 'bold'
                    }}>
                      {plugin.enabled ? 'ATIVO' : 'INATIVO'}
                    </span>
                  </div>
                  
                  <div style={{ color: '#6b7280', lineHeight: 1.6 }}>
                    <p><strong>Versão:</strong> {plugin.version}</p>
                    {plugin.dependencies.length > 0 && (
                      <p><strong>Dependências:</strong> {plugin.dependencies.join(', ')}</p>
                    )}
                    
                    {plugin.config && Object.keys(plugin.config).length > 0 && (
                      <div>
                        <p><strong>Configuração:</strong></p>
                        <div style={{
                          backgroundColor: '#f3f4f6',
                          padding: '0.75rem',
                          borderRadius: '6px',
                          fontFamily: 'monospace',
                          fontSize: '0.85rem',
                          marginTop: '0.5rem'
                        }}>
                          {Object.entries(plugin.config).map(([key, value]) => (
                            <div key={key} style={{ marginBottom: '0.25rem' }}>
                              <span style={{ color: '#7c3aed' }}>{key}:</span> {' '}
                              <span style={{ color: '#059669' }}>
                                {typeof value === 'string' ? `"${value}"` : JSON.stringify(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Live Components Tab */}
        {activeTab === 'livecomponents' && (
          <div>
            <h2 style={{ color: '#374151', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FaBolt />
              Live Components Configuration
            </h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
              gap: '1.5rem'
            }}>
              {/* Main Settings */}
              <div style={{
                padding: '1.5rem',
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                border: '1px solid #e2e8f0'
              }}>
                <h3 style={{ color: '#374151', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FaCog style={{ color: '#3b82f6' }} />
                  Configurações Principais
                </h3>
                <div style={{ color: '#6b7280', lineHeight: 1.8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span>Status:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {getStatusIcon(state.liveComponents.enabled)}
                      <span style={{ fontWeight: 'bold', color: state.liveComponents.enabled ? '#10b981' : '#ef4444' }}>
                        {state.liveComponents.enabled ? 'ATIVO' : 'INATIVO'}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span>Auto-discovery:</span>
                    <span style={{ fontWeight: 'bold' }}>
                      {state.liveComponents.autoDiscovery ? 'SIM' : 'NÃO'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span>WebSocket Path:</span>
                    <span style={{ fontFamily: 'monospace', color: '#374151' }}>
                      {state.liveComponents.websocketPath}
                    </span>
                  </div>
                </div>
              </div>

              {/* Performance Settings */}
              <div style={{
                padding: '1.5rem',
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                border: '1px solid #e2e8f0'
              }}>
                <h3 style={{ color: '#374151', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FaBolt style={{ color: '#10b981' }} />
                  Performance
                </h3>
                <div style={{ color: '#6b7280', lineHeight: 1.8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span>Max Connections:</span>
                    <span style={{ fontFamily: 'monospace', color: '#374151' }}>
                      {state.liveComponents.maxConnections.toLocaleString()}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Timeout:</span>
                    <span style={{ fontFamily: 'monospace', color: '#374151' }}>
                      {formatMs(state.liveComponents.timeout)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Security */}
              <div style={{
                padding: '1.5rem',
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                border: '1px solid #e2e8f0'
              }}>
                <h3 style={{ color: '#374151', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FaLock style={{ color: '#f59e0b' }} />
                  Segurança
                </h3>
                <div style={{ color: '#6b7280', lineHeight: 1.8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Signature Secret:</span>
                    <span style={{ fontFamily: 'monospace', color: '#374151' }}>
                      {showSensitive ? state.liveComponents.signatureSecret : '***hidden***'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div>
            <h2 style={{ color: '#374151', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FaLock />
              Configurações de Segurança
            </h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
              gap: '1.5rem'
            }}>
              {/* CORS */}
              <div style={{
                padding: '1.5rem',
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                border: '1px solid #e2e8f0'
              }}>
                <h3 style={{ color: '#374151', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FaGlobe style={{ color: '#3b82f6' }} />
                  CORS
                </h3>
                <div style={{ color: '#6b7280', lineHeight: 1.8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span>Status:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {getStatusIcon(state.security.cors.enabled)}
                      <span style={{ fontWeight: 'bold' }}>
                        {state.security.cors.enabled ? 'ATIVO' : 'INATIVO'}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span>Credentials:</span>
                    <span style={{ fontWeight: 'bold' }}>
                      {state.security.cors.credentials ? 'SIM' : 'NÃO'}
                    </span>
                  </div>
                  <div style={{ marginTop: '1rem' }}>
                    <span style={{ fontWeight: 'bold' }}>Origins Permitidas:</span>
                    <div style={{ marginTop: '0.5rem' }}>
                      {state.security.cors.origins.map((origin, index) => (
                        <div key={index} style={{
                          backgroundColor: '#e0f2fe',
                          padding: '0.5rem',
                          borderRadius: '4px',
                          fontFamily: 'monospace',
                          fontSize: '0.85rem',
                          marginBottom: '0.25rem'
                        }}>
                          {origin}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Rate Limiting */}
              <div style={{
                padding: '1.5rem',
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                border: '1px solid #e2e8f0'
              }}>
                <h3 style={{ color: '#374151', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FaTachometerAlt style={{ color: '#f59e0b' }} />
                  Rate Limiting
                </h3>
                <div style={{ color: '#6b7280', lineHeight: 1.8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span>Status:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {getStatusIcon(state.security.rateLimit.enabled)}
                      <span style={{ fontWeight: 'bold' }}>
                        {state.security.rateLimit.enabled ? 'ATIVO' : 'INATIVO'}
                      </span>
                    </div>
                  </div>
                  {state.security.rateLimit.enabled && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span>Janela:</span>
                        <span style={{ fontFamily: 'monospace', color: '#374151' }}>
                          {formatMs(state.security.rateLimit.windowMs)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Max Requests:</span>
                        <span style={{ fontFamily: 'monospace', color: '#374151' }}>
                          {state.security.rateLimit.maxRequests}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Helmet */}
              <div style={{
                padding: '1.5rem',
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                border: '1px solid #e2e8f0'
              }}>
                <h3 style={{ color: '#374151', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FaLock style={{ color: '#10b981' }} />
                  Helmet (Security Headers)
                </h3>
                <div style={{ color: '#6b7280', lineHeight: 1.8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Status:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {getStatusIcon(state.security.helmet.enabled)}
                      <span style={{ fontWeight: 'bold' }}>
                        {state.security.helmet.enabled ? 'ATIVO' : 'INATIVO'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === 'performance' && (
          <div>
            <h2 style={{ color: '#374151', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FaTachometerAlt />
              Configurações de Performance
            </h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
              gap: '1.5rem'
            }}>
              {/* Compression */}
              <div style={{
                padding: '1.5rem',
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                border: '1px solid #e2e8f0'
              }}>
                <h3 style={{ color: '#374151', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FaDatabase style={{ color: '#3b82f6' }} />
                  Compressão
                </h3>
                <div style={{ color: '#6b7280', lineHeight: 1.8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Status:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {getStatusIcon(state.performance.compression)}
                      <span style={{ fontWeight: 'bold' }}>
                        {state.performance.compression ? 'ATIVO' : 'INATIVO'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cache */}
              <div style={{
                padding: '1.5rem',
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                border: '1px solid #e2e8f0'
              }}>
                <h3 style={{ color: '#374151', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FaMemory style={{ color: '#10b981' }} />
                  Cache
                </h3>
                <div style={{ color: '#6b7280', lineHeight: 1.8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span>Status:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {getStatusIcon(state.performance.cache.enabled)}
                      <span style={{ fontWeight: 'bold' }}>
                        {state.performance.cache.enabled ? 'ATIVO' : 'INATIVO'}
                      </span>
                    </div>
                  </div>
                  {state.performance.cache.enabled && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span>Max Age:</span>
                        <span style={{ fontFamily: 'monospace', color: '#374151' }}>
                          {state.performance.cache.maxAge}s
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Strategy:</span>
                        <span style={{ fontFamily: 'monospace', color: '#374151' }}>
                          {state.performance.cache.strategy}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Clustering */}
              <div style={{
                padding: '1.5rem',
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                border: '1px solid #e2e8f0'
              }}>
                <h3 style={{ color: '#374151', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FaServer style={{ color: '#f59e0b' }} />
                  Clustering
                </h3>
                <div style={{ color: '#6b7280', lineHeight: 1.8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span>Status:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {getStatusIcon(state.performance.clustering.enabled)}
                      <span style={{ fontWeight: 'bold' }}>
                        {state.performance.clustering.enabled ? 'ATIVO' : 'INATIVO'}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Workers:</span>
                    <span style={{ fontFamily: 'monospace', color: '#374151' }}>
                      {state.performance.clustering.workers}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Advanced Tab */}
        {activeTab === 'advanced' && (
          <div>
            <h2 style={{ color: '#374151', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FaTools />
              Configurações Avançadas
            </h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1.5rem'
            }}>
              {Object.entries(state.advanced).map(([key, value]) => (
                <div key={key} style={{
                  padding: '1.5rem',
                  backgroundColor: '#f8fafc',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0'
                }}>
                  <h3 style={{ 
                    color: '#374151', 
                    marginBottom: '1rem',
                    fontSize: '1rem',
                    textTransform: 'capitalize'
                  }}>
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {getStatusIcon(value as boolean)}
                    <span style={{ 
                      fontWeight: 'bold',
                      color: value ? '#10b981' : '#ef4444'
                    }}>
                      {value ? 'ATIVO' : 'INATIVO'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Vite Configuration */}
            <div style={{
              marginTop: '2rem',
              padding: '1.5rem',
              backgroundColor: '#f0f9ff',
              borderRadius: '12px',
              border: '1px solid #0ea5e9'
            }}>
              <h3 style={{ color: '#0369a1', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FaBolt style={{ color: '#0ea5e9' }} />
                Vite Development Server
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                color: '#0369a1'
              }}>
                <div>
                  <span style={{ fontWeight: 'bold' }}>Status:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                    {getStatusIcon(state.vite.enabled)}
                    <span>{state.vite.enabled ? 'ATIVO' : 'INATIVO'}</span>
                  </div>
                </div>
                <div>
                  <span style={{ fontWeight: 'bold' }}>Porta:</span>
                  <div style={{ fontFamily: 'monospace', marginTop: '0.25rem' }}>{state.vite.port}</div>
                </div>
                <div>
                  <span style={{ fontWeight: 'bold' }}>HMR:</span>
                  <div style={{ marginTop: '0.25rem' }}>{state.vite.hmr ? 'SIM' : 'NÃO'}</div>
                </div>
                <div>
                  <span style={{ fontWeight: 'bold' }}>Build Dir:</span>
                  <div style={{ fontFamily: 'monospace', marginTop: '0.25rem' }}>{state.vite.buildDir}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        marginTop: '2rem',
        padding: '1rem 1.5rem',
        backgroundColor: '#f8fafc',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        color: '#6b7280',
        fontSize: '0.9rem'
      }}>
        <span>
          Última atualização: {new Date(state.lastUpdated).toLocaleString('pt-BR')}
        </span>
        <span>
          🔥 FluxStack v{state.framework.version} • {state.environment.toUpperCase()}
        </span>
      </div>
    </div>
  )
}