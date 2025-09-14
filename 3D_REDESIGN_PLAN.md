# ToyBox 3D Battle System Redesign Documentation

## 📋 Overview
This document outlines the transition from the current 2D canvas-based battle system to a unified 3D React Three Fiber (R3F) implementation. This addresses mobile responsiveness issues and coordinate mismatches between DOM elements and canvas effects.

## 🎯 Current Issues with 2D System

### Problems:
1. **Coordinate Mismatch** - React DOM cards and canvas effects (shields, spells) use different coordinate systems
2. **Mobile Scaling Issues** - Shields and effects don't align properly with cards on mobile
3. **Dual System Maintenance** - Need to maintain both HTML/CSS for cards and canvas for effects
4. **Performance** - Multiple render passes for DOM and canvas elements

### Example Issues:
- Shield buffs appearing cut off or misaligned on mobile
- Spell targeting coordinates not matching card positions
- Different scaling behaviors between cards and effects

## ✨ New 3D Architecture

### Core Principle:
**Everything in one 3D scene** - Cards, effects, spells, UI, and arena all exist in the same React Three Fiber coordinate system.

### Technology Stack:
- **React Three Fiber (R3F)** - React renderer for Three.js
- **Three.js** - 3D graphics engine (via R3F)
- **@react-three/drei** - Helper components and utilities
- **Unified 3D Approach** - All card UI elements (health bars, stats, badges) are 3D objects within the scene

## 🏗️ Architecture Components

### 1. 3D Cards (`Card3DWithTexture.jsx`)
- Uses actual NFT images as textures via R3F's useLoader
- Front: NFT artwork from `/assets/nft/`
- Back: `cardback.png` texture
- Dimensions: 2.2 x 3.3 units (maintains card aspect ratio)
- **Integrated 3D UI Components:**
  - Health bars as 3D box geometries
  - Character names as 3D Text components
  - Stats (Attack/Defense) as 3D Text
  - Rarity badges as 3D RoundedBox with Text
  - Target rings as 3D ring geometries
- Features:
  - Active card floating animation via useFrame
  - Hover effects with cursor changes
  - Target highlighting with colored rings
  - Death overlay as semi-transparent mesh

### 2. Battle Arena (`SimpleBattle3D.jsx`)
- Complete R3F scene with:
  - Wooden floor plane with shadows
  - ToyBox arena background texture
  - Ambient + directional + point lighting
  - Responsive camera positioning via PerspectiveCamera
  - OrbitControls for user interaction

### 3. Effects System
- **Shield3D.jsx** - 3D sphere shields that wrap around cards
- **Pyroblast3D.jsx** - Fireball projectile with explosion
- **IceNova3D.jsx** - AoE freeze effect with ice crystals
- **LightningZap3D.jsx** - Chain lightning with electrical arcs
- **DamageNumber3D.jsx** - Floating 3D damage/heal numbers
- All effects are R3F components positioned in world space

### 4. UI Architecture
- **Fully 3D Card UI**: All card-related UI (health, stats, names) rendered as 3D objects
- **React Overlay for Global UI Only**:
  - Spell notifications (reused from 2D)
  - Turn indicators
  - Menu buttons
  - Victory/defeat screens
- **Targeting System**: Hybrid approach using 2D arrow overlay with 3D target rings

## 📁 File Structure

```
src/components/
├── Battle3D/
│   ├── SimpleBattle3D.jsx       # Main battle scene with R3F Canvas
│   ├── Card3DWithTexture.jsx    # Complete 3D card with integrated UI
│   ├── HealthBar3D.jsx          # 3D health bar component
│   ├── DamageNumber3D.jsx       # Floating damage numbers
│   └── Battle3DSceneEnhanced.jsx # Enhanced battle with manual targeting
├── Card3DNFT.jsx                # Original 3D card component
├── Shield3D.jsx                 # 3D shield effect component
├── Pyroblast3D.jsx              # Fireball spell effect
├── IceNova3D.jsx                # Ice nova AoE spell
├── LightningZap3D.jsx           # Chain lightning effect
├── Battle3DTest.jsx             # Entry point for 3D battle testing
└── SpellNotification.jsx        # Reused 2D spell notification UI
```

## 🔄 Migration Plan

### Phase 1: Core R3F Implementation (✅ COMPLETED)
✅ Create test scene at `/battle3d` using R3F Canvas
✅ Implement 3D cards with NFT textures via useLoader
✅ Convert all card UI to 3D objects (health bars, stats, badges)
✅ Add shield effects as 3D meshes
✅ Implement manual targeting system with 3D indicators
✅ Add spell notification system from 2D
✅ Create floating damage numbers in 3D space
✅ Verify mobile responsiveness

### Phase 2: Feature Parity (Partially Complete)
✅ Pyroblast spell effect in 3D
✅ Ice Nova AoE freeze effect
✅ Lightning Zap chain effect
✅ 3D damage numbers with float animation
⬜ Remaining spell effects (Laser Blast, Fire Breath, etc.)
⬜ Particle systems for all spells
⬜ Buff/debuff 3D indicators

### Phase 3: Integration
⬜ Replace AutoBattleScreen rendering with 3D scene
⬜ Maintain all game logic (unchanged)
⬜ Hook up WebSocket for PvP
⬜ Ensure state management compatibility

### Phase 4: Enhancement
⬜ Add card flip animations
⬜ Implement spell projectiles
⬜ Add arena animations
⬜ Create victory/defeat 3D effects

## 🎮 Implementation Details

### R3F Scene Structure
```jsx
<Canvas shadows camera={{ position: [0, 8, 12], fov: 50 }}>
  <BattleArena>
    {/* Each card is a complete 3D object with UI */}
    <Card3DWithTexture>
      <HealthBar3D />      {/* 3D box geometry */}
      <CharacterName />    {/* 3D Text component */}
      <Stats3D />          {/* 3D Text components */}
      <RarityBadge3D />    {/* 3D RoundedBox */}
    </Card3DWithTexture>
  </BattleArena>
  <OrbitControls />
</Canvas>
```

### Card Positioning
```javascript
// Grid layout for cards in R3F world space
const getCardPosition = (index, team) => {
  const spacing = isMobile ? 3 : 3.5;
  const row = Math.floor(index / 3);
  const col = index % 3;

  const x = (col - 1) * spacing;
  const y = row * -2;
  const z = team === 'player' ? 4 : -4;

  return [x, y, z];
};
```

### Responsive Scaling
```javascript
// Mobile vs Desktop scaling
const scale = isMobile ? 0.7 : 1;
const cameraFOV = isMobile ? 60 : 50;
const cameraPosition = isMobile ? [0, 8, 12] : [0, 6, 10];
```

### NFT Texture Mapping
```javascript
const nameMap = {
  'Wizard Toy': '/assets/nft/nftwizard.png',
  'Robot Guardian': '/assets/nft/Robotguardian.png',
  'Rubber Duckie': '/assets/nft/duckie.png',
  'Brick Dude': '/assets/nft/brickdude.png',
  // ... etc
};
```

## 🎯 R3F vs Raw Three.js Decision Guide

### When to Use R3F (React Three Fiber)
R3F is the primary choice for this project since:
- **React Integration**: The entire ToyBox project is React-based, making R3F a natural fit
- **Component Composition**: Effects can be composed as React components (`<FireballEffect />`, `<ExplosionEffect />`, `<Sparkles />`)
- **Declarative 3D**: Build scenes using familiar React patterns and hooks
- **Community Support**: Packages like `@react-three/drei` and `@react-three/postprocessing` provide ready-made solutions

### When to Use Raw Three.js
Raw Three.js should only be used when:
- Importing special shader/effect libraries not yet wrapped for R3F
- Need super low-level GPU control
- Performance optimizations where R3F abstractions cause bottlenecks (rare)
- **Best Practice**: Use raw Three.js inside R3F components when needed - best of both worlds

### Spell Effects Strategy
- **Particles, Glows, Shockwaves**: All implemented as R3F components
- **Post-processing**: Use `@react-three/postprocessing` for bloom, glow, motion blur
- **Custom Shaders**: Integrate raw Three.js shaders inside R3F using `useFrame` and custom materials
- **Example Implementation**:
  ```jsx
  // R3F component with custom Three.js shader
  function MagicEffect() {
    const meshRef = useRef()

    useFrame((state) => {
      // Direct Three.js manipulation when needed
      meshRef.current.material.uniforms.time.value = state.clock.elapsedTime
    })

    return (
      <mesh ref={meshRef}>
        <planeGeometry />
        <shaderMaterial
          uniforms={{ time: { value: 0 } }}
          vertexShader={customVertexShader}
          fragmentShader={customFragmentShader}
        />
      </mesh>
    )
  }
  ```

## 🚀 Benefits of R3F/3D Approach

1. **Unified Coordinate System** - All UI and game elements exist in the same 3D space
2. **Better Mobile Scaling** - Single scaling system for all elements
3. **GPU Acceleration** - R3F leverages Three.js for optimal WebGL performance
4. **React Integration** - Seamless integration with existing React codebase
5. **Declarative 3D** - Build 3D scenes with familiar React patterns
6. **Professional Polish** - Similar to Hearthstone/Legends of Runeterra
7. **Component Reusability** - R3F components can be easily shared and composed
8. **Built-in Optimizations** - R3F handles render optimization automatically

## ⚠️ Considerations

### Performance
- Three.js is GPU-intensive
- Need to optimize for mobile devices
- Consider texture atlasing for NFT images
- Implement LOD (Level of Detail) for complex effects

### Compatibility
- Requires WebGL support
- Older devices may struggle
- Need fallback for non-WebGL browsers

### Learning Curve
- Developers need Three.js knowledge
- Different debugging approach
- New animation system

## 📝 TODO for Full Implementation

### Immediate Tasks
1. ✅ Fix NFT texture loading
2. ✅ Add cardback texture
3. ⬜ Migrate spell effects to 3D
4. ⬜ Implement spell targeting lines in 3D
5. ⬜ Add 3D particle systems

### Game Logic Integration
1. ⬜ Connect to existing battle state management
2. ⬜ Hook up ability casting to 3D animations
3. ⬜ Sync damage numbers with 3D positions
4. ⬜ Implement turn indicators in 3D

### Polish
1. ⬜ Card entrance animations
2. ⬜ Death animations (card dissolve/shatter)
3. ⬜ Victory celebration effects
4. ⬜ Arena environment variations

## 🔧 Technical Requirements

### Core Dependencies
```json
{
  "@react-three/fiber": "^8.15.0",    // React renderer for Three.js
  "@react-three/drei": "^9.88.0",     // R3F helpers and abstractions
  "three": "^0.160.1"                 // Three.js (peer dependency of R3F)
}
```

### Recommended Additional Packages
```json
{
  "@react-three/postprocessing": "^2.15.0",  // Post-processing effects
  "leva": "^0.9.35",                         // GUI controls for debugging
  "maath": "^0.10.4"                         // Math helpers for animations
}
```

### Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile Safari 14+
- Chrome Android 90+

## 📊 Performance Targets

- **Desktop**: 60 FPS at 1920x1080
- **Mobile**: 30+ FPS at common resolutions
- **Load Time**: < 3 seconds for all assets
- **Memory**: < 200MB GPU memory usage

## 🎨 Visual Style Guide

### Lighting
- Ambient: 0.7 intensity (bright, toy-like)
- Directional: 1.0 intensity from top-right
- Point lights: For spell effects and glows

### Materials
- Cards: MeshStandardMaterial with textures
- Effects: MeshBasicMaterial with transparency
- Arena: MeshStandardMaterial with roughness

### Camera
- Perspective camera
- FOV: 50° (desktop), 60° (mobile)
- Position: Elevated, looking down at arena
- Controls: Orbit controls (disabled during targeting)

## 📚 Resources

### Documentation
- [Three.js Docs](https://threejs.org/docs/)
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/)
- [@react-three/drei](https://github.com/pmndrs/drei)

### Examples
- [Hearthstone-style cards](https://codesandbox.io/s/cards-3d)
- [Particle effects](https://threejs.org/examples/#webgl_points_sprites)
- [Card flip animations](https://codesandbox.io/s/card-flip-3d)

## 🤝 Contributing

When working on the 3D system:
1. Test on both desktop and mobile
2. Check performance with Chrome DevTools
3. Ensure textures are optimized (< 512x512 for mobile)
4. Follow the coordinate system (Y-up, Z-forward)
5. Use the test scene (`/battle3d`) for development

## 📈 Success Metrics

- ✅ Cards and effects align perfectly on all devices
- ✅ Mobile performance >= 30 FPS
- ✅ No coordinate mismatches
- ✅ Smooth animations and transitions
- ✅ Reduced codebase complexity

---

*Last Updated: December 2024*
*Status: Phase 1 - Testing*
*Next Step: Migrate spell effects to 3D*