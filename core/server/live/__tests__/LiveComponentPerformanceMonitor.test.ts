// 🧪 LiveComponentPerformanceMonitor Tests

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { LiveComponentPerformanceMonitor } from '../LiveComponentPerformanceMonitor'

describe('LiveComponentPerformanceMonitor', () => {
  let monitor: LiveComponentPerformanceMonitor
  const componentId = 'test-component-1'
  const componentName = 'TestComponent'

  beforeEach(() => {
    monitor = new LiveComponentPerformanceMonitor({
      enabled: true,
      sampleRate: 1.0,
      renderTimeThreshold: 100,
      memoryThreshold: 50 * 1024 * 1024,
      actionTimeThreshold: 1000,
      dashboardUpdateInterval: 1000
    })
    
    monitor.initializeComponent(componentId, componentName)
  })

  afterEach(() => {
    monitor.shutdown()
  })

  describe('Component Initialization', () => {
    it('should initialize component metrics', () => {
      const metrics = monitor.getComponentMetrics(componentId)
      
      expect(metrics).toBeTruthy()
      expect(metrics?.componentId).toBe(componentId)
      expect(metrics?.componentName).toBe(componentName)
      expect(metrics?.renderMetrics.totalRenders).toBe(0)
      expect(metrics?.actionMetrics.totalActions).toBe(0)
    })

    it('should not initialize when disabled', () => {
      const disabledMonitor = new LiveComponentPerformanceMonitor({ enabled: false })
      disabledMonitor.initializeComponent('disabled-component', 'DisabledComponent')
      
      const metrics = disabledMonitor.getComponentMetrics('disabled-component')
      expect(metrics).toBeNull()
      
      disabledMonitor.shutdown()
    })
  })

  describe('Render Performance Tracking', () => {
    it('should record render time', () => {
      monitor.recordRenderTime(componentId, 50)
      
      const metrics = monitor.getComponentMetrics(componentId)
      expect(metrics?.renderMetrics.totalRenders).toBe(1)
      expect(metrics?.renderMetrics.lastRenderTime).toBe(50)
      expect(metrics?.renderMetrics.averageRenderTime).toBe(50)
      expect(metrics?.renderMetrics.minRenderTime).toBe(50)
      expect(metrics?.renderMetrics.maxRenderTime).toBe(50)
    })

    it('should track multiple renders and calculate averages', () => {
      monitor.recordRenderTime(componentId, 30)
      monitor.recordRenderTime(componentId, 70)
      monitor.recordRenderTime(componentId, 50)
      
      const metrics = monitor.getComponentMetrics(componentId)
      expect(metrics?.renderMetrics.totalRenders).toBe(3)
      expect(metrics?.renderMetrics.averageRenderTime).toBe(50)
      expect(metrics?.renderMetrics.minRenderTime).toBe(30)
      expect(metrics?.renderMetrics.maxRenderTime).toBe(70)
    })

    it('should detect slow renders', () => {
      monitor.recordRenderTime(componentId, 150) // Above threshold of 100ms
      
      const metrics = monitor.getComponentMetrics(componentId)
      expect(metrics?.renderMetrics.slowRenderCount).toBe(1)
    })

    it('should record render errors', () => {
      const error = new Error('Render failed')
      monitor.recordRenderTime(componentId, 0, error)
      
      const metrics = monitor.getComponentMetrics(componentId)
      expect(metrics?.renderMetrics.renderErrorCount).toBe(1)
    })

    it('should maintain render time history', () => {
      for (let i = 0; i < 5; i++) {
        monitor.recordRenderTime(componentId, i * 10)
      }
      
      const metrics = monitor.getComponentMetrics(componentId)
      expect(metrics?.renderMetrics.renderTimeHistory).toHaveLength(5)
      expect(metrics?.renderMetrics.renderTimeHistory).toEqual([0, 10, 20, 30, 40])
    })
  })

  describe('Action Performance Tracking', () => {
    it('should record action time', () => {
      monitor.recordActionTime(componentId, 'testAction', 200)
      
      const metrics = monitor.getComponentMetrics(componentId)
      expect(metrics?.actionMetrics.totalActions).toBe(1)
      expect(metrics?.actionMetrics.averageActionTime).toBe(200)
      expect(metrics?.actionMetrics.actionsByType.testAction).toBeTruthy()
      expect(metrics?.actionMetrics.actionsByType.testAction.count).toBe(1)
      expect(metrics?.actionMetrics.actionsByType.testAction.averageTime).toBe(200)
    })

    it('should track multiple action types', () => {
      monitor.recordActionTime(componentId, 'action1', 100)
      monitor.recordActionTime(componentId, 'action2', 200)
      monitor.recordActionTime(componentId, 'action1', 150)
      
      const metrics = monitor.getComponentMetrics(componentId)
      expect(metrics?.actionMetrics.totalActions).toBe(3)
      expect(metrics?.actionMetrics.actionsByType.action1.count).toBe(2)
      expect(metrics?.actionMetrics.actionsByType.action2.count).toBe(1)
      expect(metrics?.actionMetrics.actionsByType.action1.averageTime).toBe(125)
    })

    it('should record action errors', () => {
      const error = new Error('Action failed')
      monitor.recordActionTime(componentId, 'failingAction', 0, error)
      
      const metrics = monitor.getComponentMetrics(componentId)
      expect(metrics?.actionMetrics.failedActions).toBe(1)
      expect(metrics?.actionMetrics.actionsByType.failingAction.errorCount).toBe(1)
    })

    it('should detect slow actions', () => {
      monitor.recordActionTime(componentId, 'slowAction', 1500) // Above threshold of 1000ms
      
      const alerts = monitor.getComponentAlerts(componentId)
      const slowActionAlert = alerts.find(alert => 
        alert.category === 'action' && alert.message.includes('slowAction')
      )
      expect(slowActionAlert).toBeTruthy()
    })
  })

  describe('Memory Usage Tracking', () => {
    it('should record memory usage', () => {
      const memoryUsage = 10 * 1024 * 1024 // 10MB
      monitor.recordMemoryUsage(componentId, memoryUsage)
      
      const metrics = monitor.getComponentMetrics(componentId)
      expect(metrics?.memoryMetrics.currentUsage).toBe(memoryUsage)
      expect(metrics?.memoryMetrics.peakUsage).toBe(memoryUsage)
      expect(metrics?.memoryMetrics.averageUsage).toBe(memoryUsage)
    })

    it('should track peak memory usage', () => {
      monitor.recordMemoryUsage(componentId, 10 * 1024 * 1024)
      monitor.recordMemoryUsage(componentId, 20 * 1024 * 1024)
      monitor.recordMemoryUsage(componentId, 15 * 1024 * 1024)
      
      const metrics = monitor.getComponentMetrics(componentId)
      expect(metrics?.memoryMetrics.peakUsage).toBe(20 * 1024 * 1024)
      expect(metrics?.memoryMetrics.currentUsage).toBe(15 * 1024 * 1024)
    })

    it('should track state size', () => {
      const stateSize = 5000
      monitor.recordMemoryUsage(componentId, 10 * 1024 * 1024, stateSize)
      
      const metrics = monitor.getComponentMetrics(componentId)
      expect(metrics?.memoryMetrics.stateSize).toBe(stateSize)
      expect(metrics?.memoryMetrics.stateSizeHistory).toContain(stateSize)
    })

    it('should detect high memory usage', () => {
      const highMemoryUsage = 60 * 1024 * 1024 // Above threshold of 50MB
      monitor.recordMemoryUsage(componentId, highMemoryUsage)
      
      const alerts = monitor.getComponentAlerts(componentId)
      const memoryAlert = alerts.find(alert => 
        alert.category === 'memory' && alert.type === 'critical'
      )
      expect(memoryAlert).toBeTruthy()
    })
  })

  describe('Network Activity Tracking', () => {
    it('should record network activity', () => {
      monitor.recordNetworkActivity(componentId, 'sent', 1024, 50)
      monitor.recordNetworkActivity(componentId, 'received', 2048, 75)
      
      const metrics = monitor.getComponentMetrics(componentId)
      expect(metrics?.networkMetrics.messagesSent).toBe(1)
      expect(metrics?.networkMetrics.messagesReceived).toBe(1)
      expect(metrics?.networkMetrics.bytesTransferred).toBe(3072)
      expect(metrics?.networkMetrics.averageLatency).toBe(62.5)
    })
  })

  describe('User Interaction Tracking', () => {
    it('should record user interactions', () => {
      monitor.recordUserInteraction(componentId, 'click', 100)
      monitor.recordUserInteraction(componentId, 'input', 200)
      monitor.recordUserInteraction(componentId, 'submit', 300)
      
      const metrics = monitor.getComponentMetrics(componentId)
      expect(metrics?.userInteractionMetrics.clickCount).toBe(1)
      expect(metrics?.userInteractionMetrics.inputChangeCount).toBe(1)
      expect(metrics?.userInteractionMetrics.formSubmissions).toBe(1)
      expect(metrics?.userInteractionMetrics.averageInteractionTime).toBe(200)
    })

    it('should calculate engagement score', () => {
      // Add various interactions
      monitor.recordUserInteraction(componentId, 'click', 100)
      monitor.recordUserInteraction(componentId, 'click', 150)
      monitor.recordUserInteraction(componentId, 'input', 200)
      monitor.recordUserInteraction(componentId, 'submit', 300)
      
      const metrics = monitor.getComponentMetrics(componentId)
      expect(metrics?.userInteractionMetrics.engagementScore).toBeGreaterThan(0)
    })
  })

  describe('Alert System', () => {
    it('should create alerts for performance issues', () => {
      // Trigger a slow render alert
      monitor.recordRenderTime(componentId, 250) // Well above threshold
      
      const alerts = monitor.getComponentAlerts(componentId)
      expect(alerts.length).toBeGreaterThan(0)
      
      const renderAlert = alerts.find(alert => alert.category === 'render')
      expect(renderAlert).toBeTruthy()
      expect(renderAlert?.type).toBe('warning')
    })

    it('should resolve alerts', () => {
      // Create an alert
      monitor.recordRenderTime(componentId, 250)
      
      const alerts = monitor.getComponentAlerts(componentId)
      const alert = alerts[0]
      
      const resolved = monitor.resolveAlert(alert.id)
      expect(resolved).toBe(true)
      expect(alert.resolved).toBe(true)
    })

    it('should respect alert cooldown', () => {
      // Create multiple slow renders quickly
      monitor.recordRenderTime(componentId, 250)
      monitor.recordRenderTime(componentId, 260)
      monitor.recordRenderTime(componentId, 270)
      
      const alerts = monitor.getComponentAlerts(componentId)
      // Should only have one alert due to cooldown
      const renderAlerts = alerts.filter(alert => alert.category === 'render')
      expect(renderAlerts.length).toBe(1)
    })
  })

  describe('Optimization Suggestions', () => {
    it('should generate suggestions for slow renders', () => {
      // Create consistently slow renders
      for (let i = 0; i < 5; i++) {
        monitor.recordRenderTime(componentId, 90) // Just below threshold but consistently slow
      }
      
      const suggestions = monitor.getComponentSuggestions(componentId)
      const renderSuggestion = suggestions.find(s => s.type === 'render')
      expect(renderSuggestion).toBeTruthy()
    })

    it('should generate suggestions for memory issues', () => {
      // Create large state size
      monitor.recordMemoryUsage(componentId, 30 * 1024 * 1024, 150 * 1024) // 150KB state
      
      const suggestions = monitor.getComponentSuggestions(componentId)
      const memorySuggestion = suggestions.find(s => s.type === 'memory')
      expect(memorySuggestion).toBeTruthy()
    })
  })

  describe('Dashboard Generation', () => {
    beforeEach(() => {
      // Add some test data
      monitor.recordRenderTime(componentId, 50)
      monitor.recordActionTime(componentId, 'testAction', 200)
      monitor.recordMemoryUsage(componentId, 20 * 1024 * 1024)
    })

    it('should generate performance dashboard', () => {
      const dashboard = monitor.generateDashboard()
      
      expect(dashboard).toHaveProperty('overview')
      expect(dashboard).toHaveProperty('topPerformers')
      expect(dashboard).toHaveProperty('worstPerformers')
      expect(dashboard).toHaveProperty('recentAlerts')
      expect(dashboard).toHaveProperty('suggestions')
      expect(dashboard).toHaveProperty('trends')
      
      expect(dashboard.overview.totalComponents).toBe(1)
      expect(dashboard.overview.healthyComponents).toBeGreaterThanOrEqual(0)
    })

    it('should identify top and worst performers', () => {
      // Add another component with different performance
      const componentId2 = 'slow-component'
      monitor.initializeComponent(componentId2, 'SlowComponent')
      monitor.recordRenderTime(componentId2, 200) // Slower
      
      const dashboard = monitor.generateDashboard()
      
      expect(dashboard.topPerformers.length).toBeGreaterThan(0)
      expect(dashboard.worstPerformers.length).toBeGreaterThan(0)
    })
  })

  describe('Component Removal', () => {
    it('should remove component from monitoring', () => {
      const metrics = monitor.getComponentMetrics(componentId)
      expect(metrics).toBeTruthy()
      
      monitor.removeComponent(componentId)
      
      const metricsAfterRemoval = monitor.getComponentMetrics(componentId)
      expect(metricsAfterRemoval).toBeNull()
    })
  })

  describe('Sampling', () => {
    it('should respect sample rate', () => {
      const sampledMonitor = new LiveComponentPerformanceMonitor({
        enabled: true,
        sampleRate: 0.0 // Never sample
      })
      
      sampledMonitor.initializeComponent(componentId, componentName)
      sampledMonitor.recordRenderTime(componentId, 50)
      
      const metrics = sampledMonitor.getComponentMetrics(componentId)
      // Should still have metrics object but no recorded data due to sampling
      expect(metrics).toBeTruthy()
      
      sampledMonitor.shutdown()
    })
  })
})