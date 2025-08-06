# FluxStack v1.4.0 - Padrões de Desenvolvimento Monorepo

## Padrões para IAs Trabalhando com FluxStack v1.4.0

### 🚨 Regras Fundamentais v1.4.0

1. **NUNCA editar arquivos em `core/`** - São do framework (read-only)
2. **SEMPRE trabalhar em `app/`** - Código da aplicação
3. **✨ MONOREPO: Instalar libs no ROOT** - `bun add <library>` (funciona para frontend E backend)
4. **⛔ NÃO criar `app/client/package.json`** - Foi removido na v1.4.0!
5. **Usar path aliases unificados consistentemente**
6. **Manter types em `app/shared/` para compartilhamento automático**
7. **Aproveitar hot reload independente** - Backend e frontend separadamente
8. **Sempre usar Eden Treaty** - Type-safety end-to-end automático

## Criando Novas Funcionalidades

### 1. Adicionando Nova API Endpoint

#### Passo 1: Definir Types Compartilhados (Monorepo Unificado)
```typescript
// app/shared/types.ts - ✨ Tipos compartilhados automaticamente!
export interface Product {
  id: number
  name: string
  price: number
  createdAt?: Date
}

export interface CreateProductRequest {
  name: string
  price: number
}

export interface ProductResponse {
  success: boolean
  product?: Product
  message?: string
}

// ✨ NOVO: Export para Eden Treaty type-safety
export interface ProductsAPI {
  '/': {
    get: () => { products: Product[] }
    post: (body: CreateProductRequest) => ProductResponse
  }
  '/:id': {
    get: () => { product?: Product }
    delete: () => ProductResponse
  }
}
```

#### Passo 2: Criar Controller com Test Isolation
```typescript
// app/server/controllers/products.controller.ts
import type { Product, CreateProductRequest, ProductResponse } from '@/shared/types' // ✨ Path alias unificado

let products: Product[] = []

export class ProductsController {
  static async getProducts() {
    return { products }
  }

  static async createProduct(data: CreateProductRequest): Promise<ProductResponse> {
    const newProduct: Product = {
      id: Date.now(),
      name: data.name,
      price: data.price,
      createdAt: new Date()
    }

    products.push(newProduct)

    return {
      success: true,
      product: newProduct
    }
  }

  static async getProductById(id: number) {
    const product = products.find(p => p.id === id)
    return product ? { product } : null
  }

  static async deleteProduct(id: number): Promise<ProductResponse> {
    const index = products.findIndex(p => p.id === id)
    
    if (index === -1) {
      return {
        success: false,
        message: "Produto não encontrado"
      }
    }

    const deletedProduct = products.splice(index, 1)[0]
    
    return {
      success: true,
      product: deletedProduct,
      message: "Produto deletado com sucesso"
    }
  }

  // ✨ NOVO: Método para isolar dados nos testes
  static resetForTesting() {
    products.splice(0, products.length)
    products.push(
      {
        id: 1,
        name: "Produto Teste",
        price: 29.99,
        createdAt: new Date()
      },
      {
        id: 2, 
        name: "Outro Produto",
        price: 49.99,
        createdAt: new Date()
      }
    )
  }
}
```

#### Passo 3: Criar Routes com Swagger Documentation
```typescript
// app/server/routes/products.routes.ts
import { Elysia, t } from "elysia"
import { ProductsController } from "../controllers/products.controller"

export const productsRoutes = new Elysia({ prefix: "/products" })
  .get("/", () => ProductsController.getProducts(), {
    // ✨ NOVO: Documentação Swagger automática
    detail: {
      tags: ['Products'],
      summary: 'List Products',
      description: 'Retrieve a list of all products in the system'
    }
  })
  
  .get("/:id", ({ params: { id } }) => {
    const productId = parseInt(id)
    const result = ProductsController.getProductById(productId)
    
    if (!result) {
      return { error: "Produto não encontrado" }
    }
    
    return result
  }, {
    params: t.Object({
      id: t.String()
    }),
    detail: {
      tags: ['Products'],
      summary: 'Get Product by ID',
      description: 'Retrieve a specific product by its ID'
    }
  })
  
  .post("/", async ({ body, set }) => {
    try {
      return await ProductsController.createProduct(body)
    } catch (error) {
      set.status = 400
      return { 
        success: false, 
        error: "Dados inválidos", 
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }, {
    body: t.Object({
      name: t.String({ minLength: 2 }),
      price: t.Number({ minimum: 0 })
    }),
    detail: {
      tags: ['Products'],
      summary: 'Create Product',
      description: 'Create a new product with name and price'
    }
  })
  
  .delete("/:id", ({ params: { id } }) => {
    const productId = parseInt(id)
    return ProductsController.deleteProduct(productId)
  }, {
    params: t.Object({
      id: t.String()
    }),
    detail: {
      tags: ['Products'],
      summary: 'Delete Product',
      description: 'Delete a product by its ID'
    }
  })
```

#### Passo 4: Registrar Routes
```typescript
// app/server/routes/index.ts
import { Elysia } from "elysia"
import { usersRoutes } from "./users.routes"
import { productsRoutes } from "./products.routes" // Nova linha

export const apiRoutes = new Elysia({ prefix: "/api" })
  .get("/", () => ({ message: "Hello from FluxStack API!" }))
  .get("/health", () => ({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  }))
  .use(usersRoutes)
  .use(productsRoutes) // Nova linha
```

#### Passo 5: ✨ NOVO - Eden Treaty Type-Safe API Client
```typescript
// app/client/src/lib/eden-api.ts - ✨ Type-safe automático!
import { treaty } from '@elysiajs/eden'
import type { App } from '@/app/server/app' // ✨ Import de tipos do servidor

function getBaseUrl() {
  if (import.meta.env.DEV) {
    return 'http://localhost:3000'
  }
  return window.location.origin
}

// ✨ Cliente Eden Treaty type-safe
const client = treaty<App>(getBaseUrl())
export const api = client.api

// ✨ Wrapper para tratamento de erros
export const apiCall = async (promise: Promise<any>) => {
  try {
    const response = await promise
    if (response.error) throw new Error(response.error)
    return response.data || response
  } catch (error) {
    throw error
  }
}

// ✨ USAGE: Completamente tipado!
/*
const products = await apiCall(api.products.get())
const newProduct = await apiCall(api.products.post({
  name: "Produto Teste",     // ✅ Type-safe!
  price: 29.99              // ✅ Validado automaticamente!
}))
const product = await apiCall(api.products({ id: '1' }).get())
await apiCall(api.products({ id: '1' }).delete())
*/
```

#### 📚 Como Atualizar o app.ts para Eden Treaty:
```typescript
// app/server/app.ts - Export tipo para Eden Treaty
import { Elysia } from 'elysia'
import { apiRoutes } from './routes'

export const app = new Elysia()
  .use(apiRoutes)

export type App = typeof app // ✨ Export para Eden Treaty
```

### 2. Criando Componentes React 19 com Eden Treaty

#### Hook Pattern com Type-Safety
```typescript
// app/client/src/hooks/useProducts.ts
import { useState, useEffect } from 'react'
import { api, apiCall } from '@/lib/eden-api' // ✨ Eden Treaty
import type { Product, CreateProductRequest } from '@/shared/types' // ✨ Tipos compartilhados

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProducts = async () => {
    try {
      setLoading(true)
      // ✨ Eden Treaty: chamada type-safe
      const data = await apiCall(api.products.get())
      setProducts(data.products)
      setError(null)
    } catch (err) {
      setError('Erro ao buscar produtos')
      console.error('Erro ao buscar produtos:', err)
    } finally {
      setLoading(false)
    }
  }

  const addProduct = async (productData: CreateProductRequest) => {
    try {
      // ✨ Eden Treaty: tipo validado automaticamente
      const data = await apiCall(api.products.post(productData))
      if (data?.success) {
        await fetchProducts() // Recarregar lista
      }
      return data
    } catch (err) {
      setError('Erro ao adicionar produto')
      throw err
    }
  }

  const deleteProduct = async (id: number) => {
    try {
      // ✨ Nova sintaxe Eden Treaty
      await apiCall(api.products({ id: id.toString() }).delete())
      setProducts(prev => prev.filter(product => product.id !== id))
    } catch (err) {
      setError('Erro ao deletar produto')
      throw err
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  return {
    products,
    loading,
    error,
    fetchProducts,
    addProduct,
    deleteProduct // ✨ Novo método
  }
}
```

#### Component Pattern - React 19 + Type-Safe + Modern UI
```typescript
// app/client/src/components/ProductList.tsx
import { useState } from 'react'
import { useProducts } from '@/hooks/useProducts'
import type { CreateProductRequest } from '@/shared/types' // ✨ Tipo compartilhado

export function ProductList() {
  const { products, loading, error, addProduct, deleteProduct } = useProducts()
  const [formData, setFormData] = useState<CreateProductRequest>({ 
    name: '', 
    price: 0 
  })
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || formData.price <= 0) {
      setMessage('❌ Preencha todos os campos corretamente')
      return
    }

    try {
      await addProduct(formData)
      setFormData({ name: '', price: 0 })
      setMessage('✅ Produto adicionado com sucesso!')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      console.error('Erro ao adicionar produto:', error)
      setMessage('❌ Erro ao adicionar produto')
    }
  }

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Deletar produto "${name}"?`)) return
    
    try {
      await deleteProduct(id)
      setMessage('✅ Produto deletado com sucesso!')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage('❌ Erro ao deletar produto')
    }
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        Carregando produtos...
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="error">
        ❌ Erro: {error}
        <button onClick={() => window.location.reload()}>Tentar Novamente</button>
      </div>
    )
  }

  return (
    <div className="products">
      <h2>Produtos</h2>
      
      {/* ✨ Sistema de mensagens */}
      {message && (
        <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}
      
      {/* ✨ Form moderno */}
      <form onSubmit={handleSubmit} className="product-form">
        <div className="form-group">
          <label htmlFor="name">Nome do Produto:</label>
          <input
            id="name"
            type="text"
            placeholder="Nome do produto"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            minLength={2}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="price">Preço:</label>
          <input
            id="price"
            type="number"
            placeholder="0.00"
            min="0"
            step="0.01"
            value={formData.price || ''}
            onChange={(e) => setFormData({ 
              ...formData, 
              price: parseFloat(e.target.value) || 0 
            })}
            required
          />
        </div>
        
        <button type="submit" className="btn btn-primary">
          ➕ Adicionar Produto
        </button>
      </form>

      {/* ✨ Lista moderna com ações */}
      <div className="products-list">
        <h3>Lista de Produtos ({products.length})</h3>
        
        {products.length === 0 ? (
          <div className="empty-state">
            📝 Nenhum produto encontrado
          </div>
        ) : (
          <div className="products-grid">
            {products.map(product => (
              <div key={product.id} className="product-card">
                <div className="product-info">
                  <h4>{product.name}</h4>
                  <p className="price">R$ {product.price.toFixed(2)}</p>
                  {product.createdAt && (
                    <small className="date">
                      Criado em {new Date(product.createdAt).toLocaleDateString('pt-BR')}
                    </small>
                  )}
                </div>
                
                <div className="product-actions">
                  <button 
                    onClick={() => handleDelete(product.id, product.name)}
                    className="btn btn-danger btn-sm"
                    title="Deletar produto"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

#### 🎨 CSS Moderno para Componentes:
```css
/* app/client/src/components/ProductList.css */
.products {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.message {
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  text-align: center;
  font-weight: 500;
}

.message.success {
  background: #dcfce7;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.message.error {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.product-form {
  background: #f8fafc;
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #374151;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
}

.form-group input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.product-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  transition: transform 0.2s, box-shadow 0.2s;
  display: flex;
  justify-content: space-between;
  align-items: start;
}

.product-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.product-info h4 {
  margin: 0 0 0.5rem 0;
  color: #111827;
}

.product-info .price {
  font-size: 1.25rem;
  font-weight: 600;
  color: #059669;
  margin: 0;
}

.product-info .date {
  color: #6b7280;
  font-size: 0.875rem;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  display: inline-block;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-danger {
  background: #dc2626;
  color: white;
}

.btn-danger:hover {
  background: #b91c1c;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
}
```
```

## Padrões de Estrutura de Arquivos

### Controllers
- Um controller por entidade
- Métodos estáticos
- Responsabilidade única
- Validação de dados
- Tratamento de erros

### Routes
- Um arquivo de rotas por entidade
- Usar prefixos para agrupamento
- Validação com TypeBox
- Error handling consistente
- Documentação inline

### Components
- Componentes funcionais
- Custom hooks para lógica
- Props tipadas
- Responsabilidade única
- Composição sobre herança

### Types
- Tipos compartilhados em `shared/`
- Interfaces claras e descritivas
- Request/Response patterns
- Evitar `any`

## Path Aliases - Padrões de Uso

### Backend (Server) - v1.4.0
```typescript
import { FluxStackFramework } from '@/core/server'
import { config } from '@/config/fluxstack.config'
import { User } from '@/shared/types' // ✨ Tipos compartilhados
import { UsersController } from '@/app/server/controllers/users.controller'
```

### Frontend (Client) - v1.4.0 Monorepo
```typescript
import { Button } from '@/components/Button'
import { api, apiCall } from '@/lib/eden-api' // ✨ Eden Treaty type-safe
import { useProducts } from '@/hooks/useProducts'
import { Product } from '@/shared/types' // ✨ Tipos automaticamente compartilhados

// ✨ NOVO: Acesso do frontend ao backend
import type { UsersController } from '@/app/server/controllers/users.controller'
```

### 🔗 Type Sharing Automático:
```typescript
// ✨ Backend define tipos
// app/shared/types.ts
export interface User {
  id: number
  name: string
  email: string
}

// ✨ Backend usa
// app/server/controllers/users.controller.ts  
import type { User } from '@/shared/types'

// ✨ Frontend usa AUTOMATICAMENTE
// app/client/src/components/UserList.tsx
import type { User } from '@/shared/types' // ✅ Funciona!
```

## Validação e Error Handling

### Backend Validation
```typescript
body: t.Object({
  name: t.String({ minLength: 2, maxLength: 100 }),
  email: t.String({ format: "email" }),
  age: t.Number({ minimum: 0, maximum: 120 })
})
```

### Frontend Validation
```typescript
const validateForm = (data: FormData) => {
  const errors: string[] = []
  
  if (!data.name || data.name.length < 2) {
    errors.push('Nome deve ter pelo menos 2 caracteres')
  }
  
  if (!data.email || !/\S+@\S+\.\S+/.test(data.email)) {
    errors.push('Email inválido')
  }
  
  return errors
}
```

## Comandos de Desenvolvimento v1.4.0

### 📦 Instalação Unificada (Monorepo)
```bash
# ✨ UMA única instalação para TUDO!
bun install              # Instala backend + frontend de uma vez

# ✨ Instalar nova library (funciona para ambos!)
bun add <library>        # Adiciona para frontend E backend
bun add -d <dev-dep>     # Dev dependency unificada

# Exemplos:
bun add zod              # ✅ Disponível no frontend E backend
bun add react-router-dom # ✅ Frontend (tipos no backend)
bun add prisma           # ✅ Backend (tipos no frontend)
```

### ⚡ Desenvolvimento com Hot Reload Independente
```bash
# Full-stack com hot reload independente
bun run dev              # Backend:3000 + Frontend integrado:5173
                        # Hot reload: Backend e frontend separadamente!

# Desenvolvimento separado
bun run dev:frontend     # Vite dev server puro (porta 5173)
bun run dev:backend      # API standalone (porta 3001) 

# Modo legacy (direto)
bun run legacy:dev       # Bun --watch direto
```

### 📦 Build System Unificado
```bash
# Build completo otimizado
bun run build               # Frontend + backend (dist/)
bun run build:frontend     # Apenas frontend (dist/client/)
bun run build:backend      # Apenas backend (dist/index.js)

# Produção
bun run start              # Servidor de produção unificado
bun run start:frontend     # Frontend estático apenas
bun run start:backend      # Backend standalone
```

### 🧪 Testes (30 testes inclusos)
```bash
bun run test              # Modo watch (desenvolvimento)
bun run test:run         # Executar uma vez (CI/CD)
bun run test:ui          # Interface visual do Vitest
bun run test:coverage    # Relatório de cobertura
```

### 🔍 Verificação (se configurado)
```bash
bun run lint             # ESLint unificado
bun run typecheck        # TypeScript check
bun run format           # Prettier (se configurado)
```

### Testando APIs (quando disponível)
```bash
# Health check
curl http://localhost:3000/api/health

# Testar endpoints
curl http://localhost:3000/api/users
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "João", "email": "joao@example.com"}'
```

## Debugging e Troubleshooting v1.4.0

### 🔍 Hot Reload Intelligence
```bash
# Logs esperados no desenvolvimento:
⚡ FluxStack Full-Stack Development
🚀 API ready at http://localhost:3000/api
✅ Vite já está rodando na porta 5173  
🔄 Backend hot reload independente do frontend
```

**Como funciona:**
1. **Backend change** → Bun reinicia (~500ms), Vite continua
2. **Frontend change** → Vite HMR (~100ms), backend não afetado
3. **Vite já rodando** → CLI detecta e não reinicia

### 🌍 URLs de Desenvolvimento
- **Frontend integrado**: `http://localhost:3000`
- **Frontend Vite**: `http://localhost:5173`  
- **API**: `http://localhost:3000/api/*`
- **Swagger UI**: `http://localhost:3000/swagger`
- **Health Check**: `http://localhost:3000/api/health`
- **Backend standalone**: `http://localhost:3001`

### 🚫 Common Issues v1.4.0

#### "Package.json not found in app/client"
✅ **Solução**: Normal na v1.4.0! Não há mais package.json no client.

#### "Library not found" no frontend
✅ **Solução**: `bun add <library>` no root (instala para ambos)

#### "Types not found" entre frontend/backend
✅ **Solução**: Colocar tipos em `app/shared/types.ts`

#### "Vite not starting" ou "Port already in use"
✅ **Solução**: CLI detecta automaticamente e não reinicia

#### "Eden Treaty types not working"
✅ **Solução**: Verificar export `App` em `app/server/app.ts`

#### "Hot reload not working"
✅ **Solução**: Usar `bun run dev` (não `bun run legacy:dev`)

### 🧠 Build Issues
```bash
# Limpar builds anteriores
rm -rf dist/
rm -rf node_modules/.vite/

# Reinstalar dependências
rm -rf node_modules/ bun.lockb
bun install

# Build limpo
bun run build
```

### 📊 Performance Monitoring
```bash
# Verificar performance da instalação
time bun install        # ~3-15s (vs ~30-60s dual package.json)

# Verificar hot reload
# Backend: ~500ms reload
# Frontend: ~100ms HMR

# Verificar build size
ls -la dist/client/assets/  # Frontend bundles
ls -la dist/index.js        # Backend bundle
```

### 📝 Para IAs: Checklist v1.4.0

#### ✅ FAZER:
1. Instalar libs no root: `bun add <library>`
2. Tipos compartilhados em `app/shared/`
3. Usar Eden Treaty para APIs: `await apiCall(api.users.get())`
4. Documentar rotas com Swagger: `detail: { tags: [...], summary: '...' }`
5. Usar path aliases: `@/shared/types`, `@/lib/eden-api`
6. Criar testes para novos recursos
7. Aproveitar hot reload independente

#### ⛔ NÃO FAZER:
1. NãO editar `core/` (read-only)
2. NãO criar `app/client/package.json` (removido!)
3. NãO instalar deps separadamente (`cd app/client`)
4. NãO quebrar type-safety (usar `any`)
5. NãO ignorar Swagger documentation
6. Não usar fetch manual (usar Eden Treaty)
7. NãO duplicar configurações

Seguindo estes padrões v1.4.0, você terá código type-safe, performático e de fácil manutenção no FluxStack! ⚡