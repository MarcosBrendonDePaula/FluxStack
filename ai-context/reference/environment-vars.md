# 🌐 Environment Variables - FluxStack

> **Guia completo de variáveis de ambiente**: configuração, precedência e testing

## 🎯 **Sistema de Environment Variables**

O FluxStack utiliza um **sistema dinâmico** de environment variables com precedência clara e validação automática.

### **📋 Precedência (Maior → Menor)**
1. **Process env** (`process.env.VAR`)
2. **Runtime vars** (definidas em runtime)
3. **`.env` file** (carregado automaticamente)
4. **Default values** (valores padrão)

## 🔧 **Variáveis Principais**

### **🚀 Servidor (Backend)**
```bash
# Porta do servidor
PORT=3000                    # Default: 3000

# Ambiente de execução
NODE_ENV=development         # Options: development, production, test

# Host/endereço
HOST=localhost               # Default: localhost
API_PREFIX=/api              # Default: /api

# Database (quando configurado)
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

# Secrets
JWT_SECRET=your-secret-here
API_KEY=your-api-key
```

### **⚛️ Frontend (Client)**
```bash
# Vite variables (VITE_ prefix obrigatório)
VITE_API_URL=http://localhost:3000
VITE_APP_NAME=FluxStack
VITE_APP_VERSION=1.5.0
VITE_NODE_ENV=development

# Build-specific
VITE_BUILD_TARGET=browser
VITE_BASE_URL=/
```

### **🧪 Testing**
```bash
# Test environment
NODE_ENV=test
TEST_PORT=3001
TEST_DB_URL=sqlite::memory:

# Test flags
SKIP_AUTH_TESTS=false
MOCK_EXTERNAL_APIS=true
```

### **🐳 Docker**
```bash
# Docker-specific
DOCKERFILE_TARGET=production
DOCKER_PORT=3000
DOCKER_ENV=production

# Multi-stage build
BUILD_STAGE=build
RUN_STAGE=runtime
```

## 📁 **Arquivo .env**

### **📝 Exemplo Completo (.env)**
```bash
# ===========================================
# FluxStack Environment Configuration
# ===========================================

# Server Configuration
PORT=3000
HOST=localhost
NODE_ENV=development
API_PREFIX=/api

# Frontend Configuration (Vite)
VITE_API_URL=http://localhost:3000
VITE_APP_NAME="FluxStack Development"
VITE_APP_VERSION=1.5.0
VITE_NODE_ENV=development

# Development Tools
DEBUG=true
LOG_LEVEL=info
HOT_RELOAD=true

# Database (example - configure as needed)
# DATABASE_URL=postgresql://user:pass@localhost:5432/fluxstack
# REDIS_URL=redis://localhost:6379

# Security (NEVER commit real secrets!)
# JWT_SECRET=your-super-secret-key-here-min-32-chars
# API_KEY=your-api-key-here

# Testing
TEST_DATABASE_URL=sqlite::memory:
MOCK_APIS=true

# Build Configuration
BUILD_TARGET=development
OPTIMIZE_BUNDLE=false
SOURCE_MAPS=true
```

### **📝 Produção (.env.production)**
```bash
# Production Environment
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Security
JWT_SECRET=${JWT_SECRET}  # From environment
API_KEY=${API_KEY}        # From environment

# Performance  
OPTIMIZE_BUNDLE=true
SOURCE_MAPS=false
LOG_LEVEL=warn

# Database
DATABASE_URL=${DATABASE_URL}
REDIS_URL=${REDIS_URL}

# Frontend
VITE_API_URL=https://api.yourapp.com
VITE_APP_NAME="FluxStack"
VITE_NODE_ENV=production
```

## 🔍 **Validação e Testing**

### **✅ Verificar Environment Variables**
```bash
# Comando built-in
bun run env-test

# Manual check
curl http://localhost:3000/api/env-test
```

### **✅ Testing Script**
```bash
# Script de teste (run-env-tests.ts)
#!/usr/bin/env bun

import { env } from 'bun'

console.log('🧪 Environment Variables Test')
console.log('============================')

// Test server vars
console.log(`PORT: ${env.PORT || 'undefined'}`)
console.log(`NODE_ENV: ${env.NODE_ENV || 'undefined'}`)
console.log(`HOST: ${env.HOST || 'undefined'}`)

// Test frontend vars  
console.log(`VITE_API_URL: ${env.VITE_API_URL || 'undefined'}`)
console.log(`VITE_APP_NAME: ${env.VITE_APP_NAME || 'undefined'}`)

// Test precedence
env.TEST_VAR = 'runtime-value'
console.log(`Runtime test: ${env.TEST_VAR}`)
```

## 🛠️ **Configuração por Ambiente**

### **🔧 Development**
```bash
# .env.development
NODE_ENV=development
DEBUG=true
HOT_RELOAD=true
LOG_LEVEL=debug

# Frontend dev
VITE_API_URL=http://localhost:3000
VITE_APP_NAME="FluxStack [DEV]"
```

### **🧪 Testing**
```bash
# .env.test
NODE_ENV=test
PORT=3001
LOG_LEVEL=silent

# Test database
TEST_DATABASE_URL=sqlite::memory:
MOCK_EXTERNAL_APIS=true

# Frontend test
VITE_API_URL=http://localhost:3001
```

### **🚀 Production**
```bash
# .env.production
NODE_ENV=production
LOG_LEVEL=info
OPTIMIZE_BUNDLE=true

# Security - use real environment vars
JWT_SECRET=${JWT_SECRET}
API_KEY=${API_KEY}
DATABASE_URL=${DATABASE_URL}
```

## 📊 **Sistema Dinâmico**

### **🔄 Runtime Configuration**
```typescript
// core/config/env-dynamic.ts
export class DynamicEnvConfig {
  static setEnvironment(env: 'development' | 'production' | 'test') {
    process.env.NODE_ENV = env
    // Reconfigure based on environment
    this.loadEnvironmentSpecificConfig()
  }

  static override(key: string, value: string) {
    process.env[key] = value
    console.log(`Environment override: ${key}=${value}`)
  }
}
```

### **✅ Precedência em Ação**
```bash
# 1. .env file
PORT=3000

# 2. Runtime override
DynamicEnvConfig.override('PORT', '4000')

# 3. Process env (highest priority)
PORT=5000 bun run dev

# Result: PORT=5000 (process env wins)
```

## 🚨 **Security Best Practices**

### **🔒 Secrets Management**
```bash
# ❌ NUNCA committar secrets
JWT_SECRET=actual-secret-here  # ❌ NO!

# ✅ Use placeholders no .env  
JWT_SECRET=${JWT_SECRET}       # ✅ YES!

# ✅ Set real values via environment
export JWT_SECRET="actual-secret"
bun run start
```

### **🛡️ Validation**
```typescript
// Validate required vars
const requiredVars = ['DATABASE_URL', 'JWT_SECRET']

for (const varName of requiredVars) {
  if (!process.env[varName]) {
    throw new Error(`Required environment variable missing: ${varName}`)
  }
}
```

### **🔍 Environment Detection**
```typescript
export const isProduction = process.env.NODE_ENV === 'production'
export const isDevelopment = process.env.NODE_ENV === 'development'
export const isTest = process.env.NODE_ENV === 'test'

// Use guards
if (isProduction) {
  // Production-only code
  app.use(helmet())
}

if (isDevelopment) {
  // Development-only code
  app.use(cors({ origin: 'http://localhost:5173' }))
}
```

## 🐳 **Docker Environment**

### **📦 Dockerfile ENV**
```dockerfile
# Build args
ARG NODE_ENV=production
ARG API_URL=http://localhost:3000

# Runtime env
ENV NODE_ENV=${NODE_ENV}
ENV PORT=3000
ENV HOST=0.0.0.0

# Frontend build vars
ENV VITE_API_URL=${API_URL}
ENV VITE_NODE_ENV=${NODE_ENV}
```

### **🚀 Docker Compose**
```yaml
# docker-compose.yml
services:
  app:
    build: .
    environment:
      - NODE_ENV=production
      - PORT=3000
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
    env_file:
      - .env.production
```

## 📋 **Troubleshooting**

### **🔍 Debug Environment**
```typescript
// Debug current environment
console.log('Environment Debug:', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  all_env: Object.keys(process.env).filter(k => k.startsWith('VITE_'))
})
```

### **⚠️ Problemas Comuns**

#### **1. Frontend Vars Não Carregam**
```bash
# ❌ Problema: Var sem VITE_ prefix
API_URL=http://localhost:3000  # Não funciona no frontend

# ✅ Solução: Usar VITE_ prefix
VITE_API_URL=http://localhost:3000  # Funciona!
```

#### **2. Env File Não Carregado**
```bash
# Verificar se .env existe no root
ls -la .env

# Verificar conteúdo
cat .env | grep -v '^#'

# Forçar reload
rm .env && cp .env.example .env
```

#### **3. Docker Env Não Funciona**
```dockerfile
# ❌ Problema: ENV muito cedo
ENV VITE_API_URL=http://localhost:3000
COPY . .
RUN bun run build  # Vite já buildou com localhost

# ✅ Solução: ENV antes do build
ARG API_URL=http://localhost:3000
ENV VITE_API_URL=${API_URL}
COPY . .
RUN bun run build  # Vite builda com ARG correto
```

---

**🎯 Sistema de environment variables bem configurado é fundamental para deployment seguro e flexível do FluxStack!**