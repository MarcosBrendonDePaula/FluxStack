# 🔧 FluxStack Service Examples

Este diretório contém **exemplos de implementação de services** para FluxStack usando a classe base `BaseService`.

## 📁 Services Disponíveis

### **NotificationService.ts** (302 linhas)
Service completo para gerenciamento de notificações in-memory com:
- ✅ CRUD de notificações
- ✅ Filtros por usuário e tipo
- ✅ Sistema de leitura/não-leitura
- ✅ Expiração automática de notificações
- ✅ Broadcast para todos os usuários
- ✅ Cleanup automático a cada minuto

## 🎯 Como Usar Este Exemplo

### 1. Copiar para o Projeto

```bash
cp examples/services/NotificationService.ts app/server/services/
```

### 2. Registrar no Service Container

```typescript
// app/server/services/index.ts
import { NotificationService } from './NotificationService'

export function createServiceContainer(config: FluxStackConfig, logger: Logger): ServiceContainer {
  const container = new ServiceContainer(logger)

  container.registerMany([
    {
      name: 'userService',
      constructor: UserService,
      singleton: true
    },
    {
      name: 'notificationService',
      constructor: NotificationService,
      singleton: true
    }
  ])

  return container
}

// Re-export
export { NotificationService } from './NotificationService'
export type { Notification, CreateNotificationData } from './NotificationService'
```

### 3. Criar Rotas

```typescript
// app/server/routes/notifications.routes.ts
import { Elysia, t } from 'elysia'
import type { NotificationService } from '@/app/server/services'

export const notificationsRoutes = (app: Elysia) =>
  app.group('/api/notifications', (app) =>
    app
      // Criar notificação
      .post(
        '/',
        async ({ body, services }) => {
          const notificationService = services.get<NotificationService>('notificationService')
          const notification = await notificationService.createNotification(body)
          return { success: true, notification }
        },
        {
          body: t.Object({
            userId: t.Optional(t.Number()),
            type: t.Union([
              t.Literal('info'),
              t.Literal('success'),
              t.Literal('warning'),
              t.Literal('error')
            ]),
            title: t.String({ minLength: 1, maxLength: 100 }),
            message: t.String({ minLength: 1, maxLength: 500 }),
            data: t.Optional(t.Record(t.String(), t.Any())),
            expiresIn: t.Optional(t.Number())
          }),
          response: t.Object({
            success: t.Boolean(),
            notification: t.Object({
              id: t.String(),
              userId: t.Optional(t.Number()),
              type: t.String(),
              title: t.String(),
              message: t.String(),
              read: t.Boolean(),
              createdAt: t.String()
            })
          })
        }
      )

      // Listar notificações de um usuário
      .get(
        '/user/:userId',
        async ({ params, query, services }) => {
          const notificationService = services.get<NotificationService>('notificationService')
          const notifications = await notificationService.getUserNotifications(
            parseInt(params.userId),
            {
              includeRead: query.includeRead === 'true',
              type: query.type as any
            }
          )
          return { notifications }
        },
        {
          params: t.Object({
            userId: t.String()
          }),
          query: t.Object({
            includeRead: t.Optional(t.String()),
            type: t.Optional(t.String())
          })
        }
      )

      // Marcar como lida
      .patch(
        '/:id/read',
        async ({ params, services }) => {
          const notificationService = services.get<NotificationService>('notificationService')
          const notification = await notificationService.markAsRead(params.id)
          return { success: true, notification }
        },
        {
          params: t.Object({
            id: t.String()
          })
        }
      )

      // Deletar notificação
      .delete(
        '/:id',
        async ({ params, services }) => {
          const notificationService = services.get<NotificationService>('notificationService')
          await notificationService.deleteNotification(params.id)
          return { success: true }
        },
        {
          params: t.Object({
            id: t.String()
          })
        }
      )
  )
```

### 4. Registrar Rotas no App

```typescript
// app/server/index.ts
import { notificationsRoutes } from './routes/notifications.routes'

const app = new Elysia()
  .use(notificationsRoutes)
  // ... outras rotas
```

### 5. Usar no Frontend

```typescript
// app/client/src/components/Notifications.tsx
import { api } from '@/app/client/src/lib/eden-api'

export function Notifications({ userId }: { userId: number }) {
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = async () => {
    const { data, error } = await api.notifications.user[userId].get({
      query: { includeRead: 'false' }
    })
    if (data) setNotifications(data.notifications)
  }

  const markAsRead = async (id: string) => {
    await api.notifications[id].read.patch()
    loadNotifications()
  }

  return (
    <div>
      {notifications.map(notif => (
        <div key={notif.id} onClick={() => markAsRead(notif.id)}>
          <h3>{notif.title}</h3>
          <p>{notif.message}</p>
        </div>
      ))}
    </div>
  )
}
```

## 🏗️ Arquitetura do Service

O `NotificationService` estende `BaseService` que fornece:

### Recursos do BaseService

1. **Logger integrado** - `this.logger.info()`, `this.logger.error()`
2. **Geração de IDs** - `this.generateId()`
3. **Validação** - `this.validateRequired()`, `this.validateFormat()`
4. **Error handling** - `this.handleError()`
5. **Logging automático** - `this.executeWithLogging()`

### Estrutura de um Service

```typescript
export class MyService extends BaseService {
  // Estado privado
  private data: any[] = []

  // Inicialização (opcional)
  async initialize(): Promise<void> {
    await super.initialize()
    // Setup inicial
  }

  // Métodos públicos
  async createItem(data: any): Promise<any> {
    return this.executeWithLogging('createItem', async () => {
      this.validateRequired(data, ['field1', 'field2'])

      // Lógica do service
      const item = { id: this.generateId(), ...data }
      this.data.push(item)

      this.logger.info('Item created', { itemId: item.id })
      return item
    }, { userId: data.userId })
  }

  // Métodos privados
  private cleanup(): void {
    // Lógica de cleanup
  }
}
```

## 📊 Funcionalidades do NotificationService

| Método | Descrição |
|--------|-----------|
| `createNotification()` | Cria nova notificação |
| `getUserNotifications()` | Lista notificações do usuário |
| `getNotification()` | Busca notificação por ID |
| `markAsRead()` | Marca como lida |
| `markAllAsRead()` | Marca todas como lidas |
| `deleteNotification()` | Deleta notificação |
| `deleteUserNotifications()` | Deleta todas de um usuário |
| `getUnreadCount()` | Conta não lidas |
| `broadcastNotification()` | Envia para todos |
| `cleanupExpiredNotifications()` | Remove expiradas |

## ⚠️ Limitações da Implementação Atual

Esta é uma implementação **in-memory para demonstração**. Para produção:

1. **Persistência** - Use banco de dados (Prisma, Drizzle, etc.)
2. **Real-time** - Integre com WebSockets para notificações em tempo real
3. **Escalabilidade** - Use Redis para distribuir entre múltiplos servidores
4. **Rate limiting** - Limite criação de notificações por usuário
5. **Templates** - Sistema de templates para notificações

## 🚀 Próximos Passos

### Integração com Database

```typescript
// Exemplo com Prisma
export class NotificationService extends BaseService {
  constructor(
    config: FluxStackConfig,
    logger: Logger,
    private prisma: PrismaClient
  ) {
    super(config, logger)
  }

  async createNotification(data: CreateNotificationData): Promise<Notification> {
    return this.executeWithLogging('createNotification', async () => {
      return await this.prisma.notification.create({
        data: {
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message
        }
      })
    })
  }
}
```

### Real-time com WebSockets

```typescript
// Adicionar broadcast via WebSocket
async createNotification(data: CreateNotificationData): Promise<Notification> {
  const notification = await this.prisma.notification.create({ data })

  // Broadcast via WebSocket
  if (data.userId) {
    wsServer.sendToUser(data.userId, {
      type: 'notification',
      payload: notification
    })
  }

  return notification
}
```

## 📚 Referências

- [BaseService Documentation](../../ai-context/reference/base-service.md)
- [Service Container Pattern](../../ai-context/development/patterns.md#services)
- [Dependency Injection](../../ai-context/development/patterns.md#dependency-injection)
- [Error Handling](../../ai-context/reference/error-handling.md)

---

**Nota:** Este service é um exemplo educacional completo de como implementar um service FluxStack com todas as best practices do framework.
