# Toybox Brawl Development Context

## Project Overview
A 2D turn-based toy fighter game with Solana integration. Features animated battle sequences with special effects for each toy character.

## Recent Work Completed (Session 2 - Sept 1, 2025)

### 1. Robo Fighter Complete Overhaul
**Location:** `src/components/RoboFighterEffects.jsx`
**Character Data:** `src/game/enhancedCharacters.js`

#### Current Abilities:
1. **Laser Blast** (50% chance)
   - 25 damage cyan laser beam
   - Impact effect at target

2. **Shield Boost** (45% chance)
   - Applies 30-point persistent energy shield to target ally
   - Shield absorbs damage before health is affected
   - Energy beam animation from caster to target
   - Cyan bubble effect persists on shielded character

3. **RECHARGE BATTERIES** (5% chance - ULTIMATE)
   - Revives all fallen allies with 50% max health
   - Heals all living allies for 50 HP
   - Lightning bolts strike all allies from sky
   - Electric surge effects
   - Screen flash effect

#### Shield Mechanic Implementation:
- Shields persist throughout battle until depleted
- Visual bubble effect with energy theme
- Shield amount tracked per character instance
- Absorbs damage before health is affected

### 2. Wizard Toy Elemental Redesign
**Location:** `src/components/WizardEffects.jsx`
**Character Data:** `src/game/enhancedCharacters.js`

#### Current Abilities:
1. **Pyroblast** (35% chance)
   - 35 damage
   - Massive fireball with explosion on impact
   - Fire particle effects spreading from impact

2. **Lightning Zap** (35% chance)
   - 30 damage chain lightning
   - Hits up to 3 enemies (100%, 75%, 50% damage)
   - Lightning bolts jump between targets
   - Electric spark effects at each hit

3. **ICE NOVA** (30% chance - ULTIMATE)
   - 50 damage to all enemies
   - **FREEZES enemies for 1 turn**
   - Expanding ice wave from caster
   - Ice prison crystals form on enemies
   - Frost screen effect
   - Frozen enemies display ice pattern overlay

#### Freeze Mechanic Implementation:
- Frozen characters skip their next turn completely
- Visual ice overlay with "FROZEN" text
- Ice pattern texture on frozen characters
- Freeze removed after skipping one turn
- Only living enemies can be frozen

### 3. UI/UX Improvements

#### Spell Notification Enhanced:
- Now displays ability description
- Shows percentage chance
- Added to `src/components/SpellNotification.jsx`

#### Death Overlay:
- Big red X appears on defeated characters
- Animated entrance with spin effect
- "DEFEATED" text with glow
- Automatically removed on revival

### 4. Bug Fixes & Improvements
- Fixed shield application to target allies instead of self
- Extended Robo Fighter ultimate animation timing (4s)
- Added freeze state tracking to battle system
- Fixed animation timing conflicts with battle speed

## Previous Work (Session 1)

### 1. Unicorn Warrior Abilities & Animations
**Location:** `src/components/UnicornSpellEffects.jsx`
- **Rainbow Blast** - Rainbow beam with particle effects
- **Magic Shield** - Protective shield with healing
- **Prismatic Storm** (Ultimate) - Rainbow destruction with screen effects

### 2. Phoenix Dragon
**Location:** `src/components/PhoenixDragonEffects.jsx`
- **Dragon Claw Strike** (55% chance) - 30 damage
- **Inferno Wing Sweep** (35% chance) - 45 damage + burn
- **Dragon Rebirth Apocalypse** (10% chance) - 200 damage + 150 heal

## Key Technical Implementation Details

### Battle System Integration
**File:** `src/components/AutoBattleScreen.jsx`

#### Special Character Handling:
- Unicorn Warrior and Phoenix Dragon skip standard effects
- Custom effect components render instead
- No yellow targeting lines for these special characters
- Attack line indicators disabled for: `unicorn_warrior`, `phoenix_dragon`

#### Effect Routing:
```javascript
// Standard effects (for most characters)
{activeSpell && spellPositions && activeSpell.caster?.id !== 'unicorn_warrior' && activeSpell.caster?.id !== 'phoenix_dragon' && (
  <EnhancedSpellEffects />
)}

// Unicorn specific effects
{activeSpell && activeSpell.caster?.id === 'unicorn_warrior' && (
  <UnicornSpellEffects />
)}

// Phoenix Dragon specific effects  
{activeSpell && activeSpell.caster?.id === 'phoenix_dragon' && (
  <PhoenixDragonEffects />
)}
```

### Character Structure
Each character in `enhancedCharacters.js` has:
- `id`: Unique identifier (e.g., 'phoenix_dragon')
- `name`: Display name
- `abilities`: Array of 3 abilities max
- `emoji`: Visual representation
- `rarity`: Affects stats and damage multipliers
- `color`: Theme color for effects

### Ability Structure
```javascript
{
  id: 'ability_id',
  name: 'Display Name',
  damage: 30,  // Optional
  heal: 20,    // Optional
  shield: 15,  // Optional
  chance: 0.40, // Probability (must sum to 1.0 across all abilities)
  description: 'What it does',
  effect: 'damage|heal|damage_burn|apocalypse|etc',
  animation: 'animation_name',
  priority: 1,  // Order of execution
  isUltimate: true,  // Optional
  isMythic: true     // Optional
}
```

## Remaining Toys to Update

### Current Toys Needing Custom Animations:
1. **Robo Fighter** - Needs cyber/tech themed effects
2. **Teddy Warrior** - Needs bear/nature themed effects  
3. **Ninja Turtle** - Needs ninja/stealth effects
4. **Dragon Master** - Needs dragon fire effects (different from Phoenix)
5. **Alien Invader** - Needs sci-fi/space effects
6. **Pirate Captain** - Needs nautical/cannon effects
7. **Wizard Toy** - Needs magical spell effects

### Design Pattern for New Toy Effects:
1. Create new component: `src/components/[ToyName]Effects.jsx`
2. Add special effects for each of the 3 abilities
3. Update `AutoBattleScreen.jsx` to route to custom component
4. Skip yellow targeting lines by adding to exclusion list
5. Limit to 3 abilities maximum per toy

## Important Notes

### Animation System:
- Custom effects use absolute positioning with DOM coordinates
- Effects layer on z-index 40-50
- Screen shake via CSS class: `apocalypse-shake`
- Particle effects created dynamically with React state
- Cleanup timers essential to prevent memory leaks

### Visual Effects Guidelines:
- Basic abilities: 1-1.5 second animations
- Ultimate abilities: 2-4 second animations with screen effects
- Use character's color theme for consistency
- Particle count: 8-12 for normal, 20-30 for ultimates
- Always call `onComplete()` to continue battle flow

### Testing Checklist:
- [ ] All 3 abilities trigger correctly
- [ ] Animations display at target positions
- [ ] No yellow targeting lines appear
- [ ] Effects cleanup properly after animation
- [ ] Battle continues after effect completion
- [ ] Damage/heal numbers display correctly

## File Structure
```
src/
├── components/
│   ├── AutoBattleScreen.jsx        # Main battle logic
│   ├── EnhancedSpellEffects.jsx    # Standard spell effects
│   ├── UnicornSpellEffects.jsx     # Unicorn custom effects
│   ├── PhoenixDragonEffects.jsx    # Phoenix Dragon custom effects
│   ├── AttackLine.jsx              # Yellow targeting line (disabled for special)
│   └── [Future]Effects.jsx         # Pattern for new toys
├── game/
│   └── enhancedCharacters.js       # All character definitions
└── utils/
    └── animations.js                # Shared animation utilities
```

## Next Steps When Continuing:
1. Pick next toy to update (recommend Robo Fighter or Ninja Turtle)
2. Design 3 thematic abilities with escalating power
3. Create custom effects component
4. Integrate into battle system
5. Test all animations work correctly
6. Remove yellow targeting lines for that character

## Known Issues:
- Dragon Claw Strike sometimes needs target position validation
- Some effects may overlap if multiple characters act simultaneously
- Performance consideration: Too many particles can lag on slower devices

## Solana Integration Notes:
- Game designed for NFT toy characters
- Each toy could be minted as unique NFT
- Battle results could be recorded on-chain
- Currently frontend-only implementation

This context should help continue development of the remaining toy characters with consistent patterns and quality.