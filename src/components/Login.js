import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// import '../styles/Login.css';

const Login = ({ onAuthChange }) => {
  const [line, setLine] = useState('');
  const navigate = useNavigate();

  const handleLogin = () => {
    if (line) {
      localStorage.setItem('line', line);
      console.log('Login successful, navigating to /dashboard');
      onAuthChange();
      navigate('/dashboard', { replace: true });
    } else {
      alert('Please select a Line.');
    }
  };

  console.log('Rendering Login component');
  return (
    <div style={{
      backgroundColor: '#d4d4d4',
      padding: '15px',
      border: '1px solid #999',
      width: '300px',
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1>Login</h1>
      <input
        type="text"
        value={line}
        onChange={(e) => setLine(e.target.value)}
        placeholder="Enter Line"
        style={{ padding: '5px', width: '100%', marginBottom: '10px' }}
      />
      <button
        onClick={handleLogin}
        style={{ padding: '5px 10px', backgroundColor: '#007bff', color: 'white', border: 'none' }}
      >
        Login
      </button>
    </div>
  );
};

export default Login;