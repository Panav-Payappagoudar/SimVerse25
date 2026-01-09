// test-client.js
import io from "socket.io-client";

const url = "http://localhost:8000";
const s = io(url, { transports: ["polling", "websocket"], reconnection: false });

s.on("connect", () => {
  console.log("NODE CLIENT: connected", s.id);
  s.disconnect();
});

s.on("connect_error", (err) => {
  console.error("NODE CLIENT: connect_error", err.message || err);
});

s.on("error", (e) => console.error("NODE CLIENT: error", e));