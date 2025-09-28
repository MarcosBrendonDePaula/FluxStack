// 🔥 Main Layout with Sidebar Navigation

import React, { useState } from 'react'
import { SidebarNavigation } from './SidebarNavigation'
import { UserProfile } from './UserProfile'
import { FaHome, FaCog, FaFolder, FaChartBar, FaRocket } from 'react-icons/fa'

// Temporary placeholder components for other pages
function Dashboard() {
  return (
    <div style={{
      padding: '2rem',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '20px',
        padding: '3rem',
        color: 'white',
        textAlign: 'center',
        marginBottom: '2rem'
      }}>
        <FaRocket size={48} style={{ marginBottom: '1rem' }} />
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
          🔥 FluxStack Dashboard
        </h1>
        <p style={{ fontSize: '1.2rem', opacity: 0.9 }}>
          Bem-vindo ao seu painel de controle interativo!
        </p>
      </div>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '2rem',
        marginTop: '2rem'
      }}>
        {/* Stats Cards */}
        {[
          { title: 'Live Components', value: '5', icon: FaRocket, color: '#3b82f6' },
          { title: 'WebSocket Conexões', value: '12', icon: FaHome, color: '#10b981' },
          { title: 'Uploads Ativos', value: '3', icon: FaFolder, color: '#f59e0b' },
          { title: 'Usuários Online', value: '8', icon: FaChartBar, color: '#ef4444' }
        ].map((stat, index) => {
          const Icon = stat.icon
          return (
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
                  backgroundColor: stat.color,
                  padding: '0.75rem',
                  borderRadius: '12px',
                  color: 'white'
                }}>
                  <Icon size={24} />
                </div>
                <div>
                  <h3 style={{ 
                    margin: 0, 
                    fontSize: '1.1rem',
                    color: '#374151'
                  }}>
                    {stat.title}
                  </h3>
                  <p style={{
                    margin: 0,
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    color: stat.color
                  }}>
                    {stat.value}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '16px',
        marginTop: '2rem',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <h2 style={{ color: '#374151', marginBottom: '1rem' }}>
          📊 Sistema de Live Components
        </h2>
        <p style={{ color: '#6b7280', lineHeight: 1.6 }}>
          Este dashboard demonstra o poder dos Live Components do FluxStack. 
          Navegue pelo menu lateral para explorar diferentes seções como 
          Perfil de Usuário, Configurações, Gerenciamento de Arquivos e Analytics.
          Tudo funcionando com WebSockets em tempo real e estado persistido!
        </p>
        
        <div style={{
          marginTop: '1.5rem',
          padding: '1rem',
          backgroundColor: '#f0f9ff',
          borderRadius: '8px',
          border: '1px solid #0ea5e9'
        }}>
          <h4 style={{ color: '#0369a1', margin: '0 0 0.5rem 0' }}>
            🎯 Funcionalidades Ativas:
          </h4>
          <ul style={{ color: '#0369a1', margin: 0, paddingLeft: '1.5rem' }}>
            <li>✅ Reconexão automática com re-hydration</li>
            <li>✅ Estado criptograficamente assinado</li>
            <li>✅ Interface sem piscadas (optimized loading)</li>
            <li>✅ Navegação via Live Components</li>
            <li>✅ Upload de arquivos por chunks via WebSocket</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

function Settings() {
  return (
    <div style={{
      padding: '2rem',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '16px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <FaCog size={32} style={{ color: '#6b7280' }} />
          <h1 style={{ color: '#374151', margin: 0 }}>Configurações</h1>
        </div>
        
        <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
          Painel de configurações do FluxStack. Aqui você pode ajustar 
          preferências do sistema, configurar integrações e gerenciar 
          suas configurações de usuário.
        </p>
        
        <div style={{
          padding: '1.5rem',
          backgroundColor: '#fef3c7',
          borderRadius: '8px',
          border: '1px solid #f59e0b'
        }}>
          <h3 style={{ color: '#92400e', margin: '0 0 1rem 0' }}>
            🚧 Em Desenvolvimento
          </h3>
          <p style={{ color: '#92400e', margin: 0 }}>
            Esta seção será expandida com configurações avançadas, 
            integrações de API, configurações de tema personalizadas 
            e muito mais!
          </p>
        </div>
      </div>
    </div>
  )
}

function Files() {
  return (
    <div style={{
      padding: '2rem',
      maxWidth: '1000px',
      margin: '0 auto'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '16px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <FaFolder size={32} style={{ color: '#6b7280' }} />
          <h1 style={{ color: '#374151', margin: 0 }}>Gerenciamento de Arquivos</h1>
        </div>
        
        <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
          Sistema avançado de upload e gerenciamento de arquivos via WebSocket.
          Suporte a upload por chunks, progress em tempo real e armazenamento seguro.
        </p>
        
        <div style={{
          padding: '1.5rem',
          backgroundColor: '#f0fdf4',
          borderRadius: '8px',
          border: '1px solid #10b981',
          marginBottom: '2rem'
        }}>
          <h3 style={{ color: '#047857', margin: '0 0 1rem 0' }}>
            ✅ Funcionalidades Implementadas
          </h3>
          <ul style={{ color: '#047857', margin: 0, paddingLeft: '1.5rem' }}>
            <li>Upload via WebSocket com chunks</li>
            <li>Progress tracking em tempo real</li>
            <li>Validação de tipos de arquivo</li>
            <li>Armazenamento organizado por categorias</li>
            <li>Preview de imagens integrado</li>
          </ul>
        </div>
        
        <div style={{
          padding: '1.5rem',
          backgroundColor: '#fef3c7',
          borderRadius: '8px',
          border: '1px solid #f59e0b'
        }}>
          <h3 style={{ color: '#92400e', margin: '0 0 1rem 0' }}>
            🔄 Próximas Features
          </h3>
          <ul style={{ color: '#92400e', margin: 0, paddingLeft: '1.5rem' }}>
            <li>Galeria de arquivos com busca</li>
            <li>Compartilhamento de arquivos</li>
            <li>Versionamento de documentos</li>
            <li>Integração com storage cloud</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

function Analytics() {
  return (
    <div style={{
      padding: '2rem',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '16px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <FaChartBar size={32} style={{ color: '#6b7280' }} />
          <h1 style={{ color: '#374151', margin: 0 }}>Analytics & Métricas</h1>
        </div>
        
        <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
          Dashboard de analytics com métricas em tempo real do sistema FluxStack.
          Monitoramento de performance, uso de recursos e estatísticas de usuário.
        </p>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          {[
            { title: 'WebSocket Connections', value: '127', trend: '+12%' },
            { title: 'Live Components', value: '34', trend: '+8%' },
            { title: 'Messages/sec', value: '2.3k', trend: '+15%' },
            { title: 'Uptime', value: '99.8%', trend: '+0.1%' }
          ].map((metric, index) => (
            <div key={index} style={{
              padding: '1.5rem',
              backgroundColor: '#f8fafc',
              borderRadius: '12px',
              border: '1px solid #e2e8f0'
            }}>
              <h3 style={{ 
                color: '#475569',
                fontSize: '0.9rem',
                margin: '0 0 0.5rem 0',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                {metric.title}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: '#1e293b'
                }}>
                  {metric.value}
                </span>
                <span style={{
                  fontSize: '0.9rem',
                  color: '#10b981',
                  backgroundColor: '#f0fdf4',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px'
                }}>
                  {metric.trend}
                </span>
              </div>
            </div>
          ))}
        </div>
        
        <div style={{
          padding: '1.5rem',
          backgroundColor: '#eff6ff',
          borderRadius: '8px',
          border: '1px solid #3b82f6'
        }}>
          <h3 style={{ color: '#1d4ed8', margin: '0 0 1rem 0' }}>
            📈 Métricas em Tempo Real
          </h3>
          <p style={{ color: '#1d4ed8', margin: 0 }}>
            Todas as métricas são coletadas e atualizadas via Live Components,
            proporcionando visibilidade instantânea do sistema em produção.
          </p>
        </div>
      </div>
    </div>
  )
}

export function MainLayout() {
  const [currentPage, setCurrentPage] = useState('dashboard')

  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />
      case 'profile':
        return <UserProfile />
      case 'settings':
        return <Settings />
      case 'files':
        return <Files />
      case 'analytics':
        return <Analytics />
      default:
        return <Dashboard />
    }
  }

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      backgroundColor: '#f8fafc'
    }}>
      {/* Sidebar */}
      <SidebarNavigation onPageChange={setCurrentPage} />
      
      {/* Main Content */}
      <main style={{
        flex: 1,
        overflow: 'auto',
        height: '100vh'
      }}>
        {renderContent()}
      </main>
    </div>
  )
}