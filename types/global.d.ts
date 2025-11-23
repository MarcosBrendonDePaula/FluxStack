// Global type fixes for FluxStack

declare global {
  interface Window {
    location: {
      hostname: string
      port: string
      protocol: string
      origin: string
    }
  }
}

// Fix for unknown types
declare module '*' {
  const content: any
  export = content
}

// Environment types
declare const process: {
  env: Record<string, string | undefined>
}

declare const Bun: {
  env: Record<string, string | undefined>
  spawn: (options: any) => any
}

export {}
