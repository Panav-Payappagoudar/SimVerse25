import * as THREE from 'three';

export const updateBodies = (bodies, G, dt) => {
  const numBodies = bodies.length;
  // Reset accelerations
  // We can optimize this by not allocating new array every frame if performance is an issue,
  // but for 50 bodies it's fine.
  const accelerations = [];

  for (let i = 0; i < numBodies; i++) {
    accelerations[i] = new THREE.Vector3(0, 0, 0);
  }

  for (let i = 0; i < numBodies; i++) {
    const bodyA = bodies[i];
    
    for (let j = i + 1; j < numBodies; j++) {
      const bodyB = bodies[j];

      // Calculate vector from A to B
      const diff = new THREE.Vector3().subVectors(bodyB.position, bodyA.position);
      const distSq = diff.lengthSq();
      const dist = Math.sqrt(distSq);

      // Softening parameter to prevent singularities
      const softening = 0.5; 
      if (dist < softening) continue; // or use softened gravity: 1 / (r^2 + eps^2)

      const f = (G * bodyA.mass * bodyB.mass) / (distSq); // classic Newton

      const force = diff.normalize().multiplyScalar(f);

      // a = F/m
      const accA = force.clone().divideScalar(bodyA.mass);
      const accB = force.clone().divideScalar(bodyB.mass); // equal and opposite force magnitude -> similar calc

      if (!bodyA.isFixed) accelerations[i].add(accA);
      if (!bodyB.isFixed) accelerations[j].sub(accB); // Subtract because force on B is opposite
    }
  }

  // Symplectic Euler Integration
  // v(t+1) = v(t) + a(t) * dt
  // x(t+1) = x(t) + v(t+1) * dt
  for (let i = 0; i < numBodies; i++) {
    const body = bodies[i];
    if (body.isFixed) continue;

    body.velocity.add(accelerations[i].multiplyScalar(dt));
    body.position.add(body.velocity.clone().multiplyScalar(dt));
  }
};
