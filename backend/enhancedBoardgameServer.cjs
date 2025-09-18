// Enhanced Boardgame.io server with match creation and logging
const { Server } = require('boardgame.io/server');
const { ToyboxGame } = require('../src/game/boardgame/game.js');
const express = require('express');
const cors = require('cors');

// Create express app for additional endpoints
const app = express();
app.use(express.json());
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003',
    'http://localhost:3004',
    'http://localhost:3005',
    'http://localhost:3006',
    'http://localhost:5173',
    'http://localhost:5174',
    'https://toyboxsol.netlify.app',
    'https://toybox.netlify.app'
  ],
  credentials: true
}));

// Configure the boardgame.io server
const server = Server({
  games: [ToyboxGame],
  origins: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003',
    'http://localhost:3004',
    'http://localhost:3005',
    'http://localhost:3006',
    'http://localhost:5173',
    'http://localhost:5174',
    'https://toyboxsol.netlify.app',
    'https://toybox.netlify.app'
  ]
});

// Track active matches
const activeMatches = new Map();

// Custom endpoint to create a match when PvP matchmaking finds a match
app.post('/create-match', async (req, res) => {
  const { matchID, numPlayers = 2 } = req.body;

  try {
    // Check if match already exists
    if (activeMatches.has(matchID)) {
      console.log('⚠️ Match already exists:', matchID);
      return res.json({ success: true, matchID, existing: true });
    }

    // Create match using the server's internal API
    const matchData = {
      numPlayers,
      setupData: { matchID, timestamp: Date.now() }, // Pass matchID and timestamp to game setup
      unlisted: false
    };

    console.log('🎯 Creating match:', matchID, 'with', numPlayers, 'players');

    // Actually create the match on the boardgame server
    await db.createMatch(ToyboxGame.name, matchID, matchData);

    // Store match info
    activeMatches.set(matchID, {
      created: new Date(),
      numPlayers,
      players: [],
      playersJoined: [],
      state: 'waiting'
    });

    console.log('✅ Match created on boardgame server - MatchID:', matchID, 'Players:', numPlayers);
    res.json({ success: true, matchID, created: true });
  } catch (error) {
    console.error('❌ Failed to create match:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint to check match status
app.get('/match-status/:matchID', (req, res) => {
  const { matchID } = req.params;
  const match = activeMatches.get(matchID);

  if (!match) {
    return res.status(404).json({ error: 'Match not found' });
  }

  res.json({
    matchID,
    created: match.created,
    numPlayers: match.numPlayers,
    playersJoined: match.players.length
  });
});

// Endpoint to delete/reset a match
app.delete('/match/:matchID', (req, res) => {
  const { matchID } = req.params;
  const { playerID, reason } = req.body || {};

  console.log('🔴 Match deletion requested:', matchID, 'Player:', playerID, 'Reason:', reason);

  try {
    // Get match info before deleting
    const match = activeMatches.get(matchID);

    if (match) {
      // Mark match as abandoned
      match.state = 'abandoned';
      match.abandonedBy = playerID;
      match.abandonedReason = reason;
      match.abandonedAt = new Date();

      console.log('⚠️ Match marked as abandoned:', matchID);

      // Notify all connected clients about match abandonment
      // This will be picked up by boardgame.io's WebSocket connections
      if (db && db.fetch) {
        db.fetch(matchID).then(matchData => {
          if (matchData) {
            // Set game state to indicate abandonment
            const state = matchData.state;
            if (state && state.G) {
              state.G.abandoned = true;
              state.G.abandonedBy = playerID;
              state.ctx.gameover = {
                winner: playerID === '0' ? '1' : '0',
                reason: 'opponent_abandoned'
              };
              db.updateMatch(matchID, state);
            }
          }
        }).catch(err => console.error('Failed to update match state:', err));
      }
    }

    // Remove from active matches
    if (activeMatches.has(matchID)) {
      activeMatches.delete(matchID);
      console.log('🗑️ Match removed from active matches:', matchID);
    }

    // Try to delete from boardgame.io's database after a delay
    // to allow clients to receive the abandonment notification
    setTimeout(() => {
      if (server.db && server.db.deleteMatch) {
        server.db.deleteMatch(matchID);
        console.log('🗑️ Match deleted from boardgame.io database:', matchID);
      }
    }, 2000);

    res.json({ success: true, message: 'Match deleted successfully', abandoned: true });
  } catch (error) {
    console.error('❌ Failed to delete match:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint to handle player leaving (for beacon/unload events)
app.post('/player-left', express.raw({ type: 'application/json' }), (req, res) => {
  try {
    // Handle both text and Buffer bodies
    const bodyText = req.body instanceof Buffer ? req.body.toString() : req.body;
    const data = typeof bodyText === 'string' ? JSON.parse(bodyText) : bodyText;
    const { matchID, playerID, reason } = data;

    console.log('🚪 Player left via beacon/unload:', matchID, playerID, reason);

    if (matchID && activeMatches.has(matchID)) {
      const match = activeMatches.get(matchID);
      match.state = 'abandoned';
      match.abandonedBy = playerID;
      match.abandonedAt = new Date();

      // Mark game as abandoned in boardgame.io state
      if (db && db.fetch) {
        db.fetch(matchID).then(matchData => {
          if (matchData && matchData.state) {
            const state = matchData.state;
            if (state.G) {
              state.G.abandoned = true;
              state.G.abandonedBy = playerID;
              state.ctx.gameover = {
                winner: playerID === '0' ? '1' : '0',
                reason: 'opponent_left'
              };
              db.updateMatch(matchID, state);
            }
          }
        });
      }

      // Schedule cleanup
      setTimeout(() => {
        activeMatches.delete(matchID);
        if (server.db && server.db.deleteMatch) {
          server.db.deleteMatch(matchID);
        }
      }, 5000);
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Error handling player-left:', error);
    res.status(500).send('Error');
  }
});

// Clean up old matches periodically (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  const MATCH_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  const ABANDONED_TIMEOUT = 5 * 60 * 1000; // 5 minutes for abandoned matches

  activeMatches.forEach((match, matchID) => {
    const matchAge = now - match.created;
    const isAbandoned = match.state === 'abandoned';
    const abandonedAge = match.abandonedAt ? now - match.abandonedAt : 0;

    // Clean up abandoned matches faster
    if ((isAbandoned && abandonedAge > ABANDONED_TIMEOUT) ||
        (!isAbandoned && matchAge > MATCH_TIMEOUT)) {
      activeMatches.delete(matchID);
      if (server.db && server.db.deleteMatch) {
        server.db.deleteMatch(matchID);
      }
      console.log('🧹 Cleaned up match:', matchID, isAbandoned ? '(abandoned)' : '(timeout)');
    }
  });
}, 5 * 60 * 1000);

// Log all server events
const db = server.db;

// Override the createMatch to log
const originalCreateMatch = db.createMatch;
db.createMatch = function(gameName, matchID, matchData) {
  console.log('🆕 Server creating match internally:', matchID);
  const result = originalCreateMatch.call(this, gameName, matchID, matchData);
  return result;
};

// Log when players join
const originalUpdateMatch = db.updateMatch;
db.updateMatch = function(matchID, state) {
  // Log state updates with broadcasting info
  if (state && state.ctx) {
    const G = state.G || {};
    const players = G.players || {};

    // CRITICAL: Check for phase transition
    if (G.phase === 'playing' && G.setupComplete) {
      console.log('🎮 PHASE TRANSITION CONFIRMED - MatchID:', matchID);
      console.log('  Both teams ready and game started!');
    }

    console.log('📡 Broadcasting update - MatchID:', matchID, {
      phase: G.phase,
      setupComplete: G.setupComplete || false,
      player0Ready: players['0']?.ready || false,
      player1Ready: players['1']?.ready || false,
      player0Cards: players['0']?.cards?.length || 0,
      player1Cards: players['1']?.cards?.length || 0,
    });

    console.log('📊 Server state update - MatchID:', matchID, {
      phase: G.phase,
      turn: state.ctx.turn,
      currentPlayer: state.ctx.currentPlayer,
      player0: {
        ready: players['0']?.ready || false,
        cards: players['0']?.cards?.map(c => c.name) || []
      },
      player1: {
        ready: players['1']?.ready || false,
        cards: players['1']?.cards?.map(c => c.name) || []
      }
    });

    // Check if both ready
    if (players['0']?.ready && players['1']?.ready) {
      console.log('✅ BOTH PLAYERS READY on server - MatchID:', matchID);
    }

    // Track player joins
    const match = activeMatches.get(matchID);
    if (match) {
      if (players['0']?.ready && !match.playersJoined.includes('0')) {
        match.playersJoined.push('0');
        console.log('👤 Player 0 joined match:', matchID);
      }
      if (players['1']?.ready && !match.playersJoined.includes('1')) {
        match.playersJoined.push('1');
        console.log('👤 Player 1 joined match:', matchID);
      }
      if (match.playersJoined.length === match.numPlayers) {
        match.state = 'ready';
        console.log('🎮 All players joined - MatchID:', matchID);
      }
    }
  }

  return originalUpdateMatch.call(this, matchID, state);
};

// Run the express server on port 4001
app.listen(4001, () => {
  console.log('🚀 API endpoints running on http://localhost:4001');
  console.log('  POST /create-match - Create a new match');
  console.log('  GET /match-status/:matchID - Check match status');
});

// Run the boardgame.io server on port 4000
const PORT = process.env.BOARDGAME_PORT || 4000;
server.run(PORT, () => {
  console.log(`🎮 Enhanced Boardgame.io server running on port ${PORT}`);
  console.log(`📡 WebSocket endpoint: ws://localhost:${PORT}`);
  console.log(`🌐 HTTP endpoint: http://localhost:${PORT}`);
  console.log(`\n✅ Server ready with match creation and logging`);
  console.log('-------------------------------------------');
});

// Export the server for use by other modules if needed
module.exports = { server, ToyboxGame };