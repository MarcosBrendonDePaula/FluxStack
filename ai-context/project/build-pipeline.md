# Build Pipeline & Deploy

FluxStack utiliza `FluxStackBuilder` (`core/build/index.ts`) para gerar artefatos de produção. O processo combina bundler próprio, otimizações opcionais e geração de arquivos auxiliares (manifest, Dockerfile).

## Comandos
- `bun run build` / `flux build` – executa build completo (frontend + backend).
- `flux build:frontend` / `bun run build:frontend` – apenas assets do Vite.
- `flux build:backend` – bundle do backend Elysia/Bun.

Embora o modo padrão combine frontend e backend sob o mesmo host (proxy reverso embutido), é totalmente suportado publicar ou testar os pacotes de forma independente construindo cada lado separadamente.***

## Arquitetura do Builder
1. **Bundler** (‘core/build/bundler’):  
   - Backend: gera `dist/index.js` a partir de `app/server/index.ts`.  
   - Frontend: delega ao Vite (`VITE_BUILD_OUTDIR`, `VITE_BUILD_SOURCEMAPS`).
2. **Optimizer** (`core/build/optimizer.ts`):  
   - Treeshake, compressão, remoção de CSS não usado, análise de bundle (configurável).
3. **Manifest** (`generateManifest`):  
   - Grava metadados (versão, estatísticas, entradas, tamanhos) em JSON.
4. **Docker** (`createDockerFiles`):  
   - Cria `dist/Dockerfile` e `dist/docker-compose.yml` prontos para produção (imagem `oven/bun`).

## Configuração
Controlada pelo bloco `build` em `fluxstack.config.ts` + `config/build.config.ts`:

```ts
build: {
  target: env.get('BUILD_TARGET', 'bun'),   // bun | node | docker
  outDir: env.get('BUILD_OUTDIR', 'dist'),
  sourceMaps: env.get('BUILD_SOURCEMAPS', !helpers.isProduction()),
  minify: env.get('BUILD_MINIFY', helpers.isProduction()),
  treeshake: env.get('BUILD_TREESHAKE', helpers.isProduction()),
  clean: env.get('BUILD_CLEAN', true),
  optimization: {
    compress: env.get('BUILD_COMPRESS', helpers.isProduction()),
    splitChunks: env.get('BUILD_SPLIT_CHUNKS', true),
    bundleAnalyzer: env.get('BUILD_ANALYZER', helpers.isDevelopment())
  }
}
```

### Variáveis Comuns
- `BUILD_TARGET`, `BUILD_OUTDIR`, `BUILD_SOURCEMAPS`, `BUILD_MINIFY`, `BUILD_TREESHAKE`.
- `BUILD_COMPRESS`, `BUILD_SPLIT_CHUNKS`, `BUILD_ANALYZER`.
- Frontend específico: `CLIENT_OUTDIR`, `CLIENT_SOURCEMAPS`, `CLIENT_MINIFY`, `CLIENT_TARGET`.

## Artefatos Gerados
- `dist/index.js` – bundle backend.
- `dist/client/` – assets estáticos do Vite (quando build completo).
- `dist/manifest.json` (opcional) – metadados de build.
- `dist/Dockerfile`, `dist/docker-compose.yml`.

## Deploy com Docker
Passos típicos:
```bash
bun run build
cd dist
docker build -t fluxstack-app .
docker run -p 3000:3000 fluxstack-app
```

`docker-compose.yml` inclui serviço principal e espaço para reverse proxy (comentado).

## Personalizações
- Substitua o template do Dockerfile editando `core/build/index.ts` (função `createDockerFiles`).
- Para múltiplos targets (ex.: serverless), ajuste `build.target` e adicione lógica no builder conforme necessário.
- Use `optimization.bundleAnalysis` para ligar ferramentas adicionais (ex.: gerar relatórios customizados).

## Boas Práticas
- Execute `flux build` em CI para validar integridade (reduz risco de regressões).
- Utilize `bun run build:frontend` e `build:backend` quando precisar depurar partes isoladas.
- Ajuste `clean` para garantir diretório `dist/` limpo antes de cada build.
- Combine com `monitoring` e `staticFiles` para empacotar assets, uploads e métricas corretamente.

## Referências
- Implementação: `core/build/index.ts`, `core/build/bundler.ts`, `core/build/optimizer.ts`.
- Config: `config/build.config.ts`, `project/configuration.md`.
- Scripts relacionados: `package.json` (`build`, `start`, `docker:*`).***
