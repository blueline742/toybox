import React, { useRef, useState, useEffect } from 'react';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Html } from '@react-three/drei';

const IceNova3D = ({ 
  casterPosition = [0, 0, 0],
  targets = [], // Array of target positions
  onComplete,
  isActive = false 
}) => {
  const frostWaveRef = useRef();
  const [waveRadius, setWaveRadius] = useState(0);
  const [particles, setParticles] = useState([]);
  const [frozenCubes, setFrozenCubes] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showScreenFrost, setShowScreenFrost] = useState(false);
  const { camera } = useThree();
  
  // Load textures
  const frost1Texture = useLoader(THREE.TextureLoader, '/assets/effects/frost1.png');
  const frost2Texture = useLoader(THREE.TextureLoader, '/assets/effects/frost2.png');
  const iceCubeTexture = useLoader(THREE.TextureLoader, '/assets/effects/icecube.png');
  
  // Initialize effect when activated
  useEffect(() => {
    if (isActive && !isAnimating) {
      setIsAnimating(true);
      setWaveRadius(0);
      setShowScreenFrost(true);
      
      // Play ice nova sound
      const audio = new Audio('/assets/sounds/ice_nova.wav');
      audio.volume = 0.5;
      audio.play().catch(e => console.log('Sound play failed:', e));
      
      // Create burst of ice particles in ALL directions
      const newParticles = [];
      for (let i = 0; i < 100; i++) { // More particles
        const angle = (Math.PI * 2 * i) / 100;
        const speed = Math.random() * 12 + 6; // Faster spread
        newParticles.push({
          id: Math.random(),
          position: [...casterPosition],
          velocity: [
            Math.cos(angle) * speed,
            Math.random() * 3 + 1,
            Math.sin(angle) * speed
          ],
          life: 1.0,
          scale: Math.random() * 2 + 0.5,
          rotation: Math.random() * Math.PI * 2,
          texture: Math.random() > 0.5 ? frost1Texture : frost2Texture
        });
      }
      setParticles(newParticles);
      
      // Create ice cubes at target positions after delay
      setTimeout(() => {
        const cubes = targets.map((target, index) => ({
          id: `cube-${index}`,
          position: target,
          scale: 0,
          rotation: [
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
          ],
          targetScale: 2 + Math.random() * 0.5
        }));
        setFrozenCubes(cubes);
        
        // Play freeze sound
        const freezeAudio = new Audio('/assets/sounds/freeze.wav');
        freezeAudio.volume = 0.6;
        freezeAudio.play().catch(e => console.log('Freeze sound failed:', e));
      }, 500);
      
      // Complete wave animation after 3 seconds
      setTimeout(() => {
        setIsAnimating(false);
        setWaveRadius(0);
        setParticles([]);
      }, 3000);
      
      // Keep ice cubes for 10 seconds
      setTimeout(() => {
        setFrozenCubes([]);
        setShowScreenFrost(false);
        if (onComplete) onComplete();
      }, 10000); // 10 seconds
    }
  }, [isActive, isAnimating, casterPosition, targets, frost1Texture, frost2Texture, onComplete]);
  
  // Update particles
  useFrame((state, delta) => {
    // Update particle positions and life
    setParticles(prev => prev
      .map(p => ({
        ...p,
        position: [
          p.position[0] + p.velocity[0] * delta,
          p.position[1] + p.velocity[1] * delta,
          p.position[2] + p.velocity[2] * delta
        ],
        velocity: [
          p.velocity[0] * 0.95,
          p.velocity[1] - delta * 5, // Gravity
          p.velocity[2] * 0.95
        ],
        life: p.life - delta * 0.3,
        rotation: p.rotation + delta * 2
      }))
      .filter(p => p.life > 0)
    );
    
    // Animate wave expansion - covers entire board
    if (isAnimating && frostWaveRef.current) {
      setWaveRadius(prev => Math.min(prev + delta * 20, 40)); // Much larger radius
      
      // Pulse effect
      const scale = 1 + Math.sin(state.clock.elapsedTime * 10) * 0.1;
      frostWaveRef.current.scale.set(scale, 1, scale);
    }
    
    // Animate ice cube growth and continuous rotation
    setFrozenCubes(prev => prev.map(cube => ({
      ...cube,
      scale: Math.min(cube.scale + delta * 4, cube.targetScale),
      rotation: [
        cube.rotation[0] + delta * 0.2,
        cube.rotation[1] + delta * 0.3,
        cube.rotation[2] + delta * 0.1
      ]
    })));
  });
  
  if (!isActive) return null;
  
  return (
    <group>
      {/* Multiple Frost Wave Rings for better coverage */}
      {isAnimating && waveRadius > 0 && (
        <>
          {/* Main wave */}
          <mesh 
            ref={frostWaveRef}
            position={casterPosition}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <ringGeometry args={[waveRadius - 1, waveRadius, 64]} />
            <meshBasicMaterial
              map={frost1Texture}
              transparent
              opacity={Math.max(0, 1 - waveRadius / 40)}
              blending={THREE.AdditiveBlending}
              color="#00ccff"
              side={THREE.DoubleSide}
            />
          </mesh>
          
          {/* Secondary wave */}
          <mesh 
            position={casterPosition}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <ringGeometry args={[waveRadius * 0.7 - 0.5, waveRadius * 0.7, 64]} />
            <meshBasicMaterial
              map={frost2Texture}
              transparent
              opacity={Math.max(0, 0.8 - waveRadius / 40)}
              blending={THREE.AdditiveBlending}
              color="#88ddff"
              side={THREE.DoubleSide}
            />
          </mesh>
        </>
      )}
      
      {/* Large ground frost circle covering board */}
      {isAnimating && (
        <mesh
          position={[casterPosition[0], casterPosition[1] - 0.1, casterPosition[2]]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <circleGeometry args={[waveRadius, 64]} />
          <meshBasicMaterial
            map={frost2Texture}
            transparent
            opacity={Math.max(0, 0.6 - waveRadius / 60)}
            blending={THREE.AdditiveBlending}
            color="#aaeeff"
          />
        </mesh>
      )}
      
      {/* Ice Particles */}
      {particles.map(particle => (
        <sprite 
          key={particle.id} 
          position={particle.position}
          scale={[particle.scale, particle.scale, 1]}
        >
          <spriteMaterial
            map={particle.texture}
            transparent
            opacity={particle.life}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            color="#aaeeff"
            rotation={particle.rotation}
          />
        </sprite>
      ))}
      
      {/* Frozen Ice Cubes on Targets - stays for 10 seconds */}
      {frozenCubes.map(cube => (
        <group key={cube.id} position={cube.position}>
          {/* Main ice cube */}
          <mesh rotation={cube.rotation} scale={[cube.scale, cube.scale, cube.scale]}>
            <boxGeometry args={[1, 1.5, 1]} />
            <meshBasicMaterial
              map={iceCubeTexture}
              transparent
              opacity={0.8}
              color="#88ccff"
            />
          </mesh>
          
          {/* Inner frozen effect */}
          <mesh rotation={cube.rotation} scale={[cube.scale * 0.9, cube.scale * 0.9, cube.scale * 0.9]}>
            <boxGeometry args={[1, 1.5, 1]} />
            <meshBasicMaterial
              color="#ffffff"
              transparent
              opacity={0.3}
            />
          </mesh>
          
          {/* Shimmer effect */}
          <sprite scale={[cube.scale * 2, cube.scale * 2, 1]}>
            <spriteMaterial
              map={frost2Texture}
              transparent
              opacity={0.5}
              blending={THREE.AdditiveBlending}
              color="#ffffff"
            />
          </sprite>
          
          {/* Ice spikes around cube */}
          {[0, 90, 180, 270].map(angle => (
            <mesh 
              key={angle}
              rotation={[0, (angle * Math.PI) / 180, Math.PI / 4]}
              position={[
                Math.cos((angle * Math.PI) / 180) * cube.scale * 0.7,
                0,
                Math.sin((angle * Math.PI) / 180) * cube.scale * 0.7
              ]}
            >
              <coneGeometry args={[0.2 * cube.scale, 0.8 * cube.scale, 4]} />
              <meshBasicMaterial
                color="#aaeeff"
                transparent
                opacity={0.7}
              />
            </mesh>
          ))}
        </group>
      ))}
      
      {/* Ambient frozen light */}
      {isAnimating && (
        <pointLight
          position={casterPosition}
          color="#88ddff"
          intensity={5}
          distance={waveRadius * 2}
        />
      )}
      
      {/* Ice cube lights */}
      {frozenCubes.map(cube => (
        <pointLight
          key={`light-${cube.id}`}
          position={cube.position}
          color="#aaeeff"
          intensity={1}
          distance={5}
        />
      ))}
      
      {/* Frosty Screen Overlay using frost2.png */}
      {showScreenFrost && (
        <Html fullscreen style={{ pointerEvents: 'none' }}>
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 9999
          }}>
            {/* Top frost */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '30%',
              background: `url(/assets/effects/frost2.png) repeat`,
              backgroundSize: '200px 200px',
              opacity: 0.4,
              animation: 'frostPulse 3s ease-in-out infinite'
            }} />
            
            {/* Bottom frost */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '100%',
              height: '30%',
              background: `url(/assets/effects/frost2.png) repeat`,
              backgroundSize: '200px 200px',
              opacity: 0.4,
              transform: 'rotate(180deg)',
              animation: 'frostPulse 3s ease-in-out infinite'
            }} />
            
            {/* Corner frost crystals */}
            {[
              { top: '10px', left: '10px', rotation: 0 },
              { top: '10px', right: '10px', rotation: 90 },
              { bottom: '10px', left: '10px', rotation: 270 },
              { bottom: '10px', right: '10px', rotation: 180 }
            ].map((pos, i) => (
              <img
                key={i}
                src="/assets/effects/frost2.png"
                style={{
                  position: 'absolute',
                  ...pos,
                  width: '150px',
                  height: '150px',
                  opacity: 0.6,
                  transform: `rotate(${pos.rotation}deg)`,
                  animation: 'frostRotate 10s linear infinite'
                }}
                alt=""
              />
            ))}
            
            {/* CSS animations */}
            <style>{`
              @keyframes frostPulse {
                0%, 100% { opacity: 0.4; }
                50% { opacity: 0.6; }
              }
              @keyframes frostRotate {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        </Html>
      )}
    </group>
  );
};

export default IceNova3D;