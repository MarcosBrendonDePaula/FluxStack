/**
 * Plugin Filter Manager
 * Manages filter execution for data transformation (WordPress-inspired)
 */

import type { FluxStack, PluginFilter } from "./types"
import type { Logger } from "../utils/logger"
import { FluxStackError } from "../utils/errors"

type Plugin = FluxStack.Plugin

export interface FilterResult<T = any> {
  data: T
  transformations: Array<{
    plugin: string
    before: any
    after: any
    duration: number
  }>
}

export interface FilterManagerConfig {
  logger?: Logger
  enableTracking?: boolean
}

export class PluginFilterManager {
  private logger?: Logger
  private enableTracking: boolean
  private plugins: Map<string, Plugin> = new Map()

  constructor(config: FilterManagerConfig = {}) {
    this.logger = config.logger
    this.enableTracking = config.enableTracking ?? true
  }

  /**
   * Register a plugin with the filter manager
   */
  registerPlugin(plugin: Plugin): void {
    if (plugin.filters && Object.keys(plugin.filters).length > 0) {
      this.plugins.set(plugin.name, plugin)
      this.logger?.debug(`Plugin '${plugin.name}' registered with filters`, {
        filters: Object.keys(plugin.filters)
      })
    }
  }

  /**
   * Unregister a plugin from the filter manager
   */
  unregisterPlugin(pluginName: string): void {
    this.plugins.delete(pluginName)
    this.logger?.debug(`Plugin '${pluginName}' unregistered from filters`)
  }

  /**
   * Apply a filter to data - passes through all registered filters
   */
  async applyFilter<T = any>(
    filterName: PluginFilter,
    data: T,
    context: any = {}
  ): Promise<FilterResult<T>> {
    const startTime = Date.now()
    let currentData = data
    const transformations: Array<{
      plugin: string
      before: any
      after: any
      duration: number
    }> = []

    this.logger?.debug(`Applying filter '${filterName}'`, {
      filter: filterName,
      pluginsCount: this.plugins.size
    })

    // Iterate through all plugins that implement this filter
    for (const [pluginName, plugin] of this.plugins.entries()) {
      if (!plugin.filters || !plugin.filters[filterName]) {
        continue
      }

      const filterFn = plugin.filters[filterName]
      if (typeof filterFn !== 'function') {
        continue
      }

      try {
        const filterStartTime = Date.now()
        const beforeData = this.enableTracking ? JSON.parse(JSON.stringify(currentData)) : undefined

        // Apply the filter
        const result = await filterFn(currentData, context)
        const filterDuration = Date.now() - filterStartTime

        // Track transformation if enabled
        if (this.enableTracking) {
          transformations.push({
            plugin: pluginName,
            before: beforeData,
            after: JSON.parse(JSON.stringify(result)),
            duration: filterDuration
          })
        }

        // Update current data with filtered result
        currentData = result

        this.logger?.debug(`Filter '${filterName}' applied by plugin '${pluginName}'`, {
          plugin: pluginName,
          filter: filterName,
          duration: filterDuration
        })

      } catch (error) {
        this.logger?.error(`Filter '${filterName}' failed in plugin '${pluginName}'`, {
          plugin: pluginName,
          filter: filterName,
          error
        })

        // Continue with next filter instead of breaking the chain
        // This makes filters more resilient
        continue
      }
    }

    const totalDuration = Date.now() - startTime
    this.logger?.debug(`Filter '${filterName}' completed`, {
      filter: filterName,
      appliedFilters: transformations.length,
      totalDuration
    })

    return {
      data: currentData,
      transformations
    }
  }

  /**
   * Apply a filter synchronously (blocking)
   * Use only when you know all filters are synchronous
   */
  applyFilterSync<T = any>(
    filterName: PluginFilter,
    data: T,
    context: any = {}
  ): T {
    let currentData = data

    for (const [pluginName, plugin] of this.plugins.entries()) {
      if (!plugin.filters || !plugin.filters[filterName]) {
        continue
      }

      const filterFn = plugin.filters[filterName]
      if (typeof filterFn !== 'function') {
        continue
      }

      try {
        const result = filterFn(currentData, context)

        // Check if result is a promise (filter is async)
        if (result instanceof Promise) {
          throw new FluxStackError(
            `Filter '${filterName}' in plugin '${pluginName}' is async but applyFilterSync was used`,
            'ASYNC_FILTER_IN_SYNC_CONTEXT',
            500
          )
        }

        currentData = result

      } catch (error) {
        this.logger?.error(`Filter '${filterName}' failed in plugin '${pluginName}'`, {
          plugin: pluginName,
          filter: filterName,
          error
        })
        continue
      }
    }

    return currentData
  }

  /**
   * Check if a filter has any implementations
   */
  hasFilter(filterName: PluginFilter): boolean {
    for (const plugin of this.plugins.values()) {
      if (plugin.filters && plugin.filters[filterName]) {
        return true
      }
    }
    return false
  }

  /**
   * Get all plugins implementing a specific filter
   */
  getFilterImplementations(filterName: PluginFilter): string[] {
    const implementations: string[] = []

    for (const [pluginName, plugin] of this.plugins.entries()) {
      if (plugin.filters && plugin.filters[filterName]) {
        implementations.push(pluginName)
      }
    }

    return implementations
  }

  /**
   * Get statistics about filters
   */
  getStats() {
    const filterCounts: Record<PluginFilter, number> = {} as any

    for (const plugin of this.plugins.values()) {
      if (!plugin.filters) continue

      for (const filterName of Object.keys(plugin.filters) as PluginFilter[]) {
        filterCounts[filterName] = (filterCounts[filterName] || 0) + 1
      }
    }

    return {
      totalPlugins: this.plugins.size,
      filterCounts,
      availableFilters: Object.keys(filterCounts)
    }
  }
}

/**
 * Helper function to create a filter-enabled plugin
 */
export function createPluginWithFilters(config: {
  name: string
  version?: string
  filters: Partial<FluxStack.Plugin['filters']>
  [key: string]: any
}): Plugin {
  return {
    name: config.name,
    version: config.version || '1.0.0',
    filters: config.filters,
    ...config
  } as Plugin
}
