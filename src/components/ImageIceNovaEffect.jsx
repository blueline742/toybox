// ImageIceNovaEffect.jsx - EPIC Ice Nova using your frost images!
import React, { useEffect, useRef } from 'react';
import assetPreloader from '../utils/AssetPreloader';

const ImageIceNovaEffect = ({ casterPos, targets, onComplete }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const frostWaveRef = useRef(null);
  const iceParticlesRef = useRef([]);
  const frozenTargetsRef = useRef([]);
  const screenFrostRef = useRef({ opacity: 0, crystals: [] });
  const persistentCanvasRef = useRef(null); // Canvas for persistent ice cubes
  const keepIceCubesRef = useRef(true); // Keep ice cubes visible
  const onCompleteRef = useRef(onComplete);
  const hasCompletedRef = useRef(false);
  
  // Update ref when onComplete changes
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);
  
  useEffect(() => {
    console.log('🎯 ImageIceNovaEffect mounting with:', { casterPos, targets });
    if (!casterPos || !targets || targets.length === 0) {
      console.warn('❌ ImageIceNovaEffect - No casterPos or targets');
      return;
    }
    
    // Reset state for new animation
    hasCompletedRef.current = false;
    frozenTargetsRef.current = [];
    iceParticlesRef.current = [];
    
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error('❌ ImageIceNovaEffect - No canvas ref');
      return;
    }
    
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Get preloaded frost images
    const frost1Image = assetPreloader.getImage('frost1');
    const frost2Image = assetPreloader.getImage('frost2');
    const iceCubeImage = assetPreloader.getImage('icecube');
    
    if (!frost1Image || !frost2Image || !iceCubeImage) {
      console.error('Frost images not loaded!');
      return;
    }
    
    // Initialize frost wave
    frostWaveRef.current = {
      x: casterPos.x,
      y: casterPos.y,
      radius: 0,
      maxRadius: Math.max(...targets.map(t => {
        const dx = t.x - casterPos.x;
        const dy = t.y - casterPos.y;
        return Math.sqrt(dx * dx + dy * dy);
      })) + 300, // Extra radius for visual effect
      life: 0,
      maxLife: 120 // 2 seconds at 60fps - SLOWER and more dramatic
    };
    
    // Initialize frozen target states
    targets.forEach(target => {
      frozenTargetsRef.current.push({
        x: target.x,
        y: target.y,
        frozen: false,
        freezeAnimation: 0,
        iceCubeScale: 0,
        iceCubeRotation: 0,
        shimmerPhase: Math.random() * Math.PI * 2
      });
    });
    
    // Create initial burst of ice particles from caster
    for (let i = 0; i < 80; i++) { // MORE particles
      const angle = (Math.PI * 2 * i) / 80;
      const speed = Math.random() * 10 + 6; // FASTER particles
      iceParticlesRef.current.push({
        x: casterPos.x,
        y: casterPos.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        size: Math.random() * 60 + 30, // BIGGER particles
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2,
        image: Math.random() > 0.5 ? frost1Image : frost2Image,
        type: 'burst'
      });
    }
    
    // Initialize screen frost crystals
    for (let i = 0; i < 40; i++) { // MORE screen frost
      screenFrostRef.current.crystals.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 200 + 100, // BIGGER frost crystals
        rotation: Math.random() * Math.PI * 2,
        opacity: 0,
        targetOpacity: Math.random() * 0.5 + 0.2, // MORE visible frost
        growthRate: Math.random() * 0.02 + 0.01
      });
    }
    
    let lastTime = performance.now();
    console.log('✅ Ice Nova animation ready to start');
    
    const animate = (currentTime) => {
      // Calculate delta time for smooth animation
      const deltaTime = Math.min((currentTime - lastTime) / 16.67, 2);
      lastTime = currentTime;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update and draw frost wave
      if (frostWaveRef.current) {
        const wave = frostWaveRef.current;
        wave.life += deltaTime;
        wave.radius = (wave.life / wave.maxLife) * wave.maxRadius;
        
        // Draw expanding frost ring
        const waveAlpha = 1 - (wave.life / wave.maxLife);
        if (waveAlpha > 0) {
          ctx.save();
          ctx.globalAlpha = waveAlpha * 0.6;
          ctx.globalCompositeOperation = 'screen';
          
          // Draw multiple frost rings for depth
          for (let ring = 0; ring < 3; ring++) {
            const ringRadius = wave.radius - ring * 20;
            if (ringRadius > 0) {
              const ringSize = 100;
              const numSegments = Math.floor((2 * Math.PI * ringRadius) / 50);
              
              for (let i = 0; i < numSegments; i++) {
                const angle = (2 * Math.PI * i) / numSegments;
                const x = wave.x + Math.cos(angle) * ringRadius;
                const y = wave.y + Math.sin(angle) * ringRadius;
                
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(angle + wave.life * 0.05);
                ctx.globalAlpha = waveAlpha * (0.8 - ring * 0.2);
                
                // Alternate between frost1 and frost2 images
                const frostImage = i % 2 === 0 ? frost1Image : frost2Image;
                ctx.drawImage(
                  frostImage,
                  -ringSize/2, -ringSize/2,
                  ringSize, ringSize
                );
                ctx.restore();
              }
            }
          }
          
          ctx.restore();
        }
        
        // Check if wave reached targets and freeze them
        frozenTargetsRef.current.forEach(target => {
          const dx = target.x - wave.x;
          const dy = target.y - wave.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (!target.frozen && distance < wave.radius) {
            target.frozen = true;
            
            // Create freeze impact particles
            for (let i = 0; i < 15; i++) {
              const angle = Math.random() * Math.PI * 2;
              const speed = Math.random() * 4 + 2;
              iceParticlesRef.current.push({
                x: target.x,
                y: target.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 3, // Upward bias
                life: 1.0,
                size: Math.random() * 30 + 15,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.3,
                image: Math.random() > 0.5 ? frost1Image : frost2Image,
                type: 'freeze'
              });
            }
            
            // Trigger screen frost effect - MORE intense
            screenFrostRef.current.opacity = 0.8;
          }
        });
        
        if (wave.life >= wave.maxLife) {
          frostWaveRef.current = null;
        }
      }
      
      // Update and draw frozen targets with ice cubes
      frozenTargetsRef.current.forEach(target => {
        if (target.frozen) {
          // Animate ice cube appearance - SLOWER scaling
          target.iceCubeScale = Math.min(target.iceCubeScale + 0.03 * deltaTime, 1.2); // Scale to 1.2x for more impact
          target.iceCubeRotation += 0.005 * deltaTime; // Slower rotation
          target.freezeAnimation += 0.05 * deltaTime; // Slower shimmer
          
          // Draw ice cube around target
          ctx.save();
          ctx.translate(target.x, target.y);
          ctx.rotate(target.iceCubeRotation);
          ctx.scale(target.iceCubeScale, target.iceCubeScale);
          
          // Ice cube with shimmer effect
          ctx.globalAlpha = 0.9;
          ctx.globalCompositeOperation = 'normal';
          
          // Main ice cube - BIGGER
          const cubeSize = 150;
          ctx.drawImage(
            iceCubeImage,
            -cubeSize/2, -cubeSize/2,
            cubeSize, cubeSize
          );
          
          // Shimmer overlay
          ctx.globalCompositeOperation = 'screen';
          ctx.globalAlpha = 0.3 + Math.sin(target.freezeAnimation + target.shimmerPhase) * 0.2;
          ctx.drawImage(
            iceCubeImage,
            -cubeSize/2, -cubeSize/2,
            cubeSize, cubeSize
          );
          
          // Frozen mist around ice cube
          if (Math.random() < 0.3) {
            const mistX = (Math.random() - 0.5) * cubeSize;
            const mistY = (Math.random() - 0.5) * cubeSize;
            iceParticlesRef.current.push({
              x: target.x + mistX,
              y: target.y + mistY,
              vx: (Math.random() - 0.5) * 1,
              vy: -Math.random() * 2 - 1,
              life: 1.0,
              size: Math.random() * 20 + 10,
              rotation: Math.random() * Math.PI * 2,
              rotationSpeed: (Math.random() - 0.5) * 0.1,
              image: frost2Image,
              type: 'mist'
            });
          }
          
          ctx.restore();
        }
      });
      
      // Update and draw ice particles
      iceParticlesRef.current = iceParticlesRef.current.filter(particle => {
        particle.x += particle.vx * deltaTime;
        particle.y += particle.vy * deltaTime;
        particle.vy += 0.2 * deltaTime; // Gravity
        particle.vx *= Math.pow(0.98, deltaTime);
        particle.vy *= Math.pow(0.98, deltaTime);
        particle.life -= 0.015 * deltaTime;
        particle.rotation += particle.rotationSpeed * deltaTime;
        particle.size *= Math.pow(0.98, deltaTime);
        
        if (particle.life > 0) {
          ctx.save();
          ctx.globalAlpha = particle.life * (particle.type === 'mist' ? 0.5 : 0.8);
          ctx.globalCompositeOperation = particle.type === 'mist' ? 'screen' : 'normal';
          ctx.translate(particle.x, particle.y);
          ctx.rotate(particle.rotation);
          
          const size = particle.size;
          ctx.drawImage(
            particle.image,
            -size/2, -size/2,
            size, size
          );
          ctx.restore();
        }
        
        return particle.life > 0;
      });
      
      // Draw screen frost overlay
      if (screenFrostRef.current.opacity > 0) {
        screenFrostRef.current.opacity -= 0.001 * deltaTime; // SLOWER fade
        
        // Update and draw frost crystals on screen edges
        screenFrostRef.current.crystals.forEach(crystal => {
          crystal.opacity = Math.min(crystal.opacity + crystal.growthRate * deltaTime, crystal.targetOpacity);
          
          ctx.save();
          ctx.globalAlpha = crystal.opacity * screenFrostRef.current.opacity;
          ctx.globalCompositeOperation = 'screen';
          ctx.translate(crystal.x, crystal.y);
          ctx.rotate(crystal.rotation);
          
          // Draw frost crystal
          ctx.drawImage(
            frost1Image,
            -crystal.size/2, -crystal.size/2,
            crystal.size, crystal.size
          );
          
          // Add shimmer
          ctx.globalAlpha *= 0.5;
          ctx.scale(1.2, 1.2);
          ctx.drawImage(
            frost2Image,
            -crystal.size/2, -crystal.size/2,
            crystal.size, crystal.size
          );
          
          ctx.restore();
        });
        
        // Frosty vignette effect
        ctx.save();
        ctx.globalAlpha = screenFrostRef.current.opacity * 0.3;
        ctx.globalCompositeOperation = 'multiply';
        
        // Create radial gradient for vignette
        const gradient = ctx.createRadialGradient(
          canvas.width/2, canvas.height/2, 0,
          canvas.width/2, canvas.height/2, Math.max(canvas.width, canvas.height)/2
        );
        gradient.addColorStop(0, 'rgba(200, 230, 255, 0)');
        gradient.addColorStop(0.5, 'rgba(150, 200, 255, 0.2)');
        gradient.addColorStop(1, 'rgba(100, 150, 255, 0.5)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
      }
      
      // Continue animation if needed
      const hasActiveEffects = frostWaveRef.current || 
                              iceParticlesRef.current.length > 0 || 
                              screenFrostRef.current.opacity > 0 ||
                              frozenTargetsRef.current.some(t => t.frozen && t.iceCubeScale < 1);
      
      if (hasActiveEffects) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // Animation complete but keep ice cubes visible
        if (frozenTargetsRef.current.some(t => t.frozen) && keepIceCubesRef.current) {
          // Continue drawing just the ice cubes on persistent canvas
          drawPersistentIceCubes();
        }
        // Notify completion but don't remove ice cubes yet
        if (!hasCompletedRef.current && onCompleteRef.current) {
          hasCompletedRef.current = true;
          onCompleteRef.current();
        }
      }
    };
    
    // Draw persistent ice cubes that stay visible
    const drawPersistentIceCubes = () => {
      // Use a separate persistent rendering loop for ice cubes
      const persistCanvas = persistentCanvasRef.current || canvasRef.current;
      if (!persistCanvas) return;
      
      const persistCtx = persistCanvas.getContext('2d');
      
      const drawCubes = () => {
        if (!keepIceCubesRef.current) return;
        
        persistCtx.clearRect(0, 0, persistCanvas.width, persistCanvas.height);
        
        frozenTargetsRef.current.forEach(target => {
          if (target.frozen) {
            persistCtx.save();
            persistCtx.translate(target.x, target.y);
            persistCtx.globalAlpha = 0.9;
            
            // Slight rotation animation even while frozen
            target.iceCubeRotation += 0.002;
            persistCtx.rotate(target.iceCubeRotation);
            
            // Shimmer effect continues
            target.freezeAnimation += 0.02;
            const shimmerAlpha = 0.7 + Math.sin(target.freezeAnimation + target.shimmerPhase) * 0.3;
            persistCtx.globalAlpha = shimmerAlpha;
            
            const cubeSize = 150; // Keep bigger size
            persistCtx.drawImage(
              iceCubeImage,
              -cubeSize/2, -cubeSize/2,
              cubeSize, cubeSize
            );
            
            persistCtx.restore();
          }
        });
        
        // Continue animating ice cubes
        if (keepIceCubesRef.current) {
          requestAnimationFrame(drawCubes);
        }
      };
      
      drawCubes();
    };
    
    // Start animation
    animate(performance.now());
    
    // Play freeze sound effect if available
    const freezeSound = assetPreloader.getAudio('freeze');
    if (freezeSound) {
      freezeSound.volume = 0.5;
      freezeSound.play().catch(e => console.log('Sound play failed:', e));
    }
    
    // Cleanup function
    return () => {
      keepIceCubesRef.current = false; // Stop persistent ice cube rendering
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
    
    // Add external control to remove ice cubes after freeze duration
    // This will be called from WizardEffects after 3 seconds
  }, [casterPos, targets]); // Removed onComplete from dependencies to prevent re-renders
  
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

export default ImageIceNovaEffect;