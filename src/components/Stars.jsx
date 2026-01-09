import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Trail } from '@react-three/drei';
import * as THREE from 'three';

const Star = ({ body }) => {
    const meshRef = useRef();

    useFrame(() => {
        if (meshRef.current && body) {
            meshRef.current.position.copy(body.position);
        }
    });

    return (
        // Trail needs to wrap the moving object or target it.
        // Drei Trail: <Trail ...><mesh .../></Trail>
        <Trail
            width={1} // Width of the line
            length={10} // Length of the trail
            color={'#ffffff'} // Color of the trail
            attenuation={(t) => t * t} // Transparency attenuation
        >
            <mesh ref={meshRef}>
                <sphereGeometry args={[0.2, 16, 16]} />
                <meshBasicMaterial color="white" />
            </mesh>
        </Trail>
    );
};

export function Stars({ bodies }) {
    // Filter out the fixed black hole if it's in bodies array, or assume passed bodies are just stars?
    // We will assume 'bodies' passed here includes stars only or we check.
    const stars = useMemo(() => bodies.filter(b => !b.isFixed), [bodies]);

    return (
        <>
            {stars.map((body, i) => (
                <Star key={i} body={body} />
            ))}
        </>
    );
}
