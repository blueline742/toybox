// PersistentIceCubes.jsx - Keeps ice cubes visible on frozen targets
import React, { useEffect, useRef } from 'react';
import assetPreloader from '../utils/AssetPreloader';

const PersistentIceCubes = ({ frozenTargets, duration = 15000 }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const activeRef = useRef(true);
  
  useEffect(() => {
    if (!frozenTargets || frozenTargets.length === 0) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Get ice cube image
    const iceCubeImage = assetPreloader.getImage('icecube');
    const frost2Image = assetPreloader.getImage('frost2');
    
    if (!iceCubeImage) {
      console.error('Ice cube image not loaded!');
      return;
    }
    
    // Initialize frozen target data with current positions
    const targets = frozenTargets.map(target => ({
      x: target.x,
      y: target.y,
      rotation: 0,
      shimmerPhase: Math.random() * Math.PI * 2,
      animationTime: 0,
      scale: 0
    }));
    
    const startTime = Date.now();
    activeRef.current = true;
    
    const animate = () => {
      if (!activeRef.current) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const elapsed = Date.now() - startTime;
      
      // Check if we should continue
      if (elapsed >= duration) {
        activeRef.current = false;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }
      
      // Calculate fade for the last 1 second
      let globalAlpha = 1;
      const fadeStartTime = duration - 1000;
      if (elapsed > fadeStartTime) {
        globalAlpha = 1 - ((elapsed - fadeStartTime) / 1000);
      }
      
      // Draw each ice cube
      targets.forEach(target => {
        // Animate scale up
        if (target.scale < 1) {
          target.scale = Math.min(target.scale + 0.03, 1);
        }
        
        // Continuous animations
        target.rotation += 0.003;
        target.animationTime += 0.05;
        
        // Draw main ice cube
        ctx.save();
        ctx.translate(target.x, target.y);
        ctx.rotate(target.rotation);
        ctx.scale(target.scale, target.scale);
        ctx.globalAlpha = globalAlpha * 0.9;
        
        const cubeSize = 150;
        
        // Main ice cube
        ctx.globalCompositeOperation = 'normal';
        ctx.drawImage(
          iceCubeImage,
          -cubeSize/2, -cubeSize/2,
          cubeSize, cubeSize
        );
        
        // Shimmer effect
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = globalAlpha * (0.3 + Math.sin(target.animationTime + target.shimmerPhase) * 0.2);
        ctx.drawImage(
          iceCubeImage,
          -cubeSize/2, -cubeSize/2,
          cubeSize, cubeSize
        );
        
        // Inner bright core
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = globalAlpha * 0.2;
        ctx.scale(0.8, 0.8);
        ctx.drawImage(
          iceCubeImage,
          -cubeSize/2, -cubeSize/2,
          cubeSize, cubeSize
        );
        
        ctx.restore();
        
        // Occasional frost particles
        if (frost2Image && Math.random() < 0.05 && globalAlpha > 0.5) {
          const particleX = target.x + (Math.random() - 0.5) * 100;
          const particleY = target.y + (Math.random() - 0.5) * 100 - 20;
          
          ctx.save();
          ctx.globalAlpha = globalAlpha * 0.4;
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
      
      // Continue animation
      if (activeRef.current) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };
    
    // Start animation loop
    animate();
    
    // Cleanup
    return () => {
      activeRef.current = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [frozenTargets, duration]);
  
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
        zIndex: 10001 // Above everything
      }}
    />
  );
};

export default PersistentIceCubes;