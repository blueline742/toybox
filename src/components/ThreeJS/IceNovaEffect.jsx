import React, { useRef, useEffect, useState, useMemo } from 'react'
import ReactDOM from 'react-dom'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Box, Sphere, Ring, Plane } from '@react-three/drei'
import * as THREE from 'three'

// Three.js Frost Screen Overlay Component - 3 second frost effect
const FrostScreenOverlay = ({ intensity = 1 }) => {
  const meshRef = useRef()
  const materialRef = useRef()
  const { viewport } = useThree()
  const startTime = useRef(Date.now())
  
  // Create detailed frost texture
  const frostTexture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = 1024
    const ctx = canvas.getContext('2d')
    
    // Base frost gradient from edges
    const gradient = ctx.createRadialGradient(512, 512, 100, 512, 512, 700)
    gradient.addColorStop(0, 'rgba(220, 240, 255, 0.1)')
    gradient.addColorStop(0.3, 'rgba(180, 220, 255, 0.4)')
    gradient.addColorStop(0.6, 'rgba(150, 200, 255, 0.7)')
    gradient.addColorStop(1, 'rgba(100, 180, 255, 0.9)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 1024, 1024)
    
    // Add detailed ice crystal patterns
    for (let i = 0; i < 500; i++) {
      const x = Math.random() * 1024
      const y = Math.random() * 1024
      const size = Math.random() * 8 + 2
      
      // Draw snowflake-like crystals
      ctx.save()
      ctx.translate(x, y)
      ctx.strokeStyle = `rgba(255, 255, 255, ${Math.random() * 0.4 + 0.2})`
      ctx.lineWidth = Math.random() * 2 + 0.5
      
      // Draw 6-pointed star
      for (let j = 0; j < 6; j++) {
        ctx.rotate(Math.PI / 3)
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.lineTo(0, -size)
        ctx.stroke()
        
        // Add branches
        if (Math.random() > 0.5) {
          ctx.beginPath()
          ctx.moveTo(0, -size * 0.3)
          ctx.lineTo(-size * 0.2, -size * 0.4)
          ctx.moveTo(0, -size * 0.6)
          ctx.lineTo(size * 0.2, -size * 0.7)
          ctx.stroke()
        }
      }
      ctx.restore()
    }
    
    // Add frost edges
    const edgeGradient = ctx.createLinearGradient(0, 0, 1024, 1024)
    edgeGradient.addColorStop(0, 'rgba(200, 230, 255, 0.3)')
    edgeGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)')
    edgeGradient.addColorStop(1, 'rgba(200, 230, 255, 0.3)')
    ctx.fillStyle = edgeGradient
    ctx.fillRect(0, 0, 1024, 1024)
    
    const texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true
    return texture
  }, [])
  
  useFrame(() => {
    if (!meshRef.current || !materialRef.current) return
    
    const elapsed = Date.now() - startTime.current
    const totalDuration = 3000 // 3 seconds total
    
    // Phase 1: Frost spreads from edges (0-0.5 seconds)
    if (elapsed < 500) {
      const spreadProgress = elapsed / 500
      materialRef.current.opacity = spreadProgress * 0.85
      
      // Spread from edges to center
      const scale = 1 + (1 - spreadProgress) * 0.5
      meshRef.current.scale.set(scale, scale, 1)
    }
    // Phase 2: Full frost effect (0.5-2.5 seconds)
    else if (elapsed < 2500) {
      materialRef.current.opacity = 0.85
      
      // Shimmer and crystallize
      const shimmerTime = (elapsed - 500) / 2000
      materialRef.current.emissiveIntensity = 0.2 + Math.sin(shimmerTime * Math.PI * 4) * 0.1
      
      // Subtle breathing effect
      const breathe = Math.sin(elapsed * 0.001) * 0.02
      meshRef.current.scale.set(1 + breathe, 1 + breathe, 1)
    }
    // Phase 3: Slowly fade out (2.5-3 seconds)
    else if (elapsed < totalDuration) {
      const fadeProgress = (elapsed - 2500) / 500
      materialRef.current.opacity = 0.85 * (1 - fadeProgress)
    }
    else {
      materialRef.current.opacity = 0
    }
  })
  
  return (
    <mesh ref={meshRef} position={[0, 0, 8]} renderOrder={9999}>
      <planeGeometry args={[viewport.width * 1.2, viewport.height * 1.2, 32, 32]} />
      <meshPhysicalMaterial
        ref={materialRef}
        map={frostTexture}
        transparent
        opacity={0}
        side={THREE.DoubleSide}
        depthWrite={false}
        depthTest={false}
        emissive="#aaddff"
        emissiveIntensity={0.2}
        roughness={1}
        metalness={0}
      />
    </mesh>
  )
}

// Realistic Iceberg Prison that encases each target
const IcePrison = ({ position, delay = 0, targetSize = 1 }) => {
  const groupRef = useRef()
  const icebergRef = useRef()
  const innerCoreRef = useRef()
  const cracksRef = useRef()
  const startTime = useRef(Date.now() + delay)
  const [visible, setVisible] = useState(false)
  
  // Create realistic iceberg geometry with jagged edges
  const icebergGeometry = useMemo(() => {
    const geometry = new THREE.IcosahedronGeometry(targetSize * 1.2, 2)
    const positions = geometry.attributes.position.array
    
    // Distort vertices for natural iceberg look
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i]
      const y = positions[i + 1]
      const z = positions[i + 2]
      
      // Create vertical stretching for iceberg shape
      positions[i + 1] = y * (1 + Math.random() * 0.3)
      
      // Add noise for jagged surface
      const noise = (Math.random() - 0.5) * 0.15
      positions[i] += x * noise
      positions[i + 2] += z * noise
    }
    
    geometry.computeVertexNormals()
    return geometry
  }, [targetSize])
  
  // Create crack geometry
  const crackGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    const vertices = []
    
    // Generate random crack lines
    for (let i = 0; i < 8; i++) {
      const startAngle = Math.random() * Math.PI * 2
      const endAngle = startAngle + (Math.random() - 0.5) * Math.PI
      const startRadius = targetSize * 0.3
      const endRadius = targetSize * 1.1
      
      // Main crack line
      vertices.push(
        Math.cos(startAngle) * startRadius, Math.random() * targetSize - targetSize/2, Math.sin(startAngle) * startRadius,
        Math.cos(endAngle) * endRadius, Math.random() * targetSize, Math.sin(endAngle) * endRadius
      )
      
      // Branch cracks
      if (Math.random() > 0.5) {
        const midAngle = (startAngle + endAngle) / 2 + (Math.random() - 0.5) * 0.5
        const midRadius = (startRadius + endRadius) / 2
        vertices.push(
          Math.cos(midAngle) * midRadius, 0, Math.sin(midAngle) * midRadius,
          Math.cos(midAngle + 0.3) * endRadius * 0.8, targetSize * 0.3, Math.sin(midAngle + 0.3) * endRadius * 0.8
        )
      }
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    return geometry
  }, [targetSize])
  
  useFrame((state) => {
    if (!groupRef.current) return
    
    const elapsed = Date.now() - startTime.current
    
    if (elapsed >= 0 && !visible) {
      setVisible(true)
    }
    
    if (elapsed >= 0 && elapsed < 3000) { // 3 second duration to match spell
      const progress = elapsed / 3000
      
      // Phase 1: Rapid formation (0-0.3 seconds)
      if (progress < 0.1) {
        const formProgress = progress / 0.1
        const scale = formProgress
        groupRef.current.scale.set(scale, scale * 1.5, scale) // Taller than wide
        
        if (icebergRef.current) {
          icebergRef.current.material.opacity = formProgress * 0.95
        }
        if (innerCoreRef.current) {
          innerCoreRef.current.material.opacity = formProgress * 0.7
        }
      }
      // Phase 2: Crystallization (0.3-1 second)
      else if (progress < 0.33) {
        groupRef.current.scale.set(1, 1.5, 1)
        
        // Add crystallization shimmer
        if (icebergRef.current) {
          const crystalProgress = (progress - 0.1) / 0.2
          icebergRef.current.material.emissiveIntensity = 0.3 + Math.sin(crystalProgress * Math.PI * 4) * 0.2
        }
        
        // Show cracks forming
        if (cracksRef.current && progress > 0.15) {
          cracksRef.current.material.opacity = (progress - 0.15) / 0.15 * 0.6
        }
      }
      // Phase 3: Stable frozen state (1-2.5 seconds)
      else if (progress < 0.83) {
        // Subtle movement and refraction changes
        const stableTime = (progress - 0.3) / 0.5
        
        if (innerCoreRef.current) {
          innerCoreRef.current.rotation.y = Math.sin(elapsed * 0.0005) * 0.1
          innerCoreRef.current.material.ior = 1.33 + Math.sin(stableTime * Math.PI * 2) * 0.1
        }
        
        if (icebergRef.current) {
          icebergRef.current.material.emissiveIntensity = 0.2 + Math.sin(elapsed * 0.001) * 0.1
        }
        
        // Pulsing cracks
        if (cracksRef.current) {
          cracksRef.current.material.emissiveIntensity = 0.5 + Math.sin(elapsed * 0.003) * 0.3
        }
      }
      // Phase 4: Melting (2.5-3 seconds)
      else {
        const meltProgress = (progress - 0.83) / 0.17
        
        if (icebergRef.current) {
          icebergRef.current.material.opacity = 0.95 * (1 - meltProgress)
          // Iceberg starts to crack and fall apart
          icebergRef.current.scale.set(
            1 + meltProgress * 0.2,
            1 - meltProgress * 0.3,
            1 + meltProgress * 0.2
          )
        }
        if (innerCoreRef.current) {
          innerCoreRef.current.material.opacity = 0.7 * (1 - meltProgress)
        }
        if (cracksRef.current) {
          cracksRef.current.material.opacity = 0.6 * (1 - meltProgress * 0.5)
        }
        
        // Dripping effect
        groupRef.current.position.y = position[1] - meltProgress * 0.3
      }
    } else if (elapsed >= 3000) {
      setVisible(false)
    }
  })
  
  if (!visible) return null
  
  return (
    <group ref={groupRef} position={position}>
      {/* Main iceberg body */}
      <mesh ref={icebergRef} geometry={icebergGeometry}>
        <meshPhysicalMaterial
          color="#b3e5fc"
          transparent
          opacity={0}
          metalness={0.1}
          roughness={0.2}
          transmission={0.9}
          thickness={2}
          envMapIntensity={1}
          clearcoat={1}
          clearcoatRoughness={0.05}
          ior={1.33}
          side={THREE.DoubleSide}
          emissive="#4fc3f7"
          emissiveIntensity={0.2}
        />
      </mesh>
      
      {/* Inner frozen core */}
      <mesh ref={innerCoreRef} scale={0.6}>
        <dodecahedronGeometry args={[targetSize * 0.8, 0]} />
        <meshPhysicalMaterial
          color="#ffffff"
          transparent
          opacity={0}
          metalness={0}
          roughness={0}
          transmission={1}
          thickness={0.5}
          ior={1.45}
          emissive="#e1f5fe"
          emissiveIntensity={0.3}
        />
      </mesh>
      
      {/* Crack lines */}
      <lineSegments ref={cracksRef} geometry={crackGeometry}>
        <lineBasicMaterial
          color="#0288d1"
          transparent
          opacity={0}
          linewidth={2}
          emissive="#01579b"
          emissiveIntensity={0.5}
        />
      </lineSegments>
      
      {/* Icicles hanging down */}
      {[0, 1, 2, 3, 4].map((i) => {
        const angle = (i / 5) * Math.PI * 2
        const radius = targetSize * 0.7
        return (
          <mesh
            key={`icicle-${i}`}
            position={[
              Math.cos(angle) * radius,
              -targetSize * 0.8,
              Math.sin(angle) * radius
            ]}
            rotation={[Math.PI, 0, angle]}
          >
            <coneGeometry args={[targetSize * 0.08, targetSize * 0.5 + Math.random() * 0.3, 6]} />
            <meshPhysicalMaterial
              color="#e3f2fd"
              transparent
              opacity={0.9}
              metalness={0.1}
              roughness={0.1}
              transmission={0.8}
              thickness={0.5}
              ior={1.33}
              emissive="#bbdefb"
              emissiveIntensity={0.1}
            />
          </mesh>
        )
      })}
      
      {/* Frozen mist particles around the iceberg */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={50}
            array={new Float32Array(
              Array.from({ length: 150 }, () => 
                (Math.random() - 0.5) * targetSize * 3
              )
            )}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.05}
          color="#ffffff"
          transparent
          opacity={0.4}
          sizeAttenuation={true}
        />
      </points>
    </group>
  )
}

// Snow and Ice Particle System
const SnowParticleSystem = ({ count = 200, sourcePos }) => {
  const particlesRef = useRef()
  const startTime = useRef(Date.now())
  
  // Initialize particle data
  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const velocities = []
    const lifetimes = []
    
    for (let i = 0; i < count; i++) {
      // Start particles in a sphere around source
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI
      const radius = Math.random() * 0.5
      
      positions[i * 3] = sourcePos[0] + Math.sin(phi) * Math.cos(theta) * radius
      positions[i * 3 + 1] = sourcePos[1] + Math.cos(phi) * radius
      positions[i * 3 + 2] = sourcePos[2] + Math.sin(phi) * Math.sin(theta) * radius
      
      // Outward and upward velocity
      velocities.push({
        x: (Math.random() - 0.5) * 4 + Math.sin(theta) * 2,
        y: Math.random() * 3 + 1,
        z: (Math.random() - 0.5) * 4 + Math.cos(theta) * 2
      })
      
      lifetimes.push(Math.random() * 2000 + 1000) // 1-3 seconds
    }
    
    return { positions, velocities, lifetimes }
  }, [count, sourcePos])
  
  useFrame((state, delta) => {
    if (!particlesRef.current) return
    
    const elapsed = Date.now() - startTime.current
    const positions = particlesRef.current.geometry.attributes.position.array
    const { velocities, lifetimes } = particles
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      const lifetime = lifetimes[i]
      const age = elapsed % lifetime
      const lifeProgress = age / lifetime
      
      if (lifeProgress < 1) {
        // Update position
        positions[i3] += velocities[i].x * delta * (1 - lifeProgress * 0.5)
        positions[i3 + 1] += velocities[i].y * delta * (1 - lifeProgress * 0.7)
        positions[i3 + 2] += velocities[i].z * delta * (1 - lifeProgress * 0.5)
        
        // Apply gravity and air resistance
        velocities[i].y -= 2 * delta
        velocities[i].x *= 0.99
        velocities[i].z *= 0.99
        
        // Swirling motion
        const swirl = Math.sin(elapsed * 0.001 + i) * 0.5
        positions[i3] += swirl * delta
        positions[i3 + 2] += Math.cos(elapsed * 0.001 + i) * 0.5 * delta
      } else {
        // Reset particle
        const theta = Math.random() * Math.PI * 2
        positions[i3] = sourcePos[0] + Math.cos(theta) * 0.5
        positions[i3 + 1] = sourcePos[1]
        positions[i3 + 2] = sourcePos[2] + Math.sin(theta) * 0.5
        
        velocities[i].x = (Math.random() - 0.5) * 4 + Math.sin(theta) * 2
        velocities[i].y = Math.random() * 3 + 1
        velocities[i].z = (Math.random() - 0.5) * 4 + Math.cos(theta) * 2
      }
    }
    
    particlesRef.current.geometry.attributes.position.needsUpdate = true
    
    // Fade out over time
    const fadeProgress = Math.min(elapsed / 3000, 1)
    if (fadeProgress < 1) {
      particlesRef.current.material.opacity = 0.8 * (1 - fadeProgress * 0.5)
    }
  })
  
  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={particles.positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.2}
        color="#ffffff"
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation={true}
        vertexColors={false}
        fog={false}
      />
    </points>
  )
}

// Ice Shatter Particles
const IceShatterParticles = ({ position, count = 30, delay = 0 }) => {
  const groupRef = useRef()
  const startTime = useRef(Date.now() + delay)
  const [visible, setVisible] = useState(false)
  
  const shards = useMemo(() => {
    const result = []
    for (let i = 0; i < count; i++) {
      result.push({
        id: i,
        velocity: {
          x: (Math.random() - 0.5) * 10,
          y: Math.random() * 8 + 2,
          z: (Math.random() - 0.5) * 10
        },
        rotation: {
          x: Math.random() * Math.PI * 2,
          y: Math.random() * Math.PI * 2,
          z: Math.random() * Math.PI * 2
        },
        rotationSpeed: {
          x: (Math.random() - 0.5) * 10,
          y: (Math.random() - 0.5) * 10,
          z: (Math.random() - 0.5) * 10
        },
        scale: Math.random() * 0.3 + 0.1
      })
    }
    return result
  }, [count])
  
  useFrame((state, delta) => {
    if (!groupRef.current) return
    
    const elapsed = Date.now() - startTime.current
    
    if (elapsed >= 0 && !visible) {
      setVisible(true)
    }
    
    if (elapsed >= 0 && elapsed < 2000) {
      const progress = elapsed / 2000
      
      groupRef.current.children.forEach((child, i) => {
        const shard = shards[i]
        if (!shard) return
        
        // Update position
        child.position.x += shard.velocity.x * delta
        child.position.y += shard.velocity.y * delta
        child.position.z += shard.velocity.z * delta
        
        // Apply gravity
        shard.velocity.y -= 15 * delta
        
        // Update rotation
        child.rotation.x += shard.rotationSpeed.x * delta
        child.rotation.y += shard.rotationSpeed.y * delta
        child.rotation.z += shard.rotationSpeed.z * delta
        
        // Fade out
        if (progress > 0.5) {
          const fadeProgress = (progress - 0.5) * 2
          child.scale.setScalar(shard.scale * (1 - fadeProgress))
          if (child.material) {
            child.material.opacity = 0.9 * (1 - fadeProgress)
          }
        }
      })
    } else if (elapsed >= 2000) {
      setVisible(false)
    }
  })
  
  if (!visible) return null
  
  return (
    <group ref={groupRef} position={position}>
      {shards.map((shard) => (
        <mesh key={shard.id} scale={shard.scale} rotation={[shard.rotation.x, shard.rotation.y, shard.rotation.z]}>
          <tetrahedronGeometry args={[1, 0]} />
          <meshPhysicalMaterial
            color="#ccf2ff"
            transparent
            opacity={0.9}
            metalness={0.3}
            roughness={0.1}
            emissive="#88ccff"
            emissiveIntensity={0.5}
          />
        </mesh>
      ))}
    </group>
  )
}

// Central Nova Explosion Wave
const NovaWave = ({ sourcePos }) => {
  const ringRef = useRef()
  const ring2Ref = useRef()
  const ring3Ref = useRef()
  const startTime = useRef(Date.now())
  
  useFrame(() => {
    const elapsed = Date.now() - startTime.current
    const progress = Math.min(elapsed / 2000, 1)
    
    // First wave
    if (ringRef.current) {
      const scale = 0.1 + progress * 15
      ringRef.current.scale.x = scale
      ringRef.current.scale.y = scale
      ringRef.current.material.opacity = Math.max(0, (1 - progress) * 0.6)
      ringRef.current.rotation.z += 0.02
    }
    
    // Second wave (delayed)
    if (ring2Ref.current && progress > 0.1) {
      const progress2 = (progress - 0.1) / 0.9
      const scale2 = 0.1 + progress2 * 12
      ring2Ref.current.scale.x = scale2
      ring2Ref.current.scale.y = scale2
      ring2Ref.current.material.opacity = Math.max(0, (1 - progress2) * 0.4)
      ring2Ref.current.rotation.z -= 0.015
    }
    
    // Third wave (more delayed)
    if (ring3Ref.current && progress > 0.2) {
      const progress3 = (progress - 0.2) / 0.8
      const scale3 = 0.1 + progress3 * 10
      ring3Ref.current.scale.x = scale3
      ring3Ref.current.scale.y = scale3
      ring3Ref.current.material.opacity = Math.max(0, (1 - progress3) * 0.3)
      ring3Ref.current.rotation.z += 0.01
    }
  })
  
  return (
    <group position={sourcePos}>
      {/* Primary wave - horizontal spread */}
      <mesh ref={ringRef} rotation={[0, 0, 0]}>
        <ringGeometry args={[0.8, 1, 64, 1]} />
        <meshBasicMaterial
          color="#00ddff"
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Secondary wave - horizontal spread */}
      <mesh ref={ring2Ref} rotation={[0, 0, Math.PI / 8]}>
        <ringGeometry args={[0.6, 1.2, 48, 1]} />
        <meshBasicMaterial
          color="#88eeff"
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Tertiary wave - horizontal spread */}
      <mesh ref={ring3Ref} rotation={[0, 0, -Math.PI / 8]}>
        <ringGeometry args={[0.4, 1.4, 32, 1]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  )
}

// Portal wrapper for rendering outside any containers
const IceNovaPortal = ({ children }) => {
  const [portalRoot] = useState(() => {
    const div = document.createElement('div')
    div.style.position = 'fixed'
    div.style.top = '0'
    div.style.left = '0'
    div.style.width = '100vw'
    div.style.height = '100vh'
    div.style.pointerEvents = 'none'
    div.style.zIndex = '99999'
    return div
  })
  
  useEffect(() => {
    document.body.appendChild(portalRoot)
    return () => {
      document.body.removeChild(portalRoot)
    }
  }, [portalRoot])
  
  return ReactDOM.createPortal(children, portalRoot)
}

// Main Ice Nova Effect Component
const IceNovaEffect = ({ sourcePos, targets, onComplete }) => {
  const [icePrisons, setIcePrisons] = useState([])
  
  // Convert 2D positions to 3D
  const aspect = window.innerWidth / window.innerHeight
  const fovMultiplier = 8
  
  const source3D = [
    ((sourcePos.x / window.innerWidth) - 0.5) * fovMultiplier * aspect,
    -((sourcePos.y / window.innerHeight) - 0.5) * fovMultiplier,
    0
  ]
  
  const targets3D = targets.map(target => ({
    position: [
      ((target.x / window.innerWidth) - 0.5) * fovMultiplier * aspect,
      -((target.y / window.innerHeight) - 0.5) * fovMultiplier,
      0
    ],
    size: 1.2
  }))
  
  useEffect(() => {
    // Create ice prisons for each target
    const prisons = targets3D.map((target, idx) => ({
      id: idx,
      position: target.position,
      delay: 100 + idx * 50, // Stagger the freezing
      size: target.size
    }))
    setIcePrisons(prisons)
    
    // Complete after animation (3 seconds for full effect to match other spells)
    setTimeout(() => {
      onComplete && onComplete()
    }, 3000)
  }, [])
  
  return (
    <IceNovaPortal>
      {/* Three.js Ice Nova Scene */}
      <Canvas
        style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          pointerEvents: 'none'
        }}
        camera={{ 
          position: [0, 0, 10],
          fov: 50,
          near: 0.1,
          far: 100
        }}
        gl={{ 
          alpha: true,
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.5,
          powerPreference: "high-performance"
        }}
        dpr={[1, 2]}
      >
          {/* Environment and Lighting */}
          <ambientLight intensity={0.3} color="#88ccff" />
          <pointLight position={source3D} intensity={4} color="#00aaff" distance={20} />
          <pointLight position={[0, 5, 5]} intensity={1} color="#ffffff" />
          
          {/* Frost Screen Overlay */}
          <FrostScreenOverlay intensity={1} />
          
          {/* Nova Explosion Waves */}
          <NovaWave sourcePos={source3D} />
          
          {/* Ice Prisons for each target */}
          {icePrisons.map(prison => (
            <IcePrison
              key={prison.id}
              position={prison.position}
              delay={prison.delay}
              targetSize={prison.size}
            />
          ))}
          
          {/* Ice Shatter Particles at targets */}
          {targets3D.map((target, idx) => (
            <IceShatterParticles
              key={`shatter-${idx}`}
              position={target.position}
              count={20}
              delay={500 + idx * 50}
            />
          ))}
          
          {/* Snow Particle System */}
          <SnowParticleSystem count={250} sourcePos={source3D} />
          
          {/* Volumetric Fog for atmosphere */}
          <fog attach="fog" args={['#001122', 5, 25]} />
        </Canvas>
    </IceNovaPortal>
  )
}

export default IceNovaEffect