# Server-Side Rendering (SSR) Implementation for FluxStack

## Overview

This document describes the implementation of Server-Side Rendering (SSR) for the FluxStack framework. SSR allows React components to be rendered on the server and sent as HTML to the client, improving SEO and initial page load performance.

## Architecture

### Components

1. **Entry Points**
   - `app/client/src/entry-server.tsx` - Server-side rendering entry point
   - `app/client/src/entry-client.tsx` - Client-side hydration entry point
   - `app/client/index-ssr.html` - HTML template for SSR

2. **Build Configuration**
   - `vite.config.ts` - Client build configuration (unchanged)
   - `vite.config.ssr.ts` - Server build configuration for SSR

3. **Backend Integration**
   - `app/server/routes/ssr-routes.ts` - SSR route handler in Elysia.js
   - `app/server/middleware/ssr.ts` - SSR middleware (optional)

## Build Process

### Development Mode

In development mode, the application runs as a traditional SPA:
- Vite dev server serves the client at `http://localhost:5173`
- Backend API runs at `http://localhost:3000`
- Vite proxy routes `/api` requests to the backend

### Production Mode

In production mode, both client and server bundles are built:

```bash
# Build client bundle (SPA)
bun run build

# Build server bundle (SSR)
bun run build:ssr

# Both commands can be combined in package.json
```

The build process creates:
- `dist/client/` - Client-side bundle (static assets, JS, CSS)
- `dist/server/` - Server-side bundle (entry-server.js)

## How It Works

### Server-Side Rendering Flow

1. **Request**: Browser requests `/` (or any page)
2. **Backend Processing**: Elysia.js receives the request
3. **Data Fetching**: Backend fetches necessary data (if needed)
4. **React Rendering**: Server imports the SSR bundle and calls `render()`
5. **HTML Generation**: React renders to an HTML string
6. **Template Injection**: HTML is injected into the template at `<!--ssr-outlet-->`
7. **Response**: Complete HTML is sent to the browser

### Client-Side Hydration

1. **HTML Load**: Browser loads the HTML with pre-rendered content
2. **JavaScript Load**: Browser downloads and executes `entry-client.tsx`
3. **Hydration**: React calls `hydrateRoot()` to attach event listeners
4. **Interactivity**: Page becomes interactive without re-rendering

## Configuration

### Vite SSR Config

The `vite.config.ssr.ts` file configures the server-side build:

```typescript
build: {
  ssr: 'src/entry-server.tsx',  // Entry point for SSR
  outDir: '../../dist/server',   // Output directory
  rollupOptions: {
    output: {
      entryFileNames: 'entry-server.js'
    }
  }
}
```

### Backend Route

The SSR route in `app/server/routes/ssr-routes.ts` handles the main page:

```typescript
.get('/', async ({ set }) => {
  // In production: render React and inject into template
  // In development: serve Vite dev server
})
```

## Live Components with SSR

Live Components work seamlessly with SSR:

1. **Server Rendering**: The initial HTML includes the Live Component UI
2. **Hydration**: React hydrates the component
3. **WebSocket Connection**: After hydration, the Live Component establishes a WebSocket connection
4. **Real-Time Updates**: Live Components work as normal after hydration

## Performance Considerations

### Advantages
- **Better SEO**: Search engines receive fully rendered HTML
- **Faster First Contentful Paint (FCP)**: HTML is available immediately
- **Reduced JavaScript**: Initial page load doesn't require JavaScript execution

### Disadvantages
- **Increased Server Load**: Server must render React for each request
- **Slower Time to Interactive (TTI)**: Hydration adds overhead
- **Complexity**: More moving parts to manage

### Optimization Tips

1. **Caching**: Cache rendered HTML for static pages
2. **Streaming**: Use `renderToPipeableStream()` for large pages
3. **Code Splitting**: Split code to reduce bundle size
4. **Selective SSR**: Only SSR critical pages

## Development Workflow

### Running in Development

```bash
# Start the dev server (Vite + Backend)
bun run dev

# The application runs as a traditional SPA
# SSR is not active in development mode
```

### Building for Production

```bash
# Build both client and server bundles
bun run build
bun run build:ssr

# Start the production server
bun run start
```

## Troubleshooting

### Hydration Mismatch

If you see "Hydration failed" errors:
1. Ensure the server and client render the same HTML
2. Check for dynamic content (dates, random values)
3. Verify that all data is available during server rendering

### Missing Modules

If you see "Cannot find module" errors:
1. Check that imports are correct
2. Ensure all dependencies are installed
3. Verify the build output exists

### Performance Issues

If the server is slow:
1. Profile the rendering time
2. Check for expensive computations during render
3. Consider caching rendered HTML
4. Use `renderToPipeableStream()` for streaming

## Future Enhancements

1. **Streaming SSR**: Use `renderToPipeableStream()` for faster initial response
2. **Selective Hydration**: Only hydrate interactive components
3. **Cache Layer**: Add Redis caching for rendered pages
4. **Static Generation**: Pre-render static pages at build time
5. **Route-Based Code Splitting**: Split code by route

## References

- [Vite SSR Guide](https://vite.dev/guide/ssr)
- [React Server Components](https://react.dev/reference/react/use_server)
- [Elysia.js Documentation](https://elysiajs.com/)
- [Bun Runtime](https://bun.sh/)
