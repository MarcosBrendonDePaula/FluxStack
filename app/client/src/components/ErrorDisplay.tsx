import React from 'react'
import { ClientAPIError } from '../lib/errors'
import { getErrorMessage, isRetryableError } from '../lib/eden-api'

interface ErrorDisplayProps {
  error: Error | null
  onRetry?: () => void
  onDismiss?: () => void
  showRetryButton?: boolean
  showDismissButton?: boolean
  className?: string
  variant?: 'inline' | 'toast' | 'modal'
}

export function ErrorDisplay({
  error,
  onRetry,
  onDismiss,
  showRetryButton = true,
  showDismissButton = true,
  className = '',
  variant = 'inline'
}: ErrorDisplayProps) {
  if (!error) return null

  const errorMessage = getErrorMessage(error)
  const canRetry = isRetryableError(error)
  const isClientError = error instanceof ClientAPIError

  const baseClasses = {
    inline: 'error-display error-display--inline',
    toast: 'error-display error-display--toast',
    modal: 'error-display error-display--modal'
  }

  const severityClass = isClientError && error.statusCode >= 500 
    ? 'error-display--severe' 
    : 'error-display--warning'

  return (
    <div className={`${baseClasses[variant]} ${severityClass} ${className}`}>
      <div className="error-display__content">
        <div className="error-display__icon">
          {isClientError && error.statusCode >= 500 ? '⚠️' : '❌'}
        </div>
        
        <div className="error-display__message">
          <p className="error-display__text">{errorMessage}</p>
          
          {isClientError && error.correlationId && (
            <p className="error-display__correlation">
              Reference ID: {error.correlationId}
            </p>
          )}
        </div>
        
        <div className="error-display__actions">
          {showRetryButton && canRetry && onRetry && (
            <button 
              onClick={onRetry}
              className="error-display__button error-display__button--retry"
            >
              Try Again
            </button>
          )}
          
          {showDismissButton && onDismiss && (
            <button 
              onClick={onDismiss}
              className="error-display__button error-display__button--dismiss"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Toast notification component for errors
interface ErrorToastProps {
  error: Error | null
  onRetry?: () => void
  onDismiss?: () => void
  autoHide?: boolean
  hideDelay?: number
}

export function ErrorToast({
  error,
  onRetry,
  onDismiss,
  autoHide = true,
  hideDelay = 5000
}: ErrorToastProps) {
  const [isVisible, setIsVisible] = React.useState(!!error)

  React.useEffect(() => {
    if (error) {
      setIsVisible(true)
      
      if (autoHide && !isRetryableError(error)) {
        const timer = setTimeout(() => {
          setIsVisible(false)
          onDismiss?.()
        }, hideDelay)
        
        return () => clearTimeout(timer)
      }
    } else {
      setIsVisible(false)
    }
  }, [error, autoHide, hideDelay, onDismiss])

  if (!isVisible || !error) return null

  return (
    <div className="error-toast-container">
      <ErrorDisplay
        error={error}
        onRetry={onRetry}
        onDismiss={() => {
          setIsVisible(false)
          onDismiss?.()
        }}
        variant="toast"
        showDismissButton={true}
      />
    </div>
  )
}

// Inline error component for forms
interface InlineErrorProps {
  error: Error | null
  field?: string
  className?: string
}

export function InlineError({ error, field, className = '' }: InlineErrorProps) {
  if (!error) return null

  // Check if error is related to specific field
  const isFieldError = error instanceof ClientAPIError && 
    error.details?.field === field

  if (field && !isFieldError) return null

  const errorMessage = getErrorMessage(error)

  return (
    <div className={`inline-error ${className}`}>
      <span className="inline-error__icon">⚠️</span>
      <span className="inline-error__message">{errorMessage}</span>
    </div>
  )
}

// Loading state with error fallback
interface LoadingWithErrorProps {
  loading: boolean
  error: Error | null
  onRetry?: () => void
  children: React.ReactNode
  loadingComponent?: React.ReactNode
  errorComponent?: React.ReactNode
}

export function LoadingWithError({
  loading,
  error,
  onRetry,
  children,
  loadingComponent,
  errorComponent
}: LoadingWithErrorProps) {
  if (loading) {
    return loadingComponent || (
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  if (error) {
    return errorComponent || (
      <ErrorDisplay
        error={error}
        onRetry={onRetry}
        variant="inline"
      />
    )
  }

  return <>{children}</>
}

// Error summary component for multiple errors
interface ErrorSummaryProps {
  errors: Error[]
  onRetryAll?: () => void
  onDismissAll?: () => void
  maxVisible?: number
}

export function ErrorSummary({
  errors,
  onRetryAll,
  onDismissAll,
  maxVisible = 3
}: ErrorSummaryProps) {
  if (errors.length === 0) return null

  const visibleErrors = errors.slice(0, maxVisible)
  const hiddenCount = errors.length - maxVisible

  return (
    <div className="error-summary">
      <div className="error-summary__header">
        <h3>Multiple Errors Occurred ({errors.length})</h3>
        
        <div className="error-summary__actions">
          {onRetryAll && (
            <button onClick={onRetryAll} className="error-summary__button">
              Retry All
            </button>
          )}
          {onDismissAll && (
            <button onClick={onDismissAll} className="error-summary__button">
              Dismiss All
            </button>
          )}
        </div>
      </div>
      
      <div className="error-summary__list">
        {visibleErrors.map((error, index) => (
          <div key={index} className="error-summary__item">
            <ErrorDisplay
              error={error}
              variant="inline"
              showRetryButton={false}
              showDismissButton={false}
            />
          </div>
        ))}
        
        {hiddenCount > 0 && (
          <div className="error-summary__more">
            +{hiddenCount} more errors
          </div>
        )}
      </div>
    </div>
  )
}