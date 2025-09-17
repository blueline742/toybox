# Boardgame.io PvP Authentication Troubleshooting Session

## Date: September 17, 2024

## Problem
Players were stuck on "Waiting for Opponent" overlay - boardgame.io moves were being called with `playerID=null` despite credentials being provided from the matchmaking server.

## Root Causes Identified

### 1. **Button Navigation Issue**
- ❌ "BG.io PvP" button was going to test mode (`BoardgamePvPTest`) with hardcoded `matchID='test-match-001'`
- ✅ **Fixed:** Changed button to use proper PvP lobby flow (`onStartPvP`)

### 2. **Missing Syntax**
- ❌ Missing closing brace `}` for BoardgamePvP function causing export error
- ✅ **Fixed:** Added missing brace and moved export outside function

### 3. **PlayerID Not Passed to Board Component**
- ❌ boardgame.io Client doesn't automatically pass `playerID` as prop to board component
- ❌ Used `{...props}` spread expecting playerID to be included
- ✅ **Fixed:** Explicitly pass `playerID={playerID}` from parent component to ToyboxBoard

### 4. **WebSocket Transport Mismatch**
- ❌ Client using `SocketIO` transport trying to connect to `/socket.io/` endpoint
- ❌ Server using default boardgame.io WebSocket (not Socket.IO protocol)
- ✅ **Fixed:** Properly imported and used `SocketIO` from `boardgame.io/multiplayer`

### 5. **Multiplayer Configuration Error**
- ❌ Passed plain object `{ server: 'localhost:4000' }` to multiplayer config
- ❌ Got error: "multiplayer is not a function"
- ✅ **Fixed:** Use `SocketIO({ server: 'http://localhost:4000' })` function call

### 6. **PlayerID Type Mismatch**
- ❌ Passed playerID as number (0, 1) but boardgame.io expects strings ("0", "1")
- ✅ **Fixed:** Convert with `String(playerID)` in client config

### 7. **Premature Move Execution**
- ❌ Called `setPlayerTeam` before WebSocket connection established
- ❌ Moves executed before client authenticated with server
- ✅ **Fixed:** Added connection checks and 1.5s delay before sending moves

### 8. **Missing Null Checks**
- ❌ No protection against undefined playerID in game moves
- ✅ **Fixed:** Added null checks in `setPlayerTeam` move

## Key Lessons Learned

1. **boardgame.io doesn't automatically pass playerID to board components** - must explicitly forward it
2. **PlayerID must be a string** ("0", "1") not a number for boardgame.io
3. **Credentials are required** for multiplayer authentication
4. **WebSocket must be connected** before sending any moves
5. **Use the correct transport** - SocketIO from boardgame.io/multiplayer, not custom implementations
6. **Debug mode is essential** - enables boardgame.io debug panel showing connection state

## Final Working Configuration

```javascript
// Client setup
const BoardgameClient = Client({
  game: ToyboxGame,
  board: BoardWithTeam,
  playerID: String(playerID),  // Must be string!
  credentials: credentials,     // Required for auth
  matchID: matchID,
  multiplayer: SocketIO({ server: 'http://localhost:4000' }),
  debug: true
});

// Board wrapper must forward playerID
<ToyboxBoard
  {...props}
  playerID={playerID}  // Explicitly pass from parent
  selectedTeam={selectedTeam}
  credentials={credentials}
/>
```

## Testing Checklist
- [ ] Clear browser cache completely
- [ ] Use proper flow: Main Menu → BG.io PvP → Team Select → Lobby → Find Match
- [ ] Check console for "playerID type: string"
- [ ] Verify no "playerID=[null]" errors in server logs
- [ ] Confirm both players see each other's teams
- [ ] Battle starts after both teams ready

## Files Modified
- `/src/components/MainMenu.jsx` - Fixed button to use proper flow
- `/src/components/Battle3D/BoardgamePvP.jsx` - Fixed playerID passing and client config
- `/src/game/boardgame/game.js` - Added null checks
- `/backend/server.js` - Added credential logging

### 9. **PlayerID Type Consistency**
- ❌ boardgame.io expects string playerID in client config but uses it internally in moves
- ❌ When playerID is null in moves, it means credentials weren't properly authenticated
- ✅ **Fixed:** Ensured string playerID in client config, added better authentication checks

### 10. **Authentication Polling**
- ❌ Simple delays don't guarantee authentication is complete
- ✅ **Fixed:** Added `waitForServerAuthentication` polling mechanism
- Checks ctx.playOrder includes playerID before sending moves

### 11. **Client Start/Subscribe**
- ❌ Client may not automatically connect without explicit start
- ✅ **Fixed:** Added explicit client.start() and client.subscribe() calls

## Key Discovery
The `playerID` parameter in move functions comes from boardgame.io's internal authentication context, NOT from what we pass to the client. When it's `null`, it means:
1. Credentials haven't been accepted by the server
2. Client is connecting as a spectator (null playerID)
3. WebSocket handshake incomplete

### 12. **State Synchronization Issue**
- ❌ Each player only sees their own team updates
- ❌ Player 0 sees their team but Player 1's is empty, and vice versa
- ❌ Boardgame.io not syncing state between clients
- 🔍 **Root cause:** Clients might be connecting to different game instances
- ✅ **Solution:** Ensure both clients use the same matchID and are properly joined

## Current Status: TEAMS WORKING, SYNC ISSUE ⚠️
- Players can successfully set their teams
- The `submittedBy` metadata workaround is functioning
- Issue: State not syncing between clients
- Next: Fix state synchronization to show both teams

### 13. **State Synchronization Debug**
- ❌ Added extensive logging to track state updates
- 🔍 **Discovery:** Game setup is being called multiple times (seen in server logs)
- 🔍 **Discovery:** Each client might be creating a new game instance instead of joining existing
- ✅ **Added:** Enhanced logging in client subscription to track all state changes
- ✅ **Added:** Board component logging to see what state is received
- ✅ **Added:** Setup counter to track how many times game is initialized
- 🔍 **Current Investigation:** Why game state resets instead of persisting team selections

### 14. **Phase Configuration for Simultaneous Moves** ⭐
- ❌ Previous configuration had no phase system, causing "player not active" errors
- ✅ **Fixed:** Added proper phase configuration with `setup` and `playing` phases
- ✅ **Fixed:** Setup phase allows all players to submit moves simultaneously
- ✅ **Fixed:** Moves are now available to all players in setup phase
- ✅ **Fixed:** Phase transitions automatically when both players are ready
- 🔑 **Key Change:** Separated `setPlayerTeam` function and added it to setup phase moves
- 🔑 **Solution:** This enables proper state synchronization between clients!