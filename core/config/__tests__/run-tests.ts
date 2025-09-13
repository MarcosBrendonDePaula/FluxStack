#!/usr/bin/env bun

/**
 * Test Runner for FluxStack Configuration System
 * Executes all configuration tests and provides detailed reporting
 */

import { spawn } from 'bun'
import { join } from 'path'
import { existsSync } from 'fs'

interface TestResult {
  file: string
  passed: boolean
  duration: number
  output: string
  error?: string
}

class ConfigTestRunner {
  private testFiles = [
    'schema.test.ts',
    'validator.test.ts', 
    'loader.test.ts',
    'env.test.ts',
    'integration.test.ts'
  ]

  async runAllTests(): Promise<void> {
    console.log('🧪 FluxStack Configuration System Tests')
    console.log('=' .repeat(50))
    console.log()

    const results: TestResult[] = []
    let totalPassed = 0
    let totalFailed = 0

    for (const testFile of this.testFiles) {
      const result = await this.runSingleTest(testFile)
      results.push(result)

      if (result.passed) {
        totalPassed++
        console.log(`✅ ${testFile} - PASSED (${result.duration}ms)`)
      } else {
        totalFailed++
        console.log(`❌ ${testFile} - FAILED (${result.duration}ms)`)
        if (result.error) {
          console.log(`   Error: ${result.error}`)
        }
      }
    }

    console.log()
    console.log('=' .repeat(50))
    console.log(`📊 Test Summary:`)
    console.log(`   Total: ${this.testFiles.length}`)
    console.log(`   Passed: ${totalPassed}`)
    console.log(`   Failed: ${totalFailed}`)
    console.log(`   Success Rate: ${((totalPassed / this.testFiles.length) * 100).toFixed(1)}%`)

    if (totalFailed > 0) {
      console.log()
      console.log('❌ Failed Tests:')
      results.filter(r => !r.passed).forEach(result => {
        console.log(`   - ${result.file}`)
        if (result.error) {
          console.log(`     ${result.error}`)
        }
      })
      process.exit(1)
    } else {
      console.log()
      console.log('🎉 All tests passed!')
    }
  }

  private async runSingleTest(testFile: string): Promise<TestResult> {
    const testPath = join(__dirname, testFile)
    
    if (!existsSync(testPath)) {
      return {
        file: testFile,
        passed: false,
        duration: 0,
        output: '',
        error: 'Test file not found'
      }
    }

    const startTime = Date.now()

    try {
      const process = spawn({
        cmd: ['bun', 'test', testPath],
        stdout: 'pipe',
        stderr: 'pipe'
      })

      const exitCode = await (subprocess as any).exited
      const duration = Date.now() - startTime

      const stdout = await new Response(subprocess.stdout).text()
      const stderr = await new Response(subprocess.stderr).text()

      return {
        file: testFile,
        passed: exitCode === 0,
        duration,
        output: stdout,
        error: exitCode !== 0 ? stderr : undefined
      }
    } catch (error) {
      return {
        file: testFile,
        passed: false,
        duration: Date.now() - startTime,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async runSpecificTest(testName: string): Promise<void> {
    const testFile = this.testFiles.find(f => f.includes(testName))
    
    if (!testFile) {
      console.error(`❌ Test file containing "${testName}" not found`)
      console.log('Available tests:')
      this.testFiles.forEach(f => console.log(`   - ${f}`))
      process.exit(1)
    }

    console.log(`🧪 Running specific test: ${testFile}`)
    console.log('=' .repeat(50))

    const result = await this.runSingleTest(testFile)

    if (result.passed) {
      console.log(`✅ ${testFile} - PASSED (${result.duration}ms)`)
      console.log()
      console.log('Output:')
      console.log(result.output)
    } else {
      console.log(`❌ ${testFile} - FAILED (${result.duration}ms)`)
      console.log()
      if (result.error) {
        console.log('Error:')
        console.log(result.error)
      }
      process.exit(1)
    }
  }

  async runWithCoverage(): Promise<void> {
    console.log('🧪 FluxStack Configuration Tests with Coverage')
    console.log('=' .repeat(50))

    try {
      const process = spawn({
        cmd: [
          'bun', 'test', 
          '--coverage',
          join(__dirname, '*.test.ts')
        ],
        stdout: 'pipe',
        stderr: 'pipe'
      })

      const exitCode = await (subprocess as any).exited
      const stdout = await new Response(subprocess.stdout).text()
      const stderr = await new Response(subprocess.stderr).text()

      console.log(stdout)
      
      if (exitCode !== 0) {
        console.error(stderr)
        process.exit(1)
      }
    } catch (error) {
      console.error('❌ Failed to run tests with coverage:', error)
      process.exit(1)
    }
  }

  printUsage(): void {
    console.log('FluxStack Configuration Test Runner')
    console.log()
    console.log('Usage:')
    console.log('  bun run core/config/__tests__/run-tests.ts [command] [options]')
    console.log()
    console.log('Commands:')
    console.log('  all         Run all tests (default)')
    console.log('  coverage    Run tests with coverage report')
    console.log('  <name>      Run specific test containing <name>')
    console.log()
    console.log('Examples:')
    console.log('  bun run core/config/__tests__/run-tests.ts')
    console.log('  bun run core/config/__tests__/run-tests.ts coverage')
    console.log('  bun run core/config/__tests__/run-tests.ts schema')
    console.log('  bun run core/config/__tests__/run-tests.ts integration')
  }
}

// Main execution
async function main() {
  const runner = new ConfigTestRunner()
  const command = process.argv[2]

  switch (command) {
    case undefined:
    case 'all':
      await runner.runAllTests()
      break
    
    case 'coverage':
      await runner.runWithCoverage()
      break
    
    case 'help':
    case '--help':
    case '-h':
      runner.printUsage()
      break
    
    default:
      await runner.runSpecificTest(command)
      break
  }
}

if (import.meta.main) {
  main().catch(error => {
    console.error('❌ Test runner failed:', error)
    process.exit(1)
  })
}