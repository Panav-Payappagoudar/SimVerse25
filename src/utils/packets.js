// Minimal packing helpers. For now we use plain arrays; Float32Array packing can be added later.
export function packFrame(bodies) {
  // bodies: [{ id, position: THREE.Vector3, velocity: THREE.Vector3 }]
  // return: { ids: [...], data: Float32Array([... px,py,pz,vx,vy,vz ...]) }
  const ids = [];
  const data = new Float32Array(bodies.length * 6);
  for (let i = 0; i < bodies.length; i++) {
    const b = bodies[i];
    ids.push(b.id || i);
    data[i * 6 + 0] = b.position.x;
    data[i * 6 + 1] = b.position.y;
    data[i * 6 + 2] = b.position.z;
    data[i * 6 + 3] = b.velocity.x;
    data[i * 6 + 4] = b.velocity.y;
    data[i * 6 + 5] = b.velocity.z;
  }
  return { ids, data }; // socket.io will transfer typed arrays efficiently
}

export function unpackFrame(frame) {
  // frame: { ids, data }
  const { ids, data } = frame;
  const out = [];
  const arr = data;
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    out.push({ id, pos: [arr[i * 6 + 0], arr[i * 6 + 1], arr[i * 6 + 2]], vel: [arr[i * 6 + 3], arr[i * 6 + 4], arr[i * 6 + 5]] });
  }
  return out;
}
