import { useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { Scene } from './Scene';
import { UI } from './components/UI';
import { OrbitControls } from '@react-three/drei';

function App() {
  const [gravity, setGravity] = useState(0.1);
  const [resetKey, setResetKey] = useState(0);

  const handleReset = useCallback(() => {
    setResetKey(prev => prev + 1);
  }, []);

  return (
    <>
      <UI gravity={gravity} setGravity={setGravity} onReset={handleReset} />

      <div style={{ width: '100vw', height: '100vh', background: 'black' }}>
        <Canvas camera={{ position: [0, 20, 40], fov: 60 }}>
          <color attach="background" args={['#000000']} />

          <Scene key={resetKey} gravity={gravity} />

          <OrbitControls />
        </Canvas>
      </div>
    </>
  );
}

export default App;
