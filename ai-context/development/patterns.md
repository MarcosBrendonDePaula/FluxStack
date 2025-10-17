# 👨‍💻 Padrões de Desenvolvimento - FluxStack

> **Padrões fundamentais e boas práticas para desenvolvimento eficiente no FluxStack**

## 🚨 **Regras Fundamentais**

### ❌ **NUNCA FAZER**
1. **Editar `core/`** - Framework é read-only (alterações serão perdidas)
2. **Usar `apiCall()` wrapper** - Quebra type inference do Eden Treaty 
3. **Criar types manuais** para Eden Treaty - Use inferência automática
4. **Ignorar response schemas** - Necessários para documentação e tipos
5. **Trabalhar fora de `app/`** - Código da aplicação deve ficar em `app/`

### ✅ **SEMPRE FAZER**
1. **Trabalhar em `app/`** - Toda lógica da aplicação
2. **Usar Eden Treaty nativo** - `const { data, error } = await api.endpoint()`
3. **Definir response schemas** - Para inferência automática e docs
4. **Manter types em `app/shared/`** - Compartilhados entre client/server
5. **Testar com `bun run dev`** - Verificar funcionamento em desenvolvimento

## 🏗️ **Padrão de Criação de Features**

### **📋 Fluxo Padrão (4 Passos)**
```
1. Types (app/shared/) → 2. Controller (app/server/) → 3. Routes (app/server/) → 4. Frontend (app/client/)
```

### **1️⃣ Definir Types Compartilhados**
```typescript
// app/shared/types/[feature].ts
export interface Product {
  id: number
  name: string
  price: number
  createdAt: Date
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

### **2️⃣ Criar Controller**
```typescript
// app/server/controllers/[feature].controller.ts
export class ProductsController {
  static async getProducts() {
    // Lógica de negócio
    return { products: [...] }
  }

  static async createProduct(data: CreateProductRequest): Promise<ProductResponse> {
    // Validação + criação
    return { success: true, product: newProduct }
  }
}
```

### **3️⃣ Definir Routes com Schemas**
```typescript
// app/server/routes/[feature].routes.ts
import { Elysia, t } from "elysia"

export const productsRoutes = new Elysia({ prefix: "/products" })
  .get("/", () => ProductsController.getProducts(), {
    // ✅ CRÍTICO: Response schema para Eden Treaty
    response: t.Object({
      products: t.Array(t.Object({
        id: t.Number(),
        name: t.String(),
        price: t.Number(),
        createdAt: t.Date()
      }))
    })
  })
  .post("/", async ({ body }) => ProductsController.createProduct(body), {
    body: t.Object({
      name: t.String(),
      price: t.Number({ minimum: 0 })
    }),
    response: t.Object({
      success: t.Boolean(),
      product: t.Optional(t.Object({...})),
      message: t.Optional(t.String())
    })
  })
```

### **4️⃣ Usar no Frontend**
```typescript
// app/client/src/components/ProductList.tsx
const { data: products, error } = await api.products.get()

if (error) {
  console.log(`Error: ${error.status}`)
  return
}

// ✨ Eden Treaty infere: products = { products: Product[] }
products.products.forEach(product => {
  console.log(product.name) // ✨ Type-safe!
})
```

## 🎯 **Padrões de Componentes React**

### **✅ Hook Personalizado (Recomendado)**
```typescript
// app/client/src/hooks/useProducts.ts
export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)

  const loadProducts = async () => {
    setLoading(true)
    const { data, error } = await api.products.get()
    
    if (error) {
      // Error handling
      return
    }
    
    setProducts(data.products)
    setLoading(false)
  }

  return { products, loading, loadProducts }
}
```

### **✅ Componente com Hook**
```typescript
// app/client/src/components/ProductList.tsx
export function ProductList() {
  const { products, loading, loadProducts } = useProducts()

  useEffect(() => {
    loadProducts()
  }, [])

  if (loading) return <div>Loading...</div>

  return (
    <div>
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
```

## 🔧 **Padrões de Error Handling**

### **✅ Padrão Global**
```typescript
// app/client/src/lib/error-utils.ts
export function getErrorMessage(error: any): string {
  switch (error.status) {
    case 400: return "Dados inválidos"
    case 401: return "Acesso negado"
    case 404: return "Não encontrado"
    case 500: return "Erro do servidor"
    default: return error.message || "Erro desconhecido"
  }
}

// Uso nos componentes
const { data, error } = await api.products.get()

if (error) {
  const message = getErrorMessage(error)
  showToast("error", message)
  return
}
```

### **✅ Error Boundaries (React)**
```typescript
// app/client/src/components/ErrorBoundary.tsx
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error Boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return <div>Algo deu errado. Tente recarregar a página.</div>
    }

    return this.props.children
  }
}
```

## 📁 **Estrutura de Arquivos**

### **✅ Organização Recomendada**
```
app/
├── shared/
│   └── types/
│       ├── index.ts          # Re-exports principais
│       ├── user.ts           # Types de usuário
│       ├── product.ts        # Types de produto
│       └── common.ts         # Types compartilhados
├── server/
│   ├── controllers/
│   │   ├── users.controller.ts
│   │   └── products.controller.ts
│   ├── routes/
│   │   ├── index.ts          # Agregador de rotas
│   │   ├── users.routes.ts
│   │   └── products.routes.ts
│   └── app.ts                # Export para Eden Treaty
└── client/
    ├── src/
    │   ├── components/       # Componentes UI
    │   ├── hooks/           # Hooks personalizados
    │   ├── lib/             # Utilitários (Eden Treaty)
    │   ├── pages/           # Páginas principais
    │   └── utils/           # Funções auxiliares
    └── public/              # Assets estáticos
```

## 🧪 **Padrões de Testing**

### **✅ Teste de API (Vitest)**
```typescript
// tests/api/products.test.ts
import { describe, it, expect } from 'vitest'
import { api } from '@/client/lib/eden-api'

describe('Products API', () => {
  it('should create and retrieve product', async () => {
    const { data: createResult, error: createError } = await api.products.post({
      name: "Test Product",
      price: 29.99
    })
    
    expect(createError).toBeUndefined()
    expect(createResult.success).toBe(true)
    
    const { data: getResult, error: getError } = await api.products.get()
    expect(getError).toBeUndefined()
    expect(getResult.products).toContainEqual(
      expect.objectContaining({ name: "Test Product" })
    )
  })
})
```

### **✅ Teste de Hook (React Testing Library)**
```typescript
// tests/hooks/useProducts.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { useProducts } from '@/client/hooks/useProducts'

describe('useProducts', () => {
  it('should load products', async () => {
    const { result } = renderHook(() => useProducts())
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    
    expect(result.current.products).toBeInstanceOf(Array)
  })
})
```

## 🚀 **Comandos de Desenvolvimento**

### **✅ Desenvolvimento Local**
```bash
# Servidor completo (recomendado)
bun run dev

# Logs automaticamente filtrados em desenvolvimento
bun run dev

# Apenas backend (porta 3001)
bun run dev:backend

# Apenas frontend (porta 5173)
bun run dev:frontend
```

### **✅ Build e Produção**
```bash
# Build completo
bun run build

# Servidor de produção
bun run start

# Testes
bun run test
bun run test:ui
bun run test:coverage

# Verificação de tipos
bunx tsc --noEmit
```

## 🔍 **Debugging e Troubleshooting**

### **✅ Logs Úteis**
```typescript
// Server-side debugging
console.log('Controller input:', body)
console.log('Controller output:', result)

// Client-side debugging  
console.log('API call:', { endpoint: 'products', data })
console.log('API response:', { data, error })
```

### **✅ Verificações Comuns**
```bash
# 1. API funcionando?
curl http://localhost:3000/api/health

# 2. Swagger funcionando?
open http://localhost:3000/swagger

# 3. Frontend conectando?
open http://localhost:5173

# 4. Types corretos?
bunx tsc --noEmit
```

### **✅ Problemas Frequentes**
- **Types `unknown`**: Verificar response schemas nas rotas
- **CORS errors**: API e frontend em portas diferentes (normal)
- **404 na API**: Verificar prefix das rotas
- **Build errors**: Verificar imports e paths

## 📈 **Performance e Otimização**

### **✅ Boas Práticas**
```typescript
// 1. Memo para componentes caros
const ProductCard = memo(({ product }) => {
  return <div>{product.name}</div>
})

// 2. useCallback para funções
const handleDelete = useCallback((id: number) => {
  deleteProduct(id)
}, [deleteProduct])

// 3. Lazy loading para rotas
const ProductsPage = lazy(() => import('./pages/ProductsPage'))

// 4. Debounce para search
const debouncedSearch = useMemo(
  () => debounce(searchProducts, 300),
  [searchProducts]
)
```

---

**🎯 Seguindo estes padrões, você desenvolve features rapidamente com type safety garantida e código de alta qualidade!**