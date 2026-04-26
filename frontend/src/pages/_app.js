import '../styles/globals.css';
import { Component as ReactComponent } from 'react';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import { Toaster } from 'react-hot-toast';

/* ── Global Error Boundary ── */
class ErrorBoundary extends ReactComponent {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('App error boundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif', padding: '2rem', textAlign: 'center',
          background: '#f8fafc'
        }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.75rem' }}>
            Something went wrong
          </h1>
          <p style={{ color: '#64748b', marginBottom: '1.5rem', maxWidth: 400 }}>
            {this.state.error?.message || 'An unexpected error occurred. Please refresh the page.'}
          </p>
          <button
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
            style={{
              padding: '0.75rem 1.5rem', background: '#2563eb', color: '#fff',
              border: 'none', borderRadius: '0.75rem', fontWeight: 600,
              cursor: 'pointer', fontSize: '1rem'
            }}
          >
            Refresh Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App({ Component, pageProps }) {
  const getLayout = Component.getLayout || ((page) => page);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              className: 'dark:bg-slate-800 dark:text-white',
              duration: 3000,
            }}
          />
          {getLayout(<Component {...pageProps} />)}
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
