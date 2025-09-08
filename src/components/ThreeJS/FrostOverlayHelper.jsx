import React, { useRef, useEffect, useMemo } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Reusable Frost Overlay Helper
 * Creates a realistic frost effect that spreads across the screen
 * 
 * @param {number} duration - Total duration in milliseconds (default: 2000)
 * @param {number} intensity - Frost intensity 0-1 (default: 1)
 * @param {number} fadeInTime - Time to fade in (default: 300ms)
 * @param {number} holdTime - Time to hold at full opacity (default: 500ms)
 * @param {Function} onComplete - Callback when effect completes
 */
export const FrostOverlay = ({ 
  duration = 2000,
  intensity = 1,
  fadeInTime = 300,
  holdTime = 500,
  onComplete
}) => {
  const meshRef = useRef();
  const materialRef = useRef();
  const { viewport } = useThree();
  const startTime = useRef(Date.now());
  
  // Create procedural frost texture with ice crystals
  const frostTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 2048;
    const ctx = canvas.getContext('2d');
    
    // Create gradient base from edges (window frost effect)
    const edgeGradient = ctx.createRadialGradient(1024, 1024, 0, 1024, 1024, 1450);
    edgeGradient.addColorStop(0, 'rgba(200, 230, 255, 0)');
    edgeGradient.addColorStop(0.5, 'rgba(180, 220, 255, 0.3)');
    edgeGradient.addColorStop(0.7, 'rgba(150, 200, 255, 0.6)');
    edgeGradient.addColorStop(1, 'rgba(120, 180, 255, 0.9)');
    ctx.fillStyle = edgeGradient;
    ctx.fillRect(0, 0, 2048, 2048);
    
    // Add corner frost accumulation
    const corners = [
      [0, 0], [2048, 0], [0, 2048], [2048, 2048]
    ];
    corners.forEach(([x, y]) => {
      const cornerGrad = ctx.createRadialGradient(x, y, 0, x, y, 800);
      cornerGrad.addColorStop(0, 'rgba(200, 230, 255, 0.8)');
      cornerGrad.addColorStop(0.5, 'rgba(180, 220, 255, 0.4)');
      cornerGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = cornerGrad;
      ctx.fillRect(0, 0, 2048, 2048);
    });
    
    // Create detailed ice crystal patterns
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    
    // Draw ice crystal dendrites
    for (let i = 0; i < 800; i++) {
      const x = Math.random() * 2048;
      const y = Math.random() * 2048;
      const size = Math.random() * 20 + 5;
      const opacity = Math.random() * 0.3 + 0.1;
      
      ctx.save();
      ctx.translate(x, y);
      ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
      
      // 6-pointed ice crystal
      for (let branch = 0; branch < 6; branch++) {
        ctx.rotate(Math.PI / 3);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -size);
        
        // Main branch
        ctx.stroke();
        
        // Sub-branches for dendrite effect
        for (let sub = 0; sub < 3; sub++) {
          const subPos = -size * (0.3 + sub * 0.2);
          const subSize = size * (0.3 - sub * 0.08);
          
          ctx.beginPath();
          ctx.moveTo(0, subPos);
          ctx.lineTo(-subSize, subPos - subSize * 0.5);
          ctx.moveTo(0, subPos);
          ctx.lineTo(subSize, subPos - subSize * 0.5);
          ctx.stroke();
        }
      }
      ctx.restore();
    }
    
    // Add fractal frost patterns using random walk
    ctx.strokeStyle = 'rgba(220, 240, 255, 0.08)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 50; i++) {
      ctx.beginPath();
      let x = Math.random() * 2048;
      let y = Math.random() * 2048;
      ctx.moveTo(x, y);
      
      for (let j = 0; j < 100; j++) {
        x += (Math.random() - 0.5) * 10;
        y += (Math.random() - 0.5) * 10;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    
    // Add noise for realistic texture
    const imageData = ctx.getImageData(0, 0, 2048, 2048);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = Math.random() * 20 - 10;
      data[i] = Math.min(255, Math.max(0, data[i] + noise));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
    }
    ctx.putImageData(imageData, 0, 0);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, []);
  
  // Create normal map for realistic ice refraction
  const normalMap = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // Create noise-based normal map
    for (let x = 0; x < 512; x++) {
      for (let y = 0; y < 512; y++) {
        const noise1 = Math.sin(x * 0.05) * Math.cos(y * 0.05);
        const noise2 = Math.sin(x * 0.1 + 1.5) * Math.cos(y * 0.1 + 1.5);
        const combined = (noise1 + noise2) * 0.5;
        
        const r = Math.floor(128 + combined * 127);
        const g = Math.floor(128 + Math.sin(combined * Math.PI) * 127);
        const b = 255;
        
        ctx.fillStyle = \`rgb(\${r}, \${g}, \${b})\`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, []);
  
  useEffect(() => {
    // Cleanup and callback
    const timeout = setTimeout(() => {
      if (onComplete) onComplete();
    }, duration);
    
    return () => clearTimeout(timeout);
  }, [duration, onComplete]);
  
  useFrame(() => {
    if (!meshRef.current || !materialRef.current) return;
    
    const elapsed = Date.now() - startTime.current;
    const fadeOutTime = duration - fadeInTime - holdTime;
    
    let opacity = 0;
    
    if (elapsed < fadeInTime) {
      // Fade in phase
      const progress = elapsed / fadeInTime;
      opacity = progress * intensity * 0.9;
      
      // Animate spread from edges to center
      const spreadScale = 1.2 - (progress * 0.2);
      meshRef.current.scale.set(spreadScale, spreadScale, 1);
      
      // Animate distortion for spreading effect
      materialRef.current.normalScale.set(progress * 0.3, progress * 0.3);
    } 
    else if (elapsed < fadeInTime + holdTime) {
      // Hold phase
      opacity = intensity * 0.9;
      meshRef.current.scale.set(1, 1, 1);
      
      // Shimmer effect during hold
      const shimmer = Math.sin(elapsed * 0.003) * 0.05;
      materialRef.current.emissiveIntensity = 0.1 + shimmer;
      materialRef.current.normalScale.set(0.3, 0.3);
    } 
    else if (elapsed < duration) {
      // Fade out phase
      const fadeProgress = (elapsed - fadeInTime - holdTime) / fadeOutTime;
      opacity = intensity * 0.9 * (1 - fadeProgress);
      
      // Scale up slightly while fading
      const fadeScale = 1 + (fadeProgress * 0.1);
      meshRef.current.scale.set(fadeScale, fadeScale, 1);
      
      // Reduce distortion
      materialRef.current.normalScale.set(0.3 * (1 - fadeProgress), 0.3 * (1 - fadeProgress));
    }
    
    materialRef.current.opacity = opacity;
    
    // Subtle animation of the frost texture
    if (materialRef.current.map) {
      materialRef.current.map.rotation = elapsed * 0.00005;
    }
  });
  
  return (
    <mesh 
      ref={meshRef} 
      position={[0, 0, 9]} 
      renderOrder={10000}
    >
      <planeGeometry args={[viewport.width * 1.1, viewport.height * 1.1, 64, 64]} />
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
        roughness={0.9}
        metalness={0}
        transmission={0.3}
        thickness={0.5}
        ior={1.31}
        blending={THREE.NormalBlending}
      />
    </mesh>
  );
};

/**
 * Helper function to apply frost overlay to any scene
 * Can be called from any component that has access to a Three.js scene
 * 
 * @param {number} duration - Total duration in milliseconds
 * @param {Object} options - Additional options for the frost effect
 * @returns {Function} Cleanup function to remove the effect early if needed
 */
export const applyFrostOverlay = (duration = 2000, options = {}) => {
  const {
    intensity = 1,
    fadeInTime = 300,
    holdTime = 500,
    onComplete = null
  } = options;
  
  // Create a container for the frost effect
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '0';
  container.style.width = '100vw';
  container.style.height = '100vh';
  container.style.pointerEvents = 'none';
  container.style.zIndex = '9998';
  container.className = 'frost-overlay-container';
  
  document.body.appendChild(container);
  
  // The component will be rendered via React portal
  // Return cleanup function
  return () => {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  };
};

export default FrostOverlay;