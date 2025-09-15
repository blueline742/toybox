import React, { useRef, useState, useEffect, Suspense } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { useSpring, animated } from '@react-spring/three'
import { TextureLoader } from 'three'
import * as THREE from 'three'

const FlyingCard = ({ startPosition, imageUrl, onComplete }) => {
  const meshRef = useRef()
  const [hasCompleted, setHasCompleted] = useState(false)

  // Load texture with useLoader for better handling
  const texture = useLoader(TextureLoader, imageUrl)
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter

  // Spring animation for position, rotation and opacity
  const { position, rotation, scale, opacity } = useSpring({
    from: {
      position: startPosition,
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      opacity: 1
    },
    to: async (next) => {
      // Pop out and move to center
      await next({
        position: [0, 0, 3],  // Center of screen
        scale: [1.8, 1.8, 1.8],  // Showcase scale
        rotation: [0, Math.PI * 2, 0],  // Full horizontal flip
        opacity: 1,
        config: { tension: 180, friction: 25 }
      })

      // Hold at center briefly
      await next({
        position: [0, 0, 3],
        scale: [1.8, 1.8, 1.8],
        rotation: [0, Math.PI * 2, 0],
        opacity: 1,
        config: { tension: 120, friction: 30, duration: 300 }
      })

      // Fade out
      await next({
        position: [0, 0, 3],
        scale: [2, 2, 2],  // Slightly grow while fading
        rotation: [0, Math.PI * 2.5, 0],  // Small extra rotation
        opacity: 0,
        config: { tension: 120, friction: 25 }
      })

      // Mark as completed and call callback
      if (!hasCompleted) {
        setHasCompleted(true)
        onComplete && onComplete()
      }
    }
  })

  // Add floating animation only when visible
  useFrame((state) => {
    if (meshRef.current && meshRef.current.material.opacity > 0.1) {
      meshRef.current.rotation.y += 0.01
      meshRef.current.position.y += Math.sin(state.clock.elapsedTime * 2) * 0.003
    }
  })

  // Don't render if already completed
  if (hasCompleted) return null

  return (
    <animated.mesh
      ref={meshRef}
      position={position}
      rotation={rotation}
      scale={scale}
    >
      <boxGeometry args={[1.5, 2, 0.1]} />
      <animated.meshBasicMaterial
        map={texture}
        side={THREE.DoubleSide}
        transparent={true}
        opacity={opacity}
        toneMapped={false}
      />
    </animated.mesh>
  )
}

// Fallback component while texture loads
const FallbackCard = ({ position }) => (
  <mesh position={position}>
    <boxGeometry args={[1.5, 2, 0.1]} />
    <meshBasicMaterial color="#fbbf24" />
  </mesh>
)

const CardFlyAnimation = ({ isAnimating, startRect, imageUrl, onComplete }) => {
  if (!isAnimating || !startRect) return null

  // Calculate 3D position from screen coordinates
  const startPos = [
    (startRect.x + startRect.width / 2 - window.innerWidth / 2) / 100,
    -(startRect.y + startRect.height / 2 - window.innerHeight / 2) / 100,
    0
  ]

  return (
    <div className="fixed inset-0 z-50" style={{ pointerEvents: 'none' }}>
      <Canvas
        camera={{ position: [0, 0, 10], fov: 50 }}
        style={{
          background: 'transparent',
          pointerEvents: 'none'
        }}
        gl={{ alpha: true, antialias: true }}
      >
        <Suspense fallback={<FallbackCard position={startPos} />}>
          <FlyingCard
            startPosition={startPos}
            imageUrl={imageUrl}
            onComplete={onComplete}
          />
        </Suspense>
      </Canvas>
    </div>
  )
}

export default CardFlyAnimation