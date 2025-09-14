import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const LightningZap3D = ({
  startPosition,
  targetPositions, // Array of positions for chain lightning
  isActive,
  onComplete,
  color = '#00ffff',
  duration = 1500
}) => {
  const lightningRef = useRef();
  const startTime = useRef(Date.now());
  const geometryRef = useRef();

  // Generate lightning bolt path between two points
  const generateLightningPath = (start, end, segments = 10) => {
    const points = [];
    points.push(new THREE.Vector3(...start));

    for (let i = 1; i < segments; i++) {
      const t = i / segments;
      const x = start[0] + (end[0] - start[0]) * t + (Math.random() - 0.5) * 0.5;
      const y = start[1] + (end[1] - start[1]) * t + (Math.random() - 0.5) * 0.3;
      const z = start[2] + (end[2] - start[2]) * t + (Math.random() - 0.5) * 0.5;
      points.push(new THREE.Vector3(x, y, z));
    }

    points.push(new THREE.Vector3(...end));
    return points;
  };

  useEffect(() => {
    if (isActive) {
      startTime.current = Date.now();
    }
  }, [isActive]);

  useFrame(() => {
    if (!isActive || !lightningRef.current) return;

    const elapsed = Date.now() - startTime.current;
    const progress = Math.min(elapsed / duration, 1);

    // Update lightning path with random jitter
    if (geometryRef.current && targetPositions.length > 0) {
      const allPoints = [];

      // Create chain lightning effect
      let currentStart = startPosition;
      for (let i = 0; i < Math.min(Math.ceil(progress * targetPositions.length), targetPositions.length); i++) {
        const segmentPoints = generateLightningPath(currentStart, targetPositions[i]);
        allPoints.push(...segmentPoints);
        currentStart = targetPositions[i];
      }

      if (allPoints.length > 1) {
        geometryRef.current.setFromPoints(allPoints);
      }
    }

    // Flickering effect
    if (lightningRef.current.material) {
      lightningRef.current.material.opacity = 0.5 + Math.random() * 0.5;
      lightningRef.current.material.linewidth = 2 + Math.random() * 3;
    }

    if (progress >= 1 && onComplete) {
      onComplete();
    }
  });

  if (!isActive) return null;

  return (
    <group>
      {/* Lightning bolt */}
      <line ref={lightningRef}>
        <bufferGeometry ref={geometryRef} />
        <lineBasicMaterial
          color={color}
          transparent
          opacity={0.8}
          linewidth={3}
          linecap="round"
          linejoin="round"
        />
      </line>

      {/* Glow effect at impact points */}
      {targetPositions.map((pos, index) => (
        <mesh key={index} position={pos}>
          <sphereGeometry args={[0.5, 16, 16]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.6}
            emissive={color}
            emissiveIntensity={2}
          />
        </mesh>
      ))}

      {/* Point lights for glow */}
      <pointLight position={startPosition} color={color} intensity={2} distance={10} />
      {targetPositions.map((pos, index) => (
        <pointLight key={`light-${index}`} position={pos} color={color} intensity={1.5} distance={5} />
      ))}
    </group>
  );
};

export default LightningZap3D;