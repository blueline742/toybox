import React, { useRef, useState, useEffect } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import {
  Trail,
  Sparkles,
  Billboard,
  Float,
  MeshDistortMaterial,
  useTexture
} from '@react-three/drei';
import { useSpring, animated } from '@react-spring/three';
import * as THREE from 'three';

const PyroblastEffect = ({
  startPosition = [0, 0, 0],
  targetPosition = [0, 0, 0],
  onComplete,
  duration = 2000
}) => {
  const fireballRef = useRef();
  const fireball2Ref = useRef();
  const explosionRef = useRef();
  const [phase, setPhase] = useState('charging'); // charging, flying, exploding
  const startTime = useRef(Date.now());

  // Load textures
  const fireballTexture = useTexture('/assets/effects/fireball.png');
  const fireball2Texture = useTexture('/assets/effects/fireball2.png');
  const explosionTexture = useTexture('/assets/effects/explosion.png');

  // Spring animations for smooth movement
  const { chargeScale } = useSpring({
    chargeScale: phase === 'charging' ? 1.5 : 0,
    config: { tension: 200, friction: 20 }
  });

  const { explosionScale, explosionOpacity } = useSpring({
    explosionScale: phase === 'exploding' ? 5 : 0,
    explosionOpacity: phase === 'exploding' ? 0 : 1,
    config: { tension: 120, friction: 22 }
  });

  // Phase transitions
  useEffect(() => {
    // Charging phase
    const chargeTimer = setTimeout(() => {
      setPhase('flying');
    }, 400);

    // Flying phase
    const flyTimer = setTimeout(() => {
      setPhase('exploding');
    }, 1400);

    // Complete
    const completeTimer = setTimeout(() => {
      if (onComplete) onComplete();
    }, duration);

    return () => {
      clearTimeout(chargeTimer);
      clearTimeout(flyTimer);
      clearTimeout(completeTimer);
    };
  }, []);

  useFrame((state) => {
    if (phase === 'flying') {
      const elapsed = Date.now() - startTime.current - 400; // Account for charge time
      const flightDuration = 1000;
      const progress = Math.min(elapsed / flightDuration, 1);

      // Smooth parabolic trajectory with easing
      const easedProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic

      const x = THREE.MathUtils.lerp(startPosition[0], targetPosition[0], easedProgress);
      const y = THREE.MathUtils.lerp(startPosition[1], targetPosition[1], easedProgress) +
                Math.sin(easedProgress * Math.PI) * 2.5; // Higher arc
      const z = THREE.MathUtils.lerp(startPosition[2], targetPosition[2], easedProgress);

      // Update both fireball positions
      if (fireballRef.current) {
        fireballRef.current.position.set(x, y, z);
        // Counter-clockwise rotation for main fireball
        fireballRef.current.rotation.z -= 0.2;

        // Pulsing scale
        const pulse = 1 + Math.sin(state.clock.elapsedTime * 12) * 0.15;
        fireballRef.current.scale.setScalar(1.0 * pulse);
      }

      if (fireball2Ref.current) {
        fireball2Ref.current.position.set(x, y, z);
        // Clockwise rotation for second fireball (opposite direction)
        fireball2Ref.current.rotation.z += 0.15;

        // Different pulse timing for variation
        const pulse2 = 1 + Math.sin(state.clock.elapsedTime * 15 + Math.PI/2) * 0.2;
        fireball2Ref.current.scale.setScalar(0.8 * pulse2);
      }
    }
  });

  return (
    <>
      {/* Charging Effect */}
      {phase === 'charging' && (
        <group position={startPosition}>
          <Float speed={4} rotationIntensity={2} floatIntensity={2}>
            <animated.mesh scale={chargeScale}>
              <sphereGeometry args={[0.3, 32, 32]} />
              <MeshDistortMaterial
                color="#ff4400"
                emissive="#ff2200"
                emissiveIntensity={2}
                distort={0.4}
                speed={5}
                transparent
                opacity={0.8}
              />
            </animated.mesh>
          </Float>

          {/* Charging particles */}
          <Sparkles
            count={40}
            scale={2.5}
            size={5}
            speed={3}
            color="#ff6600"
            opacity={1}
          />

          {/* Energy ring */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.8, 0.08, 16, 100]} />
            <meshBasicMaterial
              color="#ff9900"
              transparent
              opacity={0.7}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </group>
      )}

      {/* Flying Fireball */}
      {phase === 'flying' && (
        <>
          <Trail
            width={6}
            length={12}
            color={new THREE.Color('#ff3300')}
            attenuation={(width) => width}
          >
            <group>
              {/* Main fireball layer (original texture) */}
              <mesh ref={fireballRef} position={startPosition}>
                <Billboard>
                  <mesh>
                    <planeGeometry args={[2, 2]} />
                    <meshBasicMaterial
                      map={fireballTexture}
                      transparent
                      opacity={0.9}
                      blending={THREE.AdditiveBlending}
                      depthWrite={false}
                    />
                  </mesh>
                </Billboard>
              </mesh>

              {/* Second fireball layer (new texture) for depth */}
              <mesh ref={fireball2Ref} position={startPosition}>
                <Billboard>
                  <mesh scale={[1.3, 1.3, 1]}>
                    <planeGeometry args={[2, 2]} />
                    <meshBasicMaterial
                      map={fireball2Texture}
                      transparent
                      opacity={0.7}
                      blending={THREE.AdditiveBlending}
                      depthWrite={false}
                    />
                  </mesh>
                </Billboard>
              </mesh>

              {/* Core intense light */}
              <pointLight color="#ff4400" intensity={4} distance={8} />

              {/* Outer glow light */}
              <pointLight color="#ffaa00" intensity={2} distance={12} />

              {/* Particle trail */}
              <Sparkles
                count={30}
                scale={2}
                size={4}
                speed={2}
                color="#ff9900"
              />
            </group>
          </Trail>
        </>
      )}

      {/* Explosion */}
      {phase === 'exploding' && (
        <group position={targetPosition}>
          {/* Main explosion sprite */}
          <Billboard>
            <animated.mesh
              ref={explosionRef}
              scale={explosionScale}
            >
              <planeGeometry args={[2, 2]} />
              <animated.meshBasicMaterial
                map={explosionTexture}
                transparent
                opacity={explosionOpacity}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </animated.mesh>
          </Billboard>

          {/* Secondary explosion with fireball2 texture */}
          <Billboard>
            <animated.mesh scale={explosionScale.to(s => s * 0.8)}>
              <planeGeometry args={[2.5, 2.5]} />
              <animated.meshBasicMaterial
                map={fireball2Texture}
                transparent
                opacity={explosionOpacity.to(o => o * 0.6)}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </animated.mesh>
          </Billboard>

          {/* Shockwave rings */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <animated.mesh scale={explosionScale}>
              <ringGeometry args={[0.8, 2, 32]} />
              <meshBasicMaterial
                color="#ff6600"
                transparent
                opacity={0.6}
                side={THREE.DoubleSide}
                blending={THREE.AdditiveBlending}
              />
            </animated.mesh>
          </mesh>

          {/* Second shockwave delayed */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <animated.mesh scale={explosionScale.to(s => s * 1.2)}>
              <ringGeometry args={[1.5, 2.5, 32]} />
              <meshBasicMaterial
                color="#ff9900"
                transparent
                opacity={0.4}
                side={THREE.DoubleSide}
                blending={THREE.AdditiveBlending}
              />
            </animated.mesh>
          </mesh>

          {/* Explosion particles */}
          <Sparkles
            count={60}
            scale={5}
            size={8}
            speed={5}
            color="#ff3300"
          />

          {/* Intense explosion light */}
          <pointLight color="#ff3300" intensity={15} distance={15} />
          <pointLight color="#ffaa00" intensity={8} distance={20} />
        </group>
      )}
    </>
  );
};

export default PyroblastEffect;