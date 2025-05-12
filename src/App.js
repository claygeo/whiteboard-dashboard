import React, { useState, useEffect, Component } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import './App.css';

class ErrorBoundary extends Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div>
          <h1>Something went wrong.</h1>
          <p>{this.state.error?.message}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const checkAuth = () => {
    const line = localStorage.getItem('line');
    const lineLead = localStorage.getItem('lineLead');
    console.log('App.js checkAuth - line:', line, 'lineLead:', lineLead);
    const authenticated = !!(line && lineLead);
    setIsAuthenticated(authenticated);
    return authenticated;
  };

  const handleAuthChange = () => {
    const authenticated = checkAuth();
    if (authenticated) {
      navigate('/dashboard', { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  };

  useEffect(() => {
    console.log('Clearing localStorage on app launch');
    localStorage.removeItem('line');
    localStorage.removeItem('lineLead');
    setIsAuthenticated(false);
    navigate('/', { replace: true });
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const logActiveElement = () => {
      console.log('Active element:', document.activeElement);
    };

    const handleWindowFocus = () => {
      console.log('Window gained focus');
      const input = document.getElementById('batchNumberInput');
      if (input) {
        input.focus();
        console.log('Forced focus on batchNumberInput:', document.activeElement);
      }
    };

    window.addEventListener('focusin', logActiveElement);
    window.addEventListener('click', logActiveElement);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      window.removeEventListener('focusin', logActiveElement);
      window.removeEventListener('click', logActiveElement);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, []);

  console.log('App.js rendering, isLoading:', isLoading);
  if (isLoading) {
    return <div>Loading...</div>;
  }

  console.log('Rendering Routes');
  return (
    <ErrorBoundary>
      <Routes>
        <Route
          path="/"
          element={<Login onAuthChange={handleAuthChange} />}
        />
        <Route
          path="/dashboard"
          element={
            isAuthenticated ? (
              <Dashboard
                onLogout={() => {
                  localStorage.removeItem('line');
                  localStorage.removeItem('lineLead');
                  setIsAuthenticated(false);
                  navigate('/', { replace: true });
                }}
              />
            ) : (
              <Login onAuthChange={handleAuthChange} />
            )
          }
        />
      </Routes>
    </ErrorBoundary>
  );
};

export default App;