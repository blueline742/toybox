import React, { useRef, useEffect, useState, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Box, Sphere, Ring, Plane } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Ultra-Realistic Frost Screen Overlay
 * Creates a window-frost effect with ice crystals forming
 */
const RealisticFrostOverlay = ({ intensity = 1, duration = 3000 }) => {
  const meshRef = useRef();
  const materialRef = useRef();
  const { viewport, camera } = useThree();
  const startTime = useRef(Date.now());
  
  // Create detailed frost texture with ice crystals
  const frostTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 2048;
    const ctx = canvas.getContext('2d');
    
    // Fill with slight blue tint
    ctx.fillStyle = 'rgba(200, 230, 255, 0.05)';
    ctx.fillRect(0, 0, 2048, 2048);
    
    // Create frost patterns from edges
    const createFrostPattern = (x, y, size, opacity) => {
      ctx.save();
      ctx.translate(x, y);
      
      // Main frost crystal
      for (let i = 0; i < 6; i++) {
        ctx.rotate(Math.PI / 3);
        
        // Main branch with gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, -size);
        gradient.addColorStop(0, `rgba(220, 240, 255, ${opacity})`);
        gradient.addColorStop(0.5, `rgba(200, 230, 255, ${opacity * 0.7})`);
        gradient.addColorStop(1, `rgba(180, 220, 255, 0)`);
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -size);
        ctx.stroke();
        
        // Side branches for dendrite effect
        for (let j = 1; j <= 4; j++) {
          const branchPos = -size * (j * 0.2);
          const branchLength = size * (0.4 - j * 0.08);
          
          ctx.beginPath();
          ctx.moveTo(0, branchPos);
          ctx.lineTo(-branchLength * 0.7, branchPos - branchLength * 0.5);
          ctx.moveTo(0, branchPos);
          ctx.lineTo(branchLength * 0.7, branchPos - branchLength * 0.5);
          ctx.strokeStyle = `rgba(220, 240, 255, ${opacity * (0.8 - j * 0.15)})`;
          ctx.lineWidth = 1.5 - j * 0.2;
          ctx.stroke();
        }
      }
      ctx.restore();
    };
    
    // Create frost accumulation from edges
    const edgePoints = [];
    // Top edge
    for (let i = 0; i < 30; i++) {
      edgePoints.push([Math.random() * 2048, Math.random() * 400]);
    }
    // Bottom edge
    for (let i = 0; i < 30; i++) {
      edgePoints.push([Math.random() * 2048, 2048 - Math.random() * 400]);
    }
    // Left edge
    for (let i = 0; i < 20; i++) {
      edgePoints.push([Math.random() * 400, Math.random() * 2048]);
    }
    // Right edge
    for (let i = 0; i < 20; i++) {
      edgePoints.push([2048 - Math.random() * 400, Math.random() * 2048]);
    }
    
    // Draw frost crystals
    edgePoints.forEach(([x, y]) => {
      const size = Math.random() * 50 + 20;
      const opacity = Math.random() * 0.3 + 0.2;
      createFrostPattern(x, y, size, opacity);
    });
    
    // Add scattered smaller crystals
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * 2048;
      const y = Math.random() * 2048;
      const distFromCenter = Math.sqrt(Math.pow(x - 1024, 2) + Math.pow(y - 1024, 2));
      const edgeFactor = distFromCenter / 1024;
      
      if (Math.random() < edgeFactor * 0.8) {
        const size = Math.random() * 20 + 5;
        const opacity = Math.random() * 0.2 + 0.1;
        createFrostPattern(x, y, size, opacity);
      }
    }
    
    // Add ice fog/mist effect
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * 2048;
      const y = Math.random() * 2048;
      const radius = Math.random() * 100 + 50;
      
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, 'rgba(220, 240, 255, 0.1)');
      gradient.addColorStop(0.5, 'rgba(200, 230, 255, 0.05)');
      gradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, []);
  
  // Create normal map for realistic ice refraction
  const normalMap = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    
    // Create ice surface normals
    const imageData = ctx.createImageData(1024, 1024);
    const data = imageData.data;
    
    for (let y = 0; y < 1024; y++) {
      for (let x = 0; x < 1024; x++) {
        const i = (y * 1024 + x) * 4;
        
        // Create bumpy ice surface
        const noise1 = Math.sin(x * 0.02) * Math.cos(y * 0.02);
        const noise2 = Math.sin(x * 0.05 + 2.5) * Math.cos(y * 0.05 + 2.5);
        const noise3 = Math.sin(x * 0.1 + 5) * Math.cos(y * 0.1 + 5);
        const combined = (noise1 * 0.5 + noise2 * 0.3 + noise3 * 0.2);
        
        // Convert to normal map colors
        data[i] = 128 + combined * 100;     // R
        data[i + 1] = 128 + Math.sin(combined * Math.PI) * 100; // G
        data[i + 2] = 255;                   // B (pointing out)
        data[i + 3] = 255;                   // A
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, []);
  
  useFrame(() => {
    if (!meshRef.current || !materialRef.current) return;
    
    const elapsed = Date.now() - startTime.current;
    const progress = Math.min(elapsed / duration, 1);
    
    // Phase 1: Frost spreads from edges (0-20%)
    if (progress < 0.2) {
      const spreadProgress = progress / 0.2;
      materialRef.current.opacity = spreadProgress * 1.0 * intensity; // Max opacity for visibility
      
      // Animate frost spreading inward
      const scale = 1.1 - (spreadProgress * 0.1);
      meshRef.current.scale.set(scale, scale, 1);
      
      // Increase distortion as frost forms
      if (materialRef.current.normalScale) {
        materialRef.current.normalScale.set(
          spreadProgress * 0.5,
          spreadProgress * 0.5
        );
      }
    }
    // Phase 2: Full frost effect (20-80%)
    else if (progress < 0.8) {
      materialRef.current.opacity = 1.0 * intensity; // Full opacity
      meshRef.current.scale.set(1, 1, 1);
      
      // Shimmer effect
      const shimmerTime = (progress - 0.2) / 0.6;
      materialRef.current.emissiveIntensity = 0.1 + Math.sin(shimmerTime * Math.PI * 6) * 0.05;
      
      // Subtle refraction changes
      if (materialRef.current.ior) {
        materialRef.current.ior = 1.31 + Math.sin(elapsed * 0.001) * 0.02;
      }
    }
    // Phase 3: Fade out (80-100%)
    else {
      const fadeProgress = (progress - 0.8) / 0.2;
      materialRef.current.opacity = 1.0 * intensity * (1 - fadeProgress); // Full opacity
      
      // Scale up slightly as it fades
      const fadeScale = 1 + (fadeProgress * 0.05);
      meshRef.current.scale.set(fadeScale, fadeScale, 1);
    }
    
    // Rotate texture very slowly for subtle movement
    if (materialRef.current.map) {
      materialRef.current.map.rotation = elapsed * 0.00002;
    }
  });
  
  return (
    <mesh 
      ref={meshRef} 
      position={[0, 0, 5]}
      renderOrder={9999}
    >
      <planeGeometry args={[viewport.width * 1.2, viewport.height * 1.2, 128, 128]} />
      <meshPhysicalMaterial
        ref={materialRef}
        map={frostTexture}
        normalMap={normalMap}
        normalScale={new THREE.Vector2(0, 0)}
        transparent
        opacity={0}
        side={THREE.DoubleSide}
        depthWrite={false}
        depthTest={false}
        emissive="#b3e5fc"
        emissiveIntensity={0.1}
        roughness={0.95}
        metalness={0.05}
        clearcoat={0.3}
        clearcoatRoughness={0.8}
        transmission={0.1}
        thickness={0.5}
        ior={1.31}
        blending={THREE.NormalBlending}
      />
    </mesh>
  );
};

/**
 * Realistic Ice Block Prison for Frozen Toys
 */
const RealisticIcePrison = ({ position, size = 1, delay = 0 }) => {
  const groupRef = useRef();
  const iceBlockRef = useRef();
  const innerIceRef = useRef();
  const cracksRef = useRef();
  const startTime = useRef(Date.now() + delay);
  const [visible, setVisible] = useState(false);
  
  // Create realistic ice block geometry with imperfections
  const iceGeometry = useMemo(() => {
    const geometry = new THREE.BoxGeometry(size * 2, size * 3, size * 2, 4, 6, 4);
    const positions = geometry.attributes.position.array;
    
    // Add realistic imperfections to the ice block
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const y = positions[i + 1];
      const z = positions[i + 2];
      
      // Add noise to vertices for natural ice look
      const noise = (Math.random() - 0.5) * 0.1 * size;
      positions[i] += noise;
      positions[i + 1] += noise * 0.5; // Less distortion vertically
      positions[i + 2] += noise;
      
      // Taper slightly at top and bottom
      const heightFactor = Math.abs(y) / (size * 1.5);
      positions[i] *= (1 - heightFactor * 0.1);
      positions[i + 2] *= (1 - heightFactor * 0.1);
    }
    
    geometry.computeVertexNormals();
    return geometry;
  }, [size]);
  
  // Create crack lines geometry
  const crackGeometry = useMemo(() => {
    const points = [];
    
    // Generate crack patterns
    for (let i = 0; i < 12; i++) {
      const startY = (Math.random() - 0.5) * size * 2.5;
      const startAngle = Math.random() * Math.PI * 2;
      const startX = Math.cos(startAngle) * size * 0.8;
      const startZ = Math.sin(startAngle) * size * 0.8;
      
      const endAngle = startAngle + (Math.random() - 0.5) * Math.PI * 0.5;
      const endRadius = size * (1.0 + Math.random() * 0.5);
      const endX = Math.cos(endAngle) * endRadius;
      const endY = startY + (Math.random() - 0.5) * size;
      const endZ = Math.sin(endAngle) * endRadius;
      
      // Main crack
      points.push(new THREE.Vector3(startX, startY, startZ));
      points.push(new THREE.Vector3(endX, endY, endZ));
      
      // Branch cracks
      if (Math.random() > 0.5) {
        const midX = (startX + endX) / 2;
        const midY = (startY + endY) / 2;
        const midZ = (startZ + endZ) / 2;
        
        const branchAngle = endAngle + (Math.random() - 0.5) * Math.PI * 0.3;
        const branchLength = size * (0.3 + Math.random() * 0.3);
        
        points.push(new THREE.Vector3(midX, midY, midZ));
        points.push(new THREE.Vector3(
          midX + Math.cos(branchAngle) * branchLength,
          midY + (Math.random() - 0.5) * branchLength * 0.5,
          midZ + Math.sin(branchAngle) * branchLength
        ));
      }
    }
    
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    return geometry;
  }, [size]);
  
  useFrame((state) => {
    if (!groupRef.current) return;
    
    const elapsed = Date.now() - startTime.current;
    if (elapsed < 0) return;
    
    if (!visible && elapsed >= 0) {
      setVisible(true);
    }
    
    const duration = 3000;
    const progress = Math.min(elapsed / duration, 1);
    
    // Phase 1: Ice forms rapidly (0-10%)
    if (progress < 0.1) {
      const formProgress = progress / 0.1;
      
      // Ice crystallizes from bottom to top
      const scaleY = formProgress;
      const scaleXZ = 0.5 + formProgress * 0.5;
      groupRef.current.scale.set(scaleXZ, scaleY, scaleXZ);
      
      if (iceBlockRef.current) {
        iceBlockRef.current.material.opacity = formProgress * 1.0; // Full opacity
      }
      if (innerIceRef.current) {
        innerIceRef.current.material.opacity = formProgress * 1.0; // Full opacity
      }
    }
    // Phase 2: Solid ice (10-85%)
    else if (progress < 0.85) {
      groupRef.current.scale.set(1, 1, 1);
      
      if (iceBlockRef.current) {
        iceBlockRef.current.material.opacity = 1.0; // Full opacity
        
        // Subtle breathing/pulsing
        const pulseTime = (progress - 0.1) / 0.75;
        const pulse = Math.sin(pulseTime * Math.PI * 3) * 0.02;
        groupRef.current.scale.set(1 + pulse, 1, 1 + pulse);
        
        // Shimmer effect
        iceBlockRef.current.material.emissiveIntensity = 0.1 + Math.sin(elapsed * 0.002) * 0.05;
      }
      
      // Show cracks forming over time
      if (cracksRef.current && progress > 0.5) {
        const crackProgress = (progress - 0.5) / 0.35;
        cracksRef.current.material.opacity = crackProgress * 0.7;
      }
    }
    // Phase 3: Ice shatters/melts (85-100%)
    else {
      const shatterProgress = (progress - 0.85) / 0.15;
      
      if (iceBlockRef.current) {
        // Ice becomes more transparent as it melts
        iceBlockRef.current.material.opacity = 0.85 * (1 - shatterProgress * 0.7);
        iceBlockRef.current.material.roughness = 0.3 + shatterProgress * 0.5;
        
        // Ice cracks and expands before shattering
        const shatterScale = 1 + shatterProgress * 0.15;
        groupRef.current.scale.set(shatterScale, 1 - shatterProgress * 0.2, shatterScale);
      }
      
      if (innerIceRef.current) {
        innerIceRef.current.material.opacity = 0.95 * (1 - shatterProgress);
      }
      
      if (cracksRef.current) {
        cracksRef.current.material.opacity = 0.7 * (1 - shatterProgress * 0.5);
      }
      
      // Add slight rotation as it breaks
      groupRef.current.rotation.y = shatterProgress * 0.1;
    }
    
    if (progress >= 1) {
      setVisible(false);
    }
  });
  
  if (!visible) return null;
  
  return (
    <group ref={groupRef} position={position}>
      {/* Main ice block */}
      <mesh ref={iceBlockRef} geometry={iceGeometry} castShadow receiveShadow>
        <meshPhysicalMaterial
          color="#e3f2fd"
          transparent
          opacity={0.9}
          metalness={0}
          roughness={0.3}
          transmission={0.9}
          thickness={2}
          envMapIntensity={1}
          clearcoat={1}
          clearcoatRoughness={0.1}
          ior={1.309} // Ice refractive index
          side={THREE.DoubleSide}
          emissive="#81d4fa"
          emissiveIntensity={0.1}
        />
      </mesh>
      
      {/* Inner frozen core (more opaque) */}
      <mesh ref={innerIceRef} scale={0.7}>
        <dodecahedronGeometry args={[size * 1.2, 1]} />
        <meshPhysicalMaterial
          color="#ffffff"
          transparent
          opacity={0.95}
          metalness={0}
          roughness={0.1}
          transmission={0.95}
          thickness={1}
          ior={1.45}
          emissive="#b3e5fc"
          emissiveIntensity={0.2}
        />
      </mesh>
      
      {/* Crack lines */}
      <lineSegments ref={cracksRef} geometry={crackGeometry}>
        <lineBasicMaterial
          color="#4fc3f7"
          transparent
          opacity={0}
          linewidth={2}
        />
      </lineSegments>
      
      {/* Frozen mist particles */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={30}
            array={new Float32Array(
              Array.from({ length: 90 }, () => 
                (Math.random() - 0.5) * size * 3
              )
            )}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.05}
          color="#ffffff"
          transparent
          opacity={0.6}
          sizeAttenuation={true}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
};

/**
 * Ice Nova Shockwave
 */
const IceShockwave = ({ position }) => {
  const ringRef = useRef();
  const startTime = useRef(Date.now());
  
  useFrame(() => {
    if (!ringRef.current) return;
    
    const elapsed = Date.now() - startTime.current;
    const progress = Math.min(elapsed / 1500, 1);
    
    // Expand outward horizontally
    const scale = 0.1 + progress * 10;
    ringRef.current.scale.set(scale, scale, 1);
    
    // Fade out - increased visibility
    ringRef.current.material.opacity = (1 - progress) * 1.0;
    
    // Rotate for dynamic effect
    ringRef.current.rotation.z += 0.02;
  });
  
  return (
    <mesh ref={ringRef} position={position} rotation={[0, 0, 0]}>
      <ringGeometry args={[0.8, 1.5, 64, 8]} />
      <meshStandardMaterial
        color="#00ffff"
        emissive="#00ffff"
        emissiveIntensity={5}
        transparent={true}
        opacity={1.0}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
};

/**
 * Main Scene Component
 */
const IceNovaScene = ({ sourcePos, targets, onComplete }) => {
  const { viewport } = useThree();
  
  // Convert screen coordinates to 3D
  const source3D = useMemo(() => {
    const pos = [
      ((sourcePos.x / window.innerWidth) - 0.5) * viewport.width,
      -((sourcePos.y / window.innerHeight) - 0.5) * viewport.height,
      0
    ];
    console.log('Source 3D position:', pos);
    return pos;
  }, [sourcePos, viewport]);
  
  const targets3D = useMemo(() => {
    const positions = targets.map(target => ({
      position: [
        ((target.x / window.innerWidth) - 0.5) * viewport.width,
        -((target.y / window.innerHeight) - 0.5) * viewport.height,
        0
      ],
      size: 0.6
    }));
    console.log('Targets 3D positions:', positions);
    return positions;
  }, [targets, viewport]);
  
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (onComplete) onComplete();
    }, 3000);
    
    return () => clearTimeout(timeout);
  }, [onComplete]);
  
  return (
    <>
      {/* Lighting - INCREASED for visibility */}
      <ambientLight intensity={2.0} color="#ffffff" />
      <pointLight position={source3D} intensity={5} color="#00ffff" distance={50} />
      <directionalLight position={[0, 0, 5]} intensity={3} color="#ffffff" />
      
      {/* Realistic Frost Overlay */}
      <RealisticFrostOverlay intensity={0.9} duration={3000} />
      
      {/* Shockwave */}
      <IceShockwave position={source3D} />
      
      {/* Ice Prisons for each target */}
      {targets3D.map((target, idx) => (
        <RealisticIcePrison
          key={`ice-prison-${idx}`}
          position={target.position}
          size={target.size}
          delay={100 + idx * 50}
        />
      ))}
      
      {/* Ice particles */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={200}
            array={new Float32Array(
              Array.from({ length: 600 }, (_, i) => {
                const angle = (i % 3 === 0) ? Math.random() * Math.PI * 2 : 0;
                const distance = (i % 3 === 0) ? Math.random() * 10 : 0;
                const height = (i % 3 === 1) ? (Math.random() - 0.5) * 10 : 0;
                
                if (i % 3 === 0) return source3D[0] + Math.cos(angle) * distance;
                if (i % 3 === 1) return source3D[1] + height;
                return source3D[2] + Math.sin(angle) * distance;
              })
            )}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.1}
          color="#ffffff"
          transparent
          opacity={0.8}
          sizeAttenuation={true}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </>
  );
};

/**
 * Portal wrapper
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
 * Main Realistic Ice Nova Effect
 */
const RealisticIceNovaEffect = ({ sourcePos, targets, onComplete }) => {
  console.log('RealisticIceNovaEffect rendering with:', { sourcePos, targets });
  
  return (
    <IceNovaPortal>
      <div style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 10000
      }}>
        <Canvas
          style={{ 
            width: '100%',
            height: '100%'
          }}
          camera={{ 
            position: [0, 0, 10],
            fov: 50,
            near: 0.1,
            far: 100
          }}
          gl={{ 
            alpha: true,
            antialias: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.2,
            powerPreference: "high-performance"
          }}
          dpr={[1, 2]}
        >
          <IceNovaScene 
            sourcePos={sourcePos}
            targets={targets}
            onComplete={onComplete}
          />
        </Canvas>
      </div>
    </IceNovaPortal>
  );
};

export default RealisticIceNovaEffect;