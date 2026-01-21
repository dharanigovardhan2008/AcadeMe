import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '2rem', color: 'red', background: '#1a1a1a', minHeight: '100vh', fontFamily: 'monospace' }}>
                    <h1>Something went wrong.</h1>
                    <div style={{ background: '#333', padding: '1rem', borderRadius: '8px', overflow: 'auto', maxHeight: '80vh', marginTop: '1rem' }}>
                        <h2 style={{ fontSize: '1.2rem', color: '#ff6b6b' }}>{this.state.error && this.state.error.toString()}</h2>
                        <pre style={{ fontSize: '0.8rem', color: '#ccc', whiteSpace: 'pre-wrap' }}>
                            {this.state.errorInfo && this.state.errorInfo.componentStack}
                        </pre>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        style={{ marginTop: '1rem', padding: '10px 20px', cursor: 'pointer', background: '#333', color: 'white', border: 'none' }}
                    >
                        Reload Page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
