# 🔄 Dynamic Environment Variables for FluxStack

## 🚨 **Problema Resolvido**

O **Bun build** fixa valores de `process.env` durante a compilação, impossibilitando mudanças de environment variables em produção sem rebuild.

### ❌ **Problema Original**
```typescript
// Durante build, Bun converte isto:
const port = process.env.PORT || 3000

// Em isto (valor fixo):
const port = "8080" || 3000  // Fixado no build!
```

### ✅ **Solução FluxStack**
```typescript
import { env } from '@/core/utils/env-runtime'

// Sempre dinâmico, mesmo após build:
const port = env.num('PORT', 3000)  // 🚀 Funciona em runtime!
```

---

## 🛠️ **Como Usar**

### **1. Import Básico**
```typescript
import { env } from '@/core/utils/env-runtime'

// Métodos disponíveis:
const port = env.num('PORT', 3000)           // number
const host = env.get('HOST', 'localhost')    // string  
const debug = env.bool('DEBUG', false)       // boolean
const origins = env.array('CORS_ORIGINS')    // string[]
const hasDb = env.has('DATABASE_URL')        // boolean
```

### **2. Propriedades Shorthand**
```typescript
// Acesso direto para vars comuns:
console.log(env.PORT)          // number
console.log(env.NODE_ENV)      // string
console.log(env.DATABASE_URL)  // string | undefined
console.log(env.CORS_ORIGINS)  // string[]
```

### **3. Configuração de Servidor**
```typescript
import { createRuntimeConfig } from '@/core/config/runtime-config'

const config = createRuntimeConfig({
  server: {
    port: env.num('PORT', 3000),
    host: env.get('HOST', 'localhost')
  }
})

const app = new FluxStackFramework(config)
```

### **4. Diferentes Ambientes**
```typescript
import { runtimeConfig } from '@/core/config/runtime-config'

// Auto-detect do ambiente:
const config = runtimeConfig.auto()

// Ou específico:
const devConfig = runtimeConfig.development()
const prodConfig = runtimeConfig.production()
const testConfig = runtimeConfig.test()
```

---

## 🔧 **Migração do Código Existente**

### **Antes (Fixado pelo Bun)**
```typescript
// ❌ Será fixado durante build
const oldConfig = {
  port: parseInt(process.env.PORT || '3000'),
  dbUrl: process.env.DATABASE_URL,
  debug: process.env.DEBUG === 'true',
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['*'],
  enableMonitoring: process.env.MONITORING_ENABLED === 'true'
}
```

### **Depois (Dinâmico)**
```typescript
// ✅ Sempre dinâmico, mesmo após build
import { env } from '@/core/utils/env-runtime'

const newConfig = {
  port: env.num('PORT', 3000),
  dbUrl: env.get('DATABASE_URL'),
  debug: env.bool('DEBUG', false),
  corsOrigins: env.array('CORS_ORIGINS', ['*']),
  enableMonitoring: env.bool('MONITORING_ENABLED', false)
}
```

---

## 🏗️ **Configuração Avançada**

### **1. Namespaces de Environment**
```typescript
import { createEnvNamespace } from '@/core/utils/env-runtime'

// Criar loaders especializados
const dbEnv = createEnvNamespace('DATABASE_')
const redisEnv = createEnvNamespace('REDIS_')
const awsEnv = createEnvNamespace('AWS_')

// Uso:
const dbConfig = {
  url: dbEnv.get('URL'),        // DATABASE_URL
  host: dbEnv.get('HOST'),      // DATABASE_HOST
  port: dbEnv.getNumber('PORT') // DATABASE_PORT
}
```

### **2. Validação de Environment**
```typescript
import { envValidation } from '@/core/utils/env-runtime'

// Validar vars obrigatórias
envValidation.require(['NODE_ENV', 'DATABASE_URL'])

// Validar formato
envValidation.validate('DATABASE_URL', 
  (url) => url.includes('://'),
  'DATABASE_URL deve ser uma URL válida'
)
```

### **3. Configuração Condicional**
```typescript
import { env } from '@/core/utils/env-runtime'

export function createServerConfig() {
  const config = {
    port: env.num('PORT', 3000),
    
    // Database apenas se configurado
    ...(env.has('DATABASE_URL') && {
      database: {
        url: env.get('DATABASE_URL'),
        ssl: env.bool('DB_SSL', env.get('NODE_ENV') === 'production')
      }
    }),
    
    // Features baseadas no ambiente
    features: {
      swagger: env.bool('ENABLE_SWAGGER', env.get('NODE_ENV') !== 'production'),
      monitoring: env.bool('ENABLE_MONITORING', env.get('NODE_ENV') === 'production')
    }
  }
  
  return config
}
```

---

## 🚀 **Integração com FluxStack**

### **1. Servidor com Env Dinâmico**
```typescript
import { FluxStackFramework } from '@/core/framework/server'
import { createRuntimeConfig } from '@/core/config/runtime-config'
import { env } from '@/core/utils/env-runtime'

export async function startServer() {
  // Configuração dinâmica
  const config = createRuntimeConfig()
  
  // Framework com env dinâmico
  const app = new FluxStackFramework(config)
  
  // Plugins condicionais
  if (env.bool('ENABLE_SWAGGER', true)) {
    app.use(swaggerPlugin)
  }
  
  if (env.bool('ENABLE_MONITORING', false)) {
    app.use(monitoringPlugin)
  }
  
  await app.listen()
  
  console.log(`🚀 Server running on port ${env.num('PORT', 3000)}`)
}
```

### **2. Build Configuration**
```typescript
// No fluxstack.config.ts
import { env } from '@/core/utils/env-runtime'

export const config = {
  app: {
    name: env.get('FLUXSTACK_APP_NAME', 'my-app'),
    version: env.get('FLUXSTACK_APP_VERSION', '1.0.0')
  },
  
  server: {
    port: env.num('PORT', 3000),
    host: env.get('HOST', 'localhost'),
    cors: {
      origins: env.array('CORS_ORIGINS', ['*'])
    }
  },
  
  build: {
    target: env.get('BUILD_TARGET', 'bun'),
    outDir: env.get('BUILD_OUTDIR', 'dist'),
    optimization: {
      minify: env.bool('BUILD_MINIFY', env.get('NODE_ENV') === 'production')
    }
  }
}
```

---

## 🧪 **Testando com Env Dinâmico**

### **1. Configuração de Teste**
```typescript
import { runtimeConfig } from '@/core/config/runtime-config'

// Configuração isolada para testes
const testConfig = runtimeConfig.test()

// Ou com overrides específicos
const config = runtimeConfig.auto({
  server: { port: 0 }, // Porta aleatória
  database: { url: 'sqlite://memory:' }
})
```

### **2. Mock de Environment Variables**
```typescript
import { withTestEnv } from '@/examples/dynamic-env-usage'

test('server configuration with custom env', () => {
  withTestEnv({
    'PORT': '9000',
    'NODE_ENV': 'test',
    'DEBUG': 'true'
  }, () => {
    const config = createServerConfig()
    expect(config.port).toBe(9000)
    expect(config.debug).toBe(true)
  })
})
```

---

## 📦 **Deploy e Produção**

### **1. Docker com Env Dinâmico**
```dockerfile
# Dockerfile
FROM oven/bun:1.1-alpine

WORKDIR /app
COPY . .

# Build com env dinâmico funcionando
RUN bun run build

# Environment variables não fixadas no build
ENV NODE_ENV=production
ENV PORT=3000

CMD ["bun", "run", "dist/index.js"]
```

### **2. Docker Compose**
```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "${PORT:-3000}:${PORT:-3000}"
    environment:
      - NODE_ENV=production
      - PORT=${PORT:-3000}
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
      - CORS_ORIGINS=${CORS_ORIGINS:-*}
      - ENABLE_MONITORING=${ENABLE_MONITORING:-true}
```

### **3. Deploy com Variáveis Dinâmicas**
```bash
# Build uma vez
bun run build

# Deploy em diferentes ambientes (sem rebuild!)
NODE_ENV=staging PORT=4000 bun run dist/index.js
NODE_ENV=production PORT=8080 DATABASE_URL=postgres://... bun run dist/index.js
```

---

## ⚡ **Performance e Compatibilidade**

### **Overhead**
- **Mínimo**: Apenas uma verificação extra por acesso
- **Cache**: Valores são cached dentro da mesma execução
- **Bun.env**: Usa Bun.env quando disponível (mais rápido)

### **Compatibilidade**
- ✅ **Bun runtime**: Usa `Bun.env` otimizado
- ✅ **Node.js**: Fallback para `process.env`
- ✅ **Build tools**: Resistente a otimizações
- ✅ **Testing**: Funciona com mocks

### **Fallbacks**
1. `Bun.env` (mais rápido no Bun)
2. `process.env` (Node.js/fallback)
3. `eval('process')` (edge cases)

---

## 🔍 **Debugging**

### **Ver Todas as Environment Variables**
```typescript
import { env } from '@/core/utils/env-runtime'

// Listar todas as env vars
console.log(env.all())

// Verificar se existe
if (env.has('DATABASE_URL')) {
  console.log('Database configured')
}

// Debug de configuração
console.log('🔧 Current config:')
console.log(`  NODE_ENV: ${env.get('NODE_ENV')}`)
console.log(`  PORT: ${env.num('PORT', 3000)}`)
console.log(`  DEBUG: ${env.bool('DEBUG')}`)
```

---

## 📋 **Checklist de Migração**

- [ ] Substituir `process.env.VAR` por `env.get('VAR')`
- [ ] Usar `env.num()`, `env.bool()`, `env.array()` conforme tipo
- [ ] Atualizar configuração do FluxStack
- [ ] Testar em desenvolvimento
- [ ] Testar build e produção
- [ ] Verificar Docker/deploy
- [ ] Documentar env vars específicas do projeto

---

## 🎯 **Benefícios**

✅ **Env vars dinâmicas** mesmo após Bun build  
✅ **Deploy flexível** sem rebuild  
✅ **Type-safe** com conversão automática  
✅ **Validação** de env vars obrigatórias  
✅ **Namespace** para organização  
✅ **Compatibilidade** com Node.js e Bun  
✅ **Performance** otimizada  
✅ **Testing** friendly