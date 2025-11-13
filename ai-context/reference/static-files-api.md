# Static Files API Reference

## Visão Geral

O **Static Files Plugin** fornece funcionalidade para servir arquivos estáticos e uploads com cache apropriado, segurança e suporte a MIME types.

### Características

- ✅ **Servir Arquivos Públicos**: Pasta `public/` para assets estáticos
- ✅ **Gerenciamento de Uploads**: Pasta `uploads/` para arquivos enviados por usuários
- ✅ **Cache Inteligente**: Headers de cache configuráveis (padrão: 1 ano)
- ✅ **MIME Types**: Detecção automática baseada em extensão
- ✅ **Segurança**: Proteção contra path traversal
- ✅ **ETag Support**: ETags baseados em modificação + tamanho
- ✅ **Rotas Configuráveis**: Prefixos customizáveis para dev/prod

---

## Configuração

### Variáveis de Ambiente

```bash
# .env
STATIC_FILES_PUBLIC_DIR=public          # Diretório de arquivos públicos
STATIC_FILES_UPLOADS_DIR=uploads        # Diretório de uploads
STATIC_FILES_CACHE_MAX_AGE=31536000     # Cache em segundos (1 ano)
STATIC_FILES_ENABLE_PUBLIC=true         # Habilitar pasta public
STATIC_FILES_ENABLE_UPLOADS=true        # Habilitar pasta uploads
STATIC_FILES_PUBLIC_ROUTE=/api/static   # Rota para arquivos públicos
STATIC_FILES_UPLOADS_ROUTE=/api/uploads # Rota para uploads
```

### Configuração Programática

```typescript
// fluxstack.config.ts
export default {
  staticFiles: {
    publicDir: 'public',
    uploadsDir: 'uploads',
    cacheMaxAge: 31536000, // 1 ano
    enablePublic: true,
    enableUploads: true,
    publicRoute: '/api/static',  // Evita conflitos com Vite em dev
    uploadsRoute: '/api/uploads'
  }
}
```

---

## Endpoints HTTP

### Informações de Configuração

#### `GET /api/static/info`

Retorna a configuração atual do plugin de arquivos estáticos.

**Tags**: `Static Files`, `Configuration`

**Response**:
```typescript
{
  success: boolean
  config: {
    publicDir: string           // "public"
    uploadsDir: string          // "uploads"
    enablePublic: boolean       // true/false
    enableUploads: boolean      // true/false
    cacheMaxAge: number         // Segundos (ex: 31536000)
  }
  paths: {
    publicPath: string          // Caminho absoluto no sistema
    uploadsPath: string         // Caminho absoluto no sistema
    publicUrl: string           // "/api/static"
    uploadsUrl: string          // "/api/uploads"
  }
  timestamp: string             // ISO 8601
}
```

**Exemplo**:
```bash
curl http://localhost:3000/api/static/info
```

**Response Example**:
```json
{
  "success": true,
  "config": {
    "publicDir": "public",
    "uploadsDir": "uploads",
    "enablePublic": true,
    "enableUploads": true,
    "cacheMaxAge": 31536000
  },
  "paths": {
    "publicPath": "/home/user/project/public",
    "uploadsPath": "/home/user/project/uploads",
    "publicUrl": "/api/static",
    "uploadsUrl": "/api/uploads"
  },
  "timestamp": "2025-01-13T12:00:00.000Z"
}
```

---

### Servir Arquivos Públicos

#### `GET /api/static/*`

Serve arquivos da pasta `public/`.

**Pattern**: `/api/static/{path-to-file}`

**Headers de Resposta**:
- `content-type`: MIME type detectado
- `content-length`: Tamanho do arquivo em bytes
- `last-modified`: Data da última modificação
- `cache-control`: `public, max-age={cacheMaxAge}`
- `etag`: ETag baseado em mtime + size
- `x-content-type-options`: `nosniff` (para imagens)

**Exemplos**:

```bash
# Servir imagem
curl http://localhost:3000/api/static/logo.png

# Servir CSS
curl http://localhost:3000/api/static/styles/main.css

# Servir JavaScript
curl http://localhost:3000/api/static/js/app.js

# Servir fonte
curl http://localhost:3000/api/static/fonts/Inter.woff2
```

**Estrutura de Diretórios**:
```
public/
├── logo.png
├── favicon.ico
├── styles/
│   └── main.css
├── js/
│   └── app.js
└── fonts/
    └── Inter.woff2
```

**Respostas de Erro**:

**404 - Arquivo não encontrado**:
```json
{
  "error": "File not found",
  "path": "/logo-missing.png",
  "timestamp": "2025-01-13T12:00:00.000Z"
}
```

**400 - Path inválido** (tentativa de path traversal):
```json
{
  "error": "Invalid file path"
}
```

**404 - Não é um arquivo** (pasta ou symlink):
```json
{
  "error": "Not a file"
}
```

---

### Servir Uploads

#### `GET /api/uploads/*`

Serve arquivos da pasta `uploads/`.

**Pattern**: `/api/uploads/{path-to-file}`

Funciona de forma idêntica a `/api/static/*`, mas serve arquivos da pasta `uploads/`.

**Exemplos**:

```bash
# Avatar de usuário
curl http://localhost:3000/api/uploads/avatars/user-123.jpg

# Documento enviado
curl http://localhost:3000/api/uploads/documents/report.pdf

# Anexo
curl http://localhost:3000/api/uploads/attachments/file.zip
```

**Estrutura de Diretórios**:
```
uploads/
├── avatars/
│   ├── user-123.jpg
│   └── user-456.png
├── documents/
│   └── report.pdf
└── attachments/
    └── file.zip
```

---

## MIME Types Suportados

O plugin detecta automaticamente o tipo MIME baseado na extensão do arquivo:

### Imagens
| Extensão | MIME Type |
|----------|-----------|
| `.jpg`, `.jpeg` | `image/jpeg` |
| `.png` | `image/png` |
| `.gif` | `image/gif` |
| `.webp` | `image/webp` |
| `.svg` | `image/svg+xml` |
| `.ico` | `image/x-icon` |

### Documentos
| Extensão | MIME Type |
|----------|-----------|
| `.pdf` | `application/pdf` |
| `.txt` | `text/plain` |
| `.json` | `application/json` |
| `.xml` | `application/xml` |

### Web Assets
| Extensão | MIME Type |
|----------|-----------|
| `.css` | `text/css` |
| `.js` | `application/javascript` |
| `.html`, `.htm` | `text/html` |

### Fontes
| Extensão | MIME Type |
|----------|-----------|
| `.woff` | `font/woff` |
| `.woff2` | `font/woff2` |
| `.ttf` | `font/ttf` |
| `.otf` | `font/otf` |

### Áudio/Vídeo
| Extensão | MIME Type |
|----------|-----------|
| `.mp3` | `audio/mpeg` |
| `.mp4` | `video/mp4` |
| `.webm` | `video/webm` |
| `.ogg` | `audio/ogg` |

**Fallback**: Arquivos com extensões desconhecidas recebem `application/octet-stream`.

---

## Segurança

### Proteção Contra Path Traversal

O plugin valida todos os caminhos para prevenir acesso a arquivos fora dos diretórios permitidos:

```typescript
// ❌ Bloqueado - Path traversal
GET /api/static/../../../etc/passwd

// ❌ Bloqueado - Path absoluto
GET /api/static//etc/passwd

// ✅ Permitido - Path relativo válido
GET /api/static/images/logo.png
```

**Implementação**:
```typescript
const isPathSafe = (filePath: string, basePath: string): boolean => {
  const resolvedPath = resolve(basePath, filePath)
  return resolvedPath.startsWith(basePath)
}
```

### Headers de Segurança

Para arquivos de imagem, o header `x-content-type-options: nosniff` é adicionado para prevenir MIME type sniffing.

---

## Cache e Performance

### Cache Headers

Todos os arquivos são servidos com headers de cache otimizados:

```http
Cache-Control: public, max-age=31536000
ETag: "1673618400000-12345"
Last-Modified: Thu, 13 Jan 2025 12:00:00 GMT
```

### ETags

ETags são gerados usando timestamp de modificação + tamanho do arquivo:

```typescript
const etag = `"${stats.mtime.getTime()}-${stats.size}"`
```

Isso permite que navegadores façam cache eficiente usando `If-None-Match`.

### Conditional Requests

Clientes podem usar `If-None-Match` ou `If-Modified-Since`:

```bash
curl -H "If-None-Match: \"1673618400000-12345\"" \
  http://localhost:3000/api/static/logo.png
```

Se o arquivo não mudou, retorna **304 Not Modified**.

---

## Casos de Uso Comuns

### 1. Servir Assets do Frontend

```html
<!-- public/index.html -->
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="/api/static/styles/main.css">
  <link rel="icon" href="/api/static/favicon.ico">
</head>
<body>
  <img src="/api/static/logo.png" alt="Logo">
  <script src="/api/static/js/app.js"></script>
</body>
</html>
```

### 2. Upload e Servir Avatares

```typescript
// Backend - Salvar avatar
import { writeFile } from 'fs/promises'
import { join } from 'path'

async function saveAvatar(userId: string, fileBuffer: Buffer) {
  const filename = `user-${userId}.jpg`
  const filepath = join(process.cwd(), 'uploads', 'avatars', filename)
  await writeFile(filepath, fileBuffer)

  return `/api/uploads/avatars/${filename}`
}

// Frontend - Exibir avatar
function UserAvatar({ userId }: { userId: string }) {
  return (
    <img
      src={`http://localhost:3000/api/uploads/avatars/user-${userId}.jpg`}
      alt="Avatar"
    />
  )
}
```

### 3. Download de Documentos

```typescript
// React component
function DownloadButton({ documentId }: { documentId: string }) {
  const handleDownload = () => {
    const url = `http://localhost:3000/api/uploads/documents/${documentId}.pdf`
    window.open(url, '_blank')
  }

  return <button onClick={handleDownload}>Download PDF</button>
}
```

### 4. Servir Fontes Customizadas

```css
/* public/styles/fonts.css */
@font-face {
  font-family: 'Inter';
  src: url('/api/static/fonts/Inter.woff2') format('woff2'),
       url('/api/static/fonts/Inter.woff') format('woff');
  font-weight: normal;
  font-style: normal;
}

body {
  font-family: 'Inter', sans-serif;
}
```

---

## Estrutura de Diretórios Recomendada

### Public (Assets Estáticos)

```
public/
├── favicon.ico
├── robots.txt
├── images/
│   ├── logo.png
│   ├── banner.jpg
│   └── icons/
│       ├── arrow.svg
│       └── menu.svg
├── styles/
│   ├── main.css
│   └── fonts.css
├── fonts/
│   ├── Inter.woff2
│   └── Inter.woff
└── js/
    └── polyfills.js
```

### Uploads (Arquivos Dinâmicos)

```
uploads/
├── avatars/
│   ├── user-1.jpg
│   └── user-2.png
├── documents/
│   ├── invoice-2025-01.pdf
│   └── report-q1.pdf
├── attachments/
│   └── file-abc123.zip
└── temp/
    └── upload-processing.tmp
```

---

## Integração com Eden Treaty

```typescript
// app/client/src/lib/static-api.ts
import { api } from './eden-api'

export const staticApi = {
  // Obter informações de configuração
  async getInfo() {
    const { data, error } = await api.static.info.get()
    return data
  },

  // Construir URL para asset público
  getPublicUrl(path: string) {
    return `/api/static/${path}`
  },

  // Construir URL para upload
  getUploadUrl(path: string) {
    return `/api/uploads/${path}`
  }
}

// Uso
const info = await staticApi.getInfo()
console.log('Public URL:', info.paths.publicUrl)

const logoUrl = staticApi.getPublicUrl('logo.png')
const avatarUrl = staticApi.getUploadUrl('avatars/user-123.jpg')
```

---

## Troubleshooting

### Arquivo não encontrado (404)

**Sintoma**: `File not found` mesmo existindo o arquivo

**Soluções**:
1. Verifique se o arquivo está na pasta correta (`public/` ou `uploads/`)
2. Confirme que os diretórios foram criados (criados automaticamente no boot)
3. Verifique permissões de leitura do arquivo
4. Use o endpoint `/api/static/info` para confirmar paths

### Cache não está funcionando

**Sintoma**: Navegador sempre baixa o arquivo

**Soluções**:
1. Verifique headers de resposta com DevTools
2. Confirme que `cacheMaxAge` está configurado
3. Limpe cache do navegador
4. Use ETags para validação condicional

### MIME type incorreto

**Sintoma**: Arquivo baixa ao invés de exibir

**Soluções**:
1. Verifique a extensão do arquivo
2. Adicione extensão na lista de MIME types se necessário
3. Use `content-type` header correto manualmente se necessário

### Path traversal bloqueado

**Sintoma**: `Invalid file path` para paths válidos

**Soluções**:
1. Não use `../` nos caminhos
2. Use apenas caminhos relativos
3. Evite barras duplas `//`

---

## Performance Tips

### 1. Use CDN em Produção

```typescript
// Configuração de CDN
const CDN_URL = process.env.CDN_URL || ''

function getAssetUrl(path: string) {
  return CDN_URL
    ? `${CDN_URL}/static/${path}`
    : `/api/static/${path}`
}
```

### 2. Otimize Imagens

```bash
# Comprimir imagens antes de adicionar a public/
npm install -g sharp-cli

sharp-cli resize 800 600 input.jpg -o output.jpg
```

### 3. Use WebP para Imagens Modernas

```html
<picture>
  <source srcset="/api/static/image.webp" type="image/webp">
  <img src="/api/static/image.jpg" alt="Fallback">
</picture>
```

### 4. Prefetch Assets Importantes

```html
<link rel="prefetch" href="/api/static/hero-image.jpg">
<link rel="preload" href="/api/static/fonts/Inter.woff2" as="font">
```

---

## Referências

- **Código fonte**: `core/server/plugins/static-files-plugin.ts`
- **Configuração**: `fluxstack.config.ts` → `staticFiles`
- **Variáveis de ambiente**: `ai-context/reference/environment-vars.md`
- **Build pipeline**: `ai-context/project/build-pipeline.md`
