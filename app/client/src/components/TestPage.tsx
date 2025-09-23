import React, { useState, useEffect } from 'react'
import { api, getErrorMessage } from '../lib/eden-api'

interface TestResult {
  name: string
  status: 'pending' | 'success' | 'error'
  message: string
  details?: any
  duration?: number
}

interface EnvTest {
  name: string
  variable: string
  expected?: string
  description: string
}

const TestPage: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  
  // Environment variables available in the frontend (VITE_ prefix)
  const envTests: EnvTest[] = [
    {
      name: 'API URL',
      variable: 'VITE_API_URL',
      expected: 'http://localhost:3000',
      description: 'Base URL for API calls'
    },
    {
      name: 'App Name',
      variable: 'VITE_APP_NAME',
      description: 'Application name from environment'
    },
    {
      name: 'App Version',
      variable: 'VITE_APP_VERSION',
      description: 'Application version from environment'
    },
    {
      name: 'Environment',
      variable: 'VITE_NODE_ENV',
      description: 'Current environment (dev/prod)'
    }
  ]

  // Add a test result
  const addTestResult = (result: TestResult) => {
    setTestResults(prev => [...prev, result])
  }

  // Update a test result
  const updateTestResult = (name: string, updates: Partial<TestResult>) => {
    setTestResults(prev => 
      prev.map(result => 
        result.name === name ? { ...result, ...updates } : result
      )
    )
  }

  // Test environment variables
  const testEnvironmentVariables = async () => {
    const startTime = Date.now()
    
    addTestResult({
      name: 'Environment Variables',
      status: 'pending',
      message: 'Testing environment variable loading...'
    })

    try {
      const results = envTests.map(test => {
        const value = import.meta.env[test.variable]
        return {
          name: test.name,
          variable: test.variable,
          value: value || 'undefined',
          expected: test.expected,
          description: test.description,
          isValid: test.expected ? value === test.expected : value !== undefined
        }
      })

      const allValid = results.every(r => r.isValid)
      const duration = Date.now() - startTime

      updateTestResult('Environment Variables', {
        status: allValid ? 'success' : 'error',
        message: allValid 
          ? `All environment variables loaded correctly (${results.length} variables)` 
          : 'Some environment variables are missing or incorrect',
        details: results,
        duration
      })
    } catch (error) {
      updateTestResult('Environment Variables', {
        status: 'error',
        message: `Environment test failed: ${getErrorMessage(error)}`,
        duration: Date.now() - startTime
      })
    }
  }

  // Test API health check
  const testApiHealth = async () => {
    const startTime = Date.now()
    
    addTestResult({
      name: 'API Health Check',
      status: 'pending',
      message: 'Testing API connection...'
    })

    try {
      const { data: response, error } = await api.health.get()
      
      if (error) {
        throw new Error(`API Error: ${error.status}`)
      }

      const duration = Date.now() - startTime

      updateTestResult('API Health Check', {
        status: 'success',
        message: `API is healthy: ${response.status}`,
        details: response,
        duration
      })
    } catch (error) {
      updateTestResult('API Health Check', {
        status: 'error',
        message: `API health check failed: ${getErrorMessage(error)}`,
        duration: Date.now() - startTime
      })
    }
  }

  // Test users API
  const testUsersApi = async () => {
    const startTime = Date.now()
    
    addTestResult({
      name: 'Users API Test',
      status: 'pending',
      message: 'Testing users CRUD operations...'
    })

    try {
      // ✨ Test getting users - Eden Treaty nativo
      const { data: usersResponse, error: getUsersError } = await api.users.get()
      
      if (getUsersError) {
        throw new Error(`Get users failed: ${getUsersError.status}`)
      }
      
      // ✨ Test creating a user - Eden Treaty com inferência perfeita
      const { data: newUser, error: createError } = await api.users.post({
        name: "Test User",
        email: "test@example.com"
      })

      if (createError) {
        throw new Error(`Create user failed: ${createError.status}`)
      }

      // ✨ Eden Treaty agora infere automaticamente: newUser é UserResponse
      if (!newUser.success || !newUser.user) {
        throw new Error('User creation failed')
      }

      // ✨ Test getting the created user - inferência automática de tipos  
      const { data: createdUser, error: getError } = await api.users({ id: newUser.user.id }).get()

      if (getError) {
        throw new Error(`Get user failed: ${getError.status}`)
      }

      // ✨ Eden Treaty infere: createdUser é { user: User }
      if (!createdUser || !createdUser.user) {
        throw new Error('User not found')
      }

      // ✨ Test deleting the user - inferência automática
      const { data: deleteResult, error: deleteError } = await api.users({ id: newUser.user.id }).delete()

      if (deleteError) {
        throw new Error(`Delete user failed: ${deleteError.status}`)
      }

      const duration = Date.now() - startTime

      updateTestResult('Users API Test', {
        status: 'success',
        message: `Users API working correctly (CRUD operations completed)`,
        details: {
          initialUsers: usersResponse.users.length,
          createdUser: createdUser,
          newUser: newUser,
          deleteResult: deleteResult,
          operations: ['GET', 'POST', 'GET by ID', 'DELETE']
        },
        duration
      })
    } catch (error) {
      updateTestResult('Users API Test', {
        status: 'error',
        message: `Users API test failed: ${getErrorMessage(error)}`,
        duration: Date.now() - startTime
      })
    }
  }

  // Test Eden Treaty type safety
  const testEdenTreaty = async () => {
    const startTime = Date.now()
    
    addTestResult({
      name: 'Eden Treaty Type Safety',
      status: 'pending',
      message: 'Testing Eden Treaty integration...'
    })

    try {
      // Test that api object has expected methods
      const hasHealthEndpoint = typeof api.health?.get === 'function'
      const hasUsersEndpoint = typeof api.users?.get === 'function'
      const hasUsersPost = typeof api.users?.post === 'function'
      
      const typeChecks = {
        hasHealthEndpoint,
        hasUsersEndpoint,
        hasUsersPost,
        apiObjectExists: !!api,
        apiCallExists: typeof apiCall === 'function'
      }

      const allChecksPass = Object.values(typeChecks).every(Boolean)
      const duration = Date.now() - startTime

      updateTestResult('Eden Treaty Type Safety', {
        status: allChecksPass ? 'success' : 'error',
        message: allChecksPass 
          ? 'Eden Treaty is properly configured with type safety'
          : 'Eden Treaty configuration issues detected',
        details: typeChecks,
        duration
      })
    } catch (error) {
      updateTestResult('Eden Treaty Type Safety', {
        status: 'error',
        message: `Eden Treaty test failed: ${getErrorMessage(error)}`,
        duration: Date.now() - startTime
      })
    }
  }

  // Test frontend configuration
  const testFrontendConfig = async () => {
    const startTime = Date.now()
    
    addTestResult({
      name: 'Frontend Configuration',
      status: 'pending',
      message: 'Testing frontend configuration...'
    })

    try {
      const config = {
        mode: import.meta.env.MODE,
        baseUrl: import.meta.env.BASE_URL,
        prod: import.meta.env.PROD,
        dev: import.meta.env.DEV,
        ssrMode: import.meta.env.SSR
      }

      const hasValidConfig = !!(config.mode && config.baseUrl !== undefined)
      const duration = Date.now() - startTime

      updateTestResult('Frontend Configuration', {
        status: hasValidConfig ? 'success' : 'error',
        message: hasValidConfig 
          ? `Frontend configuration loaded (mode: ${config.mode})`
          : 'Frontend configuration incomplete',
        details: config,
        duration
      })
    } catch (error) {
      updateTestResult('Frontend Configuration', {
        status: 'error',
        message: `Frontend config test failed: ${getErrorMessage(error)}`,
        duration: Date.now() - startTime
      })
    }
  }

  // Run all tests
  const runAllTests = async () => {
    setIsRunning(true)
    setTestResults([])

    await testEnvironmentVariables()
    await new Promise(resolve => setTimeout(resolve, 100)) // Small delay between tests
    
    await testFrontendConfig()
    await new Promise(resolve => setTimeout(resolve, 100))
    
    await testEdenTreaty()
    await new Promise(resolve => setTimeout(resolve, 100))
    
    await testApiHealth()
    await new Promise(resolve => setTimeout(resolve, 100))
    
    await testUsersApi()

    setIsRunning(false)
  }

  // Clear results
  const clearResults = () => {
    setTestResults([])
  }

  // Get status color
  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return 'text-green-600'
      case 'error': return 'text-red-600'
      case 'pending': return 'text-yellow-600'
      default: return 'text-gray-600'
    }
  }

  // Get status icon
  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return '✅'
      case 'error': return '❌'
      case 'pending': return '⏳'
      default: return '⚪'
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          FluxStack Frontend Tests
        </h1>
        <p className="text-gray-600">
          Test environment variables, API connectivity, and frontend configuration
        </p>
      </div>

      {/* Control buttons */}
      <div className="mb-6 flex gap-3">
        <button
          onClick={runAllTests}
          disabled={isRunning}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRunning ? 'Running Tests...' : 'Run All Tests'}
        </button>
        
        <button
          onClick={clearResults}
          disabled={isRunning}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
        >
          Clear Results
        </button>
      </div>

      {/* Environment Variables Preview */}
      <div className="mb-6 bg-gray-50 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-3">Environment Variables Preview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          {envTests.map(test => (
            <div key={test.variable} className="flex justify-between items-center p-2 bg-white rounded border">
              <span className="font-medium">{test.name}:</span>
              <code className="text-blue-600 bg-blue-50 px-2 py-1 rounded">
                {import.meta.env[test.variable] || 'undefined'}
              </code>
            </div>
          ))}
        </div>
      </div>

      {/* Test Results */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Test Results</h2>
        
        {testResults.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No tests run yet. Click "Run All Tests" to start.
          </div>
        )}

        {testResults.map((result, index) => (
          <div
            key={index}
            className="border rounded-lg p-4 bg-white shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">{getStatusIcon(result.status)}</span>
                <h3 className="font-semibold">{result.name}</h3>
                {result.duration && (
                  <span className="text-xs text-gray-500">
                    ({result.duration}ms)
                  </span>
                )}
              </div>
              <span className={`text-sm font-medium ${getStatusColor(result.status)}`}>
                {result.status.toUpperCase()}
              </span>
            </div>
            
            <p className={`text-sm ${getStatusColor(result.status)} mb-2`}>
              {result.message}
            </p>
            
            {result.details && (
              <details className="mt-2">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                  View Details
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto">
                  {JSON.stringify(result.details, null, 2)}
                </pre>
              </details>
            )}
          </div>
        ))}
      </div>

      {/* Summary */}
      {testResults.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Test Summary</h3>
          <div className="text-sm text-blue-800">
            <div>Total: {testResults.length} tests</div>
            <div>Passed: {testResults.filter(r => r.status === 'success').length}</div>
            <div>Failed: {testResults.filter(r => r.status === 'error').length}</div>
            <div>Pending: {testResults.filter(r => r.status === 'pending').length}</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TestPage