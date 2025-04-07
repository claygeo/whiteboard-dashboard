import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Login.css';

const Login = ({ onAuthChange }) => {
    const [line, setLine] = useState('');
    const [lineLead, setLineLead] = useState('');
    const navigate = useNavigate();

    const lines = ['Line 1', 'Line 2', 'Line 3', 'Line 4', 'Line 5', 'Line 6', 'Line 7', 'Line 8', 'Line 9', 'Line 10', 'Admin'];
    const lineLeads = ['Susana Cebalos', 'Lay Blanco', 'Ana Fernandez', 'Belkis Carballo', 'Delia Da Silva', 'Yanet Pesqueria'];

    const handleLogin = () => {
        if (line && lineLead) {
            localStorage.setItem('line', line);
            localStorage.setItem('lineLead', lineLead);
            console.log('Login successful, navigating to /dashboard');
            onAuthChange();
            // Add a small delay to ensure state updates before navigation
            setTimeout(() => {
                navigate('/dashboard', { replace: true });
            }, 100);
        } else {
            alert('Please select both Line and Line Lead.');
        }
    };

    const handleCancel = () => {
        setLine('');
        setLineLead('');
    };

    return (
        <div className="login-container">
            <div className="login-window">
                <div className="login-title-bar">
                    <span>Login</span>
                </div>
                <div className="login-content">
                    <img src="/assets/curaleaf.png" alt="Curaleaf Logo" className="curaleaf-logo" />
                    <div className="form-group">
                        <label>Line:</label>
                        <select value={line} onChange={(e) => setLine(e.target.value)}>
                            <option value="">Select Line</option>
                            {lines.map((l) => (
                                <option key={l} value={l}>{l}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Line Lead:</label>
                        <select value={lineLead} onChange={(e) => setLineLead(e.target.value)}>
                            <option value="">Select Line Lead</option>
                            {lineLeads.map((ll) => (
                                <option key={ll} value={ll}>{ll}</option>
                            ))}
                        </select>
                    </div>
                    <div className="button-group">
                        <button onClick={handleLogin}>Login</button>
                        <button onClick={handleCancel}>Cancel</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;