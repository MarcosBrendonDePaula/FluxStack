# Monitoring & Observabilidade

O plugin `monitoring` (`core/plugins/built-in/monitoring/index.ts`) adiciona coleta de métricas, health checks e exporters configuráveis. Ele é desabilitado por padrão (para evitar overhead), mas pode ser ativado via `fluxstack.config.ts` ou variáveis.

## Ativando o Plugin
Em `fluxstack.config.ts`, bloco `plugins.enabled` já inclui `"monitoring"`. Ajuste as opções em `plugins.config.monitoring` ou via env:

```ts
monitoring: {
  enabled: env.get('ENABLE_MONITORING', false),
  httpMetrics: env.get('HTTP_METRICS', true),
  systemMetrics: env.get('SYSTEM_METRICS', true),
  customMetrics: env.get('CUSTOM_METRICS', false),
  collectInterval: env.get('METRICS_INTERVAL', 5000),
  retentionPeriod: env.get('METRICS_RETENTION', 300000),
  exporters: [
    { type: 'console', enabled: false, interval: 30000 },
    { type: 'prometheus', endpoint: '/metrics', enabled: true }
  ],
  thresholds: {
    responseTime: env.get('THRESHOLD_RESPONSE_TIME', 1000),
    errorRate: env.get('THRESHOLD_ERROR_RATE', 0.05),
    memoryUsage: env.get('THRESHOLD_MEMORY', 0.8),
    cpuUsage: env.get('THRESHOLD_CPU', 0.8)
  }
}
```

### Variáveis Principais
| Chave | Efeito |
|-------|--------|
| `ENABLE_MONITORING` | Habilita/desabilita plugin. |
| `HTTP_METRICS` | Coleta métricas HTTP (status, duração). |
| `SYSTEM_METRICS` | CPU, memória, load average. |
| `CUSTOM_METRICS` | Permite criar métricas próprias via `MetricsCollector`. |
| `METRICS_INTERVAL` | Intervalo de coleta (ms). |
| `METRICS_RETENTION` | Tempo de retenção em memória (ms). |
| `MONITORING_EXPORTERS` | Configuração JSON opcional para exporters. |
| `THRESHOLD_*` | Ajustam alertas internos. |

## Métricas Coletadas
### HTTP
- Contadores por método/status.
- Histogramas de duração por rota.
- Tamanho de payload.

### Sistema
- Uso de CPU, memória, disco.
- Load average, uptime.
- Estatísticas de network (quando disponíveis).

### Custom
Via API `metricsCollector` (acessível em `PluginContext.utils` ou módulos utilitários). É possível registrar contadores/gauges/histogramas adicionais.

## Exporters
| Tipo        | Descrição                                                         |
|-------------|-------------------------------------------------------------------|
| `console`   | Loga snapshot periódico via `logger`.                             |
| `prometheus`| Gera texto no formato Prometheus; pode enviar a `/metrics` ou Pushgateway. |
| `json`      | Serializa e envia para endpoint HTTP JSON.                        |
| `file`      | Escreve métricas em arquivo (JSON ou Prometheus).                 |

Cada exporter aceita `interval` e campos específicos (`endpoint`, `filePath`, `format`).

## Hooks Utilizados
- `setup`: inicializa `MetricsCollector`, timers e exporters.
- `onRequest`/`onResponse`: mede duração e status das requisições.
- `onError`: contabiliza falhas.
- `onServerStop`: encerra timers e exporters.

## Thresholds e Alertas
`thresholds` define limites para resposta, erro, memória e CPU. Quando ultrapassados, o plugin registra alertas no log com severidade (`info`/`warning`/`error`/`critical`).

## Expondo Métricas
- Use `exporters` para expor `/metrics` (Prometheus).  
- Integre com dashboards (Grafana, etc.) apontando para o exporter escolhido.

## Boas Práticas
- Ative em staging/produção com intervalos coerentes (5–15s) para evitar overhead.
- Combine com logs estruturados do Winston para correlacionar eventos.
- Ajuste `retentionPeriod` conforme memória disponível; métricas antigas são descartadas automaticamente.
- Para métricas personalizadas, crie um plugin secundário que injete valores via `customMetrics`.

## Referências
- Implementação completa: `core/plugins/built-in/monitoring/index.ts`.
- Coletor utilitário: `core/utils/monitoring`.
- Configuração declarativa: `fluxstack.config.ts` (`monitoring` + `monitoring.metrics/profiling`).***
