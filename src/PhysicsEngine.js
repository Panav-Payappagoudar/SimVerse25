import * as THREE from 'three';

export const updateBodies = (bodies, G, dt) => {
  const numBodies = bodies.length;
  
  // 1. Create a map for quick parent lookup
  const bodyMap = new Map();
  let blackHole = null;
  
  for (const b of bodies) {
    bodyMap.set(b.id, b);
    if (b.type === 'blackhole' || b.id === 'blackhole-0') {
      blackHole = b;
    }
  }

  // Fallback if no explicit black hole found
  if (!blackHole && bodies.length > 0) blackHole = bodies[0];

  const accelerations = new Array(numBodies).fill(null).map(() => new THREE.Vector3(0, 0, 0));

  // 2. Calculate forces based on Hierarchy
  for (let i = 0; i < numBodies; i++) {
    const body = bodies[i];
    if (body.isFixed || body.isStatic) continue;

    let parent = null;

    // A. Explicit Parent (e.g., Planet -> Star)
    if (body.parentId) {
      parent = bodyMap.get(body.parentId);
    } 
    // B. Stars orbit the Black Hole
    else if (body.type === 'star') {
      parent = blackHole;
    }
    // C. Planets without parent orbit the Black Hole (or stray bodies)
    else {
      parent = blackHole;
    }

    // If no parent found (or body is the black hole itself), no gravity calls
    if (!parent || parent === body) continue;

    // Calculate Vector from Body to Parent
    const diff = new THREE.Vector3().subVectors(parent.position, body.position);
    const distSq = diff.lengthSq();
    const dist = Math.sqrt(distSq);

    // Softening (prevent infinite force at 0 distance)
    if (dist < 0.5) continue; 

    // Gravity Force: F = G * M1 * M2 / r^2
    // We want Acceleration: a = F / M_body = G * M_parent / r^2
    const fMag = (G * parent.mass) / distSq; 
    
    // Direction: Body -> Parent
    const acc = diff.normalize().multiplyScalar(fMag);
    
    accelerations[i].add(acc);
  }

  // 3. Integration (Symplectic Euler)
  for (let i = 0; i < numBodies; i++) {
    const body = bodies[i];
    if (body.isFixed || body.isStatic) continue;

    // v(t+1) = v(t) + a(t) * dt
    body.velocity.add(accelerations[i].multiplyScalar(dt));
    
    // x(t+1) = x(t) + v(t+1) * dt
    body.position.add(body.velocity.clone().multiplyScalar(dt));
  }
};
