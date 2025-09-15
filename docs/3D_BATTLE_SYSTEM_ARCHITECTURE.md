# 3D Battle System Architecture Documentation

## Overview
This document outlines the architecture of the Toybox Brawl 3D battle system, recent fixes implemented, and guidelines for future development.

## Current Architecture

### Component Structure
```
src/components/Battle3D/
├── HearthstoneScene.jsx       # Main 3D scene renderer
├── Battle3DEnhanced.jsx        # Single-player battle logic
├── Battle3DSmooth.jsx          # Smooth turn-based battle system
├── PvPBattle3D.jsx            # Multiplayer PvP battle logic
├── HybridCard3D.jsx           # Robust card with NFT/fallback rendering
├── SmoothBattleSystem.jsx     # Core smooth battle mechanics
├── TestNFTScene.jsx           # NFT testing environment
├── SimpleCard3D.jsx           # Basic card renderer
├── NFTCard3D.jsx              # NFT-only card (issues)
├── NFTCardFixed.jsx           # Fixed NFT card with useTexture
├── DamageNumber3D.jsx         # Floating damage numbers
└── TargetingSystem.jsx        # Legacy targeting (deprecated)
```

### Effects Components
```
src/components/effects/
├── PyroblastEffect.jsx        # Pyroblast spell animation
├── FireballEffect.jsx         # Fireball spell animation
├── ShieldEffect.jsx           # Shield visual effect
├── HealingEffect.jsx          # Healing animation
├── ExplosionEffect.jsx        # Explosion effect
└── StaticTargetingLine.jsx   # Targeting line (deprecated)
```

## Recent Fixes & Implementations (January 2025)

### 1. NFT Texture Loading Issue
**Problem:** NFT images were flickering or showing as colored panels, only appearing briefly when clicked.

**Root Cause:**
- React re-renders were causing textures to reload
- `useTexture` hook from drei was not handling dynamic loading properly
- Texture references were not being cached correctly

**Solution:**
```javascript
// SimpleCard3D.jsx - Using THREE.TextureLoader directly
useEffect(() => {
  const loader = new THREE.TextureLoader();
  loader.load(
    texturePath,
    (loadedTexture) => {
      loadedTexture.encoding = THREE.sRGBEncoding;
      loadedTexture.minFilter = THREE.LinearFilter;
      loadedTexture.magFilter = THREE.LinearFilter;
      setTexture(loadedTexture);
    }
  );
}, [character?.name, character?.image]);
```

### 2. Card Rendering Architecture
**Problem:** Cards were disappearing when targeting system was active.

**Solution:** Separated rendering into independent groups:

```javascript
// HearthstoneScene.jsx
<group name="cards">
  {/* All card rendering - always visible */}
  {playerTeam.map((char, index) => (
    <SimpleCard3D key={char.instanceId} {...props} />
  ))}
</group>

<group name="effects">
  {/* Visual effects - independent of cards */}
  {selectedCard && targetCard && (
    <Line points={[selectedCard.position, targetCard.position]} />
  )}
</group>
```

### 3. State-Driven Targeting System
**Implementation:**
```javascript
const [selectedCard, setSelectedCard] = useState(null);
const [targetCard, setTargetCard] = useState(null);

// Auto-select active player card
useEffect(() => {
  if (currentTurn === 'player' && activeCharacterIndex >= 0) {
    const activeChar = playerTeam[activeCharacterIndex];
    const [x, y, z] = getCardPosition(activeCharacterIndex, 'player', true);
    setSelectedCard({
      id: activeChar.instanceId,
      position: [x, y + 0.5, z]
    });
  }
}, [currentTurn, activeCharacterIndex, playerTeam]);
```

### 4. Smooth Turn-Based Battle System
**Problem:** Original system had overlapping actions and no animation coordination.

**Solution:** Implemented deterministic turn flow with animation queue:

```javascript
// Battle state structure
const battleState = {
  turn: "player" | "ai",
  turnCount: number,
  isResolving: boolean,  // Prevents overlapping actions
  selectedCardIndex: number,
  targetCardIndex: number,
  pendingAnimation: Animation
};

// Animation queue prevents conflicts
const animationQueue = useRef([]);
const isProcessing = useRef(false);

// Process animations sequentially
const processAnimationQueue = async () => {
  if (isProcessing.current || animationQueue.current.length === 0) return;

  isProcessing.current = true;
  const animation = animationQueue.current.shift();

  // Play animation
  await playAnimation(animation);

  // Apply game logic
  animation.onComplete();

  isProcessing.current = false;
  processAnimationQueue(); // Process next
};
```

### 5. NFT Card Rendering Solutions
**Multiple approaches implemented to handle 512x768 NFT images:**

#### HybridCard3D (Recommended)
- Always shows something (NFT or fallback)
- Uses Suspense boundaries properly
- Handles texture loading failures gracefully

```javascript
// Safe NFT loading with fallback
<Suspense fallback={<FallbackCard />}>
  <SafeNFTCard texturePath={nftPath} />
</Suspense>
```

#### Key NFT Fixes:
- Use `planeGeometry` with `[2, 3]` for 512x768 aspect ratio
- `meshBasicMaterial` instead of `meshStandardMaterial` (no lighting dependency)
- `side={THREE.DoubleSide}` prevents disappearing when viewed from behind
- `alphaTest={0.1}` handles transparency correctly

## Key Design Principles

### 1. Separation of Concerns
- **Cards Group:** Handles all character card rendering
- **Effects Group:** Handles all visual effects and overlays
- **No Cross-Dependencies:** Groups operate independently

### 2. State Management
- Card positions are calculated deterministically
- Targeting state is managed separately from card state
- Effects respond to state changes without affecting card rendering

### 3. Performance Optimization
- Textures loaded once per card using vanilla Three.js
- Memoized position calculations
- Minimal re-renders through proper component separation

## NFT Integration

### Current NFT Assets
Located in `/public/assets/nft/newnft/`:
- `robotnft.png` - Robot Guardian
- `wizardnft.png` - Wizard characters
- `archwizardnft.png` - Arch Wizard
- `duckienft.png` - Rubber Duckie
- `brickdudenft.png` - Brick/Teddy characters
- `winduptoynft.png` - Wind-up Soldier
- `dinonft.png` - Dino characters
- `voodoonft.png` - Voodoo/Cursed characters

### Texture Mapping Logic
```javascript
const getTexturePath = () => {
  // Check character's image property first
  if (character?.image && character.image.includes('/assets/nft/')) {
    return character.image;
  }

  // Map based on character name
  const charName = character?.name?.toLowerCase() || '';
  if (charName.includes('robot')) return '/assets/nft/newnft/robotnft.png';
  // ... additional mappings
};
```

## Turn System Implementation

### Smooth Turn Flow
1. **Select random alive card** from current team
2. **Check status effects** (frozen, stunned, etc.)
3. **Select random ability** from card's ability list
4. **Choose appropriate target** based on ability type
5. **Queue animation** with visual effects
6. **Apply game logic** after animation completes
7. **Switch turns** with delay for clarity

### Random Card Selection
```javascript
function getRandomAliveCard(team) {
  const alive = team.filter(c => c.isAlive && !c.frozen);
  if (alive.length === 0) return null;
  return alive[Math.floor(Math.random() * alive.length)];
}
```

### Spell Casting from Behind
Spells originate from behind the table center for depth:

```javascript
// Spell origin point
<group position={[0, 0, -2]} name="spellOrigin">
  <mesh>
    <sphereGeometry args={[0.1, 8, 8]} />
    <meshBasicMaterial visible={false} />
  </mesh>
</group>

// Projectile travels from origin to target
const spellPath = {
  start: [0, 2, -3],  // Behind center
  target: targetPosition,
  arc: true  // Parabolic trajectory
};
```

## Future Development Guidelines

### Adding New Spell Effects
1. Create effect component in `src/components/effects/`
2. Add to effect type mapping in `Battle3DEnhanced.jsx`:
```javascript
const getEffectType = (ability) => {
  const name = ability.name.toLowerCase();
  if (name.includes('newspell')) return 'newspell';
  // ...
};
```
3. Import and render in `HearthstoneScene.jsx` effects section

### Adding New Characters
1. Add character definition to `enhancedCharacters.js`
2. Include NFT image path in character object
3. Place NFT image in `/public/assets/nft/newnft/`
4. Update texture mapping if needed

### Implementing Ability Selection UI
**Planned Implementation:**
```javascript
// Instead of random ability selection
const [selectedAbility, setSelectedAbility] = useState(null);
const [showAbilityMenu, setShowAbilityMenu] = useState(false);

// UI overlay for ability selection
{showAbilityMenu && (
  <div className="ability-menu">
    {character.abilities.map(ability => (
      <button onClick={() => selectAbility(ability)}>
        {ability.name}
      </button>
    ))}
  </div>
)}
```

### Performance Improvements
1. **Texture Atlas:** Combine NFT images into a single texture atlas
2. **LOD System:** Implement level-of-detail for cards based on camera distance
3. **Instance Rendering:** Use instanced meshes for repeated elements
4. **Lazy Loading:** Load textures on-demand with proper caching

### WebSocket Sync Improvements
**Current Issues:**
- Character index tracking between client/server
- Turn state synchronization delays

**Proposed Solutions:**
1. Use deterministic IDs instead of indices
2. Implement state reconciliation
3. Add optimistic updates with rollback

## Animation System

### Animation Queue Pattern
Prevents overlapping animations and ensures smooth gameplay:

```javascript
class AnimationQueue {
  queue = [];
  isProcessing = false;

  add(animation) {
    this.queue.push(animation);
    this.process();
  }

  async process() {
    if (this.isProcessing || !this.queue.length) return;

    this.isProcessing = true;
    const anim = this.queue.shift();

    await this.playAnimation(anim);
    anim.onComplete();

    this.isProcessing = false;
    this.process();
  }
}
```

### Visual Effects Timing
- **Card selection**: 200ms scale animation
- **Spell travel**: 1500ms from origin to target
- **Impact effect**: 500ms explosion/heal
- **Damage numbers**: 2000ms float and fade
- **Turn switch delay**: 1000ms for clarity

## Testing Checklist

### Before Deploying Changes
- [ ] Cards render correctly with NFT images
- [ ] Smooth turn transitions without overlap
- [ ] Random card selection works correctly
- [ ] Spell animations play from behind table
- [ ] Animation queue processes sequentially
- [ ] Targeting lines appear between selected and target cards
- [ ] Effects play without affecting card visibility
- [ ] Mobile responsive (test at 768px width)
- [ ] PvP synchronization works correctly
- [ ] No console errors or warnings
- [ ] Performance acceptable (60 FPS target)

## Common Issues and Solutions

### Issue: Cards Not Rendering
**Check:**
1. Character data has `isAlive: true`
2. Position calculations returning valid coordinates
3. SimpleCard3D component imported correctly

### Issue: NFT Images Not Loading
**Check:**
1. Image paths are correct (start with `/`)
2. Images exist in public folder
3. TextureLoader error handling in place

### Issue: Targeting Lines Not Appearing
**Check:**
1. Both `selectedCard` and `targetCard` have values
2. Position arrays are valid `[x, y, z]` format
3. Line component imported from `@react-three/drei`

### Issue: Animations Overlapping
**Check:**
1. `isResolving` flag is set during animations
2. Animation queue is processing sequentially
3. Turn doesn't switch until animation completes

### Issue: Cards Not Showing During Battle
**Check:**
1. Cards are in separate `<group name="cards">` that always renders
2. Effects are in separate `<group name="effects">`
3. Card visibility not dependent on animation state

## Development Commands

```bash
# Start development servers
cd backend && node server.js  # Backend on port 3003
npm run dev                   # Frontend on port 3000

# Build for production
npm run build

# Run tests (when implemented)
npm test
```

## Dependencies

### Core 3D Libraries
- `@react-three/fiber`: ^8.17.10 - React renderer for Three.js
- `@react-three/drei`: ^9.88.0 - Useful helpers for R3F
- `three`: ^0.160.1 - 3D graphics library

### Animation
- `@react-spring/three` - Spring animations for 3D
- `gsap`: ^3.13.0 - Advanced animations (optional)

## Contact and Support

For questions or issues related to the 3D battle system:
1. Check this documentation first
2. Review recent commits in the Battle3D folder
3. Test in development environment before reporting issues

---

## Game Engineering Guide (AI Reference)

### Core Principle
The game is **state-driven**. All cards, effects, and spells are represented in game state first, then rendered into the scene. Never hardcode logic directly into components — everything should come from state and update functions.

### 1. Card Data Model

Each card in the battle should be an object with fields like:

```javascript
{
  id: string,
  owner: "player" | "enemy",
  name: string,
  health: number,
  maxHealth: number,
  attack: number,
  defense: number,
  frozen: boolean,
  dead: boolean,
  position: [number, number, number],
  effects: Effect[], // active spell/status effects
  abilities: Ability[], // card's unique abilities
}
```

- **health/defense** → For damage calculations.
- **frozen** → Stops attacking/acting until thawed.
- **dead** → Triggers death effects, removes card from active play.
- **effects** → Stores temporary states (buffs, DoT, heals).

### 2. Abilities and Spells

Each spell or ability is represented as an object:

```javascript
{
  id: string,
  type: "damage" | "heal" | "buff" | "debuff" | "revive" | "freeze",
  value: number,
  target: "self" | "ally" | "enemy" | "allAllies" | "allEnemies" | "all",
  duration?: number, // for buffs/debuffs
  special?: string, // e.g., "frostNova", "shieldBoost"
}
```

**Important:** Spells must not directly manipulate the scene → Instead, they update state (card health, frozen = true, etc.). The render system shows visuals (red line for targeting, particle effects, shaders) based on that updated state.

### 3. Health & Death

- When `health ≤ 0` → `dead = true`
- Trigger death effects from abilities or attached effects
- Animate card fading/shattering (but keep the object in state until resolved)
- Dead cards can still be targeted by revive spells

### 4. Revive Effects

- Revive spells set `dead = false` and restore health (`health = X`)
- Card re-enters the cards group and animates rising up

### 5. Buffs & Debuffs

Examples:
- **Heal** → `health = Math.min(maxHealth, health + value)`
- **Defense Buff** → `defense += value`, with duration tracked
- **Freeze** → `frozen = true`, add a snow/frost visual. Remove after duration

### 6. Status Effect System

Maintain a tick system (per turn or per second):
1. Loop over all `card.effects`
2. Apply changes (damage over time, healing, freeze countdown, etc.)
3. Remove expired effects

### 7. Rendering Rules

- **Cards group:** Always renders from state
- **Effects group:** Renders visuals like targeting lines, frost aura, shield glow, etc. based on `card.effects`
- **UI layer:** Shows card stats (HP bars, defense icons, buffs)

### 8. Adding New Features

Whenever adding a new spell/mechanic:
1. Add it to the Ability/Effect model (don't hardcode in components)
2. Update the state updater function (e.g., `applyEffect(card, effect)`)
3. Add the visual effect in the effects group
4. Ensure the system is composable (e.g., multiple effects can stack)

### 9. Example Flow: Frost Nova Spell

**Spell object:**
```javascript
{ id: "frostNova", type: "freeze", target: "allEnemies", duration: 2 }
```

**Implementation:**
1. Apply to all enemy cards → `card.frozen = true`, add effect: `{ type: "freeze", duration: 2 }`
2. Render → Show icy shader/glow over frozen cards
3. On each turn → decrement duration. When it reaches 0 → thaw (`frozen = false`)

### 10. AI Development Rules

⚠️ **Critical Rules for AI/Developers:**
- Never delete or overwrite cards group
- Never remove existing game state unless explicitly instructed
- Always extend the card/effect model with new fields rather than hardcoding logic
- All visuals must be derived from state, not manual manipulation

✅ **This ensures:** Whenever implementing "add a revive spell" or "make a frost nova AOE", follow this exact state → update → render pipeline.

### State Update Pattern

```javascript
// CORRECT: State-driven approach
function applySpell(spell, target) {
  // Update state
  updateCardState(target, spell.effect);

  // Visual effects respond to state change
  // (handled automatically by effects group)
}

// WRONG: Direct manipulation
function badApplySpell(spell, target) {
  // Don't do this!
  scene.remove(targetMesh);
  createExplosion(position);
}
```

### Component Architecture Best Practices

1. **State Management**
   - All game logic in state
   - Components are pure renderers
   - Effects respond to state changes

2. **Data Flow**
   ```
   User Input → State Update → Render Update → Visual Feedback
   ```

3. **Testing Strategy**
   - Test state updates independently
   - Test render logic separately
   - Ensure state and visuals stay synchronized

---

*Last Updated: January 2025*
*Version: 2.2.0*

## Quick Reference

### File Purpose Guide
- **Battle3DSmooth.jsx** - Use for new smooth turn-based battles
- **HybridCard3D.jsx** - Use for reliable NFT rendering with fallback
- **HearthstoneScene.jsx** - Main scene renderer, don't modify directly
- **TestNFTScene.jsx** - Use to debug NFT loading issues

### Common Patterns
```javascript
// Always use this for NFT cards
import HybridCard3D from './HybridCard3D';

// Turn-based battle with smooth animations
import Battle3DSmooth from './Battle3DSmooth';

// Debug NFT loading
import TestNFTScene from './TestNFTScene';
```