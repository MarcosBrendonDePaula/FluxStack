# Live Components e Comunicação em Tempo Real

O FluxStack integra um sistema de **Live Components** para facilitar a criação de interfaces de usuário dinâmicas e em tempo real, sem a complexidade de gerenciar conexões WebSocket manualmente.

## Arquitetura

O sistema de Live Components é habilitado pelo `liveComponentsPlugin` no backend.

1.  **Backend (Elysia)**: O `liveComponentsPlugin` configura um *endpoint* WebSocket (geralmente `/ws`) e gerencia as conexões.
2.  **Frontend (React)**: O *framework* fornece *hooks* e utilitários para que os componentes React se conectem a este *endpoint* e se inscrevam em canais específicos.
3.  **Comunicação**: A comunicação é baseada em canais (tópicos). O backend pode enviar mensagens para todos os clientes inscritos em um canal, e o frontend pode enviar mensagens para o backend.

## Uso

### 1. Geração de Componente

Use a CLI para gerar o *scaffolding* de um novo Live Component:

```bash
bun run cli make:live ChatRoom
```

Isso criará os arquivos necessários no backend (`app/server/live/ChatRoom.ts`) e no frontend.

### 2. Backend (`app/server/live/`)

O código do backend define a lógica de conexão, inscrição em canais e manipulação de mensagens.

*   **Canais**: Defina canais claros para a comunicação (ex: `chat:global`, `user:${userId}`).
*   **Broadcast**: Use as funções de *broadcast* fornecidas pelo *plugin* para enviar dados em tempo real para o frontend.

### 3. Frontend (`app/client/`)

O componente React utiliza um *hook* para se conectar ao canal e reagir às mensagens recebidas.

*   **Conexão**: O *hook* gerencia a conexão WebSocket e a reconexão automática.
*   **Estado**: As mensagens recebidas são usadas para atualizar o estado local do componente, refletindo as mudanças em tempo real na interface.

## Boas Práticas

*   **Tipagem**: Defina *schemas* de mensagem claros e tipados para garantir a segurança de tipos na comunicação WebSocket.
*   **Performance**: Evite enviar dados desnecessários. Use canais específicos para segmentar a comunicação e reduzir a carga de rede.
