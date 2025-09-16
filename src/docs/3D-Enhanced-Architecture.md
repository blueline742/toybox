# 3D Enhanced Architecture Guide
## Complete Package Documentation for Toybox Battle

### Current Development Status (Jan 2025)

#### What We're Building
A Web3 NFT card battle game with:
- **3D Battle Arena**: Hearthstone-style card layout with React Three Fiber
- **Turn-based Combat**: Boardgame.io for authoritative game state
- **NFT Integration**: Solana blockchain for card ownership
- **Real-time PvP**: Socket.io for multiplayer battles
- **Enhanced Visual Effects**: Post-processing, particle systems, spell animations

#### Tech Stack Overview
- **Frontend**: React 18 + Vite
- **3D Rendering**: Three.js, React Three Fiber, @react-three/drei
- **Game State**: Boardgame.io (turn-based game logic)
- **Multiplayer**: Socket.io (WebSocket connections)
- **Blockchain**: Solana Web3.js, Phantom wallet adapter
- **Animation**: Framer Motion 3D, maath, three.meshline
- **Post-processing**: @react-three/postprocessing

#### Current Architecture
```
User Input → Boardgame.io (Game Logic) → Animation Queue → R3F (3D Rendering)
     ↓                                           ↓
Socket.io (PvP) ←→ Backend Server    Visual Effects & Particles
```

### Recent Additions (What We Just Did)
1. **Boardgame.io Integration** ✅
   - Authoritative game state management
   - Turn system with mana increments
   - Move validation and game rules
   - Win conditions based on card elimination

2. **Enhanced 3D Effects Packages** ✅
   - `framer-motion-3d`: Spring animations for cards
   - `@react-three/postprocessing`: Bloom, glow effects
   - `three.meshline`: Spell beam effects
   - `maath`: Smooth transitions and physics

3. **Fixed Issues** ✅
   - Buffer polyfill for Solana compatibility
   - CORS configuration for multiple ports
   - Atlas size increased to 4096px
   - Loading buffer for mobile (7s) and desktop (5s)

### Core 3D Rendering Stack

#### React Three Fiber (R3F) - v8.18.0
**Purpose**: React renderer for Three.js
**Usage**: Main 3D scene management
```javascript
import { Canvas } from '@react-three/fiber'
// Provides React components for Three.js
<Canvas camera={{ position: [0, 5, 10] }}>
  <mesh>
    <boxGeometry />
    <meshStandardMaterial />
  </mesh>
</Canvas>
```

#### @react-three/drei - v9.88.0
**Purpose**: Helper components for R3F
**Key Components**:
- `OrbitControls`: Camera controls
- `Text3D`: 3D text rendering
- `Environment`: HDRI environments
- `PresentationControls`: Mobile-friendly controls
- `useTexture`: Texture loading hook
```javascript
import { OrbitControls, Text3D, Environment } from '@react-three/drei'
```

#### Three.js - v0.166.1
**Purpose**: Core WebGL 3D engine
**Direct Usage**: Custom geometries, materials, shaders
```javascript
import * as THREE from 'three'
const geometry = new THREE.PlaneGeometry(2, 3)
const material = new THREE.MeshStandardMaterial()
```

---

### Animation & Effects Packages (NEW)

#### Framer Motion 3D - v12.4.13
**Purpose**: Declarative animations for R3F components
**Key Features**:
- Spring physics animations
- Gesture support
- Layout animations
- Variants system
**Example Usage**:
```javascript
import { motion } from 'framer-motion-3d'

// Animated mesh with spring physics
<motion.mesh
  animate={{
    rotateY: isActive ? Math.PI : 0,
    scale: isHovered ? 1.2 : 1
  }}
  transition={{ type: "spring", stiffness: 300 }}
  whileHover={{ scale: 1.1 }}
  whileTap={{ scale: 0.95 }}
>
  <boxGeometry />
  <meshStandardMaterial />
</motion.mesh>

// Card flip animation
<motion.group
  animate={{ rotateY: flipped ? Math.PI : 0 }}
  transition={{ duration: 0.6, ease: "easeInOut" }}
>
  {/* Card faces */}
</motion.group>
```

#### @react-three/postprocessing - v2.16.3
**Purpose**: Post-processing effects pipeline
**Key Effects**:
- Bloom: Glow effects for spells
- ChromaticAberration: Distortion effects
- Vignette: Screen edge darkening
- DepthOfField: Focus effects
- GodRays: Light rays
**Example Usage**:
```javascript
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing'

// In Canvas
<EffectComposer>
  <Bloom
    intensity={1.5}
    luminanceThreshold={0.9}
    luminanceSmoothing={0.025}
  />
  <ChromaticAberration offset={[0.002, 0.002]} />
</EffectComposer>

// For spell effects
const PyroBlastEffect = () => (
  <EffectComposer>
    <Bloom intensity={3} luminanceThreshold={0.5} />
  </EffectComposer>
)
```

#### Three.MeshLine - v1.4.0
**Purpose**: Smooth, wide lines in 3D space (beams, trails)
**Key Features**:
- Variable width lines
- Gradient support
- Trail effects
**Example Usage**:
```javascript
import { MeshLine, MeshLineMaterial } from 'three.meshline'

// Create spell beam
const createBeam = (start, end) => {
  const points = []
  const curve = new THREE.CatmullRomCurve3([start, end])

  for (let i = 0; i <= 50; i++) {
    points.push(curve.getPoint(i / 50))
  }

  const line = new MeshLine()
  line.setPoints(points)

  const material = new MeshLineMaterial({
    color: new THREE.Color('#ff6b35'),
    lineWidth: 0.3,
    resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.8,
    dashArray: 0.1,
    dashRatio: 0.5
  })

  return new THREE.Mesh(line, material)
}

// Lightning beam with animated dash
<mesh ref={beamRef}>
  <primitive object={beamGeometry} />
  <meshLineMaterial
    color="#00ffff"
    lineWidth={0.2}
    dashOffset={animatedOffset}
  />
</mesh>
```

#### maath - v0.10.8
**Purpose**: Math utilities for animations and physics
**Key Utilities**:
- `damp`: Smooth value transitions
- `dampLookAt`: Smooth camera/object look-at
- `dampE`: Exponential damping
- Random distributions
- Easing functions
**Example Usage**:
```javascript
import { damp, dampLookAt } from 'maath/easing'

// In animation loop
useFrame((state, delta) => {
  // Smooth position transitions
  damp(mesh.current.position, 'x', targetX, 0.25, delta)
  damp(mesh.current.position, 'y', targetY, 0.25, delta)

  // Smooth rotation to look at target
  dampLookAt(mesh.current.quaternion, target, 0.25, delta)

  // Smooth scale on hover
  const targetScale = hovered ? 1.2 : 1
  damp(mesh.current.scale, 'x', targetScale, 0.1, delta)
})

// Distribute cards in arc
import { distribute } from 'maath/random'
const positions = distribute.inCircle(4, 2) // 4 points in radius 2
```

---

### State Management

#### Boardgame.io - v0.50.2
**Purpose**: Authoritative game state management
**Key Features**:
- Turn-based game logic
- Move validation
- Multiplayer support
- State synchronization
**Implementation**:
```javascript
import { Client } from 'boardgame.io/react'

const ToyboxGame = {
  setup: () => ({ players: {}, cards: [] }),
  turn: {
    onBegin: (G, ctx) => { /* mana refresh */ },
    onEnd: (G, ctx) => { /* cleanup */ }
  },
  moves: {
    playCard: (G, ctx, cardId, targetId) => {
      // Validated game logic
    }
  },
  endIf: (G, ctx) => {
    // Victory conditions
  }
}
```

---

## Implementation Examples

### 1. Enhanced Spell Effects
```javascript
// Pyroblast with bloom and beam
const PyroBlast = ({ start, target }) => {
  const beamRef = useRef()

  useFrame((state, delta) => {
    // Animate beam
    if (beamRef.current) {
      beamRef.current.material.dashOffset -= delta * 2
    }
  })

  return (
    <>
      {/* Beam using MeshLine */}
      <mesh ref={beamRef}>
        <primitive object={createBeam(start, target)} />
      </mesh>

      {/* Explosion at target with Bloom */}
      <motion.mesh
        position={target}
        animate={{ scale: [0, 2, 0] }}
        transition={{ duration: 0.5 }}
      >
        <sphereGeometry />
        <meshBasicMaterial color="#ff6b35" />
      </motion.mesh>
    </>
  )
}
```

### 2. Card Animations
```javascript
// Card with hover and attack animations
const BattleCard = ({ card, position }) => {
  const meshRef = useRef()
  const [hovered, setHovered] = useState(false)

  useFrame((state, delta) => {
    // Smooth hover float
    if (hovered) {
      damp(meshRef.current.position, 'y', 0.5, 0.25, delta)
    } else {
      damp(meshRef.current.position, 'y', 0, 0.25, delta)
    }
  })

  return (
    <motion.group
      position={position}
      animate={{
        rotateY: card.isRevealed ? 0 : Math.PI,
        scale: card.isAttacking ? [1, 1.3, 1] : 1
      }}
      whileHover={{ scale: 1.05 }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <mesh ref={meshRef}>
        {/* Card geometry */}
      </mesh>
    </motion.group>
  )
}
```

### 3. Shield Effect with Post-processing
```javascript
const ShieldEffect = ({ target }) => {
  return (
    <>
      {/* Energy shield bubble */}
      <motion.mesh
        position={target.position}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <sphereGeometry args={[1.5, 32, 32]} />
        <meshStandardMaterial
          color="#00ffff"
          transparent
          opacity={0.3}
          emissive="#00ffff"
          emissiveIntensity={0.5}
        />
      </motion.mesh>

      {/* Add bloom for glow */}
      <EffectComposer>
        <Bloom
          intensity={1}
          luminanceThreshold={0.1}
          luminanceSmoothing={0.9}
        />
      </EffectComposer>
    </>
  )
}
```

### 4. Freeze Effect
```javascript
const FreezeEffect = ({ target }) => {
  const iceRef = useRef()

  useFrame((state) => {
    if (iceRef.current) {
      // Subtle rotation for ice crystals
      iceRef.current.rotation.y = Math.sin(state.clock.elapsedTime) * 0.1
    }
  })

  return (
    <group position={target.position}>
      {/* Ice crystals */}
      {[...Array(6)].map((_, i) => (
        <motion.mesh
          key={i}
          ref={i === 0 ? iceRef : null}
          position={[
            Math.cos(i * Math.PI / 3) * 0.5,
            Math.random() * 0.5,
            Math.sin(i * Math.PI / 3) * 0.5
          ]}
          animate={{
            scale: [0, 1],
            rotateZ: [0, Math.PI * 2]
          }}
          transition={{ duration: 0.5, delay: i * 0.05 }}
        >
          <coneGeometry args={[0.2, 0.5, 4]} />
          <meshPhysicalMaterial
            color="#87CEEB"
            metalness={0.1}
            roughness={0.2}
            transparent
            opacity={0.8}
            transmission={0.5}
          />
        </motion.mesh>
      ))}
    </group>
  )
}
```

---

## Performance Optimization Tips

### 1. Use Instanced Rendering for Particles
```javascript
import { Instances, Instance } from '@react-three/drei'

<Instances limit={1000}>
  <sphereGeometry args={[0.1]} />
  <meshBasicMaterial />
  {particles.map((p, i) => (
    <Instance key={i} position={p.position} scale={p.scale} />
  ))}
</Instances>
```

### 2. Optimize Post-processing
- Use selective bloom (luminanceThreshold)
- Limit effect composer passes
- Consider mobile performance

### 3. Animation Performance
- Use `damp` from maath for smooth transitions
- Prefer GPU animations (shaders) for particles
- Batch similar animations

### 4. Mobile Considerations
- Reduce particle counts
- Simplify geometries
- Lower resolution for post-processing
- Use LOD (Level of Detail) for complex models

---

## Future Enhancements

1. **Particle Systems**: Use `@react-three/rapier` for physics-based particles
2. **Advanced Shaders**: Custom shader materials for unique effects
3. **Sound Integration**: Spatial audio with `@react-three/rapier`
4. **Network Optimization**: Delta compression for multiplayer state
5. **AR/VR Support**: `@react-three/xr` for immersive experiences

---

## Quick Reference

### Package Imports
```javascript
// Core
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Text3D, Environment } from '@react-three/drei'
import * as THREE from 'three'

// Animation
import { motion } from 'framer-motion-3d'
import { damp, dampLookAt } from 'maath/easing'

// Effects
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { MeshLine, MeshLineMaterial } from 'three.meshline'

// Game State
import { Client } from 'boardgame.io/react'
```

### Common Patterns
1. **Smooth Animations**: Use maath's `damp` in `useFrame`
2. **Spell Effects**: Combine MeshLine beams with Bloom
3. **Card States**: Framer Motion 3D for transitions
4. **Visual Feedback**: Post-processing for impact
5. **State Management**: Boardgame.io for game logic

---

This architecture provides a complete toolkit for building sophisticated 3D battle experiences with smooth animations, stunning visual effects, and robust game state management.