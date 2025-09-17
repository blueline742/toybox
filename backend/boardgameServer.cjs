// Boardgame.io server for Toybox NFT Card Battle
const { Server } = require('boardgame.io/server');
const { ToyboxGame } = require('../src/game/boardgame/game.js');

// Configure the boardgame.io server
const server = Server({
  games: [ToyboxGame],

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
  ]
});

// Run the server on port 4000
const PORT = process.env.BOARDGAME_PORT || 4000;
server.run(PORT, () => {
  console.log(`🎮 Boardgame.io server running on port ${PORT}`);
  console.log(`📡 WebSocket endpoint: ws://localhost:${PORT}`);
  console.log(`🌐 HTTP endpoint: http://localhost:${PORT}`);
  console.log(`\n✅ Server ready for on-demand match creation`);
  console.log('-------------------------------------------');
});

// Export the server for use by other modules if needed
module.exports = { server, ToyboxGame };