// IceCubeOverlay.jsx - Persistent ice cube overlay that watches frozen state
import React, { useEffect, useRef, useState } from 'react';
import assetPreloader from '../utils/AssetPreloader';
import { getElementCenter } from '../utils/mobilePositioning';

const IceCubeOverlay = ({ frozenCharacters }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const [iceCubes, setIceCubes] = useState(new Map());
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Set canvas size accounting for device pixel ratio
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    // Set the actual canvas size
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    // Scale the context to match device pixel ratio
    ctx.scale(dpr, dpr);
    
    // Set CSS size
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    
    // Get ice cube image
    const iceCubeImage = assetPreloader.getImage('icecube');
    const frost2Image = assetPreloader.getImage('frost2');
    
    if (!iceCubeImage) {
      console.error('Ice cube image not loaded!');
      return;
    }
    
    // Small delay to ensure DOM elements are rendered on mobile
    const setupTimeout = setTimeout(() => {
      // Update ice cubes based on frozen characters
      const newIceCubes = new Map();
      frozenCharacters.forEach((value, key) => {
        // Get character position directly from bounding rect for accuracy
        const element = document.getElementById(`char-${key}`);
        if (element) {
          const rect = element.getBoundingClientRect();
          const x = rect.left + rect.width / 2;
          const y = rect.top + rect.height / 2;
          
          // Mobile debugging
          console.log(`🧊 Mobile Debug - Found frozen character ${key} at (${x}, ${y})`);
          
          // Check if this is a new frozen character
          if (!iceCubes.has(key)) {
            newIceCubes.set(key, {
              x,
              y,
              scale: 0,
              rotation: 0,
              shimmerPhase: Math.random() * Math.PI * 2,
              animationTime: 0,
              startTime: Date.now()
            });
          } else {
            // Keep existing ice cube data but update position
            const existing = iceCubes.get(key);
            existing.x = x;
            existing.y = y;
            newIceCubes.set(key, existing);
          }
        } else {
          console.warn(`🧊 Mobile Debug - Could not find element for frozen character ${key}`);
        }
      });
      
      setIceCubes(newIceCubes);
      
      // Animation loop
      const animate = () => {
        // Clear with proper dimensions
        const dpr = window.devicePixelRatio || 1;
        ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
        
        // Draw all ice cubes
        newIceCubes.forEach((cube) => {
          // Animate scale up
          if (cube.scale < 1) {
            cube.scale = Math.min(cube.scale + 0.03, 1);
          }
          
          // Continuous animations (no rotation, just shimmer)
          // cube.rotation += 0.003; // Removed rotation
          cube.animationTime += 0.05;
          
          // Draw ice cube
          ctx.save();
          ctx.translate(cube.x, cube.y);
          // ctx.rotate(cube.rotation); // No rotation
          ctx.scale(cube.scale, cube.scale);
          
          // Main ice cube
          ctx.globalAlpha = 0.9;
          ctx.globalCompositeOperation = 'normal';
          
          // Responsive sizing - smaller on mobile
          const isMobile = window.innerWidth <= 768;
          const cubeSize = isMobile ? 120 : 220;
          ctx.drawImage(
            iceCubeImage,
            -cubeSize/2, -cubeSize/2,
            cubeSize, cubeSize
          );
          
          // Shimmer effect
          ctx.globalCompositeOperation = 'screen';
          ctx.globalAlpha = 0.3 + Math.sin(cube.animationTime + cube.shimmerPhase) * 0.2;
          ctx.drawImage(
            iceCubeImage,
            -cubeSize/2, -cubeSize/2,
            cubeSize, cubeSize
          );
          
          // Inner glow
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = 0.2;
          ctx.scale(0.8, 0.8);
          ctx.drawImage(
            iceCubeImage,
            -cubeSize/2, -cubeSize/2,
            cubeSize, cubeSize
          );
          
          ctx.restore();
          
          // Occasional frost particles
          if (frost2Image && Math.random() < 0.02) {
            const particleX = cube.x + (Math.random() - 0.5) * 100;
            const particleY = cube.y + (Math.random() - 0.5) * 100 - 20;
            
            ctx.save();
            ctx.globalAlpha = 0.4;
            ctx.globalCompositeOperation = 'screen';
            
            const particleSize = 20 + Math.random() * 30;
            ctx.drawImage(
              frost2Image,
              particleX - particleSize/2,
              particleY - particleSize/2,
              particleSize,
              particleSize
            );
            ctx.restore();
          }
        });
        
        // Continue animation if there are ice cubes
        if (newIceCubes.size > 0) {
          animationRef.current = requestAnimationFrame(animate);
        }
      };
      
      // Start animation if there are frozen characters
      if (newIceCubes.size > 0) {
        animate();
      }
    }, 100); // 100ms delay for mobile DOM rendering
    
    // Cleanup
    return () => {
      clearTimeout(setupTimeout);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [frozenCharacters]); // Re-run when frozen characters change
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Touch event support for mobile
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Prevent default touch behaviors on the canvas
    const preventDefaults = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };
    
    canvas.addEventListener('touchstart', preventDefaults, { passive: false });
    canvas.addEventListener('touchmove', preventDefaults, { passive: false });
    
    return () => {
      canvas.removeEventListener('touchstart', preventDefaults);
      canvas.removeEventListener('touchmove', preventDefaults);
    };
  }, []);
  
  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 10002, // Very high to be above everything
        // Mobile specific styles
        WebkitTransform: 'translateZ(0)', // Hardware acceleration
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden',
        perspective: 1000
      }}
    />
  );
};

export default IceCubeOverlay;