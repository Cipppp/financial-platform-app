'use client'

import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-64 p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-4">
            An unexpected error occurred. Please try refreshing the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

// Simple loading component
export const LoadingSpinner = ({ message = 'Loading...' }: { message?: string }) => (
  <div className="flex items-center justify-center min-h-32 p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-black" />
    <span className="ml-3 text-gray-600">{message}</span>
  </div>
)

// Error display component
export const ErrorDisplay = ({ 
  message = 'Something went wrong', 
  onRetry 
}: { 
  message?: string
  onRetry?: () => void 
}) => (
  <div className="flex flex-col items-center justify-center min-h-32 p-8 text-center">
    <AlertTriangle className="w-8 h-8 text-red-500 mb-3" />
    <p className="text-gray-600 mb-4">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
      >
        Try Again
      </button>
    )}
  </div>
)