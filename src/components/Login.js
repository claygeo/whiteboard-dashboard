import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// import '../styles/Login.css';

const Login = ({ onAuthChange }) => {
  const [line, setLine] = useState('');
  const [lineLead, setLineLead] = useState('');
  const navigate = useNavigate();

  const lines = [
    'Line 1', 'Line 2', 'Line 3', 'Line 4', 'Line 5', 'Line 6', 'Line 7', 'Line 8',
    'Line 9', 'Line 10', 'Line 11', 'Line 12', 'Line 13', 'Line 14', 'Line 15', 'Line 16'
  ];
  const lineLeads = [
    'Abelardo Podriguez', 'Adolfo Valdes', 'Belkis Carballo', 'Delia Da Silva', 'Dora Garza',
    'Lay Blanco', 'Lester Igarza', 'Maria Mendez', 'Samantha Perez-Morell', 'Susana Ceballos',
    'Yanet Pesqueria'
  ];

  const handleLogin = () => {
    if (line && lineLead) {
      localStorage.setItem('line', line);
      localStorage.setItem('lineLead', lineLead);
      console.log('Login successful, navigating to /dashboard');
      onAuthChange();
      navigate('/dashboard', { replace: true });
      if (window.electronAPI && window.electronAPI.focusWindow) {
        window.electronAPI.focusWindow();
      }
    } else {
      alert('Please select both Line and Line Lead.');
    }
  };

  const handleCancel = () => {
    setLine('');
    setLineLead('');
  };

  console.log('Rendering Login component');
  return (
    <div style={{
      backgroundColor: '#d4d4d4',
      padding: '15px',
      border: '1px solid #999',
      borderRadius: '3px',
      width: '300px',
      margin: 'auto',
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ textAlign: 'center' }}>Login</h1>
      {/* <img src="./assets/curaleaf.png" alt="Curaleaf Logo" style={{ width: '40px', display: 'block', margin: '0 auto 10px' }} /> */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <label style={{ width: '80px' }}>Line:</label>
        <select
          value={line}
          onChange={(e) => setLine(e.target.value)}
          style={{ flex: 1, padding: '4px', border: '1px solid #999', borderRadius: '2px' }}
        >
          <option value="">Select Line</option>
          {lines.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <label style={{ width: '80px' }}>Line Lead:</label>
        <select
          value={lineLead}
          onChange={(e) => setLineLead(e.target.value)}
          style={{ flex: 1, padding: '4px', border: '1px solid #999', borderRadius: '2px' }}
        >
          <option value="">Select Line Lead</option>
          {lineLeads.map((ll) => (
            <option key={ll} value={ll}>{ll}</option>
          ))}
        </select>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '5px' }}>
        <button
          onClick={handleLogin}
          style={{ padding: '4px 10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '2px' }}
        >
          Login
        </button>
        <button
          onClick={handleCancel}
          style={{ padding: '4px 10px', backgroundColor: '#c0c0c0', border: '1px solid #999', borderRadius: '2px' }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default Login;