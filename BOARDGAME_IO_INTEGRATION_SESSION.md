# Boardgame.io Multiplayer Integration Session - September 16, 2024

## Session Overview
Successfully integrated boardgame.io multiplayer framework into the Toybox game, enabling real-time PvP battles with synchronized game state across clients. This replaces the previous custom Socket.io implementation with boardgame.io's robust turn-based game engine.

## Problems Encountered & Solutions

### 1. Initial "arguments is not defined" Error
**Problem**: Using `arguments` object in arrow functions (not allowed in ES6)
**Solution**: Removed `arguments` reference and used proper parameter destructuring

### 2. Teams Data Not Being Passed
**Problem**: When calling `moves.initializeCards(playerTestTeam, aiTestTeam)`, the second parameter was undefined
**Solution**: Changed to pass teams as a single object: `moves.initializeCards({ playerTestTeam, aiTestTeam })`

### 3. Game State Not Initializing
**Problem**: `G.players` was undefined when trying to access it
**Attempted Solutions**:
- Tried using `playerSetup` (boardgame.io's per-player state initializer)
- Manually created players in `setup` function
**Root Cause**: The setup was working, but the move function was receiving the wrong argument structure

### 4. The Critical Discovery - Move Function Arguments
**Problem**: In `startBattle` move, `G.players` was always undefined
**Investigation**: Added extensive logging to discover that the move was receiving:
```javascript
{
  random: Object,
  log: Object,
  events: Object,
  G: Proxy,  // <-- The actual game state was nested here!
  ctx: Object,
  playerID: "0"
}
```

**Solution**: Changed move signature from:
```javascript
startBattle: (G, ctx) => { ... }
```
To:
```javascript
startBattle: ({ G, ctx, events, random, playerID }) => { ... }
```

### 5. Current Issue - Targeting System
**Status**: Cards are now loading correctly, but the targeting system is not responding to clicks
**Next Step**: Need to investigate the targeting overlay component and event handlers

## Key Learnings

### Boardgame.io Move Functions
- Moves receive a single object with destructured properties, not separate arguments
- The actual game state `G` is nested within the argument object
- Always use destructuring: `({ G, ctx, ... }) => { ... }`

### Game State Initialization
- Use `setup` function to initialize the game state structure
- Players object must be properly initialized with all required properties
- Cards arrays should start empty and be populated via moves

### Debugging Techniques Used
1. **Console Logging**: Extensive logging to understand data structure
2. **Debug Panel**: Enabled boardgame.io debug panel to inspect game state
3. **Incremental Testing**: Fixed one issue at a time
4. **Object Inspection**: Used `Object.keys()` to understand what was being passed

## Code Changes Made

### 1. Fixed game.js setup function
```javascript
setup: (ctx) => {
  const players = {};
  for (let i = 0; i < (ctx?.numPlayers || 2); i++) {
    players[i] = {
      health: 100,
      maxHealth: 100,
      cards: [],
      graveyard: [],
      mana: 3,
      maxMana: 3,
      buffs: []
    };
  }
  return { players, turnNumber: 0, activeEffects: [], animationQueue: [], winner: null };
}
```

### 2. Fixed startBattle move
```javascript
startBattle: ({ G, ctx, events, random, playerID }) => {
  // Now properly accesses G.players
  if (!G || !G.players || !G.players['0'] || !G.players['1']) {
    console.error('Players not properly initialized!', G);
    return;
  }
  // Initialize cards...
}
```

### 3. Added default card decks
Created `getDefaultPlayerDeck()` and `getDefaultAIDeck()` functions with predefined test cards

### 4. Updated BoardgameBattle3DFixed component
- Added `playerID="0"` to the BoardgameClient
- Enabled debug mode temporarily for troubleshooting
- Updated button to use `moves.startBattle()` instead of `initializeCards`

## Current State
- ✅ Boardgame.io properly initialized
- ✅ Game state structure correct
- ✅ Cards loading into game state
- ✅ 3D scene rendering cards
- ✅ Targeting system fixed and working
- ✅ All moves using proper destructured format
- ✅ End turn functionality working

## Latest Fixes (Continued Session)

### 6. Fixed Targeting System Not Responding
**Problem**: Clicking on targets in the overlay did nothing
**Root Causes**:
1. ID mismatch - code was comparing `id` but cards use `instanceId`
2. Move signatures still using old format
3. Card finding logic using wrong identifier

**Solutions Applied**:
```javascript
// Fixed ID comparisons in handleCardClick
const isValidTarget = validTargets.some(t => t.instanceId === card.instanceId);

// Fixed playCard move signature
playCard: ({ G, ctx }, cardId, targetId, abilityIndex = 0) => {
  // Now properly destructures arguments
}

// Fixed card finding to use instanceId
const card = player.cards.find(c => c.instanceId === cardId);
const target = [...player.cards, ...opponent.cards].find(c => c.instanceId === targetId);
```

### 7. Fixed All Move Signatures
**Problem**: Many moves were still using `(G, ctx)` instead of `({ G, ctx })`
**Moves Fixed**:
- initializeCards
- playCard
- freezeCard
- healCard
- reviveCard
- buffCard
- clearAnimationQueue
- endTurn
- Turn lifecycle functions (onBegin, onEnd)
- endIf
- enumerate

### 8. Fixed End Turn Functionality
**Problem**: End turn button wasn't working
**Solution**: Used `events.endTurn()` from boardgame.io instead of custom move
```javascript
function ToyboxBattleBoard({ G, ctx, moves, events }) {
  const handleEndTurn = () => {
    if (events.endTurn) {
      events.endTurn();
    }
  };
}
```

## Next Steps
1. Add visual feedback for damage (floating numbers, health bar animations)
2. Implement AI turn logic
3. Add spell effects and animations
4. Connect to multiplayer server
5. Turn off debug mode once everything works

## Files Modified
- `/src/game/boardgame/game.js` - Main game logic
- `/src/components/Battle3D/BoardgameBattle3DFixed.jsx` - 3D battle component
- Created this documentation file

## Phase 2: Boardgame.io PvP Multiplayer (Continued)

### 9. Fixed WebGL Context Lost Error in Boardgame.io Client
**Problem**: The boardgame.io Client component was being recreated on every render, causing WebGL crashes
**Solution**: Moved boardgame.io Client creation outside the component:
```javascript
// Create the multiplayer client - OUTSIDE the component to prevent recreation
const BoardgameClient = Client({
  game: ToyboxGame,
  board: ToyboxBoard,
  multiplayer: SocketIO({ server: 'localhost:4000' }),
  debug: false
});
```

### 10. Fixed Boardgame.io Cards Not Rendering in HearthstoneScene
**Problem**: Cards initialized by boardgame.io were present in game state but not appearing in 3D scene
**Root Cause**: HearthstoneScene checks for `char.isAlive` property before rendering:
```javascript
// In HearthstoneScene.jsx line 505:
if (!char || !char.isAlive) return null;
```

**Solution**: Added `isAlive: true` to all cards in boardgame.io server setup (boardgameServer.cjs):
```javascript
cards: deck.map((card, index) => ({
  ...card,
  id: `p${i}-${card.id}-${index}`,
  instanceId: `p${i}-${index}`,
  currentHealth: card.maxHealth || 100,
  attack: card.attack || 20,
  frozen: false,
  frozenTurns: 0,
  shields: 0,
  position: index,
  owner: i,
  isAlive: true,  // Required for HearthstoneScene to render the card
  image: card.image || null,  // Optional NFT image path
  color: i === 0 ? 'blue' : 'red'  // Team color for fallback rendering
}))
```

### 11. Boardgame.io Server Module Format Issues
**Problem**: ES module imports not working in Node.js backend for boardgame.io server
**Solution**: Created CommonJS version of boardgame.io server (boardgameServer.cjs) with:
- Changed all imports to `require()`
- Defined game logic directly in server file instead of importing
- Cards now initialized in `setup` function instead of via moves

## Key Architecture Decisions

### Boardgame.io Server Setup
- Runs on port 4000 alongside existing Socket.io server (port 4001)
- Uses CommonJS format for Node.js compatibility
- CORS configured for all frontend origins
- Game state initialized entirely in setup phase

### Client-Server Communication
- Using boardgame.io's SocketIO multiplayer transport
- Matches created dynamically via matchID
- Each player gets playerID ('0' or '1') and credentials
- Moves validated server-side automatically

## Testing Instructions
1. Start backend servers:
   - Main server: `cd backend && node server.js`
   - Boardgame.io server: `cd backend && node boardgameServer.cjs`
2. Start frontend: `npm run dev`
3. Navigate to http://localhost:3001
4. Click "⚔️ BG.io PvP" button in main menu
5. Open same URL in another browser/incognito window
6. Click same button in second window
7. Both players should see their cards in 3D scene

## Current Working Features
- ✅ Boardgame.io server running on port 4000
- ✅ Multiplayer client connects via WebSocket
- ✅ Two players can join same match
- ✅ Cards initialized in setup with all required fields
- ✅ 3D scene rendering cards correctly
- ✅ Debug box shows card state
- ✅ Turn system working (player 0 starts)
- ✅ End turn button functional
- ✅ Both players see synchronized game state

## Files Modified
- `/backend/boardgameServer.cjs` - New CommonJS boardgame.io server
- `/src/components/Battle3D/BoardgamePvP.jsx` - PvP client component
- `/src/components/BoardgamePvPTest.jsx` - Test wrapper component
- `/src/game/boardgame/game.js` - Core game logic
- `/src/components/MainMenu.jsx` - Added BG.io PvP button
- `/src/App.jsx` - Added BOARDGAME_PVP_TEST state

## Phase 3: Team Selection and Battle Integration

### 12. Integrated PvP Team Selection Screen
**Problem**: Players needed to select their own teams instead of using default cards
**Solution**:
- Added PvPTeamSelect component to BoardgamePvPTest
- Pass selectedTeam prop through to BoardgamePvP component
- Created team selection flow before battle starts

### 13. Fixed selectedTeam Not Being Passed to Board
**Problem**: selectedTeam was passed to BoardgamePvP but not reaching ToyboxBoard component
**Initial attempts**:
- Tried creating BoardWithTeam wrapper component
- Used React.useMemo to prevent component recreation

**Root Cause**: The move `setPlayerTeam` was only defined in the server (boardgameServer.cjs) but not in the client game file (src/game/boardgame/game.js)

**Solution**: Added the `setPlayerTeam` move to both client and server game definitions:
```javascript
// In src/game/boardgame/game.js
moves: {
  setPlayerTeam: {
    move: ({ G, ctx, playerID }, team) => {
      // Transform selected team into game format
      const playerCards = team.map((card, index) => ({
        ...card,
        instanceId: `p${playerID}-${index}`,
        isAlive: true, // Required for HearthstoneScene
        image: card.nftImage ? `/assets/nft/newnft/${card.nftImage}` : null,
        // ... other card properties
      }));

      G.players[playerID].cards = playerCards;
      G.players[playerID].ready = true;
    },
    noLimit: true // Allow anytime, not just during turn
  }
}
```

### 14. Removed Manual End Turn Button
**Problem**: Game should auto-end turns after moves, not require manual button
**Solution**:
- Removed End Turn button from UI
- Turn automatically ends after executing an ability
- Removed minMoves/maxMoves restrictions that were blocking turn progression

### 15. Fixed Auto-Battle Mechanics
**Problem**: Cards weren't being auto-selected when turns started
**Solution**:
- Added useEffect to auto-select random card when it's player's turn
- Automatically shows targeting overlay for selected ability
- Turn ends immediately after ability execution

## Final Working Architecture

### Complete Flow:
1. **Team Selection Phase**
   - Players click "⚔️ BG.io PvP" button
   - PvPTeamSelect screen shows available NFT toys
   - Players select 4 toys and click "Battle!"
   - Selected team stored in component state

2. **Game Initialization**
   - BoardgamePvP receives selectedTeam prop
   - ToyboxBoard component receives selectedTeam via memoized wrapper
   - On mount, calls `moves.setPlayerTeam(selectedTeam)`
   - Server receives team and populates player cards

3. **Battle Phase**
   - Both players' cards appear in 3D scene with correct NFT images
   - When turn starts, random card auto-selected
   - Player clicks target to execute ability
   - Damage/effects applied on server
   - Turn automatically ends and switches

### Key Technical Details:
- **Boardgame.io moves must be defined in both client and server** - The client needs the move definition to call it
- **Use `noLimit: true` for non-turn moves** - Allows players to set teams before turns start
- **Cards need `isAlive: true`** - HearthstoneScene filters out cards without this property
- **NFT images preserved** - Path converted to `/assets/nft/newnft/${nftImage}`
- **Memoization prevents recreation** - BoardgameClient and BoardWithTeam wrapped in React.useMemo

## Current Features Working:
- ✅ Full team selection with NFT collection
- ✅ Teams synchronized across multiplayer
- ✅ Correct NFT images displayed for selected cards
- ✅ Auto-battle mechanics (random card/ability selection)
- ✅ Damage and effects applied properly
- ✅ Turn-based gameplay with automatic progression
- ✅ Winner detection when all cards defeated

## Commands to Run:
```bash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Main backend
cd backend && node server.js

# Terminal 3 - Boardgame.io server
cd backend && node boardgameServer.cjs
```

## Phase 4: Production-Ready Multiplayer with Lobby System (September 17, 2024)

### 16. Integrated with PvP Lobby Matchmaking System
**Problem**: Need to connect boardgame.io battles with the existing PvP lobby/matchmaking system
**Solution**:
- Created PvPBoardgameBattle component that wraps BoardgamePvPWithLobby
- Integrated with existing wallet-based matchmaking
- Pass battleData from lobby to boardgame.io client

### 17. Critical Fix: Match Pre-creation vs On-Demand Creation
**Initial Approach (Pre-created matches)**:
- Created 20 matches at server startup
- Match pool manager assigned matches to players
- **Issue**: Players not marked as "active" in pre-created matches → "disallowed move" errors

**Final Solution (On-demand creation)**:
- Removed all pre-creation logic
- When players are matched in lobby:
  1. Create match via boardgame.io API
  2. Auto-join both players to get credentials
  3. Pass credentials to clients
  4. Clients connect with proper authentication

```javascript
// In backend/server.js
async function createBoardgameMatch() {
  const response = await fetch('http://localhost:4000/games/toybox-battle/create', {
    method: 'POST',
    body: JSON.stringify({ numPlayers: 2 })
  });
  return response.json().matchID;
}

async function joinBoardgameMatch(matchId, playerId) {
  const response = await fetch(`http://localhost:4000/games/${matchId}/join`, {
    method: 'POST',
    body: JSON.stringify({ playerID: playerId })
  });
  return response.json().playerCredentials;
}
```

### 18. Fixed "Player Not Active" Errors
**Root Cause**: Boardgame.io requires players to be explicitly joined to matches
**Solution Implemented**:
1. Server creates match on-demand
2. Server joins both players automatically
3. Server sends credentials to clients
4. Clients connect with credentials for authentication

### 19. Connection Stability Improvements
**Problems Fixed**:
1. **WebSocket disconnections** → Added reconnection logic
2. **Moves sent too early** → Check both players in playOrder
3. **Moves after game over** → Added gameover checks
4. **Context lost** → Better error handling

**Implementation**:
```javascript
// Wait for both players before sending moves
const bothPlayersConnected = ctx?.playOrder?.length === 2;
const canSelectTeam = bothPlayersConnected && !ctx?.gameover && !G?.players?.[playerID]?.ready;

// WebSocket resilience
multiplayer: SocketIO({
  server: 'http://localhost:4000',
  socketOpts: {
    reconnection: true,
    reconnectionDelay: 500,
    reconnectionAttempts: 10,
    transports: ['websocket', 'polling'],
    query: { playerID, credentials }
  }
})
```

### 20. Complete Architecture Overview

#### Server Architecture:
1. **Main Server (port 3003)**:
   - Handles wallet authentication
   - PvP lobby and matchmaking
   - Creates boardgame.io matches on-demand
   - Joins players and distributes credentials

2. **Boardgame.io Server (port 4000)**:
   - Manages game state
   - Validates moves
   - Synchronizes clients
   - No pre-created matches

#### Client Flow:
1. Connect wallet → Enter PvP lobby
2. Find match → Server creates boardgame.io match
3. Receive credentials → Connect to match
4. Wait for both players → Send team selection
5. Play game → Auto-turn progression
6. Game ends → Return to lobby

#### Key Files Structure:
```
backend/
  server.js              - Main server with on-demand match creation
  boardgameServer.cjs    - Clean boardgame.io server (no pre-creation)

src/components/Battle3D/
  PvPBoardgameBattle.jsx      - Entry point from lobby
  BoardgamePvPWithLobby.jsx   - Handles credentials and joining
  BoardgamePvP.jsx            - Core boardgame.io client
  HearthstoneScene.jsx        - 3D rendering
```

## Final Solution Summary

### What We Built:
A production-ready multiplayer card battle system using:
- **boardgame.io** for authoritative game state
- **Socket.io** for real-time communication
- **Three.js/R3F** for 3D visualization
- **Solana wallets** for player identity

### Key Technical Decisions:
1. **On-demand match creation** instead of pre-creation
2. **Server-side join** with credential distribution
3. **Connection validation** before allowing moves
4. **Graceful error handling** for disconnects

### Problems Solved:
- ✅ "Player not active" errors
- ✅ "Disallowed move" errors
- ✅ Socket disconnection issues
- ✅ Moves after game over
- ✅ WebGL context loss
- ✅ Player synchronization

### Testing Instructions:
```bash
# Start servers
node backend/boardgameServer.cjs  # Port 4000
node backend/server.js             # Port 3003
npm run dev                        # Port 3000

# Test flow
1. Open two browsers at localhost:3000
2. Connect wallets in both
3. Enter PvP lobby
4. Start matchmaking
5. Select teams when matched
6. Play synchronized battle
```

## Lessons Learned

### Boardgame.io Best Practices:
1. **Always use on-demand match creation** for dynamic matchmaking
2. **Server must join players** to mark them as active
3. **Pass credentials to clients** for authentication
4. **Check playOrder** before allowing moves
5. **Validate game state** before every move

### Common Pitfalls Avoided:
- Don't pre-create matches (players won't be active)
- Don't send moves before both players joined
- Don't recreate Client component (causes WebGL loss)
- Don't forget gameover checks
- Don't assume automatic player registration

---
*Session completed: September 17, 2024*
*System Status: Production-ready multiplayer battles with full lobby integration*
*Next steps: Performance optimization and additional game modes*