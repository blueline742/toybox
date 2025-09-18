import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Trail, Sparkles, Billboard, Float } from '@react-three/drei';
import * as THREE from 'three';

const EnhancedPyroblast = ({
  startPosition,
  endPosition,
  onComplete,
  casterCard,
  targetCard
}) => {
  const fireballRef = useRef();
  const trailRef = useRef();
  const [progress, setProgress] = useState(0);
  const [isExploding, setIsExploding] = useState(false);
  const [trailPositions, setTrailPositions] = useState([startPosition]);

  // Create a curve for the projectile path
  const curve = React.useMemo(() => {
    const start = new THREE.Vector3(...startPosition);
    const end = new THREE.Vector3(...endPosition);

    // Create control point for curved trajectory
    const midPoint = start.clone().add(end).multiplyScalar(0.5);
    midPoint.y += 2; // Arc the spell upward

    return new THREE.QuadraticBezierCurve3(start, midPoint, end);
  }, [startPosition, endPosition]);

  useFrame((state, delta) => {
    if (progress >= 1) {
      if (!isExploding) {
        setIsExploding(true);
        setTimeout(() => {
          onComplete && onComplete();
        }, 500);
      }
      return;
    }

    // Update progress - slower for more dramatic effect
    const newProgress = Math.min(progress + delta * 0.4, 1); // 2.5 seconds travel time
    setProgress(newProgress);

    // Get position along curve
    const point = curve.getPoint(newProgress);

    if (fireballRef.current) {
      fireballRef.current.position.copy(point);

      // Rotate the fireball
      fireballRef.current.rotation.x += delta * 3;
      fireballRef.current.rotation.y += delta * 5;

      // Pulsing effect
      const scale = 1 + Math.sin(state.clock.elapsedTime * 10) * 0.2;
      fireballRef.current.scale.setScalar(scale);
    }

    // Update trail
    setTrailPositions(prev => [...prev.slice(-20), [point.x, point.y, point.z]]);
  });

  return (
    <>
      {/* Main Fireball */}
      {!isExploding && (
        <group ref={fireballRef} position={startPosition}>
          {/* Core */}
          <mesh>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshBasicMaterial
              color="#ff6600"
              emissive="#ff3300"
              emissiveIntensity={2}
              transparent
              opacity={0.9}
            />
          </mesh>

          {/* Outer glow */}
          <mesh scale={1.5}>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshBasicMaterial
              color="#ffaa00"
              transparent
              opacity={0.3}
              side={THREE.BackSide}
            />
          </mesh>

          {/* Intense core */}
          <mesh scale={0.5}>
            <sphereGeometry args={[0.3, 8, 8]} />
            <meshBasicMaterial
              color="#ffffff"
              emissive="#ffff00"
              emissiveIntensity={3}
            />
          </mesh>

          {/* Orbiting particles */}
          <Sparkles
            count={30}
            scale={1.5}
            size={3}
            speed={2}
            color="#ff6600"
            opacity={0.8}
          />

          {/* Point light for dynamic lighting */}
          <pointLight
            color="#ff6600"
            intensity={3}
            distance={5}
            decay={2}
          />
        </group>
      )}

      {/* Fire Trail */}
      {trailPositions.length > 1 && !isExploding && (
        <Trail
          width={2}
          length={10}
          color={new THREE.Color('#ff6600')}
          attenuation={(width) => width * width}
          positions={trailPositions}
        />
      )}

      {/* Explosion Effect */}
      {isExploding && (
        <group position={endPosition}>
          {/* Explosion sphere */}
          <mesh scale={[3, 3, 3]}>
            <sphereGeometry args={[0.5, 16, 16]} />
            <meshBasicMaterial
              color="#ffff00"
              transparent
              opacity={0.8}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Explosion particles */}
          <Sparkles
            count={100}
            scale={4}
            size={6}
            speed={5}
            color="#ff6600"
            opacity={0.9}
          />

          {/* Explosion light */}
          <pointLight
            color="#ff6600"
            intensity={10}
            distance={10}
            decay={2}
          />
        </group>
      )}

      {/* Ambient particles along the path */}
      {!isExploding && progress > 0.1 && (
        <group position={fireballRef.current?.position || startPosition}>
          <Sparkles
            count={20}
            scale={2}
            size={2}
            speed={1}
            color="#ffaa00"
            opacity={0.5}
          />
        </group>
      )}
    </>
  );
};

export default EnhancedPyroblast;