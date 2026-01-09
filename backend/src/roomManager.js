import NodeCache from "node-cache";

const CACHE_KEY_PREFIX = "room:";

const cache = new NodeCache({ stdTTL: 3600, checkperiod: 120 });

function key(roomId) {
  return `${CACHE_KEY_PREFIX}${roomId}`;
}

function create(roomId, snapshot = { bodies: [] }) {
  const value = {
    snapshot,
    hostId: null,
    peers: [],
    createdAt: Date.now(),
  };
  cache.set(key(roomId), value);
  return value;
}

function get(roomId) {
  return cache.get(key(roomId));
}

function setSnapshot(roomId, snapshot) {
  const v = get(roomId) || create(roomId, snapshot);
  v.snapshot = snapshot;
  cache.set(key(roomId), v);
  return v;
}

function touch(roomId) {
  // reset TTL to stdTTL (3600s)
  return cache.ttl(key(roomId), 3600);
}

function addPeer(roomId, socketId) {
  const v = get(roomId) || create(roomId);
  if (!v.peers.includes(socketId)) v.peers.push(socketId);
  cache.set(key(roomId), v);
  return v;
}

function removePeer(roomId, socketId) {
  const v = get(roomId);
  if (!v) return null;
  v.peers = v.peers.filter((s) => s !== socketId);
  cache.set(key(roomId), v);
  return v;
}

function assignHost(roomId, socketId) {
  const v = get(roomId) || create(roomId);
  v.hostId = socketId;
  if (!v.peers.includes(socketId)) v.peers.push(socketId);
  cache.set(key(roomId), v);
  return v;
}

function clearHost(roomId) {
  const v = get(roomId);
  if (!v) return null;
  v.hostId = null;
  cache.set(key(roomId), v);
  return v;
}

function getHost(roomId) {
  const v = get(roomId);
  return v ? v.hostId : null;
}

function electNewHost(roomId) {
  const v = get(roomId);
  if (!v) return null;
  // choose first peer as new host (FIFO)
  const next = v.peers.length > 0 ? v.peers[0] : null;
  v.hostId = next;
  cache.set(key(roomId), v);
  return next;
}

export default {
  create,
  get,
  setSnapshot,
  touch,
  addPeer,
  removePeer,
  assignHost,
  clearHost,
  getHost,
  electNewHost,
};
