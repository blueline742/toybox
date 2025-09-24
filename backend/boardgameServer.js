// Boardgame.io Server for Toybox PvP Battles
import { Server } from 'boardgame.io/dist/cjs/server.js';
import { ToyboxGame } from '../src/game/boardgame/game.js';

// Configure the boardgame.io server
const server = Server({
  games: [ToyboxGame],

  // Optional: Add authentication/persistence later
  // db: new FlatFile({ dir: './storage' }),

  // Enable CORS for development
  origins: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003',
    'http://localhost:5173',
    'http://localhost:5174',
    'https://toyboxsol.netlify.app',
    'https://toybox.netlify.app'
  ],

  // Socket.IO configuration for mobile stability
  socketOpts: {
    pingTimeout: 60000,    // 60 seconds (default 5s)
    pingInterval: 25000,   // 25 seconds
    connectTimeout: 120000, // 2 minutes
    transports: ['polling', 'websocket']
  }
});

// Run the server on port 4001 for matchmaking compatibility
const PORT = process.env.BOARDGAME_PORT || 4001;
server.run(PORT, () => {
  console.log(`🎮 Boardgame.io server running on port ${PORT}`);
  console.log(`📡 WebSocket endpoint: ws://localhost:${PORT}`);
  console.log(`🌐 HTTP endpoint: http://localhost:${PORT}`);
});