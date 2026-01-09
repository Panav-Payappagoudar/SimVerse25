import express from "express";
import RoomModel from "./models/Room.js";
import roomManager from "./roomManager.js";

const app = express();

// Basic middleware
app.use(express.json({ limit: "1mb" }));

// Simple CORS - sufficient for local development and REST endpoints
app.use((req, res, next) => {
	res.setHeader("Access-Control-Allow-Origin", process.env.CORS_ORIGIN || "*");
	res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
	res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
	if (req.method === "OPTIONS") return res.sendStatus(200);
	next();
});

// Log socket.io HTTP requests for debugging connection issues
app.use((req, res, next) => {
	try {
		if (req.url && req.url.startsWith('/socket.io/')) {
			console.log('[socket.io HTTP]', req.method, req.url, 'Origin:', req.headers.origin || req.headers.host);
		}
	} catch (e) {}
	next();
});

app.get("/health", (req, res) => {
	res.json({ ok: true, timestamp: Date.now() });
});

// Get current snapshot for a room (from cache or DB)
app.get("/rooms/:roomId", async (req, res) => {
	const { roomId } = req.params;
	let room = roomManager.get(roomId);
	if (room && room.snapshot) return res.json({ snapshot: room.snapshot, hostId: room.hostId });

	try {
		const doc = await RoomModel.findOne({ roomId }).lean().exec();
		if (doc && doc.snapshot) return res.json({ snapshot: doc.snapshot, hostId: null });
	} catch (err) {
		console.warn("GET /rooms/:roomId DB lookup failed:", err.message);
	}

	return res.status(404).json({ error: "room_not_found" });
});

// Save snapshot for a room (admin or host can call this)
app.post("/rooms/:roomId/snapshot", async (req, res) => {
	const { roomId } = req.params;
	const { snapshot } = req.body;
	if (!snapshot) return res.status(400).json({ error: "snapshot_required" });

	// Update cache
	roomManager.setSnapshot(roomId, snapshot);

	// Persist to DB (best-effort)
	try {
		await RoomModel.updateOne({ roomId }, { roomId, snapshot }, { upsert: true }).exec();
	} catch (err) {
		console.warn("Failed to save snapshot to DB:", err.message);
	}

	return res.json({ ok: true });
});

export default app;