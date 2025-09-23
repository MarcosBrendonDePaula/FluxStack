# 💡 Exemplo CRUD Completo - FluxStack + Eden Treaty

> **Exemplo prático**: CRUD de usuários com type safety automática end-to-end

## 🎯 **Visão Geral do Exemplo**

Este exemplo mostra como implementar um CRUD completo no FluxStack, demonstrando:
- **Types compartilhados** entre client e server
- **Controllers** com lógica de negócio
- **Routes** com response schemas
- **Frontend React** com Eden Treaty nativo
- **Error handling** elegante
- **Type safety** automática

## 📁 **Estrutura do Exemplo**

```
app/
├── shared/types/index.ts        # Types compartilhados
├── server/
│   ├── controllers/users.controller.ts  # Lógica de negócio
│   └── routes/users.routes.ts           # Endpoints da API
└── client/src/
    ├── lib/eden-api.ts          # Cliente Eden Treaty
    ├── components/UserList.tsx  # Lista de usuários
    └── hooks/useUsers.ts        # Hook personalizado
```

## 🔧 **Implementação Passo a Passo**

### **1. Types Compartilhados (app/shared/types/index.ts)**
```typescript
// Entidades principais
export interface User {
  id: number
  name: string
  email: string
  createdAt: Date
}

// Request types
export interface CreateUserRequest {
  name: string
  email: string
}

export interface UpdateUserRequest {
  name?: string
  email?: string
}

// Response types
export interface UserResponse {
  success: boolean
  user?: User
  message?: string
}

export interface UsersListResponse {
  users: User[]
}

// Error types
export interface APIError {
  message: string
  status: number
  code?: string
  details?: any
}
```

### **2. Controller (app/server/controllers/users.controller.ts)**
```typescript
import type { User, CreateUserRequest, UpdateUserRequest, UserResponse } from '@/shared/types'

// Simulando database em memória
let users: User[] = [
  { id: 1, name: "João Silva", email: "joao@example.com", createdAt: new Date() },
  { id: 2, name: "Maria Santos", email: "maria@example.com", createdAt: new Date() }
]

export class UsersController {
  // GET /users - Listar todos
  static async getUsers() {
    return { users }
  }

  // GET /users/:id - Buscar por ID
  static async getUserById(id: number) {
    const user = users.find(u => u.id === id)
    return user ? { user } : null
  }

  // POST /users - Criar novo
  static async createUser(userData: CreateUserRequest): Promise<UserResponse> {
    // Validação de email único
    const existingUser = users.find(u => u.email === userData.email)
    
    if (existingUser) {
      return {
        success: false,
        message: "Email já está em uso"
      }
    }

    // Criar novo usuário
    const newUser: User = {
      id: Date.now(), // Simples ID generator
      name: userData.name,
      email: userData.email,
      createdAt: new Date()
    }

    users.push(newUser)

    return {
      success: true,
      user: newUser,
      message: "Usuário criado com sucesso"
    }
  }

  // PUT /users/:id - Atualizar
  static async updateUser(id: number, userData: UpdateUserRequest): Promise<UserResponse> {
    const userIndex = users.findIndex(u => u.id === id)
    
    if (userIndex === -1) {
      return {
        success: false,
        message: "Usuário não encontrado"
      }
    }

    // Verificar email único (se alterando)
    if (userData.email) {
      const existingUser = users.find(u => u.email === userData.email && u.id !== id)
      if (existingUser) {
        return {
          success: false,
          message: "Email já está em uso"
        }
      }
    }

    // Atualizar usuário
    users[userIndex] = {
      ...users[userIndex],
      ...userData
    }

    return {
      success: true,
      user: users[userIndex],
      message: "Usuário atualizado com sucesso"
    }
  }

  // DELETE /users/:id - Deletar
  static async deleteUser(id: number): Promise<UserResponse> {
    const userIndex = users.findIndex(u => u.id === id)
    
    if (userIndex === -1) {
      return {
        success: false,
        message: "Usuário não encontrado"
      }
    }

    const deletedUser = users.splice(userIndex, 1)[0]
    
    return {
      success: true,
      user: deletedUser,
      message: "Usuário deletado com sucesso"
    }
  }

  // Utility para reset (testing)
  static resetUsers() {
    users.splice(0, users.length)
    users.push(
      { id: 1, name: "João Silva", email: "joao@example.com", createdAt: new Date() },
      { id: 2, name: "Maria Santos", email: "maria@example.com", createdAt: new Date() }
    )
  }
}
```

### **3. Routes com Response Schemas (app/server/routes/users.routes.ts)**
```typescript
import { Elysia, t } from "elysia"
import { UsersController } from "../controllers/users.controller"

// Schemas TypeBox para validação e documentação
const UserSchema = t.Object({
  id: t.Number(),
  name: t.String(),
  email: t.String(),
  createdAt: t.Date()
})

const UserResponseSchema = t.Object({
  success: t.Boolean(),
  user: t.Optional(UserSchema),
  message: t.Optional(t.String())
})

export const usersRoutes = new Elysia({ prefix: "/users" })
  
  // GET /users - Listar todos
  .get("/", () => UsersController.getUsers(), {
    response: t.Object({
      users: t.Array(UserSchema)
    }),
    detail: {
      tags: ['Users'],
      summary: 'List Users',
      description: 'Retrieve a list of all users in the system'
    }
  })
  
  // GET /users/:id - Buscar por ID
  .get("/:id", async ({ params: { id }, set }) => {
    const userId = parseInt(id)
    const result = await UsersController.getUserById(userId)
    
    if (!result) {
      set.status = 404
      return { error: "Usuário não encontrado" }
    }
    
    return result
  }, {
    params: t.Object({
      id: t.String()
    }),
    response: t.Object({
      user: UserSchema
    }),
    detail: {
      tags: ['Users'],
      summary: 'Get User by ID',
      description: 'Retrieve a specific user by their ID'
    }
  })
  
  // POST /users - Criar novo
  .post("/", async ({ body, set }) => {
    try {
      return await UsersController.createUser(body)
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
      email: t.String({ format: "email" })
    }),
    response: UserResponseSchema,
    detail: {
      tags: ['Users'],
      summary: 'Create User',
      description: 'Create a new user with name and email'
    }
  })
  
  // PUT /users/:id - Atualizar
  .put("/:id", async ({ params: { id }, body, set }) => {
    try {
      const userId = parseInt(id)
      return await UsersController.updateUser(userId, body)
    } catch (error) {
      set.status = 400
      return { 
        success: false, 
        error: "Dados inválidos", 
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }, {
    params: t.Object({
      id: t.String()
    }),
    body: t.Object({
      name: t.Optional(t.String({ minLength: 2 })),
      email: t.Optional(t.String({ format: "email" }))
    }),
    response: UserResponseSchema,
    detail: {
      tags: ['Users'],
      summary: 'Update User',
      description: 'Update an existing user'
    }
  })
  
  // DELETE /users/:id - Deletar
  .delete("/:id", async ({ params: { id } }) => {
    const userId = parseInt(id)
    return UsersController.deleteUser(userId)
  }, {
    params: t.Object({
      id: t.String()
    }),
    response: UserResponseSchema,
    detail: {
      tags: ['Users'],
      summary: 'Delete User',
      description: 'Delete a user by their ID'
    }
  })
```

### **4. Hook Personalizado (app/client/src/hooks/useUsers.ts)**
```typescript
import { useState, useEffect } from 'react'
import { api } from '../lib/eden-api'
import type { User, CreateUserRequest, UpdateUserRequest } from '@/shared/types'

export function useUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Carregar usuários
  const loadUsers = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await api.users.get()
      
      if (error) {
        setError(`Erro ao carregar usuários: ${error.status}`)
        return
      }
      
      // ✨ Eden Treaty infere: data = { users: User[] }
      setUsers(data.users)
    } catch (err) {
      setError('Erro de rede ao carregar usuários')
    } finally {
      setLoading(false)
    }
  }

  // Criar usuário
  const createUser = async (userData: CreateUserRequest): Promise<boolean> => {
    try {
      const { data, error } = await api.users.post(userData)
      
      if (error) {
        setError(`Erro ao criar usuário: ${error.status}`)
        return false
      }
      
      // ✨ Eden Treaty infere: data = UserResponse
      if (data.success && data.user) {
        setUsers(prev => [...prev, data.user!])
        return true
      } else {
        setError(data.message || 'Erro ao criar usuário')
        return false
      }
    } catch (err) {
      setError('Erro de rede ao criar usuário')
      return false
    }
  }

  // Atualizar usuário
  const updateUser = async (id: number, userData: UpdateUserRequest): Promise<boolean> => {
    try {
      const { data, error } = await api.users({ id }).put(userData)
      
      if (error) {
        setError(`Erro ao atualizar usuário: ${error.status}`)
        return false
      }
      
      // ✨ Eden Treaty infere tipos automaticamente
      if (data.success && data.user) {
        setUsers(prev => prev.map(u => u.id === id ? data.user! : u))
        return true
      } else {
        setError(data.message || 'Erro ao atualizar usuário')
        return false
      }
    } catch (err) {
      setError('Erro de rede ao atualizar usuário')
      return false
    }
  }

  // Deletar usuário
  const deleteUser = async (id: number): Promise<boolean> => {
    try {
      const { data, error } = await api.users({ id }).delete()
      
      if (error) {
        setError(`Erro ao deletar usuário: ${error.status}`)
        return false
      }
      
      // ✨ Type safety automática
      if (data.success) {
        setUsers(prev => prev.filter(u => u.id !== id))
        return true
      } else {
        setError(data.message || 'Erro ao deletar usuário')
        return false
      }
    } catch (err) {
      setError('Erro de rede ao deletar usuário')
      return false
    }
  }

  // Carregar na inicialização
  useEffect(() => {
    loadUsers()
  }, [])

  return {
    users,
    loading,
    error,
    loadUsers,
    createUser,
    updateUser,
    deleteUser,
    clearError: () => setError(null)
  }
}
```

### **5. Componente React (app/client/src/components/UserList.tsx)**
```typescript
import React, { useState } from 'react'
import { useUsers } from '../hooks/useUsers'
import type { CreateUserRequest } from '@/shared/types'

export function UserList() {
  const { users, loading, error, createUser, updateUser, deleteUser, clearError } = useUsers()
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<CreateUserRequest>({ name: '', email: '' })
  const [editingId, setEditingId] = useState<number | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.email.trim()) return

    const success = editingId 
      ? await updateUser(editingId, formData)
      : await createUser(formData)

    if (success) {
      setFormData({ name: '', email: '' })
      setShowForm(false)
      setEditingId(null)
    }
  }

  const handleEdit = (user: User) => {
    setFormData({ name: user.name, email: user.email })
    setEditingId(user.id)
    setShowForm(true)
  }

  const handleDelete = async (user: User) => {
    if (confirm(`Tem certeza que deseja deletar ${user.name}?`)) {
      await deleteUser(user.id)
    }
  }

  return (
    <div className="user-list">
      <h2>Usuários</h2>
      
      {error && (
        <div className="error">
          {error}
          <button onClick={clearError}>✕</button>
        </div>
      )}

      <button 
        onClick={() => setShowForm(!showForm)}
        className="btn-primary"
      >
        {showForm ? 'Cancelar' : 'Novo Usuário'}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="user-form">
          <input
            type="text"
            placeholder="Nome"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            required
          />
          <button type="submit" disabled={loading}>
            {editingId ? 'Atualizar' : 'Criar'}
          </button>
        </form>
      )}

      {loading && <div className="loading">Carregando...</div>}

      <div className="users-grid">
        {users.map(user => (
          <div key={user.id} className="user-card">
            <h3>{user.name}</h3>
            <p>{user.email}</p>
            <small>Criado em: {new Date(user.createdAt).toLocaleDateString()}</small>
            <div className="user-actions">
              <button onClick={() => handleEdit(user)}>Editar</button>
              <button onClick={() => handleDelete(user)}>Deletar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

## 🧪 **Teste do CRUD**

### **Teste Simples**
```bash
# 1. Iniciar servidor
bun run dev

# 2. Testar APIs
curl http://localhost:3000/api/users
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com"}'

# 3. Frontend
# Acessar http://localhost:5173
```

### **Teste com Vitest**
```typescript
// tests/users-crud.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { api } from '@/client/lib/eden-api'

describe('Users CRUD', () => {
  beforeEach(async () => {
    // Reset para estado inicial
    await api.users.reset.post()
  })

  it('should create, read, update, delete user', async () => {
    // CREATE
    const { data: createResult, error: createError } = await api.users.post({
      name: "João Test",
      email: "joao@test.com"
    })
    
    expect(createError).toBeUndefined()
    expect(createResult.success).toBe(true)
    expect(createResult.user).toBeDefined()
    
    const userId = createResult.user!.id

    // READ
    const { data: getResult, error: getError } = await api.users({ id: userId }).get()
    expect(getError).toBeUndefined()
    expect(getResult.user.name).toBe("João Test")

    // UPDATE
    const { data: updateResult, error: updateError } = await api.users({ id: userId }).put({
      name: "João Updated"
    })
    expect(updateError).toBeUndefined()
    expect(updateResult.success).toBe(true)
    expect(updateResult.user!.name).toBe("João Updated")

    // DELETE
    const { data: deleteResult, error: deleteError } = await api.users({ id: userId }).delete()
    expect(deleteError).toBeUndefined()
    expect(deleteResult.success).toBe(true)
  })
})
```

## 🎯 **Pontos-Chave do Exemplo**

### **✅ Type Safety Automática**
- Types definidos uma vez em `shared/`
- Eden Treaty infere automaticamente
- Zero declarações manuais de tipos
- Autocomplete perfeito no editor

### **✅ Arquitetura Limpa**
- Separação clara: types → controller → routes → client
- Hook personalizado encapsula lógica
- Componente focado apenas na UI
- Error handling consistente

### **✅ Eden Treaty Nativo**
- Sem wrappers que quebram tipos
- Padrão `{ data, error }` consistente
- Response schemas para documentação
- Type inference funcionando 100%

---

**🎯 Este exemplo mostra como aproveitar ao máximo o FluxStack: type safety automática, arquitetura limpa e desenvolvimento produtivo!**