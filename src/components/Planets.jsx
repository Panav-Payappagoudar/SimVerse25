import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const Planet = ({ body }) => {
    const groupRef = useRef();
    const materialRef = useRef();

    // Calculate color based on mass (lighter = more massive)
    const color = useMemo(() => {
        const mass = body.mass || 1;
        if (mass < 2) return '#4a90e2'; // Blue for small planets
        if (mass < 10) return '#2ecc71'; // Green for medium planets
        if (mass < 30) return '#e67e22'; // Orange for large planets
        return '#e74c3c'; // Red for massive planets
    }, [body.mass]);

    // Calculate glow intensity based on mass
    const emissiveIntensity = useMemo(() => {
        return Math.min(0.3 + (body.mass || 1) * 0.02, 1);
    }, [body.mass]);

    useFrame(() => {
        if (groupRef.current && body && body.position) {
            groupRef.current.position.copy(body.position);
        }
    });

    const radius = Math.max(0.1, body.radius || 0.5);

    return (
        <group ref={groupRef}>
            {/* Main planet sphere */}
            <mesh>
                <sphereGeometry args={[radius, 32, 32]} />
                <meshStandardMaterial
                    ref={materialRef}
                    color={color}
                    emissive={color}
                    emissiveIntensity={emissiveIntensity}
                    metalness={0.3}
                    roughness={0.7}
                />
            </mesh>
            {/* Glow effect */}
            <mesh>
                <sphereGeometry args={[radius * 1.2, 32, 32]} />
                <meshBasicMaterial
                    color={color}
                    transparent
                    opacity={0.2}
                    side={THREE.BackSide}
                />
            </mesh>
        </group>
    );
};

export function Planets({ bodies }) {
    // Memoize filtered planets
    const planets = useMemo(() => {
        return bodies.filter(b => b && b.position && b.id);
    }, [bodies]);

    return (
        <>
            {planets.map((body) => (
                <Planet key={body.id} body={body} />
            ))}
        </>
    );
}
