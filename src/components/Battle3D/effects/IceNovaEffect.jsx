import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Ring, Sparkles, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

const IceNovaEffect = ({
  casterPosition,
  targetPositions = [], // Array of enemy positions
  onComplete,
  onHitTarget, // Callback when frost wave hits each target
}) => {
  const novaRingRef = useRef();
  const frostWaveRef = useRef();
  const [waveRadius, setWaveRadius] = useState(0.5);
  const [waveOpacity, setWaveOpacity] = useState(1);
  const [phase, setPhase] = useState('charging'); // 'charging', 'expanding', 'done'
  const [chargeScale, setChargeScale] = useState(0.1);
  const [frozenTargets, setFrozenTargets] = useState(new Set());
  const [iceShards, setIceShards] = useState([]);

  // Generate ice shard positions around caster
  useEffect(() => {
    const shards = [];
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      shards.push({
        id: i,
        angle,
        distance: 0,
        height: Math.random() * 0.5,
        rotation: Math.random() * Math.PI * 2,
      });
    }
    setIceShards(shards);
  }, []);

  useFrame((state, delta) => {
    if (phase === 'charging') {
      // Charging animation - pulsing ice sphere
      const newScale = Math.min(chargeScale + delta * 2, 1.5);
      setChargeScale(newScale);

      // After charging, start expanding
      if (newScale >= 1.5) {
        setPhase('expanding');
        setWaveRadius(1);
      }
    } else if (phase === 'expanding') {
      // Expand the frost wave
      const newRadius = waveRadius + delta * 4; // Speed of expansion
      setWaveRadius(newRadius);

      // Update ice shards to follow the wave
      setIceShards(prev => prev.map(shard => ({
        ...shard,
        distance: Math.min(shard.distance + delta * 4, newRadius * 0.8),
      })));

      // Check for collisions with targets
      targetPositions.forEach((targetPos, index) => {
        const distance = Math.sqrt(
          Math.pow(targetPos[0] - casterPosition[0], 2) +
          Math.pow(targetPos[2] - casterPosition[2], 2)
        );

        // If wave has reached this target and hasn't been frozen yet
        if (newRadius >= distance && !frozenTargets.has(index)) {
          setFrozenTargets(prev => new Set([...prev, index]));
          if (onHitTarget) {
            onHitTarget(index, targetPos);
          }
        }
      });

      // Fade out as it expands
      const fadeStart = 5; // Start fading at radius 5
      if (newRadius > fadeStart) {
        const fadeProgress = (newRadius - fadeStart) / 5;
        setWaveOpacity(Math.max(0, 1 - fadeProgress));
      }

      // Complete when wave is large enough or faded
      if (newRadius >= 10 || waveOpacity <= 0) {
        setPhase('done');
        if (onComplete) {
          setTimeout(onComplete, 100);
        }
      }

      // Rotate the ring
      if (novaRingRef.current) {
        novaRingRef.current.rotation.z += delta * 2;
      }
    }
  });

  if (phase === 'done') return null;

  return (
    <>
      {/* Charging phase - ice core at caster */}
      {phase === 'charging' && (
        <group position={casterPosition}>
          {/* Ice charging sphere */}
          <Sphere args={[0.5, 32, 32]} scale={chargeScale}>
            <MeshDistortMaterial
              color="#00ddff"
              emissive="#0099ff"
              emissiveIntensity={2}
              distort={0.3}
              speed={8}
              transparent
              opacity={0.8}
              blending={THREE.AdditiveBlending}
              toneMapped={false}
            />
          </Sphere>

          {/* Charging particles */}
          <Sparkles
            count={30}
            scale={chargeScale * 2}
            size={2}
            speed={3}
            color="#00ffff"
            opacity={0.9}
          />

          {/* Inner glow */}
          <pointLight
            color="#00ddff"
            intensity={chargeScale * 3}
            distance={5}
            decay={2}
          />
        </group>
      )}

      {/* Expanding frost wave */}
      {phase === 'expanding' && (
        <group position={casterPosition}>
          {/* Main frost ring */}
          <mesh
            ref={novaRingRef}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, 0.1, 0]}
          >
            <ringGeometry args={[waveRadius - 0.3, waveRadius, 64, 8]} />
            <meshBasicMaterial
              color="#00ddff"
              transparent
              opacity={waveOpacity * 0.6}
              blending={THREE.AdditiveBlending}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Secondary frost ring (thicker) */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.2, 0]}>
            <ringGeometry args={[waveRadius - 0.5, waveRadius + 0.2, 64, 8]} />
            <meshBasicMaterial
              color="#ffffff"
              transparent
              opacity={waveOpacity * 0.3}
              blending={THREE.AdditiveBlending}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Frost ground effect */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
            <ringGeometry args={[0, waveRadius, 64]} />
            <meshBasicMaterial
              color="#aaeeff"
              transparent
              opacity={waveOpacity * 0.2}
              blending={THREE.NormalBlending}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Ice shards traveling with wave */}
          {iceShards.map((shard) => {
            const x = Math.cos(shard.angle) * shard.distance;
            const z = Math.sin(shard.angle) * shard.distance;
            const y = shard.height; // Removed animated part that used 'state'

            return (
              <mesh
                key={shard.id}
                position={[x, y, z]}
                rotation={[shard.rotation, shard.rotation * 0.5, shard.rotation * 0.3]}
                scale={[0.2, 0.3, 0.2]}
              >
                <octahedronGeometry args={[1, 0]} />
                <meshStandardMaterial
                  color="#00ffff"
                  emissive="#0099ff"
                  emissiveIntensity={1}
                  transparent
                  opacity={waveOpacity * 0.8}
                  metalness={0.8}
                  roughness={0.2}
                />
              </mesh>
            );
          })}

          {/* Frost particles */}
          <Sparkles
            count={100}
            scale={[waveRadius * 2, 2, waveRadius * 2]}
            size={1.5}
            speed={0.5}
            color="#aaeeff"
            opacity={waveOpacity * 0.7}
          />

          {/* Expanding light */}
          <pointLight
            color="#00ddff"
            intensity={(10 - waveRadius) * waveOpacity}
            distance={waveRadius * 2}
            decay={1}
          />
        </group>
      )}
    </>
  );
};

// Frozen overlay effect for hit targets
export const FrozenOverlay = ({ position, duration = 10000 }) => {
  const [opacity, setOpacity] = useState(1);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    // Start fade out after duration - 2 seconds
    const fadeTimer = setTimeout(() => {
      setOpacity(0);
    }, duration - 2000);

    // Remove completely after duration
    const removeTimer = setTimeout(() => {
      setIsActive(false);
    }, duration);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, [duration]);

  useFrame((state) => {
    if (!isActive) return;
    // Subtle pulsing of ice effect
  });

  if (!isActive) return null;

  return (
    <group position={position}>
      {/* Ice crystal covering */}
      <Sphere args={[0.6, 16, 16]}>
        <meshStandardMaterial
          color="#aaeeff"
          transparent
          opacity={opacity * 0.6}
          metalness={0.9}
          roughness={0.1}
          emissive="#00ddff"
          emissiveIntensity={0.2}
        />
      </Sphere>

      {/* Ice shards around frozen target */}
      {[0, 1, 2, 3].map((i) => {
        const angle = (i / 4) * Math.PI * 2;
        const x = Math.cos(angle) * 0.4;
        const z = Math.sin(angle) * 0.4;

        return (
          <mesh
            key={i}
            position={[x, 0.3, z]}
            rotation={[Math.random(), Math.random(), Math.random()]}
            scale={[0.15, 0.25, 0.15]}
          >
            <octahedronGeometry args={[1, 0]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive="#00ddff"
              emissiveIntensity={0.5}
              transparent
              opacity={opacity * 0.8}
              metalness={1}
              roughness={0}
            />
          </mesh>
        );
      })}

      {/* Frozen sparkles */}
      <Sparkles
        count={20}
        scale={1}
        size={1}
        speed={0.1}
        color="#ffffff"
        opacity={opacity * 0.5}
      />
    </group>
  );
};

export default IceNovaEffect;