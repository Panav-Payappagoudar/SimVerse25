import { Server } from "socket.io";
import RoomModel from "./models/Room.js";
import roomManager from "./roomManager.js";

export default function initSocket(server) {
  console.log("Creating Socket.IO server...");
  const io = new Server(server, {
    cors: {
      origin: ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
    allowEIO3: true,
  });

  console.log("Socket.IO initialized with transports:", ["websocket", "polling"]);

  io.engine.on("connection_error", (err) => {
    console.error("Socket.IO connection error:", err);
  });

  io.on("connection", (socket) => {
    console.log(`socket connected: ${socket.id}`);

    socket.on("join_room", async ({ roomId, clientMeta } = {}) => {
      if (!roomId) return socket.emit("error", { message: "roomId required" });

      socket.join(roomId);
      let room = roomManager.get(roomId);

      if (!room) {
        // try DB for initial snapshot
        let snapshot = { bodies: [] };
        try {
          const doc = await RoomModel.findOne({ roomId }).lean().exec();
          if (doc && doc.snapshot) snapshot = doc.snapshot;
        } catch (err) {
          console.warn("Room DB lookup failed:", err.message);
        }

        room = roomManager.create(roomId, snapshot);

        // first joiner becomes host
        roomManager.assignHost(roomId, socket.id);
        io.to(roomId).emit("host_assigned", { hostId: socket.id });
      }

      roomManager.addPeer(roomId, socket.id);
      roomManager.touch(roomId);

      // Send init to the joining client (snapshot + current host)
      const current = roomManager.get(roomId);
      socket.emit("init_data", { snapshot: current.snapshot, hostId: current.hostId });
    });

    socket.on("physics_update", ({ roomId, frame } = {}) => {
      if (!roomId || !frame) return;
      // Relay high-frequency frames as volatile to reduce IO pressure
      io.to(roomId).volatile.emit("sync_positions", frame);
      roomManager.touch(roomId);
    });

    // Forward change requests from guests to the host for application
    socket.on("request_change", ({ roomId, clientId, request } = {}) => {
      if (!roomId || !request) return socket.emit("error", { message: "invalid_request" });

      // Basic validation
      const allowedActions = ["move", "tweak", "set_owner", "delete"];
      if (!allowedActions.includes(request.action)) {
        return socket.emit("error", { message: "action_not_allowed" });
      }

      const hostId = roomManager.getHost(roomId);
      if (!hostId) {
        return socket.emit("error", { message: "no_host_available" });
      }

      // Forward to host for authoritative application
      io.to(hostId).emit("apply_request", { roomId, clientId, request, forwardedAt: Date.now() });
      // touch TTL so room stays alive while edits are happening
      roomManager.touch(roomId);
    });

    // Host sends authoritative entity patches (reliable)
    socket.on("entity_patch", ({ roomId, patches, tick } = {}) => {
      if (!roomId || !Array.isArray(patches)) return;

      // Only accept patches from the assigned host for this room
      const hostId = roomManager.getHost(roomId);
      if (socket.id !== hostId) {
        console.warn(`Ignoring entity_patch from non-host ${socket.id} for room ${roomId}`);
        return;
      }

      // Merge patches into cached snapshot (best-effort)
      const room = roomManager.get(roomId) || roomManager.create(roomId, { bodies: [] });
      const snap = room.snapshot || { bodies: [] };
      const byId = new Map(snap.bodies.map((b) => [b.id, b]));

      for (const p of patches) {
        if (!p || !p.id) continue;
        const existing = byId.get(p.id);
        if (existing) {
          // merge known fields
          if (p.pos) existing.position = { x: p.pos[0], y: p.pos[1], z: p.pos[2] };
          if (p.vel) existing.velocity = { x: p.vel[0], y: p.vel[1], z: p.vel[2] };
          if (typeof p.mass === "number") existing.mass = p.mass;
          if (typeof p.radius === "number") existing.radius = p.radius;
          if (typeof p.isStatic === "boolean") existing.isStatic = p.isStatic;
          if (p.ownerId) existing.ownerId = p.ownerId;
        } else {
          // create minimal body entry
          const body = {
            id: p.id,
            position: p.pos ? { x: p.pos[0], y: p.pos[1], z: p.pos[2] } : { x: 0, y: 0, z: 0 },
            velocity: p.vel ? { x: p.vel[0], y: p.vel[1], z: p.vel[2] } : { x: 0, y: 0, z: 0 },
            mass: typeof p.mass === "number" ? p.mass : 1,
            radius: typeof p.radius === "number" ? p.radius : 1,
            isStatic: !!p.isStatic,
            ownerId: p.ownerId || null,
          };
          snap.bodies.push(body);
          byId.set(body.id, body);
        }
      }

      // persist merged snapshot back into cache
      roomManager.setSnapshot(roomId, snap);

      // Broadcast the patches reliably to all peers in room
      io.to(roomId).emit("entity_patch", { patches, tick });
      roomManager.touch(roomId);
    });

    socket.on("state_snapshot", ({ roomId, snapshot } = {}) => {
      if (!roomId || !snapshot) return;
      roomManager.setSnapshot(roomId, snapshot);
      // Broadcast a reliable init_data when snapshot saved/updated
      io.to(roomId).emit("init_data", { snapshot, hostId: roomManager.getHost(roomId) });
    });

    socket.on("request_snapshot", async ({ roomId } = {}) => {
      if (!roomId) return;
      const room = roomManager.get(roomId);
      if (room && room.hostId) {
        // Ask host to send a snapshot
        io.to(room.hostId).emit("request_snapshot_from_host", { roomId });
      } else {
        // fallback: try DB
        try {
          const doc = await RoomModel.findOne({ roomId }).lean().exec();
          if (doc && doc.snapshot) {
            socket.emit("init_data", { snapshot: doc.snapshot, hostId: null });
          }
        } catch (err) {
          console.warn("request_snapshot DB lookup failed:", err.message);
        }
      }
    });

    socket.on("disconnect", () => {
      console.log(`socket disconnected: ${socket.id}`);

      // Remove from all rooms and handle host failover
      for (const roomId of socket.rooms) {
        if (roomId === socket.id) continue; // skip personal room

        roomManager.removePeer(roomId, socket.id);

        const host = roomManager.getHost(roomId);
        if (host === socket.id) {
          const newHost = roomManager.electNewHost(roomId);
          if (newHost) {
            io.to(roomId).emit("host_assigned", { hostId: newHost });
            // Request full snapshot from the newly assigned host
            io.to(newHost).emit("request_snapshot_from_server", { roomId });
          } else {
            // no peers left; clear host and let TTL expire
            roomManager.clearHost(roomId);
          }
        }
      }
    });
  });

  return io;
}
