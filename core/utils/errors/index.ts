export class FluxStackError extends Error {
  public readonly code: string
  public readonly statusCode: number
  public readonly context?: any
  public readonly timestamp: Date

  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    context?: any
  ) {
    super(message)
    this.name = 'FluxStackError'
    this.code = code
    this.statusCode = statusCode
    this.context = context
    this.timestamp = new Date()
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      context: this.context,
      timestamp: this.timestamp,
      stack: this.stack
    }
  }
}

export class ValidationError extends FluxStackError {
  constructor(message: string, context?: any) {
    super(message, 'VALIDATION_ERROR', 400, context)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends FluxStackError {
  constructor(resource: string, context?: any) {
    super(`${resource} not found`, 'NOT_FOUND', 404, context)
    this.name = 'NotFoundError'
  }
}

export class UnauthorizedError extends FluxStackError {
  constructor(message: string = 'Unauthorized', context?: any) {
    super(message, 'UNAUTHORIZED', 401, context)
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends FluxStackError {
  constructor(message: string = 'Forbidden', context?: any) {
    super(message, 'FORBIDDEN', 403, context)
    this.name = 'ForbiddenError'
  }
}

export class ConflictError extends FluxStackError {
  constructor(message: string, context?: any) {
    super(message, 'CONFLICT', 409, context)
    this.name = 'ConflictError'
  }
}

export class InternalServerError extends FluxStackError {
  constructor(message: string = 'Internal server error', context?: any) {
    super(message, 'INTERNAL_SERVER_ERROR', 500, context)
    this.name = 'InternalServerError'
  }
}

export class ServiceUnavailableError extends FluxStackError {
  constructor(message: string = 'Service unavailable', context?: any) {
    super(message, 'SERVICE_UNAVAILABLE', 503, context)
    this.name = 'ServiceUnavailableError'
  }
}