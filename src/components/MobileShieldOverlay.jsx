// MobileShieldOverlay.jsx - Canvas-based shield overlay for accurate mobile positioning
import React, { useEffect, useRef } from 'react';
import { getElementCenter } from '../utils/mobilePositioning';
import assetPreloader from '../utils/AssetPreloader';

const MobileShieldOverlay = ({ shieldedCharacters }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const lightningPathsRef = useRef(new Map()); // Store lightning paths per character
  const lastLightningUpdateRef = useRef(0);
  
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
    
    // Get the neon shield image
    const shieldImage = assetPreloader.getImage('shield-neon');
    if (!shieldImage) {
      console.warn('Shield neon image not loaded yet');
    }
    const time = Date.now() / 1000;
    
    const animate = () => {
      // Clear with proper dimensions
      const dpr = window.devicePixelRatio || 1;
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
      
      // Draw shields for all shielded characters
      shieldedCharacters.forEach((shieldData, characterId) => {
        const element = document.getElementById(`char-${characterId}`);
        if (element) {
          // Get more accurate position
          const rect = element.getBoundingClientRect();
          const position = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
          };
          
          const isMobile = window.innerWidth <= 640;
          const shieldSize = isMobile ? 120 : 200;
          
          // Get shield color tint based on type
          let tintColor = '#00FFFF'; // default cyan
          let glowColor = 'rgba(0, 255, 255, 0.6)';
          
          switch(shieldData.type) {
            case 'arcane':
              tintColor = '#8B5CF6';
              glowColor = 'rgba(147, 51, 234, 0.6)';
              break;
            case 'holy':
              tintColor = '#FCD34D';
              glowColor = 'rgba(251, 191, 36, 0.6)';
              break;
            case 'nature':
              tintColor = '#22C55E';
              glowColor = 'rgba(34, 197, 94, 0.6)';
              break;
            case 'energy':
              tintColor = '#00FFFF';
              glowColor = 'rgba(0, 255, 255, 0.6)';
              break;
          }
          
          // Clean glowing bubble shield
          const pulseScale = 1 + Math.sin(time * 2) * 0.05;
          const actualSize = shieldSize * pulseScale;
          
          // Outer glow aura
          ctx.save();
          const outerGlow = ctx.createRadialGradient(
            position.x, position.y, actualSize/2 - 10,
            position.x, position.y, actualSize/2 + 20
          );
          outerGlow.addColorStop(0, 'transparent');
          outerGlow.addColorStop(0.5, glowColor);
          outerGlow.addColorStop(1, 'transparent');
          
          ctx.fillStyle = outerGlow;
          ctx.globalAlpha = 0.4;
          ctx.beginPath();
          ctx.arc(position.x, position.y, actualSize/2 + 20, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          
          // Main bubble border
          ctx.save();
          ctx.strokeStyle = tintColor;
          ctx.lineWidth = 3;
          ctx.globalAlpha = 0.8;
          ctx.shadowColor = tintColor;
          ctx.shadowBlur = 25;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
          ctx.beginPath();
          ctx.arc(position.x, position.y, actualSize/2, 0, Math.PI * 2);
          ctx.stroke();
          
          // Second layer for intensity
          ctx.lineWidth = 2;
          ctx.globalAlpha = 0.6;
          ctx.stroke();
          
          // Inner bright rim
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 1;
          ctx.globalAlpha = 0.4;
          ctx.shadowBlur = 0;
          ctx.beginPath();
          ctx.arc(position.x, position.y, actualSize/2 - 1, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
          
          // Subtle inner gradient fill
          ctx.save();
          const innerGradient = ctx.createRadialGradient(
            position.x, position.y, 0,
            position.x, position.y, actualSize/2
          );
          innerGradient.addColorStop(0, 'transparent');
          innerGradient.addColorStop(0.7, 'transparent');
          innerGradient.addColorStop(0.9, glowColor);
          innerGradient.addColorStop(1, 'transparent');
          
          ctx.fillStyle = innerGradient;
          ctx.globalAlpha = 0.2;
          ctx.beginPath();
          ctx.arc(position.x, position.y, actualSize/2, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          
          // Hexagonal pattern overlay (subtle)
          ctx.save();
          ctx.strokeStyle = tintColor;
          ctx.lineWidth = 0.5;
          ctx.globalAlpha = 0.2;
          
          const hexSize = 12;
          const centerX = position.x;
          const centerY = position.y;
          
          for (let ring = 1; ring < 4; ring++) {
            for (let i = 0; i < 6 * ring; i++) {
              const angle = (Math.PI * 2 / (6 * ring)) * i;
              const distance = ring * hexSize * 1.5;
              
              // Only draw if within shield radius
              if (distance < actualSize/2 - 10) {
                const hx = centerX + Math.cos(angle) * distance;
                const hy = centerY + Math.sin(angle) * distance;
                
                ctx.beginPath();
                for (let j = 0; j < 6; j++) {
                  const hexAngle = (Math.PI / 3) * j;
                  const px = hx + hexSize * 0.5 * Math.cos(hexAngle);
                  const py = hy + hexSize * 0.5 * Math.sin(hexAngle);
                  if (j === 0) {
                    ctx.moveTo(px, py);
                  } else {
                    ctx.lineTo(px, py);
                  }
                }
                ctx.closePath();
                ctx.stroke();
              }
            }
          }
          ctx.restore();
            
            // Energy arcs traveling along the bubble surface
            const currentTime = Date.now();
            
            // Draw 3 stable energy arcs that travel around the bubble
            for (let i = 0; i < 3; i++) {
              const arcSpeed = 0.5 + i * 0.2; // Different speeds for each arc
              const arcAngle = (time * arcSpeed + i * Math.PI * 2/3) % (Math.PI * 2);
              const arcLength = Math.PI / 4; // Quarter circle arcs
              
              ctx.save();
              ctx.strokeStyle = tintColor;
              ctx.lineWidth = 2;
              ctx.globalAlpha = 0.6;
              ctx.shadowColor = tintColor;
              ctx.shadowBlur = 15;
              ctx.lineCap = 'round';
              
              // Draw the arc
              ctx.beginPath();
              ctx.arc(
                position.x, 
                position.y, 
                actualSize/2 - 2, // Slightly inside the bubble
                arcAngle, 
                arcAngle + arcLength
              );
              ctx.stroke();
              
              // White highlight
              ctx.strokeStyle = '#FFFFFF';
              ctx.lineWidth = 1;
              ctx.globalAlpha = 0.4;
              ctx.stroke();
              
              ctx.restore();
            }
            
            // Occasional energy spark at random position on the bubble
            if (Math.random() < 0.05) { // 5% chance per frame
              const sparkAngle = Math.random() * Math.PI * 2;
              const sparkX = position.x + Math.cos(sparkAngle) * (actualSize/2);
              const sparkY = position.y + Math.sin(sparkAngle) * (actualSize/2);
              
              ctx.save();
              ctx.fillStyle = '#FFFFFF';
              ctx.shadowColor = tintColor;
              ctx.shadowBlur = 20;
              ctx.globalAlpha = 0.9;
              ctx.beginPath();
              ctx.arc(sparkX, sparkY, 3, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();
            }
          } else {
            // Fallback to simple circle if image not loaded
            ctx.save();
            ctx.globalAlpha = 0.6;
            ctx.strokeStyle = tintColor;
            ctx.lineWidth = 3;
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = 20;
            ctx.beginPath();
            ctx.arc(position.x, position.y, shieldSize/2, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    // Start animation if there are shielded characters
    if (shieldedCharacters.size > 0) {
      animate();
    }
    
    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [shieldedCharacters]);
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        
        canvas.style.width = rect.width + 'px';
        canvas.style.height = rect.height + 'px';
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  if (shieldedCharacters.size === 0) return null;
  
  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 10001, // Below ice cubes but above most things
        // Disable 3D transforms that can cause positioning issues on mobile
        willChange: 'transform'
      }}
    />
  );
};

export default MobileShieldOverlay;