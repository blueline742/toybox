import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CatmullRomCurve3, ConeGeometry } from 'three';

const StaticTargetingLine = ({
  startPos,
  endPos,
  isActive = false
}) => {
  const lineRef = useRef();
  const arrowRef = useRef();
  const dashOffset = useRef(0);

  // Create curved path for the line
  const { points, arrowPosition, arrowRotation } = useMemo(() => {
    if (!startPos || !endPos || !isActive) {
      return { points: [], arrowPosition: [0, 0, 0], arrowRotation: [0, 0, 0] };
    }

    // Create control points for a nice curve
    const start = new THREE.Vector3(...startPos);
    const end = new THREE.Vector3(...endPos);

    // Create mid points for curve
    const mid1 = start.clone().lerp(end, 0.25);
    const mid2 = start.clone().lerp(end, 0.75);

    // Raise the mid points for arc effect
    mid1.y += 1.5;
    mid2.y += 1.5;

    // Create smooth curve
    const curve = new CatmullRomCurve3([start, mid1, mid2, end]);
    const curvePoints = curve.getPoints(50);

    // Calculate arrow position and rotation
    const arrowPos = end.clone();
    arrowPos.y += 0.3; // Slightly above the target

    // Get direction for arrow
    const direction = curve.getTangentAt(0.95);
    const arrowRot = new THREE.Euler();
    arrowRot.setFromQuaternion(
      new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        direction.normalize()
      )
    );

    return {
      points: curvePoints,
      arrowPosition: [arrowPos.x, arrowPos.y, arrowPos.z],
      arrowRotation: [arrowRot.x, arrowRot.y, arrowRot.z]
    };
  }, [startPos, endPos, isActive]);

  // Create geometry from points - MUST be before conditional return
  const lineGeometry = useMemo(() => {
    if (points.length === 0) return null;
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    return geometry;
  }, [points]);

  // Animate the dashed line
  useFrame((state) => {
    if (lineRef.current && isActive) {
      dashOffset.current += 0.01;
      if (lineRef.current.material) {
        lineRef.current.material.dashOffset = -dashOffset.current;
      }
    }

    // Pulse the arrow
    if (arrowRef.current && isActive) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.2;
      arrowRef.current.scale.set(scale, scale, scale);
    }
  });

  if (!isActive || points.length === 0 || !lineGeometry) return null;

  return (
    <group>
      {/* Dotted line */}
      <line ref={lineRef} geometry={lineGeometry}>
        <lineDashedMaterial
          color="#ff0000"
          linewidth={3}
          scale={1}
          dashSize={0.3}
          gapSize={0.2}
          opacity={0.8}
          transparent
          depthWrite={false}
        />
      </line>

      {/* Glowing effect under the line */}
      <line geometry={lineGeometry}>
        <lineBasicMaterial
          color="#ff0000"
          linewidth={8}
          opacity={0.2}
          transparent
          depthWrite={false}
        />
      </line>

      {/* Arrow at the end */}
      <mesh
        ref={arrowRef}
        position={arrowPosition}
        rotation={arrowRotation}
      >
        <coneGeometry args={[0.3, 0.8, 8]} />
        <meshBasicMaterial
          color="#ff0000"
          emissive="#ff0000"
          emissiveIntensity={1}
        />
      </mesh>

      {/* Target circle */}
      <group position={endPos}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.6, 0.8, 32]} />
          <meshBasicMaterial
            color="#ff0000"
            transparent
            opacity={0.6}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
    </group>
  );
};

export default StaticTargetingLine;