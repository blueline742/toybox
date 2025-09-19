import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const SimplePyroblast = ({
  startPosition,
  endPosition,
  onComplete,
  casterCard,
  targetCard
}) => {
  const fireballRef = useRef();
  const explosionRef = useRef();
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState('travel'); // 'travel', 'explode', 'done'

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
      const newProgress = Math.min(progress + delta * 0.6, 1);
      setProgress(newProgress);

      if (fireballRef.current) {
        const point = curve.getPoint(newProgress);
        fireballRef.current.position.copy(point);

        // Simple rotation
        fireballRef.current.rotation.z += delta * 10;

        // Simple pulse
        const scale = 0.8 + Math.sin(state.clock.elapsedTime * 10) * 0.2;
        fireballRef.current.scale.setScalar(scale);
      }

      // Switch to explosion phase
      if (newProgress >= 1) {
        setPhase('explode');
      }
    } else if (phase === 'explode') {
      if (explosionRef.current) {
        // Simple explosion animation
        const currentScale = explosionRef.current.scale.x;
        const newScale = Math.min(currentScale + delta * 6, 3);
        explosionRef.current.scale.setScalar(newScale);

        // Simple fade
        const opacity = Math.max(0, 1 - (newScale - 1) / 2);
        explosionRef.current.material.opacity = opacity;

        // Rotation
        explosionRef.current.rotation.z += delta * 3;

        // Complete when faded
        if (newScale >= 3) {
          setPhase('done');
          if (onComplete) {
            onComplete();
          }
        }
      }
    }
  });

  return (
    <>
      {/* Fireball */}
      {phase === 'travel' && (
        <sprite ref={fireballRef} position={startPosition}>
          <spriteMaterial
            color="#ff6600"
            opacity={0.9}
            transparent
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </sprite>
      )}

      {/* Explosion */}
      {phase === 'explode' && (
        <sprite ref={explosionRef} position={endPosition} scale={[0.1, 0.1, 0.1]}>
          <spriteMaterial
            color="#ff3300"
            opacity={1}
            transparent
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </sprite>
      )}

      {/* Light effect */}
      {phase === 'explode' && (
        <pointLight
          position={endPosition}
          color="#ff6600"
          intensity={2}
          distance={10}
          decay={2}
        />
      )}
    </>
  );
};

export default SimplePyroblast;