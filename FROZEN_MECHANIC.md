# FROZEN Mechanic Implementation

## Overview
The FROZEN debuff prevents cards from attacking for one turn. When Ice Nova is cast, all enemy cards become frozen and are encased in a realistic ice cube visual effect.

## Implementation Details

### 1. Game Logic (src/game/boardgame/game.js)
- Added `frozen` and `frozenTurns` properties to all cards
- Modified turn system to skip frozen cards when selecting random attacker (line 331)
- Ice Nova's 'freeze_all' effect freezes all enemy cards for 1 turn (lines 727-732)
- Frozen status decrements at the start of each turn (lines 319-327)
- Cards cannot be played when frozen (line 641 check)

### 2. Visual Effects (src/components/Battle3D/effects/IceCubeEffect.jsx)
- Created realistic ice cube using drei's MeshTransmissionMaterial
- Features:
  - Transparent ice material with refraction
  - Inner crystalline cube for depth
  - Floating ice particles inside
  - Frozen mist at the base
  - Subtle rotation and pulsing animations
  - "FROZEN" text indicator (placeholder for future UI)

### 3. Scene Integration (src/components/Battle3D/HearthstoneScene.jsx)
- Added IceCubeEffect component import
- Renders ice cube on frozen cards (lines 682-685, 748-751)
- Position adjusted to appear around the card

### 4. State Management (src/components/Battle3D/BoardgamePvP.jsx)
- Added frozenCharacters state tracking (Map)
- Syncs frozen status from game state to visual layer
- Updates every time playerTeam or aiTeam changes
- Passes frozenCharacters prop to HearthstoneScene

## How It Works

1. **Casting Ice Nova**: When a Wizard casts Ice Nova with 'freeze_all' effect
2. **Game State Update**: All enemy cards get `frozen: true` and `frozenTurns: 1`
3. **Visual Update**: BoardgamePvP detects frozen cards and updates frozenCharacters Map
4. **Ice Cube Appears**: HearthstoneScene renders IceCubeEffect on frozen cards
5. **Turn Skip**: Frozen cards are excluded from random selection for next turn
6. **Thawing**: After one turn, frozen status is removed and ice cube disappears

## Testing
To test the frozen mechanic:
1. Use a Wizard card in battle
2. Cast Ice Nova spell on any enemy
3. Observe all enemies get frozen with ice cube effect
4. Note that frozen enemies skip their next turn
5. Watch ice cubes disappear after one turn

## Future Enhancements
- Add frozen text overlay on cards
- Add ice shattering particle effect when thawing
- Add frozen sound effects
- Consider different freeze durations for different spells