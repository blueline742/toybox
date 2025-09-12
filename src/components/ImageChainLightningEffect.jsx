// ImageChainLightningEffect.jsx - EPIC Chain Lightning using your lightning.png
import React, { useEffect, useRef } from 'react';
import assetPreloader from '../utils/AssetPreloader';

const ImageChainLightningEffect = ({ casterPos, targets, onComplete }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const lightningBoltsRef = useRef([]);
  const particlesRef = useRef([]);
  const electricArcsRef = useRef([]);
  const electrocutionEffectsRef = useRef([]); // New: sustained electrical effects on targets
  
  useEffect(() => {
    if (!casterPos || !targets || targets.length === 0) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Get preloaded lightning image
    const lightningImage = assetPreloader.getImage('lightning');
    
    if (!lightningImage) {
      console.error('Lightning image not loaded!');
      return;
    }
    
    // Create chain of positions (caster -> target1 -> target2 -> target3)
    const chain = [casterPos, ...targets];
    
    // Initialize lightning bolts between each position
    for (let i = 0; i < chain.length - 1; i++) {
      lightningBoltsRef.current.push({
        from: chain[i],
        to: chain[i + 1],
        segments: generateLightningPath(chain[i], chain[i + 1]),
        life: 0,
        maxLife: 180, // 3 seconds at 60fps (was 30-50)
        delay: i * 10, // Faster stagger
        active: false,
        brightness: 1,
        thickness: 2, // Thicker bolts
        pulsePhase: Math.random() * Math.PI * 2
      });
    }
    
    // Generate random lightning path between two points
    function generateLightningPath(from, to) {
      const segments = [];
      const steps = 12; // More segments for better detail
      
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const baseX = from.x + (to.x - from.x) * t;
        const baseY = from.y + (to.y - from.y) * t;
        
        // Add random offset for jagged effect (less at start/end)
        const offsetMagnitude = Math.sin(t * Math.PI) * 50; // Bigger jaggedness
        const offsetX = (Math.random() - 0.5) * offsetMagnitude;
        const offsetY = (Math.random() - 0.5) * offsetMagnitude;
        
        segments.push({
          x: baseX + offsetX,
          y: baseY + offsetY
        });
      }
      
      return segments;
    }
    
    // Create electric particles
    function createElectricParticles(x, y, count = 20) { // More particles
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
        const speed = Math.random() * 5 + 3; // Faster particles
        
        particlesRef.current.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          size: Math.random() * 20 + 10,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.3,
          type: 'spark'
        });
      }
    }
    
    // Create secondary arcs for more detail
    function createSecondaryArcs(mainBolt) {
      const arcs = [];
      const numArcs = 3 + Math.floor(Math.random() * 3);
      
      for (let i = 0; i < numArcs; i++) {
        const startIndex = Math.floor(Math.random() * (mainBolt.segments.length - 2)) + 1;
        const startPoint = mainBolt.segments[startIndex];
        
        // Create a shorter arc branching off
        const endPoint = {
          x: startPoint.x + (Math.random() - 0.5) * 100,
          y: startPoint.y + (Math.random() - 0.5) * 100
        };
        
        arcs.push({
          from: startPoint,
          to: endPoint,
          life: mainBolt.life,
          maxLife: mainBolt.maxLife * 0.7
        });
      }
      
      return arcs;
    }
    
    let frame = 0;
    let screenFlash = 0;
    let lastTime = performance.now();
    
    const animate = (currentTime) => {
      // Calculate delta time for frame-independent animation
      const deltaTime = Math.min((currentTime - lastTime) / 16.67, 2); // Cap at 2x speed
      lastTime = currentTime;
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Screen flash effect for impact
      if (screenFlash > 0) {
        ctx.save();
        ctx.globalAlpha = screenFlash;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
        screenFlash -= 0.05 * deltaTime;
      }
      
      // Update and draw main lightning bolts
      let allBoltsComplete = true;
      
      lightningBoltsRef.current.forEach((bolt, boltIndex) => {
        // Check if bolt should activate
        if (frame >= bolt.delay && !bolt.active) {
          bolt.active = true;
          bolt.segments = generateLightningPath(bolt.from, bolt.to); // Regenerate for variation
          
          // Create impact particles at target
          createElectricParticles(bolt.to.x, bolt.to.y, 30); // More impact particles
          
          // Also create particles at the caster
          if (boltIndex === 0) {
            createElectricParticles(bolt.from.x, bolt.from.y, 15);
          }
          
          // Create sustained electrocution effect on target
          electrocutionEffectsRef.current.push({
            x: bolt.to.x,
            y: bolt.to.y,
            life: 0,
            maxLife: 180, // 3 seconds of electrocution
            radius: 60,
            arcs: []
          });
          
          // Create secondary arcs
          electricArcsRef.current.push(...createSecondaryArcs(bolt));
          
          // Bigger screen flash on impact
          screenFlash = 0.5;
          
          // Play sound effect
          const lightningSound = assetPreloader.getAudio('chainlightning');
          if (lightningSound) {
            const audio = lightningSound.cloneNode();
            // FIX: Cap volume at 1.0 (was going over 1.0 and crashing)
            audio.volume = Math.min(0.3 + boltIndex * 0.1, 1.0); // Max volume is 1.0
            audio.playbackRate = Math.min(1 + boltIndex * 0.1, 2.0); // Cap pitch at 2x
            audio.play().catch(e => console.log('Sound play failed:', e));
          }
        }
        
        if (bolt.active) {
          bolt.life += deltaTime;
          
          if (bolt.life < bolt.maxLife) {
            allBoltsComplete = false;
            
            // Pulsing brightness effect
            const pulseSpeed = 0.15;
            bolt.brightness = 0.8 + Math.sin(bolt.life * pulseSpeed + bolt.pulsePhase) * 0.2;
            bolt.thickness = 1.5 + Math.sin(bolt.life * pulseSpeed * 0.7) * 0.5;
            
            // Regenerate segments frequently for constant electrical flow
            if (bolt.life % 2 === 0) {
              bolt.segments = generateLightningPath(bolt.from, bolt.to);
            }
            
            // Draw the lightning bolt using the image
            bolt.segments.forEach((segment, i) => {
              if (i === 0) return;
              
              const prevSegment = bolt.segments[i - 1];
              const dx = segment.x - prevSegment.x;
              const dy = segment.y - prevSegment.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              const angle = Math.atan2(dy, dx);
              
              // Draw multiple layers for glow effect
              for (let layer = 3; layer >= 0; layer--) {
                ctx.save();
                
                // Glow layers
                if (layer > 0) {
                  ctx.globalAlpha = 0.3 * bolt.brightness;
                  ctx.globalCompositeOperation = 'screen';
                } else {
                  // Core bright layer
                  ctx.globalAlpha = bolt.brightness;
                  ctx.globalCompositeOperation = 'lighter';
                }
                
                // Position and rotate for segment
                ctx.translate(prevSegment.x, prevSegment.y);
                ctx.rotate(angle);
                
                // Scale based on layer and thickness
                const scale = (layer + 1) * 0.7 * bolt.thickness; // Bigger scale
                const width = distance;
                const height = 50 * scale; // Much thicker lightning
                
                // Draw lightning image stretched between segments
                ctx.drawImage(
                  lightningImage,
                  0, -height/2,
                  width, height
                );
                
                ctx.restore();
              }
              
              // Add glow at segment points
              ctx.save();
              ctx.globalCompositeOperation = 'lighter';
              ctx.globalAlpha = bolt.brightness * 0.5;
              ctx.shadowBlur = 20;
              ctx.shadowColor = '#00ffff';
              
              const glowSize = 60 * bolt.thickness; // Bigger glow
              ctx.drawImage(
                lightningImage,
                segment.x - glowSize/2,
                segment.y - glowSize/2,
                glowSize, glowSize
              );
              ctx.restore();
            });
            
            // Draw electric orb at start and end
            [bolt.from, bolt.to].forEach((pos, index) => {
              ctx.save();
              ctx.globalCompositeOperation = 'lighter';
              ctx.globalAlpha = bolt.brightness;
              
              const orbSize = (index === 0 ? 80 : 120) * bolt.thickness; // Bigger orbs
              const pulseScale = 1 + Math.sin(bolt.life * 0.2) * 0.3; // More dramatic pulse
              
              ctx.translate(pos.x, pos.y);
              ctx.scale(pulseScale, pulseScale);
              ctx.rotate(bolt.life * 0.1);
              
              // Electric orb glow
              ctx.shadowBlur = 40;
              ctx.shadowColor = '#00ffff';
              
              ctx.drawImage(
                lightningImage,
                -orbSize/2, -orbSize/2,
                orbSize, orbSize
              );
              ctx.restore();
            });
          }
        }
      });
      
      // Draw secondary arcs
      electricArcsRef.current = electricArcsRef.current.filter(arc => {
        arc.life--;
        
        if (arc.life > 0 && arc.life < arc.maxLife) {
          ctx.save();
          ctx.globalAlpha = (arc.life / arc.maxLife) * 0.5;
          ctx.globalCompositeOperation = 'screen';
          ctx.strokeStyle = '#00ffff';
          ctx.lineWidth = 2;
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#00ffff';
          
          ctx.beginPath();
          ctx.moveTo(arc.from.x, arc.from.y);
          
          // Simple curved arc
          const midX = (arc.from.x + arc.to.x) / 2 + (Math.random() - 0.5) * 20;
          const midY = (arc.from.y + arc.to.y) / 2 + (Math.random() - 0.5) * 20;
          ctx.quadraticCurveTo(midX, midY, arc.to.x, arc.to.y);
          
          ctx.stroke();
          ctx.restore();
        }
        
        return arc.life > 0;
      });
      
      // Update and draw electrocution effects (sustained electricity on targets)
      electrocutionEffectsRef.current = electrocutionEffectsRef.current.filter(effect => {
        effect.life += deltaTime;
        
        if (effect.life < effect.maxLife) {
          // Generate random electric arcs around the target
          if (effect.life % 3 === 0) { // Create new arcs frequently
            const numArcs = 3 + Math.floor(Math.random() * 3);
            for (let i = 0; i < numArcs; i++) {
              const startAngle = Math.random() * Math.PI * 2;
              const endAngle = startAngle + (Math.random() - 0.5) * Math.PI;
              const startRadius = effect.radius * (0.5 + Math.random() * 0.5);
              const endRadius = effect.radius * (0.5 + Math.random() * 0.5);
              
              effect.arcs.push({
                startX: effect.x + Math.cos(startAngle) * startRadius,
                startY: effect.y + Math.sin(startAngle) * startRadius,
                endX: effect.x + Math.cos(endAngle) * endRadius,
                endY: effect.y + Math.sin(endAngle) * endRadius,
                life: 0,
                maxLife: 10 + Math.random() * 10
              });
            }
          }
          
          // Update and draw arcs
          effect.arcs = effect.arcs.filter(arc => {
            arc.life++;
            
            if (arc.life < arc.maxLife) {
              const alpha = (1 - arc.life / arc.maxLife) * 0.8;
              
              ctx.save();
              ctx.globalAlpha = alpha;
              ctx.globalCompositeOperation = 'lighter';
              
              // Draw electric arc using lightning image segments
              const segments = 5;
              for (let i = 0; i < segments; i++) {
                const t = i / (segments - 1);
                const wobble = Math.sin(effect.life * 0.3 + i) * 10;
                const x = arc.startX + (arc.endX - arc.startX) * t + wobble;
                const y = arc.startY + (arc.endY - arc.startY) * t + wobble;
                
                const arcSize = 30 * (1 - arc.life / arc.maxLife);
                ctx.drawImage(
                  lightningImage,
                  x - arcSize/2, y - arcSize/2,
                  arcSize, arcSize
                );
              }
              
              ctx.restore();
            }
            
            return arc.life < arc.maxLife;
          });
          
          // Draw central electric orb that pulses
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = 0.6 + Math.sin(effect.life * 0.2) * 0.4;
          
          const orbSize = 100 + Math.sin(effect.life * 0.15) * 20;
          ctx.translate(effect.x, effect.y);
          ctx.rotate(effect.life * 0.05);
          
          // Main orb
          ctx.shadowBlur = 50;
          ctx.shadowColor = '#00ffff';
          ctx.drawImage(
            lightningImage,
            -orbSize/2, -orbSize/2,
            orbSize, orbSize
          );
          
          // Inner bright core
          ctx.globalAlpha = 1;
          ctx.scale(0.5, 0.5);
          ctx.drawImage(
            lightningImage,
            -orbSize/2, -orbSize/2,
            orbSize, orbSize
          );
          
          ctx.restore();
          
          // Create sparks flying off
          if (effect.life % 5 === 0) {
            for (let i = 0; i < 3; i++) {
              const angle = Math.random() * Math.PI * 2;
              const speed = Math.random() * 4 + 2;
              particlesRef.current.push({
                x: effect.x,
                y: effect.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2, // Slight upward bias
                life: 1.0,
                size: Math.random() * 25 + 15,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.4,
                type: 'electrocution'
              });
            }
          }
        }
        
        return effect.life < effect.maxLife;
      });
      
      // Update and draw particles
      particlesRef.current = particlesRef.current.filter(particle => {
        particle.x += particle.vx * deltaTime;
        particle.y += particle.vy * deltaTime;
        particle.vx *= Math.pow(0.98, deltaTime); // Friction
        particle.vy *= Math.pow(0.98, deltaTime);
        particle.life -= 0.02 * deltaTime;
        particle.rotation += particle.rotationSpeed;
        particle.size *= 0.97;
        
        if (particle.life > 0) {
          ctx.save();
          ctx.globalAlpha = particle.life;
          ctx.globalCompositeOperation = 'lighter';
          ctx.translate(particle.x, particle.y);
          ctx.rotate(particle.rotation);
          
          // Draw spark using lightning image
          ctx.drawImage(
            lightningImage,
            -particle.size/2, -particle.size/2,
            particle.size, particle.size
          );
          
          ctx.restore();
        }
        
        return particle.life > 0;
      });
      
      frame++;
      
      // Continue animation if needed
      if (!allBoltsComplete || particlesRef.current.length > 0 || electricArcsRef.current.length > 0 || 
          electrocutionEffectsRef.current.length > 0 || screenFlash > 0) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // Animation complete
        setTimeout(() => {
          if (onComplete) onComplete();
        }, 200);
      }
    };
    
    // Start animation
    animate();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [casterPos, targets, onComplete]);
  
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

export default ImageChainLightningEffect;