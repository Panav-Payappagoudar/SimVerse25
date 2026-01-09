import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function BlackHole({ position }) {
    const eventHorizonRef = useRef();
    const accretionDiskRef = useRef();
    const rotationRef = useRef(0);

    useFrame((state, delta) => {
        if (eventHorizonRef.current) {
            rotationRef.current += delta * 0.5;
            eventHorizonRef.current.rotation.y = rotationRef.current;
        }
        if (accretionDiskRef.current) {
            accretionDiskRef.current.rotation.z = rotationRef.current * 0.3;
        }
    });

    return (
        <group position={[position.x, position.y, position.z]}>
            {/* Event Horizon - Dark sphere with slight glow */}
            <mesh ref={eventHorizonRef}>
                <sphereGeometry args={[2, 32, 32]} />
                <meshBasicMaterial 
                    color="#000000" 
                    transparent 
                    opacity={0.9}
                />
            </mesh>
            
            {/* Accretion Disk - Rotating disk of particles */}
            <mesh ref={accretionDiskRef} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[3, 0.1, 16, 100]} />
                <meshBasicMaterial 
                    color="#ff4500" 
                    emissive="#ff6600"
                    emissiveIntensity={0.8}
                />
            </mesh>
            
            {/* Inner glow */}
            <mesh>
                <sphereGeometry args={[2.1, 32, 32]} />
                <meshBasicMaterial 
                    color="#330033"
                    transparent
                    opacity={0.3}
                />
            </mesh>
        </group>
    );
}
