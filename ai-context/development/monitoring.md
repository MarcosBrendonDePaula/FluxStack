# Monitoramento e Observabilidade

O FluxStack oferece um sistema de monitoramento integrado que permite coletar métricas, realizar *profiling* e configurar *exporters* de log.

## Configuração Centralizada

Toda a configuração de observabilidade é gerenciada através de `config/monitoring.config.ts` e consolidada na seção `monitoring` de `fluxstack.config.ts`.

## 1. Métricas

O sistema de métricas coleta dados de desempenho e saúde da aplicação.

| Configuração | Descrição | Padrão em Produção |
| :--- | :--- | :--- |
| `metrics.enabled` | Habilita a coleta de métricas. | `true` |
| `metrics.collectInterval` | Intervalo de coleta em milissegundos. | `10000` (10 segundos) |
| `metrics.httpMetrics` | Coleta métricas de requisições HTTP (latência, contagem). | `true` |
| `metrics.systemMetrics` | Coleta métricas do sistema (CPU, memória, disco). | `true` |

**Acesso:** As métricas são expostas em um *endpoint* dedicado (geralmente `/metrics`) para serem consumidas por ferramentas como Prometheus.

## 2. Logging

O *logging* é configurado via `config/logger.config.ts` e utiliza o **Winston** como biblioteca principal.

*   **Nível de Log**: Controlado por `logging.level` (`debug`, `info`, `warn`, `error`).
*   **Transportes**: Define onde os logs serão enviados (console, arquivo, serviços externos).
    *   Em **Desenvolvimento**, o padrão é `console` com formato `pretty`.
    *   Em **Produção**, o padrão é `console` (para logs de nível `warn` ou superior) e `file` (para logs de nível `error` em `logs/error.log`), ambos em formato `json`.

## 3. Profiling

O *profiling* permite a coleta de dados detalhados sobre o uso de CPU e memória para otimização de desempenho.

| Configuração | Descrição | Padrão em Produção |
| :--- | :--- | :--- |
| `profiling.enabled` | Habilita a coleta de perfis. | `true` |
| `profiling.sampleRate` | Taxa de amostragem (ex: `0.01` = 1% das requisições). | `0.01` |
| `profiling.memoryProfiling` | Habilita o *profiling* de memória. | `true` |
| `profiling.cpuProfiling` | Habilita o *profiling* de CPU. | `false` (Pode ter alto impacto) |

**Recomendação:** Use o *profiling* com cautela em produção, mantendo a taxa de amostragem baixa para evitar sobrecarga.
