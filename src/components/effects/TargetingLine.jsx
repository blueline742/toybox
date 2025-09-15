import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Line } from '@react-three/drei';

const TargetingLine = ({
  startPosition = [0, 0, 0],
  endPosition = [0, 0, 0],
  isActive = false,
  color = '#ff0000'
}) => {
  const lineRef = useRef();
  const targetIconRef = useRef();
  const textureRef = useRef(null);

  // Load texture safely
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load('/assets/effects/target.png', (texture) => {
      textureRef.current = texture;
    });
  }, []);

  // Create animated dashed line points
  const points = useMemo(() => {
    if (!startPosition || !endPosition) return [];

    try {
      const start = new THREE.Vector3(...startPosition);
      const end = new THREE.Vector3(...endPosition);
      const curveHeight = 2; // Height of the arc

      // Create a curved path using quadratic bezier
      const midPoint = new THREE.Vector3().lerpVectors(start, end, 0.5);
      midPoint.y += curveHeight;

      const curve = new THREE.QuadraticBezierCurve3(start, midPoint, end);
      return curve.getPoints(30); // 30 points for smooth curve
    } catch (e) {
      console.error('Error creating targeting line points:', e);
      return [];
    }
  }, [startPosition, endPosition]);

  // Animate the dash offset for moving effect
  useFrame((state) => {
    if (lineRef.current && lineRef.current.material) {
      lineRef.current.material.dashOffset = -state.clock.elapsedTime * 2;
    }

    // Animate target icon
    if (targetIconRef.current) {
      targetIconRef.current.rotation.z = state.clock.elapsedTime * 2;
      const scale = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.1;
      targetIconRef.current.scale.setScalar(scale);
    }
  });

  if (!isActive || points.length === 0) return null;

  return (
    <>
      {/* Animated dashed line */}
      <Line
        ref={lineRef}
        points={points}
        color={color}
        lineWidth={3}
        dashed
        dashScale={5}
        dashSize={0.3}
        gapSize={0.2}
        opacity={0.8}
        transparent
      />

      {/* Glowing effect line (underneath) */}
      <Line
        points={points}
        color={color}
        lineWidth={8}
        opacity={0.3}
        transparent
        blending={THREE.AdditiveBlending}
      />

      {/* Target icon at the end position */}
      {textureRef.current && (
        <group position={endPosition}>
          <mesh ref={targetIconRef}>
            <planeGeometry args={[1.5, 1.5]} />
            <meshBasicMaterial
              map={textureRef.current}
              transparent
              opacity={0.9}
              color={color}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>

        {/* Pulsing ring around target */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.8, 1, 32]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.5}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>
      )}

      {/* Starting point indicator */}
      <group position={startPosition}>
        <mesh>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshBasicMaterial
            color={color}
            emissive={color}
            emissiveIntensity={2}
          />
        </mesh>
      </group>
    </>
  );
};

export default TargetingLine;