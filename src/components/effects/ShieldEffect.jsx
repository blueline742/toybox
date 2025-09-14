import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';
import * as THREE from 'three';

const ShieldEffect = ({
  position = [0, 0, 0],
  size = 2,
  type = 'energy',
  color = '#00aaff'
}) => {
  const shieldRef = useRef();
  const innerRef = useRef();

  const getShieldMaterial = () => {
    switch (type) {
      case 'ice':
        return {
          color: '#87ceeb',
          emissive: '#4682b4',
          opacity: 0.4
        };
      case 'fire':
        return {
          color: '#ff6600',
          emissive: '#ff3300',
          opacity: 0.3
        };
      case 'holy':
        return {
          color: '#ffff99',
          emissive: '#ffffcc',
          opacity: 0.5
        };
      default:
        return {
          color: color,
          emissive: '#0066ff',
          opacity: 0.3
        };
    }
  };

  const material = getShieldMaterial();

  useFrame((state) => {
    if (shieldRef.current) {
      // Pulsing effect
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
      shieldRef.current.scale.setScalar(scale);

      // Rotate the shield
      shieldRef.current.rotation.y += 0.01;
    }

    if (innerRef.current) {
      // Counter-rotate inner shield
      innerRef.current.rotation.y -= 0.015;
      innerRef.current.rotation.x += 0.01;
    }
  });

  return (
    <group position={position}>
      {/* Outer shield sphere */}
      <mesh ref={shieldRef}>
        <sphereGeometry args={[size, 32, 32]} />
        <meshPhysicalMaterial
          color={material.color}
          emissive={material.emissive}
          emissiveIntensity={0.5}
          transparent
          opacity={material.opacity}
          roughness={0.1}
          metalness={0.3}
          clearcoat={1}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Inner hexagonal pattern */}
      <mesh ref={innerRef}>
        <icosahedronGeometry args={[size * 0.98, 1]} />
        <meshBasicMaterial
          color={material.emissive}
          wireframe
          transparent
          opacity={0.2}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Shield glow light */}
      <pointLight
        color={material.color}
        intensity={0.5}
        distance={size * 3}
      />
    </group>
  );
};

export default ShieldEffect;