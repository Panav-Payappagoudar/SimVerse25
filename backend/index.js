import http from "http";
import app from "./src/app.js";
import connectDB from "./src/db.js";
import initSocket from "./src/socket.js";

const PORT = process.env.PORT || 8000;

async function start() {
  await connectDB();

  const server = http.createServer(app);

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

