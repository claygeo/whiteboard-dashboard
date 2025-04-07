import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/LineLeadPopup.css';

const LineLeadPopup = () => {
    const [line, setLine] = useState('');
    const [lineLead, setLineLead] = useState('');
    const navigate = useNavigate();

    const lines = ['Line 1', 'Line 2', 'Line 3', 'Line 4', 'Line 5', 'Line 6', 'Line 7', 'Line 8', 'Line 9', 'Line 10', 'Admin'];
    const lineLeads = ['Susana Cebalos', 'Lay Blanco', 'Ana Fernandez', 'Belkis Carballo', 'Delia Da Silva', 'Yanet Pesqueria'];

    const handleSubmit = () => {
        if (line && lineLead) {
            localStorage.setItem('line', line);
            localStorage.setItem('lineLead', lineLead);
            navigate('/dashboard');
        } else {
            alert('Please select both Line and Line Lead.');
        }
    };

    return (
        <div className="line-lead-popup">
            <h3>Select Line and Line Lead</h3>
            <div>
                <label>Line:</label>
                <select value={line} onChange={(e) => setLine(e.target.value)}>
                    <option value="">Select Line</option>
                    {lines.map((l) => (
                        <option key={l} value={l}>{l}</option>
                    ))}
                </select>
            </div>
            <div>
                <label>Line Lead:</label>
                <select value={lineLead} onChange={(e) => setLineLead(e.target.value)}>
                    <option value="">Select Line Lead</option>
                    {lineLeads.map((ll) => (
                        <option key={ll} value={ll}>{ll}</option>
                    ))}
                </select>
            </div>
            <button onClick={handleSubmit}>Submit</button>
        </div>
    );
};

export default LineLeadPopup;