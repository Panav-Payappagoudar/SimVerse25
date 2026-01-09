import React from 'react';
import { Canvas } from '@react-three/fiber';
import { Scene } from '../Scene';
import usePhysicsEngine from '../hooks/usePhysicsEngine';
import { OrbitControls } from '@react-three/drei';
import { getLocalUser } from '../utils/user';

export default function RoomPage({ params }) {
  const roomId = params?.roomId || (typeof window !== 'undefined' ? window.location.pathname.split('/').pop() : 'default');
  const { bodiesRef, isHost, requestChange, localUser } = usePhysicsEngine(roomId, 0.1);

  // bodiesRef.current is updated by the hook; pass to Scene as external bodies
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <div style={{ position: 'absolute', left: 12, top: 12, zIndex: 10, color: 'white' }}>
        <div>Room: {roomId}</div>
        <div>User: {localUser?.name} ({localUser?.id})</div>
        <div>Status: {isHost ? 'HOST' : 'GUEST'}</div>
        <button onClick={() => requestChange(bodiesRef.current[1]?.id, 'tweak', { mass: Math.random() * 5 + 0.1 })}>Randomize Mass (body 1)</button>
      </div>

      <Canvas camera={{ position: [0, 20, 40], fov: 60 }}>
        <color attach="background" args={['#000000']} />
        <Scene gravity={0.1} bodies={bodiesRef.current} networked={true} />
        <OrbitControls />
      </Canvas>
    </div>
  );
}
