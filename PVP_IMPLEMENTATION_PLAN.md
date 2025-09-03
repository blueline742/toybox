# Toybox Brawl PvP Implementation Plan

## Overview
Implement real-money PvP battles using Solana blockchain for wagering, matchmaking, and prize distribution.

## Key References
- **Noodle.gg**: $350k+ in SOL wagered, simple snake game
- **SOL Arena**: 80k+ players, uses commit-reveal for fairness
- **Honeyland**: Turn-based PvP with wagering

## Implementation Phases

### Phase 1: Smart Contract (Solana Program)
```rust
// Core contract structure
pub struct BattleEscrow {
    pub player1: Pubkey,
    pub player2: Pubkey,
    pub wager_amount: u64,
    pub battle_id: String,
    pub winner: Option<Pubkey>,
    pub state: BattleState,
}

pub enum BattleState {
    WaitingForOpponent,
    InProgress,
    Completed,
    Cancelled,
}
```

**Key Functions:**
- `create_battle_wager()` - Player 1 deposits SOL
- `join_battle_wager()` - Player 2 matches wager
- `submit_battle_result()` - Oracle/backend submits winner
- `claim_winnings()` - Winner claims 90%, 10% to burn

### Phase 2: Backend Service (Node.js/Socket.io)
```javascript
// Matchmaking queue
const matchmakingQueue = new Map();

// WebSocket events
io.on('connection', (socket) => {
  socket.on('find_match', async (data) => {
    const { wallet, wagerAmount, teamData } = data;
    
    // Add to queue or match immediately
    const opponent = findOpponent(wagerAmount);
    if (opponent) {
      createBattle(wallet, opponent, wagerAmount);
    } else {
      addToQueue(wallet, wagerAmount, teamData);
    }
  });
  
  socket.on('battle_move', (data) => {
    // Relay moves between players
    socket.to(data.battleId).emit('opponent_move', data);
  });
});
```

### Phase 3: Frontend Integration

#### PvP Lobby Component
```jsx
// src/components/PvPLobby.jsx
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';

const PvPLobby = () => {
  const [matchmaking, setMatchmaking] = useState(false);
  const [wagerAmount, setWagerAmount] = useState(0.1);
  const { publicKey, signTransaction } = useWallet();
  
  const findMatch = async () => {
    // 1. Sign wager transaction
    const tx = await createWagerTransaction(wagerAmount);
    const signed = await signTransaction(tx);
    
    // 2. Start matchmaking
    socket.emit('find_match', {
      wallet: publicKey.toString(),
      wagerAmount,
      teamData: selectedTeam
    });
    
    setMatchmaking(true);
  };
  
  return (
    <div className="pvp-lobby">
      <h2>PvP Battle Arena</h2>
      <div className="wager-select">
        <label>Wager Amount (SOL):</label>
        <select onChange={(e) => setWagerAmount(e.target.value)}>
          <option value="0.1">0.1 SOL</option>
          <option value="0.25">0.25 SOL</option>
          <option value="0.5">0.5 SOL</option>
          <option value="1">1 SOL</option>
        </select>
      </div>
      
      {!matchmaking ? (
        <button onClick={findMatch}>Find Opponent</button>
      ) : (
        <div className="matchmaking-status">
          <div className="spinner"></div>
          <p>Finding opponent...</p>
        </div>
      )}
    </div>
  );
};
```

#### Real-time Battle Sync
```jsx
// Modify AutoBattleScreen.jsx for PvP
useEffect(() => {
  if (isPvP) {
    socket.on('opponent_move', (move) => {
      // Apply opponent's move to local game state
      handleOpponentAction(move);
    });
    
    socket.on('battle_ended', async (result) => {
      if (result.winner === publicKey.toString()) {
        // Claim winnings
        await claimPrize(battleId);
      }
    });
  }
}, [isPvP]);
```

## Technical Architecture

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│   Player 1  │────▶│   Backend    │◀────│   Player 2   │
│  (Frontend) │     │  (Socket.io) │     │  (Frontend)  │
└─────────────┘     └──────────────┘     └──────────────┘
       │                    │                     │
       └────────────────────┼─────────────────────┘
                           │
                    ┌──────▼──────┐
                    │   Solana    │
                    │   Program   │
                    │  (Escrow)   │
                    └─────────────┘
```

## Implementation Steps

### Step 1: Solana Program Development
1. Set up Anchor framework
2. Create escrow program with wager logic
3. Implement commit-reveal for fairness
4. Deploy to devnet

### Step 2: Backend Service
1. Create Node.js server with Socket.io
2. Implement matchmaking queue
3. Add game state synchronization
4. Connect to Solana for transaction verification

### Step 3: Frontend Updates
1. Add PvP lobby component
2. Integrate WebSocket connection
3. Modify battle screen for real-time sync
4. Add transaction signing flow

### Step 4: Testing Flow
1. Deploy contract to devnet
2. Test with 2 browser windows
3. Verify escrow and prize distribution
4. Test edge cases (disconnections, timeouts)

## Security Considerations

1. **Commit-Reveal Scheme**: Prevent move prediction
2. **Timeout Mechanism**: Auto-forfeit if player disconnects
3. **Oracle Validation**: Backend validates all moves
4. **Anti-Cheat**: Hash game state, verify on-chain

## Devnet Testing Configuration

```javascript
// src/config/solana.js
export const NETWORK = 'devnet';
export const RPC_ENDPOINT = 'https://api.devnet.solana.com';
export const PROGRAM_ID = 'YOUR_PROGRAM_ID_HERE';
export const BURN_WALLET = '11111111111111111111111111111111'; // System program

export const WAGER_OPTIONS = [
  { label: '0.1 SOL', value: 0.1 },
  { label: '0.25 SOL', value: 0.25 },
  { label: '0.5 SOL', value: 0.5 },
  { label: '1 SOL', value: 1.0 }
];
```

## MVP Features
1. ✅ Fixed wager amounts (0.1, 0.25, 0.5, 1 SOL)
2. ✅ Simple matchmaking (first available opponent)
3. ✅ Real-time battle sync
4. ✅ Automatic prize distribution
5. ✅ 10% burn mechanism

## Future Enhancements
- NFT character requirements
- Ranked matchmaking (ELO system)
- Tournament mode
- Spectator mode
- Replay system
- Mobile app

## Estimated Timeline
- **Week 1**: Solana program development
- **Week 2**: Backend service + matchmaking
- **Week 3**: Frontend integration
- **Week 4**: Testing and refinement

## Resources
- [Anchor Framework Docs](https://www.anchor-lang.com/)
- [Solana Web3.js](https://solana-labs.github.io/solana-web3.js/)
- [Socket.io Docs](https://socket.io/docs/v4/)
- [Solana Cookbook](https://solanacookbook.com/)