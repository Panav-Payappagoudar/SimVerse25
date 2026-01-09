import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Stars } from './components/Stars';
import { BlackHole } from './components/BlackHole';
import { updateBodies } from './PhysicsEngine';
import * as THREE from 'three';

export function Scene({ gravity }) {
    // Initialize bodies
    const bodies = useMemo(() => {
        const b = [];

        // 1. Central Black Hole
        b.push({
            position: new THREE.Vector3(0, 0, 0),
            velocity: new THREE.Vector3(0, 0, 0),
            mass: 500, // Massive!
            isFixed: true
        });

        // 2. 50 Random Stars
        for (let i = 0; i < 50; i++) {
            // Random position in a disk/sphere
            const radius = 10 + Math.random() * 20; // 10 to 30 units away
            const theta = Math.random() * Math.PI * 2;
            const phi = (Math.random() - 0.5) * Math.PI * 0.5; // Flattened disk-ish

            const x = radius * Math.cos(theta) * Math.cos(phi);
            const y = radius * Math.sin(phi) * 0.2; // Flattened
            const z = radius * Math.sin(theta) * Math.cos(phi);

            const pos = new THREE.Vector3(x, y, z);

            // Circular orbit velocity: v = sqrt(GM/r)
            // Tangent vector: (-z, 0, x) normalized roughly
            const tangent = new THREE.Vector3(-z, 0, x).normalize();

            // Randomize orbit direction slightly
            tangent.add(new THREE.Vector3((Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.2));
            tangent.normalize();

            // v = sqrt(G * M_bh / r)
            // We use initial Gravity=0.1. If user changes G, orbits change.
            // Let's assume standard G=0.1 for stable initial orbits.
            const vMag = Math.sqrt(0.1 * 500 / radius);
            const vel = tangent.multiplyScalar(vMag);

            b.push({
                position: pos,
                velocity: vel,
                mass: 1,
                isFixed: false
            });
        }
        return b;
    }, []); // Run once on mount

    // Physics Loop
    useFrame((state, delta) => {
        // Limit delta to avoid explosions on lag
        const dt = Math.min(delta, 0.05);
        updateBodies(bodies, gravity, dt);
    });

    return (
        <>
            <BlackHole position={bodies[0].position} />
            <Stars bodies={bodies} />
            <ambientLight intensity={0.1} />
        </>
    );
}
