# Exemplo: CRUD Completo com Eden Treaty Nativo

Este exemplo demonstra o fluxo completo de uma operação CRUD (Criar, Ler, Atualizar, Deletar) no FluxStack, enfatizando o uso do Eden Treaty nativo e a *type safety* de ponta a ponta.

## 1. Definição de Tipos Compartilhados (`app/shared/types.ts`)

Primeiro, definimos o tipo de dado que será manipulado.

```typescript
// app/shared/types.ts
import { t } from 'elysia'

export const UserSchema = t.Object({
  id: t.Number(),
  name: t.String(),
  email: t.String({ format: 'email' }),
})

export type User = t.Static<typeof UserSchema>
```

## 2. Rota do Backend (`app/server/routes/users.ts`)

Criamos uma rota Elysia que usa o `UserSchema` para validação e tipagem de resposta.

```typescript
// app/server/routes/users.ts
import { Elysia, t } from 'elysia'
import { UserSchema } from '@/app/shared/types'

export const usersRoute = new Elysia({ prefix: '/users' })
  // READ (GET /users)
  .get('/', () => {
    // Lógica para buscar todos os usuários
    return [{ id: 1, name: 'Alice', email: 'alice@example.com' }]
  }, {
    // OBRIGATÓRIO: Define o tipo de resposta para o Eden Treaty
    response: t.Array(UserSchema) 
  })

  // CREATE (POST /users)
  .post('/', ({ body }) => {
    // Lógica para criar um novo usuário
    return { id: 2, ...body }
  }, {
    body: t.Object({ name: t.String(), email: t.String() }),
    response: UserSchema // Retorna o usuário criado
  })
```

## 3. Uso no Frontend (Eden Treaty Nativo)

No frontend, o cliente Eden Treaty (`api`) é gerado automaticamente com base nas rotas acima.

```typescript
// app/client/src/services/userService.ts
import { api } from '@/app/client/src/api/treaty' // Cliente gerado
import type { User } from '@/app/shared/types'

// Função para buscar todos os usuários
export async function fetchUsers(): Promise<User[]> {
  // Uso nativo do Eden Treaty: 'data' e 'error' são tipados
  const { data, error } = await api.users.get() 

  if (error) {
    console.error('Erro ao buscar usuários:', error)
    throw new Error('Falha na comunicação com a API')
  }

  // 'data' é inferido como User[]
  return data
}

// Função para criar um novo usuário
export async function createUser(name: string, email: string): Promise<User> {
  // O corpo da requisição é tipado
  const { data, error } = await api.users.post({ name, email })

  if (error) {
    console.error('Erro ao criar usuário:', error)
    throw new Error('Falha ao criar usuário')
  }

  // 'data' é inferido como User
  return data
}
```

**Conclusão:** O uso do Eden Treaty nativo, combinado com os *response schemas* obrigatórios no Elysia, garante que a tipagem do `User` seja mantida desde a definição no `app/shared/` até o consumo no frontend.
