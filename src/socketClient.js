import { io } from "socket.io-client";

let socket = null;
let connected = false;

function ensure(url = undefined) {
  if (socket) return socket;
  const opts = {};
  if (url) opts.path = url;
  socket = io(process.env.VITE_BACKEND_URL || "http://localhost:8000", {
    transports: ["websocket"],
    autoConnect: true,
  });

  socket.on("connect", () => {
    connected = true;
    console.log("socket connected", socket.id);
  });

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
