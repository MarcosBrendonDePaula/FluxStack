# Live Components – Arquitetura e Uso

## Visão Geral
FluxStack inclui um sistema de componentes “ao vivo” que conecta o backend (`app/server/live`) e o frontend via WebSocket. O plugin `liveComponentsPlugin` (`core/server/live/websocket-plugin.ts`) expõe um endpoint em `/api/live/ws`, gerenciando:

- Descoberta automática de componentes server-side.
- Montagem, reidratação e desmontagem coordenadas.
- Ações bidirecionais (`CALL_ACTION`, `PROPERTY_UPDATE`).
- Upload de arquivos em chunks.
- Monitoramento de desempenho e recuperação automática via `ComponentRegistry`.

## Fluxo de Componentes
1. **Registro**: classes em `app/server/live/*.ts` estendem `LiveComponent` (veja `core/types/types.ts`) e são descobertas automaticamente.
2. **Conexão WebSocket**: o cliente (React ou outra UI) abre `ws://localhost:3000/api/live/ws`.
3. **Mensagens**:
   - `COMPONENT_MOUNT` → monta componente e devolve snapshot inicial.
   - `COMPONENT_REHYDRATE` → reaproveita estado assinado via `StateSignature`.
   - `CALL_ACTION` → chama métodos definidos no componente.
   - `PROPERTY_UPDATE` → atualiza propriedades reativas.
   - `FILE_UPLOAD_*` → inicia/envia/finaliza upload (ver abaixo).
   - `COMPONENT_UNMOUNT` → limpa instâncias e encerra subscriptions.
4. **Respostas**: o servidor responde com `COMPONENT_MOUNTED`, `ACTION_RESPONSE`, `PROPERTY_UPDATED`, mensagens de erro ou progresso de upload.
5. **Broadcast**: componentes podem enviar mensagens a salas gerenciadas pelo `connectionManager`/`componentRegistry`.

## Upload de Arquivos
O plugin suporta upload multipart em chunks:
- `FILE_UPLOAD_START` → reserva upload (`uploadId`, `chunkSize`, `totalChunks`).
- `FILE_UPLOAD_CHUNK` → envia chunk base64; o servidor usa `fileUploadManager` para remontar e validar.
+- Respostas de progresso incluem `FILE_UPLOAD_PROGRESS` ou `FILE_UPLOAD_ERROR`.
- `FILE_UPLOAD_COMPLETE` → consolida arquivo e devolve metadados.

Configurações de diretórios/rotas são herdadas do `staticFilesPlugin` (`/api/static/*` e `/api/uploads/*` por padrão).

## Monitoramento e Recuperação
`ComponentRegistry` mantém metadados:
- `ComponentMetadata`: versões, estado, dependências, métricas (`renderCount`, `errorCount`, etc.).
- `performHealthChecks()` periódicos (30s) definem `healthStatus` e podem acionar `recoverComponent`.
- Migrações de estado (`migrateComponentState`) permitem evoluir versões sem perder dados.

Ao desmontar o servidor, `cleanup()` garante fechamento de conexões e timers.

## Entrando do Lado do Cliente
- Use o client React disponibilizado em `app/client/src/components/` (ex.: `HybridLiveCounter`, `SystemMonitor`, `FluxStackConfig`).
- Comunicação direta pode ser implementada abrindo um WebSocket e enviando objetos com `{ type, componentId, action, payload }`.
- Cada mensagem deve incluir `requestId` se precisar correlacionar respostas (`expectResponse: true`).

## Boas Práticas
- **Component IDs**: use nomes consistentes; o registry gera IDs únicos mas manter identificadores previsíveis facilita debugging.
- **Assinatura de estado**: utilize `stateSignature` para validar reidratações e evitar replay.
- **Recursos externos**: registre serviços via `ComponentRegistry.services.register` para compartilhar conexões.
- **Erro e recuperação**: trate exceções dentro das ações para não marcar o componente como `unhealthy`.
- **Uploads**: valide tipos/tamanho em `FileUploadManager` antes de persistir arquivos.

## Referências
- Código principal: `core/server/live/*`.
- Exemplos: `app/server/live/SystemMonitor.ts`, `app/client/src/components/SystemMonitor.tsx`.
- Plugins relacionados: `staticFilesPlugin`, `monitoringPlugin`.
- Configuração adicional: `project/configuration.md` + `reference/environment-vars.md` (rotas estáticas).***
