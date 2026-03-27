import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="glass-panel p-6 rounded-2xl max-w-sm w-full">
            <h2 className="text-xl heading-primary text-red-400 mb-2">Something went wrong</h2>
            <p className="text-sm text-secondary mb-4">
              An error occurred while loading the application.
            </p>
            <pre className="text-xs bg-black/20 p-3 rounded-xl overflow-auto text-white/60 mb-4 max-h-40">
              {this.state.error?.message}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="glass-button w-full py-2.5 rounded-xl text-sm font-medium"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
