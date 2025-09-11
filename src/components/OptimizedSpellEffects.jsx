// OptimizedSpellEffects.jsx - Spell animations using AnimationManager and Three.js particles
import React, { useEffect, useRef } from 'react';
import animationManager from '../utils/AnimationManager';
import { getParticleSystem } from '../utils/ThreeParticleSystem';

const OptimizedSpellEffects = ({ spell, casterPos, targetPositions, onComplete }) => {
  const effectRef = useRef(null);
  const particleSystem = useRef(null);
  
  useEffect(() => {
    if (!spell || !casterPos || !targetPositions?.length) return;
    
    // Get particle system instance
    particleSystem.current = getParticleSystem();
    
    // Execute spell animation based on type
    switch (spell.type) {
      case 'projectile':
        animateProjectile();
        break;
      case 'beam':
        animateBeam();
        break;
      case 'aoe':
        animateAOE();
        break;
      case 'buff':
        animateBuff();
        break;
      case 'instant':
        animateInstant();
        break;
      default:
        animateGeneric();
    }
    
    return () => {
      // Cleanup if needed
      if (effectRef.current) {
        effectRef.current.remove();
      }
    };
  }, [spell, casterPos, targetPositions]);
  
  const animateProjectile = () => {
    // Create projectile element
    const projectile = document.createElement('div');
    projectile.className = 'spell-projectile animated transform-gpu';
    projectile.style.cssText = `
      position: fixed;
      width: 40px;
      height: 40px;
      background: radial-gradient(circle, ${spell.color || '#ff6b35'}, transparent);
      border-radius: 50%;
      pointer-events: none;
      z-index: 10000;
      will-change: transform, opacity;
      transform: translate3d(${casterPos.x}px, ${casterPos.y}px, 0);
    `;
    
    document.body.appendChild(projectile);
    effectRef.current = projectile;
    
    // Animate to each target sequentially
    let targetIndex = 0;
    const animateToNextTarget = () => {
      if (targetIndex >= targetPositions.length) {
        projectile.remove();
        if (onComplete) onComplete();
        return;
      }
      
      const target = targetPositions[targetIndex];
      const distance = Math.hypot(target.x - casterPos.x, target.y - casterPos.y);
      const duration = Math.min(300 + distance * 0.5, 600);
      
      // Use AnimationManager for smooth movement
      animationManager.animateElement(projectile, {
        x: target.x - casterPos.x,
        y: target.y - casterPos.y,
        duration,
        onComplete: () => {
          // Create impact particles
          particleSystem.current?.createHit({
            x: target.x - window.innerWidth / 2,
            y: -(target.y - window.innerHeight / 2),
            z: 0
          });
          
          // Play impact effect
          createImpactFlash(target);
          
          targetIndex++;
          animateToNextTarget();
        }
      });
    };
    
    animateToNextTarget();
  };
  
  const animateBeam = () => {
    targetPositions.forEach((target, index) => {
      const beam = document.createElement('div');
      beam.className = 'spell-beam animated transform-gpu';
      
      const dx = target.x - casterPos.x;
      const dy = target.y - casterPos.y;
      const distance = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      
      beam.style.cssText = `
        position: fixed;
        left: ${casterPos.x}px;
        top: ${casterPos.y}px;
        width: ${distance}px;
        height: 4px;
        background: linear-gradient(90deg, 
          transparent,
          ${spell.color || '#00ffff'} 20%,
          ${spell.color || '#00ffff'} 80%,
          transparent
        );
        transform-origin: 0 50%;
        transform: rotate(${angle}deg) scaleX(0);
        pointer-events: none;
        z-index: 10000;
        will-change: transform, opacity;
        box-shadow: 0 0 20px ${spell.color || '#00ffff'};
      `;
      
      document.body.appendChild(beam);
      
      // Animate beam extension
      animationManager.animateElement(beam, {
        scale: 1,
        duration: 200,
        onComplete: () => {
          // Create beam particles along the path
          const particleCount = Math.floor(distance / 20);
          for (let i = 0; i < particleCount; i++) {
            const progress = i / particleCount;
            particleSystem.current?.createSparkle({
              x: (casterPos.x + dx * progress) - window.innerWidth / 2,
              y: -((casterPos.y + dy * progress) - window.innerHeight / 2),
              z: 0
            });
          }
          
          // Fade out beam
          animationManager.animateElement(beam, {
            opacity: 0,
            duration: 300,
            onComplete: () => {
              beam.remove();
              if (index === targetPositions.length - 1 && onComplete) {
                onComplete();
              }
            }
          });
        }
      });
    });
  };
  
  const animateAOE = () => {
    targetPositions.forEach((target, index) => {
      const aoe = document.createElement('div');
      aoe.className = 'spell-aoe animated transform-gpu';
      aoe.style.cssText = `
        position: fixed;
        left: ${target.x - 75}px;
        top: ${target.y - 75}px;
        width: 150px;
        height: 150px;
        border: 3px solid ${spell.color || '#ff4500'};
        border-radius: 50%;
        pointer-events: none;
        z-index: 10000;
        will-change: transform, opacity;
        transform: scale(0);
        opacity: 0;
      `;
      
      document.body.appendChild(aoe);
      
      // Animate AOE expansion
      animationManager.animateElement(aoe, {
        scale: 1,
        opacity: 1,
        duration: 300,
        onComplete: () => {
          // Create explosion particles
          particleSystem.current?.createExplosion({
            x: target.x - window.innerWidth / 2,
            y: -(target.y - window.innerHeight / 2),
            z: 0
          });
          
          // Pulse and fade
          animationManager.animateElement(aoe, {
            scale: 1.2,
            opacity: 0,
            duration: 400,
            onComplete: () => {
              aoe.remove();
              if (index === targetPositions.length - 1 && onComplete) {
                onComplete();
              }
            }
          });
        }
      });
    });
  };
  
  const animateBuff = () => {
    targetPositions.forEach((target, index) => {
      // Create healing/buff particles
      particleSystem.current?.createHeal({
        x: target.x - window.innerWidth / 2,
        y: -(target.y - window.innerHeight / 2),
        z: 0
      });
      
      // Create visual aura
      const aura = document.createElement('div');
      aura.className = 'spell-buff animated transform-gpu';
      aura.style.cssText = `
        position: fixed;
        left: ${target.x - 60}px;
        top: ${target.y - 60}px;
        width: 120px;
        height: 120px;
        border-radius: 50%;
        background: radial-gradient(circle, 
          ${spell.color || '#00ff00'}40,
          transparent 70%
        );
        pointer-events: none;
        z-index: 10000;
        will-change: transform, opacity;
        transform: scale(0);
      `;
      
      document.body.appendChild(aura);
      
      // Animate aura
      animationManager.spring(aura.style, {
        to: { transform: 'scale(1)' },
        stiffness: 200,
        damping: 15,
        onComplete: () => {
          setTimeout(() => {
            animationManager.animateElement(aura, {
              opacity: 0,
              scale: 1.5,
              duration: 500,
              onComplete: () => {
                aura.remove();
                if (index === targetPositions.length - 1 && onComplete) {
                  onComplete();
                }
              }
            });
          }, 500);
        }
      });
    });
  };
  
  const animateInstant = () => {
    targetPositions.forEach((target, index) => {
      createImpactFlash(target);
      
      // Create hit particles
      particleSystem.current?.createHit({
        x: target.x - window.innerWidth / 2,
        y: -(target.y - window.innerHeight / 2),
        z: 0
      });
      
      if (index === targetPositions.length - 1 && onComplete) {
        setTimeout(onComplete, 300);
      }
    });
  };
  
  const animateGeneric = () => {
    // Default animation for unknown spell types
    targetPositions.forEach((target, index) => {
      particleSystem.current?.createSparkle({
        x: target.x - window.innerWidth / 2,
        y: -(target.y - window.innerHeight / 2),
        z: 0
      });
      
      if (index === targetPositions.length - 1 && onComplete) {
        setTimeout(onComplete, 500);
      }
    });
  };
  
  const createImpactFlash = (position) => {
    const flash = document.createElement('div');
    flash.className = 'spell-impact animated transform-gpu';
    flash.style.cssText = `
      position: fixed;
      left: ${position.x - 50}px;
      top: ${position.y - 50}px;
      width: 100px;
      height: 100px;
      background: radial-gradient(circle, white, transparent);
      border-radius: 50%;
      pointer-events: none;
      z-index: 10001;
      will-change: transform, opacity;
      animation: impact-flash 0.3s ease-out forwards;
    `;
    
    document.body.appendChild(flash);
    
    setTimeout(() => flash.remove(), 300);
  };
  
  // Add particle container if it doesn't exist
  useEffect(() => {
    if (!document.getElementById('particle-container')) {
      const container = document.createElement('div');
      container.id = 'particle-container';
      container.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 9999;
      `;
      document.body.appendChild(container);
    }
  }, []);
  
  return null; // This component manages DOM directly
};

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes impact-flash {
    0% {
      transform: scale(0);
      opacity: 1;
    }
    50% {
      transform: scale(1);
      opacity: 0.8;
    }
    100% {
      transform: scale(1.5);
      opacity: 0;
    }
  }
  
  .spell-projectile,
  .spell-beam,
  .spell-aoe,
  .spell-buff,
  .spell-impact {
    will-change: transform, opacity;
    contain: layout style paint;
  }
`;
document.head.appendChild(style);

export default OptimizedSpellEffects;