# 🎯 Hybrid Architecture Guide - Zustand + Live Components

## 📋 Overview

Guia prático para implementar uma arquitetura híbrida que combina **Zustand** (client state) com **Live Components** (server state), oferecendo o melhor dos dois mundos.

## 🏗️ Architecture Principles

### **State Separation Strategy**

```typescript
// ✅ ZUSTAND: Client-only state
const useUIStore = create((set) => ({
  sidebarOpen: false,
  theme: 'light',
  selectedTab: 'all',
  searchFilter: '',
  notifications: [],
  
  // UI actions
  toggleSidebar: () => set(state => ({ sidebarOpen: !state.sidebarOpen })),
  setTheme: (theme) => set({ theme }),
  setFilter: (filter) => set({ searchFilter: filter }),
}))

// ✅ LIVE COMPONENTS: Server state + real-time sync
const { state, call } = useLiveComponent('TodoList', {
  todos: [],
  sharedWith: [],
  lastModified: null
})
```

### **Clear Boundaries**

| **Aspect** | **Use Zustand** | **Use Live Components** |
|------------|-----------------|-------------------------|
| **Data Persistence** | Session/Local only | Database backed |
| **Multi-user Sync** | Not needed | Required |
| **Real-time Updates** | Not needed | Critical |
| **Server Validation** | Simple/Optional | Complex/Required |
| **Performance** | Instant | Near-instant |

## 🎪 Practical Examples

### **1. Chat Application**

```typescript
// Server state - messages, users, typing indicators
const { state: chatState, call: chatActions } = useLiveComponent('Chat', {
  roomId: 'general',
  messages: [],
  onlineUsers: [],
  typingUsers: []
})

// Client state - UI preferences, drafts, temporary data
const useChatUIStore = create((set) => ({
  messageInput: '',
  showEmojiPicker: false,
  sidebarCollapsed: false,
  soundEnabled: true,
  fontSize: 'medium',
  
  setMessageInput: (input) => set({ messageInput: input }),
  toggleEmojiPicker: () => set(state => ({ showEmojiPicker: !state.showEmojiPicker })),
  toggleSidebar: () => set(state => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}))

function ChatApp() {
  const { messages, onlineUsers } = chatState
  const { sendMessage, startTyping } = chatActions
  
  const { messageInput, showEmojiPicker, sidebarCollapsed } = useChatUIStore()
  const { setMessageInput, toggleEmojiPicker } = useChatUIStore()
  
  const handleSend = () => {
    sendMessage(messageInput) // Server action
    setMessageInput('')      // Clear local input
  }
  
  return (
    <div className={sidebarCollapsed ? 'collapsed' : ''}>
      <MessageList messages={messages} />
      <MessageInput 
        value={messageInput}
        onChange={setMessageInput}
        onSend={handleSend}
        onFocus={() => startTyping()}
      />
      {showEmojiPicker && <EmojiPicker />}
    </div>
  )
}
```

### **2. E-commerce Dashboard**

```typescript
// Server state - products, orders, analytics
const { state: dashboardState, call: dashboardActions } = useLiveComponent('Dashboard', {
  products: [],
  orders: [],
  revenue: 0,
  alerts: []
})

// Client state - filters, view preferences, UI state
const useDashboardStore = create((set) => ({
  dateRange: { start: new Date(), end: new Date() },
  selectedMetrics: ['revenue', 'orders'],
  chartType: 'line',
  refreshInterval: 30000,
  
  setDateRange: (range) => set({ dateRange: range }),
  toggleMetric: (metric) => set(state => {
    const metrics = state.selectedMetrics.includes(metric)
      ? state.selectedMetrics.filter(m => m !== metric)
      : [...state.selectedMetrics, metric]
    return { selectedMetrics: metrics }
  }),
}))

function Dashboard() {
  const { products, orders, revenue } = dashboardState
  const { refreshData } = dashboardActions
  
  const { dateRange, selectedMetrics, chartType } = useDashboardStore()
  const { setDateRange } = useDashboardStore()
  
  // Computed values using both states
  const filteredData = useMemo(() => {
    return orders.filter(order => 
      order.date >= dateRange.start && order.date <= dateRange.end
    )
  }, [orders, dateRange])
  
  return (
    <div className="dashboard">
      <MetricsCards 
        revenue={revenue}
        orders={filteredData.length}
        products={products.length}
      />
      <Chart 
        data={filteredData}
        type={chartType}
        metrics={selectedMetrics}
      />
    </div>
  )
}
```

### **3. Form with Real-time Collaboration**

```typescript
// Server state - form data, validation, collaboration
const { state: formState, call: formActions } = useLiveComponent('CollaborativeForm', {
  formData: { name: '', email: '', bio: '' },
  validationErrors: {},
  collaborators: [],
  fieldLocks: {},
  lastSaved: null
})

// Client state - UI state, temporary data, preferences
const useFormUIStore = create((set) => ({
  isDirty: false,
  showAdvanced: false,
  autoSave: true,
  fieldFocus: null,
  
  setDirty: (dirty) => set({ isDirty: dirty }),
  toggleAdvanced: () => set(state => ({ showAdvanced: !state.showAdvanced })),
  setFieldFocus: (field) => set({ fieldFocus: field }),
}))

function CollaborativeForm() {
  const { formData, validationErrors, collaborators } = formState
  const { updateField, saveForm, lockField, unlockField } = formActions
  
  const { isDirty, showAdvanced, fieldFocus } = useFormUIStore()
  const { setDirty, setFieldFocus } = useFormUIStore()
  
  const handleFieldChange = (field: string, value: string) => {
    updateField(field, value)    // Update server state
    setDirty(true)              // Update client state
  }
  
  const handleFieldFocus = (field: string) => {
    lockField(field)            // Lock for others
    setFieldFocus(field)        // Track locally
  }
  
  return (
    <form>
      <CollaboratorIndicator users={collaborators} />
      
      <input
        value={formData.name}
        onChange={(e) => handleFieldChange('name', e.target.value)}
        onFocus={() => handleFieldFocus('name')}
        onBlur={() => unlockField('name')}
        className={fieldFocus === 'name' ? 'focused' : ''}
      />
      
      {validationErrors.name && (
        <span className="error">{validationErrors.name}</span>
      )}
      
      <button 
        onClick={() => setShowAdvanced(!showAdvanced)}
        type="button"
      >
        {showAdvanced ? 'Hide' : 'Show'} Advanced Options
      </button>
      
      {showAdvanced && <AdvancedFields />}
      
      <button disabled={!isDirty}>
        Save {isDirty && '*'}
      </button>
    </form>
  )
}
```

## 🔄 State Synchronization Patterns

### **1. Optimistic Updates with Rollback**

```typescript
const useOptimisticTodos = () => {
  const { state, call } = useLiveComponent('TodoList', { todos: [] })
  
  // Zustand for optimistic state
  const useOptimisticStore = create((set, get) => ({
    optimisticTodos: [],
    pendingActions: new Map(),
    
    addOptimistic: (todo) => {
      set(state => ({ 
        optimisticTodos: [...state.optimisticTodos, todo],
        pendingActions: new Map(state.pendingActions).set(todo.id, 'add')
      }))
    },
    
    revertOptimistic: (id) => {
      set(state => ({
        optimisticTodos: state.optimisticTodos.filter(t => t.id !== id),
        pendingActions: new Map([...state.pendingActions].filter(([key]) => key !== id))
      }))
    },
    
    confirmOptimistic: (id) => {
      set(state => ({
        pendingActions: new Map([...state.pendingActions].filter(([key]) => key !== id))
      }))
    }
  }))
  
  const { addOptimistic, revertOptimistic, confirmOptimistic } = useOptimisticStore()
  
  const addTodo = async (text: string) => {
    const optimisticTodo = { id: 'temp-' + Date.now(), text, completed: false }
    
    // 1. Immediate UI update
    addOptimistic(optimisticTodo)
    
    try {
      // 2. Server call
      const result = await call('addTodo', text)
      
      // 3. Confirm success
      confirmOptimistic(optimisticTodo.id)
    } catch (error) {
      // 4. Revert on error
      revertOptimistic(optimisticTodo.id)
      throw error
    }
  }
  
  // Merge server state with optimistic state
  const mergedTodos = useMemo(() => {
    const { optimisticTodos } = useOptimisticStore.getState()
    return [...state.todos, ...optimisticTodos]
  }, [state.todos, useOptimisticStore((s) => s.optimisticTodos)])
  
  return { todos: mergedTodos, addTodo }
}
```

### **2. Sync Server Events to Client Store**

```typescript
// Sync Live Component events to Zustand
function useSyncedNotifications() {
  const { state, call } = useLiveComponent('NotificationCenter', {
    notifications: []
  })
  
  const useNotificationStore = create((set) => ({
    unreadCount: 0,
    showBadge: false,
    soundEnabled: true,
    
    incrementUnread: () => set(state => ({ 
      unreadCount: state.unreadCount + 1,
      showBadge: true 
    })),
    
    markAllRead: () => set({ unreadCount: 0, showBadge: false }),
    
    toggleSound: () => set(state => ({ soundEnabled: !state.soundEnabled }))
  }))
  
  const { incrementUnread, markAllRead } = useNotificationStore()
  
  // Listen to server events
  useEffect(() => {
    const unsubscribe = subscribeToLiveComponent('NotificationCenter', (event) => {
      if (event.type === 'NOTIFICATION_RECEIVED') {
        incrementUnread()
        
        // Play sound if enabled
        if (useNotificationStore.getState().soundEnabled) {
          playNotificationSound()
        }
      }
    })
    
    return unsubscribe
  }, [])
  
  const markAsRead = async (id: string) => {
    await call('markAsRead', id)
    // Server will update the notifications list
    // Client updates unread count
    markAllRead()
  }
  
  return {
    notifications: state.notifications,
    markAsRead,
    ...useNotificationStore()
  }
}
```

### **3. Persistent UI Preferences**

```typescript
// Persist Zustand state and sync with server preferences
const useUserPreferences = create<PreferencesState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      language: 'en',
      timezone: 'UTC',
      notifications: {
        email: true,
        push: true,
        inApp: true
      },
      
      updatePreference: (key, value) => {
        set({ [key]: value })
        
        // Sync with server
        syncPreferenceWithServer(key, value)
      },
      
      syncFromServer: (serverPrefs) => {
        set(serverPrefs)
      }
    }),
    {
      name: 'user-preferences',
      version: 1,
    }
  )
)

// Integration with Live Component
function useIntegratedPreferences() {
  const { state: userState, call: userActions } = useLiveComponent('UserProfile', {
    preferences: {}
  })
  
  const preferences = useUserPreferences()
  
  // Sync server preferences to Zustand on mount
  useEffect(() => {
    if (userState.preferences) {
      preferences.syncFromServer(userState.preferences)
    }
  }, [userState.preferences])
  
  const updatePreference = async (key: string, value: any) => {
    // Update local state immediately
    preferences.updatePreference(key, value)
    
    // Sync to server
    try {
      await userActions('updatePreferences', { [key]: value })
    } catch (error) {
      // Revert local change on error
      preferences.syncFromServer(userState.preferences)
      throw error
    }
  }
  
  return { ...preferences, updatePreference }
}
```

## 🎯 Integration Best Practices

### **1. Clear State Ownership**

```typescript
// ✅ GOOD: Clear ownership
const useTaskManager = () => {
  // Server state: persistent data
  const { state: tasks, call: taskActions } = useLiveComponent('Tasks')
  
  // Client state: UI and filters
  const { filter, sortBy, viewMode } = useTaskUIStore()
  
  // Computed: combine both states
  const filteredTasks = useMemo(() => {
    return tasks.items
      .filter(task => filter === 'all' || task.status === filter)
      .sort((a, b) => sortBy === 'date' ? a.date - b.date : a.name.localeCompare(b.name))
  }, [tasks.items, filter, sortBy])
  
  return { tasks: filteredTasks, taskActions, filter, sortBy, viewMode }
}

// ❌ BAD: Unclear ownership
const useConfusedState = () => {
  const [localTasks, setLocalTasks] = useState([])  // Confusing!
  const { state: serverTasks } = useLiveComponent('Tasks')
  // Which is the source of truth?
}
```

### **2. Event-driven Synchronization**

```typescript
// Custom hook for event-driven sync
const useSyncedState = (liveComponentName: string, zustandStore: any) => {
  const { state, call } = useLiveComponent(liveComponentName)
  
  useEffect(() => {
    // Listen to Live Component events
    const unsubscribe = subscribeToEvents(liveComponentName, (event) => {
      // Update Zustand store based on server events
      zustandStore.getState().handleServerEvent(event)
    })
    
    return unsubscribe
  }, [])
  
  return { state, call }
}
```

### **3. Type Safety Across Boundaries**

```typescript
// Shared types for both systems
interface TodoItem {
  id: string
  text: string
  completed: boolean
  createdAt: Date
}

interface TodoServerState {
  todos: TodoItem[]
  sharedWith: string[]
  lastSync: Date
}

interface TodoClientState {
  filter: 'all' | 'active' | 'completed'
  sortBy: 'date' | 'text'
  showCompleted: boolean
}

// Type-safe integration
const useTodoIntegration = (): {
  serverState: TodoServerState
  clientState: TodoClientState
  actions: TodoActions
} => {
  const { state, call } = useLiveComponent<TodoServerState>('TodoList')
  const clientState = useTodoUIStore<TodoClientState>()
  
  return {
    serverState: state,
    clientState: clientState,
    actions: { call, ...clientState }
  }
}
```

## 📊 Performance Optimization

### **1. Selective Subscriptions**

```typescript
// ✅ GOOD: Subscribe only to what you need
function UserAvatar() {
  // Only subscribe to user name and avatar
  const userName = useUserStore(state => state.user.name)
  const userAvatar = useUserStore(state => state.user.avatar)
  
  return <Avatar name={userName} src={userAvatar} />
}

// ❌ BAD: Subscribe to entire state
function UserAvatarBad() {
  const { user } = useUserStore() // Re-renders on any user change
  return <Avatar name={user.name} src={user.avatar} />
}
```

### **2. Debounced Server Sync**

```typescript
// Debounce frequent updates to server
const useDebouncedSync = (delay = 300) => {
  const { call } = useLiveComponent('Document')
  
  const debouncedUpdate = useMemo(
    () => debounce((field: string, value: string) => {
      call('updateField', { field, value })
    }, delay),
    [call, delay]
  )
  
  return debouncedUpdate
}

// Usage in document editor
function DocumentEditor() {
  const { content } = useDocumentStore()
  const debouncedUpdate = useDebouncedSync()
  
  const handleChange = (newContent: string) => {
    // Update local state immediately
    useDocumentStore.setState({ content: newContent })
    
    // Sync to server after delay
    debouncedUpdate('content', newContent)
  }
  
  return (
    <textarea 
      value={content}
      onChange={(e) => handleChange(e.target.value)}
    />
  )
}
```

## 🎪 Complete Example: Project Management App

```typescript
// Server state via Live Components
interface ProjectState {
  project: Project
  tasks: Task[]
  team: TeamMember[]
  activity: ActivityItem[]
}

// Client state via Zustand
interface ProjectUIState {
  selectedView: 'board' | 'list' | 'calendar'
  filters: {
    status: TaskStatus[]
    assignee: string[]
    priority: Priority[]
  }
  sidebarOpen: boolean
  searchQuery: string
}

// Hybrid project manager
function ProjectManager() {
  // Server state - persistent, real-time
  const { state: project, call: projectActions } = useLiveComponent<ProjectState>('Project', {
    projectId: 'proj-123'
  })
  
  // Client state - UI preferences, temporary
  const {
    selectedView,
    filters,
    sidebarOpen,
    searchQuery,
    setView,
    setFilters,
    toggleSidebar,
    setSearch
  } = useProjectUIStore()
  
  // Computed state - combine both
  const filteredTasks = useMemo(() => {
    return project.tasks
      .filter(task => {
        if (filters.status.length && !filters.status.includes(task.status)) return false
        if (filters.assignee.length && !filters.assignee.includes(task.assigneeId)) return false
        if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
        return true
      })
      .sort((a, b) => b.priority - a.priority)
  }, [project.tasks, filters, searchQuery])
  
  return (
    <div className={`project-manager ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <ProjectHeader project={project.project} />
      
      <ProjectSidebar 
        team={project.team}
        isOpen={sidebarOpen}
        onToggle={toggleSidebar}
      />
      
      <ProjectFilters 
        filters={filters}
        onChange={setFilters}
        searchQuery={searchQuery}
        onSearchChange={setSearch}
      />
      
      <ViewToggle 
        selectedView={selectedView}
        onChange={setView}
      />
      
      {selectedView === 'board' && (
        <TaskBoard 
          tasks={filteredTasks}
          onTaskUpdate={projectActions}
        />
      )}
      
      {selectedView === 'list' && (
        <TaskList 
          tasks={filteredTasks}
          onTaskUpdate={projectActions}
        />
      )}
      
      <ActivityFeed items={project.activity} />
    </div>
  )
}
```

## 🚀 Implementation Strategy

### **Phase 1: Foundation**
1. Implement basic Live Components infrastructure
2. Add Zustand to existing components
3. Establish clear state boundaries

### **Phase 2: Integration**
4. Create sync patterns between systems
5. Implement optimistic updates
6. Add event-driven communication

### **Phase 3: Advanced Features**
7. Multi-user collaboration patterns
8. Offline sync capabilities
9. Performance optimizations

### **Phase 4: Developer Experience**
10. DevTools integration
11. Type generation utilities
12. Testing patterns and utilities

---

**🎯 Result**: Uma arquitetura híbrida poderosa que combina a simplicidade do Zustand com o poder dos Live Components, oferecendo type safety end-to-end e experiência de desenvolvimento excepcional.