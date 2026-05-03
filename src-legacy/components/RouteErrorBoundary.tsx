import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class RouteErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Route error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="card max-w-sm w-full text-center space-y-4 py-8">
            <AlertTriangle
              size={48}
              style={{ color: 'var(--color-brand)', margin: '0 auto' }}
            />
            <div>
              <h2 className="font-display text-xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>
                This page had a problem
              </h2>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                Something went wrong loading this page. You can try again or go back home.
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
                  maxHeight: '150px',
                }}>
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
            <div className="flex gap-3 justify-center">
              <button
                className="btn btn-primary"
                onClick={this.handleRetry}
              >
                <RefreshCw size={16} /> Try Again
              </button>
              <a
                href="#/"
                className="btn btn-secondary"
              >
                <Home size={16} /> Go Home
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
