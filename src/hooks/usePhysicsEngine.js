import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { updateBodies } from "../PhysicsEngine";
import socketClient, { emitStateFrame, joinRoom, onSyncPositions, onInitData, onHostAssigned, requestChange, onEntityPatch, onApplyRequest, sendEntityPatch, sendHeartbeat } from "../socketClient";
import { getLocalUser } from "../utils/user";
import { packFrame, unpackFrame } from "../utils/packets";

const TICK_MS = 1000 / 60; // 60Hz

export default function usePhysicsEngine(roomId, gravity = 0.1) {
  const localUser = useRef(getLocalUser());
  const [isHost, setIsHost] = useState(false);
  const isHostRef = useRef(false); // Keep ref in sync with state for handlers
  const bodiesRef = useRef([]); // array of { id, position: THREE.Vector3, velocity: THREE.Vector3, ... }
  const latestRemote = useRef(null);
  const rafRef = useRef();
  const tickTimer = useRef();
  const pendingRef = useRef(new Map()); // nonce -> { targetId, prev }
  
  // Keep ref in sync with state
  useEffect(() => {
    isHostRef.current = isHost;
  }, [isHost]);

  // Helpers to convert snapshot (plain objects) -> local body objects
  function initFromSnapshot(snapshot) {
    const arr = snapshot && snapshot.bodies ? snapshot.bodies : [];
    bodiesRef.current = arr.map((b, i) => ({
      id: b.id != null ? b.id : `b${i}`,
      position: new THREE.Vector3(b.position.x || 0, b.position.y || 0, b.position.z || 0),
      velocity: new THREE.Vector3(b.velocity.x || 0, b.velocity.y || 0, b.velocity.z || 0),
      mass: b.mass || 1,
      radius: b.radius || 1,
      isStatic: !!b.isStatic,
      ownerId: b.ownerId || null,
    }));
  }

  // Generate a default local snapshot so UI shows something while waiting for server
  function generateDefaultBodies(count = 51) {
    const out = [];
    // central black hole
    out.push({
      id: `body-0`,
      position: new THREE.Vector3(0, 0, 0),
      velocity: new THREE.Vector3(0, 0, 0),
      mass: 500,
      radius: 2,
      isStatic: true,
      ownerId: null,
    });

    for (let i = 1; i < count; i++) {
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
      const vMag = Math.sqrt(0.1 * 500 / Math.max(0.1, radius));
      const vel = tangent.multiplyScalar(vMag);
      out.push({
        id: `body-${i}`,
        position: pos,
        velocity: vel,
        mass: 1,
        radius: 0.2,
        isStatic: false,
        ownerId: null,
      });
    }
    return out;
  }

  // Keep isHostRef in sync with isHost state
  useEffect(() => {
    isHostRef.current = isHost;
  }, [isHost]);

  // Join room and wire socket events
  useEffect(() => {
    if (!roomId) return;

    // Ensure there's something to render immediately while waiting for server
    if (!bodiesRef.current || bodiesRef.current.length === 0) {
      bodiesRef.current = generateDefaultBodies(51);
    }

    let s = null;
    let cleanupFunctions = [];

    // Set up event listeners first (they can be set up before connection)
    const offInit = onInitData((data) => {
      if (data && data.snapshot) {
        initFromSnapshot(data.snapshot);
      }
      if (data && data.hostId && s && s.id) {
        setIsHost(data.hostId === s.id);
      }
    });
    cleanupFunctions.push(offInit);

    const offHost = onHostAssigned(({ hostId }) => {
      setIsHost(hostId === (s && s.id));
    });
    cleanupFunctions.push(offHost);

    const offSync = onSyncPositions((frame) => {
      // unpack and store latest remote frame for interpolation
      latestRemote.current = frame;
      try {
        const unpacked = unpackFrame(frame);
        for (const u of unpacked) {
          const idx = bodiesRef.current.findIndex((b) => b.id === u.id);
          if (idx >= 0) {
            const b = bodiesRef.current[idx];
            // set sync targets for smoothing
            b.syncTarget = new THREE.Vector3(u.pos[0], u.pos[1], u.pos[2]);
            b.syncVelocity = new THREE.Vector3(u.vel[0], u.vel[1], u.vel[2]);
            b.syncUpdatedAt = performance.now();
          }
        }
      } catch (e) {
        console.warn("unpackFrame failed:", e);
      }
    });
    cleanupFunctions.push(offSync);

    const offPatch = onEntityPatch(({ patches }) => {
      // apply reliable patches with smooth reconciliation
      if (!patches || !Array.isArray(patches)) return;
      for (const p of patches) {
        const idx = bodiesRef.current.findIndex((b) => b.id === p.id);
        if (idx >= 0) {
          const b = bodiesRef.current[idx];
          // clear any optimistic pending for this target
          for (const [nonce, pending] of pendingRef.current.entries()) {
            if (pending.targetId === p.id) pendingRef.current.delete(nonce);
          }

          // set reconcile targets instead of snapping
          if (p.pos) {
            const target = new THREE.Vector3(p.pos[0], p.pos[1], p.pos[2]);
            b.reconcileStart = b.position.clone();
            b.reconcileTarget = target;
            b.reconcileProgress = 0; // 0..1
            b.reconcileDuration = 100; // ms
            b.reconcileAt = performance.now();
          }
          if (p.vel) b.velocity.set(p.vel[0], p.vel[1], p.vel[2]);
          if (typeof p.mass === "number") b.mass = p.mass;
          if (typeof p.radius === "number") b.radius = p.radius;
          if (typeof p.isStatic === "boolean") b.isStatic = p.isStatic;
          if (p.ownerId) b.ownerId = p.ownerId;
        } else if (p.id) {
          // New body from patch
          const newBody = {
            id: p.id,
            position: p.pos ? new THREE.Vector3(p.pos[0], p.pos[1], p.pos[2]) : new THREE.Vector3(0, 0, 0),
            velocity: p.vel ? new THREE.Vector3(p.vel[0], p.vel[1], p.vel[2]) : new THREE.Vector3(0, 0, 0),
            mass: typeof p.mass === "number" ? p.mass : 1,
            radius: typeof p.radius === "number" ? p.radius : 0.2,
            isStatic: !!p.isStatic,
            ownerId: p.ownerId || null,
          };
          bodiesRef.current.push(newBody);
        }
      }
    });
    cleanupFunctions.push(offPatch);

    // Host handles apply_request from guests (set up always, check isHost at runtime)
    const offApplyRequest = onApplyRequest(({ roomId: reqRoomId, clientId, request }) => {
      if (reqRoomId !== roomId || !isHostRef.current) return;

      const { action, targetId, params, nonce } = request;
      
      if (action === 'add') {
        // Add new planet
        const newId = `body-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const pos = params.pos || [15, 0, 0];
        const vel = params.vel || [0, 0, 0];
        const mass = params.mass || 1;
        const radius = params.radius || 0.2;
        
        const newBody = {
          id: newId,
          position: new THREE.Vector3(pos[0], pos[1], pos[2]),
          velocity: new THREE.Vector3(vel[0], vel[1], vel[2]),
          mass,
          radius,
          isStatic: false,
          ownerId: clientId,
        };
        
        bodiesRef.current.push(newBody);
        
        // Send patch to all clients
        sendEntityPatch(roomId, [{
          id: newId,
          pos: [pos[0], pos[1], pos[2]],
          vel: [vel[0], vel[1], vel[2]],
          mass,
          radius,
          isStatic: false,
          ownerId: clientId,
        }], Date.now());
      } else if (action === 'delete') {
        // Remove planet
        const idx = bodiesRef.current.findIndex((b) => b.id === targetId);
        if (idx >= 0) {
          bodiesRef.current.splice(idx, 1);
          // Note: For deletion, we'd need a separate mechanism or just stop sending updates
          // For now, we'll mark it as deleted by removing from array
        }
      } else if (action === 'tweak' || action === 'move') {
        // Apply existing tweak/move logic
        const idx = bodiesRef.current.findIndex((b) => b.id === targetId);
        if (idx >= 0) {
          const b = bodiesRef.current[idx];
          if (action === 'tweak') {
            if (typeof params.mass === 'number') b.mass = params.mass;
            if (typeof params.radius === 'number') b.radius = params.radius;
            if (typeof params.isStatic === 'boolean') b.isStatic = params.isStatic;
          } else if (action === 'move') {
            if (params.pos) b.position.set(params.pos[0], params.pos[1], params.pos[2]);
            if (params.vel) b.velocity.set(params.vel[0], params.vel[1], params.vel[2]);
          }
          
          // Send patch
          sendEntityPatch(roomId, [{
            id: targetId,
            pos: [b.position.x, b.position.y, b.position.z],
            vel: [b.velocity.x, b.velocity.y, b.velocity.z],
            mass: b.mass,
            radius: b.radius,
            isStatic: b.isStatic,
            ownerId: b.ownerId,
          }], Date.now());
        }
      }
    });
    cleanupFunctions.push(offApplyRequest);

    // Join room after setting up listeners
    joinRoom(roomId, { user: localUser.current })
      .then((socket) => {
        s = socket;
        console.log("Successfully joined room:", roomId, "Socket ID:", socket.id);
      })
      .catch((err) => {
        console.error("Failed to join room:", err);
        // Optionally show user-facing error or retry
      });

    // heartbeat to keep room alive
    const hb = setInterval(() => sendHeartbeat(roomId), 1000);
    cleanupFunctions.push(() => clearInterval(hb));

    return () => {
      cleanupFunctions.forEach(fn => {
        try { fn(); } catch (e) {}
      });
      // Note: Don't disconnect socket here as it might be used by other components
      // The socket will be cleaned up when the component unmounts if needed
    };
  }, [roomId]);

  // Host fixed-tick loop
  useEffect(() => {
    if (!isHost) {
      // stop host tick if any
      if (tickTimer.current) {
        clearInterval(tickTimer.current);
        tickTimer.current = null;
      }
      return;
    }

    // Start fixed 60Hz step
    let last = performance.now();
    tickTimer.current = setInterval(() => {
      const now = performance.now();
      const dt = (TICK_MS) / 1000; // fixed dt in seconds
      try {
        updateBodies(bodiesRef.current, gravity, dt);
      } catch (e) {
        console.error("Physics step error:", e);
      }

      // Emit packed frame to server
      const { ids, data } = packFrame(bodiesRef.current);
      emitStateFrame(roomId, { ids, data });

      // optional host heartbeat could be merged here
      last = now;
    }, TICK_MS);

    return () => {
      if (tickTimer.current) {
        clearInterval(tickTimer.current);
        tickTimer.current = null;
      }
    };
  }, [isHost, roomId, gravity]);

  // Guest interpolation loop: lerp positions toward latestRemote
  useEffect(() => {
    let mounted = true;
    function step() {
      if (!mounted) return;
      const now = performance.now();
      // For each body perform reconciliation or sync smoothing
      for (const b of bodiesRef.current) {
        // Reconciliation has priority
        if (b.reconcileTarget) {
          const elapsed = now - (b.reconcileAt || 0);
          const t = Math.min(1, elapsed / (b.reconcileDuration || 100));
          b.position.lerpVectors(b.reconcileStart || b.position, b.reconcileTarget, t);
          if (t >= 1) {
            b.reconcileTarget = null;
            b.reconcileStart = null;
          }
          continue;
        }

        // Smooth toward last sync target if available
        if (b.syncTarget) {
          // smoothing factor (per-frame) — smaller is smoother
          const alpha = 0.15;
          b.position.lerp(b.syncTarget, alpha);
          if (b.syncVelocity) b.velocity.lerp(b.syncVelocity, alpha);
        }
      }
      rafRef.current = requestAnimationFrame(step);
    }
    rafRef.current = requestAnimationFrame(step);
    return () => {
      mounted = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [roomId]);

  function requestChangeLocal(targetId, action, params = {}) {
    const clientId = localUser.current.id;
    const nonce = `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;

    // If host, apply directly and send patch
    if (isHost && (action === 'add' || action === 'delete')) {
      if (action === 'add') {
        const newId = `body-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const pos = params.pos || [15, 0, 0];
        const vel = params.vel || [0, 0, 0];
        const mass = params.mass || 1;
        const radius = params.radius || 0.2;
        
        const newBody = {
          id: newId,
          position: new THREE.Vector3(pos[0], pos[1], pos[2]),
          velocity: new THREE.Vector3(vel[0], vel[1], vel[2]),
          mass,
          radius,
          isStatic: false,
          ownerId: clientId,
        };
        
        bodiesRef.current.push(newBody);
        
        // Send patch
        sendEntityPatch(roomId, [{
          id: newId,
          pos: [pos[0], pos[1], pos[2]],
          vel: [vel[0], vel[1], vel[2]],
          mass,
          radius,
          isStatic: false,
          ownerId: clientId,
        }], Date.now());
        return;
      } else if (action === 'delete') {
        const idx = bodiesRef.current.findIndex((b) => b.id === targetId);
        if (idx >= 0) {
          bodiesRef.current.splice(idx, 1);
        }
        return;
      }
    }

    // apply optimistic local change and record previous state
    const idx = bodiesRef.current.findIndex((b) => b.id === targetId);
    if (idx >= 0) {
      const b = bodiesRef.current[idx];
      const prev = {
        position: b.position.clone(),
        velocity: b.velocity.clone(),
        mass: b.mass,
        radius: b.radius,
        ownerId: b.ownerId,
      };
      pendingRef.current.set(nonce, { targetId, prev, createdAt: Date.now() });

      // optimistic apply
      if (action === 'tweak') {
        if (typeof params.mass === 'number') b.mass = params.mass;
        if (typeof params.radius === 'number') b.radius = params.radius;
        if (typeof params.isStatic === 'boolean') b.isStatic = params.isStatic;
      } else if (action === 'move') {
        if (params.pos && Array.isArray(params.pos) && params.pos.length >= 3) {
          b.position.set(params.pos[0], params.pos[1], params.pos[2]);
        }
        if (params.vel && Array.isArray(params.vel) && params.vel.length >= 3) {
          b.velocity.set(params.vel[0], params.vel[1], params.vel[2]);
        }
      }
    }

    requestChange(roomId, clientId, { action, targetId, params, nonce });
  }

  function addPlanet(params = {}) {
    const pos = params.pos || [15, 0, 0];
    requestChangeLocal(null, 'add', { ...params, pos });
  }

  return {
    bodiesRef,
    isHost,
    requestChange: requestChangeLocal,
    addPlanet,
    localUser: localUser.current,
  };
}
