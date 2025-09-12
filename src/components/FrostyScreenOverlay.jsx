// FrostyScreenOverlay.jsx - Persistent frosty screen effect after Ice Nova
import React, { useEffect, useRef, useState } from 'react';
import assetPreloader from '../utils/AssetPreloader';

const FrostyScreenOverlay = ({ triggerEffect, duration = 5000 }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const [isActive, setIsActive] = useState(false);
  const startTimeRef = useRef(null);
  const frostParticlesRef = useRef([]);
  
  useEffect(() => {
    if (!triggerEffect) return;
    
    // Start the frosty effect
    setIsActive(true);
    startTimeRef.current = Date.now();
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Get frost2 image
    const frost2Image = assetPreloader.getImage('frost2');
    if (!frost2Image) {
      console.error('Frost2 image not loaded!');
      return;
    }
    
    // Initialize frost particles for screen edges
    const numParticles = 30;
    frostParticlesRef.current = [];
    
    // Top edge particles
    for (let i = 0; i < numParticles / 4; i++) {
      frostParticlesRef.current.push({
        x: Math.random() * canvas.width,
        y: Math.random() * 100,
        size: 50 + Math.random() * 100,
        opacity: 0,
        targetOpacity: 0.3 + Math.random() * 0.4,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.01,
        growthRate: Math.random() * 0.5 + 0.5,
        shimmerPhase: Math.random() * Math.PI * 2
      });
    }
    
    // Bottom edge particles
    for (let i = 0; i < numParticles / 4; i++) {
      frostParticlesRef.current.push({
        x: Math.random() * canvas.width,
        y: canvas.height - Math.random() * 100,
        size: 50 + Math.random() * 100,
        opacity: 0,
        targetOpacity: 0.3 + Math.random() * 0.4,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.01,
        growthRate: Math.random() * 0.5 + 0.5,
        shimmerPhase: Math.random() * Math.PI * 2
      });
    }
    
    // Left edge particles
    for (let i = 0; i < numParticles / 4; i++) {
      frostParticlesRef.current.push({
        x: Math.random() * 100,
        y: Math.random() * canvas.height,
        size: 50 + Math.random() * 100,
        opacity: 0,
        targetOpacity: 0.3 + Math.random() * 0.4,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.01,
        growthRate: Math.random() * 0.5 + 0.5,
        shimmerPhase: Math.random() * Math.PI * 2
      });
    }
    
    // Right edge particles
    for (let i = 0; i < numParticles / 4; i++) {
      frostParticlesRef.current.push({
        x: canvas.width - Math.random() * 100,
        y: Math.random() * canvas.height,
        size: 50 + Math.random() * 100,
        opacity: 0,
        targetOpacity: 0.3 + Math.random() * 0.4,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.01,
        growthRate: Math.random() * 0.5 + 0.5,
        shimmerPhase: Math.random() * Math.PI * 2
      });
    }
    
    // Corner frost clusters
    const corners = [
      { x: 0, y: 0 },
      { x: canvas.width, y: 0 },
      { x: 0, y: canvas.height },
      { x: canvas.width, y: canvas.height }
    ];
    
    corners.forEach(corner => {
      for (let i = 0; i < 3; i++) {
        frostParticlesRef.current.push({
          x: corner.x + (Math.random() - 0.5) * 200,
          y: corner.y + (Math.random() - 0.5) * 200,
          size: 100 + Math.random() * 150,
          opacity: 0,
          targetOpacity: 0.4 + Math.random() * 0.3,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.008,
          growthRate: Math.random() * 0.3 + 0.7,
          shimmerPhase: Math.random() * Math.PI * 2,
          isCorner: true
        });
      }
    });
    
    let animationTime = 0;
    
    const animate = () => {
      if (!isActive) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const elapsed = Date.now() - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      
      // Calculate global fade
      let globalFade = 1;
      if (progress > 0.7) {
        // Start fading out in last 30% of duration
        globalFade = 1 - ((progress - 0.7) / 0.3);
      }
      
      animationTime += 0.02;
      
      // Draw vignette effect (darkened edges)
      const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) / 2
      );
      gradient.addColorStop(0, 'rgba(173, 216, 230, 0)');
      gradient.addColorStop(0.7, 'rgba(173, 216, 230, 0.05)');
      gradient.addColorStop(1, `rgba(173, 216, 230, ${0.2 * globalFade})`);
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw frost particles
      frostParticlesRef.current.forEach(particle => {
        // Animate opacity in
        if (particle.opacity < particle.targetOpacity) {
          particle.opacity = Math.min(particle.opacity + 0.01, particle.targetOpacity);
        }
        
        // Animate rotation
        particle.rotation += particle.rotationSpeed;
        
        // Shimmer effect
        const shimmer = Math.sin(animationTime * 2 + particle.shimmerPhase) * 0.2;
        
        ctx.save();
        ctx.translate(particle.x, particle.y);
        ctx.rotate(particle.rotation);
        
        // Calculate final opacity with global fade
        const finalOpacity = particle.opacity * globalFade * (1 + shimmer);
        
        // Main frost texture
        ctx.globalAlpha = finalOpacity;
        ctx.globalCompositeOperation = 'screen';
        
        const size = particle.size * (particle.isCorner ? 1.5 : 1);
        ctx.drawImage(
          frost2Image,
          -size / 2, -size / 2,
          size, size
        );
        
        // Add extra glow for corner particles
        if (particle.isCorner) {
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = finalOpacity * 0.3;
          ctx.scale(1.2, 1.2);
          ctx.drawImage(
            frost2Image,
            -size / 2, -size / 2,
            size, size
          );
        }
        
        ctx.restore();
        
        // Slowly drift particles
        particle.x += Math.sin(animationTime + particle.shimmerPhase) * 0.2;
        particle.y += Math.cos(animationTime + particle.shimmerPhase) * 0.1;
      });
      
      // Add subtle ice crystal sparkles
      if (Math.random() < 0.1 && globalFade > 0.5) {
        ctx.save();
        const sparkleX = Math.random() * canvas.width;
        const sparkleY = Math.random() * canvas.height;
        
        ctx.globalAlpha = globalFade * 0.8;
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = '#ffffff';
        
        // Draw cross sparkle
        ctx.fillRect(sparkleX - 20, sparkleY - 1, 40, 2);
        ctx.fillRect(sparkleX - 1, sparkleY - 20, 2, 40);
        
        ctx.restore();
      }
      
      // Continue animation or cleanup
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // Effect complete
        setIsActive(false);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
    
    // Start animation
    animate();
    
    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      setIsActive(false);
    };
  }, [triggerEffect, duration]);
  
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
        zIndex: 9999 // High but below ice cubes
      }}
    />
  );
};

export default FrostyScreenOverlay;