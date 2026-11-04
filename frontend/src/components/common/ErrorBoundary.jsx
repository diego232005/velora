import { Component } from 'react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || 'Error inesperado' };
  }

  componentDidCatch(error, info) {
    console.error('[Velora UI]', error, info?.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          style={{
            margin: '2rem auto',
            maxWidth: 480,
            padding: '1.5rem',
            borderRadius: 16,
            border: '1px solid rgba(255,92,108,0.4)',
            background: 'rgba(12,16,24,0.9)',
            color: '#eef3f8',
            fontFamily: 'Rajdhani, sans-serif',
          }}
        >
          <h2 style={{ fontFamily: 'Orbitron, sans-serif', marginTop: 0 }}>
            Algo falló en la interfaz
          </h2>
          <p style={{ opacity: 0.8 }}>{this.state.message}</p>
          <button
            type="button"
            onClick={() => window.location.assign('/')}
            style={{
              marginTop: '1rem',
              padding: '0.75rem 1.25rem',
              borderRadius: 10,
              border: 'none',
              background: 'linear-gradient(135deg,#b8f53d,#3ef0ff)',
              color: '#0a1004',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Volver al inicio
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
