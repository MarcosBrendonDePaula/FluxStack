import { spawn } from "bun"
import { copyFile, copyFileSync, writeFileSync, existsSync } from "fs"
import { join } from "path"
import type { FluxStackConfig } from "../config"

export class FluxStackBuilder {
  private config: FluxStackConfig

  constructor(config: FluxStackConfig) {
    this.config = config
  }

  async buildClient() {
    console.log("⚡ Building client...")
    
    const buildProcess = spawn({
      cmd: ["bunx", "vite", "build", "--config", "vite.config.ts"],
      cwd: process.cwd(),
      stdout: "pipe",
      stderr: "pipe",
      env: {
        ...process.env,
        VITE_BUILD_OUTDIR: this.config.client.build.outDir,
        VITE_BUILD_MINIFY: this.config.client.build.minify.toString(),
        VITE_BUILD_SOURCEMAPS: this.config.client.build.sourceMaps.toString()
      }
    })

    const exitCode = await buildProcess.exited
    
    if (exitCode === 0) {
      console.log("✅ Client build completed")
    } else {
      console.error("❌ Client build failed")
      process.exit(1)
    }
  }

  async buildServer() {
    console.log("⚡ Building server...")
    
    const buildProcess = spawn({
      cmd: [
        "bun", "build", 
        "app/server/index.ts", 
        "--outdir", this.config.build.outDir,
        "--target", this.config.build.target,
        "--external", "@tailwindcss/vite",
        "--external", "tailwindcss", 
        "--external", "lightningcss",
        "--external", "vite",
        "--external", "@vitejs/plugin-react"
      ],
      stdout: "pipe",
      stderr: "pipe"
    })

    const exitCode = await buildProcess.exited
    
    if (exitCode === 0) {
      console.log("✅ Server build completed")
    } else {
      console.error("❌ Server build failed")
      process.exit(1)
    }
  }

  async createDockerFiles() {
    console.log("🐳 Creating Docker files...")
    
    const distDir = this.config.build.outDir
    
    // Dockerfile optimizado para produção
    const dockerfile = `# FluxStack Production Docker Image
FROM oven/bun:1.1-alpine AS production

WORKDIR /app

# Copy package.json first for better caching
COPY package.json ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy built application
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S fluxstack && \\
    adduser -S fluxstack -u 1001

# Set permissions
RUN chown -R fluxstack:fluxstack /app
USER fluxstack

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD bun run -e "fetch('http://localhost:3000/api/health').then(r => r.ok ? process.exit(0) : process.exit(1))" || exit 1

# Expose port
EXPOSE 3000

# Start the application
CMD ["bun", "run", "index.js"]
`

    // docker-compose.yml para deploy rápido
    const dockerCompose = `version: '3.8'

services:
  fluxstack:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "bun", "run", "-e", "fetch('http://localhost:3000/api/health').then(r => r.ok ? process.exit(0) : process.exit(1))"]
      interval: 30s
      timeout: 3s
      retries: 3
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M

  # Opcional: adicionar nginx reverse proxy
  # nginx:
  #   image: nginx:alpine
  #   ports:
  #     - "80:80"
  #   volumes:
  #     - ./nginx.conf:/etc/nginx/nginx.conf
  #   depends_on:
  #     - fluxstack
  #   restart: unless-stopped
`

    // .dockerignore otimizado
    const dockerignore = `node_modules
.git
.gitignore
README.md
.env.local
.env.*.local
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.DS_Store
*.log
coverage
.nyc_output
.vscode
.idea
*.swp
*.swo
`

    // Escrever arquivos no dist
    writeFileSync(join(distDir, "Dockerfile"), dockerfile)
    writeFileSync(join(distDir, "docker-compose.yml"), dockerCompose)
    writeFileSync(join(distDir, ".dockerignore"), dockerignore)
    
    // Copiar .env ou criar um de exemplo
    const envPath = join(process.cwd(), '.env')
    const envExamplePath = join(process.cwd(), '.env.example')
    const distEnvPath = join(distDir, ".env")
    
    if (existsSync(envPath)) {
      copyFileSync(envPath, distEnvPath)
      console.log("📄 Environment file copied to dist/")
    } else if (existsSync(envExamplePath)) {
      copyFileSync(envExamplePath, distEnvPath)
      console.log("📄 Example environment file copied to dist/")
    } else {
      // Criar um .env básico para produção
      const defaultEnv = `NODE_ENV=production
PORT=3000
FLUXSTACK_APP_NAME=fluxstack-app
FLUXSTACK_APP_VERSION=1.0.0
LOG_LEVEL=info
MONITORING_ENABLED=true
`
      writeFileSync(distEnvPath, defaultEnv)
      console.log("📄 Default environment file created for production")
    }
    
    //writeFileSync(join(distDir, "package.json"), JSON.stringify(packageJson, null, 2))
    
    console.log("✅ Docker files created in dist/")
  }

  async build() {
    console.log("⚡ FluxStack Framework - Building...")
    await this.buildClient()
    await this.buildServer()
    await this.createDockerFiles()
    console.log("🎉 Build completed successfully!")
    console.log("🐳 Ready for Docker deployment from dist/ directory")
  }
}