import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshDistortMaterial, Trail, Billboard, Sphere } from '@react-three/drei';
import * as THREE from 'three';

// Fireball Core Component
const FireballCore = ({ position, scale = 1, intensity = 1 }) => {
  const meshRef = useRef();
  const lightRef = useRef();

  // Animate the fireball core with noise
  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = clock.elapsedTime * 2;
      meshRef.current.rotation.y = clock.elapsedTime * 3;

      // Pulsing effect
      const pulse = Math.sin(clock.elapsedTime * 10) * 0.1 + 1;
      meshRef.current.scale.setScalar(scale * pulse);
    }

    if (lightRef.current) {
      lightRef.current.intensity = intensity * (Math.sin(clock.elapsedTime * 20) * 0.3 + 1);
    }
  });

  return (
    <group position={position}>
      {/* Main fireball */}
      <Sphere ref={meshRef} args={[0.5, 32, 32]}>
        <MeshDistortMaterial
          color="#ff6600"
          emissive="#ff3300"
          emissiveIntensity={2}
          roughness={0.2}
          metalness={0.8}
          distort={0.4}
          speed={5}
          toneMapped={false}
        />
      </Sphere>

      {/* Inner core (brighter) */}
      <Sphere args={[0.3, 16, 16]}>
        <meshBasicMaterial color="#ffff00" toneMapped={false} />
      </Sphere>

      {/* Point light for glow */}
      <pointLight
        ref={lightRef}
        color="#ff6600"
        intensity={intensity * 2}
        distance={10}
        decay={2}
      />
    </group>
  );
};

// Trail Particles Component
const FireTrail = ({ positions, opacity = 1 }) => {
  const particlesRef = useRef();
  const particleCount = 50;

  const particles = useMemo(() => {
    const temp = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      // Position will be updated in useFrame
      temp[i * 3] = 0;
      temp[i * 3 + 1] = 0;
      temp[i * 3 + 2] = 0;

      // Color gradient from yellow to red
      const t = i / particleCount;
      colors[i * 3] = 1; // R
      colors[i * 3 + 1] = 1 - t * 0.5; // G
      colors[i * 3 + 2] = 0; // B

      // Size decreases along trail
      sizes[i] = (1 - t) * 0.3;
    }

    return { positions: temp, colors, sizes };
  }, [particleCount]);

  useFrame(({ clock }) => {
    if (particlesRef.current && positions.length > 0) {
      const positionsAttr = particlesRef.current.geometry.attributes.position;

      for (let i = 0; i < particleCount; i++) {
        const index = Math.max(0, positions.length - 1 - i * 2);
        if (positions[index]) {
          const pos = positions[index];
          const offset = (Math.random() - 0.5) * 0.2;

          positionsAttr.array[i * 3] = pos[0] + offset;
          positionsAttr.array[i * 3 + 1] = pos[1] + offset;
          positionsAttr.array[i * 3 + 2] = pos[2] + offset;
        }
      }

      positionsAttr.needsUpdate = true;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={particles.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particleCount}
          array={particles.colors}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={particleCount}
          array={particles.sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={`
          attribute float size;
          attribute vec3 color;
          varying vec3 vColor;

          void main() {
            vColor = color;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size * 300.0 / -mvPosition.z;
            gl_Position = projectionMatrix * mvPosition;
          }
        `}
        fragmentShader={`
          varying vec3 vColor;
          uniform float opacity;

          void main() {
            vec2 center = gl_PointCoord - vec2(0.5);
            float dist = length(center);

            if (dist > 0.5) discard;

            float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
            gl_FragColor = vec4(vColor, alpha * opacity);
          }
        `}
        uniforms={{ opacity: { value: opacity } }}
        transparent={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

// Explosion Effect Component
const Explosion = ({ position, onComplete }) => {
  const sphereRef = useRef();
  const particlesRef = useRef();
  const [particles] = useState(() => {
    const count = 100;
    const temp = new Float32Array(count * 3);
    const velocities = [];

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = 0.1;

      temp[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      temp[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      temp[i * 3 + 2] = r * Math.cos(phi);

      velocities.push({
        x: (Math.random() - 0.5) * 0.3,
        y: (Math.random() - 0.5) * 0.3,
        z: (Math.random() - 0.5) * 0.3,
      });
    }

    return { positions: temp, velocities };
  });

  const [explosionScale, setExplosionScale] = useState(0.1);
  const [explosionOpacity, setExplosionOpacity] = useState(1);

  useFrame((state, delta) => {
    // Expand explosion sphere
    if (sphereRef.current && explosionScale < 3) {
      const newScale = explosionScale + delta * 5;
      setExplosionScale(newScale);
      sphereRef.current.scale.setScalar(newScale);

      const newOpacity = Math.max(0, 1 - newScale / 3);
      setExplosionOpacity(newOpacity);

      if (newScale >= 3 && onComplete) {
        onComplete();
      }
    }

    // Animate particles
    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position;

      for (let i = 0; i < particles.velocities.length; i++) {
        positions.array[i * 3] += particles.velocities[i].x * delta * 5;
        positions.array[i * 3 + 1] += particles.velocities[i].y * delta * 5;
        positions.array[i * 3 + 2] += particles.velocities[i].z * delta * 5;

        // Add gravity
        particles.velocities[i].y -= delta * 2;
      }

      positions.needsUpdate = true;
    }
  });

  return (
    <group position={position}>
      {/* Explosion sphere */}
      <Sphere ref={sphereRef} args={[1, 32, 32]}>
        <meshBasicMaterial
          color="#ff6600"
          transparent
          opacity={explosionOpacity}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </Sphere>

      {/* Particle burst */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particles.positions.length / 3}
            array={particles.positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.2}
          color="#ff9900"
          transparent
          opacity={explosionOpacity}
          blending={THREE.AdditiveBlending}
          sizeAttenuation={true}
        />
      </points>

      {/* Explosion light */}
      <pointLight
        color="#ff6600"
        intensity={explosionOpacity * 10}
        distance={15}
        decay={2}
      />
    </group>
  );
};

// Main Pyroblast Component
const Pyroblast = ({
  startPosition = [0, 0, 0],
  endPosition = [5, 0, 0],
  speed = 5,
  onComplete,
  active = false
}) => {
  const [isFlying, setIsFlying] = useState(false);
  const [hasExploded, setHasExploded] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(startPosition);
  const [trailPositions, setTrailPositions] = useState([]);

  const fireballRef = useRef();
  const startTime = useRef(0);

  // Reset when active changes
  useEffect(() => {
    if (active) {
      setIsFlying(true);
      setHasExploded(false);
      setCurrentPosition(startPosition);
      setTrailPositions([startPosition]);
      startTime.current = Date.now();
    }
  }, [active, startPosition]);

  // Animate fireball movement
  useFrame(() => {
    if (isFlying && !hasExploded && fireballRef.current) {
      const elapsed = (Date.now() - startTime.current) / 1000;
      const progress = Math.min(1, elapsed * speed / 5);

      // Calculate position with arc
      const x = THREE.MathUtils.lerp(startPosition[0], endPosition[0], progress);
      const y = THREE.MathUtils.lerp(startPosition[1], endPosition[1], progress) +
                Math.sin(progress * Math.PI) * 2; // Arc trajectory
      const z = THREE.MathUtils.lerp(startPosition[2], endPosition[2], progress);

      const newPos = [x, y, z];
      setCurrentPosition(newPos);

      // Update trail
      setTrailPositions(prev => [...prev.slice(-30), newPos]);

      // Check if reached target
      if (progress >= 1) {
        setIsFlying(false);
        setHasExploded(true);
      }
    }
  });

  if (!active) return null;

  return (
    <group>
      {/* Fireball with trail */}
      {isFlying && (
        <>
          <group
            ref={fireballRef}
            position={currentPosition}
          >
            <FireballCore position={[0, 0, 0]} intensity={2} />
          </group>

          <FireTrail positions={trailPositions} opacity={isFlying ? 1 : 0} />
        </>
      )}

      {/* Explosion */}
      {hasExploded && (
        <Explosion
          position={endPosition}
          onComplete={() => {
            setHasExploded(false);
            if (onComplete) onComplete();
          }}
        />
      )}
    </group>
  );
};

export default Pyroblast;