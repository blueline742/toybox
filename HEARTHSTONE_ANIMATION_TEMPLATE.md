# Hearthstone-Style Physical Card Attack Animation Template

## Overview
This animation makes the actual character card physically move to attack the enemy, similar to Hearthstone's attack animations.

## Implementation Code Template

```javascript
// Get the actual caster card element
const casterElement = document.getElementById(`char-${spell.caster.instanceId}`);
if (!casterElement) return;

// Store original position and styles
const originalTransform = casterElement.style.transform || '';
const originalTransition = casterElement.style.transition || '';
const originalZIndex = casterElement.style.zIndex || '';

// Calculate movement distance
const rect = casterElement.getBoundingClientRect();
const startX = rect.left + rect.width / 2;
const startY = rect.top + rect.height / 2;

const moveX = target.x - casterPos.x;
const moveY = target.y - casterPos.y;

// Phase 1: Lift up and tilt (0-300ms)
casterElement.style.transition = 'all 0.3s ease-out';
casterElement.style.transform = `${originalTransform} translateY(-20px) scale(1.1) rotate(-5deg)`;
casterElement.style.zIndex = '100';

// Phase 2: Move to target (300-700ms)
setTimeout(() => {
  casterElement.style.transition = 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
  casterElement.style.transform = `translate(${moveX}px, ${moveY}px) scale(1.2) rotate(15deg)`;
}, 300);

// Phase 3: Impact (700-900ms)
setTimeout(() => {
  // Quick shake on impact
  casterElement.style.transition = 'all 0.1s';
  casterElement.style.transform = `translate(${moveX + 10}px, ${moveY}px) scale(1.3) rotate(20deg)`;
  
  // Show impact effects here (slash, explosion, etc.)
  setSlashPosition({ x: target.x, y: target.y });
  setAnimationPhase('impact');
  
  // Camera shake effect
  document.body.style.transform = 'translateX(5px)';
  setTimeout(() => {
    document.body.style.transform = 'translateX(-5px)';
    setTimeout(() => {
      document.body.style.transform = 'translateX(0)';
    }, 50);
  }, 50);
}, 700);

// Phase 4: Return to position (900-1400ms)
setTimeout(() => {
  casterElement.style.transition = 'all 0.5s ease-in-out';
  casterElement.style.transform = originalTransform;
  casterElement.style.zIndex = originalZIndex;
}, 900);

// Cleanup (1400ms)
setTimeout(() => {
  casterElement.style.transition = originalTransition;
  onComplete();
}, 1400);
```

## Animation Phases Breakdown

### Phase 1: Lift Up (0-300ms)
- Card lifts up by 20px
- Scales to 1.1x
- Tilts slightly backward (-5deg rotation)
- Sets high z-index to appear above other elements

### Phase 2: Attack Movement (300-700ms)
- Card moves to target position
- Scales up to 1.2x
- Rotates forward (15deg) for attack angle
- Uses cubic-bezier for smooth acceleration

### Phase 3: Impact (700-900ms)
- Quick forward jolt (+10px)
- Maximum scale (1.3x)
- Maximum rotation (20deg)
- Camera shake for impact feel
- Trigger impact visual effects (sparks, slashes, etc.)

### Phase 4: Return (900-1400ms)
- Smooth return to original position
- Reset all transforms
- Reset z-index
- 0.5s ease-in-out for natural movement

## Customization Options

### For Different Attack Types:
- **Heavy Attacks**: Increase scale values (1.4x, 1.5x) and add more camera shake
- **Quick Attacks**: Reduce phase durations (200ms, 300ms, etc.)
- **Magic Attacks**: Add glow effects, particle trails during movement
- **Multi-hit**: Repeat Phase 3 multiple times before returning

### Visual Enhancements:
- Add motion blur during movement
- Trail effects following the card
- Glow/aura during attack
- Different impact effects per character

## Usage Example for New Character:

```javascript
if (spell.ability?.animation === 'your_attack_name') {
  // Use the template above
  // Customize timings, scales, rotations as needed
  // Add character-specific impact effects
}
```

## Key Points to Remember:
1. Always store original styles to restore them
2. Use getElementById with character's instanceId
3. Calculate relative movement (moveX, moveY) from positions
4. Clean up by restoring original styles
5. Camera shake is optional but adds impact
6. Adjust timings for different attack speeds
7. Z-index management ensures card appears on top during attack

This animation has been successfully implemented for Brick Dude's Sword Slash ability and can be reused for any character that needs physical attack animations.