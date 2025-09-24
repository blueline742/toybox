import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, MeshTransmissionMaterial } from '@react-three/drei';
import * as THREE from 'three';

const IceCubeEffect = ({ position = [0, 0, 0], scale = 1.5 }) => {
  const iceCubeRef = useRef();
  const innerCubeRef = useRef();

  // Create ice material with transparency and refraction
  const iceMaterial = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#88ddff'),
      transparent: true,
      opacity: 0.4,
      roughness: 0.1,
      metalness: 0.1,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
      transmission: 0.9,
      thickness: 0.5,
      envMapIntensity: 1,
      side: THREE.DoubleSide,
    });
  }, []);

  // Animate the ice cube with subtle rotation and pulsing
  useFrame(({ clock }) => {
    if (iceCubeRef.current) {
      // Slow rotation
      iceCubeRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.3) * 0.1;
      iceCubeRef.current.rotation.x = Math.cos(clock.elapsedTime * 0.2) * 0.05;

      // Subtle scale pulsing
      const pulse = Math.sin(clock.elapsedTime * 1.5) * 0.05 + 1;
      iceCubeRef.current.scale.setScalar(scale * pulse);
    }

    if (innerCubeRef.current) {
      // Inner cube counter-rotation for shimmer effect
      innerCubeRef.current.rotation.y = -Math.sin(clock.elapsedTime * 0.4) * 0.15;
      innerCubeRef.current.rotation.z = Math.cos(clock.elapsedTime * 0.3) * 0.1;
    }
  });

  return (
    <group position={position}>
      {/* Main ice cube */}
      <Box
        ref={iceCubeRef}
        args={[2.2, 2.8, 2.2]}
        position={[0, 0.5, 0]}
      >
        <MeshTransmissionMaterial
          backside
          samples={4}
          resolution={256}
          transmission={0.95}
          roughness={0.1}
          thickness={0.5}
          chromaticAberration={0.3}
          anisotropy={0.3}
          distortion={0.2}
          distortionScale={0.1}
          temporalDistortion={0.2}
          color="#88ccff"
          attenuationDistance={0.5}
          attenuationColor="#ffffff"
        />
      </Box>

      {/* Inner ice cube for extra crystalline effect */}
      <Box
        ref={innerCubeRef}
        args={[1.8, 2.4, 1.8]}
        position={[0, 0.5, 0]}
      >
        <meshPhysicalMaterial
          color="#bbddff"
          transparent={true}
          opacity={0.3}
          roughness={0.05}
          metalness={0.2}
          clearcoat={1}
          clearcoatRoughness={0}
          emissive="#4488ff"
          emissiveIntensity={0.1}
          side={THREE.DoubleSide}
        />
      </Box>

      {/* Frozen particles floating inside */}
      {[...Array(6)].map((_, i) => (
        <mesh
          key={i}
          position={[
            Math.sin(i * Math.PI / 3) * 0.5,
            0.5 + Math.cos(i * Math.PI / 3) * 0.5,
            Math.cos(i * Math.PI / 3) * 0.5
          ]}
        >
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#aaccff"
            emissiveIntensity={0.5}
            opacity={0.8}
            transparent
          />
        </mesh>
      ))}

      {/* Frozen mist at the base */}
      <mesh position={[0, -0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3, 3]} />
        <meshStandardMaterial
          color="#ccddff"
          transparent={true}
          opacity={0.15}
          emissive="#88aaff"
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* FROZEN text */}
      <group position={[0, 3.5, 0]}>
        <mesh>
          <boxGeometry args={[1.8, 0.5, 0.1]} />
          <meshStandardMaterial
            color="#000000"
            opacity={0.7}
            transparent
          />
        </mesh>
      </group>
    </group>
  );
};

export default IceCubeEffect;