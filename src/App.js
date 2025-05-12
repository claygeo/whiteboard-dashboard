import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import './App.css';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
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
    // Clear localStorage on app launch to enforce login
    console.log('Clearing localStorage on app launch');
    localStorage.removeItem('line');
    localStorage.removeItem('lineLead');
    setIsAuthenticated(false);
    navigate('/', { replace: true });
  }, [navigate]);

  useEffect(() => {
    const logActiveElement = () => {
      console.log('Active element:', document.activeElement);
    };

    window.addEventListener('focusin', logActiveElement);
    window.addEventListener('click', logActiveElement);

    return () => {
      window.removeEventListener('focusin', logActiveElement);
      window.removeEventListener('click', logActiveElement);
    };
  }, []);

  return (
    <Routes>
      <Route
        path="/"
        element={<Login onAuthChange={handleAuthChange} />}
      />
      <Route
        path="/dashboard"
        element={
          isAuthenticated ? (
            <Dashboard onLogout={() => {
              localStorage.removeItem('line');
              localStorage.removeItem('lineLead');
              setIsAuthenticated(false);
              navigate('/', { replace: true });
            }} />
          ) : (
            <Login onAuthChange={handleAuthChange} />
          )
        }
      />
    </Routes>
  );
};

export default App;