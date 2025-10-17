import { copyFileSync, writeFileSync, existsSync, mkdirSync, readFileSync } from "fs"
import { join } from "path"
import type { FluxStackConfig } from "../config"
import type { BuildResult, BuildManifest } from "../types/build"
import { Bundler } from "./bundler"
import { Optimizer } from "./optimizer"
import { FLUXSTACK_VERSION } from "../utils/version"

export class FluxStackBuilder {
  private config: FluxStackConfig
  private bundler: Bundler
  private optimizer: Optimizer

  constructor(config: FluxStackConfig) {
    this.config = config
    
    // Initialize bundler with configuration
    this.bundler = new Bundler({
      target: config.build.target,
      outDir: config.build.outDir,
      sourceMaps: config.build.sourceMaps,
      external: config.build.external
    })
    
    // Initialize optimizer with configuration
    this.optimizer = new Optimizer({
      treeshake: config.build.treeshake,
      compress: config.build.compress || false,
      removeUnusedCSS: config.build.removeUnusedCSS || false,
      optimizeImages: config.build.optimizeImages || false,
      bundleAnalysis: config.build.bundleAnalysis || false
    })
  }

  async buildClient() {
    return await this.bundler.bundleClient({
      env: {
        VITE_BUILD_OUTDIR: this.config.client.build.outDir,
        VITE_BUILD_SOURCEMAPS: this.config.client.build.sourceMaps.toString()
      }
    })
  }

  async buildServer() {
    return await this.bundler.bundleServer("app/server/index.ts")
  }

  async createDockerFiles() {
    console.log("🐳 Creating Docker files...")
    
    const distDir = this.config.build.outDir
    console.log(`📁 Output directory: ${distDir}`)
    
    // Ensure dist directory exists
    if (!existsSync(distDir)) {
      console.log(`📁 Creating directory: ${distDir}`)
      mkdirSync(distDir, { recursive: true })
      console.log(`✅ Directory created successfully`)
    } else {
      console.log(`✅ Directory already exists`)
    }
    
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
    try {
      console.log(`📝 Writing Dockerfile...`)
      writeFileSync(join(distDir, "Dockerfile"), dockerfile)
      console.log(`📝 Writing docker-compose.yml...`)
      writeFileSync(join(distDir, "docker-compose.yml"), dockerCompose)
      console.log(`📝 Writing .dockerignore...`)
      writeFileSync(join(distDir, ".dockerignore"), dockerignore)
    } catch (error) {
      console.error(`❌ Error writing Docker files:`, error)
      throw error
    }
    
    // Copiar .env ou criar um de exemplo
    const envPath = join(process.cwd(), '.env')
    const envExamplePath = join(process.cwd(), '.env.example')
    const distEnvPath = join(distDir, ".env")
    
    console.log(`🔍 Checking for .env files...`)
    console.log(`  - .env path: ${envPath}`)
    console.log(`  - .env.example path: ${envExamplePath}`)
    console.log(`  - target path: ${distEnvPath}`)
    
    if (existsSync(envPath)) {
      console.log(`📄 Copying .env file and setting production mode...`)
      // Read .env content
      let envContent = readFileSync(envPath, 'utf-8')
      // Replace development with production
      envContent = envContent.replace(/NODE_ENV=development/g, 'NODE_ENV=production')
      envContent = envContent.replace(/VITE_NODE_ENV=development/g, 'VITE_NODE_ENV=production')
      // Write to dist
      writeFileSync(distEnvPath, envContent)
      console.log("📄 Environment file copied to dist/ (NODE_ENV=production)")
    } else if (existsSync(envExamplePath)) {
      console.log(`📄 Copying .env.example file...`)
      copyFileSync(envExamplePath, distEnvPath)
      console.log("📄 Example environment file copied to dist/")
    } else {
      console.log(`📄 Creating default .env file...`)
      // Criar um .env básico para produção
      const defaultEnv = `NODE_ENV=production
PORT=3000
FLUXSTACK_APP_NAME=fluxstack-app
FLUXSTACK_APP_VERSION=${FLUXSTACK_VERSION}
LOG_LEVEL=info
MONITORING_ENABLED=true
`
      writeFileSync(distEnvPath, defaultEnv)
      console.log("📄 Default environment file created for production")
    }
    
    // Copy package.json for Docker build
    const packageJsonPath = join(process.cwd(), 'package.json')
    const distPackageJsonPath = join(distDir, 'package.json')
    
    console.log(`📦 Copying package.json...`)
    console.log(`  - source: ${packageJsonPath}`)
    console.log(`  - target: ${distPackageJsonPath}`)
    
    if (existsSync(packageJsonPath)) {
      copyFileSync(packageJsonPath, distPackageJsonPath)
      console.log("📦 Package.json copied successfully")
    } else {
      console.warn("⚠️ package.json not found, creating minimal version...")
      const minimalPackageJson = {
        name: "fluxstack-app",
        version: "1.0.0",
        type: "module",
        scripts: {
          start: "bun run index.js"
        },
        dependencies: {}
      }
      writeFileSync(distPackageJsonPath, JSON.stringify(minimalPackageJson, null, 2))
    }
    
    console.log("✅ Docker files created in dist/")
  }


  async build(): Promise<BuildResult> {
    console.log("⚡ FluxStack Framework - Building...")
    
    const startTime = Date.now()
    
    try {
      // Pre-build checks (version sync, etc.)
      await this.runPreBuildChecks()
      
      // Validate configuration
      await this.validateConfig()
      
      // Clean output directory if requested
      if (this.config.build.clean) {
        await this.clean()
      }
      
      // Build client and server
      const clientResult = await this.buildClient()
      const serverResult = await this.buildServer()
      
      // Check if builds were successful
      if (!clientResult.success || !serverResult.success) {
        return {
          success: false,
          duration: Date.now() - startTime,
          error: clientResult.error || serverResult.error || "Build failed",
          outputFiles: [],
          warnings: [],
          errors: [],
          stats: {
            totalSize: 0,
            gzippedSize: 0,
            chunkCount: 0,
            assetCount: 0,
            entryPoints: [],
            dependencies: []
          }
        }
      }
      
      // Optimize build if enabled
      let optimizationResult
      if (this.config.build.optimize) {
        optimizationResult = await this.optimizer.optimize(this.config.build.outDir)
      }
      
      // Create Docker files
      await this.createDockerFiles()
      
      // Generate build manifest
      const manifest = await this.generateManifest(clientResult, serverResult, optimizationResult)
      
      const duration = Date.now() - startTime
      
      console.log("🎉 Build completed successfully!")
      console.log(`⏱️ Build time: ${duration}ms`)
      console.log("🐳 Ready for Docker deployment from dist/ directory")
      
      return {
        success: true,
        duration,
        outputFiles: [],
        warnings: [],
        errors: [],
        stats: {
          totalSize: optimizationResult?.optimizedSize || 0,
          gzippedSize: 0,
          chunkCount: 0,
          assetCount: clientResult.assets?.length || 0,
          entryPoints: [serverResult.entryPoint || ""].filter(Boolean),
          dependencies: []
        }
      }
      
    } catch (error) {
      const duration = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : "Unknown build error"
      
      console.error("❌ Build failed:", errorMessage)
      
      return {
        success: false,
        duration,
        error: errorMessage,
        outputFiles: [],
        warnings: [],
        errors: [],
        stats: {
          totalSize: 0,
          gzippedSize: 0,
          chunkCount: 0,
          assetCount: 0,
          entryPoints: [],
          dependencies: []
        }
      }
    }
  }

  private async runPreBuildChecks(): Promise<void> {
    try {
      // Import and run version sync silently
      const { syncVersion } = await import("../utils/sync-version")
      syncVersion(true) // Pass true for silent mode
    } catch (error) {
      // Silently handle pre-build check failures
      // Don't fail the build for pre-build check failures
    }
  }

  private async validateConfig(): Promise<void> {
    // Validate build configuration
    if (!this.config.build.outDir) {
      throw new Error("Build output directory not specified")
    }
    
    if (!this.config.build.target) {
      throw new Error("Build target not specified")
    }
  }

  private async clean(): Promise<void> {
    // Clean output directory - implementation would go here
    console.log("🧹 Cleaning output directory...")
  }

  private async generateManifest(
    clientResult: any, 
    serverResult: any, 
    optimizationResult?: any
  ): Promise<BuildManifest> {
    return {
      version: this.config.app.version,
      timestamp: new Date().toISOString(),
      target: this.config.build.target,
      mode: this.config.build.mode || 'production',
      client: {
        entryPoints: [],
        chunks: [],
        assets: clientResult.assets || [],
        publicPath: '/'
      },
      server: {
        entryPoint: serverResult.entryPoint || '',
        dependencies: [],
        externals: this.config.build.external || []
      },
      assets: [],
      optimization: {
        minified: this.config.build.minify,
        treeshaken: this.config.build.treeshake,
        compressed: this.config.build.compress || false,
        originalSize: optimizationResult?.originalSize || 0,
        optimizedSize: optimizationResult?.optimizedSize || 0,
        compressionRatio: optimizationResult?.compressionRatio || 0
      },
      metrics: {
        buildTime: clientResult.duration + serverResult.duration,
        bundleTime: 0,
        optimizationTime: optimizationResult?.duration || 0,
        totalSize: optimizationResult?.optimizedSize || 0,
        gzippedSize: 0,
        chunkCount: 0,
        assetCount: clientResult.assets?.length || 0
      }
    }
  }
}