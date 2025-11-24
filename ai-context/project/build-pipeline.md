# Pipeline de Build e Deployment

O FluxStack utiliza o Bun e o Vite para um processo de *build* otimizado, resultando em uma aplicação pronta para produção na pasta `dist/`.

## Processo de Build

O comando principal para o *build* é:

```bash
bun run build
# Equivalente a: cross-env NODE_ENV=production bun run core/cli/index.ts build
```

Este comando executa as seguintes etapas:

1.  **Configuração de Ambiente**: Define `NODE_ENV=production`, ativando otimizações.
2.  **Build do Frontend**: O Vite compila os ativos do React (`app/client/`) (HTML, CSS, JavaScript) e os coloca na pasta `dist/public`.
3.  **Build do Backend**: O Bun/Elysia compila o código TypeScript do servidor (`app/server/`) para JavaScript, colocando o resultado na raiz de `dist/`.
4.  **Otimizações**: As otimizações definidas na configuração de `production` (em `fluxstack.config.ts`) são aplicadas, como minificação e *tree-shaking*.

## Deployment e Execução em Produção

Após o *build*, a pasta `dist/` contém todos os arquivos necessários para rodar a aplicação.

### 1. Execução Padrão

O servidor de produção é iniciado com o seguinte comando:

```bash
bun run start
# Equivalente a: bun run core/cli/index.ts start
```

Este comando inicia o servidor Elysia, que serve tanto a API quanto os arquivos estáticos do frontend (agora em `dist/public`).

### 2. Executável Standalone

O FluxStack suporta a criação de um executável binário único, que contém o *runtime* Bun e a aplicação.

```bash
bun run build:exe
# Requer que 'bun run build' tenha sido executado previamente.
```

Este executável pode ser copiado e executado em qualquer máquina com a mesma arquitetura, sem a necessidade de ter o Bun instalado globalmente.

## Configuração de Build

As configurações de *build* são controladas por `client.config.ts` e pela seção `build` em `fluxstack.config.ts`.

| Configuração | Ambiente `production` (Padrão) | Impacto |
| :--- | :--- | :--- |
| `minify` | `true` | Reduz o tamanho dos arquivos JavaScript e CSS. |
| `sourceMaps` | `false` | Desabilita *source maps* para evitar exposição de código-fonte. |
| `outDir` | `dist` | Diretório de saída do *build*. |
| `optimization.treeshake` | `true` | Remove código não utilizado. |
