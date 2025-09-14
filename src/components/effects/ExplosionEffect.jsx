import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';

const ExplosionEffect = ({
  position = [0, 0, 0],
  size = 2,
  duration = 1000,
  onComplete,
  color = '#ff6600'
}) => {
  const shockwaveRef = useRef();
  const sphereRefs = useRef([]);
  const debrisRefs = useRef([]);
  const startTime = useRef(Date.now());
  const [isActive, setIsActive] = useState(true);

  // Initialize debris particles
  const debrisParticles = useRef(
    Array.from({ length: 12 }, () => ({
      position: new THREE.Vector3(0, 0, 0),
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.3,
        Math.random() * 0.3,
        (Math.random() - 0.5) * 0.3
      ),
      rotation: new THREE.Vector3(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      ),
      rotationSpeed: new THREE.Vector3(
        (Math.random() - 0.5) * 0.2,
        (Math.random() - 0.5) * 0.2,
        (Math.random() - 0.5) * 0.2
      )
    }))
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsActive(false);
      if (onComplete) onComplete();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  useFrame(() => {
    if (!isActive) return;

    const elapsed = Date.now() - startTime.current;
    const progress = elapsed / duration;

    // Animate shockwave
    if (shockwaveRef.current) {
      const scale = size * (1 + progress * 3);
      shockwaveRef.current.scale.set(scale, scale, scale);
      shockwaveRef.current.material.opacity = Math.max(0, 0.8 * (1 - progress));
    }

    // Animate explosion spheres
    sphereRefs.current.forEach((sphere, index) => {
      if (!sphere) return;

      const scale = size * (0.5 + progress * 2) * (1 - index * 0.2);
      sphere.scale.set(scale, scale, scale);
      sphere.material.opacity = Math.max(0, 0.7 * (1 - progress * 1.2));
    });

    // Animate debris
    debrisRefs.current.forEach((debris, index) => {
      if (!debris) return;

      const particle = debrisParticles.current[index];

      // Update position
      particle.position.x += particle.velocity.x;
      particle.position.y += particle.velocity.y - 0.01; // Gravity
      particle.position.z += particle.velocity.z;

      debris.position.copy(particle.position);

      // Update rotation
      particle.rotation.x += particle.rotationSpeed.x;
      particle.rotation.y += particle.rotationSpeed.y;
      particle.rotation.z += particle.rotationSpeed.z;

      debris.rotation.copy(particle.rotation);

      // Fade out
      debris.material.opacity = Math.max(0, 1 - progress);
    });
  });

  if (!isActive) return null;

  return (
    <group position={position}>
      {/* Shockwave ring */}
      <mesh
        ref={shockwaveRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.1, 0]}
      >
        <ringGeometry args={[size * 0.8, size, 64]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.8}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Explosion spheres */}
      {[0, 1, 2].map((index) => (
        <mesh
          key={`sphere-${index}`}
          ref={(el) => (sphereRefs.current[index] = el)}
        >
          <sphereGeometry args={[size * 0.5, 16, 16]} />
          <meshBasicMaterial
            color={index === 0 ? '#ffffff' : index === 1 ? color : '#ff0000'}
            transparent
            opacity={0.7}
            depthWrite={false}
          />
        </mesh>
      ))}

      {/* Debris particles */}
      {debrisParticles.current.map((_, index) => (
        <mesh
          key={`debris-${index}`}
          ref={(el) => (debrisRefs.current[index] = el)}
        >
          <boxGeometry args={[0.1, 0.1, 0.1]} />
          <meshBasicMaterial
            color={Math.random() > 0.5 ? color : '#ffaa00'}
            transparent
            opacity={1}
            emissive={color}
            emissiveIntensity={0.5}
          />
        </mesh>
      ))}

      {/* Explosion sparkles */}
      <Sparkles
        count={100}
        scale={size * 2}
        size={4}
        speed={3}
        color={color}
        opacity={0.8}
      />

      {/* Flash light */}
      <pointLight
        color={color}
        intensity={5}
        distance={size * 5}
      />

      {/* White core flash */}
      <pointLight
        color="#ffffff"
        intensity={10}
        distance={size * 3}
      />
    </group>
  );
};

export default ExplosionEffect;