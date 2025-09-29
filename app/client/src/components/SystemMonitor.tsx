// 🔥 System Monitor Dashboard Component

import React, { useState, useEffect } from 'react'
import { useHybridLiveComponent } from '../../../../core/client/hooks/useHybridLiveComponent'
import { 
  FaServer, 
  FaUsers, 
  FaHome, 
  FaMemory,
  FaHeartbeat,
  FaChartLine,
  FaClock,
  FaWifi,
  FaPlay,
  FaPause,
  FaSync,
  FaTrash,
  FaInfo,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
  FaCog,
  FaEye,
  FaBolt,
  FaDatabase,
  FaStop
} from 'react-icons/fa'

export interface SystemMonitorState {
  totalComponents: number
  activeConnections: number
  totalRooms: number
  messagesPerSecond: number
  averageResponseTime: number
  componentsByType: Record<string, number>
  roomDetails: Record<string, number>
  memoryUsage: {
    used: number
    total: number
    percentage: number
  }
  recentConnections: Array<{
    id: string
    timestamp: number
    componentType: string
    status: 'connected' | 'disconnected' | 'rehydrated'
  }>
  recentMessages: Array<{
    id: string
    timestamp: number
    type: string
    componentId: string
    success: boolean
    responseTime?: number
  }>
  systemHealth: {
    status: 'healthy' | 'warning' | 'critical'
    uptime: number
    lastRestart: number
    errors: number
    warnings: number
  }
  autoRefresh: boolean
  refreshInterval: number
  lastUpdated: number
}

const initialState: SystemMonitorState = {
  totalComponents: 0,
  activeConnections: 0,
  totalRooms: 0,
  messagesPerSecond: 0,
  averageResponseTime: 0,
  componentsByType: {},
  roomDetails: {},
  memoryUsage: {
    used: 0,
    total: 0,
    percentage: 0
  },
  recentConnections: [],
  recentMessages: [],
  systemHealth: {
    status: 'healthy',
    uptime: 0,
    lastRestart: Date.now(),
    errors: 0,
    warnings: 0
  },
  autoRefresh: true,
  refreshInterval: 2000,
  lastUpdated: Date.now()
}

export function SystemMonitor() {
  const { state, call, connected, status, error } = useHybridLiveComponent<SystemMonitorState>(
    'SystemMonitor', 
    initialState,
    { debug: true }
  )

  const [selectedTab, setSelectedTab] = useState<'overview' | 'components' | 'activity' | 'system'>('overview')

  // Show loading state
  if (!connected || status !== 'synced') {
    const getStatusMessage = () => {
      switch (status) {
        case 'connecting':
          return '🔄 Conectando ao monitoramento...'
        case 'reconnecting':
          return '🔄 Reconectando sistema...'
        case 'mounting':
          return '🚀 Iniciando monitoramento...'
        case 'loading':
          return '⏳ Carregando métricas...'
        case 'error':
          return '❌ Erro no monitoramento'
        default:
          return '🔄 Preparando sistema...'
      }
    }

    return (
      <div style={{
        padding: '4rem',
        textAlign: 'center',
        backgroundColor: '#f8fafc',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <FaServer size={48} style={{ marginBottom: '2rem', color: '#6b7280' }} />
        <h2 style={{ color: '#374151', marginBottom: '1rem' }}>
          Sistema de Monitoramento
        </h2>
        <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
          {getStatusMessage()}
        </p>
        {error && (
          <div style={{
            backgroundColor: '#fee2e2',
            color: '#dc2626',
            padding: '1rem',
            borderRadius: '8px',
            border: '1px solid #fecaca'
          }}>
            {error}
          </div>
        )}
      </div>
    )
  }

  const handleToggleAutoRefresh = async () => {
    try {
      await call('toggleAutoRefresh')
    } catch (error) {
      console.error('Toggle auto-refresh error:', error)
    }
  }

  const handleRefreshMetrics = async () => {
    try {
      await call('refreshMetrics')
    } catch (error) {
      console.error('Refresh metrics error:', error)
    }
  }

  const handleEmergencyStop = async () => {
    try {
      await call('emergencyStop')
    } catch (error) {
      console.error('Emergency stop error:', error)
    }
  }

  const handleClearActivity = async () => {
    try {
      await call('clearActivity')
    } catch (error) {
      console.error('Clear activity error:', error)
    }
  }

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours}h ${minutes}m ${secs}s`
  }

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <FaCheckCircle style={{ color: '#10b981' }} />
      case 'warning':
        return <FaExclamationTriangle style={{ color: '#f59e0b' }} />
      case 'critical':
        return <FaTimesCircle style={{ color: '#ef4444' }} />
      default:
        return <FaHeartbeat style={{ color: '#6b7280' }} />
    }
  }

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return '#10b981'
      case 'warning':
        return '#f59e0b'
      case 'critical':
        return '#ef4444'
      default:
        return '#6b7280'
    }
  }

  const getConnectionStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <FaWifi style={{ color: '#10b981' }} />
      case 'disconnected':
        return <FaTimesCircle style={{ color: '#ef4444' }} />
      case 'rehydrated':
        return <FaSync style={{ color: '#3b82f6' }} />
      default:
        return <FaWifi style={{ color: '#6b7280' }} />
    }
  }

  return (
    <div style={{
      padding: '2rem',
      backgroundColor: '#f8fafc',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{
        marginBottom: '2rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <FaServer size={32} style={{ color: '#374151' }} />
            <div>
              <h1 style={{ 
                color: '#374151', 
                margin: 0,
                fontSize: '2rem'
              }}>
                🔥 Sistema de Monitoramento
              </h1>
              <p style={{ 
                color: '#6b7280', 
                margin: 0,
                fontSize: '1.1rem'
              }}>
                Monitoramento em tempo real dos Live Components
              </p>
            </div>
          </div>

          {/* Controls */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            alignItems: 'center'
          }}>
            <button
              onClick={handleToggleAutoRefresh}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: state.autoRefresh ? '#10b981' : '#6b7280',
                color: 'white',
                fontSize: '0.9rem'
              }}
            >
              {state.autoRefresh ? <FaPause /> : <FaPlay />}
              {state.autoRefresh ? 'Pausar' : 'Iniciar'}
            </button>

            <button
              onClick={handleRefreshMetrics}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                cursor: 'pointer',
                backgroundColor: 'white',
                color: '#374151',
                fontSize: '0.9rem'
              }}
            >
              <FaSync />
              Atualizar
            </button>

            <button
              onClick={handleClearActivity}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                cursor: 'pointer',
                backgroundColor: 'white',
                color: '#ef4444',
                fontSize: '0.9rem'
              }}
            >
              <FaTrash />
              Limpar
            </button>

            <button
              onClick={handleEmergencyStop}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                border: '2px solid #dc2626',
                cursor: 'pointer',
                backgroundColor: '#dc2626',
                color: 'white',
                fontSize: '0.9rem',
                fontWeight: 'bold'
              }}
            >
              <FaStop />
              🚨 PARAR TUDO
            </button>
          </div>
        </div>

        {/* Status Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2rem',
          padding: '1rem',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {getHealthIcon(state.systemHealth.status)}
            <span style={{ 
              color: getHealthColor(state.systemHealth.status),
              fontWeight: 'bold'
            }}>
              {state.systemHealth.status.charAt(0).toUpperCase() + state.systemHealth.status.slice(1)}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaClock style={{ color: '#6b7280' }} />
            <span style={{ color: '#374151' }}>
              Uptime: {formatUptime(state.systemHealth.uptime)}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaSync style={{ color: '#6b7280' }} />
            <span style={{ color: '#374151' }}>
              Auto-refresh: {state.autoRefresh ? 'ON' : 'OFF'} 
              ({state.refreshInterval}ms)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaClock style={{ color: '#6b7280' }} />
            <span style={{ color: '#374151' }}>
              Última atualização: {formatTimestamp(state.lastUpdated)}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        {[
          { id: 'overview', label: 'Visão Geral', icon: <FaChartLine /> },
          { id: 'components', label: 'Componentes', icon: <FaBolt /> },
          { id: 'activity', label: 'Atividade', icon: <FaEye /> },
          { id: 'system', label: 'Sistema', icon: <FaDatabase /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id as any)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '1rem 1.5rem',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: selectedTab === tab.id ? '#3b82f6' : 'white',
              color: selectedTab === tab.id ? 'white' : '#374151',
              fontSize: '0.95rem',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {selectedTab === 'overview' && (
        <div>
          {/* Metrics Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            {[
              {
                title: 'Componentes Ativos',
                value: state.totalComponents,
                icon: <FaBolt />,
                color: '#3b82f6',
                subtitle: 'Live Components'
              },
              {
                title: 'Conexões WebSocket',
                value: state.activeConnections,
                icon: <FaWifi />,
                color: '#10b981',
                subtitle: 'Conexões ativas'
              },
              {
                title: 'Salas',
                value: state.totalRooms,
                icon: <FaHome />,
                color: '#f59e0b',
                subtitle: 'Rooms ativas'
              },
              {
                title: 'Mensagens/seg',
                value: state.messagesPerSecond,
                icon: <FaChartLine />,
                color: '#8b5cf6',
                subtitle: 'Taxa de mensagens'
              },
              {
                title: 'Tempo de Resposta',
                value: `${state.averageResponseTime}ms`,
                icon: <FaClock />,
                color: '#06b6d4',
                subtitle: 'Tempo médio'
              },
              {
                title: 'Uso de Memória',
                value: `${state.memoryUsage.percentage}%`,
                icon: <FaMemory />,
                color: state.memoryUsage.percentage > 75 ? '#ef4444' : '#10b981',
                subtitle: `${state.memoryUsage.used}MB / ${state.memoryUsage.total}MB`
              }
            ].map((metric, index) => (
              <div key={index} style={{
                backgroundColor: 'white',
                padding: '2rem',
                borderRadius: '16px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{
                    backgroundColor: metric.color,
                    padding: '0.75rem',
                    borderRadius: '12px',
                    color: 'white',
                    fontSize: '1.2rem'
                  }}>
                    {metric.icon}
                  </div>
                  <div>
                    <h3 style={{ 
                      margin: 0, 
                      fontSize: '1rem',
                      color: '#374151'
                    }}>
                      {metric.title}
                    </h3>
                    <p style={{
                      margin: 0,
                      fontSize: '1.8rem',
                      fontWeight: 'bold',
                      color: metric.color
                    }}>
                      {metric.value}
                    </p>
                    <p style={{
                      margin: 0,
                      fontSize: '0.9rem',
                      color: '#6b7280'
                    }}>
                      {metric.subtitle}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* System Health */}
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '16px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            marginBottom: '2rem'
          }}>
            <h3 style={{ 
              color: '#374151', 
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <FaHeartbeat />
              Status do Sistema
            </h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem'
            }}>
              <div style={{
                padding: '1rem',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.5rem'
                }}>
                  {getHealthIcon(state.systemHealth.status)}
                  <span style={{ fontWeight: 'bold', color: '#374151' }}>
                    Status Geral
                  </span>
                </div>
                <p style={{ 
                  margin: 0, 
                  color: getHealthColor(state.systemHealth.status),
                  fontWeight: 'bold'
                }}>
                  {state.systemHealth.status.toUpperCase()}
                </p>
              </div>

              <div style={{
                padding: '1rem',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.5rem'
                }}>
                  <FaTimesCircle style={{ color: '#ef4444' }} />
                  <span style={{ fontWeight: 'bold', color: '#374151' }}>
                    Erros
                  </span>
                </div>
                <p style={{ margin: 0, color: '#ef4444', fontWeight: 'bold' }}>
                  {state.systemHealth.errors}
                </p>
              </div>

              <div style={{
                padding: '1rem',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.5rem'
                }}>
                  <FaExclamationTriangle style={{ color: '#f59e0b' }} />
                  <span style={{ fontWeight: 'bold', color: '#374151' }}>
                    Avisos
                  </span>
                </div>
                <p style={{ margin: 0, color: '#f59e0b', fontWeight: 'bold' }}>
                  {state.systemHealth.warnings}
                </p>
              </div>

              <div style={{
                padding: '1rem',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.5rem'
                }}>
                  <FaClock style={{ color: '#6b7280' }} />
                  <span style={{ fontWeight: 'bold', color: '#374151' }}>
                    Uptime
                  </span>
                </div>
                <p style={{ margin: 0, color: '#374151', fontWeight: 'bold' }}>
                  {formatUptime(state.systemHealth.uptime)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedTab === 'components' && (
        <div>
          {/* Components by Type */}
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '16px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            marginBottom: '2rem'
          }}>
            <h3 style={{ 
              color: '#374151', 
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <FaBolt />
              Componentes por Tipo
            </h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem'
            }}>
              {Object.entries(state.componentsByType).map(([type, count]) => (
                <div key={type} style={{
                  padding: '1.5rem',
                  backgroundColor: '#f8fafc',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  textAlign: 'center'
                }}>
                  <h4 style={{ 
                    margin: '0 0 0.5rem 0',
                    color: '#374151',
                    fontSize: '1rem'
                  }}>
                    {type}
                  </h4>
                  <p style={{
                    margin: 0,
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    color: count > 0 ? '#10b981' : '#6b7280'
                  }}>
                    {count}
                  </p>
                  <p style={{
                    margin: 0,
                    fontSize: '0.9rem',
                    color: '#6b7280'
                  }}>
                    {count === 1 ? 'instância' : 'instâncias'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Room Details */}
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '16px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ 
              color: '#374151', 
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <FaHome />
              Salas Ativas
            </h3>

            {Object.keys(state.roomDetails).length > 0 ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem'
              }}>
                {Object.entries(state.roomDetails).map(([room, count]) => (
                  <div key={room} style={{
                    padding: '1.5rem',
                    backgroundColor: '#f0f9ff',
                    borderRadius: '12px',
                    border: '1px solid #bae6fd',
                    textAlign: 'center'
                  }}>
                    <h4 style={{ 
                      margin: '0 0 0.5rem 0',
                      color: '#0369a1',
                      fontSize: '1rem'
                    }}>
                      {room}
                    </h4>
                    <p style={{
                      margin: 0,
                      fontSize: '2rem',
                      fontWeight: 'bold',
                      color: '#0284c7'
                    }}>
                      {count}
                    </p>
                    <p style={{
                      margin: 0,
                      fontSize: '0.9rem',
                      color: '#0369a1'
                    }}>
                      {count === 1 ? 'componente' : 'componentes'}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '3rem',
                color: '#6b7280'
              }}>
                <FaHome size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <p>Nenhuma sala ativa no momento</p>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedTab === 'activity' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '2rem'
        }}>
          {/* Recent Connections */}
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '16px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ 
              color: '#374151', 
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <FaWifi />
              Conexões Recentes
            </h3>

            {state.recentConnections.length > 0 ? (
              <div style={{
                maxHeight: '400px',
                overflowY: 'auto'
              }}>
                {state.recentConnections.slice(0, 20).map(connection => (
                  <div key={connection.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1rem',
                    marginBottom: '0.5rem',
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0'
                  }}>
                    {getConnectionStatusIcon(connection.status)}
                    <div style={{ flex: 1 }}>
                      <p style={{ 
                        margin: 0, 
                        fontWeight: 'bold',
                        color: '#374151'
                      }}>
                        {connection.componentType}
                      </p>
                      <p style={{ 
                        margin: 0, 
                        fontSize: '0.9rem',
                        color: '#6b7280'
                      }}>
                        {connection.status} - {formatTimestamp(connection.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '3rem',
                color: '#6b7280'
              }}>
                <FaWifi size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <p>Nenhuma conexão recente</p>
              </div>
            )}
          </div>

          {/* Recent Messages */}
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '16px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ 
              color: '#374151', 
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <FaBolt />
              Mensagens Recentes
            </h3>

            {state.recentMessages.length > 0 ? (
              <div style={{
                maxHeight: '400px',
                overflowY: 'auto'
              }}>
                {state.recentMessages.slice(0, 20).map(message => (
                  <div key={message.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1rem',
                    marginBottom: '0.5rem',
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0'
                  }}>
                    {message.success ? 
                      <FaCheckCircle style={{ color: '#10b981' }} /> :
                      <FaTimesCircle style={{ color: '#ef4444' }} />
                    }
                    <div style={{ flex: 1 }}>
                      <p style={{ 
                        margin: 0, 
                        fontWeight: 'bold',
                        color: '#374151'
                      }}>
                        {message.type}
                      </p>
                      <p style={{ 
                        margin: 0, 
                        fontSize: '0.9rem',
                        color: '#6b7280'
                      }}>
                        {message.componentId.substring(0, 8)}... - {formatTimestamp(message.timestamp)}
                        {message.responseTime && ` (${message.responseTime}ms)`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '3rem',
                color: '#6b7280'
              }}>
                <FaBolt size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <p>Nenhuma mensagem recente</p>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedTab === 'system' && (
        <div>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '16px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ 
              color: '#374151', 
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <FaInfo />
              Informações do Sistema
            </h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1.5rem'
            }}>
              <div style={{
                padding: '1.5rem',
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                border: '1px solid #e2e8f0'
              }}>
                <h4 style={{ color: '#374151', marginBottom: '1rem' }}>
                  Performance
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6b7280' }}>Memória Usada:</span>
                    <span style={{ color: '#374151', fontWeight: 'bold' }}>
                      {state.memoryUsage.used}MB
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6b7280' }}>Memória Total:</span>
                    <span style={{ color: '#374151', fontWeight: 'bold' }}>
                      {state.memoryUsage.total}MB
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6b7280' }}>Uso de Memória:</span>
                    <span style={{ 
                      color: state.memoryUsage.percentage > 75 ? '#ef4444' : '#10b981',
                      fontWeight: 'bold'
                    }}>
                      {state.memoryUsage.percentage}%
                    </span>
                  </div>
                </div>
              </div>

              <div style={{
                padding: '1.5rem',
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                border: '1px solid #e2e8f0'
              }}>
                <h4 style={{ color: '#374151', marginBottom: '1rem' }}>
                  Configurações
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6b7280' }}>Auto-refresh:</span>
                    <span style={{ 
                      color: state.autoRefresh ? '#10b981' : '#ef4444',
                      fontWeight: 'bold'
                    }}>
                      {state.autoRefresh ? 'ATIVO' : 'INATIVO'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6b7280' }}>Intervalo:</span>
                    <span style={{ color: '#374151', fontWeight: 'bold' }}>
                      {state.refreshInterval}ms
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6b7280' }}>Última atualização:</span>
                    <span style={{ color: '#374151', fontWeight: 'bold' }}>
                      {formatTimestamp(state.lastUpdated)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}