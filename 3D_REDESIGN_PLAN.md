# ToyBox 3D Battle System Redesign Documentation

## 📋 Overview
This document outlines the transition from the current 2D canvas-based battle system to a unified 3D Three.js/React Three Fiber implementation. This addresses mobile responsiveness issues and coordinate mismatches between DOM elements and canvas effects.

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
**Everything in one 3D scene** - Cards, effects, spells, and arena all exist in the same Three.js coordinate system.

### Technology Stack:
- **Three.js** - 3D graphics engine
- **React Three Fiber** - React renderer for Three.js
- **@react-three/drei** - Helper components and utilities
- **Hybrid Approach** - React overlays for UI elements (health bars, stats)

## 🏗️ Architecture Components

### 1. 3D Cards (`Card3DNFT.jsx`)
- Uses actual NFT images as textures
- Front: NFT artwork from `/assets/nft/`
- Back: `cardback.png` texture
- Dimensions: 2.2 x 3.3 units (maintains card aspect ratio)
- Features:
  - Active card floating animation
  - Hover effects
  - Target highlighting
  - Death overlay

### 2. Battle Arena (`Battle3DTest.jsx`)
- 3D environment with:
  - Wooden floor plane
  - Sky background
  - Ambient + directional lighting
  - Responsive camera positioning

### 3. Effects System
- **Shield3D.jsx** - 3D sphere shields that wrap around cards
- **Spell effects** - Particles and meshes in 3D space
- All effects positioned relative to card positions in 3D

### 4. Hybrid UI Approach
- **3D Layer**: Cards, effects, arena
- **React Overlay**: Health bars, stats, buttons
- Benefits: Best of both worlds - 3D consistency + HTML flexibility

## 📁 File Structure

```
src/components/
├── Card3DNFT.jsx          # 3D card component with NFT textures
├── Shield3D.jsx           # 3D shield effect component
├── Battle3DTest.jsx       # Test scene for 3D battle
├── BattleArena3D.jsx      # Full 3D arena component (future)
└── SpellEffects3D/        # 3D spell effects (to be implemented)
    ├── Fireball3D.jsx
    ├── IceNova3D.jsx
    └── Lightning3D.jsx
```

## 🔄 Migration Plan

### Phase 1: Testing (Current)
✅ Create test scene at `/battle3d`
✅ Implement basic 3D cards with NFT textures
✅ Add shield effects
✅ Test targeting system
✅ Verify mobile responsiveness

### Phase 2: Feature Parity
⬜ Migrate all spell effects to 3D
⬜ Implement spell animations
⬜ Add particle systems
⬜ Create 3D damage numbers
⬜ Implement buff/debuff indicators

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

### Card Positioning
```javascript
// Grid layout for cards
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

## 🚀 Benefits of 3D Approach

1. **Unified Coordinate System** - No more position mismatches
2. **Better Mobile Scaling** - Single system to scale
3. **GPU Acceleration** - Smoother animations and effects
4. **Professional Polish** - Similar to Hearthstone/Legends of Runeterra
5. **Easier Maintenance** - One rendering system instead of two
6. **Future Features** - Easy to add 3D effects, animations, particles

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

### Dependencies
```json
{
  "three": "^0.160.1",
  "@react-three/fiber": "^8.15.0",
  "@react-three/drei": "^9.88.0"
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