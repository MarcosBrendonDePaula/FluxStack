// FluxStack framework types
export interface FluxStackConfig {
  port?: number
  vitePort?: number
  clientPath?: string
  apiPrefix?: string
  cors?: {
    origins?: string[]
    methods?: string[]
    headers?: string[]
  }
  build?: {
    outDir?: string
    target?: string
  }
}

export interface FluxStackContext {
  config: FluxStackConfig
  isDevelopment: boolean
  isProduction: boolean
}

export interface Plugin {
  name: string
  setup: (context: FluxStackContext) => void
}

export interface RouteDefinition {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  path: string
  handler: Function
  schema?: any
}