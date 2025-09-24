import React, { useRef, useEffect, useState, Suspense } from 'react';
import { useFrame, useThree, useLoader } from '@react-three/fiber';
import { Plane } from '@react-three/drei';
import * as THREE from 'three';

const FrostOverlayInner = ({ isActive, duration = 5000, intensity = 0.7 }) => {
  const meshRef = useRef();
  const startTimeRef = useRef(null);
  const { camera, size } = useThree();

  console.log('🧊 FrostOverlay component - isActive:', isActive);

  // Load the realistic frost texture
  const frostTexture = useLoader(THREE.TextureLoader, '/assets/effects/frost2.png');

  // Configure the texture
  useEffect(() => {
    if (frostTexture) {
      frostTexture.wrapS = THREE.RepeatWrapping;
      frostTexture.wrapT = THREE.RepeatWrapping;
      frostTexture.repeat.set(2, 2); // Tile the frost pattern
      frostTexture.needsUpdate = true;
      console.log('🧊 Frost texture configured successfully');
    }
  }, [frostTexture]);

  useEffect(() => {
    if (isActive && !startTimeRef.current) {
      startTimeRef.current = Date.now();
      console.log('🧊 Frost overlay activated at:', startTimeRef.current);
    } else if (!isActive) {
      startTimeRef.current = null;
    }
  }, [isActive]);

  useFrame(() => {
    if (!meshRef.current || !isActive || !startTimeRef.current) return;

    const elapsed = Date.now() - startTimeRef.current;
    const progress = Math.min(elapsed / duration, 1);

    // Fade in quickly, hold, then fade out
    let newOpacity;
    if (progress < 0.1) {
      // Fade in (first 10% of duration)
      newOpacity = (progress / 0.1) * intensity;
    } else if (progress < 0.8) {
      // Hold at full intensity (10% to 80%)
      newOpacity = intensity;

      // Subtle animation of the frost texture
      if (frostTexture) {
        frostTexture.offset.x = Math.sin(elapsed * 0.0001) * 0.03;
        frostTexture.offset.y = Math.cos(elapsed * 0.00015) * 0.03;
      }
    } else {
      // Fade out (last 20% of duration)
      newOpacity = ((1 - progress) / 0.2) * intensity;
    }

    // Add subtle pulsing effect
    const pulse = Math.sin(elapsed * 0.002) * 0.03;
    newOpacity = Math.max(0, Math.min(1, newOpacity + pulse));

    // Apply opacity
    if (meshRef.current && meshRef.current.material) {
      meshRef.current.material.opacity = newOpacity;
    }

    // Position the plane in front of camera
    if (meshRef.current) {
      // Position it between camera and scene
      const distance = 2; // Distance from camera
      meshRef.current.position.copy(camera.position);
      meshRef.current.position.add(
        camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(distance)
      );
      meshRef.current.lookAt(camera.position);
    }
  });

  if (!isActive) {
    console.log('🧊 FrostOverlay not active, returning null');
    return null;
  }

  console.log('🧊 Rendering FrostOverlay with texture!');

  // Calculate plane size based on FOV and distance
  const distance = 2;
  const vFov = (camera.fov * Math.PI) / 180;
  const planeHeight = 2 * Math.tan(vFov / 2) * distance * 1.2; // 1.2 for some margin
  const planeWidth = planeHeight * (size.width / size.height);

  return (
    <Plane
      ref={meshRef}
      args={[planeWidth, planeHeight]}
      position={[0, 0, -distance]}
    >
      <meshStandardMaterial
        map={frostTexture}
        transparent={true}
        opacity={0}
        blending={THREE.NormalBlending}
        alphaMap={frostTexture}
        alphaTest={0.01}
        depthWrite={false}
        depthTest={false}
        side={THREE.DoubleSide}
        emissive="#88ccff"
        emissiveIntensity={0.1}
      />
    </Plane>
  );
};

// Wrapper component with Suspense for texture loading
const FrostOverlay = (props) => {
  if (!props.isActive) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <FrostOverlayInner {...props} />
    </Suspense>
  );
};

export default FrostOverlay;