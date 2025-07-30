# FluxStack - Padrões de Desenvolvimento

## Padrões para IAs Trabalhando com FluxStack

### 🚨 Regras Fundamentais

1. **NUNCA editar arquivos em `core/`** - São do framework
2. **SEMPRE trabalhar em `app/`** - Código da aplicação
3. **Usar path aliases consistentemente**
4. **Manter types compartilhados atualizados**
5. **Seguir padrão MVC estrito**

## Criando Novas Funcionalidades

### 1. Adicionando Nova API Endpoint

#### Passo 1: Definir Types Compartilhados
```typescript
// app/shared/types.ts
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
```

#### Passo 2: Criar Controller
```typescript
// app/server/controllers/products.controller.ts
import type { Product, CreateProductRequest, ProductResponse } from '../types'

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
}
```

#### Passo 3: Criar Routes
```typescript
// app/server/routes/products.routes.ts
import { Elysia, t } from "elysia"
import { ProductsController } from "../controllers/products.controller"

export const productsRoutes = new Elysia({ prefix: "/products" })
  .get("/", () => ProductsController.getProducts())
  
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
    })
  })
  
  .post("/", async ({ body, set }) => {
    try {
      return await ProductsController.createProduct(body)
    } catch (error) {
      set.status = 400
      return { 
        success: false, 
        error: "Dados inválidos", 
        details: error.message 
      }
    }
  }, {
    body: t.Object({
      name: t.String({ minLength: 2 }),
      price: t.Number({ minimum: 0 })
    })
  })
  
  .delete("/:id", ({ params: { id } }) => {
    const productId = parseInt(id)
    return ProductsController.deleteProduct(productId)
  }, {
    params: t.Object({
      id: t.String()
    })
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

#### Passo 5: Atualizar API Client
```typescript
// app/client/src/lib/api.ts
export const api = {
  api: {
    index: {
      get: async () => {
        const response = await fetch(`${baseUrl}/api`)
        const data = await response.json()
        return { data }
      }
    },
    users: {
      get: async () => {
        const response = await fetch(`${baseUrl}/api/users`)
        const data = await response.json()
        return { data }
      },
      post: async (body: { name: string; email: string }) => {
        const response = await fetch(`${baseUrl}/api/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        })
        const data = await response.json()
        return { data }
      }
    },
    products: { // Nova seção
      get: async () => {
        const response = await fetch(`${baseUrl}/api/products`)
        const data = await response.json()
        return { data }
      },
      post: async (body: { name: string; price: number }) => {
        const response = await fetch(`${baseUrl}/api/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        })
        const data = await response.json()
        return { data }
      }
    }
  }
}
```

### 2. Criando Componentes React

#### Hook Pattern
```typescript
// app/client/src/hooks/useProducts.ts
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import type { Product } from '@/shared/types'

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const { data } = await api.api.products.get()
      setProducts(data.products)
      setError(null)
    } catch (err) {
      setError('Erro ao buscar produtos')
      console.error('Erro ao buscar produtos:', err)
    } finally {
      setLoading(false)
    }
  }

  const addProduct = async (productData: { name: string; price: number }) => {
    try {
      const { data } = await api.api.products.post(productData)
      if (data?.success) {
        await fetchProducts() // Recarregar lista
      }
      return data
    } catch (err) {
      setError('Erro ao adicionar produto')
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
    addProduct
  }
}
```

#### Component Pattern
```typescript
// app/client/src/components/ProductList.tsx
import { useState } from 'react'
import { useProducts } from '@/hooks/useProducts'

interface ProductFormData {
  name: string
  price: number
}

export function ProductList() {
  const { products, loading, error, addProduct } = useProducts()
  const [formData, setFormData] = useState<ProductFormData>({ name: '', price: 0 })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || formData.price <= 0) return

    try {
      await addProduct(formData)
      setFormData({ name: '', price: 0 })
    } catch (error) {
      console.error('Erro ao adicionar produto:', error)
    }
  }

  if (loading) return <div>Carregando produtos...</div>
  if (error) return <div>Erro: {error}</div>

  return (
    <div>
      <h2>Produtos</h2>
      
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Nome do produto"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
        <input
          type="number"
          placeholder="Preço"
          min="0"
          step="0.01"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
        />
        <button type="submit">Adicionar Produto</button>
      </form>

      <ul>
        {products.map(product => (
          <li key={product.id}>
            {product.name} - R$ {product.price.toFixed(2)}
          </li>
        ))}
      </ul>
    </div>
  )
}
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

### Backend (Server)
```typescript
import { FluxStackFramework } from '@/core/server'
import { config } from '@/config/fluxstack.config'
import { User } from '@/shared/types'
```

### Frontend (Client)
```typescript
import { Button } from '@/components/Button'
import { api } from '@/lib/api'
import { useProducts } from '@/hooks/useProducts'
import { Product } from '@/shared/types'
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

## Comandos de Desenvolvimento

### Para IAs
```bash
# Sempre usar estes comandos para desenvolvimento
bun run dev              # Full-stack development
bun run dev:frontend     # Frontend apenas
bun run dev:backend      # Backend apenas

# Build e produção
bun run build           # Build completo
bun run start           # Produção

# Verificação
bun run lint            # Se existir
bun run typecheck       # Se existir
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

## Debugging e Troubleshooting

### Logs do Framework
- Logger plugin ativo automaticamente
- Logs de request/response
- Error handling integrado

### Desenvolvimento Separado
- Frontend: porta 5173
- Backend: porta 3001
- Proxy automático configurado

### Build Issues
- Verificar path aliases
- Verificar tipos compartilhados
- Limpar dist/ se necessário

Seguindo estes padrões, você terá código consistente e maintível no FluxStack.