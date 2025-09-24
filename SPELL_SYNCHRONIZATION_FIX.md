# Spell Synchronization Fix - PvP Battle System

## Problem Description
In PvP battles, spell effects were appearing from the wrong caster on the opponent's screen. When Player A cast Ice Nova from their wizard, it appeared correctly on Player A's screen but originated from the enemy wizard on Player B's screen. This affected all spell types including Pyroblast, Ice Nova, Chain Lightning, and Sword Slash.

## Root Cause
The issue stemmed from a coordinate system mismatch between:
1. How positions were calculated for spell effects
2. How the 3D scene rendered card positions for each player

### Key Insight
- Each player sees themselves at the bottom of the screen (z=5.5) and their opponent at the top (z=-5.5)
- The HearthstoneScene component always renders `playerTeam` at bottom and `aiTeam` at top
- Spell positions were being calculated using absolute world coordinates instead of visual coordinates

## Solution Implementation

### 1. Fixed Position Calculation Function
**File:** `src/components/Battle3D/BoardgamePvP.jsx`

Changed `getCardPositionAbsolute()` from using world coordinates to visual coordinates:

```javascript
// BEFORE - Used world coordinates
const getCardPositionAbsolute = (cardIndex, cardOwner) => {
  // ...
  let z;
  if (String(cardOwner) === '0') {
    z = 5.5;  // Player 0 always at z=5.5
  } else {
    z = -5.5; // Player 1 always at z=-5.5
  }
  return [x, 0.5, z];
};

// AFTER - Uses visual coordinates relative to viewing player
const getCardPositionAbsolute = (cardIndex, cardOwner) => {
  // ...
  let z;
  if (String(cardOwner) === actualPlayerID) {
    z = 5.5;  // Viewing player's cards at bottom
  } else {
    z = -5.5; // Opponent's cards at top
  }
  return [x, 0.5, z];
};
```

### 2. Fixed Pyroblast Target Position
**File:** `src/components/Battle3D/BoardgamePvP.jsx`

Changed from using viewer-relative arrays to authoritative game state:

```javascript
// BEFORE - Used viewer's perspective arrays
const targetInPlayer = allPlayerCards.findIndex(c => c.instanceId === effect.targetCardId);
const targetInAI = allOpponentCards.findIndex(c => c.instanceId === effect.targetCardId);

// AFTER - Uses authoritative game state
const targetCard = [...G.players['0'].cards, ...G.players['1'].cards]
  .find(c => c.instanceId === effect.targetCardId);
if (targetCard) {
  const targetTeam = G.players[targetCard.owner].cards;
  const targetIndex = targetTeam.findIndex(c => c.instanceId === targetCard.instanceId);
  endPosition = getCardPositionAbsolute(targetIndex, targetCard.owner);
}
```

### 3. Fixed AoE Effect Positions
**File:** `src/components/Battle3D/BoardgamePvP.jsx`

Updated Block Defence and Whirlwind effects to use game state ownership:

```javascript
// BEFORE - Hardcoded positions based on actualPlayerID
playerTeam.filter(c => c.health > 0).map((card, index) => ({
  position: [(index - 1.5) * 2, 0.5, actualPlayerID === '0' ? 5.5 : -5.5],
  cardId: card.instanceId
}))

// AFTER - Determines teams from caster's actual owner
const casterCard = [...G.players['0'].cards, ...G.players['1'].cards]
  .find(c => c.instanceId === effect.casterCardId);
if (casterCard) {
  const allyTeam = G.players[casterCard.owner].cards.filter(c => c.currentHealth > 0);
  return allyTeam.map((card, index) => {
    const position = getCardPositionAbsolute(index, casterCard.owner);
    return {position: position, cardId: card.instanceId};
  });
}
```

## Technical Details

### Coordinate System
- **Visual Coordinates**: Each player sees themselves at bottom (z=5.5) and opponent at top (z=-5.5)
- **Game State**: Uses player IDs ('0' and '1') with owner property on each card
- **Scene Rendering**: HearthstoneScene renders based on `playerTeam` and `aiTeam` arrays

### Type Coercion Fix
Also fixed type mismatches where `card.owner` (number) was compared to `actualPlayerID` (string):
```javascript
// Always convert to string for comparison
String(cardOwner) === actualPlayerID
```

## Files Modified
1. `src/components/Battle3D/BoardgamePvP.jsx` - Main fix for position calculations
2. Position calculation functions updated for all spell types:
   - Pyroblast (targeted)
   - Ice Nova (AoE)
   - Chain Lightning (multi-target)
   - Sword Slash (melee)
   - Block Defence (team buff)
   - Whirlwind (AoE)

## Testing Checklist
- ✅ Ice Nova originates from correct wizard on both screens
- ✅ Pyroblast travels from correct caster to correct target
- ✅ Chain Lightning chains through correct enemy positions
- ✅ Sword Slash animation appears at correct positions
- ✅ Block Defence shields appear on correct team
- ✅ Whirlwind affects correct enemy positions

## Key Takeaway
When building multiplayer games with different player perspectives, always ensure position calculations account for how each player views the game world, not just absolute world positions.