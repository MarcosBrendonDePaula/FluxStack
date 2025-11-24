# Guia do Eden Treaty no FluxStack (Uso Nativo)

O FluxStack utiliza o **Eden Treaty** para gerar um cliente de API *type-safe* automaticamente a partir das rotas do Elysia. O princípio fundamental é: **o cliente de API deve ser usado diretamente, sem *wrappers***.

## O Princípio do Uso Nativo

A principal regra do FluxStack é evitar qualquer abstração sobre o Eden Treaty.

> **Regra Essencial:** **NUNCA** crie funções como `apiCall()`, `fetchData()` ou similares que envolvam o cliente gerado.

**Por que o uso nativo é obrigatório?**

O uso nativo garante que a **inferência de tipos** do TypeScript funcione perfeitamente. Ao chamar `api.users.get()`, o TypeScript sabe exatamente:
1.  Quais parâmetros a função espera (se houver).
2.  Qual é o tipo exato do objeto de resposta (`data` e `error`).

Qualquer *wrapper* intermediário quebra essa inferência, reintroduzindo a necessidade de tipagem manual e a possibilidade de erros em tempo de execução.

## Como Usar (O Caminho Certo)

O cliente Eden Treaty é tipicamente importado e utilizado diretamente no código do cliente (`app/client/src/`).

```typescript
// Exemplo de uso em um componente React (app/client/src/pages/Users.tsx)

import { api } from '@/app/client/src/api/treaty' // Importação do cliente gerado

// ... dentro de uma função assíncrona ou useEffect
const loadUsers = async () => {
  // Chamada nativa e type-safe
  const { data, error } = await api.users.get() 

  if (error) {
    console.error('Erro ao carregar usuários:', error.message)
    // O tipo de 'error' é inferido corretamente
    return
  }

  // O tipo de 'data' é inferido como o schema de resposta do Elysia
  console.log('Usuários carregados:', data) 
}
```

## A Importância dos Schemas de Resposta

Para que o Eden Treaty funcione corretamente, o backend (Elysia) **DEVE** definir explicitamente o *schema* de resposta para cada rota.

```typescript
// Exemplo de rota Elysia (app/server/routes/users.ts)

import { Elysia, t } from 'elysia'

export const usersRoute = new Elysia({ prefix: '/users' })
  .get('/', () => {
    // Lógica para buscar usuários
    const users = [{ id: 1, name: 'Alice' }]
    return users
  }, {
    // SCHEMA DE RESPOSTA OBRIGATÓRIO
    response: t.Array(t.Object({
      id: t.Number(),
      name: t.String()
    }))
  })
```

A ausência do `response` schema:
1.  Impede o Eden Treaty de gerar o tipo correto para o cliente.
2.  Viola a Regra de Ouro do FluxStack.

**Conclusão:** O Eden Treaty é a ponte de *type safety* entre o backend e o frontend. Mantenha-o nativo e garanta que o backend forneça os *schemas* de resposta.
