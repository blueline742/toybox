import React, { useRef, useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

// Hearthstone-style Sword Slash using the actual card
const HearthstoneSwordSlash = ({ casterPosition, targetPosition, casterCardId, onComplete }) => {
  const { scene } = useThree()
  const originalCardRef = useRef(null)
  const originalTransform = useRef({
    position: new THREE.Vector3(),
    rotation: new THREE.Euler(),
    scale: new THREE.Vector3()
  })
  const sparkRef = useRef()
  const startTime = useRef(Date.now())

  // Animation phases
  const [phase, setPhase] = useState('finding') // finding, windup, attack, impact, return
  const phaseStartTime = useRef(Date.now())

  // Calculate positions
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

  // Find and store the actual card in the scene
  useEffect(() => {
    if (!scene || !casterCardId) return

    let foundCard = null

    // Traverse the scene to find the card
    scene.traverse((child) => {
      // Look for the card by various possible identifiers
      if (child.userData?.cardId === casterCardId ||
          child.userData?.instanceId === casterCardId ||
          child.name === `card-${casterCardId}` ||
          child.name === `char-${casterCardId}`) {
        foundCard = child

        // If it's a group, try to find the main mesh
        if (child.type === 'Group') {
          child.traverse((subChild) => {
            if (subChild.type === 'Mesh' && !foundCard) {
              foundCard = child // Use the parent group
            }
          })
        }
      }
    })

    if (foundCard) {
      console.log('🎯 Found Brick Dude card:', foundCard.name, foundCard.userData)
      originalCardRef.current = foundCard

      // Store original transform
      originalTransform.current.position.copy(foundCard.position)
      originalTransform.current.rotation.copy(foundCard.rotation)
      originalTransform.current.scale.copy(foundCard.scale)

      // Start animation
      setPhase('windup')
      phaseStartTime.current = Date.now()
    } else {
      console.warn('❌ Could not find Brick Dude card with ID:', casterCardId)
      // Complete immediately if card not found
      setTimeout(() => onComplete && onComplete(), 100)
    }
  }, [scene, casterCardId])

  // Handle phase transitions
  useEffect(() => {
    if (phase === 'finding') return

    const timers = []

    if (phase === 'windup') {
      timers.push(setTimeout(() => {
        setPhase('attack')
        phaseStartTime.current = Date.now()
      }, 200))
    } else if (phase === 'attack') {
      timers.push(setTimeout(() => {
        setPhase('impact')
        phaseStartTime.current = Date.now()

        // Play impact sound
        const audio = new Audio('/impact.mp3')
        audio.volume = 0.4
        audio.play().catch(() => {})
      }, 300))
    } else if (phase === 'impact') {
      timers.push(setTimeout(() => {
        setPhase('return')
        phaseStartTime.current = Date.now()
      }, 150))
    } else if (phase === 'return') {
      timers.push(setTimeout(() => {
        // Restore original transform
        if (originalCardRef.current) {
          originalCardRef.current.position.copy(originalTransform.current.position)
          originalCardRef.current.rotation.copy(originalTransform.current.rotation)
          originalCardRef.current.scale.copy(originalTransform.current.scale)
        }
        onComplete && onComplete()
      }, 300))
    }

    return () => timers.forEach(t => clearTimeout(t))
  }, [phase, onComplete])

  // Create impact sparks geometry
  const sparkGeometry = React.useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    const particleCount = 20
    const positions = new Float32Array(particleCount * 3)
    const velocities = new Float32Array(particleCount * 3)

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = 0
      positions[i * 3 + 1] = 0
      positions[i * 3 + 2] = 0

      const angle = (i / particleCount) * Math.PI * 2
      velocities[i * 3] = Math.cos(angle) * (Math.random() * 0.3 + 0.2)
      velocities[i * 3 + 1] = Math.random() * 0.4 + 0.2
      velocities[i * 3 + 2] = Math.sin(angle) * (Math.random() * 0.3 + 0.2)
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3))

    return geometry
  }, [])

  // Animate the actual card
  useFrame(() => {
    if (!originalCardRef.current || phase === 'finding') return

    const card = originalCardRef.current
    const elapsed = Date.now() - phaseStartTime.current

    switch (phase) {
      case 'windup':
        // Lift and tilt backward
        const windupProgress = Math.min(elapsed / 200, 1)
        const windupEase = windupProgress * windupProgress

        card.position.set(
          originalTransform.current.position.x - windupEase * 0.5,
          originalTransform.current.position.y + windupEase * 1.5,
          originalTransform.current.position.z
        )

        card.rotation.z = originalTransform.current.rotation.z - windupEase * 0.3
        card.rotation.x = originalTransform.current.rotation.x + windupEase * 0.2

        const baseScale = originalTransform.current.scale.x
        card.scale.setScalar(baseScale * (1 + windupEase * 0.15))
        break

      case 'attack':
        // Fast movement toward target
        const attackProgress = Math.min(elapsed / 300, 1)
        const attackEase = 1 - Math.pow(1 - attackProgress, 3)

        // Interpolate position
        const attackPos = originalTransform.current.position.clone().lerp(endPos.clone(), attackEase)
        attackPos.y += Math.sin(attackProgress * Math.PI) * 1.5 // Higher arc
        card.position.copy(attackPos)

        // Rotation during attack
        card.rotation.z = originalTransform.current.rotation.z + 0.3 * (1 - attackProgress)
        card.rotation.y = originalTransform.current.rotation.y + attackProgress * Math.PI * 0.5

        const attackScale = originalTransform.current.scale.x
        card.scale.setScalar(attackScale * (1.15 + attackProgress * 0.1))
        break

      case 'impact':
        // Shake at impact point
        const impactProgress = Math.min(elapsed / 150, 1)

        card.position.copy(endPos)
        card.position.x += Math.sin(elapsed * 0.1) * 0.05 * (1 - impactProgress)
        card.position.y += Math.cos(elapsed * 0.15) * 0.03 * (1 - impactProgress) + 0.5

        card.rotation.z = originalTransform.current.rotation.z + Math.sin(elapsed * 0.2) * 0.1 * (1 - impactProgress)

        const impactScale = originalTransform.current.scale.x
        card.scale.setScalar(impactScale * (1.25 - impactProgress * 0.1))

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
        const returnEase = 1 - Math.pow(1 - returnProgress, 2)

        const returnPos = endPos.clone().lerp(originalTransform.current.position.clone(), returnEase)
        returnPos.y += Math.sin((1 - returnProgress) * Math.PI) * 0.8
        card.position.copy(returnPos)

        card.rotation.z = originalTransform.current.rotation.z
        card.rotation.y = originalTransform.current.rotation.y + (1 - returnProgress) * Math.PI * 0.5
        card.rotation.x = originalTransform.current.rotation.x

        const returnScale = originalTransform.current.scale.x
        card.scale.setScalar(returnScale * (1.15 - returnEase * 0.15))
        break
    }
  })

  return (
    <>
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

      {/* Sword trail effect */}
      {(phase === 'attack' || phase === 'impact') && (
        <mesh position={originalCardRef.current?.position || startPos}>
          <planeGeometry args={[0.3, 2]} />
          <meshBasicMaterial
            color="#C0C0C0"
            transparent
            opacity={0.6}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}
    </>
  )
}

export default HearthstoneSwordSlash