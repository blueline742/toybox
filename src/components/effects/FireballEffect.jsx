import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Trail, Billboard, Sphere } from '@react-three/drei';
import * as THREE from 'three';

const FireballEffect = ({
  startPosition = [0, 0, 0],
  targetPosition = [0, 0, 0],
  onComplete,
  duration = 1000,
  size = 0.3
}) => {
  const meshRef = useRef();
  const trailRef = useRef();
  const startTime = useRef(Date.now());
  const completed = useRef(false);

  useFrame((state) => {
    if (!meshRef.current || completed.current) return;

    const elapsed = Date.now() - startTime.current;
    const progress = Math.min(elapsed / duration, 1);

    // Parabolic arc for fireball trajectory
    const x = THREE.MathUtils.lerp(startPosition[0], targetPosition[0], progress);
    const y = THREE.MathUtils.lerp(startPosition[1], targetPosition[1], progress) +
              Math.sin(progress * Math.PI) * 2;
    const z = THREE.MathUtils.lerp(startPosition[2], targetPosition[2], progress);

    meshRef.current.position.set(x, y, z);

    // Rotate the fireball
    meshRef.current.rotation.x += 0.1;
    meshRef.current.rotation.y += 0.15;

    // Scale pulse effect
    const scale = size * (1 + Math.sin(state.clock.elapsedTime * 10) * 0.1);
    meshRef.current.scale.setScalar(scale);

    if (progress >= 1 && !completed.current) {
      completed.current = true;
      if (onComplete) onComplete();
    }
  });

  return (
    <group>
      <Trail
        ref={trailRef}
        width={2}
        length={6}
        color={new THREE.Color('#ff6600')}
        attenuation={(width) => width * width}
      >
        <mesh ref={meshRef} position={startPosition}>
          <sphereGeometry args={[size, 16, 16]} />
          <meshBasicMaterial
            color="#ff4400"
            emissive="#ff2200"
            emissiveIntensity={2}
          />

          {/* Inner glow sphere */}
          <mesh scale={[1.2, 1.2, 1.2]}>
            <sphereGeometry args={[size, 16, 16]} />
            <meshBasicMaterial
              color="#ffaa00"
              transparent
              opacity={0.3}
            />
          </mesh>

          {/* Outer glow */}
          <pointLight color="#ff6600" intensity={2} distance={5} />
        </mesh>
      </Trail>
    </group>
  );
};

export default FireballEffect;