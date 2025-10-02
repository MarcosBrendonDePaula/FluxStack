# Sistema de Dependências de Plugins FluxStack

O FluxStack possui um sistema robusto para gerenciar dependências de plugins automaticamente.

## Como Funciona

### 1. Declaração de Dependências

Cada plugin declara suas dependências no `package.json`:

```json
{
  "name": "@fluxstack/crypto-auth-plugin",
  "dependencies": {
    "@noble/curves": "^1.2.0",
    "@noble/hashes": "^1.3.2"
  },
  "peerDependencies": {
    "react": ">=16.8.0"
  },
  "peerDependenciesMeta": {
    "react": {
      "optional": true
    }
  }
}
```

### 2. Resolução Automática

O FluxStack automaticamente:

- ✅ **Descobre** plugins na inicialização
- ✅ **Resolve** dependências de cada plugin
- ✅ **Detecta** conflitos de versão
- ✅ **Instala** dependências automaticamente
- ✅ **Gerencia** peer dependencies

### 3. Detecção de Conflitos

O sistema detecta quando plugins requerem versões diferentes da mesma dependência:

```
⚠️  Conflito detectado:
  @noble/curves:
    crypto-auth: ^1.2.0
    other-plugin: ^1.1.0
  Resolução: ^1.2.0 (versão mais alta)
```

### 4. Estratégias de Resolução

- **Versão mais alta**: Usa a versão mais recente compatível
- **Peer dependencies**: Verifica se já estão instaladas no projeto
- **Dependências opcionais**: Não bloqueia se não disponíveis

## Comandos CLI

### Instalar Dependências

```bash
# Instalar todas as dependências de plugins
flux plugin:deps install

# Dry run (mostrar sem instalar)
flux plugin:deps install --dry-run

# Usar package manager específico
flux plugin:deps install --package-manager npm
```

### Listar Dependências

```bash
# Listar todas as dependências
flux plugin:deps list

# Listar dependências de um plugin específico
flux plugin:deps list --plugin crypto-auth
```

### Verificar Conflitos

```bash
# Verificar conflitos de dependências
flux plugin:deps check
```

### Limpar Dependências

```bash
# Limpar dependências não utilizadas
flux plugin:deps clean --dry-run
```

## Estrutura de Plugin com Dependências

```
plugins/meu-plugin/
├── package.json          # Declaração de dependências
├── index.ts              # Plugin principal
├── server/               # Código servidor
├── client/               # Código cliente
└── README.md            # Documentação
```

### Exemplo de package.json

```json
{
  "name": "@fluxstack/meu-plugin",
  "version": "1.0.0",
  "description": "Meu plugin personalizado",
  "main": "index.ts",
  "dependencies": {
    "axios": "^1.0.0",
    "lodash": "^4.17.0"
  },
  "peerDependencies": {
    "react": ">=16.8.0",
    "typescript": ">=4.0.0"
  },
  "peerDependenciesMeta": {
    "react": {
      "optional": true
    }
  },
  "fluxstack": {
    "version": "^1.0.0",
    "hooks": ["setup", "onRequest"],
    "category": "utility"
  }
}
```

## Configuração Avançada

### Desabilitar Auto-instalação

```typescript
// fluxstack.config.ts
export const config: FluxStackConfig = {
  plugins: {
    config: {
      'dependency-manager': {
        autoInstall: false,
        packageManager: 'yarn'
      }
    }
  }
}
```

### Package Managers Suportados

- **Bun** (padrão)
- **npm**
- **yarn**
- **pnpm**

## Boas Práticas

### 1. Versionamento Semântico

Use versionamento semântico para dependências:

```json
{
  "dependencies": {
    "axios": "^1.0.0",      // Compatível com 1.x.x
    "lodash": "~4.17.0",    // Compatível com 4.17.x
    "react": ">=16.8.0"     // Mínimo 16.8.0
  }
}
```

### 2. Peer Dependencies

Use peer dependencies para dependências que devem ser fornecidas pelo projeto host:

```json
{
  "peerDependencies": {
    "react": ">=16.8.0",
    "react-dom": ">=16.8.0"
  }
}
```

### 3. Dependências Opcionais

Marque peer dependencies como opcionais quando apropriado:

```json
{
  "peerDependenciesMeta": {
    "react": {
      "optional": true
    }
  }
}
```

### 4. Documentação

Documente dependências no README do plugin:

```markdown
## Dependências

- `@noble/curves` - Criptografia de curvas elípticas
- `@noble/hashes` - Funções de hash criptográficas
- `react` (peer) - Para componentes React (opcional)
```

## Resolução de Problemas

### Conflitos de Versão

```bash
# Verificar conflitos
flux plugin:deps check

# Ver detalhes das dependências
flux plugin:deps list

# Forçar reinstalação
rm -rf node_modules package-lock.json
flux plugin:deps install
```

### Dependências Não Encontradas

1. Verifique se o `package.json` do plugin está correto
2. Execute `flux plugin:deps install`
3. Verifique se o package manager está configurado corretamente

### Performance

- Use `--dry-run` para testar antes de instalar
- Configure `autoInstall: false` para controle manual
- Use cache do package manager quando possível

## Integração com CI/CD

```yaml
# .github/workflows/ci.yml
- name: Install plugin dependencies
  run: |
    bun install
    bun run cli plugin:deps install
    
- name: Check dependency conflicts
  run: bun run cli plugin:deps check
```

## Monitoramento

O sistema de dependências fornece métricas:

```typescript
const stats = dependencyManager.getStats()
console.log({
  totalPlugins: stats.totalPlugins,
  totalDependencies: stats.totalDependencies,
  installedDependencies: stats.installedDependencies
})
```

## Roadmap

- [ ] Cache inteligente de dependências
- [ ] Suporte a workspaces
- [ ] Análise de vulnerabilidades
- [ ] Otimização de bundle size
- [ ] Dependências condicionais por ambiente