import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Trail, Sparkles, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

const EnhancedPyroblastV2 = ({
  startPosition,
  endPosition,
  onComplete,
  casterCard,
  targetCard
}) => {
  const fireballRef = useRef();
  const trailRef = useRef();
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState('travel'); // 'travel', 'explode', 'done'
  const [explosionScale, setExplosionScale] = useState(0.1);
  const [trailPositions, setTrailPositions] = useState([]);

  // Create curve for projectile path
  const curve = React.useMemo(() => {
    const start = new THREE.Vector3(...startPosition);
    const end = new THREE.Vector3(...endPosition);
    const midPoint = start.clone().add(end).multiplyScalar(0.5);
    midPoint.y += 3; // Arc height
    return new THREE.QuadraticBezierCurve3(start, midPoint, end);
  }, [startPosition, endPosition]);

  useFrame((state, delta) => {
    if (phase === 'travel') {
      // Update fireball position
      const newProgress = Math.min(progress + delta * 0.5, 1); // 2 second travel time
      setProgress(newProgress);

      if (fireballRef.current) {
        const point = curve.getPoint(newProgress);
        fireballRef.current.position.copy(point);

        // Store positions for trail (limited to last 10)
        setTrailPositions(prev => [...prev.slice(-9), point.toArray()]);

        // Pulsing effect
        const scale = 0.8 + Math.sin(state.clock.elapsedTime * 10) * 0.3;
        fireballRef.current.scale.setScalar(scale);
      }

      // Switch to explosion phase
      if (newProgress >= 0.99) {
        setPhase('explode');
        setExplosionScale(0.1);
      }
    } else if (phase === 'explode') {
      // Explosion animation
      const newScale = Math.min(explosionScale + delta * 4, 2.5);
      setExplosionScale(newScale);

      // Complete when explosion is done
      if (newScale >= 2.5) {
        setPhase('done');
        if (onComplete) {
          setTimeout(onComplete, 100); // Small delay to prevent abrupt cleanup
        }
      }
    }
  });

  if (phase === 'done') return null;

  return (
    <>
      {/* Fireball during travel */}
      {phase === 'travel' && (
        <group ref={fireballRef} position={startPosition}>
          {/* Core fireball */}
          <Sphere args={[0.3, 16, 16]}>
            <meshStandardMaterial
              color="#ff6600"
              emissive="#ff3300"
              emissiveIntensity={2}
              toneMapped={false}
            />
          </Sphere>

          {/* Outer glow */}
          <Sphere args={[0.5, 16, 16]}>
            <meshBasicMaterial
              color="#ffaa00"
              transparent
              opacity={0.3}
              blending={THREE.AdditiveBlending}
            />
          </Sphere>

          {/* Particle trail */}
          <Sparkles
            count={20}
            scale={1.5}
            size={2}
            speed={0.5}
            color="#ff6600"
            opacity={0.8}
          />

          {/* Dynamic light */}
          <pointLight
            color="#ff6600"
            intensity={2}
            distance={5}
            decay={2}
          />
        </group>
      )}

      {/* Explosion at target */}
      {phase === 'explode' && (
        <group position={endPosition}>
          {/* Explosion sphere */}
          <Sphere args={[1, 32, 32]} scale={explosionScale}>
            <MeshDistortMaterial
              color="#ff3300"
              emissive="#ff6600"
              emissiveIntensity={3}
              distort={0.4}
              speed={5}
              transparent
              opacity={Math.max(0, 1 - (explosionScale - 1) / 1.5)}
              blending={THREE.AdditiveBlending}
              toneMapped={false}
            />
          </Sphere>

          {/* Secondary explosion ring */}
          <mesh scale={[explosionScale * 1.5, explosionScale * 1.5, 0.1]}>
            <ringGeometry args={[0.5, 1, 32]} />
            <meshBasicMaterial
              color="#ffaa00"
              transparent
              opacity={Math.max(0, 0.8 - (explosionScale - 0.5) / 2)}
              blending={THREE.AdditiveBlending}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Explosion particles */}
          <Sparkles
            count={50}
            scale={explosionScale * 3}
            size={3}
            speed={2}
            color="#ff6600"
            opacity={Math.max(0, 1 - explosionScale / 2.5)}
          />

          {/* Explosion light */}
          <pointLight
            color="#ff6600"
            intensity={explosionScale * 5}
            distance={10}
            decay={2}
          />
        </group>
      )}
    </>
  );
};

export default EnhancedPyroblastV2;