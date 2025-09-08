import React, { useRef, useEffect, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Sphere, Ring, Box } from '@react-three/drei'
import * as THREE from 'three'

// Ice Shockwave Component
const IceShockwave = ({ position }) => {
  const ringRef = useRef()
  const startTime = useRef(Date.now())
  const [visible, setVisible] = useState(true)
  
  useFrame(() => {
    if (!ringRef.current || !visible) return
    
    const elapsed = Date.now() - startTime.current
    const progress = Math.min(elapsed / 1500, 1)
    
    // Expand outward
    const scale = 0.1 + progress * 15
    ringRef.current.scale.set(scale, scale, 1)
    
    // Fade out
    ringRef.current.material.opacity = (1 - progress) * 0.8
    
    // Rotate for effect
    ringRef.current.rotation.z += 0.02
    
    if (progress >= 1) {
      setVisible(false)
    }
  })
  
  if (!visible) return null
  
  return (
    <mesh ref={ringRef} position={position} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[1, 0.3, 8, 32]} />
      <meshStandardMaterial
        color="#00ddff"
        emissive="#00aaff"
        emissiveIntensity={3}
        transparent={true}
        opacity={0.8}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  )
}

// Frost Overlay Component
const FrostOverlay = () => {
  const meshRef = useRef()
  const { viewport } = useThree()
  const startTime = useRef(Date.now())
  const [visible, setVisible] = useState(true)
  
  useFrame(() => {
    if (!meshRef.current || !visible) return
    
    const elapsed = Date.now() - startTime.current
    const progress = Math.min(elapsed / 2000, 1)
    
    // Fade in and out
    if (progress < 0.2) {
      meshRef.current.material.opacity = progress * 2.5
    } else if (progress < 0.8) {
      meshRef.current.material.opacity = 0.5
    } else {
      meshRef.current.material.opacity = 0.5 * (1 - (progress - 0.8) / 0.2)
    }
    
    if (progress >= 1) {
      setVisible(false)
    }
  })
  
  if (!visible) return null
  
  return (
    <mesh ref={meshRef} position={[0, 0, 5]}>
      <planeGeometry args={[viewport.width * 1.5, viewport.height * 1.5]} />
      <meshBasicMaterial
        color="#aaccff"
        transparent={true}
        opacity={0}
        side={THREE.DoubleSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}

// Ice Prison Component
const IcePrison = ({ position, delay = 0 }) => {
  const groupRef = useRef()
  const iceRef = useRef()
  const startTime = useRef(Date.now() + delay)
  const [visible, setVisible] = useState(false)
  
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])
  
  useFrame(() => {
    if (!groupRef.current || !visible) return
    
    const elapsed = Date.now() - startTime.current
    const progress = Math.min(elapsed / 500, 1)
    
    if (progress < 1) {
      // Form animation
      const scale = progress
      groupRef.current.scale.set(scale, scale * 1.5, scale)
      if (iceRef.current) {
        iceRef.current.material.opacity = progress * 0.7
      }
    } else {
      // Subtle floating
      const floatElapsed = (elapsed - 500) / 1000
      groupRef.current.position.y = position[1] + Math.sin(floatElapsed * 2) * 0.05
    }
    
    // Cleanup after 2.5 seconds
    if (elapsed > 2500) {
      setVisible(false)
    }
  })
  
  if (!visible) return null
  
  return (
    <group ref={groupRef} position={position}>
      <Box ref={iceRef} args={[1, 2, 1]}>
        <meshStandardMaterial
          color="#cceeff"
          emissive="#66ccff"
          emissiveIntensity={0.5}
          transparent={true}
          opacity={0}
          roughness={0.1}
          metalness={0.3}
          side={THREE.DoubleSide}
        />
      </Box>
      
      {/* Inner glow */}
      <Sphere args={[0.8, 16, 16]}>
        <meshBasicMaterial
          color="#ffffff"
          transparent={true}
          opacity={0.3}
          blending={THREE.AdditiveBlending}
        />
      </Sphere>
    </group>
  )
}

// Snowflake Particles
const SnowflakeParticles = () => {
  const particlesRef = useRef()
  const particleCount = 100
  
  const positions = new Float32Array(particleCount * 3)
  const velocities = useRef([])
  
  // Initialize particles
  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3
    positions[i3] = (Math.random() - 0.5) * 20
    positions[i3 + 1] = Math.random() * 10 - 5
    positions[i3 + 2] = (Math.random() - 0.5) * 10
    
    velocities.current.push({
      x: (Math.random() - 0.5) * 0.5,
      y: -Math.random() * 2 - 0.5,
      z: 0
    })
  }
  
  useFrame((state, delta) => {
    if (!particlesRef.current) return
    
    const positions = particlesRef.current.geometry.attributes.position.array
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3
      const vel = velocities.current[i]
      
      positions[i3] += vel.x * delta
      positions[i3 + 1] += vel.y * delta
      
      // Reset if too low
      if (positions[i3 + 1] < -5) {
        positions[i3 + 1] = 5
        positions[i3] = (Math.random() - 0.5) * 20
      }
    }
    
    particlesRef.current.geometry.attributes.position.needsUpdate = true
  })
  
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
        size={0.1}
        color="#ffffff"
        transparent={true}
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

// Main Ice Nova Scene
const IceNovaScene = ({ sourcePos, targets }) => {
  const aspect = window.innerWidth / window.innerHeight
  const fovMultiplier = 8
  
  // Convert 2D positions to 3D
  const source3D = [
    ((sourcePos.x / window.innerWidth) - 0.5) * fovMultiplier * aspect,
    -((sourcePos.y / window.innerHeight) - 0.5) * fovMultiplier,
    0
  ]
  
  const targets3D = targets.map(target => [
    ((target.x / window.innerWidth) - 0.5) * fovMultiplier * aspect,
    -((target.y / window.innerHeight) - 0.5) * fovMultiplier,
    0
  ])
  
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={1} />
      <pointLight position={source3D} intensity={3} color="#00ccff" />
      <directionalLight position={[0, 5, 5]} intensity={1} color="#ffffff" />
      
      {/* Effects */}
      <IceShockwave position={source3D} />
      <FrostOverlay />
      
      {/* Ice Prisons for targets */}
      {targets3D.map((pos, idx) => (
        <IcePrison 
          key={idx}
          position={pos}
          delay={100 + idx * 50}
        />
      ))}
      
      {/* Particles */}
      <SnowflakeParticles />
    </>
  )
}

// Main Component - Following Pyroblast structure exactly
const WorkingIceNovaEffect = ({ sourcePos, targets, onComplete }) => {
  console.log('WorkingIceNovaEffect starting with:', { sourcePos, targets })
  
  useEffect(() => {
    // Complete after 3 seconds
    const timer = setTimeout(() => {
      console.log('WorkingIceNovaEffect completing')
      if (onComplete) onComplete()
    }, 3000)
    
    return () => clearTimeout(timer)
  }, [onComplete])
  
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
        <IceNovaScene 
          sourcePos={sourcePos}
          targets={targets || []}
        />
      </Canvas>
    </div>
  )
}

export default WorkingIceNovaEffect