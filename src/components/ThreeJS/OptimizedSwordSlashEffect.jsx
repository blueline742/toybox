import React, { useRef, useEffect, useMemo, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

// Hearthstone-style Sword Slash Card Attack
const OptimizedSwordSlashEffect = ({ casterPosition, targetPosition, onComplete }) => {
  const groupRef = useRef()
  const cardMockRef = useRef()
  const trailRef = useRef()
  const sparkRef = useRef()
  const startTime = useRef(Date.now())
  const { scene } = useThree()

  // Animation phases
  const [phase, setPhase] = useState('windup') // windup, attack, impact, return
  const phaseStartTime = useRef(Date.now())

  // Calculate positions - ensure we have valid positions
  const startPos = new THREE.Vector3(
    casterPosition?.[0] || 0,
    casterPosition?.[1] || 0.5,
    casterPosition?.[2] || -5
  )
  const endPos = new THREE.Vector3(
    targetPosition?.[0] || 0,
    targetPosition?.[1] || 0.5,
    targetPosition?.[2] || 5
  )

  // Log positions for debugging
  useEffect(() => {
    console.log('🗡️ Sword Slash - Start:', startPos.toArray(), 'End:', endPos.toArray())
  }, [])

  // Create sword trail geometry
  const trailGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    const trailSegments = 15
    const positions = new Float32Array(trailSegments * 3)
    const colors = new Float32Array(trailSegments * 3)

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    return geometry
  }, [])

  // Create impact sparks
  const sparkGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    const particleCount = 20
    const positions = new Float32Array(particleCount * 3)
    const velocities = new Float32Array(particleCount * 3)

    for (let i = 0; i < particleCount; i++) {
      // Position at impact point
      positions[i * 3] = 0
      positions[i * 3 + 1] = 0
      positions[i * 3 + 2] = 0

      // Random velocities for burst
      const angle = (i / particleCount) * Math.PI * 2
      velocities[i * 3] = Math.cos(angle) * (Math.random() * 0.3 + 0.2)
      velocities[i * 3 + 1] = Math.random() * 0.4 + 0.2
      velocities[i * 3 + 2] = Math.sin(angle) * (Math.random() * 0.3 + 0.2)
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3))

    return geometry
  }, [])

  // Handle phase transitions
  useEffect(() => {
    const timers = []

    // Phase 1: Windup (200ms)
    timers.push(setTimeout(() => {
      setPhase('attack')
      phaseStartTime.current = Date.now()
    }, 200))

    // Phase 2: Attack movement (300ms)
    timers.push(setTimeout(() => {
      setPhase('impact')
      phaseStartTime.current = Date.now()

      // Play impact sound
      const audio = new Audio('/impact.mp3')
      audio.volume = 0.4
      audio.play().catch(() => {})
    }, 500))

    // Phase 3: Impact pause (150ms)
    timers.push(setTimeout(() => {
      setPhase('return')
      phaseStartTime.current = Date.now()
    }, 650))

    // Phase 4: Return (300ms)
    timers.push(setTimeout(() => {
      onComplete && onComplete()
    }, 950))

    return () => timers.forEach(t => clearTimeout(t))
  }, [onComplete])

  // Set initial position
  useEffect(() => {
    if (cardMockRef.current) {
      cardMockRef.current.position.copy(startPos)
    }
  }, [])

  useFrame(() => {
    const elapsed = Date.now() - phaseStartTime.current

    if (cardMockRef.current) {
      const card = cardMockRef.current

      switch (phase) {
        case 'windup':
          // Lift and tilt backward
          const windupProgress = Math.min(elapsed / 200, 1)
          const windupEase = windupProgress * windupProgress // Ease in

          // Start from caster position and lift up
          card.position.set(
            startPos.x - windupEase * 0.5, // Pull back slightly
            startPos.y + windupEase * 1.5,  // Lift up
            startPos.z
          )

          card.rotation.z = -windupEase * 0.3 // Tilt back
          card.rotation.x = windupEase * 0.2 // Lean forward
          card.scale.setScalar(1 + windupEase * 0.15) // Slight scale up
          break

        case 'attack':
          // Fast movement toward target
          const attackProgress = Math.min(elapsed / 300, 1)
          const attackEase = 1 - Math.pow(1 - attackProgress, 3) // Ease out cubic

          // Interpolate position
          const attackPos = startPos.clone().lerp(endPos.clone(), attackEase)
          attackPos.y += Math.sin(attackProgress * Math.PI) * 0.5 // Arc motion
          card.position.copy(attackPos)

          // Rotation during attack
          card.rotation.z = 0.3 * (1 - attackProgress) // Unwind tilt
          card.rotation.y = attackProgress * Math.PI * 0.5 // Spin
          card.scale.setScalar(1.15 + attackProgress * 0.1) // Scale up more

          // Update trail
          if (trailRef.current) {
            const positions = trailRef.current.geometry.attributes.position.array
            const colors = trailRef.current.geometry.attributes.color.array
            const trailSegments = positions.length / 3

            for (let i = 0; i < trailSegments; i++) {
              const t = i / (trailSegments - 1)
              const trailProgress = attackProgress - t * 0.3

              if (trailProgress >= 0 && trailProgress <= 1) {
                const trailPos = startPos.clone().lerp(endPos.clone(), trailProgress)
                trailPos.y += Math.sin(trailProgress * Math.PI) * 0.5

                positions[i * 3] = trailPos.x + (Math.random() - 0.5) * 0.1
                positions[i * 3 + 1] = trailPos.y + (Math.random() - 0.5) * 0.1
                positions[i * 3 + 2] = trailPos.z

                // Silver-white trail color
                const brightness = (1 - t) * (1 - attackProgress * 0.5)
                colors[i * 3] = brightness * 0.9
                colors[i * 3 + 1] = brightness * 0.9
                colors[i * 3 + 2] = brightness
              }
            }

            trailRef.current.geometry.attributes.position.needsUpdate = true
            trailRef.current.geometry.attributes.color.needsUpdate = true
          }
          break

        case 'impact':
          // Shake at impact point
          const impactProgress = Math.min(elapsed / 150, 1)

          card.position.copy(endPos)
          card.position.x += Math.sin(elapsed * 0.1) * 0.05 * (1 - impactProgress)
          card.position.y += Math.cos(elapsed * 0.15) * 0.03 * (1 - impactProgress)

          card.rotation.z = Math.sin(elapsed * 0.2) * 0.1 * (1 - impactProgress)
          card.scale.setScalar(1.25 - impactProgress * 0.1)

          // Animate sparks
          if (sparkRef.current) {
            const positions = sparkRef.current.geometry.attributes.position.array
            const velocities = sparkRef.current.geometry.attributes.velocity.array

            for (let i = 0; i < positions.length / 3; i++) {
              positions[i * 3] = endPos.x + velocities[i * 3] * impactProgress * 2
              positions[i * 3 + 1] = endPos.y + velocities[i * 3 + 1] * impactProgress * 2
              positions[i * 3 + 2] = endPos.z + velocities[i * 3 + 2] * impactProgress * 2
            }

            sparkRef.current.geometry.attributes.position.needsUpdate = true
            sparkRef.current.material.opacity = 1 - impactProgress
          }
          break

        case 'return':
          // Smooth return to start
          const returnProgress = Math.min(elapsed / 300, 1)
          const returnEase = 1 - Math.pow(1 - returnProgress, 2) // Ease out quad

          const returnPos = endPos.clone().lerp(startPos.clone(), returnEase)
          returnPos.y += Math.sin((1 - returnProgress) * Math.PI) * 0.3
          card.position.copy(returnPos)

          card.rotation.z = 0
          card.rotation.y = (1 - returnProgress) * Math.PI * 0.5
          card.rotation.x = 0
          card.scale.setScalar(1.15 - returnEase * 0.15)

          // Fade trail
          if (trailRef.current) {
            trailRef.current.material.opacity = 1 - returnProgress
          }
          break
      }
    }
  })

  return (
    <group ref={groupRef}>
      {/* Mock card that performs the attack animation */}
      <mesh ref={cardMockRef}>
        <boxGeometry args={[1.5, 2, 0.1]} />
        <meshStandardMaterial
          color="#8B4513"
          emissive="#D2691E"
          emissiveIntensity={0.3}
          metalness={0.3}
          roughness={0.6}
        />

        {/* Sword decoration on card */}
        <mesh position={[0, 0, 0.06]}>
          <planeGeometry args={[0.8, 1.6]} />
          <meshBasicMaterial
            color="#C0C0C0"
            transparent
            opacity={0.8}
          />
        </mesh>
      </mesh>

      {/* Sword trail */}
      <line ref={trailRef} geometry={trailGeometry}>
        <lineBasicMaterial
          vertexColors
          transparent
          opacity={1}
          blending={THREE.AdditiveBlending}
          linewidth={3}
          depthWrite={false}
        />
      </line>

      {/* Impact sparks */}
      <points ref={sparkRef} geometry={sparkGeometry}>
        <pointsMaterial
          color="#FFD700"
          size={0.15}
          transparent
          opacity={1}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          sizeAttenuation
        />
      </points>

      {/* Impact flash */}
      {phase === 'impact' && (
        <mesh position={endPos}>
          <sphereGeometry args={[1.5, 16, 16]} />
          <meshBasicMaterial
            color="#FFFFFF"
            transparent
            opacity={0.3}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Slash marks at impact */}
      {phase === 'impact' && (
        <>
          <mesh position={endPos} rotation={[0, 0, Math.PI / 4]}>
            <planeGeometry args={[3, 0.1]} />
            <meshBasicMaterial
              color="#FFFFFF"
              transparent
              opacity={0.8}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
          <mesh position={endPos} rotation={[0, 0, -Math.PI / 4]}>
            <planeGeometry args={[3, 0.1]} />
            <meshBasicMaterial
              color="#FFFFFF"
              transparent
              opacity={0.8}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        </>
      )}
    </group>
  )
}

export default OptimizedSwordSlashEffect