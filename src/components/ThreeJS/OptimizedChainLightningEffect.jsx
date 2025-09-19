import React, { useRef, useEffect, useMemo } from 'react'
import ReactDOM from 'react-dom'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

// Optimized Lightning Bolt using instanced mesh for performance
const LightningBoltSystem = ({ casterPosition, targets, onComplete }) => {
  const meshRef = useRef()
  const glowMeshRef = useRef()
  const startTime = useRef(Date.now())
  const lightningPaths = useRef([])
  const { scene } = useThree()

  // Generate zigzag lightning paths
  const generateLightningPath = (start, end) => {
    const points = []
    const segments = 12 // More segments for detailed zigzag

    for (let i = 0; i <= segments; i++) {
      const t = i / segments

      // Linear interpolation with zigzag offset
      let x = start[0] + (end[0] - start[0]) * t
      let y = start[1] + (end[1] - start[1]) * t
      let z = start[2] + (end[2] - start[2]) * t

      // Add zigzag displacement except at start and end
      if (i !== 0 && i !== segments) {
        const offset = 0.4
        // Create controlled zigzag pattern
        const zigzagAmount = Math.sin(i * 1.5) * offset
        x += zigzagAmount
        y += Math.cos(i * 2) * offset * 0.5
        z += Math.sin(i) * offset * 0.3
      }

      points.push(new THREE.Vector3(x, y, z))
    }

    return points
  }

  // Create lightning geometry
  useEffect(() => {
    const paths = []
    let prevPos = casterPosition

    // Generate chain paths between targets
    targets.forEach((target, index) => {
      const path = generateLightningPath(prevPos, target.position)
      paths.push({
        points: path,
        delay: index * 150, // Chain delay
        intensity: 1 - (index * 0.15)
      })
      prevPos = target.position
    })

    lightningPaths.current = paths

    // Complete after all bolts
    const totalDuration = (targets.length * 150) + 1500
    const timer = setTimeout(() => {
      onComplete && onComplete()
    }, totalDuration)

    return () => clearTimeout(timer)
  }, [casterPosition, targets, onComplete])

  // Create geometry for all bolts
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const maxPoints = 13 * targets.length // 13 points per bolt
    const positions = new Float32Array(maxPoints * 3)
    const colors = new Float32Array(maxPoints * 3)

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    return geo
  }, [targets.length])

  useFrame(() => {
    if (!meshRef.current || !glowMeshRef.current) return

    const elapsed = Date.now() - startTime.current
    const positions = meshRef.current.geometry.attributes.position.array
    const colors = meshRef.current.geometry.attributes.color.array

    let pointIndex = 0

    lightningPaths.current.forEach((path, pathIndex) => {
      const pathElapsed = elapsed - path.delay

      if (pathElapsed >= 0 && pathElapsed < 800) {
        // Path is active
        const opacity = pathElapsed > 600 ? Math.max(0, 1 - (pathElapsed - 600) / 200) : 1

        path.points.forEach((point, i) => {
          const idx = pointIndex * 3

          // Update position with small random shake for electric effect
          positions[idx] = point.x + (Math.random() - 0.5) * 0.05
          positions[idx + 1] = point.y + (Math.random() - 0.5) * 0.05
          positions[idx + 2] = point.z

          // Electric blue-white color
          const brightness = Math.random() * 0.3 + 0.7
          colors[idx] = 0.5 * brightness * opacity // R
          colors[idx + 1] = 0.8 * brightness * opacity // G
          colors[idx + 2] = 1.0 * brightness * opacity // B

          pointIndex++
        })
      } else {
        // Path not active, hide points
        path.points.forEach(() => {
          const idx = pointIndex * 3
          positions[idx] = 0
          positions[idx + 1] = -1000 // Hide below scene
          positions[idx + 2] = 0
          colors[idx] = 0
          colors[idx + 1] = 0
          colors[idx + 2] = 0
          pointIndex++
        })
      }
    })

    meshRef.current.geometry.attributes.position.needsUpdate = true
    meshRef.current.geometry.attributes.color.needsUpdate = true

    // Copy to glow mesh
    if (glowMeshRef.current) {
      glowMeshRef.current.geometry.attributes.position.needsUpdate = true
    }
  })

  return (
    <>
      {/* Main lightning bolts */}
      <lineSegments ref={meshRef} geometry={geometry}>
        <lineBasicMaterial
          vertexColors
          linewidth={3}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>

      {/* Glow effect */}
      <lineSegments ref={glowMeshRef} geometry={geometry}>
        <lineBasicMaterial
          color="#ffffff"
          linewidth={8}
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>
    </>
  )
}

// Electric impact effect at each target
const ElectricImpact = ({ position, delay }) => {
  const groupRef = useRef()
  const particlesRef = useRef()
  const startTime = useRef(Date.now() + delay)
  const particleCount = 30

  // Create particle positions
  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3)
    const vel = []

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2
      const radius = Math.random() * 0.5

      pos[i * 3] = Math.cos(angle) * radius
      pos[i * 3 + 1] = Math.sin(angle) * radius
      pos[i * 3 + 2] = 0

      // Store velocities for outward burst
      vel.push({
        x: Math.cos(angle) * (Math.random() * 0.1 + 0.05),
        y: Math.sin(angle) * (Math.random() * 0.1 + 0.05),
        z: (Math.random() - 0.5) * 0.05
      })
    }

    return [pos, vel]
  }, [particleCount])

  useFrame(() => {
    if (!particlesRef.current || !groupRef.current) return

    const elapsed = Date.now() - startTime.current

    if (elapsed >= 0 && elapsed < 1000) {
      groupRef.current.visible = true

      const positions = particlesRef.current.geometry.attributes.position.array
      const t = elapsed / 1000

      // Update particle positions - burst outward
      for (let i = 0; i < particleCount; i++) {
        const idx = i * 3
        positions[idx] += velocities[i].x * t
        positions[idx + 1] += velocities[i].y * t
        positions[idx + 2] += velocities[i].z * t
      }

      particlesRef.current.geometry.attributes.position.needsUpdate = true

      // Scale and fade
      const scale = 1 + t * 2
      groupRef.current.scale.setScalar(scale)
      particlesRef.current.material.opacity = Math.max(0, 1 - t)

      // Rotate for electric feel
      groupRef.current.rotation.z += 0.1
    } else {
      groupRef.current.visible = false
    }
  })

  return (
    <group ref={groupRef} position={position}>
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
          color="#00aaff"
          blending={THREE.AdditiveBlending}
          transparent
          opacity={1}
          depthWrite={false}
        />
      </points>

      {/* Electric ring burst */}
      <mesh>
        <ringGeometry args={[0.8, 1.2, 32]} />
        <meshBasicMaterial
          color="#00ffff"
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}


// Main optimized component
const OptimizedChainLightningEffect = ({ casterPosition, targets, onComplete }) => {
  React.useEffect(() => {
    // Trigger screen flash
    const flashEvent = new CustomEvent('chainLightningFlash')
    window.dispatchEvent(flashEvent)

    // Play thunder sound if available (commented out to avoid 404)
    // const audio = new Audio('/sounds/thunder.mp3')
    // audio.volume = 0.3
    // audio.play().catch(() => {})
  }, [])

  // Mount the screen flash component to document.body separately
  React.useEffect(() => {
    const flashContainer = document.createElement('div')
    flashContainer.id = 'chain-lightning-flash'
    document.body.appendChild(flashContainer)

    const FlashComponent = () => {
      const [flashing, setFlashing] = React.useState(false)

      React.useEffect(() => {
        const handleFlash = () => {
          setFlashing(true)
          setTimeout(() => setFlashing(false), 400)
        }

        window.addEventListener('chainLightningFlash', handleFlash)
        handleFlash() // Trigger immediately

        return () => {
          window.removeEventListener('chainLightningFlash', handleFlash)
        }
      }, [])

      React.useEffect(() => {
        if (flashing) {
          const style = document.createElement('style')
          style.textContent = `
            @keyframes chainLightningFlash {
              0% { opacity: 0; }
              20% { opacity: 0.4; }
              40% { opacity: 0.1; }
              60% { opacity: 0.3; }
              100% { opacity: 0; }
            }
          `
          document.head.appendChild(style)
          return () => document.head.removeChild(style)
        }
      }, [flashing])

      if (!flashing) return null

      return React.createElement('div', {
        style: {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#00aaff',
          opacity: 0,
          animation: 'chainLightningFlash 0.4s ease-out',
          pointerEvents: 'none',
          zIndex: 10001,
          mixBlendMode: 'screen'
        }
      })
    }

    ReactDOM.render(React.createElement(FlashComponent), flashContainer)

    return () => {
      ReactDOM.unmountComponentAtNode(flashContainer)
      document.body.removeChild(flashContainer)
    }
  }, [])

  return (
    <>
      <LightningBoltSystem
        casterPosition={casterPosition}
        targets={targets}
        onComplete={onComplete}
      />

      {/* Impact effects at each target */}
      {targets.map((target, idx) => (
        <ElectricImpact
          key={idx}
          position={target.position}
          delay={idx * 150 + 100}
        />
      ))}

      {/* Point lights for dramatic effect */}
      {targets.map((target, idx) => (
        <pointLight
          key={`light-${idx}`}
          position={target.position}
          color="#00aaff"
          intensity={3}
          distance={8}
        />
      ))}
    </>
  )
}

export default OptimizedChainLightningEffect