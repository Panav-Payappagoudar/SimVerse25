import React, { useState } from 'react';
import * as THREE from 'three';

export default function PlanetControlPanel({ isHost, addPlanet, addStar, bodiesRef, requestChange, onSimulationToggle, isSimulationRunning = true }) {
  const [mass, setMass] = useState(1);
  const [radius, setRadius] = useState(0.5);
  const [posX, setPosX] = useState(15);
  const [posY, setPosY] = useState(0);
  const [posZ, setPosZ] = useState(0);
  const [velX, setVelX] = useState(0);
  const [velY, setVelY] = useState(0);
  const [velZ, setVelZ] = useState(0);
  const [selectedBodyId, setSelectedBodyId] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const selectedBody = selectedBodyId 
    ? bodiesRef.current.find(b => b.id === selectedBodyId)
    : null;

  const handleAddPlanet = () => {
    addPlanet({
      mass,
      radius,
      pos: [posX, posY, posZ],
      vel: [velX, velY, velZ],
    });
    
    // Reset to defaults after adding
    setMass(1);
    setRadius(0.5);
    setPosX(15);
    setPosY(0);
    setPosZ(0);
    setVelX(0);
    setVelY(0);
    setVelZ(0);
  };

  const handleUpdateSelected = () => {
    if (!selectedBody) return;
    
    requestChange(selectedBody.id, 'tweak', {
      mass,
      radius,
    });
    
    requestChange(selectedBody.id, 'move', {
      pos: [posX, posY, posZ],
      vel: [velX, velY, velZ],
    });
  };

  const handleSelectBody = (bodyId) => {
    setSelectedBodyId(bodyId);
    const body = bodiesRef.current.find(b => b.id === bodyId);
    if (body) {
      setMass(body.mass);
      setRadius(body.radius);
      setPosX(body.position.x);
      setPosY(body.position.y);
      setPosZ(body.position.z);
      setVelX(body.velocity.x);
      setVelY(body.velocity.y);
      setVelZ(body.velocity.z);
    }
  };

  const handleDeleteSelected = () => {
    if (!selectedBody) return;
    requestChange(selectedBody.id, 'delete');
    setSelectedBodyId(null);
  };

  const sliderStyle = {
    width: '100%',
    marginBottom: '8px',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '12px',
    marginBottom: '4px',
    color: '#ccc',
  };

  const inputStyle = {
    width: '100%',
    marginBottom: '12px',
  };

  const buttonStyle = {
    padding: '8px 16px',
    margin: '4px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
  };

  const deleteButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#f44336',
  };

  const panelStyle = {
    position: 'absolute',
    right: isCollapsed ? '0' : '0',
    top: '50%',
    transform: 'translateY(-50%)',
    backgroundColor: 'rgba(20, 20, 20, 0.95)',
    padding: isCollapsed ? '10px' : '20px',
    borderRadius: '8px',
    border: '1px solid #444',
    color: 'white',
    minWidth: isCollapsed ? '40px' : '300px',
    maxHeight: '80vh',
    overflowY: 'auto',
    zIndex: 1000,
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
  };

  if (isCollapsed) {
    return (
      <div style={panelStyle}>
        <button 
          onClick={() => setIsCollapsed(false)}
          style={{ ...buttonStyle, width: '100%', margin: 0 }}
        >
          ▶
        </button>
      </div>
    );
  }

  return (
    <div style={panelStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3 style={{ margin: 0, fontSize: '16px' }}>Planet Controls</h3>
        <button 
          onClick={() => setIsCollapsed(true)}
          style={{ ...buttonStyle, padding: '4px 8px', margin: 0, backgroundColor: '#666' }}
        >
          ◀
        </button>
      </div>

      {!isHost && (
        <div style={{ padding: '10px', backgroundColor: '#333', borderRadius: '4px', marginBottom: '15px', fontSize: '12px' }}>
          Guest mode: You can view but only host can add planets
        </div>
      )}

      {/* Simulation Control */}
      <div style={{ marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #444' }}>
        <button
          onClick={onSimulationToggle}
          style={{
            ...buttonStyle,
            width: '100%',
            backgroundColor: isSimulationRunning ? '#f44336' : '#4CAF50',
            margin: 0,
            padding: '10px',
            fontSize: '14px',
            fontWeight: 'bold',
          }}
        >
          {isSimulationRunning ? '⏸ Pause' : '▶ Start'} Simulation
        </button>
      </div>

      {/* Existing Planets List */}
      {bodiesRef.current.length > 0 && (
        <div style={{ marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #444' }}>
          <label style={labelStyle}>Select Planet to Edit:</label>
          <select
            value={selectedBodyId || ''}
            onChange={(e) => handleSelectBody(e.target.value)}
            style={{ ...inputStyle, padding: '6px', backgroundColor: '#333', color: 'white', border: '1px solid #555' }}
          >
            <option value="">-- New Planet --</option>
            {bodiesRef.current.slice(1).map((body, idx) => (
              <option key={body.id} value={body.id}>
                Planet {idx + 1} (m:{body.mass.toFixed(2)}, r:{body.radius.toFixed(2)})
              </option>
            ))}
          </select>
          {selectedBody && (
            <button
              onClick={handleUpdateSelected}
              style={{ ...buttonStyle, width: '100%', margin: '8px 0 0 0' }}
            >
              Update Selected
            </button>
          )}
          {selectedBody && isHost && (
            <button
              onClick={handleDeleteSelected}
              style={{ ...deleteButtonStyle, width: '100%', margin: '4px 0 0 0' }}
            >
              Delete Selected
            </button>
          )}
        </div>
      )}

      {/* Planet Properties */}
      <div style={{ marginBottom: '15px' }}>
        <label style={labelStyle}>Mass: {mass.toFixed(2)}</label>
        <input
          type="range"
          min="0.1"
          max="50"
          step="0.1"
          value={mass}
          onChange={(e) => setMass(parseFloat(e.target.value))}
          style={sliderStyle}
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={labelStyle}>Radius: {radius.toFixed(2)}</label>
        <input
          type="range"
          min="0.1"
          max="3"
          step="0.1"
          value={radius}
          onChange={(e) => setRadius(parseFloat(e.target.value))}
          style={sliderStyle}
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={labelStyle}>Position X: {posX.toFixed(2)}</label>
        <input
          type="range"
          min="-50"
          max="50"
          step="0.5"
          value={posX}
          onChange={(e) => setPosX(parseFloat(e.target.value))}
          style={sliderStyle}
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={labelStyle}>Position Y: {posY.toFixed(2)}</label>
        <input
          type="range"
          min="-50"
          max="50"
          step="0.5"
          value={posY}
          onChange={(e) => setPosY(parseFloat(e.target.value))}
          style={sliderStyle}
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={labelStyle}>Position Z: {posZ.toFixed(2)}</label>
        <input
          type="range"
          min="-50"
          max="50"
          step="0.5"
          value={posZ}
          onChange={(e) => setPosZ(parseFloat(e.target.value))}
          style={sliderStyle}
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={labelStyle}>Velocity X: {velX.toFixed(2)}</label>
        <input
          type="range"
          min="-10"
          max="10"
          step="0.1"
          value={velX}
          onChange={(e) => setVelX(parseFloat(e.target.value))}
          style={sliderStyle}
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={labelStyle}>Velocity Y: {velY.toFixed(2)}</label>
        <input
          type="range"
          min="-10"
          max="10"
          step="0.1"
          value={velY}
          onChange={(e) => setVelY(parseFloat(e.target.value))}
          style={sliderStyle}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>Velocity Z: {velZ.toFixed(2)}</label>
        <input
          type="range"
          min="-10"
          max="10"
          step="0.1"
          value={velZ}
          onChange={(e) => setVelZ(parseFloat(e.target.value))}
          style={sliderStyle}
        />
      </div>

      {/* Add Buttons */}
      {isHost && (
        <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
          <button
            onClick={handleAddPlanet}
            style={{ ...buttonStyle, flex: 1, margin: 0, padding: '12px', fontSize: '14px', fontWeight: 'bold', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
          >
            🪐 Add Planet
          </button>
          <button
            onClick={() => {
              addStar({
                mass: mass < 1 ? mass : 0.5,
                radius: radius < 0.3 ? radius : 0.15,
                pos: [posX, posY, posZ],
                vel: [velX, velY, velZ],
              });
              // Reset to defaults after adding
              setMass(0.5);
              setRadius(0.15);
              setPosX(15);
              setPosY(0);
              setPosZ(0);
              setVelX(0);
              setVelY(0);
              setVelZ(0);
            }}
            style={{ ...buttonStyle, flex: 1, margin: 0, padding: '12px', fontSize: '14px', fontWeight: 'bold', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}
          >
            ⭐ Add Star
          </button>
        </div>
      )}

      <div style={{ marginTop: '15px', fontSize: '11px', color: '#888', textAlign: 'center' }}>
        Bodies: {bodiesRef.current.length}
      </div>
    </div>
  );
}
