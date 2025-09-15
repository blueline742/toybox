import React, { useMemo } from 'react';
import * as THREE from 'three';

const SimpleTargetingLine = ({
  startPosition = [0, 0, 0],
  endPosition = [0, 0, 0],
  isActive = false,
  color = '#ff0000'
}) => {
  // Create a simple line geometry
  const lineGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();

    // Create curved path points
    const points = [];
    const segments = 20;

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;

      // Interpolate position with arc
      const x = startPosition[0] + (endPosition[0] - startPosition[0]) * t;
      const z = startPosition[2] + (endPosition[2] - startPosition[2]) * t;

      // Add arc height
      const baseY = startPosition[1] + (endPosition[1] - startPosition[1]) * t;
      const arcHeight = Math.sin(t * Math.PI) * 2; // Arc height of 2 units
      const y = baseY + arcHeight;

      points.push(new THREE.Vector3(x, y, z));
    }

    geometry.setFromPoints(points);
    return geometry;
  }, [startPosition, endPosition]);

  if (!isActive) return null;

  return (
    <group>
      {/* Main targeting line */}
      <line geometry={lineGeometry}>
        <lineBasicMaterial
          color={color}
          linewidth={3}
          transparent
          opacity={0.8}
        />
      </line>

      {/* Target indicator at end position */}
      <group position={endPosition}>
        {/* Target ring */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.8, 1.2, 32]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.6}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Inner target dot */}
        <mesh>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshBasicMaterial
            color={color}
            emissive={color}
            emissiveIntensity={1}
          />
        </mesh>
      </group>

      {/* Start position indicator */}
      <mesh position={startPosition}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshBasicMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.5}
        />
      </mesh>
    </group>
  );
};

export default SimpleTargetingLine;