import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Scene } from '../Scene';
import usePhysicsEngine from '../hooks/usePhysicsEngine';
import { OrbitControls } from '@react-three/drei';
import { getLocalUser } from '../utils/user';
import { useParams } from 'react-router-dom';
import PlanetControlPanel from '../components/PlanetControlPanel';

export default function RoomPage() {
  const { roomId } = useParams();
  const { bodiesRef, isHost, requestChange, addPlanet, localUser } = usePhysicsEngine(roomId, 0.1);
  const [isSimulationRunning, setIsSimulationRunning] = useState(true);

  const handleSimulationToggle = () => {
    setIsSimulationRunning(!isSimulationRunning);
    // TODO: Implement actual pause/resume logic in the physics engine
    console.log('Simulation', !isSimulationRunning ? 'resumed' : 'paused');
  };

  // bodiesRef.current is updated by the hook; pass to Scene as external bodies
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <div style={{ position: 'absolute', left: 12, top: 12, zIndex: 10, color: 'white', backgroundColor: 'rgba(0,0,0,0.5)', padding: '10px', borderRadius: '4px' }}>
        <div>Room: {roomId}</div>
        <div>User: {localUser?.name} ({localUser?.id?.slice(0, 8)}...)</div>
        <div>Status: {isHost ? '🟢 HOST' : '🔵 GUEST'}</div>
        <div>Bodies: {bodiesRef.current.length}</div>
      </div>

      <PlanetControlPanel
        isHost={isHost}
        addPlanet={addPlanet}
        bodiesRef={bodiesRef}
        requestChange={requestChange}
        onSimulationToggle={handleSimulationToggle}
        isSimulationRunning={isSimulationRunning}
      />

      <Canvas camera={{ position: [0, 20, 40], fov: 60 }}>
        <color attach="background" args={['#000000']} />
        <Scene gravity={0.1} bodies={bodiesRef.current} networked={true} />
        <OrbitControls />
      </Canvas>
    </div>
  );
}
