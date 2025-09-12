// ImagePyroblastEffect.jsx - Enhanced Pyroblast using preloaded images
import React, { useEffect, useRef } from 'react';
import assetPreloader from '../utils/AssetPreloader';

const ImagePyroblastEffect = ({ casterPos, targetPos, onComplete }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const projectileRef = useRef(null);
  const particlesRef = useRef([]);
  const trailRef = useRef([]);
  
  useEffect(() => {
    if (!casterPos || !targetPos) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Get preloaded images
    const fireballImage = assetPreloader.getImage('fireball');
    const explosionImage = assetPreloader.getImage('explosion');
    
    if (!fireballImage || !explosionImage) {
      console.error('Fireball or explosion image not loaded!');
      return;
    }
    
    // Initialize projectile
    projectileRef.current = {
      x: casterPos.x,
      y: casterPos.y,
      rotation: 0,
      scale: 0.5,
      progress: 0
    };
    
    // Initialize trail
    trailRef.current = [];
    
    // Animation variables
    let explosionFrame = -1;
    const explosionDuration = 30; // frames
    
    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update projectile position
      if (projectileRef.current && projectileRef.current.progress < 1) {
        const progress = projectileRef.current.progress;
        
        // Curved path for more dynamic movement
        const baseX = casterPos.x + (targetPos.x - casterPos.x) * progress;
        const baseY = casterPos.y + (targetPos.y - casterPos.y) * progress;
        
        // Add slight arc to trajectory
        const arcHeight = Math.sin(progress * Math.PI) * 50;
        
        projectileRef.current.x = baseX;
        projectileRef.current.y = baseY - arcHeight;
        projectileRef.current.rotation += 0.2; // Spin
        projectileRef.current.scale = 0.5 + Math.sin(progress * Math.PI) * 0.3; // Pulse
        
        // Add to trail
        trailRef.current.push({
          x: projectileRef.current.x,
          y: projectileRef.current.y,
          life: 1.0,
          scale: projectileRef.current.scale * 0.7
        });
        
        // Limit trail length
        if (trailRef.current.length > 20) {
          trailRef.current.shift();
        }
        
        // Update trail life
        trailRef.current.forEach(point => {
          point.life -= 0.05;
          point.scale *= 0.95;
        });
        
        // Remove dead trail points
        trailRef.current = trailRef.current.filter(p => p.life > 0);
        
        // Draw trail (using fireball image with decreasing opacity)
        trailRef.current.forEach((point, index) => {
          ctx.save();
          ctx.globalAlpha = point.life * 0.5;
          ctx.globalCompositeOperation = 'screen'; // Additive blending for glow
          
          const size = 64 * point.scale;
          ctx.translate(point.x, point.y);
          ctx.rotate(index * 0.1); // Vary rotation
          ctx.drawImage(
            fireballImage,
            -size/2, -size/2,
            size, size
          );
          ctx.restore();
        });
        
        // Create flame particles
        for (let i = 0; i < 3; i++) {
          particlesRef.current.push({
            x: projectileRef.current.x + (Math.random() - 0.5) * 20,
            y: projectileRef.current.y + (Math.random() - 0.5) * 20,
            vx: (Math.random() - 0.5) * 2,
            vy: Math.random() * 2 + 1,
            life: 1.0,
            scale: Math.random() * 0.5 + 0.3,
            rotation: Math.random() * Math.PI * 2
          });
        }
        
        // Draw main fireball with glow
        ctx.save();
        
        // Glow effect
        ctx.shadowBlur = 40;
        ctx.shadowColor = '#ff6600';
        
        // Position and rotation
        ctx.translate(projectileRef.current.x, projectileRef.current.y);
        ctx.rotate(projectileRef.current.rotation);
        
        // Additive blending for bright glow
        ctx.globalCompositeOperation = 'lighter';
        
        // Draw main fireball
        const mainSize = 128 * projectileRef.current.scale;
        ctx.drawImage(
          fireballImage,
          -mainSize/2, -mainSize/2,
          mainSize, mainSize
        );
        
        // Draw extra glow layer
        ctx.globalAlpha = 0.5;
        ctx.scale(1.3, 1.3);
        ctx.drawImage(
          fireballImage,
          -mainSize/2, -mainSize/2,
          mainSize, mainSize
        );
        
        ctx.restore();
        
        // Update progress
        projectileRef.current.progress += 0.015; // Speed - REDUCED BY HALF (was 0.03)
        
        // Check if hit target
        if (projectileRef.current.progress >= 1) {
          explosionFrame = 0;
          projectileRef.current = null;
          
          // Create explosion particles
          for (let i = 0; i < 30; i++) {
            const angle = (Math.PI * 2 * i) / 30;
            const speed = Math.random() * 5 + 3;
            particlesRef.current.push({
              x: targetPos.x,
              y: targetPos.y,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              life: 1.0,
              scale: Math.random() * 0.8 + 0.4,
              rotation: Math.random() * Math.PI * 2,
              isExplosion: true
            });
          }
        }
      }
      
      // Update and draw particles
      particlesRef.current = particlesRef.current.filter(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.2; // Gravity
        particle.life -= 0.02;
        particle.scale *= 0.98;
        particle.rotation += 0.1;
        
        if (particle.life > 0) {
          ctx.save();
          ctx.globalAlpha = particle.life;
          ctx.globalCompositeOperation = particle.isExplosion ? 'lighter' : 'screen';
          ctx.translate(particle.x, particle.y);
          ctx.rotate(particle.rotation);
          
          const size = (particle.isExplosion ? 48 : 32) * particle.scale;
          ctx.drawImage(
            fireballImage,
            -size/2, -size/2,
            size, size
          );
          ctx.restore();
        }
        
        return particle.life > 0;
      });
      
      // Draw explosion
      if (explosionFrame >= 0 && explosionFrame < explosionDuration) {
        ctx.save();
        
        // Explosion grows and fades
        const progress = explosionFrame / explosionDuration;
        const scale = 1.5 + progress * 3; // BIGGER! Grow from 1.5x to 4.5x (was 1x to 3x)
        const alpha = 1 - progress * 0.7; // Fade from 100% to 30% (stays visible longer)
        
        ctx.globalAlpha = alpha;
        ctx.globalCompositeOperation = 'screen';
        ctx.translate(targetPos.x, targetPos.y);
        ctx.scale(scale, scale);
        ctx.rotate(progress * Math.PI * 0.5); // Slight rotation
        
        // Draw explosion with glow
        ctx.shadowBlur = 80; // Bigger glow (was 60)
        ctx.shadowColor = '#ff0000';
        
        const explosionSize = 384; // BIGGER explosion (was 256)
        ctx.drawImage(
          explosionImage,
          -explosionSize/2, -explosionSize/2,
          explosionSize, explosionSize
        );
        
        // Extra bright core
        if (explosionFrame < 5) {
          ctx.globalAlpha = 1;
          ctx.globalCompositeOperation = 'lighter';
          ctx.scale(0.5, 0.5);
          ctx.drawImage(
            explosionImage,
            -explosionSize/2, -explosionSize/2,
            explosionSize, explosionSize
          );
        }
        
        ctx.restore();
        
        explosionFrame++;
        
        // Complete animation when explosion is done
        if (explosionFrame >= explosionDuration) {
          setTimeout(() => {
            if (onComplete) onComplete();
          }, 200);
        }
      }
      
      // Continue animation if needed
      if (projectileRef.current || particlesRef.current.length > 0 || explosionFrame < explosionDuration) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };
    
    // Start animation
    animate();
    
    // Play sound effect if available
    const pyroblastSound = assetPreloader.getAudio('pyroblast');
    if (pyroblastSound) {
      pyroblastSound.volume = 0.5;
      pyroblastSound.play().catch(e => console.log('Sound play failed:', e));
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [casterPos, targetPos, onComplete]);
  
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
        zIndex: 10000
      }}
    />
  );
};

export default ImagePyroblastEffect;