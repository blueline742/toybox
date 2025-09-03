# PvP Setup & Testing Instructions

## What's Been Implemented

✅ **Solana Program** (`/solana-program/`)
- Escrow contract for holding wagers
- Battle state management
- Winner payout with 10% burn mechanism
- Timeout/cancel functionality

✅ **Backend Server** (`/backend/`)
- Socket.io matchmaking service
- Real-time battle synchronization
- Queue management by wager amount
- Disconnect handling with timeout

✅ **Frontend Components** (`/src/components/PvPLobby.jsx`)
- Wallet connection integration
- Wager selection UI
- Matchmaking queue display
- Real-time stats dashboard

## Setup Instructions

### 1. Install Solana CLI Tools
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Install Anchor Framework
cargo install --git https://github.com/coral-xyz/anchor anchor-cli --locked
```

### 2. Deploy Solana Program to Devnet
```bash
cd solana-program

# Build the program
anchor build

# Get a new keypair for the program
solana-keygen new -o target/deploy/toybox_brawl-keypair.json

# Airdrop SOL for deployment
solana airdrop 2 --url devnet

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Note the Program ID that gets output!
```

### 3. Start Backend Server
```bash
cd backend

# Install dependencies
npm install

# Create .env file
echo "PORT=3001" > .env
echo "PROGRAM_ID=YOUR_PROGRAM_ID_HERE" >> .env

# Start server
npm run dev
```

### 4. Configure Frontend
```bash
# In root directory, create .env.local
echo "VITE_BACKEND_URL=http://localhost:3001" > .env.local
echo "VITE_PROGRAM_ID=YOUR_PROGRAM_ID_HERE" >> .env.local

# Start frontend
npm run dev
```

## Testing the PvP System

### Test Setup (2 Browser Windows)

1. **Browser 1 (Player 1)**
   - Open http://localhost:5173
   - Connect Phantom wallet (Account 1)
   - Get devnet SOL: https://faucet.solana.com/
   - Select team
   - Go to PvP lobby
   - Select 0.1 SOL wager
   - Click "Find Opponent"

2. **Browser 2 (Player 2)**
   - Open in incognito/different browser
   - Connect different wallet (Account 2)
   - Get devnet SOL
   - Select team
   - Go to PvP lobby
   - Select same wager (0.1 SOL)
   - Click "Find Opponent"

3. **Match Should Start Automatically**
   - Both players see "MATCH FOUND!"
   - Battle begins after 3 seconds
   - Moves sync in real-time
   - Winner receives 0.18 SOL (90% of 0.2 pot)
   - 0.02 SOL burned (10%)

### Testing Edge Cases

1. **Disconnect During Match**
   - Start a match
   - Close one browser
   - Other player should win after 30s timeout

2. **Cancel Matchmaking**
   - Enter queue
   - Click cancel
   - Should exit queue cleanly

3. **Multiple Wager Amounts**
   - Test different wager tiers
   - Ensure only same-wager players match

## Integration Points Needed

### 1. Update MainMenu.jsx
```jsx
import PvPLobby from './PvPLobby';

// In your menu options
<button onClick={() => setView('pvp')}>
  Play for SOL (PvP)
</button>

// In your view rendering
{view === 'pvp' && (
  <PvPLobby 
    onBattleStart={handlePvPBattleStart}
    selectedTeam={selectedTeam}
  />
)}
```

### 2. Modify AutoBattleScreen.jsx
Add PvP mode support:
```jsx
// Add to component props
const AutoBattleScreen = ({ isPvP, socket, battleId, ... }) => {
  
  // Add socket listeners for PvP
  useEffect(() => {
    if (isPvP && socket) {
      socket.on('opponent_action', (action) => {
        // Apply opponent's move
        handleOpponentMove(action);
      });
      
      // Emit your moves
      const emitMove = (action) => {
        socket.emit('battle_action', {
          battleId,
          action,
          wallet: publicKey.toString()
        });
      };
    }
  }, [isPvP, socket]);
}
```

## Environment Variables

### Frontend (.env.local)
```
VITE_BACKEND_URL=http://localhost:3001
VITE_PROGRAM_ID=YOUR_PROGRAM_ID
VITE_RPC_ENDPOINT=https://api.devnet.solana.com
```

### Backend (.env)
```
PORT=3001
PROGRAM_ID=YOUR_PROGRAM_ID
ORACLE_PRIVATE_KEY=YOUR_ORACLE_KEY
RPC_ENDPOINT=https://api.devnet.solana.com
```

## Devnet Resources

- **Get Test SOL**: https://faucet.solana.com/
- **Solana Explorer**: https://explorer.solana.com/?cluster=devnet
- **Program Logs**: `solana logs YOUR_PROGRAM_ID --url devnet`

## Common Issues & Solutions

### Issue: "Transaction simulation failed"
**Solution**: Ensure you have enough SOL for wager + fees (add 0.01 SOL buffer)

### Issue: "WebSocket connection failed"
**Solution**: Check backend is running on port 3001

### Issue: "Program account not found"
**Solution**: Redeploy program and update PROGRAM_ID in configs

### Issue: "Wallet not connected"
**Solution**: Install Phantom wallet and switch to Devnet

## Next Steps for Production

1. **Security Audit**
   - Review smart contract for vulnerabilities
   - Add rate limiting to backend
   - Implement anti-cheat measures

2. **Scalability**
   - Add Redis for queue management
   - Implement horizontal scaling for backend
   - Use CDN for static assets

3. **Features**
   - Add replay system
   - Implement ELO ranking
   - Create tournament mode
   - Add spectator functionality

4. **Monitoring**
   - Add error tracking (Sentry)
   - Implement analytics
   - Monitor on-chain transactions

## NFT Integration (Future)

When ready to add NFT requirements:
1. Mint toy NFTs with metadata
2. Add NFT ownership verification in smart contract
3. Use NFT attributes for battle stats
4. Enable NFT trading/marketplace

## Support

- Solana Discord: https://discord.gg/solana
- Anchor Docs: https://www.anchor-lang.com/
- Socket.io Docs: https://socket.io/docs/