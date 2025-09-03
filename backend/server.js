import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import BattleEngine from './battleEngine.js';
// Anchor imports removed for now - will add when smart contract is deployed
// import IDL from './idl/toybox_brawl.json' assert { type: 'json' };

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:5173"],
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

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
  console.log('Player connected:', socket.id);
  
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
      
      // Join socket rooms
      socket.join(battleId);
      io.sockets.sockets.get(opponent.socket)?.join(battleId);
      
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
    
    if (!battle.ready) battle.ready = [];
    battle.ready.push(wallet);
    
    if (battle.ready.length === 2) {
      // Both players ready, initialize battle engine
      battle.state = 'in_progress';
      
      try {
        // Create server-side battle engine
        console.log('Creating battle engine for:', battleId);
        console.log('Player 1 team:', battle.player1.teamData);
        console.log('Player 2 team:', battle.player2.teamData);
        
        battle.engine = new BattleEngine(
          battleId,
          { teamData: battle.player1.teamData, wallet: battle.player1.wallet },
          { teamData: battle.player2.teamData, wallet: battle.player2.wallet }
        );
        
        // Send initial state to both players
        const initialState = battle.engine.getState();
        console.log('Initial battle state:', initialState);
        
        io.to(battleId).emit('battle_initialized', {
          state: initialState,
          seed: battle.engine.seed
        });
      } catch (error) {
        console.error('Error creating battle:', error);
        io.to(battleId).emit('battle_error', {
          message: 'Failed to initialize battle',
          error: error.message
        });
        return;
      }
      
      // Start automated battle turns with proper pacing
      // Wait a bit before starting turns
      setTimeout(() => {
        battle.turnInterval = setInterval(() => {
          if (battle.engine.isComplete) {
            clearInterval(battle.turnInterval);
            
            // Send final results
            io.to(battleId).emit('battle_complete', {
              winner: battle.engine.winner === 'player1' ? battle.player1.wallet : battle.player2.wallet,
              finalState: battle.engine.getState()
            });
            
            return;
          }
          
          // Execute next turn on server
          const action = battle.engine.executeTurn();
          if (action) {
            console.log('Broadcasting action:', action);
            // Broadcast action to both players
            io.to(battleId).emit('battle_action', {
              action,
              state: battle.engine.getState()
            });
          }
        }, 4000); // 4 seconds per turn for smoother animations
      }, 2000); // Wait 2 seconds before starting
    }
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
    
    // Clean up
    setTimeout(() => {
      activeBattles.delete(battleId);
    }, 60000); // Keep for 1 minute for debugging
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

const PORT = process.env.PORT || 3001;
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