import React, { useRef, useEffect, useMemo, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { Text } from '@react-three/drei'
import HearthstoneSwordSlash from './HearthstoneSwordSlash'

// Sword Slash Effect Component - Hearthstone-style physical card attack
const SwordSlashEffect = ({ startPosition, endPosition, casterCard, targetCard, onComplete }) => {
  const slashRef = useRef()
  const trailRef = useRef()
  const sparkRef = useRef()
  const cardRef = useRef()
  const startTime = useRef(Date.now())
  const { scene, camera } = useThree()
  const [cardMoving, setCardMoving] = useState(false)

  // Get the actual card mesh from the scene if available
  useEffect(() => {
    if (casterCard && scene) {
      // Find the card mesh in the scene by traversing
      scene.traverse((child) => {
        if (child.userData?.cardId === casterCard.instanceId || child.userData?.cardId === casterCard.id) {
          cardRef.current = child
        }
      })
    }
  }, [casterCard, scene])

  // Create sword trail geometry
  const trailGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    const trailSegments = 20
    const positions = new Float32Array(trailSegments * 3)
    const colors = new Float32Array(trailSegments * 3)
    const alphas = new Float32Array(trailSegments)

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1))

    return geometry
  }, [])

  // Create spark particles
  const sparkGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    const particleCount = 30
    const positions = new Float32Array(particleCount * 3)
    const velocities = new Float32Array(particleCount * 3)
    const sizes = new Float32Array(particleCount)

    for (let i = 0; i < particleCount; i++) {
      // Position at impact point
      positions[i * 3] = endPosition[0]
      positions[i * 3 + 1] = endPosition[1]
      positions[i * 3 + 2] = endPosition[2]

      // Random velocities for burst effect
      const angle = (i / particleCount) * Math.PI * 2
      velocities[i * 3] = Math.cos(angle) * (Math.random() * 0.3 + 0.2)
      velocities[i * 3 + 1] = Math.random() * 0.5 + 0.2
      velocities[i * 3 + 2] = Math.sin(angle) * (Math.random() * 0.3 + 0.2)

      sizes[i] = Math.random() * 0.3 + 0.1
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    return geometry
  }, [endPosition])

  useFrame(() => {
    const elapsed = Date.now() - startTime.current
    const duration = 600

    if (elapsed > duration) {
      onComplete && onComplete()
      return
    }

    const progress = elapsed / duration

    // Animate sword trail
    if (trailRef.current) {
      const positions = trailRef.current.geometry.attributes.position.array
      const colors = trailRef.current.geometry.attributes.color.array
      const alphas = trailRef.current.geometry.attributes.alpha.array
      const trailSegments = positions.length / 3

      for (let i = 0; i < trailSegments; i++) {
        const t = i / (trailSegments - 1)
        const curveT = progress - t * 0.3

        if (curveT >= 0 && curveT <= 1) {
          // Arc motion for sword swing
          const arcHeight = Math.sin(curveT * Math.PI) * 2

          positions[i * 3] = startPosition[0] + (endPosition[0] - startPosition[0]) * curveT
          positions[i * 3 + 1] = startPosition[1] + (endPosition[1] - startPosition[1]) * curveT + arcHeight
          positions[i * 3 + 2] = startPosition[2] + (endPosition[2] - startPosition[2]) * curveT

          // Silver-white color for sword
          colors[i * 3] = 0.9
          colors[i * 3 + 1] = 0.9
          colors[i * 3 + 2] = 1.0

          // Fade trail
          alphas[i] = (1 - t) * (1 - progress)
        } else {
          alphas[i] = 0
        }
      }

      trailRef.current.geometry.attributes.position.needsUpdate = true
      trailRef.current.geometry.attributes.color.needsUpdate = true
      trailRef.current.geometry.attributes.alpha.needsUpdate = true
    }

    // Animate impact sparks
    if (sparkRef.current && progress > 0.5) {
      const sparkProgress = (progress - 0.5) * 2
      const positions = sparkRef.current.geometry.attributes.position.array
      const velocities = sparkRef.current.geometry.attributes.velocity.array

      for (let i = 0; i < positions.length / 3; i++) {
        positions[i * 3] += velocities[i * 3] * 0.1
        positions[i * 3 + 1] += velocities[i * 3 + 1] * 0.1 - sparkProgress * 0.05
        positions[i * 3 + 2] += velocities[i * 3 + 2] * 0.1
      }

      sparkRef.current.geometry.attributes.position.needsUpdate = true
      sparkRef.current.material.opacity = 1 - sparkProgress
    }
  })

  return (
    <>
      {/* Sword trail */}
      <line ref={trailRef} geometry={trailGeometry}>
        <lineBasicMaterial
          vertexColors
          transparent
          blending={THREE.AdditiveBlending}
          linewidth={3}
          depthWrite={false}
        />
      </line>

      {/* Impact sparks */}
      <points ref={sparkRef} geometry={sparkGeometry}>
        <pointsMaterial
          color="#ffff00"
          size={0.2}
          transparent
          opacity={1}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Slash mark at impact */}
      <mesh position={endPosition}>
        <planeGeometry args={[2, 0.1]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </>
  )
}

// Block Defence Shield Effect
const BlockDefenceEffect = ({ targets, onComplete }) => {
  const shieldsRef = useRef([])
  const startTime = useRef(Date.now())
  const { scene } = useThree()

  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete && onComplete()
    }, 2000)
    return () => clearTimeout(timer)
  }, [onComplete])

  useFrame(() => {
    const elapsed = Date.now() - startTime.current
    const progress = Math.min(elapsed / 2000, 1)

    shieldsRef.current.forEach((shield, index) => {
      if (shield) {
        // Pulsing scale
        const pulse = Math.sin(elapsed * 0.003) * 0.1 + 1
        shield.scale.setScalar(pulse)

        // Rotation for shield
        shield.rotation.y = elapsed * 0.001

        // Fade in and out
        if (shield.material) {
          if (progress < 0.1) {
            shield.material.opacity = progress * 10
          } else if (progress > 0.8) {
            shield.material.opacity = (1 - progress) * 5
          } else {
            shield.material.opacity = 0.6
          }
        }
      }
    })
  })

  return (
    <>
      {targets.map((target, index) => (
        <group key={index} position={target.position}>
          {/* Brick-pattern shield */}
          <mesh ref={el => shieldsRef.current[index] = el}>
            <boxGeometry args={[2.5, 3, 0.3]} />
            <meshPhongMaterial
              color="#8B4513"
              transparent
              opacity={0.6}
              emissive="#D2691E"
              emissiveIntensity={0.5}
              depthWrite={false}
            />
          </mesh>

          {/* Shield glow */}
          <mesh>
            <sphereGeometry args={[2, 16, 16]} />
            <meshBasicMaterial
              color="#FFD700"
              transparent
              opacity={0.2}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Floating bricks around shield */}
          {[...Array(6)].map((_, i) => {
            const angle = (i / 6) * Math.PI * 2
            const time = Date.now() * 0.001
            return (
              <mesh
                key={i}
                position={[
                  Math.cos(angle + time) * 1.5,
                  Math.sin(time * 2 + i) * 0.5,
                  Math.sin(angle + time) * 1.5
                ]}
              >
                <boxGeometry args={[0.3, 0.15, 0.2]} />
                <meshStandardMaterial
                  color="#B22222"
                  emissive="#FF6347"
                  emissiveIntensity={0.3}
                />
              </mesh>
            )
          })}

          {/* Shield icon */}
          <Text
            position={[0, 0, 0.2]}
            fontSize={1}
            color="white"
            anchorX="center"
            anchorY="middle"
          >
            🛡️
          </Text>
        </group>
      ))}
    </>
  )
}

// Whirlwind Slash Effect
const WhirlwindSlashEffect = ({ casterPosition, targets, onComplete }) => {
  const groupRef = useRef()
  const bladeRefs = useRef([])
  const debrisRef = useRef()
  const startTime = useRef(Date.now())
  const { scene } = useThree()

  // Create debris particles
  const debrisGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    const count = 100
    const positions = new Float32Array(count * 3)
    const velocities = new Float32Array(count * 3)
    const rotations = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const radius = Math.random() * 4 + 1

      positions[i * 3] = Math.cos(angle) * radius
      positions[i * 3 + 1] = Math.random() * 0.5
      positions[i * 3 + 2] = Math.sin(angle) * radius

      velocities[i * 3] = (Math.random() - 0.5) * 0.2
      velocities[i * 3 + 1] = Math.random() * 0.3 + 0.1
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.2

      rotations[i * 3] = Math.random() * Math.PI * 2
      rotations[i * 3 + 1] = Math.random() * Math.PI * 2
      rotations[i * 3 + 2] = Math.random() * Math.PI * 2
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3))
    geometry.setAttribute('rotation', new THREE.BufferAttribute(rotations, 3))

    return geometry
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete && onComplete()
    }, 2500)
    return () => clearTimeout(timer)
  }, [onComplete])

  useFrame(() => {
    const elapsed = Date.now() - startTime.current
    const progress = Math.min(elapsed / 2500, 1)

    // Rotate the entire whirlwind
    if (groupRef.current) {
      groupRef.current.rotation.y = elapsed * 0.01 // 10 full rotations over 2.5s

      // Move to center then back
      if (progress < 0.3) {
        // Move to center
        const t = progress / 0.3
        groupRef.current.position.set(
          casterPosition[0] * (1 - t),
          casterPosition[1],
          casterPosition[2] * (1 - t)
        )
      } else if (progress > 0.7) {
        // Return to original position
        const t = (progress - 0.7) / 0.3
        groupRef.current.position.set(
          casterPosition[0] * t,
          casterPosition[1],
          casterPosition[2] * t
        )
      }
    }

    // Animate blade trails
    bladeRefs.current.forEach((blade, i) => {
      if (blade) {
        const offset = (i / 4) * Math.PI * 2
        blade.rotation.z = elapsed * 0.015 + offset

        // Expand and contract
        const scale = Math.sin(progress * Math.PI) * 1.5 + 0.5
        blade.scale.set(scale, scale, 1)

        // Fade
        if (blade.material) {
          blade.material.opacity = Math.sin(progress * Math.PI)
        }
      }
    })

    // Animate debris
    if (debrisRef.current) {
      const positions = debrisRef.current.geometry.attributes.position.array
      const velocities = debrisRef.current.geometry.attributes.velocity.array

      for (let i = 0; i < positions.length / 3; i++) {
        positions[i * 3] += velocities[i * 3] * Math.sin(progress * Math.PI)
        positions[i * 3 + 1] += velocities[i * 3 + 1] * 0.1
        positions[i * 3 + 2] += velocities[i * 3 + 2] * Math.sin(progress * Math.PI)
      }

      debrisRef.current.geometry.attributes.position.needsUpdate = true
      debrisRef.current.material.opacity = Math.sin(progress * Math.PI) * 0.8
    }

    // Show damage at targets
    targets.forEach((target, index) => {
      const hitTime = 0.4 + index * 0.1
      if (progress > hitTime && progress < hitTime + 0.2) {
        // Create hit effect - would need separate mesh for each target
      }
    })
  })

  return (
    <group ref={groupRef} position={casterPosition}>
      {/* Spinning blade trails */}
      {[...Array(4)].map((_, i) => (
        <mesh
          key={i}
          ref={el => bladeRefs.current[i] = el}
          rotation={[0, 0, (i / 4) * Math.PI * 2]}
        >
          <planeGeometry args={[6, 0.3]} />
          <meshBasicMaterial
            color="#C0C0C0"
            transparent
            opacity={0.7}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

      {/* Wind vortex */}
      <mesh>
        <coneGeometry args={[3, 4, 8, 1, true]} />
        <meshBasicMaterial
          color="#87CEEB"
          transparent
          opacity={0.2}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          wireframe
        />
      </mesh>

      {/* Debris particles */}
      <points ref={debrisRef} geometry={debrisGeometry}>
        <pointsMaterial
          color="#8B4513"
          size={0.15}
          transparent
          opacity={0.8}
          blending={THREE.NormalBlending}
          depthWrite={false}
        />
      </points>

      {/* Energy core */}
      <mesh>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshBasicMaterial
          color="#FFD700"
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Ground impact ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]}>
        <ringGeometry args={[2, 4, 32]} />
        <meshBasicMaterial
          color="#8B4513"
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}

// Main component
const OptimizedBrickDudeEffects = ({ effectType, casterPosition, targets, casterCardId, onComplete }) => {
  // Convert positions if needed
  const startPos = casterPosition || [0, 0, 0]
  const targetList = targets || []

  switch (effectType) {
    case 'sword_slash':
      return (
        <HearthstoneSwordSlash
          casterPosition={startPos}
          targetPosition={targetList[0]?.position || [0, 0, 5]}
          casterCardId={casterCardId}
          onComplete={onComplete}
        />
      )

    case 'block_defence':
      return (
        <BlockDefenceEffect
          targets={targetList}
          onComplete={onComplete}
        />
      )

    case 'whirlwind':
      return (
        <WhirlwindSlashEffect
          casterPosition={startPos}
          targets={targetList}
          onComplete={onComplete}
        />
      )

    default:
      return null
  }
}

export default OptimizedBrickDudeEffects