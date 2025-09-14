# FluxStack v1.4.1 - Padrões de Desenvolvimento

## Padrões para IAs Trabalhando com FluxStack v1.4.1

### 🚨 Regras Fundamentais v1.4.1

1. **NUNCA editar arquivos em `core/`** - São do framework (read-only, 100% testado)
2. **SEMPRE trabalhar em `app/`** - Código da aplicação (user space)
3. **✨ MONOREPO ESTÁVEL: Instalar libs no ROOT** - `bun add <library>` (89 arquivos TS unificados)
4. **⛔ NÃO criar `app/client/package.json`** - Removido permanentemente na v1.4.0!
5. **Usar configuração robusta com precedência clara**
6. **Manter types em `app/shared/` para type-safety automática**
7. **Aproveitar hot reload independente testado** - 312 testes garantem funcionamento
8. **Sempre usar Eden Treaty** - Type-safety end-to-end validada
9. **✅ ZERO erros TypeScript** - Sistema 100% estável
10. **🧪 Escrever testes** - Manter taxa de 100% de sucesso

### 📊 Estado Atual (v1.4.1)
- **89 arquivos TypeScript/TSX**
- **312 testes (100% passando)**
- **Zero erros TypeScript**
- **Sistema de configuração robusto**
- **CI/CD pipeline estável**

## Criando Novas Funcionalidades

### 1. Adicionando Nova API Endpoint

#### Passo 1: Definir Types Compartilhados (Type-safe)
```typescript
// app/shared/types.ts - ✨ Tipos compartilhados automaticamente!
export interface Product {
  id: number
  name: string
  price: number
  category: string
  inStock: boolean
  createdAt: Date
  updatedAt?: Date
}

export interface CreateProductRequest {
  name: string
  price: number
  category: string
  inStock?: boolean
}

export interface UpdateProductRequest {
  name?: string
  price?: number
  category?: string
  inStock?: boolean
}

export interface ProductResponse {
  success: boolean
  product?: Product
  message?: string
}

export interface ProductListResponse {
  success: boolean
  products: Product[]
  total: number
  pagination?: {
    page: number
    limit: number
    totalPages: number
  }
}
```

#### Passo 2: Criar Controller (Testável)
```typescript
// app/server/controllers/products.controller.ts
import type { Product, CreateProductRequest, UpdateProductRequest } from '@/shared/types'

export class ProductsController {
  private static products: Product[] = []
  private static nextId = 1

  static async getProducts() {
    return { 
      success: true, 
      products: this.products, 
      total: this.products.length 
    }
  }

  static async getProduct(id: number) {
    const product = this.products.find(p => p.id === id)
    if (!product) {
      return { success: false, message: 'Product not found' }
    }
    
    return { success: true, product }
  }

  static async createProduct(data: CreateProductRequest) {
    const newProduct: Product = {
      id: this.nextId++,
      name: data.name,
      price: data.price,
      category: data.category,
      inStock: data.inStock ?? true,
      createdAt: new Date()
    }
    
    this.products.push(newProduct)
    return { success: true, product: newProduct }
  }

  static async updateProduct(id: number, data: UpdateProductRequest) {
    const index = this.products.findIndex(p => p.id === id)
    if (index === -1) {
      return { success: false, message: 'Product not found' }
    }
    
    this.products[index] = {
      ...this.products[index],
      ...data,
      updatedAt: new Date()
    }
    
    return { success: true, product: this.products[index] }
  }

  static async deleteProduct(id: number) {
    const index = this.products.findIndex(p => p.id === id)
    if (index === -1) {
      return { success: false, message: 'Product not found' }
    }
    
    this.products.splice(index, 1)
    return { success: true, message: 'Product deleted successfully' }
  }

  // Utility for tests - reset data
  static reset() {
    this.products = []
    this.nextId = 1
  }
}
```

#### Passo 3: Criar Routes com Swagger Completo
```typescript
// app/server/routes/products.routes.ts
import { Elysia, t } from 'elysia'
import { ProductsController } from '../controllers/products.controller'

export const productsRoutes = new Elysia({ prefix: "/products" })
  // List all products
  .get("/", () => ProductsController.getProducts(), {
    detail: {
      tags: ['Products'],
      summary: 'List Products',
      description: 'Retrieve a paginated list of all products in the system',
      responses: {
        200: {
          description: 'List of products retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  products: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'number' },
                        name: { type: 'string' },
                        price: { type: 'number' },
                        category: { type: 'string' },
                        inStock: { type: 'boolean' },
                        createdAt: { type: 'string', format: 'date-time' }
                      }
                    }
                  },
                  total: { type: 'number' }
                }
              }
            }
          }
        }
      }
    }
  })
  
  // Get single product
  .get("/:id", ({ params }) => ProductsController.getProduct(parseInt(params.id)), {
    params: t.Object({
      id: t.String({ pattern: '^\\d+$' })
    }),
    detail: {
      tags: ['Products'],
      summary: 'Get Product',
      description: 'Retrieve a single product by its ID',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string', pattern: '^\\d+$' },
          description: 'Product ID'
        }
      ]
    }
  })
  
  // Create new product
  .post("/", ({ body }) => ProductsController.createProduct(body), {
    body: t.Object({
      name: t.String({ minLength: 2, maxLength: 100 }),
      price: t.Number({ minimum: 0 }),
      category: t.String({ minLength: 2, maxLength: 50 }),
      inStock: t.Optional(t.Boolean())
    }),
    detail: {
      tags: ['Products'],
      summary: 'Create Product',
      description: 'Create a new product with name, price, and category',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name', 'price', 'category'],
              properties: {
                name: { 
                  type: 'string', 
                  minLength: 2, 
                  maxLength: 100,
                  description: 'Product name'
                },
                price: { 
                  type: 'number', 
                  minimum: 0,
                  description: 'Product price'
                },
                category: { 
                  type: 'string', 
                  minLength: 2, 
                  maxLength: 50,
                  description: 'Product category'
                },
                inStock: { 
                  type: 'boolean',
                  description: 'Whether the product is in stock',
                  default: true
                }
              }
            }
          }
        }
      }
    }
  })
  
  // Update product
  .put("/:id", ({ params, body }) => ProductsController.updateProduct(parseInt(params.id), body), {
    params: t.Object({
      id: t.String({ pattern: '^\\d+$' })
    }),
    body: t.Object({
      name: t.Optional(t.String({ minLength: 2, maxLength: 100 })),
      price: t.Optional(t.Number({ minimum: 0 })),
      category: t.Optional(t.String({ minLength: 2, maxLength: 50 })),
      inStock: t.Optional(t.Boolean())
    }),
    detail: {
      tags: ['Products'],
      summary: 'Update Product',
      description: 'Update an existing product by ID'
    }
  })
  
  // Delete product
  .delete("/:id", ({ params }) => ProductsController.deleteProduct(parseInt(params.id)), {
    params: t.Object({
      id: t.String({ pattern: '^\\d+$' })
    }),
    detail: {
      tags: ['Products'],
      summary: 'Delete Product',
      description: 'Delete a product by ID'
    }
  })
```

#### Passo 4: Integrar no Router Principal
```typescript
// app/server/routes/index.ts
import { Elysia } from 'elysia'
import { usersRoutes } from './users.routes'
import { productsRoutes } from './products.routes'  // ✨ Nova rota

// Health check route
const healthRoutes = new Elysia()
  .get("/health", () => ({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    version: "1.4.1",
    environment: process.env.NODE_ENV || "development"
  }), {
    detail: {
      tags: ['Health'],
      summary: 'Health Check',
      description: 'Check if the API is running and healthy'
    }
  })
  .get("/", () => ({ 
    message: "FluxStack API v1.4.1", 
    docs: "/swagger",
    health: "/api/health"
  }), {
    detail: {
      tags: ['Health'],
      summary: 'API Info',
      description: 'Get basic API information and available endpoints'
    }
  })

// Combine all routes
export const apiRoutes = new Elysia({ prefix: "/api" })
  .use(healthRoutes)
  .use(usersRoutes)
  .use(productsRoutes)    // ✨ Adicionar nova rota
```

### 2. Frontend Integration com Type-Safety

#### Passo 1: Usar Eden Treaty no Frontend (Type-safe)
```typescript
// app/client/src/components/ProductManager.tsx
import { useState, useEffect } from 'react'
import { api, apiCall, getErrorMessage } from '@/lib/eden-api'
import type { Product, CreateProductRequest } from '@/shared/types'

export function ProductManager() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    category: '',
    inStock: true
  })

  // Load products with full type safety
  const loadProducts = async () => {
    try {
      setLoading(true)
      const response = await apiCall(api.products.get())
      setProducts(response.products || [])
    } catch (error) {
      console.error('Error loading products:', getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  // Create product with Eden Treaty
  const createProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const productData: CreateProductRequest = {
        name: formData.name.trim(),
        price: Number(formData.price),
        category: formData.category.trim(),
        inStock: formData.inStock
      }
      
      const response = await apiCall(api.products.post(productData))
      
      if (response.success && response.product) {
        setProducts(prev => [...prev, response.product])
        setFormData({ name: '', price: 0, category: '', inStock: true })
      }
    } catch (error) {
      console.error('Error creating product:', getErrorMessage(error))
    }
  }

  // Delete product with confirmation
  const deleteProduct = async (id: number, name: string) => {
    if (!confirm(`Delete product "${name}"?`)) return
    
    try {
      await apiCall(api.products({ id: id.toString() }).delete())
      setProducts(prev => prev.filter(p => p.id !== id))
    } catch (error) {
      console.error('Error deleting product:', getErrorMessage(error))
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  return (
    <div className="product-manager">
      <h2>Product Management</h2>
      
      {/* Create Form */}
      <form onSubmit={createProduct} className="create-form">
        <div className="form-group">
          <input
            type="text"
            placeholder="Product Name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
          <input
            type="number"
            placeholder="Price"
            step="0.01"
            min="0"
            value={formData.price}
            onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
            required
          />
          <input
            type="text"
            placeholder="Category"
            value={formData.category}
            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
            required
          />
          <label>
            <input
              type="checkbox"
              checked={formData.inStock}
              onChange={(e) => setFormData(prev => ({ ...prev, inStock: e.target.checked }))}
            />
            In Stock
          </label>
          <button type="submit">Create Product</button>
        </div>
      </form>

      {/* Products List */}
      <div className="products-list">
        {loading ? (
          <div>Loading products...</div>
        ) : products.length === 0 ? (
          <div>No products found</div>
        ) : (
          <div className="products-grid">
            {products.map(product => (
              <div key={product.id} className="product-card">
                <h3>{product.name}</h3>
                <p>Price: ${product.price.toFixed(2)}</p>
                <p>Category: {product.category}</p>
                <p>Status: {product.inStock ? 'In Stock' : 'Out of Stock'}</p>
                <p>Created: {new Date(product.createdAt).toLocaleDateString()}</p>
                <button 
                  onClick={() => deleteProduct(product.id, product.name)}
                  className="delete-btn"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

### 3. Criando Testes (Manter 100% de Sucesso)

#### Passo 1: Controller Tests
```typescript
// tests/unit/app/controllers/products.controller.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { ProductsController } from '@/app/server/controllers/products.controller'

describe('ProductsController', () => {
  beforeEach(() => {
    // Reset data between tests to maintain isolation
    ProductsController.reset()
  })

  describe('getProducts', () => {
    it('should return empty list initially', async () => {
      const result = await ProductsController.getProducts()
      
      expect(result.success).toBe(true)
      expect(result.products).toEqual([])
      expect(result.total).toBe(0)
    })

    it('should return all products after creation', async () => {
      // Create test products
      await ProductsController.createProduct({
        name: 'Test Product 1',
        price: 99.99,
        category: 'Electronics'
      })
      
      await ProductsController.createProduct({
        name: 'Test Product 2',
        price: 49.99,
        category: 'Books'
      })

      const result = await ProductsController.getProducts()
      
      expect(result.success).toBe(true)
      expect(result.products).toHaveLength(2)
      expect(result.total).toBe(2)
    })
  })

  describe('createProduct', () => {
    it('should create product with valid data', async () => {
      const productData = {
        name: 'New Product',
        price: 29.99,
        category: 'Home'
      }

      const result = await ProductsController.createProduct(productData)
      
      expect(result.success).toBe(true)
      expect(result.product).toBeDefined()
      expect(result.product?.name).toBe(productData.name)
      expect(result.product?.price).toBe(productData.price)
      expect(result.product?.category).toBe(productData.category)
      expect(result.product?.inStock).toBe(true) // Default value
      expect(result.product?.id).toBe(1)
      expect(result.product?.createdAt).toBeInstanceOf(Date)
    })

    it('should create product with explicit inStock value', async () => {
      const productData = {
        name: 'Out of Stock Product',
        price: 19.99,
        category: 'Limited',
        inStock: false
      }

      const result = await ProductsController.createProduct(productData)
      
      expect(result.success).toBe(true)
      expect(result.product?.inStock).toBe(false)
    })
  })

  describe('getProduct', () => {
    it('should return product if exists', async () => {
      // Create a product first
      const createResult = await ProductsController.createProduct({
        name: 'Find Me',
        price: 15.99,
        category: 'Test'
      })

      const result = await ProductsController.getProduct(createResult.product!.id)
      
      expect(result.success).toBe(true)
      expect(result.product).toBeDefined()
      expect(result.product?.name).toBe('Find Me')
    })

    it('should return error if product not found', async () => {
      const result = await ProductsController.getProduct(999)
      
      expect(result.success).toBe(false)
      expect(result.message).toBe('Product not found')
      expect(result.product).toBeUndefined()
    })
  })

  describe('deleteProduct', () => {
    it('should delete existing product', async () => {
      // Create a product first
      const createResult = await ProductsController.createProduct({
        name: 'Delete Me',
        price: 5.99,
        category: 'Temporary'
      })

      const deleteResult = await ProductsController.deleteProduct(createResult.product!.id)
      
      expect(deleteResult.success).toBe(true)
      expect(deleteResult.message).toBe('Product deleted successfully')

      // Verify it's actually deleted
      const getResult = await ProductsController.getProduct(createResult.product!.id)
      expect(getResult.success).toBe(false)
    })

    it('should return error when deleting non-existent product', async () => {
      const result = await ProductsController.deleteProduct(999)
      
      expect(result.success).toBe(false)
      expect(result.message).toBe('Product not found')
    })
  })
})
```

#### Passo 2: API Integration Tests
```typescript
// tests/integration/api/products.routes.test.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { FluxStackFramework } from '@/core/server/framework'
import { productsRoutes } from '@/app/server/routes/products.routes'
import { ProductsController } from '@/app/server/controllers/products.controller'

describe('Products API Routes', () => {
  let app: FluxStackFramework
  let server: any

  beforeAll(async () => {
    app = new FluxStackFramework({
      server: { port: 0, host: 'localhost', apiPrefix: '/api' },
      app: { name: 'test-app', version: '1.0.0' }
    })
    
    app.routes(productsRoutes)
    server = app.getApp()
  })

  beforeEach(() => {
    // Reset controller data between tests
    ProductsController.reset()
  })

  describe('GET /api/products', () => {
    it('should return empty products list', async () => {
      const response = await server
        .handle(new Request('http://localhost/api/products'))
        
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.products).toEqual([])
      expect(data.total).toBe(0)
    })

    it('should return products after creation', async () => {
      // Create a product first
      await ProductsController.createProduct({
        name: 'API Test Product',
        price: 99.99,
        category: 'API Testing'
      })

      const response = await server
        .handle(new Request('http://localhost/api/products'))
        
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.products).toHaveLength(1)
      expect(data.products[0].name).toBe('API Test Product')
    })
  })

  describe('POST /api/products', () => {
    it('should create product with valid data', async () => {
      const productData = {
        name: 'New API Product',
        price: 49.99,
        category: 'API Created'
      }

      const response = await server
        .handle(new Request('http://localhost/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productData)
        }))
        
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.product.name).toBe(productData.name)
      expect(data.product.price).toBe(productData.price)
      expect(data.product.id).toBe(1)
    })

    it('should reject invalid product data', async () => {
      const invalidData = {
        name: 'A', // Too short
        price: -10, // Negative price
        category: ''  // Empty category
      }

      const response = await server
        .handle(new Request('http://localhost/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(invalidData)
        }))
        
      expect(response.status).toBe(422) // Validation error
    })
  })
})
```

### 4. Padrões de Plugin Development

#### Criando Plugin Customizado
```typescript
// app/server/plugins/analytics.plugin.ts
import type { Plugin, PluginContext } from '@/core/types'

interface AnalyticsConfig {
  enabled: boolean
  trackRequests: boolean
  trackErrors: boolean
  reportInterval: number
}

interface RequestMetrics {
  path: string
  method: string
  timestamp: Date
  responseTime: number
  statusCode: number
}

class AnalyticsCollector {
  private metrics: RequestMetrics[] = []
  private config: AnalyticsConfig

  constructor(config: AnalyticsConfig) {
    this.config = config
    
    if (config.enabled && config.reportInterval > 0) {
      setInterval(() => this.generateReport(), config.reportInterval)
    }
  }

  recordRequest(metric: RequestMetrics) {
    if (!this.config.trackRequests) return
    this.metrics.push(metric)
  }

  generateReport() {
    const report = {
      totalRequests: this.metrics.length,
      averageResponseTime: this.getAverageResponseTime(),
      statusCodes: this.getStatusCodeDistribution(),
      topPaths: this.getTopPaths(),
      timestamp: new Date()
    }
    
    console.log('📊 Analytics Report:', report)
    return report
  }

  private getAverageResponseTime(): number {
    if (this.metrics.length === 0) return 0
    return this.metrics.reduce((sum, m) => sum + m.responseTime, 0) / this.metrics.length
  }

  private getStatusCodeDistribution(): Record<number, number> {
    return this.metrics.reduce((acc, m) => {
      acc[m.statusCode] = (acc[m.statusCode] || 0) + 1
      return acc
    }, {} as Record<number, number>)
  }

  private getTopPaths(): Array<{ path: string; count: number }> {
    const pathCounts = this.metrics.reduce((acc, m) => {
      acc[m.path] = (acc[m.path] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(pathCounts)
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }

  getMetrics() {
    return {
      totalRequests: this.metrics.length,
      metrics: this.metrics.slice(-100) // Last 100 requests
    }
  }

  reset() {
    this.metrics = []
  }
}

export const analyticsPlugin: Plugin = {
  name: 'analytics',
  setup(context: PluginContext) {
    const config: AnalyticsConfig = {
      enabled: context.config.custom?.analytics?.enabled ?? true,
      trackRequests: context.config.custom?.analytics?.trackRequests ?? true,
      trackErrors: context.config.custom?.analytics?.trackErrors ?? true,
      reportInterval: context.config.custom?.analytics?.reportInterval ?? 60000 // 1 minute
    }

    if (!config.enabled) {
      context.logger.info('Analytics plugin disabled')
      return
    }

    const collector = new AnalyticsCollector(config)
    context.logger.info('Analytics plugin enabled', { config })

    // Track requests
    context.app.onRequest(({ request }) => {
      const startTime = Date.now()
      
      // Store start time for response measurement
      ;(request as any).startTime = startTime
    })

    // Track responses
    context.app.onResponse(({ request, set }) => {
      const startTime = (request as any).startTime
      const responseTime = Date.now() - startTime
      
      const url = new URL(request.url)
      collector.recordRequest({
        path: url.pathname,
        method: request.method,
        timestamp: new Date(),
        responseTime,
        statusCode: set.status || 200
      })
    })

    // Add analytics endpoint
    context.app.get('/analytics', () => collector.generateReport(), {
      detail: {
        tags: ['Analytics'],
        summary: 'Get Analytics Report',
        description: 'Get current analytics and metrics report'
      }
    })

    // Add metrics endpoint
    context.app.get('/metrics', () => collector.getMetrics(), {
      detail: {
        tags: ['Analytics'],
        summary: 'Get Raw Metrics',
        description: 'Get raw metrics data'
      }
    })

    // Add reset endpoint (useful for testing)
    context.app.delete('/analytics/reset', () => {
      collector.reset()
      return { success: true, message: 'Analytics data reset' }
    }, {
      detail: {
        tags: ['Analytics'],
        summary: 'Reset Analytics',
        description: 'Reset all analytics data (useful for testing)'
      }
    })
  }
}
```

#### Usando o Plugin no App
```typescript
// app/server/index.ts
import { FluxStackFramework, loggerPlugin, vitePlugin, swaggerPlugin } from "@/core/server"
import { analyticsPlugin } from './plugins/analytics.plugin'  // ✨ Plugin customizado
import { apiRoutes } from "./routes"

const app = new FluxStackFramework({
  server: { port: 3000, host: "localhost", apiPrefix: "/api" },
  app: { name: "FluxStack", version: "1.0.0" },
  client: { port: 5173, proxy: { target: "http://localhost:3000" } }
})

// Infrastructure plugins first
app
  .use(loggerPlugin)
  .use(vitePlugin)
  .use(analyticsPlugin)  // ✨ Plugin customizado

// Application routes
app.routes(apiRoutes)

// Swagger last to discover all routes
app.use(swaggerPlugin)

// Start the application
app.listen()
```

### 5. Padrões de Configuração Avançada

#### Custom Configuration
```typescript
// fluxstack.config.ts - Configuração personalizada
import type { FluxStackConfig } from './core/config/schema'
import { getEnvironmentInfo } from './core/config/env'

const env = getEnvironmentInfo()

export const config: FluxStackConfig = {
  app: {
    name: 'My Advanced App',
    version: '2.0.0',
    description: 'Advanced FluxStack application with custom features'
  },

  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    host: process.env.HOST || 'localhost',
    apiPrefix: '/api/v2',  // Custom API prefix
    cors: {
      origins: env.isProduction 
        ? ['https://myapp.com', 'https://admin.myapp.com']
        : ['http://localhost:3000', 'http://localhost:5173'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      headers: ['Content-Type', 'Authorization', 'X-API-Key'],
      credentials: true,
      maxAge: 86400
    }
  },

  plugins: {
    enabled: ['logger', 'swagger', 'vite', 'analytics'],
    config: {
      swagger: {
        title: 'My Advanced API',
        version: '2.0.0',
        description: 'Advanced API with comprehensive endpoints'
      },
      analytics: {
        enabled: env.isProduction,
        trackRequests: true,
        trackErrors: true,
        reportInterval: env.isProduction ? 300000 : 60000  // 5min prod, 1min dev
      }
    }
  },

  logging: {
    level: env.isProduction ? 'warn' : 'debug',
    format: env.isProduction ? 'json' : 'pretty',
    transports: env.isProduction ? [
      { type: 'console', level: 'warn', format: 'json' },
      { 
        type: 'file', 
        level: 'error', 
        format: 'json',
        options: { filename: 'logs/error.log', maxSize: '10m', maxFiles: 5 }
      }
    ] : [
      { type: 'console', level: 'debug', format: 'pretty' }
    ]
  },

  monitoring: {
    enabled: env.isProduction,
    metrics: {
      enabled: env.isProduction,
      collectInterval: 10000,
      httpMetrics: true,
      systemMetrics: true
    }
  },

  // Custom configuration for your application
  custom: {
    // Analytics plugin config
    analytics: {
      enabled: env.isProduction,
      trackRequests: true,
      trackErrors: true,
      reportInterval: env.isProduction ? 300000 : 60000
    },
    
    // Feature flags
    features: {
      advancedSearch: true,
      realTimeUpdates: env.isProduction,
      experimentalUI: env.isDevelopment
    },
    
    // Rate limiting
    rateLimit: {
      enabled: env.isProduction,
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: env.isProduction ? 100 : 1000
    }
  }
}

export default config
```

## Padrões Anti-Patterns (❌ NÃO FAZER)

### 1. ❌ Editar Core Framework
```typescript
// ❌ NUNCA FAZER - Editar core/
// core/server/framework.ts
export class FluxStackFramework {
  // NÃO editar este arquivo!
}
```

### 2. ❌ Criar package.json Separado
```json
// ❌ NUNCA FAZER - app/client/package.json
{
  "name": "frontend",  // Este arquivo não deve existir!
  "dependencies": {
    "react": "^19.0.0"
  }
}
```

### 3. ❌ Ignorar Type Safety
```typescript
// ❌ EVITAR
const data: any = await api.users.get()  // Perde type safety

// ✅ CORRETO
const data = await apiCall(api.users.get())  // Mantém types
```

### 4. ❌ Hardcoded Configuration
```typescript
// ❌ EVITAR
const app = new FluxStackFramework({
  server: { port: 3000 }  // Hardcoded
})

// ✅ CORRETO
const app = new FluxStackFramework({
  server: { 
    port: parseInt(process.env.PORT || '3000', 10)  // Configurável
  }
})
```

### 5. ❌ Pular Testes
```typescript
// ❌ EVITAR - Não implementar sem testes
export function criticalFeature() {
  // Código sem testes
}

// ✅ CORRETO - Sempre com testes
export function criticalFeature() {
  // Código testado em tests/
}
```

## Workflow Recomendado para IAs

### 📝 Checklist para Novas Features

#### Antes de Começar:
- [ ] ✅ **Verificar se lib existe**: `grep "<library>" package.json`
- [ ] 🔍 **Analisar arquitetura atual**: Entender como features similares foram implementadas
- [ ] 📊 **Planejar testes**: Como a feature será testada?

#### Durante o Desenvolvimento:
- [ ] 🎯 **Definir types em `app/shared/`**: Type-safety primeiro
- [ ] 🏗️ **Criar controller testável**: Lógica de negócio isolada
- [ ] 🛣️ **Implementar routes com Swagger**: Documentação completa
- [ ] 🎨 **Integrar no frontend**: Eden Treaty para type-safety
- [ ] 🧪 **Escrever testes abrangentes**: Unit + Integration tests
- [ ] ⚙️ **Configurar adequadamente**: Usar sistema de config robusto

#### Depois de Implementar:
- [ ] 🧪 **Rodar todos os testes**: `bun run test:run` (manter 100%)
- [ ] 🔍 **Verificar TypeScript**: Zero erros obrigatório
- [ ] 📚 **Testar Swagger docs**: Documentação funcionando?
- [ ] 🔄 **Testar hot reload**: Both frontend e backend
- [ ] 🏗️ **Build de produção**: `bun run build` funcionando?

### 🚨 Comandos Essenciais para IAs

```bash
# Verificar se lib já existe
grep "<library>" package.json

# Instalar nova library (root do projeto)
bun add <library>

# Desenvolvimento
bun run dev              # Full-stack
bun run dev:backend      # Backend apenas
bun run dev:frontend     # Frontend apenas

# Testes (manter 100% de sucesso)
bun run test:run         # Todos os testes
bun run test:ui          # Interface visual

# Verificação de qualidade
bun run build            # Build production
tsc --noEmit            # Check TypeScript errors

# Git workflow
git add .
git commit -m "feat: add new feature with tests"
```

### 🎯 Melhores Práticas Resumidas

1. **🔒 Type-Safety First**: Definir types antes de implementar
2. **🧪 Test-Driven**: Escrever testes durante desenvolvimento
3. **📚 Document Everything**: Swagger completo para todas as APIs
4. **⚙️ Configure Properly**: Usar sistema de configuração robusto
5. **🔄 Leverage Hot Reload**: Aproveitar recarregamento independente
6. **📦 Monorepo Benefits**: Uma instalação, configuração unificada
7. **🎨 Eden Treaty**: Type-safety automática client/server
8. **🏗️ Plugin Architecture**: Extensibilidade via plugins
9. **📊 Monitor Quality**: 312 testes, zero erros TS
10. **🚀 Production Ready**: Build e deploy otimizados

### Conclusão

FluxStack v1.4.1 oferece padrões de desenvolvimento maduros e testados. Com 89 arquivos TypeScript, 312 testes passando e zero erros de compilação, representa uma base sólida para desenvolvimento full-stack moderno com excelente developer experience.

**Status**: ✅ **Production Ready** - Padrões consolidados e completamente testados.