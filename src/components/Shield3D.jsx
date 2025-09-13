import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const Shield3D = ({ 
  position = [0, 0, 0], 
  size = 2.5,
  color = '#00ffff',
  type = 'energy'
}) => {
  const meshRef = useRef();
  const glowRef = useRef();
  
  // Get color based on shield type
  const shieldColor = useMemo(() => {
    switch(type) {
      case 'arcane': return '#8B5CF6';
      case 'holy': return '#FCD34D';
      case 'nature': return '#22C55E';
      case 'energy': 
      default: return '#00FFFF';
    }
  }, [type]);
  
  // Animate the shield
  useFrame((state) => {
    if (meshRef.current) {
      // Pulsing effect
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
      meshRef.current.scale.set(pulse, pulse, pulse);
      
      // Rotation
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.5;
    }
    
    if (glowRef.current) {
      // Glow intensity animation
      glowRef.current.intensity = 0.5 + Math.sin(state.clock.elapsedTime * 3) * 0.2;
    }
  });
  
  return (
    <group position={position}>
      {/* Main shield sphere */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[size, 32, 32]} />
        <meshPhysicalMaterial
          color={shieldColor}
          transparent
          opacity={0.3}
          roughness={0.1}
          metalness={0.5}
          clearcoat={1}
          clearcoatRoughness={0}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Inner glow */}
      <mesh>
        <sphereGeometry args={[size * 0.95, 32, 32]} />
        <meshBasicMaterial
          color={shieldColor}
          transparent
          opacity={0.1}
          side={THREE.BackSide}
        />
      </mesh>
      
      {/* Wireframe overlay */}
      <mesh>
        <sphereGeometry args={[size * 1.02, 16, 16]} />
        <meshBasicMaterial
          color={shieldColor}
          wireframe
          transparent
          opacity={0.4}
        />
      </mesh>
      
      {/* Point light for glow effect */}
      <pointLight
        ref={glowRef}
        color={shieldColor}
        intensity={0.5}
        distance={size * 2}
      />
    </group>
  );
};

export default Shield3D;