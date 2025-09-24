import React, { useRef, useEffect, useState, Suspense } from 'react';
import { useFrame, useThree, useLoader } from '@react-three/fiber';
import { Plane, Box } from '@react-three/drei';
import * as THREE from 'three';

const FrostOverlayInner = ({ isActive, duration = 5000, intensity = 0.85 }) => {
  const meshRef = useRef();
  const borderGroupRef = useRef();
  const borderRefs = useRef([]);
  const startTimeRef = useRef(null);
  const { camera, size, viewport } = useThree();

  console.log('🧊 FrostOverlay component - isActive:', isActive);

  // Load the realistic frost texture
  const frostTexture = useLoader(THREE.TextureLoader, '/assets/effects/frost2.png');

  // Configure the texture
  useEffect(() => {
    if (frostTexture) {
      frostTexture.wrapS = THREE.RepeatWrapping;
      frostTexture.wrapT = THREE.RepeatWrapping;
      frostTexture.repeat.set(1.5, 1.5); // Tile the frost pattern
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

    // More dramatic fade in/out
    let newOpacity;
    if (progress < 0.05) {
      // Very quick fade in (first 5% of duration)
      newOpacity = (progress / 0.05) * intensity;
    } else if (progress < 0.85) {
      // Hold at full intensity (5% to 85%)
      newOpacity = intensity;

      // More noticeable frost animation
      if (frostTexture) {
        frostTexture.offset.x = Math.sin(elapsed * 0.0002) * 0.05;
        frostTexture.offset.y = Math.cos(elapsed * 0.0003) * 0.05;
        // Add rotation for extra effect
        frostTexture.rotation = Math.sin(elapsed * 0.0001) * 0.02;
      }
    } else {
      // Fade out (last 15% of duration)
      newOpacity = ((1 - progress) / 0.15) * intensity;
    }

    // Stronger pulsing effect
    const pulse = Math.sin(elapsed * 0.003) * 0.08;
    newOpacity = Math.max(0, Math.min(1, newOpacity + pulse));

    // Apply opacity to main frost
    if (meshRef.current && meshRef.current.material) {
      meshRef.current.material.opacity = newOpacity;
    }

    // Animate border pieces
    const borderPulse = Math.sin(elapsed * 0.004) * 0.3 + 0.7;
    borderRefs.current.forEach((ref) => {
      if (ref && ref.material) {
        ref.material.opacity = newOpacity * borderPulse * 0.9;
        ref.material.emissiveIntensity = borderPulse * 3;
      }
    });

    // Position the planes in front of camera
    const distance = 1.5; // Closer to camera
    const cameraDirection = camera.getWorldDirection(new THREE.Vector3());

    if (meshRef.current) {
      meshRef.current.position.copy(camera.position);
      meshRef.current.position.add(cameraDirection.clone().multiplyScalar(distance));
      meshRef.current.lookAt(camera.position);
    }

    if (borderGroupRef.current) {
      borderGroupRef.current.position.copy(camera.position);
      borderGroupRef.current.position.add(cameraDirection.clone().multiplyScalar(distance - 0.05));
      borderGroupRef.current.lookAt(camera.position);
    }
  });

  if (!isActive) {
    console.log('🧊 FrostOverlay not active, returning null');
    return null;
  }

  console.log('🧊 Rendering FrostOverlay with intense frost effect!');

  // Calculate plane size based on FOV and distance
  const distance = 1.5; // Match the distance used in animation
  const vFov = (camera.fov * Math.PI) / 180;
  const planeHeight = 2 * Math.tan(vFov / 2) * distance * 1.4;
  const planeWidth = planeHeight * (size.width / size.height);

  // Border dimensions
  const borderThickness = 0.2;
  const cornerSize = 0.4;

  return (
    <>
      {/* Main frost texture overlay */}
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
          emissive="#00aaff"
          emissiveIntensity={0.3}
        />
      </Plane>

      {/* Blue glowing border effect */}
      <group ref={borderGroupRef} position={[0, 0, -distance + 0.05]}>
        {/* Top border */}
        <Box
          ref={(el) => borderRefs.current[0] = el}
          args={[planeWidth + borderThickness, borderThickness, 0.01]}
          position={[0, planeHeight/2, 0]}
        >
          <meshStandardMaterial
            color="#00ddff"
            emissive="#0099ff"
            emissiveIntensity={2}
            transparent={true}
            opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            depthTest={false}
            toneMapped={false}
          />
        </Box>

        {/* Bottom border */}
        <Box
          ref={(el) => borderRefs.current[1] = el}
          args={[planeWidth + borderThickness, borderThickness, 0.01]}
          position={[0, -planeHeight/2, 0]}
        >
          <meshStandardMaterial
            color="#00ddff"
            emissive="#0099ff"
            emissiveIntensity={2}
            transparent={true}
            opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            depthTest={false}
            toneMapped={false}
          />
        </Box>

        {/* Left border */}
        <Box
          ref={(el) => borderRefs.current[2] = el}
          args={[borderThickness, planeHeight, 0.01]}
          position={[-planeWidth/2, 0, 0]}
        >
          <meshStandardMaterial
            color="#00ddff"
            emissive="#0099ff"
            emissiveIntensity={2}
            transparent={true}
            opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            depthTest={false}
            toneMapped={false}
          />
        </Box>

        {/* Right border */}
        <Box
          ref={(el) => borderRefs.current[3] = el}
          args={[borderThickness, planeHeight, 0.01]}
          position={[planeWidth/2, 0, 0]}
        >
          <meshStandardMaterial
            color="#00ddff"
            emissive="#0099ff"
            emissiveIntensity={2}
            transparent={true}
            opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            depthTest={false}
            toneMapped={false}
          />
        </Box>

        {/* Corner accents for extra glow */}
        {/* Top-left corner */}
        <Box
          ref={(el) => borderRefs.current[4] = el}
          args={[cornerSize, cornerSize, 0.01]}
          position={[-planeWidth/2, planeHeight/2, 0]}
        >
          <meshStandardMaterial
            color="#00ffff"
            emissive="#00ccff"
            emissiveIntensity={4}
            transparent={true}
            opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            depthTest={false}
            toneMapped={false}
          />
        </Box>

        {/* Top-right corner */}
        <Box
          ref={(el) => borderRefs.current[5] = el}
          args={[cornerSize, cornerSize, 0.01]}
          position={[planeWidth/2, planeHeight/2, 0]}
        >
          <meshStandardMaterial
            color="#00ffff"
            emissive="#00ccff"
            emissiveIntensity={4}
            transparent={true}
            opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            depthTest={false}
            toneMapped={false}
          />
        </Box>

        {/* Bottom-left corner */}
        <Box
          ref={(el) => borderRefs.current[6] = el}
          args={[cornerSize, cornerSize, 0.01]}
          position={[-planeWidth/2, -planeHeight/2, 0]}
        >
          <meshStandardMaterial
            color="#00ffff"
            emissive="#00ccff"
            emissiveIntensity={4}
            transparent={true}
            opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            depthTest={false}
            toneMapped={false}
          />
        </Box>

        {/* Bottom-right corner */}
        <Box
          ref={(el) => borderRefs.current[7] = el}
          args={[cornerSize, cornerSize, 0.01]}
          position={[planeWidth/2, -planeHeight/2, 0]}
        >
          <meshStandardMaterial
            color="#00ffff"
            emissive="#00ccff"
            emissiveIntensity={4}
            transparent={true}
            opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            depthTest={false}
            toneMapped={false}
          />
        </Box>
      </group>
    </>
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