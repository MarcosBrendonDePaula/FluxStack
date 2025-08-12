/**
 * Component Presets
 * Pre-configured templates for common component types
 */

export interface ComponentPreset {
    name: string
    description: string
    hasProps: boolean
    hasLifecycle: boolean
    hasEvents: boolean
    hasControls: boolean
    methods: string[]
    additionalFiles?: {
        name: string
        content: string
    }[]
}

export const COMPONENT_PRESETS: Record<string, ComponentPreset> = {
    'basic': {
        name: 'Basic Component',
        description: 'Simple component with just state and one action',
        hasProps: false,
        hasLifecycle: false,
        hasEvents: false,
        hasControls: true,
        methods: ['performAction']
    },
    
    'counter': {
        name: 'Counter Component',
        description: 'Interactive counter with increment/decrement',
        hasProps: true,
        hasLifecycle: false,
        hasEvents: true,
        hasControls: true,
        methods: ['increment', 'decrement', 'reset', 'setStep']
    },
    
    'form': {
        name: 'Form Component',
        description: 'Form with validation and submission',
        hasProps: true,
        hasLifecycle: false,
        hasEvents: true,
        hasControls: true,
        methods: ['updateField', 'validateForm', 'submitForm', 'resetForm']
    },
    
    'modal': {
        name: 'Modal Component',
        description: 'Modal dialog with show/hide functionality',
        hasProps: true,
        hasLifecycle: true,
        hasEvents: true,
        hasControls: true,
        methods: ['show', 'hide', 'toggle', 'setContent']
    },
    
    'data-table': {
        name: 'Data Table',
        description: 'Paginated data table with sorting and filtering',
        hasProps: true,
        hasLifecycle: true,
        hasEvents: true,
        hasControls: true,
        methods: [
            'loadData', 
            'sortBy', 
            'filterBy', 
            'nextPage', 
            'prevPage', 
            'setPageSize',
            'refresh'
        ]
    },
    
    'chat': {
        name: 'Chat Component',
        description: 'Real-time chat with message history',
        hasProps: true,
        hasLifecycle: true,
        hasEvents: true,
        hasControls: true,
        methods: [
            'sendMessage',
            'loadHistory', 
            'markAsRead',
            'typing',
            'stopTyping',
            'clearHistory'
        ]
    },
    
    'file-upload': {
        name: 'File Upload',
        description: 'File upload with progress tracking',
        hasProps: true,
        hasLifecycle: false,
        hasEvents: true,
        hasControls: true,
        methods: [
            'selectFile',
            'uploadFile', 
            'cancelUpload',
            'removeFile',
            'validateFile'
        ]
    },
    
    'notification': {
        name: 'Notification System',
        description: 'Toast notifications with different types',
        hasProps: true,
        hasLifecycle: true,
        hasEvents: true,
        hasControls: true,
        methods: [
            'showSuccess',
            'showError', 
            'showWarning',
            'showInfo',
            'dismiss',
            'dismissAll',
            'setPosition'
        ]
    },
    
    'search': {
        name: 'Search Component',
        description: 'Search with autocomplete and filters',
        hasProps: true,
        hasLifecycle: false,
        hasEvents: true,
        hasControls: true,
        methods: [
            'search',
            'clearSearch',
            'addFilter', 
            'removeFilter',
            'loadSuggestions',
            'selectSuggestion'
        ]
    },
    
    'dashboard-widget': {
        name: 'Dashboard Widget',
        description: 'Configurable dashboard widget with data refresh',
        hasProps: true,
        hasLifecycle: true,
        hasEvents: true,
        hasControls: true,
        methods: [
            'loadData',
            'refreshData', 
            'configure',
            'resize',
            'export',
            'toggleFullscreen'
        ]
    }
}

/**
 * Generate preset-specific additional content
 */
export function generatePresetContent(componentName: string, presetKey: string): string {
    switch (presetKey) {
        case 'counter':
            return generateCounterPreset(componentName)
        case 'form':
            return generateFormPreset(componentName)
        case 'modal':
            return generateModalPreset(componentName)
        case 'data-table':
            return generateDataTablePreset(componentName)
        default:
            return ''
    }
}

function generateCounterPreset(name: string): string {
    return `
// Enhanced Counter preset with advanced features
interface CounterState {
    count: number
    step: number
    min?: number
    max?: number
    label: string
}

// Additional methods for Counter preset:
// - increment(): Increases count by step
// - decrement(): Decreases count by step  
// - reset(): Resets to initial value
// - setStep(newStep): Changes increment step
`
}

function generateFormPreset(name: string): string {
    return `
// Enhanced Form preset with validation
interface FormState {
    fields: Record<string, any>
    errors: Record<string, string>
    isValid: boolean
    isSubmitting: boolean
}

// Additional methods for Form preset:
// - updateField(name, value): Updates form field
// - validateForm(): Validates all fields
// - submitForm(): Submits form data
// - resetForm(): Clears all fields
`
}

function generateModalPreset(name: string): string {
    return `
// Enhanced Modal preset with backdrop and animation
interface ModalState {
    isOpen: boolean
    title: string
    content: string
    size: 'sm' | 'md' | 'lg' | 'xl'
    closable: boolean
}

// Additional methods for Modal preset:
// - show(): Opens the modal
// - hide(): Closes the modal  
// - toggle(): Toggles modal state
// - setContent(title, content): Updates modal content
`
}

function generateDataTablePreset(name: string): string {
    return `
// Enhanced DataTable preset with advanced features
interface DataTableState {
    data: any[]
    filteredData: any[]
    currentPage: number
    pageSize: number
    totalItems: number
    sortField?: string
    sortDirection: 'asc' | 'desc'
    filters: Record<string, any>
    loading: boolean
}

// Additional methods for DataTable preset:
// - loadData(): Fetches data from source
// - sortBy(field, direction): Sorts by field
// - filterBy(field, value): Applies filter
// - nextPage/prevPage(): Navigation
// - setPageSize(size): Changes page size
`
}