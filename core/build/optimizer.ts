import { readFileSync, writeFileSync, statSync, readdirSync } from "fs"
import { join, extname } from "path"
import { gzipSync } from "zlib"
import type { OptimizationConfig, OptimizationResult } from "../types/build"

export interface OptimizerConfig {
  minify: boolean
  treeshake: boolean
  compress: boolean
  removeUnusedCSS: boolean
  optimizeImages: boolean
  bundleAnalysis: boolean
}

export class Optimizer {
  private config: OptimizerConfig

  constructor(config: OptimizerConfig) {
    this.config = config
  }

  async optimize(buildPath: string): Promise<OptimizationResult> {
    console.log("🔧 Optimizing build...")
    
    const startTime = Date.now()
    const results: OptimizationResult = {
      success: true,
      duration: 0,
      originalSize: 0,
      optimizedSize: 0,
      compressionRatio: 0,
      optimizations: []
    }

    try {
      // Get original size
      results.originalSize = await this.calculateDirectorySize(buildPath)

      // Apply optimizations
      if (this.config.minify) {
        await this.minifyAssets(buildPath, results)
      }

      if (this.config.compress) {
        await this.compressAssets(buildPath, results)
      }

      if (this.config.removeUnusedCSS) {
        await this.removeUnusedCSS(buildPath, results)
      }

      if (this.config.optimizeImages) {
        await this.optimizeImages(buildPath, results)
      }

      if (this.config.bundleAnalysis) {
        await this.analyzeBundles(buildPath, results)
      }

      // Calculate final size and compression ratio
      results.optimizedSize = await this.calculateDirectorySize(buildPath)
      results.compressionRatio = results.originalSize > 0 
        ? ((results.originalSize - results.optimizedSize) / results.originalSize) * 100 
        : 0

      results.duration = Date.now() - startTime

      console.log(`✅ Optimization completed in ${results.duration}ms`)
      console.log(`📊 Size reduction: ${results.compressionRatio.toFixed(2)}%`)
      
      return results

    } catch (error) {
      results.success = false
      results.duration = Date.now() - startTime
      results.error = error instanceof Error ? error.message : "Unknown optimization error"
      
      console.error("❌ Optimization failed:", results.error)
      return results
    }
  }

  private async minifyAssets(buildPath: string, results: OptimizationResult): Promise<void> {
    console.log("🗜️ Minifying assets...")
    
    const files = this.getFilesRecursively(buildPath)
    let minifiedCount = 0

    for (const file of files) {
      const ext = extname(file).toLowerCase()
      
      if (ext === '.js' || ext === '.css') {
        try {
          const content = readFileSync(file, 'utf-8')
          const minified = await this.minifyContent(content, ext)
          
          if (minified !== content) {
            writeFileSync(file, minified)
            minifiedCount++
          }
        } catch (error) {
          console.warn(`⚠️ Failed to minify ${file}:`, error)
        }
      }
    }

    results.optimizations.push({
      type: 'minification',
      description: `Minified ${minifiedCount} files`,
      sizeSaved: 0 // Would calculate actual size saved
    })
  }

  private async minifyContent(content: string, type: string): Promise<string> {
    // Basic minification - in a real implementation, you'd use proper minifiers
    if (type === '.js') {
      return content
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
        .replace(/\/\/.*$/gm, '') // Remove single-line comments
        .replace(/\s+/g, ' ') // Collapse whitespace
        .trim()
    } else if (type === '.css') {
      return content
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
        .replace(/\s+/g, ' ') // Collapse whitespace
        .replace(/;\s*}/g, '}') // Remove unnecessary semicolons
        .trim()
    }
    
    return content
  }

  private async compressAssets(buildPath: string, results: OptimizationResult): Promise<void> {
    console.log("📦 Compressing assets...")
    
    const files = this.getFilesRecursively(buildPath)
    let compressedCount = 0

    for (const file of files) {
      const ext = extname(file).toLowerCase()
      
      if (['.js', '.css', '.html', '.json', '.svg'].includes(ext)) {
        try {
          const content = readFileSync(file)
          const compressed = gzipSync(content)
          
          // Only create .gz file if it's significantly smaller
          if (compressed.length < content.length * 0.9) {
            writeFileSync(file + '.gz', compressed)
            compressedCount++
          }
        } catch (error) {
          console.warn(`⚠️ Failed to compress ${file}:`, error)
        }
      }
    }

    results.optimizations.push({
      type: 'compression',
      description: `Created gzip versions for ${compressedCount} files`,
      sizeSaved: 0
    })
  }

  private async removeUnusedCSS(buildPath: string, results: OptimizationResult): Promise<void> {
    console.log("🎨 Removing unused CSS...")
    
    // This is a placeholder - real implementation would use PurgeCSS or similar
    results.optimizations.push({
      type: 'css-purging',
      description: 'CSS purging not implemented yet',
      sizeSaved: 0
    })
  }

  private async optimizeImages(buildPath: string, results: OptimizationResult): Promise<void> {
    console.log("🖼️ Optimizing images...")
    
    // This is a placeholder - real implementation would use imagemin or similar
    results.optimizations.push({
      type: 'image-optimization',
      description: 'Image optimization not implemented yet',
      sizeSaved: 0
    })
  }

  private async analyzeBundles(buildPath: string, results: OptimizationResult): Promise<void> {
    console.log("📊 Analyzing bundles...")
    
    const files = this.getFilesRecursively(buildPath)
    const jsFiles = files.filter(f => extname(f) === '.js')
    
    let totalJSSize = 0
    for (const file of jsFiles) {
      totalJSSize += statSync(file).size
    }

    results.optimizations.push({
      type: 'bundle-analysis',
      description: `Analyzed ${jsFiles.length} JS bundles (${(totalJSSize / 1024).toFixed(2)} KB total)`,
      sizeSaved: 0
    })
  }

  private async calculateDirectorySize(dirPath: string): Promise<number> {
    const files = this.getFilesRecursively(dirPath)
    let totalSize = 0
    
    for (const file of files) {
      try {
        totalSize += statSync(file).size
      } catch (error) {
        // Ignore files that can't be read
      }
    }
    
    return totalSize
  }

  private getFilesRecursively(dir: string): string[] {
    const files: string[] = []
    
    try {
      const items = readdirSync(dir, { withFileTypes: true })
      
      for (const item of items) {
        const fullPath = join(dir, item.name)
        
        if (item.isDirectory()) {
          files.push(...this.getFilesRecursively(fullPath))
        } else {
          files.push(fullPath)
        }
      }
    } catch (error) {
      // Ignore directories that can't be read
    }
    
    return files
  }

  async createOptimizationReport(result: OptimizationResult): Promise<string> {
    const report = `
# Build Optimization Report

## Summary
- **Status**: ${result.success ? '✅ Success' : '❌ Failed'}
- **Duration**: ${result.duration}ms
- **Original Size**: ${(result.originalSize / 1024).toFixed(2)} KB
- **Optimized Size**: ${(result.optimizedSize / 1024).toFixed(2)} KB
- **Size Reduction**: ${result.compressionRatio.toFixed(2)}%

## Optimizations Applied

${result.optimizations.map(opt => 
  `### ${opt.type.charAt(0).toUpperCase() + opt.type.slice(1)}
- ${opt.description}
- Size Saved: ${(opt.sizeSaved / 1024).toFixed(2)} KB`
).join('\n\n')}

${result.error ? `## Error\n${result.error}` : ''}

Generated at: ${new Date().toISOString()}
`

    return report.trim()
  }
}