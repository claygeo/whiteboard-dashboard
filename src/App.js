import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

const App = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const checkAuth = () => {
        const line = localStorage.getItem('line');
        const lineLead = localStorage.getItem('lineLead');
        console.log('App.js checkAuth - line:', line, 'lineLead:', lineLead);
        if (line && lineLead) {
            setIsAuthenticated(true);
        } else {
            setIsAuthenticated(false);
        }
    };

    useEffect(() => {
        // Check authentication state on mount
        checkAuth();
        // Debug focus issues by logging active element
        const handleFocusChange = () => {
            console.log('Active element:', document.activeElement);
        };
        document.addEventListener('focusin', handleFocusChange);
        return () => document.removeEventListener('focusin', handleFocusChange);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('line');
        localStorage.removeItem('lineLead');
        setIsAuthenticated(false);
    };

    return (
        <Router>
            <Routes>
                <Route
                    path="/"
                    element={
                        isAuthenticated ? (
                            <Navigate to="/dashboard" replace />
                        ) : (
                            <Login onAuthChange={checkAuth} />
                        )
                    }
                />
                <Route
                    path="/dashboard"
                    element={
                        isAuthenticated ? (
                            <Dashboard onLogout={handleLogout} />
                        ) : (
                            <Navigate to="/" replace />
                        )
                    }
                />
            </Routes>
        </Router>
    );
};

export default App;