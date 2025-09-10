import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import BattleEngine from './battleEngine.js';
import PvPBattleManager from './pvpBattleManager.js';
// Anchor imports removed for now - will add when smart contract is deployed
// import IDL from './idl/toybox_brawl.json' assert { type: 'json' };

const app = express();
const httpServer = createServer(app);
// CORS configuration
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? [process.env.FRONTEND_URL || 'https://toyboxsol.netlify.app']
  : ["http://localhost:3000", "http://localhost:3001", "http://localhost:5173", "http://localhost:5174"];

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));
app.use(express.json());

// Health check endpoint for Render
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Solana configuration
const NETWORK = 'https://api.devnet.solana.com';
// const PROGRAM_ID = new PublicKey('YOUR_PROGRAM_ID_HERE'); // Will be set when deployed
const connection = new Connection(NETWORK, 'confirmed');

// Oracle wallet for submitting results
const oracleKeypair = Keypair.generate(); // In production, load from env

// Matchmaking queue
const matchmakingQueue = new Map();
const activeBattles = new Map();

// Player sessions
const playerSessions = new Map();

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id, 'from', socket.handshake.headers.origin);
  
  socket.on('authenticate', ({ wallet }) => {
    playerSessions.set(socket.id, {
      wallet,
      socket: socket.id,
      inBattle: false
    });
  });
  
  socket.on('find_match', async ({ wallet, wagerAmount, teamData }) => {
    console.log(`Player ${wallet} looking for match with ${wagerAmount} SOL wager`);
    
    // Check if there's an opponent waiting
    const queueKey = `${wagerAmount}`;
    const waitingPlayers = matchmakingQueue.get(queueKey) || [];
    
    if (waitingPlayers.length > 0) {
      // Found opponent
      const opponent = waitingPlayers.shift();
      
      // Create battle
      const battleId = generateBattleId();
      const battle = {
        id: battleId,
        player1: opponent,
        player2: {
          wallet,
          socket: socket.id,
          teamData
        },
        wagerAmount,
        state: 'starting',
        moves: [],
        currentTurn: opponent.wallet
      };
      
      activeBattles.set(battleId, battle);
      
      // The initiating player joins the room
      socket.join(battleId);
      // The opponent will join when they emit 'battle_ready'
      
      // Notify both players with each other's team data
      // Send to player 1 (opponent who was waiting)
      io.sockets.sockets.get(opponent.socket)?.emit('match_found', {
        battleId,
        opponent: {
          player1: opponent.wallet,
          player2: wallet
        },
        opponentTeam: teamData, // Player 2's team
        playerNumber: 1,
        wagerAmount
      });
      
      // Send to player 2 (current player)
      socket.emit('match_found', {
        battleId,
        opponent: {
          player1: opponent.wallet,
          player2: wallet
        },
        opponentTeam: opponent.teamData, // Player 1's team
        playerNumber: 2,
        wagerAmount
      });
      
      // Update queue
      if (waitingPlayers.length === 0) {
        matchmakingQueue.delete(queueKey);
      } else {
        matchmakingQueue.set(queueKey, waitingPlayers);
      }
      
    } else {
      // Add to queue
      waitingPlayers.push({
        wallet,
        socket: socket.id,
        teamData,
        timestamp: Date.now()
      });
      matchmakingQueue.set(queueKey, waitingPlayers);
      
      socket.emit('queued', {
        position: waitingPlayers.length,
        wagerAmount
      });
    }
  });
  
  socket.on('cancel_matchmaking', ({ wallet, wagerAmount }) => {
    const queueKey = `${wagerAmount}`;
    const waitingPlayers = matchmakingQueue.get(queueKey) || [];
    
    const filtered = waitingPlayers.filter(p => p.wallet !== wallet);
    if (filtered.length > 0) {
      matchmakingQueue.set(queueKey, filtered);
    } else {
      matchmakingQueue.delete(queueKey);
    }
    
    socket.emit('matchmaking_cancelled');
  });
  
  socket.on('battle_ready', ({ battleId, wallet }) => {
    const battle = activeBattles.get(battleId);
    if (!battle) return;
    
    // Make sure this socket joins the battle room (only if not already in it)
    if (!socket.rooms.has(battleId)) {
      socket.join(battleId);
      console.log(`Socket ${socket.id} for wallet ${wallet} joined battle room ${battleId}`);
    }
    
    if (!battle.ready) battle.ready = [];
    // Prevent duplicate ready signals
    if (!battle.ready.includes(wallet)) {
      battle.ready.push(wallet);
    }
    
    if (battle.ready.length === 2 && !battle.manager) {
      // Both players ready and manager not yet created
      battle.state = 'in_progress';
      
      try {
        // Create PvP battle manager
        console.log('Creating PvP battle manager for:', battleId);
        console.log('Player 1 team:', battle.player1.teamData);
        console.log('Player 2 team:', battle.player2.teamData);
        
        battle.manager = new PvPBattleManager(
          io,
          battleId,
          battle.player1,
          battle.player2
        );
        
        // Send initial state to both players
        const initialState = battle.manager.getState();
        console.log('Initial battle state:', initialState);
        
        io.to(battleId).emit('battle_initialized', {
          state: initialState,
          seed: battle.manager.seed
        });
        
        // Start the first turn after a delay
        setTimeout(() => {
          battle.manager.startTurn();
        }, 2000);
        
      } catch (error) {
        console.error('Error creating battle:', error);
        io.to(battleId).emit('battle_error', {
          message: 'Failed to initialize battle',
          error: error.message
        });
        return;
      }
    }
  });
  
  // Handle target selection from players
  socket.on('select_target', ({ battleId, targetId, wallet }) => {
    const battle = activeBattles.get(battleId);
    if (!battle || !battle.manager) return;
    
    // Pass target selection to the battle manager
    battle.manager.handleTargetSelection(wallet, targetId);
  });
  
  // Remove old battle_action handler - server now controls all battle logic
  // Players just receive updates from the server
  
  socket.on('battle_ended', async ({ battleId, winner, finalState }) => {
    const battle = activeBattles.get(battleId);
    if (!battle) return;
    
    battle.state = 'completed';
    battle.winner = winner;
    battle.finalState = finalState;
    
    // Submit result to Solana
    try {
      await submitBattleResult(battleId, winner);
      
      io.to(battleId).emit('battle_complete', {
        winner,
        canClaim: true
      });
    } catch (error) {
      console.error('Failed to submit battle result:', error);
      io.to(battleId).emit('battle_complete', {
        winner,
        canClaim: false,
        error: 'Failed to record result on-chain'
      });
    }
    
    // Clean up immediately since we handle cleanup in battle completion
    activeBattles.delete(battleId);
  });
  
  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    
    // Handle disconnect during matchmaking
    for (const [key, players] of matchmakingQueue.entries()) {
      const filtered = players.filter(p => p.socket !== socket.id);
      if (filtered.length !== players.length) {
        if (filtered.length > 0) {
          matchmakingQueue.set(key, filtered);
        } else {
          matchmakingQueue.delete(key);
        }
      }
    }
    
    // Handle disconnect during battle
    for (const [battleId, battle] of activeBattles.entries()) {
      if (battle.player1.socket === socket.id || battle.player2.socket === socket.id) {
        // Notify opponent
        socket.to(battleId).emit('opponent_disconnected');
        
        // Start timeout for reconnection
        setTimeout(() => {
          const b = activeBattles.get(battleId);
          if (b && b.state === 'in_progress') {
            // Auto-forfeit after 30 seconds
            const winner = b.player1.socket === socket.id ? b.player2.wallet : b.player1.wallet;
            io.to(battleId).emit('battle_complete', {
              winner,
              reason: 'opponent_timeout'
            });
            activeBattles.delete(battleId);
          }
        }, 30000);
      }
    }
    
    playerSessions.delete(socket.id);
  });
});

// Helper functions
function generateBattleId() {
  return `battle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

async function submitBattleResult(battleId, winner) {
  // In production, this would submit the result to your Solana program
  console.log(`Submitting result for battle ${battleId}: Winner ${winner}`);
  
  // TODO: Implement actual Solana transaction
  // const provider = new AnchorProvider(connection, oracleKeypair, {});
  // const program = new Program(IDL, PROGRAM_ID, provider);
  // 
  // await program.methods
  //   .submitBattleResult(new PublicKey(winner))
  //   .accounts({
  //     battle: deriveBattlePDA(battleId),
  //     oracle: oracleKeypair.publicKey,
  //   })
  //   .rpc();
}

// API endpoints
app.get('/api/stats', (req, res) => {
  res.json({
    playersOnline: playerSessions.size,
    activeBattles: activeBattles.size,
    playersInQueue: Array.from(matchmakingQueue.values()).flat().length
  });
});

app.get('/api/queue/:wagerAmount', (req, res) => {
  const { wagerAmount } = req.params;
  const queue = matchmakingQueue.get(wagerAmount) || [];
  res.json({
    playersWaiting: queue.length,
    estimatedWait: queue.length * 30 // 30 seconds estimate per player
  });
});

const PORT = process.env.PORT || 3003;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server ready for connections`);
});

// Cleanup old queue entries every minute
setInterval(() => {
  const now = Date.now();
  for (const [key, players] of matchmakingQueue.entries()) {
    const filtered = players.filter(p => now - p.timestamp < 300000); // 5 minutes
    if (filtered.length !== players.length) {
      if (filtered.length > 0) {
        matchmakingQueue.set(key, filtered);
      } else {
        matchmakingQueue.delete(key);
      }
    }
  }
}, 60000);