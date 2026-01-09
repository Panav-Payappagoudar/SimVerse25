import http from "http";
import app from "./src/app.js";
import connectDB from "./src/db.js";
import initSocket from "./src/socket.js";


const PORT = process.env.PORT || 8000;

async function start() {
  await connectDB();

  const server = http.createServer(app);

  // Log all incoming HTTP requests at the server level (captures socket.io polling/upgrade)
  server.on('request', (req, res) => {
    try {
      console.log('[HTTP REQUEST]', req.method, req.url, 'from', req.socket.remoteAddress);
    } catch (e) {}
  });

  // Initialize socket.io handlers (attach to HTTP server)
  initSocket(server);

  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

