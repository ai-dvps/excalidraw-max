import React, { Component, ReactNode } from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onRetry?: () => void;
}

/**
 * ErrorBoundary component that catches React component errors
 * and displays a fallback UI with retry option.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
    if (this.props.onRetry) {
      this.props.onRetry();
    } else {
      // Default retry behavior: reload the window
      window.location.reload();
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return <ErrorFallback error={this.state.error} onRetry={this.handleRetry} />;
    }
    return this.props.children;
  }
}

/**
 * ErrorFallback component displayed when an error occurs.
 * Provides user-friendly error message with retry button.
 */
interface ErrorFallbackProps {
  error: Error | null;
  onRetry: () => void;
}

function ErrorFallback({ onRetry }: ErrorFallbackProps): ReactNode {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        width: '100%',
        padding: '20px',
        textAlign: 'center',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: '400px',
          padding: '24px',
          borderRadius: '12px',
          backgroundColor: '#f5f5f5',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        }}
      >
        <h2
          style={{
            margin: '0 0 16px 0',
            color: '#333',
            fontSize: '18px',
            fontWeight: 600,
          }}
        >
          Something went wrong
        </h2>
        <p
          style={{
            margin: '0 0 20px 0',
            color: '#666',
            fontSize: '14px',
            lineHeight: 1.5,
          }}
        >
          Failed to load the drawing canvas. Please try again.
        </p>
        <button
          onClick={onRetry}
          style={{
            padding: '10px 24px',
            fontSize: '14px',
            fontWeight: 500,
            color: '#fff',
            backgroundColor: '#4a90d9',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'background-color 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#3a7bc8';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#4a90d9';
          }}
        >
          Retry
        </button>
      </div>
    </div>
  );
}

export default ErrorBoundary;
