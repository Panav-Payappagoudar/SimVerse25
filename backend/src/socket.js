import { Server } from "socket.io";
import RoomModel from "./models/Room.js";
import roomManager from "./roomManager.js";

export default function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || "*",
      methods: ["GET", "POST"],
    },
    // pingInterval / pingTimeout can be tuned for liveness
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
