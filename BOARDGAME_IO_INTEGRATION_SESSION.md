# Boardgame.io Integration Session - September 16, 2024

## Session Overview
Successfully debugged and fixed the boardgame.io integration with the 3D battle system. The main issue was understanding how boardgame.io passes arguments to move functions and properly initializing the game state.

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

## Testing Instructions
1. Start backend server: `cd backend && node server.js`
2. Start frontend: `npm run dev`
3. Navigate to http://localhost:3001
4. Click "Test Boardgame Battle"
5. Click "Click to Start Battle!"
6. Cards should appear in 3D scene

---
*Session completed: September 16, 2024*
*Next task: Fix targeting system click handlers*