# FluxStack Docker Image
FROM oven/bun:1.1-alpine AS base

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json bun.lockb* ./
COPY bunfig.toml ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN bun run build

# Production stage
FROM oven/bun:1.1-alpine AS production

WORKDIR /app

# Install only production dependencies
COPY package.json bun.lockb* ./
COPY bunfig.toml ./
RUN bun install --frozen-lockfile --production

# Copy built application and source files needed for runtime
COPY --from=base /app/dist ./dist
COPY --from=base /app/core ./core
COPY --from=base /app/config ./config
COPY --from=base /app/app ./app
COPY --from=base /app/tsconfig.json ./tsconfig.json
COPY --from=base /app/bunfig.toml ./bunfig.toml

# Create non-root user
RUN addgroup -g 1001 -S fluxstack && \
    adduser -S fluxstack -u 1001

# Set permissions
RUN chown -R fluxstack:fluxstack /app
USER fluxstack

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD bun run -e "fetch('http://localhost:3000/api/health').then(r => r.ok ? process.exit(0) : process.exit(1))" || exit 1

# Expose port
EXPOSE 3000

# Start the application
CMD ["bun", "run", "start"]