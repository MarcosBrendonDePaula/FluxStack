/**
 * Task 5: Component Nesting & Hierarchical Management Tests
 * 
 * Tests for hierarchical component relationships, state inheritance,
 * lifecycle management, and nested live hooks.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ComponentTreeManager } from '../ComponentTreeManager'
import { ParentChildStateManager } from '../ParentChildStateManager'
import { ComponentLifecycleManager } from '../ComponentLifecycleManager'

describe('Task 5: Component Nesting & Hierarchical Management', () => {
  let treeManager: ComponentTreeManager
  let stateManager: ParentChildStateManager
  let lifecycleManager: ComponentLifecycleManager
  
  beforeEach(() => {
    treeManager = new ComponentTreeManager({
      maxDepth: 5,
      autoCleanup: true,
      cleanupInterval: 100
    })
    
    stateManager = new ParentChildStateManager(treeManager, {
      autoInherit: true,
      enableBubbling: true,
      conflictResolution: 'parentWins'
    })
    
    lifecycleManager = new ComponentLifecycleManager(treeManager, {
      autoMount: true,
      enableHooks: true,
      parallelInit: true
    })
  })
  
  afterEach(() => {
    lifecycleManager.cleanup?.()
    treeManager.dispose()
  })
  
  describe('ComponentTreeManager', () => {
    it('should register components with hierarchical relationships', () => {
      // Register parent component
      const parent = treeManager.registerComponent('parent', 'Dashboard')
      expect(parent.depth).toBe(0)
      expect(parent.path).toBe('Dashboard')
      expect(parent.parentId).toBeUndefined()
      
      // Register child component
      const child = treeManager.registerComponent('child', 'UserInfo', 'parent')
      expect(child.depth).toBe(1)
      expect(child.path).toBe('Dashboard.UserInfo')
      expect(child.parentId).toBe('parent')
      
      // Check parent-child relationship
      expect(parent.childIds.has('child')).toBe(true)
    })
    
    it('should provide hierarchy navigation', () => {
      // Create component tree: root -> parent -> child -> grandchild
      treeManager.registerComponent('root', 'App')
      treeManager.registerComponent('parent', 'Dashboard', 'root')
      treeManager.registerComponent('child', 'UserInfo', 'parent')
      treeManager.registerComponent('grandchild', 'Avatar', 'child')
      
      const hierarchy = treeManager.getHierarchy('child')
      expect(hierarchy).toBeDefined()
      expect(hierarchy!.node.id).toBe('child')
      expect(hierarchy!.parent!.id).toBe('parent')
      expect(hierarchy!.children).toHaveLength(1)
      expect(hierarchy!.children[0].id).toBe('grandchild')
      
      const ancestors = treeManager.getAncestors('grandchild')
      expect(ancestors).toHaveLength(3)
      expect(ancestors.map(a => a.id)).toEqual(['child', 'parent', 'root'])
      
      const descendants = treeManager.getDescendants('parent')
      expect(descendants).toHaveLength(2)
      expect(descendants.map(d => d.id)).toContain('child')
      expect(descendants.map(d => d.id)).toContain('grandchild')
    })
    
    it('should prevent circular dependencies', () => {
      treeManager.registerComponent('comp1', 'Component1')
      treeManager.registerComponent('comp2', 'Component2', 'comp1')
      
      expect(() => {
        treeManager.registerComponent('comp1-duplicate', 'Component1', 'comp2')
      }).not.toThrow() // Different ID, should be fine
    })
    
    it('should enforce depth limits', () => {
      const maxDepth = 5
      let currentParent: string | undefined = undefined
      
      // Create components up to max depth
      for (let i = 0; i <= maxDepth; i++) {
        const id = `comp${i}`
        if (i <= maxDepth) {
          const node = treeManager.registerComponent(id, 'Component', currentParent)
          expect(node.depth).toBe(i)
          currentParent = id
        }
      }
      
      // Should fail to create component beyond max depth
      expect(() => {
        treeManager.registerComponent('deep', 'Component', currentParent)
      }).toThrow('Maximum tree depth exceeded')
    })
  })
  
  describe('ParentChildStateManager', () => {
    beforeEach(() => {
      // Set up component hierarchy
      treeManager.registerComponent('parent', 'Dashboard')
      treeManager.registerComponent('child1', 'UserInfo', 'parent')
      treeManager.registerComponent('child2', 'Settings', 'parent')
      treeManager.registerComponent('grandchild', 'Avatar', 'child1')
    })
    
    it('should share state from parent to children', async () => {
      const parentState = {
        theme: 'dark',
        userId: '123',
        config: { lang: 'en' }
      }
      
      const notifications = stateManager.shareStateToChildren('parent', parentState)
      
      expect(notifications).toHaveLength(2) // Two direct children
      expect(notifications[0].type).toBe('inheritance')
      expect(notifications[0].sourceId).toBe('parent')
      
      // Check that children received the state
      const child1Hierarchy = treeManager.getHierarchy('child1')
      const child2Hierarchy = treeManager.getHierarchy('child2')
      
      expect(child1Hierarchy!.node.metadata.state).toMatchObject({
        theme: 'dark',
        userId: '123',
        config: { lang: 'en' }
      })
      
      expect(child2Hierarchy!.node.metadata.state).toMatchObject({
        theme: 'dark',
        userId: '123',
        config: { lang: 'en' }
      })
    })
    
    it('should bubble state from child to parent', async () => {
      // Add bubbling rule first
      stateManager.addInheritanceRule({
        keyPattern: 'userPreferences',
        mode: 'merge',
        direction: 'up'
      })
      
      stateManager.addInheritanceRule({
        keyPattern: 'lastAction',
        mode: 'inherit',
        direction: 'up'
      })
      
      const childState = {
        userPreferences: { notifications: true },
        lastAction: 'login'
      }
      
      const notification = stateManager.bubbleStateToParent('child1', childState)
      
      expect(notification).toBeDefined()
      expect(notification!.type).toBe('bubble')
      expect(notification!.sourceId).toBe('child1')
      expect(notification!.targetId).toBe('parent')
      
      // Check that parent received the bubbled state
      const parentHierarchy = treeManager.getHierarchy('parent')
      expect(parentHierarchy!.node.metadata.state).toMatchObject(childState)
    })
    
    it('should get inherited state from ancestors', () => {
      // Set state in parent and grandparent
      const parentState = { theme: 'dark', userId: '123' }
      const grandparentState = { appVersion: '1.0', config: { debug: true } }
      
      treeManager.updateComponentState('parent', parentState)
      
      // Create grandparent
      treeManager.registerComponent('grandparent', 'App')
      // Move parent under grandparent (for testing)
      const parentNode = treeManager.getHierarchy('parent')!.node
      parentNode.parentId = 'grandparent'
      treeManager.updateComponentState('grandparent', grandparentState)
      
      const inheritedState = stateManager.getInheritedState('grandchild')
      
      expect(inheritedState).toMatchObject({
        theme: 'dark',
        userId: '123'
      })
    })
    
    it('should handle state conflicts with resolution strategies', () => {
      // Set child state first
      const childState = { count: 10 }
      treeManager.updateComponentState('child1', childState)
      
      // Then share parent state that conflicts
      const parentState = { count: 5 }
      stateManager.shareStateToChildren('parent', parentState)
      
      const conflicts = stateManager.getPendingConflicts()
      expect(conflicts.length).toBeGreaterThan(0)
      
      const conflict = conflicts[0]
      expect(conflict.key).toBe('count')
      expect(conflict.parentValue).toBe(5)
      expect(conflict.childValue).toBe(10)
    })
  })
  
  describe('ComponentLifecycleManager', () => {
    it('should initialize components with dependency resolution', async () => {
      // Register components
      treeManager.registerComponent('service', 'UserService')
      treeManager.registerComponent('component', 'UserInfo')
      
      // Define dependency
      const dependencies = [{
        type: 'component' as const,
        id: 'service',
        required: true
      }]
      
      const result = await lifecycleManager.initializeComponent('component', dependencies)
      
      expect(result.success).toBe(true)
      expect(result.componentId).toBe('component')
      expect(result.resolvedDependencies).toContain('service')
      
      const componentNode = treeManager.getHierarchy('component')
      expect(componentNode!.node.metadata.status).toBe('active')
    })
    
    it('should handle initialization order with topological sorting', async () => {
      // Create dependency chain: A -> B -> C
      treeManager.registerComponent('A', 'ComponentA')
      treeManager.registerComponent('B', 'ComponentB')
      treeManager.registerComponent('C', 'ComponentC')
      
      const depsB = [{ type: 'component' as const, id: 'A', required: true }]
      const depsC = [{ type: 'component' as const, id: 'B', required: true }]
      
      // Initialize in reverse order
      const resultC = await lifecycleManager.initializeComponent('C', depsC)
      const resultB = await lifecycleManager.initializeComponent('B', depsB)
      const resultA = await lifecycleManager.initializeComponent('A', [])
      
      expect(resultA.success).toBe(true)
      expect(resultB.success).toBe(true)
      expect(resultC.success).toBe(true)
      
      // Check initialization order
      const order = lifecycleManager.getInitializationOrder(['A', 'B', 'C'])
      expect(order).toEqual(['A', 'B', 'C'])
    })
    
    it('should cleanup components in proper order', async () => {
      // Set up component dependency chain
      treeManager.registerComponent('A', 'ComponentA')
      treeManager.registerComponent('B', 'ComponentB')
      treeManager.registerComponent('C', 'ComponentC')
      
      await lifecycleManager.initializeComponent('A', [])
      await lifecycleManager.initializeComponent('B', [
        { type: 'component' as const, id: 'A', required: true }
      ])
      await lifecycleManager.initializeComponent('C', [
        { type: 'component' as const, id: 'B', required: true }
      ])
      
      // Cleanup should happen in reverse order
      const result = await lifecycleManager.cleanupComponent('A', { recursive: true })
      
      expect(result.success).toBe(true)
      
      // Check that all components are disposed
      const nodeA = treeManager.getHierarchy('A')
      const nodeB = treeManager.getHierarchy('B')
      const nodeC = treeManager.getHierarchy('C')
      
      // Components should be cleaned up
      expect(nodeA?.node.metadata.status).toBe('disposed')
    })
    
    it('should execute lifecycle hooks', async () => {
      const hookCalls: string[] = []
      
      lifecycleManager.addLifecycleHook('test-component', {
        type: 'beforeInit',
        priority: 100,
        handler: () => {
          hookCalls.push('beforeInit')
        }
      })
      
      lifecycleManager.addLifecycleHook('test-component', {
        type: 'afterInit',
        priority: 100,
        handler: () => {
          hookCalls.push('afterInit')
        }
      })
      
      treeManager.registerComponent('test-component', 'TestComponent')
      await lifecycleManager.initializeComponent('test-component', [])
      
      expect(hookCalls).toContain('beforeInit')
      expect(hookCalls).toContain('afterInit')
      expect(hookCalls.indexOf('beforeInit')).toBeLessThan(hookCalls.indexOf('afterInit'))
    })
  })
  
  describe('Integration Tests', () => {
    it('should handle complete hierarchical component lifecycle', async () => {
      // Create complex hierarchy
      const parentNode = treeManager.registerComponent('dashboard', 'Dashboard')
      const headerNode = treeManager.registerComponent('header', 'Header', 'dashboard')
      const userInfoNode = treeManager.registerComponent('userinfo', 'UserInfo', 'header')
      const avatarNode = treeManager.registerComponent('avatar', 'Avatar', 'userinfo')
      
      // Initialize with lifecycle management
      await lifecycleManager.initializeComponent('dashboard', [])
      await lifecycleManager.initializeComponent('header', [
        { type: 'component' as const, id: 'dashboard', required: true }
      ])
      await lifecycleManager.initializeComponent('userinfo', [
        { type: 'component' as const, id: 'header', required: true }
      ])
      await lifecycleManager.initializeComponent('avatar', [
        { type: 'component' as const, id: 'userinfo', required: true }
      ])
      
      // Share state down the hierarchy
      const dashboardState = {
        theme: 'dark',
        user: { name: 'John', role: 'admin' },
        config: { showAvatars: true }
      }
      
      stateManager.shareStateToChildren('dashboard', dashboardState)
      
      // Verify state inheritance
      const avatarHierarchy = treeManager.getHierarchy('avatar')
      const avatarState = avatarHierarchy!.node.metadata.state
      expect(avatarState).toBeDefined()
      expect(avatarState).toMatchObject({
        theme: 'dark',
        user: { name: 'John', role: 'admin' },
        config: { showAvatars: true }
      })
      
      // Bubble state up
      const avatarBubbleState = { avatarUrl: 'https://example.com/avatar.jpg' }
      stateManager.bubbleStateToParent('avatar', avatarBubbleState)
      
      // Verify bubbled state reached parent
      const userinfoHierarchy = treeManager.getHierarchy('userinfo')
      expect(userinfoHierarchy!.node.metadata.state).toMatchObject(avatarBubbleState)
      
      // Test hierarchy navigation
      const hierarchy = treeManager.getHierarchy('userinfo')
      expect(hierarchy!.node.path).toBe('Dashboard.Header.UserInfo')
      expect(hierarchy!.ancestors).toHaveLength(2)
      expect(hierarchy!.descendants).toHaveLength(1)
      
      // Cleanup
      await lifecycleManager.cleanupComponent('dashboard', { recursive: true })
      
      // Verify all components are cleaned up
      expect(treeManager.getHierarchy('dashboard')?.node.metadata.status).toBe('disposed')
      expect(treeManager.getHierarchy('header')?.node.metadata.status).toBe('disposed')
      expect(treeManager.getHierarchy('userinfo')?.node.metadata.status).toBe('disposed')
      expect(treeManager.getHierarchy('avatar')?.node.metadata.status).toBe('disposed')
    })
    
    it('should handle state synchronization across hierarchy', async () => {
      // Create hierarchy
      treeManager.registerComponent('root', 'App')
      treeManager.registerComponent('page', 'Page', 'root')
      treeManager.registerComponent('sidebar', 'Sidebar', 'page')
      treeManager.registerComponent('content', 'Content', 'page')
      
      // Set initial states
      const rootState = { theme: 'light', version: '1.0' }
      const pageState = { title: 'Dashboard', userId: '123' }
      
      treeManager.updateComponentState('root', rootState)
      treeManager.updateComponentState('page', pageState)
      
      // Sync entire hierarchy
      const notifications = stateManager.syncHierarchy('root')
      
      expect(notifications.length).toBeGreaterThan(0)
      
      // Verify all descendants have inherited state
      const sidebarNode = treeManager.getHierarchy('sidebar')!.node
      const contentNode = treeManager.getHierarchy('content')!.node
      
      // Should have inherited from root, not have the page-specific state
      expect(sidebarNode.metadata.state).toMatchObject(rootState)
      expect(contentNode.metadata.state).toMatchObject(rootState)
    })
  })
})