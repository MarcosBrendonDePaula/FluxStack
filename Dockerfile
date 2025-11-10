# 🐳 FluxStack Production Dockerfile
# Multi-stage build for optimized production image

# =====================================
# Stage 1: Dependencies
# =====================================
FROM oven/bun:1.1.34-alpine AS deps

WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install production dependencies only
RUN bun install --production --frozen-lockfile

# =====================================
# Stage 2: Production Runner
# =====================================
FROM oven/bun:1.1.34-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000

# Create non-root user for security
RUN addgroup -g 1001 -S fluxstack && \
    adduser -S fluxstack -u 1001

# Copy production dependencies from deps stage
COPY --from=deps --chown=fluxstack:fluxstack /app/node_modules ./node_modules

# Copy built application (dist folder must exist - run 'bun run build' before Docker build)
COPY --chown=fluxstack:fluxstack ./dist ./dist
COPY --chown=fluxstack:fluxstack ./package.json ./

# Note: config directory not needed - configurations are bundled in dist/index.js

# Create necessary runtime directories
RUN mkdir -p public uploads logs && \
    chown -R fluxstack:fluxstack public uploads logs

# Switch to non-root user
USER fluxstack

# Expose application port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD bun run -e 'fetch("http://localhost:3000/api/health").then(r => r.ok ? process.exit(0) : process.exit(1))' || exit 1

# Start the application
CMD ["bun", "dist/index.js"]
