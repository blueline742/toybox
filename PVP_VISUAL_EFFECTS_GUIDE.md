# PvP Visual Effects & Buff/Debuff Implementation Guide

## CRITICAL: PvP Battle Component Structure
**⚠️ PvP battles run through `AutoBattleScreen.jsx` with `isPvP` flag, NOT `PvPBattleScreen.jsx`**

## Key Implementation Points

### 1. Component Hierarchy
- `AutoBattleScreen.jsx` - Handles BOTH single-player AND PvP battles (with isPvP prop)
- `PvPBattleScreen.jsx` - Legacy/unused component for PvP
- Always check which component is actually being used before making changes

### 2. Server-Client Synchronization Pattern
```javascript
// In displayServerAction function (AutoBattleScreen.jsx)
if ((effect.type === 'freeze' || effect.freeze) && isPvP) {
  // Track effect on client for visual display
  setFrozenCharacters(prev => {
    const newMap = new Map(prev)
    newMap.set(effect.targetId, { frozen: true, turnsRemaining: 1 })
    return newMap
  })
}
```

### 3. Visual Effect Checklist for New Abilities
When adding new toy abilities with visual effects:

1. **Server Side (backend/battleEngine.js)**:
   - Add effect in `calculateEffects()`
   - Apply status in `applyEffects()`
   - Include effect data in action object

2. **Client Side (AutoBattleScreen.jsx)**:
   - Track effect in `displayServerAction()` for PvP mode
   - Add visual rendering in character card area
   - Update BuffIndicator component if needed

3. **Visual Components**:
   - Frozen effect: Blue ice overlay (inline in AutoBattleScreen)
   - Buff indicators: BuffIndicator.jsx component
   - Team positioning: `teamColor` prop ('red' for enemies, 'blue' for allies)

### 4. Common Pitfalls to Avoid
- ❌ DON'T modify PvPBattleScreen thinking it handles PvP
- ❌ DON'T forget isPvP is capital P (not isPvp)
- ❌ DON'T assume server maintains status after using it (e.g., frozen clears after skip)
- ❌ DON'T forget to use new Map() for state updates

### 5. Testing Priority
**As per user requirement: "ensure that online mode is catered too first at foremost as thats the main feature"**
- Always test in PvP/multiplayer mode FIRST
- Single-player testing is secondary
- Use console logs to verify effect synchronization

### 6. Effect State Management Pattern
```javascript
// Correct way to update Map states in React
setState(prev => {
  const newMap = new Map(prev)  // Create new Map instance
  newMap.set(key, value)        // Modify the new instance
  return newMap                 // Return new instance for re-render
})
```

### 7. Debug Logging Pattern
```javascript
console.log('🧊 Effect detected:', {
  targetId: effect.targetId,
  effectType: effect.type,
  isPvP: isPvP  // Case sensitive!
})
```

## Quick Reference for Future Abilities

### Adding a new debuff/buff visual:
1. Update backend/battleEngine.js `applyEffects()`
2. Track in AutoBattleScreen.jsx `displayServerAction()`
3. Add visual in character rendering section
4. Update BuffIndicator.jsx if circular icon needed

### Server sends these action types:
- `ability_used` - Normal ability with effects
- `skip_turn` - Character skips (frozen, stunned, etc.)
- `battle_complete` - Battle ends

Remember: Server is authoritative, client tracks visuals!