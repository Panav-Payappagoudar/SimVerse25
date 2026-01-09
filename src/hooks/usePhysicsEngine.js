import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { updateBodies } from "../PhysicsEngine";
import socketClient, { emitStateFrame, joinRoom, onSyncPositions, onInitData, onHostAssigned, requestChange, onEntityPatch, sendHeartbeat } from "../socketClient";
import { getLocalUser } from "../utils/user";
import { packFrame, unpackFrame } from "../utils/packets";

const TICK_MS = 1000 / 60; // 60Hz

export default function usePhysicsEngine(roomId, gravity = 0.1) {
  const localUser = useRef(getLocalUser());
  const [isHost, setIsHost] = useState(false);
  const bodiesRef = useRef([]); // array of { id, position: THREE.Vector3, velocity: THREE.Vector3, ... }
  const latestRemote = useRef(null);
  const rafRef = useRef();
  const tickTimer = useRef();

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

  // Join room and wire socket events
  useEffect(() => {
    if (!roomId) return;
    const s = joinRoom(roomId, { user: localUser.current });

    const offInit = onInitData((data) => {
      if (data && data.snapshot) {
        initFromSnapshot(data.snapshot);
      }
      if (data && data.hostId && s && s.id) {
        setIsHost(data.hostId === s.id);
      }
    });

    const offHost = onHostAssigned(({ hostId }) => {
      setIsHost(hostId === (s && s.id));
    });

    const offSync = onSyncPositions((frame) => {
      // unpack and store latest remote frame for interpolation
      latestRemote.current = frame;
    });

    const offPatch = onEntityPatch(({ patches }) => {
      // apply reliable patches immediately into snapshot cache and local bodies
      if (!patches || !Array.isArray(patches)) return;
      for (const p of patches) {
        const idx = bodiesRef.current.findIndex((b) => b.id === p.id);
        if (idx >= 0) {
          const b = bodiesRef.current[idx];
          if (p.pos) b.position.set(p.pos[0], p.pos[1], p.pos[2]);
          if (p.vel) b.velocity.set(p.vel[0], p.vel[1], p.vel[2]);
          if (typeof p.mass === "number") b.mass = p.mass;
          if (typeof p.radius === "number") b.radius = p.radius;
          if (typeof p.isStatic === "boolean") b.isStatic = p.isStatic;
          if (p.ownerId) b.ownerId = p.ownerId;
        }
      }
    });

    // heartbeat to keep room alive
    const hb = setInterval(() => sendHeartbeat(roomId), 1000);

    return () => {
      offInit();
      offHost();
      offSync();
      offPatch();
      clearInterval(hb);
      try { s && s.disconnect(); } catch (e) {}
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
      const frame = latestRemote.current;
      if (frame && frame.ids && frame.data) {
        // apply directly for now (fast), interpolation can be added per-body
        const unpacked = unpackFrame(frame);
        for (const u of unpacked) {
          const idx = bodiesRef.current.findIndex((b) => b.id === u.id);
          if (idx >= 0) {
            const b = bodiesRef.current[idx];
            // Short linear interpolation to smooth
            const t = 0.5; // smoothing factor
            b.position.lerp(new THREE.Vector3(u.pos[0], u.pos[1], u.pos[2]), t);
            b.velocity.set(u.vel[0], u.vel[1], u.vel[2]);
          }
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
    requestChange(roomId, clientId, { action, targetId, params });
  }

  return {
    bodiesRef,
    isHost,
    requestChange: requestChangeLocal,
    localUser: localUser.current,
  };
}
