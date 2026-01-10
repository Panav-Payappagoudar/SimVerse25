import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Trail } from '@react-three/drei';
import * as THREE from 'three';

const Star = ({ body }) => {
    const groupRef = useRef();

    useFrame(() => {
        if (groupRef.current && body && body.position) {
            groupRef.current.position.copy(body.position);
        }
    });

    const radius = Math.max(0.05, body.radius || 0.15);

    // Random twinkling color variation
    const starColor = useMemo(() => {
        const colors = ['#ffffff', '#f0f0ff', '#fff0f0', '#f0fff0', '#fffff0'];
        return colors[Math.floor((body.id?.charCodeAt(0) || 0) % colors.length)];
    }, [body.id]);

    return (
        <group ref={groupRef}>
            <Trail
                width={0.5}
                length={8}
                color={starColor}
                attenuation={(t) => t * t}
                local={false}
            >
                <mesh>
                    <sphereGeometry args={[radius, 16, 16]} />
                    <meshBasicMaterial 
                        color={starColor}
                    />
                </mesh>
            </Trail>
        </group>
    );
};

export function Stars({ bodies }) {
    // Filter and memoize stars
    const stars = useMemo(() => {
        return bodies.filter(b => b && b.position && b.id && !b.isFixed && !b.isStatic);
    }, [bodies]);

    return (
        <>
            {stars.map((body) => (
                <Star key={body.id} body={body} />
            ))}
        </>
    );
}
