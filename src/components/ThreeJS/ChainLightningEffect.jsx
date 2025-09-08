import React, { useRef, useEffect, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Line, Sphere } from '@react-three/drei'
import * as THREE from 'three'

// Lightning Bolt Component - Creates forked lightning between two points
const LightningBolt = ({ start, end, intensity = 1, delay = 0, onStrike }) => {
  const boltRef = useRef()
  const [boltPoints, setBoltPoints] = useState([])
  const [visible, setVisible] = useState(false)
  const startTime = useRef(Date.now() + delay)
  const strikeTriggered = useRef(false)
  
  // Generate forked lightning path
  useEffect(() => {
    const generateLightningPath = () => {
      const points = []
      const segments = 8 + Math.floor(Math.random() * 4) // 8-12 segments
      
      for (let i = 0; i <= segments; i++) {
        const t = i / segments
        
        // Linear interpolation with random offset for jagged effect
        let x = start[0] + (end[0] - start[0]) * t
        let y = start[1] + (end[1] - start[1]) * t
        let z = start[2] + (end[2] - start[2]) * t
        
        // Add random displacement except at start and end
        if (i !== 0 && i !== segments) {
          const offset = 0.3 * intensity
          x += (Math.random() - 0.5) * offset
          y += (Math.random() - 0.5) * offset
          z += (Math.random() - 0.5) * offset * 0.5
        }
        
        points.push(new THREE.Vector3(x, y, z))
      }
      
      // Add secondary fork branches
      const forkPoints = []
      for (let i = 2; i < segments - 2; i += 3) {
        if (Math.random() > 0.5) { // 50% chance of fork
          const mainPoint = points[i]
          const forkEnd = new THREE.Vector3(
            mainPoint.x + (Math.random() - 0.5) * intensity,
            mainPoint.y + (Math.random() - 0.5) * intensity,
            mainPoint.z + (Math.random() - 0.5) * intensity * 0.3
          )
          forkPoints.push([mainPoint, forkEnd])
        }
      }
      
      return { main: points, forks: forkPoints }
    }
    
    const paths = generateLightningPath()
    setBoltPoints(paths)
    
    // Regenerate lightning path every 100ms for flickering effect
    const interval = setInterval(() => {
      const newPaths = generateLightningPath()
      setBoltPoints(newPaths)
    }, 100)
    
    return () => clearInterval(interval)
  }, [start, end, intensity])
  
  useFrame(() => {
    const elapsed = Date.now() - startTime.current
    
    if (elapsed >= 0 && elapsed < 800) {
      setVisible(true)
      
      // Trigger strike callback at the right moment
      if (!strikeTriggered.current && elapsed > 100 && onStrike) {
        onStrike()
        strikeTriggered.current = true
      }
      
      // Fade out towards the end
      if (boltRef.current) {
        const opacity = elapsed > 600 ? Math.max(0, 1 - (elapsed - 600) / 200) : 1
        boltRef.current.material.opacity = opacity * intensity
      }
    } else if (elapsed >= 800) {
      setVisible(false)
    }
  })
  
  if (!visible || boltPoints.main?.length === 0) return null
  
  return (
    <>
      {/* Main lightning bolt */}
      <Line
        ref={boltRef}
        points={boltPoints.main}
        color="#00ffff"
        lineWidth={3 * intensity}
        transparent
        opacity={intensity}
      >
        <lineBasicMaterial 
          color="#00ffff"
          transparent
          opacity={intensity}
          blending={THREE.AdditiveBlending}
        />
      </Line>
      
      {/* Glow effect - secondary line */}
      <Line
        points={boltPoints.main}
        color="#ffffff"
        lineWidth={1.5 * intensity}
        transparent
        opacity={0.8 * intensity}
      >
        <lineBasicMaterial 
          color="#ffffff"
          transparent
          opacity={0.8 * intensity}
          blending={THREE.AdditiveBlending}
        />
      </Line>
      
      {/* Fork branches */}
      {boltPoints.forks?.map((fork, idx) => (
        <Line
          key={idx}
          points={fork}
          color="#00aaff"
          lineWidth={1.5 * intensity}
          transparent
          opacity={0.6 * intensity}
        >
          <lineBasicMaterial 
            color="#00aaff"
            transparent
            opacity={0.6 * intensity}
            blending={THREE.AdditiveBlending}
          />
        </Line>
      ))}
    </>
  )
}

// Electric Orb at impact points
const ElectricOrb = ({ position, delay = 0 }) => {
  const orbRef = useRef()
  const innerOrbRef = useRef()
  const startTime = useRef(Date.now() + delay)
  const [visible, setVisible] = useState(false)
  
  useFrame(() => {
    const elapsed = Date.now() - startTime.current
    
    if (elapsed >= 0 && elapsed < 1000) {
      setVisible(true)
      
      if (orbRef.current) {
        // Pulsing effect
        const scale = 1 + Math.sin(elapsed * 0.01) * 0.3
        orbRef.current.scale.setScalar(scale)
        
        // Rotation
        orbRef.current.rotation.x += 0.05
        orbRef.current.rotation.y += 0.03
        
        // Fade out
        if (elapsed > 700) {
          orbRef.current.material.opacity = Math.max(0, 1 - (elapsed - 700) / 300)
        }
      }
      
      if (innerOrbRef.current) {
        innerOrbRef.current.rotation.x -= 0.08
        innerOrbRef.current.rotation.y -= 0.06
      }
    } else if (elapsed >= 1000) {
      setVisible(false)
    }
  })
  
  if (!visible) return null
  
  return (
    <group position={position}>
      {/* Outer electric sphere */}
      <Sphere ref={orbRef} args={[0.5, 16, 16]}>
        <meshBasicMaterial
          color="#00ffff"
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
          wireframe
        />
      </Sphere>
      
      {/* Inner bright core */}
      <Sphere ref={innerOrbRef} args={[0.3, 12, 12]}>
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
        />
      </Sphere>
      
      {/* Electric particles */}
      <ElectricParticles />
    </group>
  )
}

// Electric Particles around impact points
const ElectricParticles = () => {
  const particlesRef = useRef()
  const particleCount = 20
  
  useFrame((state, delta) => {
    if (!particlesRef.current) return
    
    const positions = particlesRef.current.geometry.attributes.position.array
    const time = Date.now() * 0.001
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3
      const angle = (i / particleCount) * Math.PI * 2 + time
      const radius = 1 + Math.sin(time * 3 + i) * 0.5
      
      positions[i3] = Math.cos(angle) * radius
      positions[i3 + 1] = Math.sin(angle) * radius
      positions[i3 + 2] = Math.sin(time * 5 + i) * 0.3
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
        size={0.1}
        color="#00ffff"
        blending={THREE.AdditiveBlending}
        transparent
        opacity={1}
        depthWrite={false}
      />
    </points>
  )
}

// Screen Flash Effect Component
const ScreenFlash = ({ trigger }) => {
  const [flashing, setFlashing] = useState(false)
  
  useEffect(() => {
    if (trigger) {
      setFlashing(true)
      setTimeout(() => setFlashing(false), 600) // Doubled from 300ms to 600ms
    }
  }, [trigger])
  
  if (!flashing) return null
  
  return (
    <div 
      className="fixed inset-0 pointer-events-none"
      style={{
        backgroundColor: '#001155',
        opacity: 0.6,
        animation: 'lightningFlash 0.6s ease-out', // Doubled from 0.3s to 0.6s
        zIndex: 9998,
        mixBlendMode: 'screen'
      }}
    />
  )
}

// Main Chain Lightning Effect Component
const ChainLightningEffect = ({ sourcePos, targets, onComplete }) => {
  const [flashTrigger, setFlashTrigger] = useState(0)
  const [currentStrikes, setCurrentStrikes] = useState([])
  
  // Convert pixel positions to 3D coordinates
  const aspect = window.innerWidth / window.innerHeight
  const fovMultiplier = 8
  
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
  
  useEffect(() => {
    // Create chain effect
    const strikes = []
    let prevPos = source3D
    
    targets3D.forEach((target, index) => {
      strikes.push({
        id: index,
        start: prevPos,
        end: target,
        delay: index * 150, // Chain delay between targets
        intensity: 1 - (index * 0.15) // Slightly weaker for each jump
      })
      prevPos = target
    })
    
    setCurrentStrikes(strikes)
    
    // Trigger completion after all strikes
    const totalDuration = (targets3D.length * 150) + 1000
    setTimeout(() => {
      onComplete && onComplete()
    }, totalDuration)
  }, [])
  
  const handleStrike = () => {
    setFlashTrigger(prev => prev + 1)
  }
  
  return (
    <>
      {/* Screen Flash Effect */}
      <ScreenFlash trigger={flashTrigger} />
      
      {/* Three.js Lightning Canvas */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 9999 }}>
        <Canvas
          camera={{ 
            position: [0, 0, 10],
            fov: 50
          }}
          gl={{ 
            alpha: true,
            antialias: true
          }}
        >
          {/* Ambient light for visibility */}
          <ambientLight intensity={0.3} />
          
          {/* Point lights at strike locations */}
          {targets3D.map((pos, idx) => (
            <pointLight
              key={idx}
              position={pos}
              color="#00ffff"
              intensity={2}
              distance={5}
            />
          ))}
          
          {/* Lightning Bolts - Chain between targets */}
          {currentStrikes.map((strike) => (
            <LightningBolt
              key={strike.id}
              start={strike.start}
              end={strike.end}
              intensity={strike.intensity}
              delay={strike.delay}
              onStrike={strike.delay === 0 ? handleStrike : null}
            />
          ))}
          
          {/* Electric Orbs at impact points */}
          {targets3D.map((pos, idx) => (
            <ElectricOrb
              key={idx}
              position={pos}
              delay={idx * 150 + 100}
            />
          ))}
        </Canvas>
      </div>
      
      {/* CSS Lightning flash animation */}
      <style jsx>{`
        @keyframes lightningFlash {
          0% { opacity: 0; }
          50% { opacity: 0.6; }
          100% { opacity: 0; }
        }
      `}</style>
    </>
  )
}

export default ChainLightningEffect