import React, { useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

function ArrowSegment({ start, end, index, totalSegments }) {
  const meshRef = useRef()
  const [width, setWidth] = React.useState(0.15)
  
  // Calculate segment properties
  const segmentData = useMemo(() => {
    const direction = new THREE.Vector3().subVectors(end, start)
    const length = direction.length()
    const center = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5)
    
    // Create rotation to align with direction
    const quaternion = new THREE.Quaternion()
    const up = new THREE.Vector3(0, 1, 0)
    quaternion.setFromUnitVectors(up, direction.normalize())
    
    return { center, length, quaternion, direction }
  }, [start, end])
  
  // Animate segment opacity and scale
  useFrame((state) => {
    if (meshRef.current) {
      // Pulsing effect
      const time = state.clock.getElapsedTime()
      const pulse = Math.sin(time * 3 - index * 0.5) * 0.1 + 0.9
      meshRef.current.scale.x = pulse
      meshRef.current.scale.z = pulse
      
      // Opacity wave effect
      const opacityWave = Math.sin(time * 2 - index * 0.3) * 0.2 + 0.8
      meshRef.current.material.opacity = opacityWave
    }
  })
  
  return (
    <mesh
      ref={meshRef}
      position={segmentData.center}
      quaternion={segmentData.quaternion}
    >
      <cylinderGeometry args={[width, width * 0.8, segmentData.length, 6]} />
      <meshBasicMaterial 
        color="#ff3333"
        transparent
        opacity={0.8}
        emissive="#ff0000"
        emissiveIntensity={0.5}
      />
    </mesh>
  )
}

function ArrowHead({ position, direction }) {
  const meshRef = useRef()
  
  const quaternion = useMemo(() => {
    const q = new THREE.Quaternion()
    const up = new THREE.Vector3(0, 1, 0)
    q.setFromUnitVectors(up, direction.normalize())
    return q
  }, [direction])
  
  useFrame((state) => {
    if (meshRef.current) {
      // Pulsing arrowhead
      const time = state.clock.getElapsedTime()
      const scale = Math.sin(time * 3) * 0.1 + 1.1
      meshRef.current.scale.set(scale, scale, scale)
      
      // Glow effect
      meshRef.current.material.emissiveIntensity = Math.sin(time * 4) * 0.3 + 0.7
    }
  })
  
  return (
    <mesh ref={meshRef} position={position} quaternion={quaternion}>
      <coneGeometry args={[0.4, 0.8, 8]} />
      <meshBasicMaterial 
        color="#ff4444"
        emissive="#ff0000"
        emissiveIntensity={0.6}
      />
    </mesh>
  )
}

function DottedArrow({ startPos, endPos }) {
  const segments = useMemo(() => {
    const segmentCount = 8 // Number of segments for dotted effect
    const gaps = []
    const start = new THREE.Vector3(...startPos)
    const end = new THREE.Vector3(...endPos)
    const direction = new THREE.Vector3().subVectors(end, start)
    const length = direction.length()
    const segmentLength = length / (segmentCount * 2) // Account for gaps
    
    for (let i = 0; i < segmentCount; i++) {
      const segStart = start.clone().add(
        direction.clone().normalize().multiplyScalar(i * 2 * segmentLength)
      )
      const segEnd = start.clone().add(
        direction.clone().normalize().multiplyScalar((i * 2 + 1) * segmentLength)
      )
      
      // Don't exceed the target
      if (segEnd.distanceTo(start) > length) {
        segEnd.copy(end)
      }
      
      gaps.push({ start: segStart, end: segEnd, index: i })
      
      if (segEnd.equals(end)) break
    }
    
    return { gaps, direction: direction.normalize() }
  }, [startPos, endPos])
  
  return (
    <group>
      {segments.gaps.map((seg, i) => (
        <ArrowSegment
          key={i}
          start={seg.start}
          end={seg.end}
          index={seg.index}
          totalSegments={segments.gaps.length}
        />
      ))}
      <ArrowHead 
        position={new THREE.Vector3(...endPos)} 
        direction={segments.direction}
      />
      
      {/* Add glow effect */}
      <pointLight position={endPos} color="#ff0000" intensity={1} distance={2} />
    </group>
  )
}

function TargetingScene({ startPos, endPos }) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <DottedArrow startPos={startPos} endPos={endPos} />
    </>
  )
}

export default function TargetingArrow({ startElement, endElement, onComplete }) {
  const [positions, setPositions] = React.useState(null)
  
  useEffect(() => {
    if (startElement && endElement) {
      const updatePositions = () => {
        const startRect = startElement.getBoundingClientRect()
        const endRect = endElement.getBoundingClientRect()
        
        // Convert screen coordinates to Three.js coordinates
        const startX = (startRect.left + startRect.width / 2 - window.innerWidth / 2) / 100
        const startY = -(startRect.top + startRect.height / 2 - window.innerHeight / 2) / 100
        
        const endX = (endRect.left + endRect.width / 2 - window.innerWidth / 2) / 100
        const endY = -(endRect.top + endRect.height / 2 - window.innerHeight / 2) / 100
        
        setPositions({
          start: [startX, startY, 0],
          end: [endX, endY, 0]
        })
      }
      
      updatePositions()
      
      // Update on window resize
      window.addEventListener('resize', updatePositions)
      return () => window.removeEventListener('resize', updatePositions)
    }
  }, [startElement, endElement])
  
  if (!positions) return null
  
  return (
    <div 
      className="fixed inset-0 z-50 pointer-events-none"
      style={{ 
        background: 'radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.2) 100%)'
      }}
    >
      <Canvas
        camera={{ 
          position: [0, 0, 10], 
          fov: 50,
          near: 0.1,
          far: 1000
        }}
        style={{ width: '100%', height: '100%' }}
      >
        <TargetingScene startPos={positions.start} endPos={positions.end} />
      </Canvas>
    </div>
  )
}