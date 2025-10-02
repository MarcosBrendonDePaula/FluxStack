# Plugin de Exemplo com Dependências

Este plugin demonstra como usar dependências externas em plugins FluxStack.

## Dependências Utilizadas

### Dependencies (Produção)
- **axios** `^1.6.0` - Cliente HTTP para integração com APIs externas
- **lodash** `^4.17.21` - Utilitários JavaScript (debounce, manipulação de dados)
- **date-fns** `^2.30.0` - Formatação e manipulação de datas

### Peer Dependencies (Opcionais)
- **react** `>=16.8.0` - Para componentes React (opcional)
- **typescript** `>=4.0.0` - Para tipagem TypeScript

### Dev Dependencies
- **@types/lodash** `^4.14.0` - Tipos TypeScript para lodash

## Funcionalidades

### 1. Integração com API Externa
```typescript
// Configurar cliente axios
const apiClient = axios.create({
  baseURL: config.apiUrl,
  timeout: 5000
})

// Enviar dados para API externa
await apiClient.post('/errors', errorData)
```

### 2. Debounce de Logs
```typescript
// Usar lodash debounce para evitar spam
const debouncedLog = debounce((message, data) => {
  context.logger.info(message, data)
}, config.debounceMs)
```

### 3. Formatação de Datas
```typescript
// Usar date-fns para formatação
const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm:ss')
```

## Configuração

```typescript
// fluxstack.config.ts
plugins: {
  enabled: ['example-plugin'],
  config: {
    'example-plugin': {
      enabled: true,
      apiUrl: 'https://api.example.com',
      debounceMs: 1000,
      logRequests: true
    }
  }
}
```

## Instalação de Dependências

O FluxStack instala automaticamente as dependências do plugin:

```bash
# Instalar dependências automaticamente
flux plugin:deps install

# Verificar dependências
flux plugin:deps list --plugin example-plugin

# Verificar conflitos
flux plugin:deps check
```

## Exemplo de Uso

1. **Habilitar o plugin** no `fluxstack.config.ts`
2. **Instalar dependências**: `flux plugin:deps install`
3. **Iniciar o servidor**: `flux dev`

O plugin irá:
- ✅ Configurar cliente HTTP com axios
- ✅ Logar requisições com debounce (lodash)
- ✅ Formatar timestamps com date-fns
- ✅ Enviar erros para API externa
- ✅ Processar dados de resposta

## Logs de Exemplo

```
[INFO] Plugin de exemplo inicializado com sucesso {
  apiUrl: 'https://api.example.com',
  debounceMs: 1000,
  logRequests: true
}

[INFO] Conectividade com API externa verificada

[INFO] Requisição processada {
  timestamp: '2024-01-15 14:30:25',
  method: 'GET',
  path: '/api/users',
  userAgent: 'Mozilla/5.0...'
}

[DEBUG] Resposta processada {
  method: 'GET',
  path: '/api/users',
  statusCode: 200,
  duration: 45,
  pathSegments: ['api', 'users'],
  isSuccess: true,
  responseTime: '45ms'
}
```

## Resolução de Problemas

### Dependências não encontradas
```bash
# Verificar se as dependências estão instaladas
flux plugin:deps list --plugin example-plugin

# Reinstalar dependências
flux plugin:deps install
```

### Conflitos de versão
```bash
# Verificar conflitos
flux plugin:deps check

# Ver detalhes
flux plugin:deps list
```

### API externa não disponível
O plugin funciona mesmo se a API externa não estiver disponível. Apenas logs de warning serão exibidos.

## Desenvolvimento

Para desenvolver este plugin:

1. **Instalar dependências**:
```bash
bun add axios lodash date-fns
bun add -d @types/lodash
```

2. **Testar o plugin**:
```bash
flux dev
```

3. **Verificar logs**:
```bash
# Habilitar logs debug
DEBUG=true flux dev
```

## Boas Práticas Demonstradas

- ✅ **Versionamento semântico** nas dependências
- ✅ **Peer dependencies opcionais** para React
- ✅ **Configuração flexível** via schema
- ✅ **Tratamento de erros** gracioso
- ✅ **Logging estruturado** com contexto
- ✅ **Debounce** para performance
- ✅ **Timeout** em requisições HTTP
- ✅ **Tipagem TypeScript** completa