# Persistent Spell Effects Architecture Guide

## Overview
This document explains how we achieved persistent visual effects that stay synchronized with game state, particularly for debuffs and status effects that last beyond the initial spell animation.

## The Problem
When implementing Ice Nova's freeze effect, we encountered a fundamental issue:
- Spell effects were tied to the spell animation lifecycle (2-3 seconds)
- Frozen debuff lasted much longer (until target's next turn)
- Ice cubes would disappear when spell animation ended, breaking immersion

## The Solution: State-Driven Overlay System

### Key Insight
**Decouple visual effects from spell animations by creating persistent overlay components that watch game state directly.**

### Architecture

```
Game State (AutoBattleScreen)
    ↓
frozenCharacters Map
    ↓
IceCubeOverlay Component (watches state)
    ↓
Canvas rendering (persistent visuals)
```

### Implementation Details

1. **State Management in AutoBattleScreen**
   ```javascript
   const [frozenCharacters, setFrozenCharacters] = useState(new Map())
   // Map structure: { characterId -> { frozen: true, turnsRemaining: 1 } }
   ```

2. **Overlay Component Pattern**
   ```javascript
   // IceCubeOverlay.jsx
   const IceCubeOverlay = ({ frozenCharacters }) => {
     // Watch the frozen state
     useEffect(() => {
       // Render ice cubes for all frozen characters
       // Update positions if characters move
       // Remove when character unfreezes
     }, [frozenCharacters])
   }
   ```

3. **Integration**
   ```javascript
   // In AutoBattleScreen's render
   <IceCubeOverlay frozenCharacters={frozenCharacters} />
   ```

## Why This Works

1. **State Synchronization**: Visual effects are always in sync with actual game state
2. **Lifecycle Independence**: Effects persist regardless of spell animation completion
3. **Clean Separation**: Spell animations handle the "casting", overlays handle the "result"
4. **Performance**: Canvas-based rendering with requestAnimationFrame for smooth 60fps

## Applying to Other Effects

### Burning Effect (DoT)
```javascript
const BurningOverlay = ({ burningCharacters }) => {
  // Render fire particles on burning characters
  // Continue until burning state clears
}
```

### Poison Effect
```javascript
const PoisonOverlay = ({ poisonedCharacters }) => {
  // Render poison bubbles/drips
  // Update each turn as poison damages
}
```

### Shield Effects
```javascript
const ShieldOverlay = ({ shieldedCharacters }) => {
  // Render protective barriers
  // Animate shield hits/breaks
}
```

## Best Practices

### 1. Use Maps for State
Maps are ideal for tracking per-character effects:
```javascript
const [effectName, setEffectName] = useState(new Map())
// Easy to add/remove/check specific characters
```

### 2. Position Tracking
Always get fresh positions from DOM:
```javascript
const element = document.getElementById(`char-${characterId}`)
const rect = element.getBoundingClientRect()
```

### 3. Z-Index Layering
Place overlays above game elements:
```javascript
style={{ zIndex: 10000 }} // Very high to ensure visibility
```

### 4. Animation Performance
Use requestAnimationFrame for smooth animations:
```javascript
const animate = () => {
  // Update animations
  animationRef.current = requestAnimationFrame(animate)
}
```

### 5. Cleanup
Always cleanup on unmount:
```javascript
return () => {
  if (animationRef.current) {
    cancelAnimationFrame(animationRef.current)
  }
}
```

## Common Patterns

### Pattern 1: Effect on Status Change
```javascript
useEffect(() => {
  if (character.status.frozen) {
    // Add ice cube effect
  } else {
    // Remove ice cube effect
  }
}, [character.status])
```

### Pattern 2: Timed Effects
```javascript
useEffect(() => {
  const duration = 5000 // 5 seconds
  const timer = setTimeout(() => {
    // Remove effect
  }, duration)
  return () => clearTimeout(timer)
}, [])
```

### Pattern 3: Progressive Effects
```javascript
// For effects that change over time (like poison getting worse)
useEffect(() => {
  const interval = setInterval(() => {
    // Update effect intensity
  }, 1000)
  return () => clearInterval(interval)
}, [])
```

## Debugging Tips

1. **Console Logging**: Track state changes
   ```javascript
   console.log('Frozen characters:', Array.from(frozenCharacters.keys()))
   ```

2. **Visual Debugging**: Add colored borders to affected elements
   ```javascript
   if (DEBUG) element.style.border = '2px solid red'
   ```

3. **State Inspector**: Use React DevTools to inspect Maps

## Future Enhancements

1. **Effect Stacking**: Multiple effects on same character
2. **Effect Priorities**: Which effect renders on top
3. **Effect Combinations**: Ice + Fire = Steam effect
4. **Performance Pooling**: Reuse canvas contexts for multiple effects
5. **Effect Inheritance**: Base overlay class for common functionality

## Troubleshooting: React Re-render Issues

### Problem: Animation Flashing/Restarting
**Symptoms**: Spell animations flash, restart multiple times, or only show briefly.

**Common Causes**:
1. **React StrictMode** - Causes double rendering in development
2. **Dependency array issues** - Functions in dependencies cause re-renders
3. **State updates during render** - Triggers React to re-render

### Solution: The Ice Nova Fix

When Ice Nova was flashing instead of playing smoothly, we discovered multiple issues:

```javascript
// ❌ PROBLEM 1: onComplete in dependency array
useEffect(() => {
  // Effect code...
}, [activeSpell, spellPositions, onComplete]); // onComplete changes = re-render!

// ✅ SOLUTION 1: Remove unstable dependencies
useEffect(() => {
  // Effect code...
}, [activeSpell, spellPositions]); // Only stable props
```

```javascript
// ❌ PROBLEM 2: Component re-mounting multiple times
const ImageIceNovaEffect = ({ onComplete }) => {
  useEffect(() => {
    // Animation setup...
    if (onComplete) onComplete(); // Called multiple times!
  }, [onComplete]); // Re-runs when onComplete changes
}

// ✅ SOLUTION 2: Use refs for callbacks
const ImageIceNovaEffect = ({ onComplete }) => {
  const onCompleteRef = useRef(onComplete);
  const hasCompletedRef = useRef(false);
  
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);
  
  useEffect(() => {
    // Animation setup...
    if (!hasCompletedRef.current && onCompleteRef.current) {
      hasCompletedRef.current = true; // Only call once
      onCompleteRef.current();
    }
  }, [casterPos, targets]); // No callback in dependencies
}
```

```javascript
// ❌ PROBLEM 3: Multiple effect instances
// WizardEffects was creating multiple ice effects
setIceEffects([{ id: Date.now(), ... }]); // Called 3 times!

// ✅ SOLUTION 3: Prevent duplicates
if (iceEffects.length === 0) {
  setIceEffects([{ id: Date.now(), ... }]); // Only if none active
}
```

### Key Principles to Prevent Re-render Issues

1. **Use refs for callbacks**: Prevents re-renders from function changes
2. **Guard against duplicates**: Check if effect already active
3. **Minimize dependencies**: Only include truly reactive values
4. **Reset state properly**: Clear refs when component remounts
5. **One-time flags**: Use `hasCompletedRef` to prevent multiple calls

## Summary

The key to persistent spell effects is **separating the spell animation from the status effect visualization**. By creating overlay components that watch game state, we ensure effects persist exactly as long as they should, creating a more immersive and accurate game experience.

This pattern can be applied to any lingering effect:
- Debuffs (frozen, stunned, silenced)
- Buffs (shields, damage boosts, healing over time)
- Environmental effects (standing in fire, poison clouds)
- Auras (team-wide effects)

The overlay system is flexible, performant, and maintainable - perfect for scaling up with new spell effects!