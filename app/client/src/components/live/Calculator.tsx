import { useLive } from '@/hooks/useLive'
import { useState } from 'react'

interface CalculatorProps {
    componentId?: string
    theme?: 'standard' | 'scientific'
    
    // Event handlers
    onCalculationCompleted?: (data: { operation: string, input: number, result: number, message: string, steps?: number[] }) => void
    onExpressionValidated?: (data: { expression: string, isValid: boolean, suggestion?: string }) => void
}

export function Calculator({ 
    componentId,
    theme = 'standard',
    onCalculationCompleted,
    onExpressionValidated
}: CalculatorProps) {
    const { 
        state, 
        loading, 
        error, 
        connected, 
        callMethod,
        functionResult,
        isFunctionLoading,
        functionError,
        componentId: id
    } = useLive({
        name: 'CalculatorAction',
        props: { theme },
        componentId,
        eventHandlers: {
            onCalculationCompleted,
            onExpressionValidated
        }
    })
    
    const [asyncResults, setAsyncResults] = useState<any[]>([])
    const [validationInput, setValidationInput] = useState('')

    // Handle button clicks - SYNC functions
    const handleDigit = async (digit: string) => {
        try {
            const result = await callMethod('addDigit', digit)
            console.log(`✅ Sync addDigit result: ${result}`)
        } catch (error) {
            console.error('Error calling addDigit:', error)
        }
    }

    const handleOperation = async (operation: string) => {
        try {
            const result = await callMethod('setOperation', operation)
            console.log(`✅ Sync setOperation result:`, result)
        } catch (error) {
            console.error('Error calling setOperation:', error)
        }
    }

    const handleEquals = async () => {
        try {
            const result = await callMethod('equals')
            console.log(`✅ Sync equals result:`, result)
        } catch (error) {
            console.error('Error calling equals:', error)
        }
    }

    const handleClear = async () => {
        try {
            const result = await callMethod('clear')
            console.log(`✅ Sync clear result: ${result}`)
            setAsyncResults([]) // Clear async results too
        } catch (error) {
            console.error('Error calling clear:', error)
        }
    }

    // Handle ASYNC functions
    const handleSquareRoot = async () => {
        try {
            console.log(`🔄 Starting ASYNC square root...`)
            const result = await callMethod('calculateSquareRoot')
            console.log(`✅ Async square root result:`, result)
            setAsyncResults(prev => [...prev, { type: 'sqrt', ...result, timestamp: new Date() }])
        } catch (error) {
            console.error('Error calling calculateSquareRoot:', error)
            setAsyncResults(prev => [...prev, { type: 'sqrt', error: error.message, timestamp: new Date() }])
        }
    }

    // Handle SYNC functions that can error
    const handleSafeDivision = async () => {
        try {
            console.log(`🔄 Starting SYNC safe division...`)
            const result = await callMethod('safeDivision')
            console.log(`✅ Sync safe division result:`, result)
            setAsyncResults(prev => [...prev, { type: 'safeDivision', ...result, timestamp: new Date() }])
        } catch (error) {
            console.error('Error calling safeDivision:', error)
            setAsyncResults(prev => [...prev, { type: 'safeDivision', error: error.message, timestamp: new Date() }])
        }
    }

    const handleFactorial = async () => {
        try {
            console.log(`🔄 Starting ASYNC factorial...`)
            const result = await callMethod('calculateFactorial')
            console.log(`✅ Async factorial result:`, result)
            setAsyncResults(prev => [...prev, { type: 'factorial', ...result, timestamp: new Date() }])
        } catch (error) {
            console.error('Error calling calculateFactorial:', error)
            setAsyncResults(prev => [...prev, { type: 'factorial', error: error.message, timestamp: new Date() }])
        }
    }

    const handleValidateExpression = async () => {
        if (!validationInput.trim()) return
        
        try {
            console.log(`🔄 Starting ASYNC validation...`)
            const result = await callMethod('validateExpression', validationInput)
            console.log(`✅ Async validation result:`, result)
            setAsyncResults(prev => [...prev, { type: 'validation', expression: validationInput, ...result, timestamp: new Date() }])
        } catch (error) {
            console.error('Error calling validateExpression:', error)
            setAsyncResults(prev => [...prev, { type: 'validation', expression: validationInput, error: error.message, timestamp: new Date() }])
        }
    }

    const isAsyncLoading = isFunctionLoading || loading

    return (
        <div style={{
            border: '2px solid #e2e8f0',
            borderRadius: '16px',
            padding: '1.5rem',
            margin: '1rem',
            backgroundColor: connected ? '#f8fafc' : '#fef2f2',
            minWidth: '350px',
            maxWidth: '500px'
        }}>
            {/* Header */}
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '1rem'
            }}>
                <h3 style={{ margin: 0 }}>🧮 Calculator</h3>
                <div style={{ 
                    fontSize: '0.75rem',
                    color: connected ? '#10b981' : '#ef4444',
                    fontWeight: 'bold'
                }}>
                    {connected ? '🟢 Online' : '🔴 Offline'}
                </div>
            </div>

            {/* Display */}
            <div style={{
                background: '#1a1a1a',
                color: '#00ff00',
                padding: '1rem',
                borderRadius: '8px',
                marginBottom: '1rem',
                fontFamily: 'monospace',
                fontSize: '2rem',
                textAlign: 'right',
                minHeight: '60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                position: 'relative'
            }}>
                {state.displayValue}
                {isAsyncLoading && (
                    <div style={{ 
                        position: 'absolute', 
                        top: '5px', 
                        left: '10px', 
                        fontSize: '1rem' 
                    }}>
                        ⏳ {functionResult?.methodName}
                    </div>
                )}
            </div>

            {/* Basic Calculator Buttons */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '0.5rem',
                marginBottom: '1rem'
            }}>
                <button onClick={handleClear} style={buttonStyle('#ef4444')}>C</button>
                <button onClick={() => handleOperation('÷')} style={buttonStyle('#f59e0b')}>÷</button>
                <button onClick={() => handleOperation('×')} style={buttonStyle('#f59e0b')}>×</button>
                <button onClick={() => handleOperation('-')} style={buttonStyle('#f59e0b')}>-</button>
                
                <button onClick={() => handleDigit('7')} style={buttonStyle('#6b7280')}>7</button>
                <button onClick={() => handleDigit('8')} style={buttonStyle('#6b7280')}>8</button>
                <button onClick={() => handleDigit('9')} style={buttonStyle('#6b7280')}>9</button>
                <button onClick={() => handleOperation('+')} style={buttonStyle('#f59e0b')}>+</button>
                
                <button onClick={() => handleDigit('4')} style={buttonStyle('#6b7280')}>4</button>
                <button onClick={() => handleDigit('5')} style={buttonStyle('#6b7280')}>5</button>
                <button onClick={() => handleDigit('6')} style={buttonStyle('#6b7280')}>6</button>
                <button 
                    onClick={handleEquals} 
                    style={{...buttonStyle('#10b981'), gridRow: 'span 2'}}
                >
                    =
                </button>
                
                <button onClick={() => handleDigit('1')} style={buttonStyle('#6b7280')}>1</button>
                <button onClick={() => handleDigit('2')} style={buttonStyle('#6b7280')}>2</button>
                <button onClick={() => handleDigit('3')} style={buttonStyle('#6b7280')}>3</button>
                
                <button onClick={() => handleDigit('0')} style={{...buttonStyle('#6b7280'), gridColumn: 'span 2'}}>0</button>
                <button onClick={() => handleDigit('.')} style={buttonStyle('#6b7280')}>.</button>
            </div>

            {/* Advanced Functions (ASYNC) */}
            <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem' }}>🔄 Async Functions:</h4>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '0.5rem',
                    marginBottom: '1rem'
                }}>
                    <button 
                        onClick={handleSquareRoot}
                        disabled={isAsyncLoading}
                        style={buttonStyle('#8b5cf6', isAsyncLoading)}
                    >
                        √ (2s async)
                    </button>
                    <button 
                        onClick={handleFactorial}
                        disabled={isAsyncLoading}
                        style={buttonStyle('#ec4899', isAsyncLoading)}
                    >
                        n! (async)
                    </button>
                    <button 
                        onClick={handleSafeDivision}
                        disabled={isAsyncLoading}
                        style={buttonStyle('#f59e0b', isAsyncLoading)}
                    >
                        ÷ (sync)
                    </button>
                </div>

                {/* Expression Validation */}
                <div style={{ marginBottom: '0.5rem' }}>
                    <input
                        type="text"
                        placeholder="Enter expression to validate..."
                        value={validationInput}
                        onChange={(e) => setValidationInput(e.target.value)}
                        disabled={isAsyncLoading}
                        style={{
                            width: '70%',
                            padding: '0.5rem',
                            borderRadius: '4px',
                            border: '1px solid #d1d5db',
                            marginRight: '0.5rem'
                        }}
                    />
                    <button 
                        onClick={handleValidateExpression}
                        disabled={isAsyncLoading || !validationInput.trim()}
                        style={buttonStyle('#06b6d4', isAsyncLoading)}
                    >
                        Validate
                    </button>
                </div>
            </div>

            {/* Async Results */}
            {asyncResults.length > 0 && (
                <div style={{
                    background: '#f3f4f6',
                    borderRadius: '8px',
                    padding: '1rem',
                    marginBottom: '1rem'
                }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem' }}>📋 Async Results:</h4>
                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {asyncResults.slice(-5).reverse().map((result, index) => (
                            <div key={index} style={{
                                background: result.error ? '#fef2f2' : '#f0f9ff',
                                border: `1px solid ${result.error ? '#fecaca' : '#bfdbfe'}`,
                                borderRadius: '4px',
                                padding: '0.5rem',
                                marginBottom: '0.5rem',
                                fontSize: '0.875rem'
                            }}>
                                {result.error ? (
                                    <div>
                                        <strong>❌ {result.type}:</strong> {result.error}
                                    </div>
                                ) : (
                                    <div>
                                        <strong>✅ {result.type}:</strong> {result.message}
                                        {result.steps && (
                                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                                Steps: {result.steps.slice(-3).join(' → ')}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Function Error Display */}
            {functionError && (
                <div style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '8px',
                    padding: '0.75rem',
                    color: '#991b1b',
                    fontSize: '0.875rem',
                    marginBottom: '1rem'
                }}>
                    ❌ Function Error ({functionResult?.methodName}): {functionError}
                </div>
            )}

            {/* Connection Error Display */}
            {error && (
                <div style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '8px',
                    padding: '0.75rem',
                    color: '#991b1b',
                    fontSize: '0.875rem',
                    marginTop: '1rem'
                }}>
                    ❌ Connection Error: {error}
                </div>
            )}

            {/* Function Result Debug */}
            {functionResult && (
                <div style={{
                    background: '#f0f9ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '8px',
                    padding: '0.75rem',
                    fontSize: '0.75rem',
                    color: '#1e40af',
                    marginTop: '1rem'
                }}>
                    <strong>Last Function Call:</strong><br/>
                    Method: {functionResult.methodName}<br/>
                    Type: {functionResult.isAsync ? 'Async' : 'Sync'}<br/>
                    Loading: {functionResult.isLoading ? 'Yes' : 'No'}<br/>
                    {functionResult.result && <span>Result: {JSON.stringify(functionResult.result)}<br/></span>}
                    {functionResult.error && <span style={{color: '#dc2626'}}>Error: {functionResult.error}<br/></span>}
                </div>
            )}
        </div>
    )
}

const buttonStyle = (backgroundColor: string, disabled?: boolean) => ({
    padding: '1rem',
    border: 'none',
    borderRadius: '8px',
    backgroundColor: disabled ? '#e5e7eb' : backgroundColor,
    color: 'white',
    fontWeight: 'bold',
    fontSize: '1rem',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'opacity 0.2s'
})