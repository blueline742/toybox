import React, { useRef, useEffect, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Sphere, Trail, Billboard } from '@react-three/drei'
import * as THREE from 'three'

// Fireball Core Component
const FireballCore = ({ position, targetPosition, onComplete }) => {
  const meshRef = useRef()
  const trailRef = useRef()
  const [explosionPhase, setExplosionPhase] = useState(false)
  const startTime = useRef(Date.now())
  
  // Animation state
  const animationDuration = 600 // milliseconds - slightly faster
  const currentPos = useRef(new THREE.Vector3(...position))
  
  useFrame((state, delta) => {
    if (!meshRef.current) return
    
    const elapsed = Date.now() - startTime.current
    const progress = Math.min(elapsed / animationDuration, 1)
    
    if (progress < 1 && !explosionPhase) {
      // Smooth easing function
      const easeProgress = 1 - Math.pow(1 - progress, 2) // Ease out quadratic
      
      // Straight line interpolation with subtle arc
      currentPos.current.x = position[0] + (targetPosition[0] - position[0]) * easeProgress
      currentPos.current.y = position[1] + (targetPosition[1] - position[1]) * easeProgress 
        + Math.sin(progress * Math.PI) * 0.5 // Much smaller arc to stay on screen
      
      meshRef.current.position.copy(currentPos.current)
      
      // Rotate and pulse the fireball
      meshRef.current.rotation.x += delta * 5
      meshRef.current.rotation.y += delta * 3
      meshRef.current.scale.setScalar(1 + Math.sin(elapsed * 0.01) * 0.2)
      
      // Update emissive intensity
      if (meshRef.current.material) {
        meshRef.current.material.emissiveIntensity = 2 + Math.sin(elapsed * 0.02) * 0.5
      }
    } else if (!explosionPhase) {
      // Trigger explosion
      setExplosionPhase(true)
      setTimeout(() => {
        onComplete && onComplete()
      }, 500)
    }
  })
  
  return (
    <>
      {/* Main Fireball */}
      {!explosionPhase && (
        <Trail
          width={3}
          length={10}
          decay={1}
          local={false}
          stride={0}
          interval={1}
          target={meshRef}
          attenuation={(width) => width * width}
          color={new THREE.Color('#ff6600')}
        >
          <Sphere ref={meshRef} args={[0.5, 32, 32]} position={position}>
            <meshStandardMaterial
              color="#ff4400"
              emissive="#ff6600"
              emissiveIntensity={2}
              roughness={0.2}
              metalness={0.8}
            />
          </Sphere>
        </Trail>
      )}
      
      {/* Explosion Effect */}
      {explosionPhase && (
        <ExplosionEffect position={[targetPosition[0], targetPosition[1], 0]} />
      )}
      
      {/* Particle Emitter */}
      {!explosionPhase && (
        <FireParticles position={currentPos.current} />
      )}
    </>
  )
}

// Fire Particles Component
const FireParticles = ({ position }) => {
  const particlesRef = useRef()
  const particleCount = 50
  
  // Create particle geometry
  const particles = useRef(
    new Float32Array(particleCount * 3).map(() => (Math.random() - 0.5) * 0.5)
  )
  
  useFrame((state, delta) => {
    if (!particlesRef.current) return
    
    const positions = particlesRef.current.geometry.attributes.position.array
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3
      
      // Update particle positions
      positions[i3 + 1] += delta * 2 // Move up
      positions[i3] += (Math.random() - 0.5) * delta * 2 // Random X movement
      
      // Reset particles that go too high
      if (positions[i3 + 1] > 2) {
        positions[i3] = (Math.random() - 0.5) * 0.5
        positions[i3 + 1] = 0
        positions[i3 + 2] = (Math.random() - 0.5) * 0.5
      }
    }
    
    particlesRef.current.geometry.attributes.position.needsUpdate = true
  })
  
  return (
    <points ref={particlesRef} position={position}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={particles.current}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        color="#ffaa00"
        blending={THREE.AdditiveBlending}
        transparent
        opacity={0.8}
        depthWrite={false}
      />
    </points>
  )
}

// Explosion Effect Component - ENHANCED
const ExplosionEffect = ({ position }) => {
  const explosionRef = useRef()
  const innerExplosionRef = useRef()
  const shockwaveRef = useRef()
  const shockwave2Ref = useRef()
  const fireRingRef = useRef()
  const startTime = useRef(Date.now())
  
  useFrame(() => {
    const elapsed = Date.now() - startTime.current
    const progress = elapsed / 700 // 700ms explosion duration
    
    // Main explosion sphere
    if (explosionRef.current) {
      const scale = 0.5 + progress * 4
      explosionRef.current.scale.setScalar(scale)
      explosionRef.current.material.opacity = Math.max(0, 1 - progress * 0.8)
      explosionRef.current.material.emissiveIntensity = 3 - progress * 2
    }
    
    // Inner bright core
    if (innerExplosionRef.current) {
      const scale = 0.3 + progress * 2
      innerExplosionRef.current.scale.setScalar(scale)
      innerExplosionRef.current.material.opacity = Math.max(0, 1 - progress * 0.6)
    }
    
    // Primary shockwave
    if (shockwaveRef.current) {
      const shockScale = 0.5 + progress * 8
      shockwaveRef.current.scale.x = shockScale
      shockwaveRef.current.scale.y = shockScale
      shockwaveRef.current.material.opacity = Math.max(0, 0.8 - progress)
    }
    
    // Secondary shockwave
    if (shockwave2Ref.current) {
      const shockScale = 0.5 + progress * 6
      shockwave2Ref.current.scale.x = shockScale
      shockwave2Ref.current.scale.y = shockScale
      shockwave2Ref.current.material.opacity = Math.max(0, 0.6 - progress * 0.8)
      shockwave2Ref.current.rotation.z += 0.05
    }
    
    // Fire ring expansion
    if (fireRingRef.current) {
      const ringScale = 0.2 + progress * 5
      fireRingRef.current.scale.x = ringScale
      fireRingRef.current.scale.y = ringScale
      fireRingRef.current.scale.z = 1 + progress * 0.5
      fireRingRef.current.material.opacity = Math.max(0, 0.9 - progress * 0.7)
    }
  })
  
  return (
    <group position={position}>
      {/* Bright Inner Core */}
      <Sphere ref={innerExplosionRef} args={[0.8, 32, 32]}>
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ffff00"
          emissiveIntensity={5}
          transparent
          opacity={1}
          blending={THREE.AdditiveBlending}
        />
      </Sphere>
      
      {/* Main Explosion Sphere */}
      <Sphere ref={explosionRef} args={[1.5, 32, 32]}>
        <meshStandardMaterial
          color="#ff6600"
          emissive="#ff4400"
          emissiveIntensity={3}
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
        />
      </Sphere>
      
      {/* Primary Shockwave Ring */}
      <mesh ref={shockwaveRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.2, 3, 64, 8]} />
        <meshBasicMaterial
          color="#ffaa00"
          transparent
          opacity={0.8}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Secondary Shockwave Ring */}
      <mesh ref={shockwave2Ref} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1, 4, 32, 4]} />
        <meshBasicMaterial
          color="#ff6600"
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Fire Ring */}
      <mesh ref={fireRingRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2, 0.3, 16, 32]} />
        <meshBasicMaterial
          color="#ff3300"
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Multiple Particle Systems */}
      <ExplosionParticles />
      <ExplosionSparks />
    </group>
  )
}

// Explosion Particles
const ExplosionParticles = () => {
  const particlesRef = useRef()
  const particleCount = 100
  const velocities = useRef([])
  
  useEffect(() => {
    // Initialize particle velocities
    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI
      const speed = 3 + Math.random() * 7
      
      velocities.current.push({
        x: Math.sin(phi) * Math.cos(theta) * speed,
        y: Math.sin(phi) * Math.sin(theta) * speed,
        z: Math.cos(phi) * speed
      })
    }
  }, [])
  
  useFrame((state, delta) => {
    if (!particlesRef.current) return
    
    const positions = particlesRef.current.geometry.attributes.position.array
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3
      const vel = velocities.current[i]
      
      if (vel) {
        positions[i3] += vel.x * delta
        positions[i3 + 1] += vel.y * delta
        positions[i3 + 2] += vel.z * delta
        
        // Apply gravity
        vel.y -= 9.8 * delta
        
        // Damping
        vel.x *= 0.98
        vel.y *= 0.98
        vel.z *= 0.98
      }
    }
    
    particlesRef.current.geometry.attributes.position.needsUpdate = true
  })
  
  const positions = new Float32Array(particleCount * 3)
  
  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.2}
        color="#ff9900"
        blending={THREE.AdditiveBlending}
        transparent
        opacity={0.9}
        depthWrite={false}
      />
    </points>
  )
}

// Explosion Sparks - Additional particle effect
const ExplosionSparks = () => {
  const sparksRef = useRef()
  const sparkCount = 50
  const velocities = useRef([])
  
  useEffect(() => {
    // Initialize spark velocities in a sphere pattern
    for (let i = 0; i < sparkCount; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI
      const speed = 8 + Math.random() * 12
      
      velocities.current.push({
        x: Math.sin(phi) * Math.cos(theta) * speed,
        y: Math.sin(phi) * Math.sin(theta) * speed,
        z: Math.cos(phi) * speed * 0.3 // Less Z movement
      })
    }
  }, [])
  
  useFrame((state, delta) => {
    if (!sparksRef.current) return
    
    const positions = sparksRef.current.geometry.attributes.position.array
    
    for (let i = 0; i < sparkCount; i++) {
      const i3 = i * 3
      const vel = velocities.current[i]
      
      if (vel) {
        positions[i3] += vel.x * delta
        positions[i3 + 1] += vel.y * delta
        positions[i3 + 2] += vel.z * delta
        
        // Damping
        vel.x *= 0.96
        vel.y *= 0.96
        vel.z *= 0.96
      }
    }
    
    sparksRef.current.geometry.attributes.position.needsUpdate = true
  })
  
  const positions = new Float32Array(sparkCount * 3)
  
  return (
    <points ref={sparksRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={sparkCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.3}
        color="#ffff00"
        blending={THREE.AdditiveBlending}
        transparent
        opacity={1}
        depthWrite={false}
      />
    </points>
  )
}

// Main Pyroblast Effect Component
const PyroblastEffect = ({ sourcePos, targetPos, onComplete }) => {
  // Convert pixel positions to normalized 3D coordinates
  // Adjust for camera FOV and aspect ratio
  const aspect = window.innerWidth / window.innerHeight
  const fovMultiplier = 8 // Adjusted for 50 degree FOV
  
  const source3D = [
    ((sourcePos.x / window.innerWidth) - 0.5) * fovMultiplier * aspect,
    -((sourcePos.y / window.innerHeight) - 0.5) * fovMultiplier,
    0
  ]
  
  const target3D = [
    ((targetPos.x / window.innerWidth) - 0.5) * fovMultiplier * aspect,
    -((targetPos.y / window.innerHeight) - 0.5) * fovMultiplier,
    0
  ]
  
  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 9999 }}>
      <Canvas
        camera={{ 
          position: [0, 0, 10],
          fov: 50
        }}
        gl={{ 
          alpha: true,
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.5
        }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <pointLight position={source3D} intensity={2} color="#ff6600" />
        
        {/* Fog for atmosphere */}
        <fog attach="fog" args={['#000000', 10, 50]} />
        
        {/* Main Fireball Effect */}
        <FireballCore 
          position={source3D}
          targetPosition={target3D}
          onComplete={onComplete}
        />
      </Canvas>
    </div>
  )
}

export default PyroblastEffect