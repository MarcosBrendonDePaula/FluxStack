import { defineConfig } from 'tsup'

export default defineConfig([
  // Main entry point
  {
    entry: ['client/index.ts', 'server/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
    sourcemap: true,
    splitting: false,
    treeshake: true,
    minify: false,
    external: ['react', 'express', 'fastify', 'elysia'],
    outDir: 'dist'
  },
  // React hooks
  {
    entry: ['client/react/useSession.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    external: ['react'],
    outDir: 'dist/client/react',
    outExtension({ format }) {
      return {
        js: format === 'cjs' ? '.cjs' : '.js'
      }
    }
  }
])