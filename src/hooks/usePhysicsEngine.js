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
  const pendingRef = useRef(new Map()); // nonce -> { targetId, prev }

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

  return {
    bodiesRef,
    isHost,
    requestChange: requestChangeLocal,
    localUser: localUser.current,
  };
}
