/**
 * Tests for Plugin Registry
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { PluginRegistry } from '../registry'
import type { Plugin } from '../types'

describe('PluginRegistry', () => {
  let registry: PluginRegistry

  beforeEach(() => {
    registry = new PluginRegistry()
  })

  describe('Plugin Registration', () => {
    it('should register a plugin successfully', () => {
      const plugin: Plugin = {
        name: 'test-plugin'
      }

      expect(() => registry.register(plugin)).not.toThrow()
      expect(registry.get('test-plugin')).toBe(plugin)
    })

    it('should throw error when registering duplicate plugin', () => {
      const plugin: Plugin = {
        name: 'duplicate-plugin'
      }

      registry.register(plugin)
      expect(() => registry.register(plugin)).toThrow("Plugin 'duplicate-plugin' is already registered")
    })

    it('should unregister a plugin successfully', () => {
      const plugin: Plugin = {
        name: 'removable-plugin'
      }

      registry.register(plugin)
      expect(registry.get('removable-plugin')).toBe(plugin)

      registry.unregister('removable-plugin')
      expect(registry.get('removable-plugin')).toBeUndefined()
    })

    it('should throw error when unregistering non-existent plugin', () => {
      expect(() => registry.unregister('non-existent')).toThrow("Plugin 'non-existent' is not registered")
    })
  })

  describe('Plugin Retrieval', () => {
    it('should get all registered plugins', () => {
      const plugin1: Plugin = { name: 'plugin-1' }
      const plugin2: Plugin = { name: 'plugin-2' }

      registry.register(plugin1)
      registry.register(plugin2)

      const allPlugins = registry.getAll()
      expect(allPlugins).toHaveLength(2)
      expect(allPlugins).toContain(plugin1)
      expect(allPlugins).toContain(plugin2)
    })

    it('should return undefined for non-existent plugin', () => {
      expect(registry.get('non-existent')).toBeUndefined()
    })
  })

  describe('Dependency Management', () => {
    it('should validate dependencies successfully', () => {
      const pluginA: Plugin = {
        name: 'plugin-a'
      }

      const pluginB: Plugin = {
        name: 'plugin-b',
        dependencies: ['plugin-a']
      }

      registry.register(pluginA)
      registry.register(pluginB)

      expect(() => registry.validateDependencies()).not.toThrow()
    })

    it('should throw error for missing dependencies', () => {
      const pluginWithMissingDep: Plugin = {
        name: 'plugin-with-missing-dep',
        dependencies: ['non-existent-plugin']
      }

      registry.register(pluginWithMissingDep)
      expect(() => registry.validateDependencies()).toThrow(
        "Plugin 'plugin-with-missing-dep' depends on 'non-existent-plugin' which is not registered"
      )
    })

    it('should detect circular dependencies', () => {
      const pluginA: Plugin = {
        name: 'plugin-a',
        dependencies: ['plugin-b']
      }

      const pluginB: Plugin = {
        name: 'plugin-b',
        dependencies: ['plugin-a']
      }

      registry.register(pluginA)
      
      expect(() => registry.register(pluginB)).toThrow('Circular dependency detected')
    })
  })

  describe('Load Order', () => {
    it('should determine correct load order based on dependencies', () => {
      const pluginA: Plugin = {
        name: 'plugin-a'
      }

      const pluginB: Plugin = {
        name: 'plugin-b',
        dependencies: ['plugin-a']
      }

      const pluginC: Plugin = {
        name: 'plugin-c',
        dependencies: ['plugin-b']
      }

      registry.register(pluginA)
      registry.register(pluginB)
      registry.register(pluginC)

      const loadOrder = registry.getLoadOrder()
      
      expect(loadOrder.indexOf('plugin-a')).toBeLessThan(loadOrder.indexOf('plugin-b'))
      expect(loadOrder.indexOf('plugin-b')).toBeLessThan(loadOrder.indexOf('plugin-c'))
    })

    it('should respect plugin priorities', () => {
      const lowPriorityPlugin: Plugin = {
        name: 'low-priority',
        priority: 1
      }

      const highPriorityPlugin: Plugin = {
        name: 'high-priority',
        priority: 10
      }

      registry.register(lowPriorityPlugin)
      registry.register(highPriorityPlugin)

      const loadOrder = registry.getLoadOrder()
      
      expect(loadOrder.indexOf('high-priority')).toBeLessThan(loadOrder.indexOf('low-priority'))
    })

    it('should handle plugins without priorities', () => {
      const pluginWithoutPriority: Plugin = {
        name: 'no-priority'
      }

      const pluginWithPriority: Plugin = {
        name: 'with-priority',
        priority: 5
      }

      registry.register(pluginWithoutPriority)
      registry.register(pluginWithPriority)

      const loadOrder = registry.getLoadOrder()
      
      expect(loadOrder.indexOf('with-priority')).toBeLessThan(loadOrder.indexOf('no-priority'))
    })
  })
})