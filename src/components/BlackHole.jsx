import React, { useRef } from 'react';

export function BlackHole({ position }) {
    // Implicitly represented in physics, but we can add a visual debugger or event horizon if wanted.
    // User asked for "Invisible object", so we render nothing or maybe a helper in dev.
    // We'll render a black sphere just to occlude stars behind it if they pass? 
    // Or purely invisible.
    // "Invisible object" implies opacity 0 or null.

    return (
        <mesh position={[position.x, position.y, position.z]}>
            <sphereGeometry args={[2, 32, 32]} />
            <meshBasicMaterial color="black" transparent opacity={0.0} />
        </mesh>
    );
}
