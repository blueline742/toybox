import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { Canvas, useFrame, useThree, extend } from '@react-three/fiber';
import { Sphere, Ring, Plane } from '@react-three/drei';
import * as THREE from 'three';
import { FrostOverlay } from './FrostOverlayHelper';

/**
 * Hearthstone-style Ice Nova Shockwave
 * Expanding textured ring that fades as it grows
 */
const IceNovaShockwave = ({ position, delay = 0 }) => {
  const ringRef = useRef();
  const innerRingRef = useRef();
  const materialRef = useRef();
  const startTime = useRef(Date.now() + delay);
  
  // Create ice texture for the shockwave
  const shockwaveTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    // Create gradient for the ring
    const gradient = ctx.createLinearGradient(0, 0, 0, 64);
    gradient.addColorStop(0, 'rgba(100, 200, 255, 0)');
    gradient.addColorStop(0.2, 'rgba(150, 220, 255, 0.8)');
    gradient.addColorStop(0.5, 'rgba(200, 240, 255, 1)');
    gradient.addColorStop(0.8, 'rgba(150, 220, 255, 0.8)');
    gradient.addColorStop(1, 'rgba(100, 200, 255, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 64);
    
    // Add ice crystal pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    for (let i = 0; i < 512; i += 8) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + 4, 32);
      ctx.lineTo(i, 64);
      ctx.stroke();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.repeat.x = 8;
    return texture;
  }, []);
  
  useFrame((state, delta) => {
    if (!ringRef.current || !materialRef.current) return;
    
    const elapsed = Date.now() - startTime.current;
    if (elapsed < 0) return;
    
    const duration = 1500; // 1.5 seconds for shockwave
    const progress = Math.min(elapsed / duration, 1);
    
    if (progress >= 1) {
      ringRef.current.visible = false;
      if (innerRingRef.current) innerRingRef.current.visible = false;
      return;
    }
    
    // Exponential expansion for more impact
    const scale = 0.5 + Math.pow(progress, 0.7) * 12;
    ringRef.current.scale.set(scale, scale, 1);
    
    // Inner ring slightly delayed
    if (innerRingRef.current && progress > 0.1) {
      const innerScale = 0.5 + Math.pow((progress - 0.1) / 0.9, 0.7) * 10;
      innerRingRef.current.scale.set(innerScale, innerScale, 1);
    }
    
    // Fade out as it expands
    const opacity = Math.pow(1 - progress, 0.8);
    materialRef.current.opacity = opacity * 0.8;
    
    // Rotate for dynamic effect
    ringRef.current.rotation.z += delta * 0.5;
    
    // Pulse emissive intensity
    materialRef.current.emissiveIntensity = 0.5 + Math.sin(elapsed * 0.01) * 0.3;
  });
  
  return (
    <group position={position}>
      {/* Main shockwave ring */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.8, 1.2, 64, 8]} />
        <meshPhysicalMaterial
          ref={materialRef}
          map={shockwaveTexture}
          transparent
          opacity={0.8}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          emissive="#4fc3f7"
          emissiveIntensity={0.5}
          depthWrite={false}
        />
      </mesh>
      
      {/* Inner accent ring */}
      <mesh ref={innerRingRef} rotation={[-Math.PI / 2, 0, Math.PI / 8]}>
        <ringGeometry args={[0.9, 1.0, 32, 1]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
};

/**
 * Frozen Enemy Encasement
 * Semi-transparent ice block with frosted glass effect
 */
const FrozenEncasement = ({ position, size = 1, delay = 0 }) => {
  const groupRef = useRef();
  const iceRef = useRef();
  const startTime = useRef(Date.now() + delay);
  const [visible, setVisible] = useState(false);
  
  // Create jagged ice geometry
  const iceGeometry = useMemo(() => {
    const baseGeometry = new THREE.IcosahedronGeometry(size * 1.3, 1);
    const positions = baseGeometry.attributes.position.array;
    
    // Distort for natural ice formation
    for (let i = 0; i < positions.length; i += 3) {
      const vertex = new THREE.Vector3(
        positions[i],
        positions[i + 1],
        positions[i + 2]
      );
      
      // Elongate vertically
      vertex.y *= 1.4;
      
      // Add noise for jagged edges
      const noise = (Math.random() - 0.5) * 0.2;
      vertex.multiplyScalar(1 + noise);
      
      positions[i] = vertex.x;
      positions[i + 1] = vertex.y;
      positions[i + 2] = vertex.z;
    }
    
    baseGeometry.computeVertexNormals();
    return baseGeometry;
  }, [size]);
  
  useFrame(() => {
    if (!groupRef.current || !iceRef.current) return;
    
    const elapsed = Date.now() - startTime.current;
    if (elapsed < 0) return;
    
    if (!visible && elapsed >= 0) {
      setVisible(true);
    }
    
    const duration = 2000; // 2 seconds visible
    const progress = Math.min(elapsed / duration, 1);
    
    if (progress >= 1) {
      setVisible(false);
      return;
    }
    
    // Formation phase (0-200ms)
    if (elapsed < 200) {
      const formProgress = elapsed / 200;
      const scale = formProgress;
      groupRef.current.scale.set(scale, scale * 1.3, scale);
      iceRef.current.material.opacity = formProgress * 0.95;
    }
    // Stable phase (200-1500ms)
    else if (elapsed < 1500) {
      groupRef.current.scale.set(1, 1.3, 1);
      iceRef.current.material.opacity = 0.95;
      
      // Shimmer effect
      const shimmerTime = (elapsed - 200) / 1300;
      iceRef.current.material.emissiveIntensity = 0.2 + Math.sin(shimmerTime * Math.PI * 6) * 0.1;
      
      // Subtle rotation
      groupRef.current.rotation.y = Math.sin(elapsed * 0.0005) * 0.05;
    }
    // Shatter phase (1500-2000ms)
    else {
      const shatterProgress = (elapsed - 1500) / 500;
      const scale = 1 + shatterProgress * 0.3;
      groupRef.current.scale.set(scale, 1.3 * (1 - shatterProgress * 0.5), scale);
      iceRef.current.material.opacity = 0.95 * (1 - shatterProgress);
    }
  });
  
  if (!visible) return null;
  
  return (
    <group ref={groupRef} position={position}>
      <mesh ref={iceRef} geometry={iceGeometry}>
        <meshPhysicalMaterial
          color="#e3f2fd"
          transparent
          opacity={0}
          metalness={0}
          roughness={0.1}
          transmission={0.95}
          thickness={1.5}
          envMapIntensity={1}
          clearcoat={1}
          clearcoatRoughness={0}
          ior={1.31}
          side={THREE.DoubleSide}
          emissive="#81d4fa"
          emissiveIntensity={0.2}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
};

/**
 * Optimized Ice Particle System
 * Lightweight snowflakes and ice shards
 */
const IceParticleSystem = ({ position, count = 100 }) => {
  const particlesRef = useRef();
  const startTime = useRef(Date.now());
  
  const { positions, velocities, sizes } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = [];
    const siz = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      const angle = (Math.random() * Math.PI * 2);
      const radius = Math.random() * 0.5;
      const height = Math.random() * 0.5 - 0.25;
      
      pos[i * 3] = position[0] + Math.cos(angle) * radius;
      pos[i * 3 + 1] = position[1] + height;
      pos[i * 3 + 2] = position[2] + Math.sin(angle) * radius;
      
      vel.push({
        x: Math.cos(angle) * (2 + Math.random() * 3),
        y: Math.random() * 2 + 1,
        z: Math.sin(angle) * (2 + Math.random() * 3)
      });
      
      siz[i] = Math.random() * 0.15 + 0.05;
    }
    
    return { positions, velocities, sizes };
  }, [position, count]);
  
  useFrame((state, delta) => {
    if (!particlesRef.current) return;
    
    const elapsed = Date.now() - startTime.current;
    const duration = 2000;
    
    if (elapsed > duration) {
      particlesRef.current.visible = false;
      return;
    }
    
    const progress = elapsed / duration;
    const posArray = particlesRef.current.geometry.attributes.position.array;
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const vel = velocities[i];
      
      // Update position with velocity
      posArray[i3] += vel.x * delta;
      posArray[i3 + 1] += vel.y * delta;
      posArray[i3 + 2] += vel.z * delta;
      
      // Apply gravity
      vel.y -= 5 * delta;
      
      // Apply air resistance
      vel.x *= 0.98;
      vel.z *= 0.98;
    }
    
    particlesRef.current.geometry.attributes.position.needsUpdate = true;
    particlesRef.current.material.opacity = Math.max(0, 1 - progress);
  });
  
  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={count}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        color="#ffffff"
        transparent
        opacity={1}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation={true}
        vertexColors={false}
      />
    </points>
  );
};

/**
 * Main Ice Nova Scene Component
 */
const IceNovaScene = ({ sourcePos, targets, onComplete }) => {
  const { viewport } = useThree();
  
  // Convert screen coordinates to 3D world coordinates
  const source3D = useMemo(() => {
    const aspect = viewport.width / viewport.height;
    return [
      ((sourcePos.x / window.innerWidth) - 0.5) * viewport.width,
      -((sourcePos.y / window.innerHeight) - 0.5) * viewport.height,
      0
    ];
  }, [sourcePos, viewport]);
  
  const targets3D = useMemo(() => {
    return targets.map(target => ({
      position: [
        ((target.x / window.innerWidth) - 0.5) * viewport.width,
        -((target.y / window.innerHeight) - 0.5) * viewport.height,
        0
      ],
      size: 0.8
    }));
  }, [targets, viewport]);
  
  useEffect(() => {
    // Complete after all animations
    const timeout = setTimeout(() => {
      if (onComplete) onComplete();
    }, 3000);
    
    return () => clearTimeout(timeout);
  }, [onComplete]);
  
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} color="#b3e5fc" />
      <pointLight position={source3D} intensity={3} color="#4fc3f7" distance={15} />
      
      {/* Frost Overlay */}
      <FrostOverlay 
        duration={2500}
        intensity={0.9}
        fadeInTime={300}
        holdTime={1500}
      />
      
      {/* Shockwave */}
      <IceNovaShockwave position={source3D} delay={0} />
      
      {/* Frozen Enemies */}
      {targets3D.map((target, idx) => (
        <FrozenEncasement
          key={`frozen-${idx}`}
          position={target.position}
          size={target.size}
          delay={200 + idx * 50}
        />
      ))}
      
      {/* Particle System */}
      <IceParticleSystem position={source3D} count={150} />
      
      {/* Additional particles at each target */}
      {targets3D.map((target, idx) => (
        <IceParticleSystem
          key={`particles-${idx}`}
          position={target.position}
          count={50}
        />
      ))}
    </>
  );
};

/**
 * Portal wrapper for full-screen rendering
 */
const IceNovaPortal = ({ children }) => {
  const [portalRoot] = useState(() => {
    const div = document.createElement('div');
    div.style.position = 'fixed';
    div.style.top = '0';
    div.style.left = '0';
    div.style.width = '100vw';
    div.style.height = '100vh';
    div.style.pointerEvents = 'none';
    div.style.zIndex = '99999';
    return div;
  });
  
  useEffect(() => {
    document.body.appendChild(portalRoot);
    return () => {
      if (portalRoot.parentNode) {
        portalRoot.parentNode.removeChild(portalRoot);
      }
    };
  }, [portalRoot]);
  
  return ReactDOM.createPortal(children, portalRoot);
};

/**
 * Main Ice Nova Effect Component with clean API
 */
const IceNovaEffectEnhanced = ({ sourcePos, targets, onComplete }) => {
  return (
    <IceNovaPortal>
      <Canvas
        style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          pointerEvents: 'none'
        }}
        camera={{ 
          position: [0, 0, 10],
          fov: 50,
          near: 0.1,
          far: 100
        }}
        gl={{ 
          alpha: true,
          antialias: false, // Disable for better performance
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
          powerPreference: "high-performance"
        }}
        dpr={[1, 1.5]} // Limit DPR for performance
      >
        <IceNovaScene 
          sourcePos={sourcePos}
          targets={targets}
          onComplete={onComplete}
        />
      </Canvas>
    </IceNovaPortal>
  );
};

/**
 * Reusable function to cast Ice Nova
 * @param {Object} caster - The caster position {x, y}
 * @param {Array} enemies - Array of enemy positions [{x, y}, ...]
 * @param {Function} onComplete - Callback when effect completes
 * @returns {Function} Cleanup function
 */
export const castIceNova = (caster, enemies, onComplete) => {
  // Create container
  const container = document.createElement('div');
  container.id = 'ice-nova-effect';
  document.body.appendChild(container);
  
  // Render the effect
  const root = ReactDOM.createRoot(container);
  root.render(
    <IceNovaEffectEnhanced
      sourcePos={caster}
      targets={enemies}
      onComplete={() => {
        // Cleanup
        setTimeout(() => {
          root.unmount();
          if (container.parentNode) {
            container.parentNode.removeChild(container);
          }
        }, 100);
        
        if (onComplete) onComplete();
      }}
    />
  );
  
  // Return cleanup function
  return () => {
    root.unmount();
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  };
};

export default IceNovaEffectEnhanced;