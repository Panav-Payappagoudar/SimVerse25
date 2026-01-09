import { io } from "socket.io-client";

let socket = null;
let connected = false;

function ensure(url = undefined) {
  if (socket) return socket;
  const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";
  console.log("Connecting to socket.io at", backendURL);
  
  // Force polling transport in dev to avoid websocket upgrade issues.
  socket = io(backendURL, {
    transports: ["polling"],
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  socket.on("connect", () => {
    connected = true;
    console.log("socket connected", socket.id, "transport=", socket.io.engine.transport.name);
    // expose to window for debugging
    try { window.__socket = socket; } catch (e) {}
  });

  socket.on("connect_error", (err) => {
    console.error("socket connect error:", err);
    if (err && err.message) console.error("connect_error.message:", err.message);
  });

  // Log transport changes
  try {
    socket.io && socket.io.on && socket.io.on('upgrade', (transport) => {
      console.log('socket transport upgraded to', transport && transport.name);
    });
  } catch (e) {}

  socket.on("disconnect", () => {
    connected = false;
    console.log("socket disconnected");
  });

  return socket;
}

export function joinRoom(roomId, clientMeta = {}) {
  const s = ensure();
  s.emit("join_room", { roomId, clientMeta });
  return s;
}

export function emitStateFrame(roomId, frame) {
  if (!socket) ensure();
  socket.emit("physics_update", { roomId, frame });
}

export function requestChange(roomId, clientId, request) {
  if (!socket) ensure();
  socket.emit("request_change", { roomId, clientId, request });
}

export function onSyncPositions(cb) {
  if (!socket) ensure();
  socket.on("sync_positions", cb);
  return () => socket.off("sync_positions", cb);
}

export function onInitData(cb) {
  if (!socket) ensure();
  socket.on("init_data", cb);
  return () => socket.off("init_data", cb);
}

export function onHostAssigned(cb) {
  if (!socket) ensure();
  socket.on("host_assigned", cb);
  return () => socket.off("host_assigned", cb);
}

export function onEntityPatch(cb) {
  if (!socket) ensure();
  socket.on("entity_patch", cb);
  return () => socket.off("entity_patch", cb);
}

export function sendHeartbeat(roomId) {
  if (!socket) ensure();
  socket.emit("host_heartbeat", { roomId, ts: Date.now() });
}

export function requestSnapshot(roomId) {
  if (!socket) ensure();
  socket.emit("request_snapshot", { roomId });
}

export default {
  joinRoom,
  emitStateFrame,
  requestChange,
  onSyncPositions,
  onInitData,
  onHostAssigned,
  onEntityPatch,
  sendHeartbeat,
  requestSnapshot,
};
