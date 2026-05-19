import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Chart Error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    padding: '20px',
                    textAlign: 'center',
                    color: 'var(--text-secondary, #64748b)',
                    background: 'var(--bg-secondary, #f8fafc)',
                    borderRadius: '12px',
                    border: '1px dashed var(--border-color, #e2e8f0)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: this.props.height || '300px'
                }}>
                    <svg style={{ width: '40px', height: '40px', marginBottom: '10px', color: '#ef4444' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p style={{ margin: 0, fontWeight: 500 }}>Vizuallashdagi xatolik</p>
                    <p style={{ margin: '4px 0 0', fontSize: '13px' }}>Ma'lumotlar bu komponent uchun to'g'ri shaklda kelmadi.</p>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
