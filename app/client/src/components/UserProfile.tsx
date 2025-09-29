import React, { useState } from 'react';
import { useHybridLiveComponent, useChunkedUpload } from '../lib/fluxstack';
import { 
  FaUser, 
  FaEdit, 
  FaMapMarkerAlt, 
  FaCalendarAlt, 
  FaUsers, 
  FaHeart, 
  FaNewspaper, 
  FaBell, 
  FaSun, 
  FaMoon,
  FaCircle,
  FaUserPlus,
  FaCheck,
  FaTimes,
  FaEnvelope,
  FaCamera,
  FaUpload,
  FaSpinner
} from 'react-icons/fa';

interface UserProfileState {
  name: string;
  email: string;
  avatar: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  bio: string;
  location: string;
  joinedDate: string;
  followers: number;
  following: number;
  posts: number;
  isEditing: boolean;
  lastActivity: string;
  theme: 'light' | 'dark';
  notifications: number;
}

const initialState: UserProfileState = {
  name: "Loading...",
  email: "",
  avatar: "",
  status: "offline",
  bio: "",
  location: "",
  joinedDate: "",
  followers: 0,
  following: 0,
  posts: 0,
  isEditing: false,
  lastActivity: "",
  theme: "light",
  notifications: 0
};

export function UserProfile() {
  const { state, call, connected, status, componentId, sendMessageAndWait, error } = useHybridLiveComponent<UserProfileState>('UserProfile', initialState, {
    debug: true // Enable debug logs to track re-hydration
  });
  
  const chunkedUpload = useChunkedUpload(componentId, {
    sendMessageAndWait,
    onProgress: (progress, bytesUploaded, totalBytes) => {
      console.log(`📊 Upload progress: ${progress}% (${bytesUploaded}/${totalBytes} bytes)`)
    },
    onComplete: async (response) => {
      console.log('✅ Chunked upload completed:', response.fileUrl)
      if (response.fileUrl) {
        await call('updateAvatar', { imageUrl: response.fileUrl })
        setShowPhotoUpload(false)
      }
    },
    onError: (error) => {
      console.error('❌ Chunked upload error:', error)
      alert(`Erro no upload: ${error}`)
    }
  });
  
  const [editForm, setEditForm] = useState({
    name: state.name,
    bio: state.bio,
    location: state.location
  });
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setEditForm({
      name: state.name,
      bio: state.bio,
      location: state.location
    });
  }, [state.name, state.bio, state.location]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return '#10b981';
      case 'away': return '#f59e0b';
      case 'busy': return '#ef4444';
      case 'offline': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'Online';
      case 'away': return 'Ausente';
      case 'busy': return 'Ocupado';
      case 'offline': return 'Offline';
      default: return 'Desconhecido';
    }
  };

  const handleSaveEdit = async () => {
    await call('updateProfile', editForm);
    await call('toggleEdit');
  };

  const handleCancelEdit = async () => {
    setEditForm({
      name: state.name,
      bio: state.bio,
      location: state.location
    });
    await call('toggleEdit');
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    // Check if Live Component is connected
    if (!connected || status !== 'synced') {
      alert('Aguarde a conexão do Live Component ser estabelecida...')
      return
    }

    console.log('🚀 Starting chunked WebSocket upload for:', file.name)
    await chunkedUpload.uploadFile(file)
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  // Show connection status
  if (!connected || status !== 'synced') {
    const getStatusMessage = () => {
      switch (status) {
        case 'connecting':
          return '🔄 Conectando ao UserProfile...'
        case 'reconnecting':
          return '🔄 Reconectando componente...'
        case 'mounting':
          return '🚀 Montando componente...'
        case 'loading':
          return '⏳ Carregando...'
        case 'error':
          return '❌ Erro de conexão'
        default:
          return '🔄 Preparando componente...'
      }
    }

    return (
      <div style={{ 
        padding: '2rem', 
        textAlign: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        borderRadius: '16px',
        margin: '1rem'
      }}>
        <FaUser size={32} style={{ marginBottom: '1rem' }} />
        <p>{getStatusMessage()}</p>
        {error && (
          <p style={{ fontSize: '0.9rem', marginTop: '0.5rem', opacity: 0.8 }}>
            {error}
          </p>
        )}
      </div>
    );
  }

  const isDark = state.theme === 'dark';
  const bgColor = isDark ? '#1f2937' : '#ffffff';
  const textColor = isDark ? '#f9fafb' : '#111827';
  const secondaryColor = isDark ? '#9ca3af' : '#6b7280';
  const borderColor = isDark ? '#374151' : '#e5e7eb';

  return (
    <div style={{
      backgroundColor: bgColor,
      color: textColor,
      borderRadius: '20px',
      padding: '2rem',
      margin: '1rem',
      boxShadow: isDark 
        ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)' 
        : '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      border: `1px solid ${borderColor}`,
      maxWidth: '450px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Header with Status and Theme Toggle */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FaCircle 
            size={12} 
            style={{ color: getStatusColor(state.status) }}
          />
          <span style={{ fontSize: '0.875rem', color: secondaryColor }}>
            {getStatusText(state.status)} • {status === 'synced' ? '🟢' : '🔴'} Live
          </span>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {state.notifications > 0 && (
            <button
              onClick={() => call('clearNotifications')}
              style={{
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '0.75rem',
                position: 'relative'
              }}
            >
              <FaBell size={12} />
              <span style={{
                position: 'absolute',
                top: '-5px',
                right: '-5px',
                background: '#dc2626',
                color: 'white',
                borderRadius: '50%',
                width: '16px',
                height: '16px',
                fontSize: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {state.notifications}
              </span>
            </button>
          )}
          
          <button
            onClick={() => call('toggleTheme')}
            style={{
              background: 'transparent',
              color: textColor,
              border: `1px solid ${borderColor}`,
              borderRadius: '8px',
              padding: '0.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            {isDark ? <FaSun size={14} /> : <FaMoon size={14} />}
          </button>
        </div>
      </div>

      {/* Avatar and Basic Info */}
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: '1rem' }}>
          {state.avatar ? (
            <img 
              src={state.avatar} 
              alt={state.name}
              style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                border: `4px solid ${getStatusColor(state.status)}`,
                objectFit: 'cover'
              }}
            />
          ) : (
            <div 
              style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                border: `4px solid ${getStatusColor(state.status)}`,
                backgroundColor: '#f0f0f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                color: '#999'
              }}
            >
              👤
            </div>
          )}
          <button
            onClick={() => call('toggleStatus')}
            style={{
              position: 'absolute',
              bottom: '0',
              right: '0',
              background: getStatusColor(state.status),
              border: `2px solid ${bgColor}`,
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <FaCircle size={8} color="white" />
          </button>
          
          <button
            onClick={() => setShowPhotoUpload(true)}
            style={{
              position: 'absolute',
              top: '0',
              right: '0',
              background: isDark ? '#4f46e5' : '#6366f1',
              border: `2px solid ${bgColor}`,
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
            }}
          >
            <FaCamera size={14} color="white" />
          </button>
        </div>

        {state.isEditing ? (
          <div style={{ marginBottom: '1rem' }}>
            <input
              type="text"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              style={{
                background: isDark ? '#374151' : '#f9fafb',
                color: textColor,
                border: `1px solid ${borderColor}`,
                borderRadius: '8px',
                padding: '0.5rem',
                marginBottom: '0.5rem',
                width: '100%',
                fontSize: '1.25rem',
                fontWeight: 'bold',
                textAlign: 'center'
              }}
            />
          </div>
        ) : (
          <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem' }}>
            {state.name}
          </h2>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <FaEnvelope size={14} style={{ color: secondaryColor }} />
          <span style={{ color: secondaryColor, fontSize: '0.875rem' }}>
            {state.email}
          </span>
        </div>
      </div>

      {/* Bio */}
      <div style={{ marginBottom: '1.5rem' }}>
        {state.isEditing ? (
          <textarea
            value={editForm.bio}
            onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
            placeholder="Conte um pouco sobre você..."
            style={{
              background: isDark ? '#374151' : '#f9fafb',
              color: textColor,
              border: `1px solid ${borderColor}`,
              borderRadius: '8px',
              padding: '0.75rem',
              width: '100%',
              minHeight: '80px',
              resize: 'vertical',
              fontSize: '0.875rem'
            }}
          />
        ) : (
          <p style={{ 
            color: secondaryColor, 
            fontSize: '0.875rem', 
            lineHeight: '1.5',
            textAlign: 'center',
            margin: '0',
            fontStyle: state.bio ? 'normal' : 'italic'
          }}>
            {state.bio || 'Nenhuma biografia ainda...'}
          </p>
        )}
      </div>

      {/* Location */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: '0.5rem',
        marginBottom: '1.5rem'
      }}>
        <FaMapMarkerAlt size={14} style={{ color: secondaryColor }} />
        {state.isEditing ? (
          <input
            type="text"
            value={editForm.location}
            onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
            placeholder="Sua localização"
            style={{
              background: 'transparent',
              color: textColor,
              border: 'none',
              borderBottom: `1px solid ${borderColor}`,
              padding: '0.25rem',
              fontSize: '0.875rem',
              textAlign: 'center',
              width: '150px'
            }}
          />
        ) : (
          <span style={{ color: secondaryColor, fontSize: '0.875rem' }}>
            {state.location || 'Localização não informada'}
          </span>
        )}
      </div>

      {/* Stats */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: '1rem',
        marginBottom: '1.5rem',
        padding: '1rem',
        background: isDark ? '#374151' : '#f9fafb',
        borderRadius: '12px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: textColor }}>
            {state.posts}
          </div>
          <div style={{ fontSize: '0.75rem', color: secondaryColor, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
            <FaNewspaper size={10} /> Posts
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: textColor }}>
            {state.followers.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: secondaryColor, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
            <FaUsers size={10} /> Seguidores
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: textColor }}>
            {state.following}
          </div>
          <div style={{ fontSize: '0.75rem', color: secondaryColor, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
            <FaHeart size={10} /> Seguindo
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {state.isEditing ? (
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={handleSaveEdit}
            style={{
              flex: 1,
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '0.75rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              fontWeight: '500'
            }}
          >
            <FaCheck size={14} /> Salvar
          </button>
          <button
            onClick={handleCancelEdit}
            style={{
              flex: 1,
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '0.75rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              fontWeight: '500'
            }}
          >
            <FaTimes size={14} /> Cancelar
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => call('toggleEdit')}
            style={{
              flex: 1,
              background: isDark ? '#4f46e5' : '#6366f1',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '0.75rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              fontWeight: '500'
            }}
          >
            <FaEdit size={14} /> Editar
          </button>
          <button
            onClick={() => call('followUser')}
            style={{
              flex: 1,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '0.75rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              fontWeight: '500'
            }}
          >
            <FaUserPlus size={14} /> Seguir
          </button>
        </div>
      )}

      {/* Footer Info */}
      <div style={{ 
        marginTop: '1.5rem',
        paddingTop: '1rem',
        borderTop: `1px solid ${borderColor}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem'
      }}>
        <FaCalendarAlt size={12} style={{ color: secondaryColor }} />
        <span style={{ fontSize: '0.75rem', color: secondaryColor }}>
          Membro desde {state.joinedDate}
        </span>
      </div>

      {/* Photo Upload Modal */}
      {showPhotoUpload && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: bgColor,
            borderRadius: '20px',
            padding: '2rem',
            width: '90%',
            maxWidth: '400px',
            position: 'relative',
            border: `1px solid ${borderColor}`,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}>
            {/* Close button */}
            <button
              onClick={() => setShowPhotoUpload(false)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'transparent',
                border: 'none',
                color: secondaryColor,
                cursor: 'pointer',
                padding: '0.5rem'
              }}
            >
              <FaTimes size={16} />
            </button>

            <h3 style={{ 
              color: textColor, 
              marginBottom: '1.5rem',
              textAlign: 'center',
              fontSize: '1.25rem'
            }}>
              📸 Atualizar Foto do Perfil
            </h3>

            {/* Drag and Drop Area */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              style={{
                border: `2px dashed ${dragOver ? '#6366f1' : borderColor}`,
                borderRadius: '12px',
                padding: '2rem',
                textAlign: 'center',
                marginBottom: '1rem',
                background: dragOver 
                  ? (isDark ? '#312e81' : '#f0f0ff') 
                  : (isDark ? '#374151' : '#f9fafb'),
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              {chunkedUpload.uploading ? (
                <div style={{ color: textColor }}>
                  <div
                    style={{
                      color: '#6366f1',
                      marginBottom: '1rem',
                      display: 'inline-block',
                      animation: 'spin 1s linear infinite'
                    }}
                  >
                    <FaSpinner size={32} />
                  </div>
                  <p style={{ margin: 0, fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                    Enviando por chunks via WebSocket...
                  </p>
                  <div style={{ 
                    width: '100%', 
                    backgroundColor: borderColor, 
                    borderRadius: '4px', 
                    overflow: 'hidden',
                    marginBottom: '0.5rem'
                  }}>
                    <div style={{
                      width: `${chunkedUpload.progress}%`,
                      height: '8px',
                      backgroundColor: '#6366f1',
                      transition: 'width 0.2s ease-in-out'
                    }}></div>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: secondaryColor }}>
                    {chunkedUpload.progress.toFixed(1)}% - {Math.round(chunkedUpload.bytesUploaded / 1024)}KB de {Math.round(chunkedUpload.totalBytes / 1024)}KB
                  </p>
                  <style>{`
                    @keyframes spin {
                      from { transform: rotate(0deg); }
                      to { transform: rotate(360deg); }
                    }
                  `}</style>
                </div>
              ) : (
                <div style={{ color: textColor }}>
                  <FaUpload 
                    size={32} 
                    style={{ 
                      color: dragOver ? '#6366f1' : secondaryColor, 
                      marginBottom: '1rem' 
                    }} 
                  />
                  <p style={{ margin: '0 0 0.5rem 0', fontWeight: '500' }}>
                    {dragOver ? 'Solte a imagem aqui!' : 'Arraste uma imagem ou clique para selecionar'}
                  </p>
                  <p style={{ 
                    margin: 0, 
                    fontSize: '0.75rem', 
                    color: secondaryColor 
                  }}>
                    JPEG, PNG, WebP, GIF • Máximo 5MB
                  </p>
                </div>
              )}
            </div>

            {/* File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={chunkedUpload.uploading}
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '0.75rem',
                  cursor: chunkedUpload.uploading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  fontWeight: '500',
                  opacity: chunkedUpload.uploading ? 0.6 : 1
                }}
              >
                <FaCamera size={14} /> Escolher Arquivo
              </button>
              
              <button
                onClick={() => setShowPhotoUpload(false)}
                disabled={chunkedUpload.uploading}
                style={{
                  flex: 1,
                  background: 'transparent',
                  color: textColor,
                  border: `1px solid ${borderColor}`,
                  borderRadius: '12px',
                  padding: '0.75rem',
                  cursor: chunkedUpload.uploading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  fontWeight: '500',
                  opacity: chunkedUpload.uploading ? 0.6 : 1
                }}
              >
                <FaTimes size={14} /> Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}