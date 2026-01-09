import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Stars } from './components/Stars';
import { BlackHole } from './components/BlackHole';
import { Planets } from './components/Planets';
import { updateBodies } from './PhysicsEngine';
import * as THREE from 'three';

export function Scene({ gravity, bodies: externalBodies, networked = false }) {
    const [renderKey, setRenderKey] = useState(0);
    const frameCount = useRef(0);

    // Initialize bodies (local-only) unless external bodies are provided
    const bodies = useMemo(() => {
        const b = [];

        // 1. Central Black Hole
        b.push({
            id: 'blackhole-0',
            position: new THREE.Vector3(0, 0, 0),
            velocity: new THREE.Vector3(0, 0, 0),
            mass: 500,
            radius: 2,
            isFixed: true,
            isStatic: true,
        });

        // 2. 50 Random Stars (only if no external bodies provided)
        if (!externalBodies) {
            for (let i = 0; i < 50; i++) {
                const radius = 10 + Math.random() * 20;
                const theta = Math.random() * Math.PI * 2;
                const phi = (Math.random() - 0.5) * Math.PI * 0.5;

                const x = radius * Math.cos(theta) * Math.cos(phi);
                const y = radius * Math.sin(phi) * 0.2;
                const z = radius * Math.sin(theta) * Math.cos(phi);

                const pos = new THREE.Vector3(x, y, z);
                const tangent = new THREE.Vector3(-z, 0, x).normalize();
                tangent.add(new THREE.Vector3((Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.2));
                tangent.normalize();
                const vMag = Math.sqrt(0.1 * 500 / radius);
                const vel = tangent.multiplyScalar(vMag);

                b.push({
                    id: `star-${i}`,
                    position: pos,
                    velocity: vel,
                    mass: 1,
                    radius: 0.2,
                    isFixed: false,
                    isStatic: false,
                    type: 'star',
                });
            }
        }
        return b;
    }, []); // Run once on mount

    const activeBodies = externalBodies || bodies;

    // Force re-render every 10 frames when networked to update positions
    useFrame(() => {
        if (networked && externalBodies) {
            frameCount.current++;
            if (frameCount.current % 10 === 0) {
                setRenderKey(prev => prev + 1);
            }
        }
    });

    // Only run local physics if not networked and not provided external bodies
    if (!networked && !externalBodies) {
        useFrame((state, delta) => {
            const dt = Math.min(delta, 0.05);
            updateBodies(activeBodies, gravity, dt);
        });
    }

    // Find black hole (fixed/static body at index 0 or with id containing 'blackhole')
    const blackHole = activeBodies.find(b => (b.isFixed || b.isStatic) && (b.id?.includes('blackhole') || activeBodies.indexOf(b) === 0));
    const blackHolePosition = blackHole?.position || (activeBodies.length > 0 ? activeBodies[0].position : new THREE.Vector3(0, 0, 0));

    // Separate stars and planets
    const stars = activeBodies.filter(b => !b.isFixed && !b.isStatic && (b.type === 'star' || (!b.type && b.radius <= 0.3)));
    const planets = activeBodies.filter(b => !b.isFixed && !b.isStatic && (b.type === 'planet' || (!b.type && b.radius > 0.3)));

    return (
        <>
            {/* Enhanced Lighting */}
            <ambientLight intensity={0.4} />
            <pointLight position={[10, 10, 10]} intensity={0.5} decay={2} />
            <pointLight position={[-10, -10, -10]} intensity={0.3} decay={2} color="#4a90e2" />
            <directionalLight position={[5, 5, 5]} intensity={0.3} />

            {/* Black Hole with better visuals */}
            {blackHole && <BlackHole position={blackHolePosition} />}

            {/* Render Stars */}
            {stars.length > 0 && <Stars key={`stars-${renderKey}`} bodies={stars} />}

            {/* Render Planets */}
            {planets.length > 0 && <Planets key={`planets-${renderKey}`} bodies={planets} />}

            {/* Render any remaining bodies that aren't categorized */}
            {activeBodies.filter(b => 
                !b.isFixed && !b.isStatic && 
                b.type !== 'star' && b.type !== 'planet' &&
                !stars.includes(b) && !planets.includes(b)
            ).length > 0 && (
                <Planets 
                    key={`other-${renderKey}`} 
                    bodies={activeBodies.filter(b => 
                        !b.isFixed && !b.isStatic && 
                        b.type !== 'star' && b.type !== 'planet' &&
                        !stars.includes(b) && !planets.includes(b)
                    )} 
                />
            )}
        </>
    );
}
