import React, { Component, type ReactNode } from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo
    });

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Something went wrong</h2>
          <p className="text-red-700 mb-3">
            An error occurred in this component. The application will continue to work,
            but this section may not display correctly.
          </p>
          {this.state.error && (
            <details className="text-sm text-red-600">
              <summary className="cursor-pointer font-medium">Error Details</summary>
              <div className="mt-2 p-2 bg-red-100 rounded font-mono text-xs">
                <div className="font-semibold">Error: {this.state.error.message}</div>
                {this.state.errorInfo?.componentStack && (
                  <div className="mt-1">
                    <div className="font-semibold">Component Stack:</div>
                    <pre className="whitespace-pre-wrap">{this.state.errorInfo.componentStack}</pre>
                  </div>
                )}
              </div>
            </details>
          )}
          <button
            onClick={() => this.setState({ hasError: false, error: undefined, errorInfo: undefined })}
            className="mt-3 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}