import React from 'react';

export function UI({ gravity, setGravity, onReset }) {
    return (
        <div style={{
            position: 'absolute',
            top: 20,
            left: 20,
            color: 'white',
            zIndex: 10,
            fontFamily: 'sans-serif',
            backgroundColor: 'rgba(0,0,0,0.5)',
            padding: '20px',
            borderRadius: '8px',
            backdropFilter: 'blur(5px)'
        }}>
            <h1 style={{ margin: '0 0 10px 0', fontSize: '1.2rem' }}>Gravity Sandbox</h1>

            <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>
                    Gravity (G): {gravity.toFixed(2)}
                </label>
                <input
                    type="range"
                    min="0.01"
                    max="1.0"
                    step="0.01"
                    value={gravity}
                    onChange={(e) => setGravity(parseFloat(e.target.value))}
                    style={{ width: '100%', cursor: 'pointer' }}
                />
            </div>

            <button
                onClick={onReset}
                style={{
                    background: 'white',
                    color: 'black',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    width: '100%'
                }}
                onMouseOver={(e) => e.target.style.background = '#ddd'}
                onMouseOut={(e) => e.target.style.background = 'white'}
            >
                Reset Simulation
            </button>
        </div>
    );
}
