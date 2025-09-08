import React, { useRef, useEffect, useState, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Sphere, Ring, Box, Trail, Text3D, Center } from '@react-three/drei'
import * as THREE from 'three'
import { CSSFrostOverlay } from './FrostScreenEffect'

// Epic Ice Shockwave with multiple rings
const EpicIceShockwave = ({ position }) => {
  const ring1Ref = useRef()
  const ring2Ref = useRef()
  const ring3Ref = useRef()
  const startTime = useRef(Date.now())
  const [visible, setVisible] = useState(true)
  
  useFrame(() => {
    if (!visible) return
    
    const elapsed = Date.now() - startTime.current
    const progress = Math.min(elapsed / 2000, 1)
    
    // Ring 1 - Main shockwave (horizontal expansion)
    if (ring1Ref.current) {
      const scale = 0.1 + progress * 30 // Increased expansion
      ring1Ref.current.scale.set(scale, 0.5, scale) // Flatter rings for more horizontal spread
      ring1Ref.current.material.opacity = (1 - progress) * 0.9
      ring1Ref.current.rotation.y += 0.02 // Slower rotation
    }
    
    // Ring 2 - Secondary wave (delayed)
    if (ring2Ref.current && progress > 0.2) {
      const progress2 = (progress - 0.2) / 0.8
      const scale = 0.1 + progress2 * 25 // Increased expansion
      ring2Ref.current.scale.set(scale, 0.5, scale) // Flatter rings
      ring2Ref.current.material.opacity = (1 - progress2) * 0.7
      ring2Ref.current.rotation.y -= 0.015 // Slower rotation
    }
    
    // Ring 3 - Tertiary wave (more delayed)
    if (ring3Ref.current && progress > 0.4) {
      const progress3 = (progress - 0.4) / 0.6
      const scale = 0.1 + progress3 * 20 // Increased expansion
      ring3Ref.current.scale.set(scale, 0.5, scale) // Flatter rings
      ring3Ref.current.material.opacity = (1 - progress3) * 0.5
      ring3Ref.current.rotation.y += 0.025 // Slower rotation
    }
    
    if (progress >= 1) {
      setVisible(false)
    }
  })
  
  if (!visible) return null
  
  return (
    <>
      {/* Main shockwave - NO ROTATION for horizontal expansion */}
      <mesh ref={ring1Ref} position={position} rotation={[0, 0, 0]}>
        <torusGeometry args={[1, 0.4, 12, 64]} />
        <meshStandardMaterial
          color="#00ffff"
          emissive="#00ffff"
          emissiveIntensity={5}
          transparent={true}
          opacity={0.9}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      
      {/* Secondary ring - horizontal */}
      <mesh ref={ring2Ref} position={position} rotation={[0, 0, 0]}>
        <torusGeometry args={[1, 0.3, 8, 48]} />
        <meshStandardMaterial
          color="#66ddff"
          emissive="#66ddff"
          emissiveIntensity={3}
          transparent={true}
          opacity={0.7}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      
      {/* Tertiary ring - horizontal */}
      <mesh ref={ring3Ref} position={position} rotation={[0, 0, 0]}>
        <torusGeometry args={[1, 0.2, 6, 32]} />
        <meshStandardMaterial
          color="#aaeeff"
          emissive="#aaeeff"
          emissiveIntensity={2}
          transparent={true}
          opacity={0.5}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </>
  )
}

// Epic Frost Overlay with ice crystals forming
const EpicFrostOverlay = () => {
  const meshRef = useRef()
  const crystalRef = useRef()
  const { viewport } = useThree()
  const startTime = useRef(Date.now())
  const [visible, setVisible] = useState(true)
  
  // Generate ice crystal pattern texture
  const crystalTexture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')
    
    // Create frost pattern
    ctx.fillStyle = 'rgba(200, 230, 255, 0.1)'
    ctx.fillRect(0, 0, 512, 512)
    
    // Draw ice crystals
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * 512
      const y = Math.random() * 512
      const size = Math.random() * 30 + 10
      
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(Math.random() * Math.PI * 2)
      
      // Draw snowflake pattern
      ctx.strokeStyle = `rgba(200, 240, 255, ${Math.random() * 0.5 + 0.3})`
      ctx.lineWidth = 1
      ctx.beginPath()
      
      for (let j = 0; j < 6; j++) {
        ctx.moveTo(0, 0)
        const angle = (j * Math.PI) / 3
        ctx.lineTo(Math.cos(angle) * size, Math.sin(angle) * size)
        
        // Add branches
        const branchX = Math.cos(angle) * size * 0.6
        const branchY = Math.sin(angle) * size * 0.6
        ctx.moveTo(branchX, branchY)
        ctx.lineTo(branchX + Math.cos(angle + 0.5) * size * 0.3, branchY + Math.sin(angle + 0.5) * size * 0.3)
        ctx.moveTo(branchX, branchY)
        ctx.lineTo(branchX + Math.cos(angle - 0.5) * size * 0.3, branchY + Math.sin(angle - 0.5) * size * 0.3)
      }
      
      ctx.stroke()
      ctx.restore()
    }
    
    return new THREE.CanvasTexture(canvas)
  }, [])
  
  useFrame(() => {
    if (!meshRef.current || !visible) return
    
    const elapsed = Date.now() - startTime.current
    const progress = Math.min(elapsed / 3000, 1)
    
    // Fade in, hold, then fade out
    if (progress < 0.3) {
      meshRef.current.material.opacity = (progress / 0.3) * 0.6
      if (crystalRef.current) {
        crystalRef.current.material.opacity = (progress / 0.3) * 0.4
      }
    } else if (progress < 0.7) {
      meshRef.current.material.opacity = 0.6
      if (crystalRef.current) {
        crystalRef.current.material.opacity = 0.4
        // Rotate crystal texture slowly
        crystalRef.current.rotation.z += 0.001
      }
    } else {
      const fadeProgress = (progress - 0.7) / 0.3
      meshRef.current.material.opacity = 0.6 * (1 - fadeProgress)
      if (crystalRef.current) {
        crystalRef.current.material.opacity = 0.4 * (1 - fadeProgress)
      }
    }
    
    if (progress >= 1) {
      setVisible(false)
    }
  })
  
  if (!visible) return null
  
  return (
    <>
      {/* Base frost overlay */}
      <mesh ref={meshRef} position={[0, 0, 5]}>
        <planeGeometry args={[viewport.width * 1.5, viewport.height * 1.5]} />
        <meshBasicMaterial
          color="#cceeff"
          transparent={true}
          opacity={0}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Crystal pattern overlay */}
      <mesh ref={crystalRef} position={[0, 0, 5.1]}>
        <planeGeometry args={[viewport.width * 1.5, viewport.height * 1.5]} />
        <meshBasicMaterial
          map={crystalTexture}
          transparent={true}
          opacity={0}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </>
  )
}

// Realistic Ice Prison that encases the toy
const EpicIcePrison = ({ position, targetElement, delay = 0, onComplete }) => {
  const groupRef = useRef()
  const mainIceRef = useRef()
  const innerIceRef = useRef()
  const glowRef = useRef()
  const spikeRefs = useRef([])
  const startTime = useRef(Date.now() + delay)
  const [visible, setVisible] = useState(false)
  const [actualPosition, setActualPosition] = useState(position)
  
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay)
    
    // Get the actual position of the target element if provided
    if (targetElement) {
      const rect = targetElement.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      
      // Convert screen coordinates to 3D world coordinates
      const aspect = window.innerWidth / window.innerHeight
      const fovMultiplier = 10 // Increased for wider spread
      
      // Adjusted positioning to be directly on the character
      setActualPosition([
        ((centerX / window.innerWidth) - 0.5) * fovMultiplier * aspect * 1.08, // Slight right adjustment to center on character
        -((centerY / window.innerHeight) - 0.5) * fovMultiplier,
        0
      ])
    }
    
    return () => clearTimeout(timer)
  }, [delay, targetElement])
  
  // Create realistic ice crystal formation
  const iceFormation = useMemo(() => {
    const formation = {
      // Main ice block - irregular shape
      mainCrystal: {
        vertices: [],
        faces: []
      },
      // Surrounding ice spikes
      spikes: []
    }
    
    // Create main irregular ice block vertices
    const baseVertices = []
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2
      const radius = 0.6 + Math.random() * 0.3
      const height = Math.random() * 0.4 - 0.2
      baseVertices.push([
        Math.cos(angle) * radius,
        height,
        Math.sin(angle) * radius
      ])
    }
    
    // Create ice spikes that jut out
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + Math.random() * 0.3
      const baseRadius = 0.7
      const tipRadius = 0.1
      const height = 1.2 + Math.random() * 0.6
      const tilt = Math.random() * 0.3 - 0.15
      
      formation.spikes.push({
        position: [
          Math.cos(angle) * baseRadius,
          -0.5,
          Math.sin(angle) * baseRadius
        ],
        rotation: [
          tilt,
          angle,
          Math.random() * 0.1
        ],
        scale: [1, height, 1],
        baseWidth: 0.4 + Math.random() * 0.2,
        tipWidth: 0.05,
        height: height
      })
    }
    
    // Add upper spikes
    for (let i = 0; i < 5; i++) {
      const angle = Math.random() * Math.PI * 2
      const radius = Math.random() * 0.4 + 0.2
      
      formation.spikes.push({
        position: [
          Math.cos(angle) * radius,
          0.8,
          Math.sin(angle) * radius
        ],
        rotation: [
          Math.random() * 0.5 - 0.25,
          angle,
          0
        ],
        scale: [0.7, 0.8 + Math.random() * 0.4, 0.7],
        baseWidth: 0.3,
        tipWidth: 0.02,
        height: 0.8
      })
    }
    
    return formation
  }, [])
  
  useFrame(() => {
    if (!groupRef.current || !visible) return
    
    const elapsed = Date.now() - startTime.current
    const formProgress = Math.min(elapsed / 500, 1) // Fast formation
    
    // Formation phase
    if (formProgress < 1) {
      // Grow the ice prison quickly
      groupRef.current.scale.set(formProgress, formProgress, formProgress)
      
      // Animate spike formation
      spikeRefs.current.forEach((ref, i) => {
        if (ref && iceFormation.spikes[i]) {
          const spike = iceFormation.spikes[i]
          ref.material.opacity = 0.85 * formProgress
          ref.material.emissiveIntensity = 0.5 * formProgress
        }
      })
      
      if (mainIceRef.current) {
        mainIceRef.current.material.opacity = 0.75 * formProgress
        mainIceRef.current.material.emissiveIntensity = 0.2 * formProgress
      }
      
      if (innerIceRef.current) {
        innerIceRef.current.material.opacity = 0.9 * formProgress
        innerIceRef.current.material.emissiveIntensity = 0.1 * formProgress
      }
      
      if (glowRef.current) {
        glowRef.current.material.opacity = 0.3 * formProgress
      }
    } else {
      // Frozen state - keep them trapped with subtle effects
      groupRef.current.scale.set(1, 1, 1)
      
      // Subtle pulsing/breathing while frozen
      const breathe = Math.sin(elapsed * 0.002) * 0.02
      groupRef.current.scale.set(1 + breathe, 1 + breathe, 1 + breathe)
      
      // Shimmer effect on ice
      spikeRefs.current.forEach((ref, i) => {
        if (ref) {
          ref.material.emissiveIntensity = 0.3 + Math.sin(elapsed * 0.005 + i) * 0.2
        }
      })
      
      if (mainIceRef.current) {
        mainIceRef.current.material.emissiveIntensity = 0.2 + Math.sin(elapsed * 0.003) * 0.1
      }
    }
    
    // The ice stays until the freeze effect ends (controlled by parent component)
    // No automatic shattering - it will be removed when onComplete is called
  })
  
  if (!visible) return null
  
  return (
    <group ref={groupRef} position={actualPosition}>
      {/* Ice crystal spikes forming the prison */}
      {iceFormation.spikes.map((spike, i) => (
        <mesh
          key={i}
          ref={el => spikeRefs.current[i] = el}
          position={spike.position}
          rotation={spike.rotation}
        >
          <coneGeometry args={[spike.baseWidth, spike.height, 6]} />
          <meshPhysicalMaterial
            color="#aaeeff"
            emissive="#00ccff"
            emissiveIntensity={0.3}
            transparent={true}
            opacity={0}
            roughness={0.05}
            metalness={0.2}
            clearcoat={1}
            clearcoatRoughness={0}
            transmission={0.7}
            thickness={0.3}
            ior={1.31}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
      
      {/* Main crystalline ice block */}
      <mesh ref={mainIceRef} position={[0, 0, 0]}>
        <boxGeometry args={[1.2, 2, 1.2]} />
        <meshPhysicalMaterial
          color="#ccf5ff"
          emissive="#00aaff"
          emissiveIntensity={0.2}
          transparent={true}
          opacity={0.75}
          roughness={0.05}
          metalness={0.1}
          clearcoat={1}
          clearcoatRoughness={0}
          transmission={0.9}
          thickness={1}
          ior={1.31}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Inner frozen character silhouette */}
      <mesh ref={innerIceRef} position={[0, 0, 0]}>
        <boxGeometry args={[0.8, 1.5, 0.8]} />
        <meshPhysicalMaterial
          color="#6699ff"
          emissive="#4477ff"
          emissiveIntensity={0.1}
          transparent={true}
          opacity={0.9}
          roughness={0.2}
          metalness={0}
        />
      </mesh>
      
      {/* Central frozen core glow */}
      <mesh ref={glowRef} position={[0, 0, 0]}>
        <sphereGeometry args={[0.7, 16, 16]} />
        <meshBasicMaterial
          color="#aaccff"
          transparent={true}
          opacity={0.3}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      
      {/* Top ice crystal */}
      <mesh position={[0, 1.2, 0]} rotation={[0, Math.PI / 6, 0]}>
        <coneGeometry args={[0.4, 0.8, 4]} />
        <meshPhysicalMaterial
          color="#eeffff"
          emissive="#aaddff"
          emissiveIntensity={0.3}
          transparent={true}
          opacity={0.8}
          roughness={0.05}
          metalness={0.2}
          clearcoat={1}
          transmission={0.8}
          thickness={0.5}
          ior={1.31}
        />
      </mesh>
      
      {/* Bottom ice crystal */}
      <mesh position={[0, -1.2, 0]} rotation={[Math.PI, Math.PI / 8, 0]}>
        <coneGeometry args={[0.4, 0.8, 4]} />
        <meshPhysicalMaterial
          color="#eeffff"
          emissive="#aaddff"
          emissiveIntensity={0.3}
          transparent={true}
          opacity={0.8}
          roughness={0.05}
          metalness={0.2}
          clearcoat={1}
          transmission={0.8}
          thickness={0.5}
          ior={1.31}
        />
      </mesh>
    </group>
  )
}

// Epic snowflake particles with swirling motion
const EpicSnowflakeParticles = () => {
  const particlesRef = useRef()
  const particleCount = 200
  const startTime = useRef(Date.now())
  
  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3)
    const vel = []
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3
      // Start particles in a cylinder around the scene
      const angle = (i / particleCount) * Math.PI * 2
      const radius = Math.random() * 15 + 5
      pos[i3] = Math.cos(angle) * radius
      pos[i3 + 1] = Math.random() * 15 - 7.5
      pos[i3 + 2] = Math.sin(angle) * radius
      
      vel.push({
        x: (Math.random() - 0.5) * 0.5,
        y: -Math.random() * 2 - 0.5,
        z: (Math.random() - 0.5) * 0.5,
        swirl: Math.random() * 0.02 - 0.01
      })
    }
    
    return [pos, vel]
  }, [])
  
  useFrame((state, delta) => {
    if (!particlesRef.current) return
    
    const elapsed = (Date.now() - startTime.current) / 1000
    const positions = particlesRef.current.geometry.attributes.position.array
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3
      const vel = velocities[i]
      
      // Add swirling motion
      const swirl = Math.sin(elapsed + i) * vel.swirl
      positions[i3] += (vel.x + swirl) * delta * 2
      positions[i3 + 1] += vel.y * delta * 2
      positions[i3 + 2] += (vel.z - swirl) * delta * 2
      
      // Reset if too low
      if (positions[i3 + 1] < -8) {
        positions[i3 + 1] = 8
        const angle = (i / particleCount) * Math.PI * 2 + elapsed
        const radius = Math.random() * 15 + 5
        positions[i3] = Math.cos(angle) * radius
        positions[i3 + 2] = Math.sin(angle) * radius
      }
    }
    
    particlesRef.current.geometry.attributes.position.needsUpdate = true
    particlesRef.current.rotation.y += 0.001
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
        size={0.15}
        color="#ffffff"
        transparent={true}
        opacity={0.9}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation={true}
      />
    </points>
  )
}

// Central ice nova explosion
const IceNovaCore = ({ position }) => {
  const coreRef = useRef()
  const glowRef = useRef()
  const startTime = useRef(Date.now())
  const [visible, setVisible] = useState(true)
  
  useFrame(() => {
    if (!visible) return
    
    const elapsed = Date.now() - startTime.current
    const progress = Math.min(elapsed / 1000, 1)
    
    if (coreRef.current) {
      // Expand and fade
      const scale = 1 + progress * 3
      coreRef.current.scale.set(scale, scale, scale)
      coreRef.current.material.opacity = (1 - progress) * 0.8
      coreRef.current.rotation.x += 0.05
      coreRef.current.rotation.y += 0.03
    }
    
    if (glowRef.current) {
      const glowScale = 1 + progress * 4
      glowRef.current.scale.set(glowScale, glowScale, glowScale)
      glowRef.current.material.opacity = (1 - progress) * 0.6
    }
    
    if (progress >= 1) {
      setVisible(false)
    }
  })
  
  if (!visible) return null
  
  return (
    <>
      {/* Core explosion */}
      <mesh ref={coreRef} position={position}>
        <icosahedronGeometry args={[0.5, 2]} />
        <meshStandardMaterial
          color="#00ffff"
          emissive="#00ffff"
          emissiveIntensity={10}
          transparent={true}
          opacity={0.8}
          depthWrite={false}
        />
      </mesh>
      
      {/* Outer glow */}
      <mesh ref={glowRef} position={position}>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshBasicMaterial
          color="#aaeeff"
          transparent={true}
          opacity={0.6}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </>
  )
}

// Main Ice Nova Scene
const EpicIceNovaScene = ({ sourcePos, targets }) => {
  const aspect = window.innerWidth / window.innerHeight
  const fovMultiplier = 10 // Increased for wider horizontal spread
  
  // Convert 2D positions to 3D
  const source3D = [
    ((sourcePos.x / window.innerWidth) - 0.5) * fovMultiplier * aspect,
    -((sourcePos.y / window.innerHeight) - 0.5) * fovMultiplier,
    0
  ]
  
  // Keep track of both positions and elements
  const targetsWithElements = targets.map(target => {
    // Use provided position or calculate from element
    let x = target.x
    let y = target.y
    
    // If element is provided but position is not accurate, recalculate
    if (target.element) {
      const rect = target.element.getBoundingClientRect()
      x = rect.left + rect.width / 2
      y = rect.top + rect.height / 2
    }
    
    return {
      position: [
        ((x / window.innerWidth) - 0.5) * fovMultiplier * aspect * 1.08, // Adjusted to center on characters
        -((y / window.innerHeight) - 0.5) * fovMultiplier,
        0
      ],
      element: target.element // Pass the DOM element reference
    }
  })
  
  return (
    <>
      {/* Enhanced lighting for epic effect */}
      <ambientLight intensity={0.8} color="#cceeff" />
      <pointLight position={source3D} intensity={5} color="#00ffff" distance={50} />
      <pointLight position={[0, 5, 5]} intensity={2} color="#ffffff" />
      <directionalLight position={[5, 5, 5]} intensity={1.5} color="#88ccff" />
      
      {/* Fog for atmosphere */}
      <fog attach="fog" args={['#001122', 15, 50]} />
      
      {/* Epic Effects */}
      <IceNovaCore position={source3D} />
      <EpicIceShockwave position={source3D} />
      <EpicFrostOverlay />
      
      {/* Ice Prisons for targets */}
      {targetsWithElements.map((target, idx) => (
        <EpicIcePrison 
          key={idx}
          position={target.position}
          targetElement={target.element}
          delay={50 + idx * 30}
        />
      ))}
      
      {/* Epic particles */}
      <EpicSnowflakeParticles />
    </>
  )
}

// Main Component
const EpicIceNovaEffect = ({ sourcePos, targets, onComplete }) => {
  console.log('🧊 EpicIceNovaEffect starting with:', { sourcePos, targets })
  
  useEffect(() => {
    // Complete after 3.5 seconds
    const timer = setTimeout(() => {
      console.log('🧊 EpicIceNovaEffect completing')
      if (onComplete) onComplete()
    }, 3500)
    
    return () => clearTimeout(timer)
  }, [onComplete])
  
  return (
    <>
      {/* Main 3D Ice Nova Effect */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 9999 }}>
        <Canvas
          camera={{ 
            position: [0, 0, 18], // Pulled camera back for wider view
            fov: 35 // Reduced FOV for less perspective distortion and more horizontal spread
          }}
          gl={{ 
            alpha: true,
            antialias: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.8,
            powerPreference: "high-performance"
          }}
        >
          <EpicIceNovaScene 
            sourcePos={sourcePos}
            targets={targets || []}
          />
        </Canvas>
      </div>
      
      {/* Frost Screen Overlay Effect */}
      <CSSFrostOverlay 
        duration={3500}
        onComplete={() => {
          // Frost effect completes with the main effect
        }}
      />
    </>
  )
}

export default EpicIceNovaEffect