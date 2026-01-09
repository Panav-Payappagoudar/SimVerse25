import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Scene } from '../Scene';
import usePhysicsEngine from '../hooks/usePhysicsEngine';
import { OrbitControls } from '@react-three/drei';
import { getLocalUser } from '../utils/user';
import { useParams, Link } from 'react-router-dom';
import PlanetControlPanel from '../components/PlanetControlPanel';

export default function RoomPage() {
  const { roomId } = useParams();
  const { bodiesRef, isHost, requestChange, addPlanet, addStar, localUser } = usePhysicsEngine(roomId, 0.1);
  const [isSimulationRunning, setIsSimulationRunning] = useState(true);
  const [renderKey, setRenderKey] = useState(0);

  // Force re-render every second to update body count and ensure bodies render
  React.useEffect(() => {
    const interval = setInterval(() => {
      setRenderKey(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSimulationToggle = () => {
    setIsSimulationRunning(!isSimulationRunning);
    // TODO: Implement actual pause/resume logic in the physics engine
    console.log('Simulation', !isSimulationRunning ? 'resumed' : 'paused');
  };

  // bodiesRef.current is updated by the hook; pass to Scene as external bodies
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <div style={{ position: 'absolute', left: 12, top: 12, zIndex: 10, color: 'white', backgroundColor: 'rgba(0,0,0,0.7)', padding: '12px 16px', borderRadius: '8px', backdropFilter: 'blur(10px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <Link 
            to="/" 
            style={{ 
              color: '#667eea', 
              textDecoration: 'none', 
              fontSize: '14px',
              fontWeight: '500',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => e.target.style.color = '#764ba2'}
            onMouseLeave={(e) => e.target.style.color = '#667eea'}
          >
            ← Home
          </Link>
        </div>
        <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
          <div><strong>Room:</strong> {roomId}</div>
          <div><strong>User:</strong> {localUser?.name} ({localUser?.id?.slice(0, 8)}...)</div>
          <div><strong>Status:</strong> {isHost ? '🟢 HOST' : '🔵 GUEST'}</div>
          <div><strong>Bodies:</strong> {bodiesRef.current.length}</div>
        </div>
      </div>

      <PlanetControlPanel
        isHost={isHost}
        addPlanet={addPlanet}
        addStar={addStar}
        bodiesRef={bodiesRef}
        requestChange={requestChange}
        onSimulationToggle={handleSimulationToggle}
        isSimulationRunning={isSimulationRunning}
      />

      <Canvas key={renderKey} camera={{ position: [0, 20, 40], fov: 60 }}>
        <color attach="background" args={['#000000']} />
        <Scene gravity={0.1} bodies={bodiesRef.current} networked={true} />
        <OrbitControls />
      </Canvas>
    </div>
  );
}
