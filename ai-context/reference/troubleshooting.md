# Diagnóstico e Soluções Rápidas (Troubleshooting)

Esta seção lista problemas comuns e suas soluções no ambiente FluxStack.

## 1. Erros de Inferência de Tipo no Frontend

**Sintoma:** O cliente Eden Treaty (`api.resource.method()`) retorna um tipo `any` ou `unknown`, ou o TypeScript reclama que a propriedade `data` ou `error` não existe.

**Causa:** O backend (Elysia) não definiu o `response` schema para a rota.

**Solução:**
1.  Localize a rota correspondente em `app/server/routes/`.
2.  **Adicione o `response` schema obrigatório** à rota, garantindo que ele reflita o objeto de resposta real.
    ```typescript
    .get('/', () => ({ status: 'ok' }), {
      response: t.Object({ status: t.String() }) // OBRIGATÓRIO
    })
    ```
3.  Reinicie o servidor de desenvolvimento (`bun run dev`) para que o Eden Treaty regenere o cliente de API.

## 2. Problemas de CORS

**Sintoma:** O frontend não consegue se comunicar com o backend, recebendo erros como "No 'Access-Control-Allow-Origin' header is present".

**Causa:** As origens permitidas (domínios) não estão configuradas corretamente.

**Solução:**
1.  Verifique o arquivo `config/server.config.ts`.
2.  Ajuste a propriedade `cors.origins` para incluir o domínio do frontend (em desenvolvimento, geralmente `http://localhost:5173`).
3.  Em produção, certifique-se de que a variável de ambiente `FLUXSTACK_CORS_ORIGINS` esteja definida corretamente.

## 3. Configuração de Ambiente Incorreta

**Sintoma:** O aplicativo está usando configurações de desenvolvimento em produção (ou vice-versa).

**Causa:** A variável de ambiente `NODE_ENV` não está definida ou está definida incorretamente.

**Solução:**
1.  **Desenvolvimento:** Certifique-se de que `NODE_ENV` esteja definido como `development` (o `bun run dev` faz isso automaticamente).
2.  **Produção:** Certifique-se de que o comando de *build* e *start* seja executado com `NODE_ENV=production`. O script `bun run build` já inclui `cross-env NODE_ENV=production`.
3.  Verifique se as variáveis de ambiente personalizadas estão prefixadas com `FLUXSTACK_` para serem lidas pelo sistema de configuração.

## 4. Erro ao Acessar Arquivos Estáticos

**Sintoma:** Imagens ou outros ativos na pasta `public/` não são carregados.

**Causa:** O *plugin* de arquivos estáticos pode não estar configurado ou habilitado.

**Solução:**
1.  Verifique se o `staticFilesPlugin` está sendo usado em `app/server/index.ts`.
2.  Verifique a configuração em `config/plugins.config.ts` para garantir que o diretório público (`staticPublicDir`) esteja correto.
