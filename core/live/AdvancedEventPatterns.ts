/**
 * AdvancedEventPatterns - Component-to-Component Messaging & Advanced Patterns
 * 
 * Implements advanced event patterns including component messaging with
 * acknowledgments, event queuing for offline components, message delivery
 * confirmation, event batching, replay, and time-travel debugging.
 * 
 * Features:
 * - Component-to-component messaging with acknowledgments
 * - Event queuing for offline/disconnected components
 * - Message delivery confirmation system
 * - Event batching for performance optimization
 * - Event replay and time-travel debugging
 * - Event persistence and recovery
 * - Request-response patterns
 * - Event orchestration and workflows
 */

import { ComponentTreeManager, ComponentNode } from './ComponentTreeManager'
import { LiveEventBus, LiveEvent } from './LiveEventBus'

export interface ComponentMessage {
  /** Message ID */
  id: string
  
  /** Source component ID */
  fromId: string
  
  /** Target component ID */
  toId: string
  
  /** Message type */
  type: string
  
  /** Message payload */
  payload?: any
  
  /** Message timestamp */
  timestamp: number
  
  /** Message priority */
  priority: number
  
  /** Requires acknowledgment */
  requiresAck: boolean
  
  /** Request ID for request-response pattern */
  requestId?: string
  
  /** Correlation ID for message chains */
  correlationId?: string
  
  /** Message expiration timestamp */
  expiresAt?: number
  
  /** Delivery options */
  delivery: {
    /** Maximum delivery attempts */
    maxAttempts: number
    
    /** Current attempt number */
    attempts: number
    
    /** Retry delay in milliseconds */
    retryDelay: number
    
    /** Delivery status */
    status: 'pending' | 'delivered' | 'acknowledged' | 'failed' | 'expired'
    
    /** Delivery confirmation timestamp */
    deliveredAt?: number
    
    /** Acknowledgment timestamp */
    acknowledgedAt?: number
  }
  
  /** Message metadata */
  metadata: {
    /** Creation timestamp */
    createdAt: number
    
    /** Custom metadata */
    custom?: Record<string, any>
  }
}

export interface MessageAcknowledgment {
  /** Acknowledgment ID */
  id: string
  
  /** Original message ID */
  messageId: string
  
  /** Acknowledging component ID */
  componentId: string
  
  /** Acknowledgment timestamp */
  timestamp: number
  
  /** Acknowledgment status */
  status: 'success' | 'error' | 'partial'
  
  /** Response data */
  response?: any
  
  /** Error information if status is 'error' */
  error?: {
    code: string
    message: string
    details?: any
  }
}

export interface EventBatch {
  /** Batch ID */
  id: string
  
  /** Batch events */
  events: LiveEvent[]
  
  /** Batch creation timestamp */
  timestamp: number
  
  /** Batch size limit */
  maxSize: number
  
  /** Batch timeout */
  timeout: number
  
  /** Batch processing status */
  status: 'collecting' | 'processing' | 'completed' | 'failed'
  
  /** Batch metadata */
  metadata: {
    /** Source component that started the batch */
    sourceId?: string
    
    /** Batch type for categorization */
    type?: string
    
    /** Custom metadata */
    custom?: Record<string, any>
  }
}

export interface EventSnapshot {
  /** Snapshot ID */
  id: string
  
  /** Snapshot timestamp */
  timestamp: number
  
  /** Event at this point in time */
  event: LiveEvent
  
  /** Component states at this snapshot */
  componentStates: Map<string, any>
  
  /** Global state snapshot */
  globalState?: any
  
  /** Snapshot metadata */
  metadata: {
    /** Snapshot type */
    type: 'manual' | 'automatic' | 'checkpoint'
    
    /** Snapshot description */
    description?: string
    
    /** Custom metadata */
    custom?: Record<string, any>
  }
}

export interface WorkflowStep {
  /** Step ID */
  id: string
  
  /** Step name */
  name: string
  
  /** Component ID to execute this step */
  componentId: string
  
  /** Event to emit for this step */
  event: {
    type: string
    data?: any
  }
  
  /** Step dependencies (must complete before this step) */
  dependencies: string[]
  
  /** Step timeout in milliseconds */
  timeout: number
  
  /** Step retry configuration */
  retry: {
    maxAttempts: number
    delay: number
    backoff: number
  }
  
  /** Step status */
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
  
  /** Step execution result */
  result?: any
  
  /** Step error if failed */
  error?: Error
}

export interface EventWorkflow {
  /** Workflow ID */
  id: string
  
  /** Workflow name */
  name: string
  
  /** Workflow steps */
  steps: WorkflowStep[]
  
  /** Current workflow status */
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  
  /** Workflow start timestamp */
  startedAt?: number
  
  /** Workflow completion timestamp */
  completedAt?: number
  
  /** Workflow metadata */
  metadata: {
    /** Workflow description */
    description?: string
    
    /** Workflow creator */
    createdBy?: string
    
    /** Custom metadata */
    custom?: Record<string, any>
  }
}

export interface AdvancedEventConfig {
  /** Enable message acknowledgments */
  enableAck?: boolean
  
  /** Default message timeout */
  defaultMessageTimeout?: number
  
  /** Maximum retry attempts */
  maxRetryAttempts?: number
  
  /** Enable event batching */
  enableBatching?: boolean
  
  /** Default batch size */
  defaultBatchSize?: number
  
  /** Default batch timeout */
  defaultBatchTimeout?: number
  
  /** Enable event persistence */
  enablePersistence?: boolean
  
  /** Maximum snapshots to keep */
  maxSnapshots?: number
  
  /** Enable debug mode */
  enableDebug?: boolean
}

/**
 * AdvancedEventPatterns
 * 
 * Implements advanced event patterns for component communication
 */
export class AdvancedEventPatterns {
  private treeManager: ComponentTreeManager
  private eventBus: LiveEventBus
  private config: Required<AdvancedEventConfig>
  
  private messages = new Map<string, ComponentMessage>()
  private acknowledgments = new Map<string, MessageAcknowledgment>()
  private messageQueue = new Map<string, ComponentMessage[]>() // componentId -> messages
  private batches = new Map<string, EventBatch>()
  private snapshots: EventSnapshot[] = []
  private workflows = new Map<string, EventWorkflow>()
  
  private activeBatches = new Map<string, NodeJS.Timeout>()
  private pendingRequests = new Map<string, {
    resolve: (value: any) => void
    reject: (error: Error) => void
    timeout: NodeJS.Timeout
  }>()
  
  constructor(
    treeManager: ComponentTreeManager,
    eventBus: LiveEventBus,
    config: AdvancedEventConfig = {}
  ) {
    this.treeManager = treeManager
    this.eventBus = eventBus
    this.config = {
      enableAck: config.enableAck ?? true,
      defaultMessageTimeout: config.defaultMessageTimeout ?? 30000,
      maxRetryAttempts: config.maxRetryAttempts ?? 3,
      enableBatching: config.enableBatching ?? true,
      defaultBatchSize: config.defaultBatchSize ?? 10,
      defaultBatchTimeout: config.defaultBatchTimeout ?? 1000,
      enablePersistence: config.enablePersistence ?? true,
      maxSnapshots: config.maxSnapshots ?? 100,
      enableDebug: config.enableDebug ?? false
    }
    
    this.setupEventHandlers()
  }
  
  /**
   * Send message to specific component with acknowledgment
   */
  async sendMessage(
    fromId: string,
    toId: string,
    type: string,
    payload?: any,
    options: {
      requiresAck?: boolean
      timeout?: number
      priority?: number
      correlationId?: string
      metadata?: Record<string, any>
    } = {}
  ): Promise<ComponentMessage> {
    const {
      requiresAck = this.config.enableAck,
      timeout = this.config.defaultMessageTimeout,
      priority = 100,
      correlationId,
      metadata
    } = options
    
    const message: ComponentMessage = {
      id: this.generateMessageId(),
      fromId,
      toId,
      type,
      payload,
      timestamp: Date.now(),
      priority,
      requiresAck,
      correlationId,
      expiresAt: timeout ? Date.now() + timeout : undefined,
      delivery: {
        maxAttempts: this.config.maxRetryAttempts,
        attempts: 0,
        retryDelay: 1000,
        status: 'pending'
      },
      metadata: {
        createdAt: Date.now(),
        custom: metadata
      }
    }
    
    this.messages.set(message.id, message)
    
    // Check if target component is online
    const targetComponent = this.treeManager.getHierarchy(toId)
    if (!targetComponent) {
      // Queue message for offline component
      this.queueMessage(message)
    } else {
      // Deliver message immediately
      await this.deliverMessage(message)
    }
    
    if (this.config.enableDebug) {
      console.log(`[AdvancedEventPatterns] Message sent: ${type} from ${fromId} to ${toId}`)
    }
    
    return message
  }
  
  /**
   * Send request and wait for response
   */
  async sendRequest<T = any>(
    fromId: string,
    toId: string,
    type: string,
    payload?: any,
    timeout: number = this.config.defaultMessageTimeout
  ): Promise<T> {
    const requestId = this.generateRequestId()
    
    return new Promise<T>((resolve, reject) => {
      // Set up timeout
      const timeoutHandle = setTimeout(() => {
        this.pendingRequests.delete(requestId)
        reject(new Error(`Request timeout: ${type}`))
      }, timeout)
      
      // Store pending request
      this.pendingRequests.set(requestId, {
        resolve,
        reject,
        timeout: timeoutHandle
      })
      
      // Send message with request ID
      this.sendMessage(fromId, toId, type, payload, {
        requiresAck: true,
        timeout,
        correlationId: requestId
      }).catch(reject)
    })
  }
  
  /**
   * Send response to a request
   */
  async sendResponse(
    toId: string,
    requestId: string,
    response: any,
    fromId: string
  ): Promise<void> {
    await this.sendMessage(fromId, toId, 'response', response, {
      correlationId: requestId,
      requiresAck: false
    })
  }
  
  /**
   * Acknowledge message receipt
   */
  async acknowledgeMessage(
    messageId: string,
    componentId: string,
    status: MessageAcknowledgment['status'] = 'success',
    response?: any,
    error?: MessageAcknowledgment['error']
  ): Promise<MessageAcknowledgment> {
    const ack: MessageAcknowledgment = {
      id: this.generateAckId(),
      messageId,
      componentId,
      timestamp: Date.now(),
      status,
      response,
      error
    }
    
    this.acknowledgments.set(ack.id, ack)
    
    // Update message status
    const message = this.messages.get(messageId)
    if (message) {
      message.delivery.status = 'acknowledged'
      message.delivery.acknowledgedAt = Date.now()
    }
    
    // Handle request-response pattern
    if (message?.correlationId && status === 'success') {
      this.handleResponse(message.correlationId, response)
    }
    
    if (this.config.enableDebug) {
      console.log(`[AdvancedEventPatterns] Message acknowledged: ${messageId}`)
    }
    
    return ack
  }
  
  /**
   * Create event batch for performance optimization
   */
  createEventBatch(
    id: string,
    options: {
      maxSize?: number
      timeout?: number
      sourceId?: string
      type?: string
      metadata?: Record<string, any>
    } = {}
  ): EventBatch {
    const {
      maxSize = this.config.defaultBatchSize,
      timeout = this.config.defaultBatchTimeout,
      sourceId,
      type,
      metadata
    } = options
    
    const batch: EventBatch = {
      id,
      events: [],
      timestamp: Date.now(),
      maxSize,
      timeout,
      status: 'collecting',
      metadata: {
        sourceId,
        type,
        custom: metadata
      }
    }
    
    this.batches.set(id, batch)
    
    // Set up batch timeout
    const timeoutHandle = setTimeout(() => {
      this.processBatch(id)
    }, timeout)
    
    this.activeBatches.set(id, timeoutHandle)
    
    if (this.config.enableDebug) {
      console.log(`[AdvancedEventPatterns] Created event batch: ${id}`)
    }
    
    return batch
  }
  
  /**
   * Add event to batch
   */
  addEventToBatch(batchId: string, event: LiveEvent): boolean {
    const batch = this.batches.get(batchId)
    if (!batch || batch.status !== 'collecting') {
      return false
    }
    
    batch.events.push(event)
    
    // Process batch if it's full
    if (batch.events.length >= batch.maxSize) {
      this.processBatch(batchId)
    }
    
    return true
  }
  
  /**
   * Create event snapshot for time-travel debugging
   */
  createSnapshot(
    event: LiveEvent,
    type: EventSnapshot['metadata']['type'] = 'manual',
    description?: string,
    metadata?: Record<string, any>
  ): EventSnapshot {
    const snapshot: EventSnapshot = {
      id: this.generateSnapshotId(),
      timestamp: Date.now(),
      event: { ...event },
      componentStates: new Map(),
      metadata: {
        type,
        description,
        custom: metadata
      }
    }
    
    // Capture component states
    const allComponents = this.treeManager.getTreeStructure()
    this.captureComponentStates(allComponents, snapshot.componentStates)
    
    this.snapshots.push(snapshot)
    
    // Trim snapshots if exceeding limit
    if (this.snapshots.length > this.config.maxSnapshots) {
      this.snapshots.shift()
    }
    
    if (this.config.enableDebug) {
      console.log(`[AdvancedEventPatterns] Created snapshot: ${snapshot.id}`)
    }
    
    return snapshot
  }
  
  /**
   * Replay events from snapshots
   */
  async replayFromSnapshot(
    snapshotId: string,
    targetEvents?: string[]
  ): Promise<void> {
    const snapshot = this.snapshots.find(s => s.id === snapshotId)
    if (!snapshot) {
      throw new Error(`Snapshot not found: ${snapshotId}`)
    }
    
    // Restore component states
    this.restoreComponentStates(snapshot.componentStates)
    
    // Replay events after snapshot
    const eventsToReplay = this.eventBus.getEventHistory()
      .filter(event => event.timestamp > snapshot.timestamp)
      .filter(event => !targetEvents || targetEvents.includes(event.type))
    
    for (const event of eventsToReplay) {
      // Re-emit event
      this.eventBus.emit(
        event.sourceId,
        event.type,
        event.data,
        event.scope
      )
      
      // Small delay to maintain order
      await new Promise(resolve => setTimeout(resolve, 10))
    }
    
    if (this.config.enableDebug) {
      console.log(`[AdvancedEventPatterns] Replayed ${eventsToReplay.length} events from snapshot ${snapshotId}`)
    }
  }
  
  /**
   * Create and execute event workflow
   */
  async executeWorkflow(workflow: Omit<EventWorkflow, 'status' | 'startedAt'>): Promise<EventWorkflow> {
    const fullWorkflow: EventWorkflow = {
      ...workflow,
      status: 'pending',
      startedAt: Date.now()
    }
    
    this.workflows.set(workflow.id, fullWorkflow)
    
    fullWorkflow.status = 'running'
    
    try {
      // Execute steps based on dependencies
      const executionOrder = this.calculateExecutionOrder(fullWorkflow.steps)
      
      for (const stepId of executionOrder) {
        const step = fullWorkflow.steps.find(s => s.id === stepId)!
        await this.executeWorkflowStep(step, fullWorkflow)
        
        if (step.status === 'failed') {
          throw new Error(`Workflow step failed: ${step.name}`)
        }
      }
      
      fullWorkflow.status = 'completed'
      fullWorkflow.completedAt = Date.now()
      
      if (this.config.enableDebug) {
        console.log(`[AdvancedEventPatterns] Workflow completed: ${workflow.name}`)
      }
      
    } catch (error) {
      fullWorkflow.status = 'failed'
      
      if (this.config.enableDebug) {
        console.error(`[AdvancedEventPatterns] Workflow failed: ${workflow.name}`, error)
      }
    }
    
    return fullWorkflow
  }
  
  /**
   * Get message delivery statistics
   */
  getDeliveryStats() {
    const messages = Array.from(this.messages.values())
    
    const statusCounts = messages.reduce((acc, msg) => {
      acc[msg.delivery.status] = (acc[msg.delivery.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const averageDeliveryTime = messages
      .filter(msg => msg.delivery.deliveredAt)
      .reduce((sum, msg) => {
        return sum + (msg.delivery.deliveredAt! - msg.timestamp)
      }, 0) / (messages.filter(msg => msg.delivery.deliveredAt).length || 1)
    
    return {
      totalMessages: messages.length,
      statusCounts,
      averageDeliveryTime,
      queuedMessages: Array.from(this.messageQueue.values())
        .reduce((sum, queue) => sum + queue.length, 0),
      activeBatches: this.activeBatches.size,
      totalSnapshots: this.snapshots.length,
      activeWorkflows: Array.from(this.workflows.values())
        .filter(w => w.status === 'running').length
    }
  }
  
  // Private methods
  
  private setupEventHandlers(): void {
    // Handle component registration for queued messages
    this.eventBus.subscribe('*', 'component.registered', (event) => {
      this.processQueuedMessages(event.data.componentId)
    })
    
    // Handle component unregistration
    this.eventBus.subscribe('*', 'component.unregistered', (event) => {
      this.clearComponentData(event.data.componentId)
    })
  }
  
  private async deliverMessage(message: ComponentMessage): Promise<void> {
    message.delivery.attempts++
    
    try {
      // Emit message as event
      this.eventBus.emit(
        message.fromId,
        `message.${message.type}`,
        {
          message,
          requiresAck: message.requiresAck
        },
        'local'
      )
      
      message.delivery.status = 'delivered'
      message.delivery.deliveredAt = Date.now()
      
    } catch (error) {
      message.delivery.status = 'failed'
      
      // Retry if attempts remaining
      if (message.delivery.attempts < message.delivery.maxAttempts) {
        setTimeout(() => {
          this.deliverMessage(message)
        }, message.delivery.retryDelay * message.delivery.attempts)
      }
    }
  }
  
  private queueMessage(message: ComponentMessage): void {
    if (!this.messageQueue.has(message.toId)) {
      this.messageQueue.set(message.toId, [])
    }
    
    this.messageQueue.get(message.toId)!.push(message)
  }
  
  private async processQueuedMessages(componentId: string): Promise<void> {
    const queue = this.messageQueue.get(componentId)
    if (!queue || queue.length === 0) {
      return
    }
    
    // Process all queued messages
    for (const message of queue) {
      await this.deliverMessage(message)
    }
    
    // Clear queue
    this.messageQueue.delete(componentId)
  }
  
  private processBatch(batchId: string): void {
    const batch = this.batches.get(batchId)
    if (!batch || batch.status !== 'collecting') {
      return
    }
    
    batch.status = 'processing'
    
    // Clear timeout
    const timeout = this.activeBatches.get(batchId)
    if (timeout) {
      clearTimeout(timeout)
      this.activeBatches.delete(batchId)
    }
    
    // Process batch events
    batch.events.forEach(event => {
      this.eventBus.emit(
        event.sourceId,
        event.type,
        event.data,
        event.scope
      )
    })
    
    batch.status = 'completed'
    
    if (this.config.enableDebug) {
      console.log(`[AdvancedEventPatterns] Processed batch: ${batchId} with ${batch.events.length} events`)
    }
  }
  
  private handleResponse(correlationId: string, response: any): void {
    const pendingRequest = this.pendingRequests.get(correlationId)
    if (pendingRequest) {
      clearTimeout(pendingRequest.timeout)
      pendingRequest.resolve(response)
      this.pendingRequests.delete(correlationId)
    }
  }
  
  private captureComponentStates(
    treeStructure: any[],
    stateMap: Map<string, any>
  ): void {
    const processNode = (node: any) => {
      const component = this.treeManager.getHierarchy(node.id)?.node
      if (component?.metadata.state) {
        stateMap.set(node.id, { ...component.metadata.state })
      }
      
      if (node.children) {
        node.children.forEach(processNode)
      }
    }
    
    treeStructure.forEach(processNode)
  }
  
  private restoreComponentStates(stateMap: Map<string, any>): void {
    for (const [componentId, state] of stateMap) {
      this.treeManager.updateComponentState(componentId, state)
    }
  }
  
  private calculateExecutionOrder(steps: WorkflowStep[]): string[] {
    const visited = new Set<string>()
    const temp = new Set<string>()
    const order: string[] = []
    
    const visit = (stepId: string) => {
      if (temp.has(stepId)) {
        throw new Error('Circular dependency detected in workflow')
      }
      
      if (visited.has(stepId)) {
        return
      }
      
      temp.add(stepId)
      
      const step = steps.find(s => s.id === stepId)!
      for (const depId of step.dependencies) {
        visit(depId)
      }
      
      temp.delete(stepId)
      visited.add(stepId)
      order.push(stepId)
    }
    
    for (const step of steps) {
      if (!visited.has(step.id)) {
        visit(step.id)
      }
    }
    
    return order
  }
  
  private async executeWorkflowStep(
    step: WorkflowStep,
    workflow: EventWorkflow
  ): Promise<void> {
    step.status = 'running'
    
    let attempts = 0
    
    while (attempts < step.retry.maxAttempts) {
      try {
        // Emit step event
        const response = await this.sendRequest(
          'workflow',
          step.componentId,
          step.event.type,
          step.event.data,
          step.timeout
        )
        
        step.result = response
        step.status = 'completed'
        break
        
      } catch (error) {
        attempts++
        step.error = error as Error
        
        if (attempts < step.retry.maxAttempts) {
          await new Promise(resolve => 
            setTimeout(resolve, step.retry.delay * Math.pow(step.retry.backoff, attempts - 1))
          )
        } else {
          step.status = 'failed'
        }
      }
    }
  }
  
  private clearComponentData(componentId: string): void {
    // Clear queued messages
    this.messageQueue.delete(componentId)
    
    // Clear pending requests
    for (const [requestId, request] of this.pendingRequests) {
      if (requestId.includes(componentId)) {
        clearTimeout(request.timeout)
        request.reject(new Error('Component disconnected'))
        this.pendingRequests.delete(requestId)
      }
    }
  }
  
  private generateMessageId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
  
  private generateRequestId(): string {
    return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
  
  private generateAckId(): string {
    return `ack-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
  
  private generateSnapshotId(): string {
    return `snap-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

// Export types for external use
export type {
  ComponentMessage,
  MessageAcknowledgment,
  EventBatch,
  EventSnapshot,
  WorkflowStep,
  EventWorkflow,
  AdvancedEventConfig
}