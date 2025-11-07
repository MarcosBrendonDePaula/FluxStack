# 📦 Sistema de Gerenciamento de Versão - FluxStack

## 🎯 **Fonte Única de Verdade**

O FluxStack usa um sistema unificado de versão com **fonte única de verdade**:

### **📍 Arquivo Principal**
```typescript
// core/utils/version.ts
export const FLUXSTACK_VERSION = '1.7.5'
```

### **🔄 Sincronização Automática**
```bash
# Sincronizar versão manualmente
bun run sync-version

# Sincronização automática no build
bun run build  # Executa prebuild que sincroniza automaticamente
```

## 🛠️ **Como Usar a Versão**

### **1. Em Código TypeScript**
```typescript
// ✅ Importar da fonte única
import { FLUXSTACK_VERSION, getVersion, getVersionInfo } from '@/core/utils/version'

// Usar a versão
console.log(`FluxStack v${FLUXSTACK_VERSION}`)

// Ou usar as funções utilitárias
const version = getVersion()
const info = getVersionInfo()
// info = { version: '1.7.5', name: 'FluxStack', major: 1, minor: 7, patch: 5 }
```

### **2. Em Live Components**
```typescript
// app/server/live/MyComponent.ts
import { FLUXSTACK_VERSION } from '@/core/utils/version'

export class MyComponent extends LiveComponent {
  getFrameworkInfo() {
    return {
      framework: 'FluxStack',
      version: FLUXSTACK_VERSION
    }
  }
}
```

### **3. Em Plugins**
```typescript
// plugins/my-plugin/index.ts
import { getVersionInfo } from '@/core/utils/version'

export const myPlugin = {
  name: 'my-plugin',
  version: '1.0.0',
  fluxstackVersion: getVersionInfo().version
}
```

## 🔧 **Scripts Disponíveis**

### **Sincronização Manual**
```bash
bun run sync-version        # Sincroniza version.ts com package.json
```

### **Sincronização Automática**
```bash
bun run build             # Executa prebuild que sincroniza automaticamente
bun run prebuild          # Executa apenas as verificações pré-build
```

## 📋 **Fluxo de Atualização de Versão**

### **1. Atualizar package.json**
```json
{
  "version": "1.7.5"
}
```

### **2. Sincronizar automaticamente**
```bash
bun run sync-version
```

### **3. Verificar sincronização**
```bash
# Verificar se version.ts foi atualizado
cat core/utils/version.ts
# Deve mostrar: export const FLUXSTACK_VERSION = '1.7.5'
```

## ⚙️ **Arquivos Envolvidos**

### **📦 Fonte de Verdade**
- `package.json` - Versão oficial do pacote NPM
- `core/utils/version.ts` - Constante exportada para código

### **🔄 Scripts de Sincronização**
- `core/utils/sync-version.ts` - Utilitário de sincronização
- `scripts/prebuild.ts` - Script pré-build que sincroniza

### **📍 Locais que Usam Versão**
- `create-fluxstack.ts` - CLI de scaffolding
- `core/utils/logger/startup-banner.ts` - Banner de inicialização
- `app/server/live/FluxStackConfig.ts` - Live component de configuração

## 🚨 **Regras Importantes**

### ✅ **Sempre Fazer**
- Atualizar versão apenas no `package.json`
- Executar `bun run sync-version` após mudança
- Usar `FLUXSTACK_VERSION` em código TypeScript
- Verificar sincronização antes de build

### ❌ **Nunca Fazer**
- Editar `core/utils/version.ts` manualmente
- Hardcoded version strings em código
- Versões diferentes em arquivos diferentes
- Esquecer de sincronizar após mudança

## 🔍 **Verificação de Consistência**

### **Script de Verificação**
```bash
# Verificar se versões estão sincronizadas
node -e "
const pkg = require('./package.json');
const { FLUXSTACK_VERSION } = require('./core/utils/version.ts');
if (pkg.version !== FLUXSTACK_VERSION) {
  console.error('❌ Versões desincronizadas!');
  process.exit(1);
} else {
  console.log('✅ Versões sincronizadas:', pkg.version);
}
"
```

## 🎯 **Benefícios do Sistema**

### ✅ **Consistência**
- Uma única fonte de verdade
- Sincronização automática
- Impossível ter versões diferentes

### ✅ **Manutenção**
- Atualização centralizada
- Scripts automatizados
- Verificação de consistência

### ✅ **Developer Experience**
- Fácil de usar em código
- Funções utilitárias disponíveis
- Sincronização transparente

---

**📅 Implementado**: Novembro 2025 - FluxStack v1.7.5