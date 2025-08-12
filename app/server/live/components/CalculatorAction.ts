import { LiveAction } from '@/core/live'

export class CalculatorAction extends LiveAction {
    public displayValue = "0"
    public result = 0
    public operation = ""
    public waitingForOperand = false
    
    // Estado inicial
    getInitialState(props: any) {
        return {
            displayValue: "0",
            result: 0,
            operation: "",
            waitingForOperand: false
        }
    }
    
    // Função SÍNCRONA - Adicionar dígito
    addDigit(digit: string): string {
        if (this.waitingForOperand) {
            this.displayValue = digit
            this.waitingForOperand = false
        } else {
            this.displayValue = this.displayValue === "0" ? digit : this.displayValue + digit
        }
        
        console.log(`🧮 Added digit ${digit}, display: ${this.displayValue}`)
        
        // Retorna o valor atual (síncrono)
        return this.displayValue
    }
    
    // Função SÍNCRONA - Operações básicas
    setOperation(nextOperation: string): { operation: string, result: number } {
        const inputValue = parseFloat(this.displayValue)
        
        if (this.result === 0) {
            this.result = inputValue
        } else if (this.operation) {
            const currentResult = this.calculate(this.result, inputValue, this.operation)
            this.displayValue = String(currentResult)
            this.result = currentResult
        }
        
        this.waitingForOperand = true
        this.operation = nextOperation
        
        console.log(`🧮 Set operation ${nextOperation}, result: ${this.result}`)
        
        return {
            operation: this.operation,
            result: this.result
        }
    }
    
    // Função SÍNCRONA - Calcular resultado básico
    calculate(firstOperand: number, secondOperand: number, operation: string): number {
        switch (operation) {
            case "+":
                return firstOperand + secondOperand
            case "-":
                return firstOperand - secondOperand
            case "×":
                return firstOperand * secondOperand
            case "÷":
                if (secondOperand === 0) {
                    throw new Error("Division by zero is not allowed")
                }
                return firstOperand / secondOperand
            default:
                return secondOperand
        }
    }
    
    // Função SÍNCRONA - Validar e dividir (pode dar erro)
    safeDivision(dividend?: number, divisor?: number): { result: number, message: string } {
        const a = dividend !== undefined ? dividend : parseFloat(this.displayValue)
        const b = divisor !== undefined ? divisor : this.result
        
        if (isNaN(a) || isNaN(b)) {
            throw new Error("Invalid numbers provided for division")
        }
        
        if (b === 0) {
            throw new Error("Cannot divide by zero!")
        }
        
        const result = a / b
        this.displayValue = String(result)
        this.result = result
        this.waitingForOperand = true
        
        return {
            result,
            message: `${a} ÷ ${b} = ${result}`
        }
    }
    
    // Função SÍNCRONA - Igual
    equals(): { result: number, displayValue: string } {
        const inputValue = parseFloat(this.displayValue)
        
        if (this.operation && !this.waitingForOperand) {
            this.result = this.calculate(this.result, inputValue, this.operation)
            this.displayValue = String(this.result)
            this.operation = ""
            this.waitingForOperand = true
        }
        
        console.log(`🧮 Equals result: ${this.result}`)
        
        return {
            result: this.result,
            displayValue: this.displayValue
        }
    }
    
    // Função SÍNCRONA - Limpar
    clear(): string {
        this.displayValue = "0"
        this.result = 0
        this.operation = ""
        this.waitingForOperand = false
        
        console.log(`🧮 Calculator cleared`)
        
        return this.displayValue
    }
    
    // Função ASSÍNCRONA - Calcular raiz quadrada (simula operação complexa)
    async calculateSquareRoot(): Promise<{ result: number, message: string }> {
        console.log(`🧮 Starting async square root calculation for: ${this.displayValue}`)
        
        const value = parseFloat(this.displayValue)
        
        // Simula processamento assíncrono (ex: consulta a API, cálculo complexo)
        await new Promise(resolve => setTimeout(resolve, 2000)) // 2 segundos
        
        if (value < 0) {
            throw new Error("Cannot calculate square root of negative number")
        }
        
        const result = Math.sqrt(value)
        this.displayValue = String(result)
        this.result = result
        this.waitingForOperand = true
        
        const message = `Square root of ${value} is ${result}`
        console.log(`🧮 Async square root completed: ${message}`)
        
        this.emit('calculation-completed', {
            operation: 'sqrt',
            input: value,
            result,
            message
        })
        
        return { result, message }
    }
    
    // Função ASSÍNCRONA - Calcular fatorial (simula operação pesada)
    async calculateFactorial(): Promise<{ result: number, message: string, steps: number[] }> {
        console.log(`🧮 Starting async factorial calculation for: ${this.displayValue}`)
        
        const value = parseInt(this.displayValue)
        
        if (value < 0 || !Number.isInteger(value)) {
            throw new Error("Factorial only works with non-negative integers")
        }
        
        if (value > 20) {
            throw new Error("Factorial too large (max 20)")
        }
        
        const steps: number[] = []
        let result = 1
        
        // Simula cálculo assíncrono com steps
        for (let i = 1; i <= value; i++) {
            await new Promise(resolve => setTimeout(resolve, 200)) // 200ms por step
            result *= i
            steps.push(result)
        }
        
        this.displayValue = String(result)
        this.result = result
        this.waitingForOperand = true
        
        const message = `Factorial of ${value} is ${result}`
        console.log(`🧮 Async factorial completed: ${message}`)
        
        this.emit('calculation-completed', {
            operation: 'factorial',
            input: value,
            result,
            message,
            steps
        })
        
        return { result, message, steps }
    }
    
    // Função ASSÍNCRONA - Validar expressão matemática via API externa (mock)
    async validateExpression(expression: string): Promise<{ isValid: boolean, suggestion?: string }> {
        console.log(`🧮 Validating expression: ${expression}`)
        
        // Simula chamada para API externa
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        // Mock validation logic
        const hasValidChars = /^[0-9+\-×÷().\s]+$/.test(expression)
        const hasBalancedParens = (expression.match(/\(/g)?.length || 0) === (expression.match(/\)/g)?.length || 0)
        
        const isValid = hasValidChars && hasBalancedParens
        
        const result = {
            isValid,
            suggestion: isValid ? undefined : "Check parentheses and use only numbers and operators (+, -, ×, ÷)"
        }
        
        console.log(`🧮 Expression validation result:`, result)
        
        this.emit('expression-validated', {
            expression,
            ...result
        })
        
        return result
    }
}

// Auto-register no sistema
LiveAction.add(CalculatorAction)