import React, { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { motion } from 'framer-motion-3d'
import { damp } from 'maath/easing'
import { MeshLine, MeshLineMaterial } from 'three.meshline'
import * as THREE from 'three'

/**
 * Enhanced Effects Library
 * Showcases the new animation packages
 */

// Enhanced Pyroblast with beam and explosion
export const EnhancedPyroblast = ({ startPos, endPos, onComplete }) => {
  const beamRef = useRef()
  const explosionRef = useRef()
  const [phase, setPhase] = useState('beam') // beam -> explosion -> done

  // Create beam geometry
  const beamGeometry = React.useMemo(() => {
    const points = []
    const start = new THREE.Vector3(...startPos)
    const end = new THREE.Vector3(...endPos)
    const curve = new THREE.CatmullRomCurve3([start, end])

    for (let i = 0; i <= 30; i++) {
      points.push(curve.getPoint(i / 30))
    }

    const line = new MeshLine()
    line.setPoints(points)
    return line
  }, [startPos, endPos])

  useFrame((state, delta) => {
    if (beamRef.current && phase === 'beam') {
      // Animate beam dash
      beamRef.current.material.dashOffset -= delta * 5

      // Check if beam reached target
      if (beamRef.current.material.dashOffset < -1) {
        setPhase('explosion')
      }
    }
  })

  React.useEffect(() => {
    if (phase === 'explosion') {
      setTimeout(() => {
        setPhase('done')
        onComplete?.()
      }, 500)
    }
  }, [phase, onComplete])

  if (phase === 'done') return null

  return (
    <>
      {/* Animated beam */}
      {phase === 'beam' && (
        <mesh ref={beamRef}>
          <primitive object={beamGeometry} />
          <meshLineMaterial
            color="#ff6b35"
            lineWidth={0.3}
            transparent
            opacity={0.8}
            dashArray={0.1}
            dashRatio={0.5}
            dashOffset={0}
          />
        </mesh>
      )}

      {/* Explosion at target */}
      {phase === 'explosion' && (
        <motion.mesh
          position={endPos}
          ref={explosionRef}
          initial={{ scale: 0 }}
          animate={{ scale: [0, 3, 0] }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <sphereGeometry args={[1, 32, 32]} />
          <meshBasicMaterial color="#ff6b35" transparent opacity={0.6} />
        </motion.mesh>
      )}
    </>
  )
}

// Smooth hovering card with Framer Motion 3D
export const EnhancedCard = ({ position, texture, onClick, isActive }) => {
  const meshRef = useRef()
  const [hovered, setHovered] = useState(false)

  useFrame((state, delta) => {
    if (!meshRef.current) return

    // Smooth floating animation
    const targetY = hovered ? 0.5 : 0
    damp(meshRef.current.position, 'y', targetY, 0.25, delta)

    // Gentle rotation when active
    if (isActive) {
      meshRef.current.rotation.y += delta * 0.5
    }
  })

  return (
    <motion.group
      position={position}
      animate={{
        scale: isActive ? 1.1 : 1,
        rotateZ: hovered ? 0.05 : 0
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <mesh
        ref={meshRef}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <planeGeometry args={[2, 3]} />
        <meshStandardMaterial
          map={texture}
          emissive={isActive ? "#ff6b35" : "#000000"}
          emissiveIntensity={isActive ? 0.2 : 0}
        />
      </mesh>

      {/* Glow effect when active */}
      {isActive && (
        <motion.mesh
          position={[0, 0, -0.1]}
          animate={{
            scale: [1.1, 1.2, 1.1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <planeGeometry args={[2.2, 3.2]} />
          <meshBasicMaterial color="#ff6b35" transparent opacity={0.3} />
        </motion.mesh>
      )}
    </motion.group>
  )
}

// Shield bubble with energy effect
export const EnhancedShield = ({ position, strength = 1 }) => {
  const shieldRef = useRef()
  const innerRef = useRef()

  useFrame((state) => {
    if (shieldRef.current) {
      // Pulsing shield
      const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.05
      shieldRef.current.scale.setScalar(1 + pulse)
    }

    if (innerRef.current) {
      // Rotating inner energy
      innerRef.current.rotation.y = state.clock.elapsedTime * 0.5
      innerRef.current.rotation.x = Math.sin(state.clock.elapsedTime) * 0.1
    }
  })

  return (
    <group position={position}>
      {/* Outer shield bubble */}
      <motion.mesh
        ref={shieldRef}
        initial={{ scale: 0 }}
        animate={{ scale: strength }}
        transition={{ type: "spring", stiffness: 200 }}
      >
        <sphereGeometry args={[1.5, 32, 32]} />
        <meshPhysicalMaterial
          color="#00ffff"
          metalness={0.1}
          roughness={0.2}
          transparent
          opacity={0.3}
          transmission={0.5}
          clearcoat={1}
          clearcoatRoughness={0}
        />
      </motion.mesh>

      {/* Inner energy field */}
      <mesh ref={innerRef}>
        <icosahedronGeometry args={[1.3, 1]} />
        <meshBasicMaterial
          color="#00ffff"
          wireframe
          transparent
          opacity={0.2}
        />
      </mesh>

      {/* Energy particles */}
      {[...Array(8)].map((_, i) => (
        <motion.mesh
          key={i}
          animate={{
            position: [
              Math.cos(i * Math.PI / 4) * 1.2,
              Math.sin(Date.now() * 0.001 + i) * 0.5,
              Math.sin(i * Math.PI / 4) * 1.2
            ]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          <sphereGeometry args={[0.05]} />
          <meshBasicMaterial color="#ffffff" />
        </motion.mesh>
      ))}
    </group>
  )
}

// Freeze effect with ice crystals
export const EnhancedFreeze = ({ position }) => {
  const crystalRefs = useRef([])

  useFrame((state) => {
    crystalRefs.current.forEach((crystal, i) => {
      if (crystal) {
        // Each crystal rotates at different speed
        crystal.rotation.y = state.clock.elapsedTime * (0.5 + i * 0.1)
        crystal.rotation.z = Math.sin(state.clock.elapsedTime + i) * 0.1
      }
    })
  })

  return (
    <group position={position}>
      {/* Ice crystals forming around target */}
      {[...Array(6)].map((_, i) => {
        const angle = (i / 6) * Math.PI * 2
        const radius = 0.8

        return (
          <motion.mesh
            key={i}
            ref={el => crystalRefs.current[i] = el}
            position={[
              Math.cos(angle) * radius,
              Math.random() * 0.5 - 0.25,
              Math.sin(angle) * radius
            ]}
            initial={{ scale: 0, rotateZ: 0 }}
            animate={{
              scale: [0, 1, 0.8],
              rotateZ: Math.PI * 2
            }}
            transition={{
              duration: 0.8,
              delay: i * 0.05,
              scale: { times: [0, 0.6, 1] }
            }}
          >
            <coneGeometry args={[0.15, 0.4, 4]} />
            <meshPhysicalMaterial
              color="#87CEEB"
              metalness={0.3}
              roughness={0.1}
              transparent
              opacity={0.9}
              transmission={0.6}
              ior={1.45}
              thickness={0.5}
            />
          </motion.mesh>
        )
      })}

      {/* Frost particles */}
      <motion.group
        animate={{ rotate: [0, Math.PI * 2] }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      >
        {[...Array(20)].map((_, i) => (
          <mesh
            key={`particle-${i}`}
            position={[
              (Math.random() - 0.5) * 2,
              (Math.random() - 0.5) * 2,
              (Math.random() - 0.5) * 2
            ]}
          >
            <sphereGeometry args={[0.02]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
          </mesh>
        ))}
      </motion.group>
    </group>
  )
}

// Healing effect with rising particles
export const EnhancedHeal = ({ position, amount }) => {
  const particleRefs = useRef([])

  return (
    <group position={position}>
      {/* Healing aura */}
      <motion.mesh
        initial={{ scale: 0, opacity: 0 }}
        animate={{
          scale: [0, 2, 0],
          opacity: [0, 0.5, 0]
        }}
        transition={{ duration: 1.5 }}
      >
        <cylinderGeometry args={[0, 1.5, 2, 32]} />
        <meshBasicMaterial color="#00ff00" transparent />
      </motion.mesh>

      {/* Rising heal particles */}
      {[...Array(amount > 50 ? 15 : 10)].map((_, i) => (
        <motion.mesh
          key={i}
          ref={el => particleRefs.current[i] = el}
          position={[
            (Math.random() - 0.5) * 1,
            0,
            (Math.random() - 0.5) * 1
          ]}
          initial={{ y: 0, scale: 0 }}
          animate={{
            y: [0, 3],
            scale: [0, 0.3, 0],
            x: (Math.random() - 0.5) * 2
          }}
          transition={{
            duration: 2,
            delay: i * 0.1,
            ease: "easeOut"
          }}
        >
          <sphereGeometry args={[0.1]} />
          <meshBasicMaterial color="#00ff00" transparent opacity={0.8} />
        </motion.mesh>
      ))}

      {/* Heal amount text */}
      <motion.group
        position={[0, 1, 0]}
        initial={{ scale: 0, y: 0 }}
        animate={{ scale: [0, 1, 0], y: [0, 2] }}
        transition={{ duration: 1.5 }}
      >
        {/* Text would go here with Text3D from drei */}
      </motion.group>
    </group>
  )
}

// Lightning strike with animated bolts
export const EnhancedLightning = ({ startPos, endPos }) => {
  const boltsRef = useRef([])

  // Generate lightning path with branches
  const lightningPaths = React.useMemo(() => {
    const paths = []
    const start = new THREE.Vector3(...startPos)
    const end = new THREE.Vector3(...endPos)

    // Main bolt
    const mainPoints = []
    for (let i = 0; i <= 10; i++) {
      const t = i / 10
      const point = start.clone().lerp(end, t)

      // Add random offset for jagged effect
      if (i > 0 && i < 10) {
        point.x += (Math.random() - 0.5) * 0.3
        point.z += (Math.random() - 0.5) * 0.3
      }

      mainPoints.push(point)
    }

    const mainLine = new MeshLine()
    mainLine.setPoints(mainPoints)
    paths.push(mainLine)

    // Branch bolts
    for (let j = 0; j < 3; j++) {
      const branchStart = mainPoints[Math.floor(Math.random() * 5) + 2]
      const branchEnd = branchStart.clone()
      branchEnd.x += (Math.random() - 0.5) * 2
      branchEnd.y -= Math.random() * 1
      branchEnd.z += (Math.random() - 0.5) * 2

      const branchPoints = [branchStart, branchEnd]
      const branchLine = new MeshLine()
      branchLine.setPoints(branchPoints)
      paths.push(branchLine)
    }

    return paths
  }, [startPos, endPos])

  return (
    <>
      {lightningPaths.map((path, i) => (
        <motion.mesh
          key={i}
          ref={el => boltsRef.current[i] = el}
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0, 1, 0.8, 1, 0],
            scale: i === 0 ? 1 : [0, 1, 0]
          }}
          transition={{
            duration: 0.5,
            delay: i * 0.05,
            times: [0, 0.1, 0.3, 0.6, 1]
          }}
        >
          <primitive object={path} />
          <meshLineMaterial
            color={i === 0 ? "#ffffff" : "#87CEEB"}
            lineWidth={i === 0 ? 0.2 : 0.1}
            transparent
            opacity={1}
          />
        </motion.mesh>
      ))}
    </>
  )
}

export default {
  EnhancedPyroblast,
  EnhancedCard,
  EnhancedShield,
  EnhancedFreeze,
  EnhancedHeal,
  EnhancedLightning
}