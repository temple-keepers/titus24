import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--color-bg)' }}>
          <div className="card max-w-md w-full text-center space-y-6 py-12">
            <AlertTriangle
              size={64}
              style={{ color: 'var(--color-brand)', margin: '0 auto' }}
            />
            <div>
              <h1 className="font-display text-2xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
                Something went wrong
              </h1>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                We're sorry for the inconvenience. Please try refreshing the page.
              </p>
            </div>
            {this.state.error && (
              <details className="text-left">
                <summary className="text-xs cursor-pointer" style={{ color: 'var(--color-text-muted)' }}>
                  Technical details
                </summary>
                <pre className="text-xs mt-2 p-3 rounded-lg overflow-auto" style={{
                  background: 'var(--color-bg-raised)',
                  color: 'var(--color-text-secondary)',
                  maxHeight: '200px',
                }}>
                  {this.state.error.toString()}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
            <button
              className="btn btn-primary btn-lg"
              onClick={this.handleReset}
            >
              <RefreshCw size={18} /> Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
