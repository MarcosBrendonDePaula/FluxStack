/**
 * useComponentCleanup Hook
 * 
 * React hook for integrating component cleanup with React lifecycle.
 * Provides automatic cleanup on component unmount, error boundaries,
 * and manual cleanup triggers.
 */

import React, { useEffect, useRef, useCallback } from 'react'
import { ComponentCleanupManager, CleanupHook, CleanupEvent } from '../ComponentCleanupManager'
import type { ComponentIdentity } from '../types'

/**
 * Hook options for component cleanup
 */
export interface UseComponentCleanupOptions {
  /** Component identity */
  componentIdentity: ComponentIdentity
  
  /** WebSocket connection for disconnect cleanup */
  websocket?: WebSocket
  
  /** Custom cleanup hooks */
  cleanupHooks?: CleanupHook[]
  
  /** Enable automatic unmount cleanup */
  enableUnmountCleanup?: boolean
  
  /** Enable WebSocket disconnect cleanup */
  enableWebSocketCleanup?: boolean
  
  /** Enable activity tracking */
  enableActivityTracking?: boolean
  
  /** Activity tracking interval (ms) */
  activityInterval?: number
  
  /** Custom cleanup event handlers */
  onCleanup?: (event: CleanupEvent) => void
  
  /** Error handler for cleanup failures */
  onCleanupError?: (error: Error, event: CleanupEvent) => void
}

/**
 * Hook return value
 */
export interface UseComponentCleanupResult {
  /** Manual cleanup trigger */
  cleanup: (event?: CleanupEvent) => Promise<void>
  
  /** Add cleanup hook dynamically */
  addCleanupHook: (hook: CleanupHook) => () => void
  
  /** Update component activity */
  updateActivity: () => void
  
  /** Check if component is registered for cleanup */
  isRegistered: boolean
  
  /** Cleanup manager instance */
  cleanupManager: ComponentCleanupManager
}

/**
 * React hook for component cleanup integration
 */
export function useComponentCleanup(
  options: UseComponentCleanupOptions
): UseComponentCleanupResult {
  const {
    componentIdentity,
    websocket,
    cleanupHooks = [],
    enableUnmountCleanup = true,
    enableWebSocketCleanup = true,
    enableActivityTracking = true,
    activityInterval = 30000, // 30 seconds
    onCleanup,
    onCleanupError
  } = options
  
  // Get cleanup manager instance
  const cleanupManager = ComponentCleanupManager.getInstance()
  
  // Track registration status
  const isRegisteredRef = useRef(false)
  const cleanupHooksRef = useRef<Set<() => void>>(new Set())
  const activityIntervalRef = useRef<NodeJS.Timeout | null>(null)
  
  // Register component on mount
  useEffect(() => {
    if (!isRegisteredRef.current) {
      cleanupManager.registerComponent(
        componentIdentity.componentId,
        websocket,
        cleanupHooks
      )
      
      isRegisteredRef.current = true
      
      // Setup activity tracking
      if (enableActivityTracking) {
        setupActivityTracking()
      }
    }
    
    return () => {
      // Cleanup on unmount
      if (enableUnmountCleanup && isRegisteredRef.current) {
        handleCleanup('component_unmount')
      }
      
      // Clear activity tracking
      if (activityIntervalRef.current) {
        clearInterval(activityIntervalRef.current)
        activityIntervalRef.current = null
      }
      
      // Remove all dynamic cleanup hooks
      cleanupHooksRef.current.forEach(removeHook => removeHook())
      cleanupHooksRef.current.clear()
      
      isRegisteredRef.current = false
    }
  }, [componentIdentity.componentId])
  
  // Setup WebSocket cleanup when websocket changes
  useEffect(() => {
    if (websocket && enableWebSocketCleanup && isRegisteredRef.current) {
      const handleWebSocketClose = () => {
        handleCleanup('websocket_disconnect')
      }
      
      websocket.addEventListener('close', handleWebSocketClose)
      websocket.addEventListener('error', handleWebSocketClose)
      
      return () => {
        websocket.removeEventListener('close', handleWebSocketClose)
        websocket.removeEventListener('error', handleWebSocketClose)
      }
    }
  }, [websocket])
  
  // Manual cleanup function
  const cleanup = useCallback(async (event: CleanupEvent = 'manual_cleanup') => {
    await handleCleanup(event)
  }, [componentIdentity.componentId])
  
  // Add cleanup hook dynamically
  const addCleanupHook = useCallback((hook: CleanupHook): (() => void) => {
    if (!isRegisteredRef.current) {
      throw new Error('Component not registered for cleanup')
    }
    
    const removeHook = cleanupManager.addComponentCleanupHook(
      componentIdentity.componentId,
      hook
    )
    
    cleanupHooksRef.current.add(removeHook)
    
    return () => {
      removeHook()
      cleanupHooksRef.current.delete(removeHook)
    }
  }, [componentIdentity.componentId])
  
  // Update activity timestamp
  const updateActivity = useCallback(() => {
    if (isRegisteredRef.current) {
      cleanupManager.updateComponentActivity(componentIdentity.componentId)
    }
  }, [componentIdentity.componentId])
  
  // Handle cleanup with error handling and callbacks
  const handleCleanup = async (event: CleanupEvent) => {
    try {
      await cleanupManager.cleanupComponent(componentIdentity.componentId, event)
      
      if (onCleanup) {
        onCleanup(event)
      }
    } catch (error) {
      if (onCleanupError) {
        onCleanupError(error as Error, event)
      } else {
        console.error(`Cleanup failed for component ${componentIdentity.componentId}:`, error)
      }
    }
  }
  
  // Setup activity tracking
  const setupActivityTracking = () => {
    if (activityIntervalRef.current) {
      clearInterval(activityIntervalRef.current)
    }
    
    activityIntervalRef.current = setInterval(() => {
      updateActivity()
    }, activityInterval)
    
    // Initial activity update
    updateActivity()
  }
  
  return {
    cleanup,
    addCleanupHook,
    updateActivity,
    isRegistered: isRegisteredRef.current,
    cleanupManager
  }
}

/**
 * Higher-order component for automatic cleanup
 */
export function withComponentCleanup<P extends object>(
  Component: React.ComponentType<P>,
  cleanupOptions?: Partial<UseComponentCleanupOptions>
) {
  return function WrappedComponent(props: P & { componentIdentity: ComponentIdentity }) {
    const { componentIdentity, ...restProps } = props
    
    const cleanupResult = useComponentCleanup({
      componentIdentity,
      ...cleanupOptions
    })
    
    return (
      <Component 
        {...(restProps as P)} 
        cleanupResult={cleanupResult}
      />
    )
  }
}

/**
 * Hook for error boundary cleanup integration
 */
export function useErrorBoundaryCleanup(
  componentIdentities: ComponentIdentity[],
  onError?: (error: Error, errorInfo: any) => void
) {
  const cleanupManager = ComponentCleanupManager.getInstance()
  
  const handleError = useCallback(async (error: Error, errorInfo: any) => {
    // Cleanup all child components on error
    for (const identity of componentIdentities) {
      try {
        await cleanupManager.cleanupComponent(identity.componentId, 'manual_cleanup')
      } catch (cleanupError) {
        console.error(`Error during error boundary cleanup:`, cleanupError)
      }
    }
    
    if (onError) {
      onError(error, errorInfo)
    }
  }, [componentIdentities])
  
  return { handleError }
}

/**
 * Hook for batch cleanup operations
 */
export function useBatchCleanup() {
  const cleanupManager = ComponentCleanupManager.getInstance()
  
  const cleanupBatch = useCallback(async (
    componentIds: string[],
    event: CleanupEvent = 'manual_cleanup'
  ) => {
    await cleanupManager.cleanupComponents(componentIds, event)
  }, [])
  
  const cleanupClient = useCallback(async (clientId: string) => {
    await cleanupManager.cleanupClient(clientId)
  }, [])
  
  const forceGarbageCollection = useCallback(async () => {
    return await cleanupManager.forceGarbageCollection()
  }, [])
  
  return {
    cleanupBatch,
    cleanupClient,
    forceGarbageCollection,
    getStats: () => cleanupManager.getCleanupStats()
  }
}