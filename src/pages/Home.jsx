import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  const sample = `room-${Math.random().toString(36).slice(2,8)}`;
  return (
    <div style={{ padding: 20, color: '#fff', background: '#000', height: '100vh' }}>
      <h1>SimVerse</h1>
      <p>Create or join a room by visiting <code>/room/&lt;roomId&gt;</code></p>
      <p>Try this sample room: <Link to={`/room/${sample}`}>{sample}</Link></p>
    </div>
  );
}
