/**
 * FluxLive System - Core Module Exports
 * 
 * Main entry point for the FluxLive system that enables React components
 * to communicate directly with backend server components through WebSockets
 * with hierarchical nesting and inter-component communication.
 */

// Core types
export * from './types'

// Component isolation and management
export { ComponentIsolationManager } from './ComponentIsolationManager'

// Component cleanup system
export { ComponentCleanupManager } from './ComponentCleanupManager'
export type { CleanupEvent, CleanupHook, CleanupConfig, CleanupStats } from './ComponentCleanupManager'

// Memory leak detection
export { MemoryLeakDetector } from './MemoryLeakDetector'
export type { 
  MemoryLeakType, 
  LeakSeverity, 
  MemoryLeak, 
  LeakDetectionConfig, 
  MemorySnapshot 
} from './MemoryLeakDetector'

// WebSocket communication system
export { WebSocketManager } from './WebSocketManager'
export type { 
  MessageType, 
  WebSocketMessage, 
  ConnectionState, 
  WebSocketConfig, 
  MessageHandler, 
  ConnectionEventHandler, 
  WebSocketStats 
} from './WebSocketManager'

// Live component state bridge
export { LiveComponentStateBridge } from './LiveComponentStateBridge'
export type { 
  StateOperation, 
  StateChange, 
  ConflictStrategy, 
  StateBridgeConfig, 
  StateSnapshot, 
  ConflictContext, 
  StateValidator, 
  ConflictResolver, 
  StateChangeListener 
} from './LiveComponentStateBridge'

// Event system for component communication
export { LiveComponentEventSystem } from './LiveComponentEventSystem'
export type { 
  EventType, 
  EventPriority, 
  EventScope, 
  LiveComponentEvent, 
  EventListener, 
  EventMiddleware, 
  EventFilter, 
  ScopeResolver, 
  EventSystemConfig, 
  EventMetrics, 
  EventSubscription 
} from './LiveComponentEventSystem'

// FluxStack plugin integration
export { fluxLivePlugin } from './FluxLivePlugin'
export type { FluxLiveConfig } from './FluxLivePlugin'

// React hooks for cleanup integration
export { 
  useComponentCleanup, 
  withComponentCleanup, 
  useErrorBoundaryCleanup, 
  useBatchCleanup 
} from './hooks/useComponentCleanup'
export type { 
  UseComponentCleanupOptions, 
  UseComponentCleanupResult 
} from './hooks/useComponentCleanup'

// React hooks for live components
export { 
  useLiveComponent, 
  withLiveComponent, 
  useLiveComponents,
  LiveComponentProvider,
  useLiveComponentContext
} from './hooks/useLiveComponent'
export type { 
  UseLiveComponentOptions, 
  UseLiveComponentResult 
} from './hooks/useLiveComponent'

// Improved React hooks with Task 2 features
export {
  useImprovedLive,
  withImprovedLive
} from './hooks/useImprovedLive'
export type {
  UseImprovedLiveOptions,
  UseImprovedLiveResult
} from './hooks/useImprovedLive'

// Utility functions
export * from './utils'

// Task 2: Improved State Synchronization
export { RequestTracker } from './RequestTracker'
export type { 
  RequestStatus,
  UpdateRequest,
  ConflictStrategy,
  RequestTrackerConfig
} from './RequestTracker'

export { OptimisticUpdateManager } from './OptimisticUpdateManager'
export type {
  OptimisticState,
  OptimisticUpdate,
  VisualIndicator,
  OptimisticUpdateConfig,
  OfflineUpdate
} from './OptimisticUpdateManager'

export { RetryManager } from './RetryManager'
export type {
  RetryStrategy,
  NetworkStatus,
  RetryAttempt,
  RetryConfig,
  NetworkCondition,
  RetryStats
} from './RetryManager'

// Task 3: Memory Management Enhancement
export { LiveComponentPool } from './LiveComponentPool'
export type {
  PoolConfig,
  PoolInstance,
  PoolMetrics,
  PoolHealth
} from './LiveComponentPool'

export { LivePerformanceMonitor } from './LivePerformanceMonitor'
export type {
  MemoryMonitorConfig,
  MemorySample,
  MemoryLeak,
  PerformanceAlert,
  InstanceInfo,
  PerformanceStats
} from './LivePerformanceMonitor'

export { AutomaticCleanupSystem } from './AutomaticCleanupSystem'
export type {
  CleanupSystemConfig,
  CleanupTarget,
  CleanupResult,
  CleanupStats,
  BrowserLifecycleEvent
} from './AutomaticCleanupSystem'

// Task 4: Zustand Integration
export { createLiveComponentsSlice } from './zustand/LiveComponentsSlice'
export type {
  ComponentStateEntry,
  GlobalEvent,
  GlobalPerformanceMetrics,
  ConflictResolutionStrategy,
  PersistenceConfig,
  LiveComponentsSliceState,
  LiveComponentsSliceActions,
  LiveComponentsSlice
} from './zustand/LiveComponentsSlice'

export { StateConflictResolver } from './StateConflictResolver'
export type {
  ConflictStrategy,
  ConflictSeverity,
  ConflictDetectionConfig,
  StateConflict,
  ResolutionPolicy,
  CustomResolverFunction,
  ResolverContext,
  ConflictResolverConfig,
  ConflictMetrics
} from './StateConflictResolver'

export { GlobalStateDebugger } from './GlobalStateDebugger'
export type {
  DebugLogEntry,
  StateChangeEntry,
  StateSnapshot,
  DebugConfig,
  ComponentInspectionData,
  DetectedIssue
} from './GlobalStateDebugger'

// Enhanced hooks with Zustand integration
export {
  useEnhancedLive,
  withEnhancedLive,
  useGlobalLiveStore,
  useGlobalLiveState
} from './hooks/useEnhancedLive'
export type {
  UseEnhancedLiveOptions,
  UseEnhancedLiveResult,
  GlobalStateSelector,
  GlobalStateUpdater
} from './hooks/useEnhancedLive'

// Task 5: Component Nesting & Hierarchical Management
export { ComponentTreeManager } from './ComponentTreeManager'
export type {
  ComponentNode,
  ComponentHierarchy,
  ComponentTreeConfig
} from './ComponentTreeManager'

export { ParentChildStateManager } from './ParentChildStateManager'
export type {
  StateInheritanceRule,
  StateInheritanceContext,
  StateConflict,
  StateChangeNotification,
  StateChangeListener,
  ParentChildStateConfig
} from './ParentChildStateManager'

export { ComponentLifecycleManager } from './ComponentLifecycleManager'
export type {
  ComponentDependency,
  DependencyContext,
  LifecycleHook,
  LifecycleContext,
  InitializationResult,
  CleanupResult,
  LifecycleConfig
} from './ComponentLifecycleManager'

// Nested Live hooks with hierarchical features
export {
  useNestedLive,
  withNestedLive,
  componentTreeManager,
  parentChildStateManager,
  componentLifecycleManager
} from './hooks/useNestedLive'
export type {
  UseNestedLiveOptions,
  UseNestedLiveResult
} from './hooks/useNestedLive'

// Version information
export const FLUXLIVE_VERSION = '2.4.0'