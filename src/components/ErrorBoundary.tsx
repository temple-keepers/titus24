import { Component, type ErrorInfo, type ReactNode } from 'react';

interface State { error: Error | null }

export class ErrorBoundary extends Component<{ children: ReactNode; fallback?: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="mx-auto my-12 max-w-md rounded-3xl bg-surface border border-app p-6 text-center">
          <h2 className="font-display text-xl mb-2">Something went sideways, sister.</h2>
          <p className="text-sm text-app-muted mb-4">{this.state.error.message}</p>
          <button
            onClick={() => this.setState({ error: null })}
            className="rounded-2xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
