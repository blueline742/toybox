import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles, Float } from '@react-three/drei';
import * as THREE from 'three';

const HealingEffect = ({
  position = [0, 0, 0],
  duration = 2000,
  onComplete,
  color = '#00ff00'
}) => {
  const groupRef = useRef();
  const ringRefs = useRef([]);
  const startTime = useRef(Date.now());
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsActive(false);
      if (onComplete) onComplete();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  useFrame((state) => {
    if (!isActive || !groupRef.current) return;

    const elapsed = Date.now() - startTime.current;
    const progress = (elapsed / duration) % 1;

    // Rotate the entire effect
    groupRef.current.rotation.y += 0.02;

    // Animate rings moving upward
    ringRefs.current.forEach((ring, index) => {
      if (!ring) return;

      const offset = (index / 3) * 0.33;
      const ringProgress = (progress + offset) % 1;

      // Move rings upward
      ring.position.y = ringProgress * 3 - 1;

      // Fade out as they rise
      ring.material.opacity = 0.6 * (1 - ringProgress);

      // Scale rings
      const scale = 1 + ringProgress * 0.5;
      ring.scale.set(scale, scale, scale);
    });
  });

  if (!isActive) return null;

  return (
    <group ref={groupRef} position={position}>
      {/* Healing sparkles */}
      <Sparkles
        count={50}
        scale={3}
        size={3}
        speed={0.5}
        color={color}
        opacity={0.8}
      />

      {/* Rising rings */}
      {[0, 1, 2].map((index) => (
        <mesh
          key={index}
          ref={(el) => (ringRefs.current[index] = el)}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[1.2, 1.5, 32]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.6}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}

      {/* Central glow orb */}
      <Float
        speed={2}
        rotationIntensity={0.5}
        floatIntensity={0.5}
      >
        <mesh>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshBasicMaterial
            color={color}
            emissive={color}
            emissiveIntensity={2}
          />
        </mesh>

        {/* Outer glow */}
        <mesh scale={[2, 2, 2]}>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.2}
            depthWrite={false}
          />
        </mesh>
      </Float>

      {/* Healing light */}
      <pointLight
        color={color}
        intensity={2}
        distance={5}
      />

      {/* Upward light beam */}
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.5, 0.1, 3, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.3}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
};

export default HealingEffect;