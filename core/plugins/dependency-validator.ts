/**
 * Enhanced Dependency Validator
 * Provides detailed validation with helpful suggestions
 */

import type { FluxStack } from "./types"
import type { Logger } from "../utils/logger"
import { FluxStackError } from "../utils/errors"

type Plugin = FluxStack.Plugin

export interface DependencyError {
  type: 'MISSING_DEPENDENCY' | 'VERSION_MISMATCH' | 'CIRCULAR_DEPENDENCY' | 'INCOMPATIBLE_VERSION'
  plugin: string
  dependency?: string
  message: string
  severity: 'error' | 'warning'
}

export interface DependencyWarning {
  type: 'DEPRECATED' | 'PEER_DEPENDENCY' | 'OPTIONAL_MISSING'
  plugin: string
  dependency?: string
  message: string
}

export interface DependencyValidationResult {
  valid: boolean
  errors: DependencyError[]
  warnings: DependencyWarning[]
  suggestions: string[]
  graph: DependencyGraph
}

export interface DependencyGraph {
  nodes: Array<{
    name: string
    version?: string
    dependencies: string[]
  }>
  edges: Array<{
    from: string
    to: string
    required: boolean
  }>
}

export class PluginDependencyValidator {
  private logger?: Logger

  constructor(logger?: Logger) {
    this.logger = logger
  }

  /**
   * Validate all plugin dependencies with detailed error reporting
   */
  validate(plugins: Plugin[]): DependencyValidationResult {
    const result: DependencyValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      suggestions: [],
      graph: this.buildDependencyGraph(plugins)
    }

    // 1. Check for missing dependencies
    this.validateMissingDependencies(plugins, result)

    // 2. Check for circular dependencies
    this.validateCircularDependencies(plugins, result)

    // 3. Check for version conflicts (if versions are specified)
    this.validateVersionConflicts(plugins, result)

    // 4. Generate helpful suggestions
    this.generateSuggestions(plugins, result)

    result.valid = result.errors.length === 0

    return result
  }

  /**
   * Check for missing dependencies
   */
  private validateMissingDependencies(
    plugins: Plugin[],
    result: DependencyValidationResult
  ): void {
    const pluginMap = new Map(plugins.map(p => [p.name, p]))

    for (const plugin of plugins) {
      if (!plugin.dependencies) continue

      for (const depName of plugin.dependencies) {
        if (!pluginMap.has(depName)) {
          result.errors.push({
            type: 'MISSING_DEPENDENCY',
            plugin: plugin.name,
            dependency: depName,
            message: `Plugin '${plugin.name}' depends on '${depName}' which is not installed`,
            severity: 'error'
          })

          // Try to suggest similar plugins
          const similar = this.findSimilarPlugins(depName, plugins)
          if (similar.length > 0) {
            result.suggestions.push(
              `Did you mean one of these? ${similar.map(p => `'${p}'`).join(', ')}`
            )
          } else {
            result.suggestions.push(
              `Try installing: bun add fluxstack-plugin-${depName}`
            )
          }
        }
      }
    }
  }

  /**
   * Check for circular dependencies
   */
  private validateCircularDependencies(
    plugins: Plugin[],
    result: DependencyValidationResult
  ): void {
    const visited = new Set<string>()
    const visiting = new Set<string>()
    const pluginMap = new Map(plugins.map(p => [p.name, p]))

    const visit = (pluginName: string, path: string[]): void => {
      if (visiting.has(pluginName)) {
        // Found a cycle
        const cycle = [...path, pluginName]
        const cycleStr = cycle.join(' → ')

        result.errors.push({
          type: 'CIRCULAR_DEPENDENCY',
          plugin: pluginName,
          message: `Circular dependency detected: ${cycleStr}`,
          severity: 'error'
        })

        result.suggestions.push(
          `Break the circular dependency by removing one of these dependencies: ${cycle.map(p => `'${p}'`).join(', ')}`
        )
        return
      }

      if (visited.has(pluginName)) {
        return
      }

      visiting.add(pluginName)

      const plugin = pluginMap.get(pluginName)
      if (plugin?.dependencies) {
        for (const depName of plugin.dependencies) {
          if (pluginMap.has(depName)) {
            visit(depName, [...path, pluginName])
          }
        }
      }

      visiting.delete(pluginName)
      visited.add(pluginName)
    }

    for (const plugin of plugins) {
      visit(plugin.name, [])
    }
  }

  /**
   * Check for version conflicts
   */
  private validateVersionConflicts(
    plugins: Plugin[],
    result: DependencyValidationResult
  ): void {
    // Group plugins by name and check for version conflicts
    const versionMap = new Map<string, Set<string>>()

    for (const plugin of plugins) {
      if (plugin.version) {
        if (!versionMap.has(plugin.name)) {
          versionMap.set(plugin.name, new Set())
        }
        versionMap.get(plugin.name)!.add(plugin.version)
      }
    }

    // Check for duplicate plugins with different versions
    for (const [name, versions] of versionMap.entries()) {
      if (versions.size > 1) {
        result.errors.push({
          type: 'VERSION_MISMATCH',
          plugin: name,
          message: `Multiple versions of plugin '${name}' detected: ${Array.from(versions).join(', ')}`,
          severity: 'error'
        })

        result.suggestions.push(
          `Uninstall conflicting versions and keep only one version of '${name}'`
        )
      }
    }
  }

  /**
   * Generate helpful suggestions
   */
  private generateSuggestions(
    plugins: Plugin[],
    result: DependencyValidationResult
  ): void {
    // If there are errors, provide general guidance
    if (result.errors.length > 0) {
      result.suggestions.push(
        `Run 'bun run plugin:check' to see detailed dependency information`
      )
    }

    // Suggest running dependency installer
    const hasMissingDeps = result.errors.some(e => e.type === 'MISSING_DEPENDENCY')
    if (hasMissingDeps) {
      result.suggestions.push(
        `Run 'bun run plugin:install' to automatically install missing dependencies`
      )
    }
  }

  /**
   * Find plugins with similar names (Levenshtein distance)
   */
  private findSimilarPlugins(target: string, plugins: Plugin[]): string[] {
    const threshold = 3 // Maximum edit distance

    return plugins
      .map(p => ({
        name: p.name,
        distance: this.levenshteinDistance(target.toLowerCase(), p.name.toLowerCase())
      }))
      .filter(p => p.distance <= threshold)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3)
      .map(p => p.name)
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = []

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i]
    }

    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          )
        }
      }
    }

    return matrix[b.length][a.length]
  }

  /**
   * Build dependency graph for visualization
   */
  private buildDependencyGraph(plugins: Plugin[]): DependencyGraph {
    const nodes = plugins.map(p => ({
      name: p.name,
      version: p.version,
      dependencies: p.dependencies || []
    }))

    const edges: Array<{ from: string; to: string; required: boolean }> = []

    for (const plugin of plugins) {
      if (!plugin.dependencies) continue

      for (const depName of plugin.dependencies) {
        edges.push({
          from: plugin.name,
          to: depName,
          required: true
        })
      }
    }

    return { nodes, edges }
  }

  /**
   * Format validation result as human-readable string
   */
  formatResult(result: DependencyValidationResult): string {
    const lines: string[] = []

    if (result.valid) {
      lines.push('✅ All plugin dependencies are valid')
      return lines.join('\n')
    }

    lines.push('❌ Plugin dependency validation failed\n')

    // Errors
    if (result.errors.length > 0) {
      lines.push('Errors:')
      for (const error of result.errors) {
        lines.push(`  • [${error.type}] ${error.message}`)
      }
      lines.push('')
    }

    // Warnings
    if (result.warnings.length > 0) {
      lines.push('Warnings:')
      for (const warning of result.warnings) {
        lines.push(`  • [${warning.type}] ${warning.message}`)
      }
      lines.push('')
    }

    // Suggestions
    if (result.suggestions.length > 0) {
      lines.push('Suggestions:')
      for (const suggestion of result.suggestions) {
        lines.push(`  💡 ${suggestion}`)
      }
    }

    return lines.join('\n')
  }

  /**
   * Get topological sort order (dependency-first)
   */
  getLoadOrder(plugins: Plugin[]): string[] {
    const visited = new Set<string>()
    const order: string[] = []
    const pluginMap = new Map(plugins.map(p => [p.name, p]))

    const visit = (pluginName: string, visiting: Set<string> = new Set()): void => {
      if (visited.has(pluginName)) {
        return
      }

      if (visiting.has(pluginName)) {
        throw new FluxStackError(
          `Circular dependency detected involving plugin '${pluginName}'`,
          'CIRCULAR_DEPENDENCY',
          400
        )
      }

      visiting.add(pluginName)

      const plugin = pluginMap.get(pluginName)
      if (plugin?.dependencies) {
        for (const depName of plugin.dependencies) {
          if (pluginMap.has(depName)) {
            visit(depName, visiting)
          }
        }
      }

      visiting.delete(pluginName)
      visited.add(pluginName)
      order.push(pluginName)
    }

    for (const plugin of plugins) {
      visit(plugin.name)
    }

    return order
  }
}
