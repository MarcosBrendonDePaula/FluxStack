/**
 * Monitoring Plugin for FluxStack
 * Provides performance monitoring, metrics collection, and system monitoring
 */

import type { Plugin, PluginContext, RequestContext, ResponseContext, ErrorContext } from "../../types"
import { MetricsCollector } from "../../../utils/monitoring"
import * as os from 'os'
import * as fs from 'fs'
import * as path from 'path'

// Enhanced metrics interfaces
interface Metric {
  name: string
  value: number
  timestamp: number
  labels?: Record<string, string>
}

interface Counter extends Metric {
  type: 'counter'
  inc(value?: number): void
}

interface Gauge extends Metric {
  type: 'gauge'
  set(value: number): void
  inc(value?: number): void
  dec(value?: number): void
}

interface Histogram extends Metric {
  type: 'histogram'
  buckets: number[]
  values: number[]
  observe(value: number): void
}

interface MetricsRegistry {
  counters: Map<string, Counter>
  gauges: Map<string, Gauge>
  histograms: Map<string, Histogram>
}

// SystemMetrics and HttpMetrics are now imported from MetricsCollector

interface MetricsExporter {
  type: 'prometheus' | 'json' | 'console' | 'file'
  endpoint?: string
  interval?: number
  enabled: boolean
  format?: 'text' | 'json'
  filePath?: string
}

interface AlertThreshold {
  metric: string
  operator: '>' | '<' | '>=' | '<=' | '==' | '!='
  value: number
  severity: 'info' | 'warning' | 'error' | 'critical'
  message?: string
}

export const monitoringPlugin: Plugin = {
  name: "monitoring",
  version: "1.0.0",
  description: "Performance monitoring plugin with metrics collection and system monitoring",
  author: "FluxStack Team",
  priority: "high", // Should run early to capture all metrics
  category: "monitoring",
  tags: ["monitoring", "metrics", "performance", "observability"],
  dependencies: [], // No dependencies
  
  configSchema: {
    type: "object",
    properties: {
      enabled: {
        type: "boolean",
        description: "Enable monitoring plugin"
      },
      httpMetrics: {
        type: "boolean",
        description: "Collect HTTP request/response metrics"
      },
      systemMetrics: {
        type: "boolean",
        description: "Collect system metrics (memory, CPU, etc.)"
      },
      customMetrics: {
        type: "boolean",
        description: "Enable custom metrics collection"
      },
      collectInterval: {
        type: "number",
        minimum: 1000,
        description: "Interval for collecting system metrics (ms)"
      },
      retentionPeriod: {
        type: "number",
        minimum: 60000,
        description: "How long to retain metrics in memory (ms)"
      },
      exporters: {
        type: "array",
        items: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: ["prometheus", "json", "console", "file"]
            },
            endpoint: { type: "string" },
            interval: { type: "number" },
            enabled: { type: "boolean" },
            format: { 
              type: "string",
              enum: ["text", "json"]
            },
            filePath: { type: "string" }
          },
          required: ["type"]
        },
        description: "Metrics exporters configuration"
      },
      thresholds: {
        type: "object",
        properties: {
          responseTime: { type: "number" },
          errorRate: { type: "number" },
          memoryUsage: { type: "number" },
          cpuUsage: { type: "number" }
        },
        description: "Alert thresholds"
      },
      alerts: {
        type: "array",
        items: {
          type: "object",
          properties: {
            metric: { type: "string" },
            operator: { 
              type: "string",
              enum: [">", "<", ">=", "<=", "==", "!="]
            },
            value: { type: "number" },
            severity: {
              type: "string",
              enum: ["info", "warning", "error", "critical"]
            },
            message: { type: "string" }
          },
          required: ["metric", "operator", "value", "severity"]
        },
        description: "Custom alert configurations"
      }
    },
    additionalProperties: false
  },
  
  defaultConfig: {
    enabled: true,
    httpMetrics: true,
    systemMetrics: true,
    customMetrics: true,
    collectInterval: 5000,
    retentionPeriod: 300000, // 5 minutes
    exporters: [
      {
        type: "console",
        interval: 30000,
        enabled: false
      },
      {
        type: "prometheus",
        endpoint: "/metrics",
        enabled: true,
        format: "text"
      }
    ],
    thresholds: {
      responseTime: 1000, // ms
      errorRate: 0.05, // 5%
      memoryUsage: 0.8, // 80%
      cpuUsage: 0.8 // 80%
    },
    alerts: []
  },

  setup: async (context: PluginContext) => {
    const config = getPluginConfig(context)
    
    if (!config.enabled) {
      context.logger.info('Monitoring plugin disabled by configuration')
      return
    }

    context.logger.info('Initializing monitoring plugin', {
      httpMetrics: config.httpMetrics,
      systemMetrics: config.systemMetrics,
      customMetrics: config.customMetrics,
      exporters: config.exporters.length,
      alerts: config.alerts.length
    })

    // Initialize enhanced metrics registry
    const metricsRegistry: MetricsRegistry = {
      counters: new Map(),
      gauges: new Map(),
      histograms: new Map()
    }

    // Initialize metrics collector
    const metricsCollector = new MetricsCollector()

    // Store registry and collector in context for access by other hooks
    ;(context as any).metricsRegistry = metricsRegistry
    ;(context as any).metricsCollector = metricsCollector

    // Initialize HTTP metrics
    if (config.httpMetrics) {
      initializeHttpMetrics(metricsRegistry, metricsCollector)
    }

    // Start system metrics collection
    if (config.systemMetrics) {
      startSystemMetricsCollection(context, config, metricsCollector)
    }

    // Setup metrics endpoint for Prometheus
    setupMetricsEndpoint(context, config, metricsRegistry, metricsCollector)

    // Start metrics exporters
    startMetricsExporters(context, config, metricsRegistry, metricsCollector)

    // Setup metrics cleanup
    setupMetricsCleanup(context, config, metricsRegistry)

    // Setup alert monitoring
    if (config.alerts.length > 0) {
      setupAlertMonitoring(context, config, metricsRegistry)
    }

    context.logger.info('Monitoring plugin initialized successfully')
  },

  onServerStart: async (context: PluginContext) => {
    const config = getPluginConfig(context)
    
    if (config.enabled) {
      context.logger.info('Monitoring plugin: Server monitoring started', {
        pid: process.pid,
        nodeVersion: process.version,
        platform: process.platform
      })

      // Record server start metric
      const metricsRegistry = (context as any).metricsRegistry as MetricsRegistry
      if (metricsRegistry) {
        recordCounter(metricsRegistry, 'server_starts_total', 1, { 
          version: context.config.app.version 
        })
      }
    }
  },

  onServerStop: async (context: PluginContext) => {
    const config = getPluginConfig(context)
    
    if (config.enabled) {
      context.logger.info('Monitoring plugin: Server monitoring stopped')

      // Record server stop metric
      const metricsRegistry = (context as any).metricsRegistry as MetricsRegistry
      if (metricsRegistry) {
        recordCounter(metricsRegistry, 'server_stops_total', 1)
      }

      // Cleanup intervals
      const intervals = (context as any).monitoringIntervals as NodeJS.Timeout[]
      if (intervals) {
        intervals.forEach(interval => clearInterval(interval))
      }
    }
  },

  onRequest: async (requestContext: RequestContext) => {
    const startTime = Date.now()
    
    // Store start time for duration calculation
    ;(requestContext as any).monitoringStartTime = startTime

    // Get metrics registry and collector from context
    const metricsRegistry = getMetricsRegistry(requestContext)
    const metricsCollector = getMetricsCollector(requestContext)
    if (!metricsRegistry || !metricsCollector) return

    // Record request metrics
    recordCounter(metricsRegistry, 'http_requests_total', 1, {
      method: requestContext.method,
      path: requestContext.path
    })

    // Record request size if available
    const contentLength = requestContext.headers['content-length']
    if (contentLength) {
      const size = parseInt(contentLength)
      recordHistogram(metricsRegistry, 'http_request_size_bytes', size, {
        method: requestContext.method
      })
    }

    // Record in collector as well
    const counter = metricsCollector.getAllMetrics().get('http_requests_total')
    if (counter && typeof (counter as any).inc === 'function') {
      (counter as any).inc(1, { method: requestContext.method, path: requestContext.path })
    }
  },

  onResponse: async (responseContext: ResponseContext) => {
    const metricsRegistry = getMetricsRegistry(responseContext)
    const metricsCollector = getMetricsCollector(responseContext)
    if (!metricsRegistry || !metricsCollector) return

    const startTime = (responseContext as any).monitoringStartTime || responseContext.startTime
    const duration = Date.now() - startTime

    // Record response metrics
    recordHistogram(metricsRegistry, 'http_request_duration_ms', duration, {
      method: responseContext.method,
      path: responseContext.path,
      status_code: responseContext.statusCode.toString()
    })

    // Record response size
    if (responseContext.size) {
      recordHistogram(metricsRegistry, 'http_response_size_bytes', responseContext.size, {
        method: responseContext.method,
        status_code: responseContext.statusCode.toString()
      })
    }

    // Record status code
    recordCounter(metricsRegistry, 'http_responses_total', 1, {
      method: responseContext.method,
      status_code: responseContext.statusCode.toString()
    })

    // Record in collector
    metricsCollector.recordHttpRequest(
      responseContext.method,
      responseContext.path,
      responseContext.statusCode,
      duration,
      parseInt(responseContext.headers['content-length'] || '0') || undefined,
      responseContext.size
    )

    // Check thresholds and log warnings
    const config = getPluginConfig(responseContext)
    if (config.thresholds.responseTime && duration > config.thresholds.responseTime) {
      const logger = (responseContext as any).logger || console
      logger.warn(`Slow request detected: ${responseContext.method} ${responseContext.path} took ${duration}ms`, {
        method: responseContext.method,
        path: responseContext.path,
        duration,
        threshold: config.thresholds.responseTime
      })
    }
  },

  onError: async (errorContext: ErrorContext) => {
    const metricsRegistry = getMetricsRegistry(errorContext)
    const metricsCollector = getMetricsCollector(errorContext)
    if (!metricsRegistry || !metricsCollector) return

    // Record error metrics
    recordCounter(metricsRegistry, 'http_errors_total', 1, {
      method: errorContext.method,
      path: errorContext.path,
      error_type: errorContext.error.name
    })

    // Record error duration
    recordHistogram(metricsRegistry, 'http_error_duration_ms', errorContext.duration, {
      method: errorContext.method,
      error_type: errorContext.error.name
    })

    // Record in collector (treat as 500 error)
    metricsCollector.recordHttpRequest(
      errorContext.method,
      errorContext.path,
      500,
      errorContext.duration
    )

    // Increment error counter in collector
    const errorCounter = metricsCollector.getAllMetrics().get('http_errors_total')
    if (errorCounter && typeof (errorCounter as any).inc === 'function') {
      (errorCounter as any).inc(1, { 
        method: errorContext.method, 
        path: errorContext.path,
        error_type: errorContext.error.name
      })
    }
  }
}

// Helper functions

function getPluginConfig(context: any) {
  // In a real implementation, this would get the config from the plugin context
  const pluginConfig = context.config?.plugins?.config?.monitoring || {}
  return { ...monitoringPlugin.defaultConfig, ...pluginConfig }
}

function getMetricsRegistry(context: any): MetricsRegistry | null {
  // In a real implementation, this would get the registry from the plugin context
  return (context as any).metricsRegistry || null
}

function getMetricsCollector(context: any): MetricsCollector | null {
  // In a real implementation, this would get the collector from the plugin context
  return (context as any).metricsCollector || null
}

function initializeHttpMetrics(registry: MetricsRegistry, collector: MetricsCollector) {
  // Initialize HTTP-related counters and histograms
  recordCounter(registry, 'http_requests_total', 0)
  recordCounter(registry, 'http_responses_total', 0)
  recordCounter(registry, 'http_errors_total', 0)
  recordHistogram(registry, 'http_request_duration_ms', 0)
  recordHistogram(registry, 'http_request_size_bytes', 0)
  recordHistogram(registry, 'http_response_size_bytes', 0)

  // Initialize metrics in collector
  collector.createCounter('http_requests_total', 'Total number of HTTP requests')
  collector.createCounter('http_responses_total', 'Total number of HTTP responses')
  collector.createCounter('http_errors_total', 'Total number of HTTP errors')
  collector.createHistogram('http_request_duration_seconds', 'HTTP request duration in seconds', [0.1, 0.5, 1, 2.5, 5, 10])
  collector.createHistogram('http_request_size_bytes', 'HTTP request size in bytes', [100, 1000, 10000, 100000, 1000000])
  collector.createHistogram('http_response_size_bytes', 'HTTP response size in bytes', [100, 1000, 10000, 100000, 1000000])
}

function startSystemMetricsCollection(context: PluginContext, config: any, collector: MetricsCollector) {
  const intervals: NodeJS.Timeout[] = []

  // Initialize system metrics in collector
  collector.createGauge('process_memory_rss_bytes', 'Process resident set size in bytes')
  collector.createGauge('process_memory_heap_used_bytes', 'Process heap used in bytes')
  collector.createGauge('process_memory_heap_total_bytes', 'Process heap total in bytes')
  collector.createGauge('process_memory_external_bytes', 'Process external memory in bytes')
  collector.createGauge('process_cpu_user_seconds_total', 'Process CPU user time in seconds')
  collector.createGauge('process_cpu_system_seconds_total', 'Process CPU system time in seconds')
  collector.createGauge('process_uptime_seconds', 'Process uptime in seconds')
  collector.createGauge('process_pid', 'Process ID')
  collector.createGauge('nodejs_version_info', 'Node.js version info')
  
  if (process.platform !== 'win32') {
    collector.createGauge('system_load_average_1m', 'System load average over 1 minute')
    collector.createGauge('system_load_average_5m', 'System load average over 5 minutes')
    collector.createGauge('system_load_average_15m', 'System load average over 15 minutes')
  }

  const collectSystemMetrics = () => {
    const metricsRegistry = (context as any).metricsRegistry as MetricsRegistry
    if (!metricsRegistry) return

    try {
      // Memory metrics
      const memUsage = process.memoryUsage()
      recordGauge(metricsRegistry, 'process_memory_rss_bytes', memUsage.rss)
      recordGauge(metricsRegistry, 'process_memory_heap_used_bytes', memUsage.heapUsed)
      recordGauge(metricsRegistry, 'process_memory_heap_total_bytes', memUsage.heapTotal)
      recordGauge(metricsRegistry, 'process_memory_external_bytes', memUsage.external)

      // CPU metrics
      const cpuUsage = process.cpuUsage()
      recordGauge(metricsRegistry, 'process_cpu_user_seconds_total', cpuUsage.user / 1000000)
      recordGauge(metricsRegistry, 'process_cpu_system_seconds_total', cpuUsage.system / 1000000)

      // Process metrics
      recordGauge(metricsRegistry, 'process_uptime_seconds', process.uptime())
      recordGauge(metricsRegistry, 'process_pid', process.pid)
      recordGauge(metricsRegistry, 'nodejs_version_info', 1, { version: process.version })

      // System metrics
      const totalMem = os.totalmem()
      const freeMem = os.freemem()
      recordGauge(metricsRegistry, 'system_memory_total_bytes', totalMem)
      recordGauge(metricsRegistry, 'system_memory_free_bytes', freeMem)
      recordGauge(metricsRegistry, 'system_memory_used_bytes', totalMem - freeMem)

      // CPU count
      recordGauge(metricsRegistry, 'system_cpu_count', os.cpus().length)

      // Load average (Unix-like systems only)
      if (process.platform !== 'win32') {
        const loadAvg = os.loadavg()
        recordGauge(metricsRegistry, 'system_load_average_1m', loadAvg[0])
        recordGauge(metricsRegistry, 'system_load_average_5m', loadAvg[1])
        recordGauge(metricsRegistry, 'system_load_average_15m', loadAvg[2])
      }

      // Event loop lag measurement
      const start = process.hrtime.bigint()
      setImmediate(() => {
        const lag = Number(process.hrtime.bigint() - start) / 1e6 // Convert to milliseconds
        recordGauge(metricsRegistry, 'nodejs_eventloop_lag_seconds', lag / 1000)
      })

    } catch (error) {
      context.logger.error('Error collecting system metrics', { error })
    }
  }

  // Collect metrics immediately and then at intervals
  collectSystemMetrics()
  const interval = setInterval(collectSystemMetrics, config.collectInterval)
  intervals.push(interval)

  // Store intervals for cleanup
  ;(context as any).monitoringIntervals = intervals
}

function setupMetricsEndpoint(context: PluginContext, config: any, registry: MetricsRegistry, collector: MetricsCollector) {
  // Find Prometheus exporter configuration
  const prometheusExporter = config.exporters.find((e: any) => e.type === 'prometheus' && e.enabled)
  if (!prometheusExporter) return

  const endpoint = prometheusExporter.endpoint || '/metrics'
  
  // Add metrics endpoint to the app
  if (context.app && typeof context.app.get === 'function') {
    context.app.get(endpoint, () => {
      const prometheusData = collector.exportPrometheus()
      return new Response(prometheusData, {
        headers: {
          'Content-Type': 'text/plain; version=0.0.4; charset=utf-8'
        }
      })
    })
    
    context.logger.info(`Metrics endpoint available at ${endpoint}`)
  }
}

function startMetricsExporters(context: PluginContext, config: any, registry: MetricsRegistry, collector: MetricsCollector) {
  const intervals: NodeJS.Timeout[] = (context as any).monitoringIntervals || []

  for (const exporterConfig of config.exporters) {
    if (!exporterConfig.enabled) continue

    const exportMetrics = () => {
      try {
        switch (exporterConfig.type) {
          case 'console':
            exportToConsole(registry, collector, context.logger)
            break
          case 'prometheus':
            if (!exporterConfig.endpoint) {
              // Only export to logs if no endpoint is configured
              exportToPrometheus(registry, collector, exporterConfig, context.logger)
            }
            break
          case 'json':
            exportToJson(registry, collector, exporterConfig, context.logger)
            break
          case 'file':
            exportToFile(registry, collector, exporterConfig, context.logger)
            break
          default:
            context.logger.warn(`Unknown exporter type: ${exporterConfig.type}`)
        }
      } catch (error) {
        context.logger.error(`Error in ${exporterConfig.type} exporter`, { error })
      }
    }

    if (exporterConfig.interval) {
      const interval = setInterval(exportMetrics, exporterConfig.interval)
      intervals.push(interval)
    }
  }

  ;(context as any).monitoringIntervals = intervals
}

function setupAlertMonitoring(context: PluginContext, config: any, registry: MetricsRegistry) {
  const intervals: NodeJS.Timeout[] = (context as any).monitoringIntervals || []

  const checkAlerts = () => {
    for (const alert of config.alerts) {
      try {
        const metricValue = getMetricValue(registry, alert.metric)
        if (metricValue !== null && evaluateThreshold(metricValue, alert.operator, alert.value)) {
          const message = alert.message || `Alert: ${alert.metric} ${alert.operator} ${alert.value} (current: ${metricValue})`
          
          switch (alert.severity) {
            case 'critical':
            case 'error':
              context.logger.error(message, { 
                metric: alert.metric, 
                value: metricValue, 
                threshold: alert.value,
                severity: alert.severity
              })
              break
            case 'warning':
              context.logger.warn(message, { 
                metric: alert.metric, 
                value: metricValue, 
                threshold: alert.value,
                severity: alert.severity
              })
              break
            case 'info':
            default:
              context.logger.info(message, { 
                metric: alert.metric, 
                value: metricValue, 
                threshold: alert.value,
                severity: alert.severity
              })
              break
          }
        }
      } catch (error) {
        context.logger.error(`Error checking alert for ${alert.metric}`, { error })
      }
    }
  }

  // Check alerts every 30 seconds
  const interval = setInterval(checkAlerts, 30000)
  intervals.push(interval)

  ;(context as any).monitoringIntervals = intervals
}

function setupMetricsCleanup(context: PluginContext, config: any, registry: MetricsRegistry) {
  const intervals: NodeJS.Timeout[] = (context as any).monitoringIntervals || []

  const cleanup = () => {
    const now = Date.now()
    const cutoff = now - config.retentionPeriod

    // Clean up old metrics
    for (const [key, metric] of registry.counters.entries()) {
      if (metric.timestamp < cutoff) {
        registry.counters.delete(key)
      }
    }

    for (const [key, metric] of registry.gauges.entries()) {
      if (metric.timestamp < cutoff) {
        registry.gauges.delete(key)
      }
    }

    for (const [key, metric] of registry.histograms.entries()) {
      if (metric.timestamp < cutoff) {
        registry.histograms.delete(key)
      }
    }
  }

  // Clean up every minute
  const interval = setInterval(cleanup, 60000)
  intervals.push(interval)

  ;(context as any).monitoringIntervals = intervals
}

// Metrics recording functions
function recordCounter(registry: MetricsRegistry, name: string, value: number, labels?: Record<string, string>) {
  const key = createMetricKey(name, labels)
  const existing = registry.counters.get(key)
  
  registry.counters.set(key, {
    type: 'counter',
    name,
    value: existing ? existing.value + value : value,
    timestamp: Date.now(),
    labels,
    inc: (incValue = 1) => {
      const metric = registry.counters.get(key)
      if (metric) {
        metric.value += incValue
        metric.timestamp = Date.now()
      }
    }
  })
}

function recordGauge(registry: MetricsRegistry, name: string, value: number, labels?: Record<string, string>) {
  const key = createMetricKey(name, labels)
  
  registry.gauges.set(key, {
    type: 'gauge',
    name,
    value,
    timestamp: Date.now(),
    labels,
    set: (newValue: number) => {
      const metric = registry.gauges.get(key)
      if (metric) {
        metric.value = newValue
        metric.timestamp = Date.now()
      }
    },
    inc: (incValue = 1) => {
      const metric = registry.gauges.get(key)
      if (metric) {
        metric.value += incValue
        metric.timestamp = Date.now()
      }
    },
    dec: (decValue = 1) => {
      const metric = registry.gauges.get(key)
      if (metric) {
        metric.value -= decValue
        metric.timestamp = Date.now()
      }
    }
  })
}

function recordHistogram(registry: MetricsRegistry, name: string, value: number, labels?: Record<string, string>) {
  const key = createMetricKey(name, labels)
  
  const existing = registry.histograms.get(key)
  if (existing) {
    existing.values.push(value)
    existing.timestamp = Date.now()
  } else {
    registry.histograms.set(key, {
      type: 'histogram',
      name,
      value,
      timestamp: Date.now(),
      labels,
      buckets: [0.1, 0.5, 1, 2.5, 5, 10],
      values: [value],
      observe: (observeValue: number) => {
        const metric = registry.histograms.get(key)
        if (metric) {
          metric.values.push(observeValue)
          metric.timestamp = Date.now()
        }
      }
    })
  }
}

function createMetricKey(name: string, labels?: Record<string, string>): string {
  if (!labels || Object.keys(labels).length === 0) {
    return name
  }
  
  const labelString = Object.entries(labels)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}="${value}"`)
    .join(',')
  
  return `${name}{${labelString}}`
}

function getMetricValue(registry: MetricsRegistry, metricName: string): number | null {
  // Check counters
  const counter = registry.counters.get(metricName)
  if (counter) return counter.value

  // Check gauges
  const gauge = registry.gauges.get(metricName)
  if (gauge) return gauge.value

  // Check histograms (return average)
  const histogram = registry.histograms.get(metricName)
  if (histogram && histogram.values.length > 0) {
    return histogram.values.reduce((sum, val) => sum + val, 0) / histogram.values.length
  }

  return null
}

function evaluateThreshold(value: number, operator: string, threshold: number): boolean {
  switch (operator) {
    case '>': return value > threshold
    case '<': return value < threshold
    case '>=': return value >= threshold
    case '<=': return value <= threshold
    case '==': return value === threshold
    case '!=': return value !== threshold
    default: return false
  }
}

// Enhanced Exporters
function exportToConsole(registry: MetricsRegistry, collector: MetricsCollector, logger: any) {
  const metrics = {
    counters: Array.from(registry.counters.values()),
    gauges: Array.from(registry.gauges.values()),
    histograms: Array.from(registry.histograms.values())
  }

  const systemMetrics = collector.getSystemMetrics()
  const httpMetrics = collector.getHttpMetrics()

  logger.info('Metrics snapshot', {
    timestamp: new Date().toISOString(),
    counters: metrics.counters.length,
    gauges: metrics.gauges.length,
    histograms: metrics.histograms.length,
    system: systemMetrics,
    http: httpMetrics,
    metrics
  })
}

function exportToPrometheus(registry: MetricsRegistry, collector: MetricsCollector, config: any, logger: any) {
  const prometheusData = collector.exportPrometheus()
  
  if (config.endpoint && config.endpoint !== '/metrics') {
    // POST to Prometheus pushgateway
    fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain; version=0.0.4; charset=utf-8'
      },
      body: prometheusData
    }).catch(error => {
      logger.error('Failed to push metrics to Prometheus', { error, endpoint: config.endpoint })
    })
  } else {
    logger.debug('Prometheus metrics generated', { lines: prometheusData.split('\n').length })
  }
}

function exportToJson(registry: MetricsRegistry, collector: MetricsCollector, config: any, logger: any) {
  const data = {
    timestamp: new Date().toISOString(),
    system: collector.getSystemMetrics(),
    http: collector.getHttpMetrics(),
    counters: Object.fromEntries(registry.counters.entries()),
    gauges: Object.fromEntries(registry.gauges.entries()),
    histograms: Object.fromEntries(registry.histograms.entries())
  }
  
  if (config.endpoint) {
    // POST to JSON endpoint
    fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    }).catch(error => {
      logger.error('Failed to export metrics to JSON endpoint', { error, endpoint: config.endpoint })
    })
  } else {
    logger.info('JSON metrics export', data)
  }
}

function exportToFile(registry: MetricsRegistry, collector: MetricsCollector, config: any, logger: any) {
  if (!config.filePath) {
    logger.warn('File exporter configured but no filePath specified')
    return
  }

  const data = {
    timestamp: new Date().toISOString(),
    system: collector.getSystemMetrics(),
    http: collector.getHttpMetrics(),
    counters: Object.fromEntries(registry.counters.entries()),
    gauges: Object.fromEntries(registry.gauges.entries()),
    histograms: Object.fromEntries(registry.histograms.entries())
  }

  const content = config.format === 'json' 
    ? JSON.stringify(data, null, 2)
    : collector.exportPrometheus()

  try {
    // Ensure directory exists
    const dir = path.dirname(config.filePath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    // Write metrics to file
    fs.writeFileSync(config.filePath, content, 'utf8')
    logger.debug('Metrics exported to file', { filePath: config.filePath, format: config.format })
  } catch (error) {
    logger.error('Failed to export metrics to file', { error, filePath: config.filePath })
  }
}

function formatPrometheusLabels(labels?: Record<string, string>): string {
  if (!labels || Object.keys(labels).length === 0) {
    return ''
  }
  
  const labelPairs = Object.entries(labels)
    .map(([key, value]) => `${key}="${value}"`)
    .join(',')
  
  return `{${labelPairs}}`
}

export default monitoringPlugin