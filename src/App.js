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
        // Clear localStorage on app start to force login
        localStorage.removeItem('line');
        localStorage.removeItem('lineLead');
        setIsAuthenticated(false);
        console.log('App.js: Cleared localStorage on start');
        // Optionally, you can call checkAuth() after clearing, but it’s not necessary since we know it’s cleared
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