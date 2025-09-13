import React, { useRef, useState, useEffect } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { Sprite, SpriteMaterial } from 'three';
import * as THREE from 'three';

const Pyroblast3D = ({ 
  startPosition = [0, 0, 0], 
  targetPosition = [0, 0, -4], 
  onComplete,
  isActive = false 
}) => {
  const fireballRef = useRef();
  const innerCoreRef = useRef();
  const explosionRef = useRef();
  const [progress, setProgress] = useState(0);
  const [isExploding, setIsExploding] = useState(false);
  const [particles, setParticles] = useState([]);
  
  // Load textures
  const fireballTexture = useLoader(THREE.TextureLoader, '/assets/effects/fireball.png');
  const explosionTexture = useLoader(THREE.TextureLoader, '/assets/effects/explosion.png');
  
  // Play sound effect when spell is cast
  useEffect(() => {
    if (isActive && !isExploding) {
      // Play pyroblast sound
      const audio = new Audio('/assets/sounds/pyroblast.wav');
      audio.volume = 0.5;
      audio.play().catch(e => console.log('Sound play failed:', e));
    }
  }, [isActive, isExploding]);
  
  // Create particle trail
  useEffect(() => {
    if (isActive && !isExploding) {
      const interval = setInterval(() => {
        setParticles(prev => [...prev, {
          id: Math.random(),
          position: fireballRef.current ? [...fireballRef.current.position.toArray()] : startPosition,
          life: 1.0,
          scale: Math.random() * 0.5 + 0.3
        }]);
      }, 50);
      
      return () => clearInterval(interval);
    }
  }, [isActive, isExploding, startPosition]);
  
  // Update particles
  useFrame((state, delta) => {
    setParticles(prev => prev
      .map(p => ({
        ...p,
        life: p.life - delta * 2,
        scale: p.scale * 0.95,
        position: [
          p.position[0] + (Math.random() - 0.5) * 0.1,
          p.position[1] - delta * 2,
          p.position[2] + (Math.random() - 0.5) * 0.1
        ]
      }))
      .filter(p => p.life > 0)
    );
  });
  
  useFrame((state, delta) => {
    if (!isActive) return;
    
    if (!isExploding && fireballRef.current && progress < 1) {
      // Move fireball from start to target
      const newProgress = Math.min(progress + delta * 0.6, 1);
      setProgress(newProgress);
      
      // Calculate position along path with arc
      const x = startPosition[0] + (targetPosition[0] - startPosition[0]) * newProgress;
      const y = startPosition[1] + (targetPosition[1] - startPosition[1]) * newProgress + Math.sin(newProgress * Math.PI) * 2;
      const z = startPosition[2] + (targetPosition[2] - startPosition[2]) * newProgress;
      
      fireballRef.current.position.set(x, y, z);
      
      // Rotate the 3D fireball
      fireballRef.current.rotation.x += delta * 5;
      fireballRef.current.rotation.y += delta * 5;
      fireballRef.current.rotation.z += delta * 3;
      
      // Pulse effect
      const scale = 1 + Math.sin(state.clock.elapsedTime * 10) * 0.2;
      fireballRef.current.scale.set(scale, scale, scale);
      
      // Also animate inner core
      if (innerCoreRef.current) {
        innerCoreRef.current.rotation.x -= delta * 8;
        innerCoreRef.current.rotation.y -= delta * 8;
        const coreScale = 1 + Math.sin(state.clock.elapsedTime * 15) * 0.3;
        innerCoreRef.current.scale.set(coreScale, coreScale, coreScale);
      }
      
      // Check if reached target
      if (newProgress >= 1) {
        setIsExploding(true);
        setProgress(0);
        
        // Play explosion sound
        const explosionAudio = new Audio('/assets/sounds/explosion.wav');
        explosionAudio.volume = 0.6;
        explosionAudio.play().catch(e => console.log('Explosion sound failed:', e));
        
        // Reset after explosion
        setTimeout(() => {
          setIsExploding(false);
          setProgress(0);
          setParticles([]);
          if (onComplete) onComplete();
        }, 1000);
      }
    }
    
    // Explosion animation
    if (isExploding && explosionRef.current) {
      const explosionProgress = progress + delta * 2;
      setProgress(explosionProgress);
      
      // Grow and fade explosion
      const scale = 3 + explosionProgress * 5;
      const opacity = Math.max(0, 1 - explosionProgress * 0.8);
      
      explosionRef.current.scale.set(scale, scale, 1);
      explosionRef.current.material.opacity = opacity;
      explosionRef.current.rotation.z += delta * 2;
    }
  });
  
  if (!isActive) return null;
  
  return (
    <group>
      {/* 3D Fireball */}
      {!isExploding && (
        <group ref={fireballRef} position={startPosition}>
          {/* Inner bright core */}
          <group ref={innerCoreRef}>
            <mesh>
              <sphereGeometry args={[0.25, 16, 16]} />
              <meshBasicMaterial 
                color="#ffff00"
              />
            </mesh>
          </group>
          
          {/* Middle layer with texture */}
          <mesh>
            <sphereGeometry args={[0.4, 24, 24]} />
            <meshBasicMaterial 
              map={fireballTexture}
              color="#ff6600"
              transparent
              opacity={0.9}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          
          {/* Outer flame shell */}
          <mesh>
            <sphereGeometry args={[0.6, 16, 16]} />
            <meshBasicMaterial 
              color="#ff4500"
              transparent
              opacity={0.4}
              side={THREE.BackSide}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          
          {/* Spiky flame protrusions */}
          {[0, 60, 120, 180, 240, 300].map((angle, i) => (
            <mesh key={i} rotation={[0, (angle * Math.PI) / 180, 0]}>
              <coneGeometry args={[0.15, 0.5, 4]} />
              <meshBasicMaterial 
                color="#ff9900"
                transparent
                opacity={0.6}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
          ))}
        </group>
      )}
      
      {/* Particle Trail */}
      {particles.map(particle => (
        <sprite key={particle.id} position={particle.position} scale={[particle.scale, particle.scale, 1]}>
          <spriteMaterial
            map={fireballTexture}
            transparent={true}
            opacity={particle.life * 0.5}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            color="#ff9900"
          />
        </sprite>
      ))}
      
      {/* Explosion Sprite */}
      {isExploding && (
        <sprite ref={explosionRef} position={targetPosition}>
          <spriteMaterial 
            map={explosionTexture}
            transparent={true}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            color="#ff4400"
          />
        </sprite>
      )}
      
      {/* Dynamic Light */}
      {!isExploding && (
        <pointLight
          position={fireballRef.current?.position || startPosition}
          color="#ff4500"
          intensity={3}
          distance={10}
        />
      )}
      
      {/* Explosion Light */}
      {isExploding && (
        <pointLight
          position={targetPosition}
          color="#ff2200"
          intensity={5}
          distance={15}
        />
      )}
    </group>
  );
};

export default Pyroblast3D;