import React from 'react';

export class SimpleErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', background: '#fee2e2', color: '#991b1b', borderRadius: '12px', margin: '20px' }}>
          <h2>Component Crashed!</h2>
          <pre style={{ fontSize: '11px', whiteSpace: 'pre-wrap' }}>
            {this.state.error && this.state.error.toString()}
          </pre>
          <button onClick={() => this.setState({ hasError: false })} style={{ marginTop: '10px' }}>Retry</button>
        </div>
      );
    }
    return this.props.children;
  }
}
