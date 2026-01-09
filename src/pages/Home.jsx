import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState('');
  const [error, setError] = useState('');

  const generateRoomId = () => {
    return `room-${Math.random().toString(36).slice(2, 11)}`;
  };

  const handleCreateRoom = () => {
    const newRoomId = generateRoomId();
    navigate(`/room/${newRoomId}`);
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    setError('');
    
    const trimmedRoomId = roomId.trim();
    
    if (!trimmedRoomId) {
      setError('Please enter a room ID');
      return;
    }

    // Basic validation - room ID should be alphanumeric with dashes/underscores
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmedRoomId)) {
      setError('Room ID can only contain letters, numbers, dashes, and underscores');
      return;
    }

    navigate(`/room/${trimmedRoomId}`);
  };

  const containerStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  };

  const cardStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(10px)',
    borderRadius: '20px',
    padding: '60px 50px',
    maxWidth: '500px',
    width: '100%',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    textAlign: 'center',
  };

  const titleStyle = {
    fontSize: '48px',
    fontWeight: 'bold',
    marginBottom: '10px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    marginTop: 0,
  };

  const subtitleStyle = {
    fontSize: '18px',
    color: '#b0b0b0',
    marginBottom: '40px',
    lineHeight: '1.6',
  };

  const buttonStyle = {
    width: '100%',
    padding: '16px 32px',
    fontSize: '16px',
    fontWeight: '600',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginBottom: '20px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
  };

  const buttonHoverStyle = {
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 20px rgba(102, 126, 234, 0.6)',
  };

  const inputStyle = {
    width: '100%',
    padding: '16px 20px',
    fontSize: '16px',
    borderRadius: '12px',
    border: '2px solid rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: 'white',
    marginBottom: '12px',
    boxSizing: 'border-box',
    transition: 'all 0.3s ease',
    fontFamily: 'inherit',
  };

  const inputFocusStyle = {
    borderColor: '#667eea',
    outline: 'none',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)',
  };

  const errorStyle = {
    color: '#ff6b6b',
    fontSize: '14px',
    marginTop: '8px',
    marginBottom: '12px',
    textAlign: 'left',
  };

  const dividerStyle = {
    display: 'flex',
    alignItems: 'center',
    margin: '30px 0',
    color: '#666',
    fontSize: '14px',
  };

  const dividerLineStyle = {
    flex: 1,
    height: '1px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  };

  const dividerTextStyle = {
    padding: '0 15px',
  };

  const featureListStyle = {
    marginTop: '40px',
    paddingTop: '30px',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    textAlign: 'left',
  };

  const featureItemStyle = {
    color: '#b0b0b0',
    fontSize: '14px',
    marginBottom: '12px',
    display: 'flex',
    alignItems: 'center',
  };

  const featureIconStyle = {
    marginRight: '10px',
    fontSize: '18px',
  };

  const [isCreateHovered, setIsCreateHovered] = useState(false);
  const [isJoinHovered, setIsJoinHovered] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h1 style={titleStyle}>SimVerse</h1>
        <p style={subtitleStyle}>
          Create or join a collaborative physics simulation room
        </p>

        <button
          onClick={handleCreateRoom}
          onMouseEnter={() => setIsCreateHovered(true)}
          onMouseLeave={() => setIsCreateHovered(false)}
          style={{
            ...buttonStyle,
            ...(isCreateHovered ? buttonHoverStyle : {}),
          }}
        >
          ➕ Create New Room
        </button>

        <div style={dividerStyle}>
          <div style={dividerLineStyle}></div>
          <span style={dividerTextStyle}>OR</span>
          <div style={dividerLineStyle}></div>
        </div>

        <form onSubmit={handleJoinRoom}>
          <input
            type="text"
            placeholder="Enter Room ID (e.g., room-abc123)"
            value={roomId}
            onChange={(e) => {
              setRoomId(e.target.value);
              setError('');
            }}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            style={{
              ...inputStyle,
              ...(isInputFocused ? inputFocusStyle : {}),
            }}
            autoComplete="off"
          />
          
          {error && <div style={errorStyle}>⚠️ {error}</div>}

          <button
            type="submit"
            onMouseEnter={() => setIsJoinHovered(true)}
            onMouseLeave={() => setIsJoinHovered(false)}
            style={{
              ...buttonStyle,
              background: isJoinHovered 
                ? 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)'
                : 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
              ...(isJoinHovered ? buttonHoverStyle : {}),
            }}
          >
            🚀 Join Room
          </button>
        </form>

        <div style={featureListStyle}>
          <div style={featureItemStyle}>
            <span style={featureIconStyle}>🌌</span>
            <span>Real-time physics simulation</span>
          </div>
          <div style={featureItemStyle}>
            <span style={featureIconStyle}>👥</span>
            <span>Collaborate with friends in real-time</span>
          </div>
          <div style={featureItemStyle}>
            <span style={featureIconStyle}>🪐</span>
            <span>Add and customize planets together</span>
          </div>
          <div style={featureItemStyle}>
            <span style={featureIconStyle}>🔒</span>
            <span>Anonymous - no account required</span>
          </div>
        </div>
      </div>
    </div>
  );
}
