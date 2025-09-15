/**
 * Task 5: Component Nesting & Hierarchical Management - Simplified Tests
 * 
 * Simplified tests focusing on core functionality
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { ComponentTreeManager } from '../ComponentTreeManager'
import { ParentChildStateManager } from '../ParentChildStateManager'
import { ComponentLifecycleManager } from '../ComponentLifecycleManager'

describe('Task 5: Component Nesting & Hierarchical Management (Simplified)', () => {
  let treeManager: ComponentTreeManager
  let stateManager: ParentChildStateManager
  let lifecycleManager: ComponentLifecycleManager
  
  beforeEach(() => {
    treeManager = new ComponentTreeManager({
      maxDepth: 5,
      autoCleanup: false // Disable auto cleanup for predictable tests
    })
    
    stateManager = new ParentChildStateManager(treeManager, {
      autoInherit: true,
      enableBubbling: true,
      conflictResolution: 'parentWins'
    })
    
    lifecycleManager = new ComponentLifecycleManager(treeManager, {
      autoMount: true,
      enableHooks: true
    })
  })
  
  afterEach(() => {
    treeManager.dispose()
  })
  
  describe('ComponentTreeManager - Core Functionality', () => {
    it('should register and manage component hierarchy', () => {
      // Register components in hierarchy
      const parent = treeManager.registerComponent('parent', 'Dashboard')
      const child1 = treeManager.registerComponent('child1', 'UserInfo', 'parent')
      const child2 = treeManager.registerComponent('child2', 'Settings', 'parent')
      const grandchild = treeManager.registerComponent('grandchild', 'Avatar', 'child1')
      
      // Verify basic properties
      expect(parent.depth).toBe(0)
      expect(child1.depth).toBe(1)
      expect(grandchild.depth).toBe(2)
      
      // Verify paths
      expect(parent.path).toBe('Dashboard')
      expect(child1.path).toBe('Dashboard.UserInfo')
      expect(grandchild.path).toBe('Dashboard.UserInfo.Avatar')
      
      // Verify relationships
      expect(parent.childIds.has('child1')).toBe(true)
      expect(parent.childIds.has('child2')).toBe(true)
      expect(child1.childIds.has('grandchild')).toBe(true)
      expect(child1.parentId).toBe('parent')
      expect(grandchild.parentId).toBe('child1')
    })
    
    it('should provide hierarchy navigation', () => {
      // Build hierarchy
      treeManager.registerComponent('root', 'App')
      treeManager.registerComponent('dashboard', 'Dashboard', 'root')
      treeManager.registerComponent('sidebar', 'Sidebar', 'dashboard')
      treeManager.registerComponent('content', 'Content', 'dashboard')
      
      const hierarchy = treeManager.getHierarchy('dashboard')
      expect(hierarchy).toBeDefined()
      expect(hierarchy!.node.id).toBe('dashboard')
      expect(hierarchy!.parent!.id).toBe('root')
      expect(hierarchy!.children).toHaveLength(2)
      expect(hierarchy!.children.map(c => c.id)).toContain('sidebar')
      expect(hierarchy!.children.map(c => c.id)).toContain('content')
      
      // Test navigation methods
      const descendants = treeManager.getDescendants('dashboard')
      expect(descendants).toHaveLength(2)
      expect(descendants.map(d => d.id)).toContain('sidebar')
      expect(descendants.map(d => d.id)).toContain('content')
      
      const ancestors = treeManager.getAncestors('sidebar')
      expect(ancestors).toHaveLength(2)
      expect(ancestors[0].id).toBe('dashboard')
      expect(ancestors[1].id).toBe('root')
    })
    
    it('should handle component removal', () => {
      // Create hierarchy
      treeManager.registerComponent('parent', 'Parent')
      treeManager.registerComponent('child', 'Child', 'parent')
      treeManager.registerComponent('grandchild', 'Grandchild', 'child')
      
      // Remove parent (should remove all descendants)
      const removed = treeManager.unregisterComponent('parent')
      expect(removed).toBe(true)
      
      // Verify all components are removed
      expect(treeManager.getHierarchy('parent')).toBeNull()
      expect(treeManager.getHierarchy('child')).toBeNull()
      expect(treeManager.getHierarchy('grandchild')).toBeNull()
    })
    
    it('should prevent excessive depth', () => {
      let currentParent: string | undefined = undefined
      
      // Create components up to max depth (5)
      for (let i = 0; i <= 5; i++) {
        const id = `comp${i}`
        if (i <= 5) {
          const node = treeManager.registerComponent(id, 'Component', currentParent)
          expect(node.depth).toBe(i)
          currentParent = id
        }
      }
      
      // Attempt to exceed max depth should fail
      expect(() => {
        treeManager.registerComponent('comp6', 'Component', currentParent)
      }).toThrow('Maximum tree depth exceeded')
    })
    
    it('should provide tree statistics', () => {
      // Create diverse hierarchy
      treeManager.registerComponent('root1', 'App')
      treeManager.registerComponent('root2', 'App')
      treeManager.registerComponent('page1', 'Page', 'root1')
      treeManager.registerComponent('page2', 'Page', 'root1')
      treeManager.registerComponent('widget', 'Widget', 'page1')
      
      const stats = treeManager.getTreeStats()
      expect(stats.totalNodes).toBe(5)
      expect(stats.rootComponents).toBe(2)
      expect(stats.maxDepth).toBe(2)
      expect(stats.byType['App']).toBe(2)
      expect(stats.byType['Page']).toBe(2)
      expect(stats.byType['Widget']).toBe(1)
    })
  })
  
  describe('ParentChildStateManager - Core Functionality', () => {
    beforeEach(() => {
      // Set up test hierarchy
      treeManager.registerComponent('parent', 'Dashboard')
      treeManager.registerComponent('child1', 'UserInfo', 'parent')
      treeManager.registerComponent('child2', 'Settings', 'parent')
    })
    
    it('should support basic state sharing to children', () => {
      const parentState = {
        theme: 'dark',
        userId: 'user123'
      }
      
      // Share state to children
      const notifications = stateManager.shareStateToChildren('parent', parentState)
      
      // Should have notifications for both children
      expect(notifications.length).toBe(2)
      expect(notifications.every(n => n.type === 'inheritance')).toBe(true)
      expect(notifications.every(n => n.sourceId === 'parent')).toBe(true)
      
      // Verify children received state
      const child1 = treeManager.getHierarchy('child1')!.node
      const child2 = treeManager.getHierarchy('child2')!.node
      
      expect(child1.metadata.state).toBeDefined()
      expect(child2.metadata.state).toBeDefined()
      expect(child1.metadata.state).toMatchObject(parentState)
      expect(child2.metadata.state).toMatchObject(parentState)
    })
    
    it('should support inheritance rules', () => {
      // Add custom inheritance rule
      stateManager.addInheritanceRule({
        keyPattern: 'theme',
        mode: 'inherit',
        direction: 'down'
      })
      
      const rules = (stateManager as any).inheritanceRules
      expect(rules.some((rule: any) => rule.keyPattern === 'theme')).toBe(true)
      
      // Remove rule
      const removed = stateManager.removeInheritanceRule('theme')
      expect(removed).toBe(true)
    })
    
    it('should track state changes with notifications', () => {
      const notifications: any[] = []
      
      // Subscribe to changes
      const unsubscribe = stateManager.subscribe((notification) => {
        notifications.push(notification)
      })
      
      // Share state
      stateManager.shareStateToChildren('parent', { theme: 'light' })
      
      // Should have received notifications
      expect(notifications.length).toBeGreaterThan(0)
      expect(notifications[0].type).toBe('inheritance')
      
      unsubscribe()
    })
  })
  
  describe('ComponentLifecycleManager - Core Functionality', () => {
    it('should initialize components', async () => {
      treeManager.registerComponent('comp1', 'Component1')
      
      const result = await lifecycleManager.initializeComponent('comp1', [])
      
      expect(result.success).toBe(true)
      expect(result.componentId).toBe('comp1')
      expect(result.duration).toBeGreaterThan(0)
      
      const component = treeManager.getHierarchy('comp1')!.node
      expect(component.metadata.status).toBe('active')
    })
    
    it('should handle component dependencies', async () => {
      treeManager.registerComponent('service', 'Service')
      treeManager.registerComponent('consumer', 'Consumer')
      
      // Initialize service first
      await lifecycleManager.initializeComponent('service', [])
      
      // Initialize consumer with dependency
      const dependencies = [{
        type: 'component' as const,
        id: 'service',
        required: true
      }]
      
      const result = await lifecycleManager.initializeComponent('consumer', dependencies)
      
      expect(result.success).toBe(true)
      expect(result.resolvedDependencies).toContain('service')
    })
    
    it('should cleanup components', async () => {
      treeManager.registerComponent('comp1', 'Component1')
      
      // Initialize first
      await lifecycleManager.initializeComponent('comp1', [])
      
      // Then cleanup
      const result = await lifecycleManager.cleanupComponent('comp1')
      
      expect(result.success).toBe(true)
      expect(result.componentId).toBe('comp1')
      
      const component = treeManager.getHierarchy('comp1')!.node
      expect(component.metadata.status).toBe('disposed')
    })
    
    it('should provide lifecycle status', async () => {
      treeManager.registerComponent('comp1', 'Component1')
      treeManager.registerComponent('comp2', 'Component2')
      
      await lifecycleManager.initializeComponent('comp1', [])
      
      const status = lifecycleManager.getLifecycleStatus()
      
      expect(status['comp1']).toBeDefined()
      expect(status['comp1'].status).toBe('active')
      expect(status['comp1'].dependencies).toBe(0)
    })
    
    it('should handle lifecycle hooks', async () => {
      let hookExecuted = false
      
      lifecycleManager.addLifecycleHook('test-comp', {
        type: 'afterInit',
        priority: 100,
        handler: () => {
          hookExecuted = true
        }
      })
      
      treeManager.registerComponent('test-comp', 'TestComponent')
      await lifecycleManager.initializeComponent('test-comp', [])
      
      expect(hookExecuted).toBe(true)
    })
  })
  
  describe('Integration - Basic Scenarios', () => {
    it('should handle complete component lifecycle with hierarchy', async () => {
      // Create hierarchy
      const parent = treeManager.registerComponent('app', 'App')
      const page = treeManager.registerComponent('page', 'Page', 'app')
      const widget = treeManager.registerComponent('widget', 'Widget', 'page')
      
      // Initialize components
      await lifecycleManager.initializeComponent('app', [])
      await lifecycleManager.initializeComponent('page', [])
      await lifecycleManager.initializeComponent('widget', [])
      
      // All should be active
      expect(treeManager.getHierarchy('app')!.node.metadata.status).toBe('active')
      expect(treeManager.getHierarchy('page')!.node.metadata.status).toBe('active')
      expect(treeManager.getHierarchy('widget')!.node.metadata.status).toBe('active')
      
      // Share state down hierarchy
      const appState = { theme: 'dark', version: '1.0' }
      stateManager.shareStateToChildren('app', appState)
      
      // Widget should have inherited state
      const widgetNode = treeManager.getHierarchy('widget')!.node
      expect(widgetNode.metadata.state).toMatchObject(appState)
      
      // Cleanup from top
      await lifecycleManager.cleanupComponent('app', { recursive: true })
      
      // All should be disposed
      expect(treeManager.getHierarchy('app')!.node.metadata.status).toBe('disposed')
    })
    
    it('should maintain component isolation', () => {
      // Create two separate hierarchies
      treeManager.registerComponent('app1', 'App')
      treeManager.registerComponent('page1', 'Page', 'app1')
      
      treeManager.registerComponent('app2', 'App')
      treeManager.registerComponent('page2', 'Page', 'app2')
      
      // Update state in one hierarchy
      treeManager.updateComponentState('app1', { theme: 'dark' })
      
      // Other hierarchy should be unaffected
      const app2Node = treeManager.getHierarchy('app2')!.node
      expect(app2Node.metadata.state).toBeUndefined()
      
      // Share state in first hierarchy
      stateManager.shareStateToChildren('app1', { theme: 'dark' })
      
      // Second hierarchy still unaffected
      const page2Node = treeManager.getHierarchy('page2')!.node
      expect(page2Node.metadata.state).toBeUndefined()
    })
  })
})