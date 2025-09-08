import React, { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import * as THREE from 'three';

/**
 * Simplified Ice Nova Effect that ensures visibility
 */
const SimpleIceNovaEffect = ({ sourcePos, targets, onComplete }) => {
  const containerRef = useRef(null);
  
  useEffect(() => {
    console.log('SimpleIceNovaEffect starting with:', { sourcePos, targets });
    
    if (!containerRef.current) return;
    
    // Create frost overlay
    const frostOverlay = document.createElement('div');
    frostOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 9999;
      background: linear-gradient(135deg, 
        rgba(200,230,255,0.4) 0%, 
        rgba(150,200,255,0.3) 50%, 
        rgba(200,230,255,0.4) 100%);
      backdrop-filter: blur(2px);
      animation: frostPulse 3s ease-out;
    `;
    containerRef.current.appendChild(frostOverlay);
    
    // Create ice crystals pattern
    const icePattern = document.createElement('div');
    icePattern.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 10000;
      background-image: 
        radial-gradient(circle at 20% 30%, rgba(255,255,255,0.3) 0%, transparent 50%),
        radial-gradient(circle at 80% 70%, rgba(200,230,255,0.3) 0%, transparent 50%),
        radial-gradient(circle at 50% 50%, rgba(150,200,255,0.2) 0%, transparent 70%);
      animation: iceCrystals 3s ease-out;
    `;
    containerRef.current.appendChild(icePattern);
    
    // Create shockwave from source
    if (sourcePos) {
      const shockwave = document.createElement('div');
      shockwave.style.cssText = `
        position: fixed;
        left: ${sourcePos.x}px;
        top: ${sourcePos.y}px;
        width: 100px;
        height: 100px;
        transform: translate(-50%, -50%);
        pointer-events: none;
        z-index: 10001;
        border: 3px solid rgba(100,200,255,0.8);
        border-radius: 50%;
        box-shadow: 
          0 0 50px rgba(100,200,255,0.6),
          inset 0 0 50px rgba(100,200,255,0.4);
        animation: shockwaveExpand 1.5s ease-out;
      `;
      containerRef.current.appendChild(shockwave);
    }
    
    // Create ice blocks around targets
    targets.forEach((target, index) => {
      if (!target || !target.element) return;
      
      const rect = target.element.getBoundingClientRect();
      const iceBlock = document.createElement('div');
      iceBlock.style.cssText = `
        position: fixed;
        left: ${rect.left}px;
        top: ${rect.top}px;
        width: ${rect.width}px;
        height: ${rect.height}px;
        pointer-events: none;
        z-index: 10002;
        background: linear-gradient(135deg,
          rgba(150,200,255,0.6) 0%,
          rgba(200,230,255,0.4) 50%,
          rgba(150,200,255,0.6) 100%);
        border: 2px solid rgba(200,230,255,0.8);
        border-radius: 10px;
        box-shadow: 
          0 0 30px rgba(100,200,255,0.8),
          inset 0 0 30px rgba(200,230,255,0.6);
        animation: iceBlockForm ${0.5 + index * 0.1}s ease-out;
        animation-fill-mode: forwards;
      `;
      containerRef.current.appendChild(iceBlock);
      
      // Add ice crystals on the block
      const crystals = document.createElement('div');
      crystals.style.cssText = `
        position: fixed;
        left: ${rect.left}px;
        top: ${rect.top}px;
        width: ${rect.width}px;
        height: ${rect.height}px;
        pointer-events: none;
        z-index: 10003;
        background-image: 
          linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.5) 50%, transparent 70%),
          linear-gradient(-45deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%);
        background-size: 20px 20px;
        animation: shimmer 2s linear infinite;
      `;
      containerRef.current.appendChild(crystals);
    });
    
    // Add snowflake particles
    for (let i = 0; i < 30; i++) {
      const snowflake = document.createElement('div');
      const startX = Math.random() * window.innerWidth;
      const startY = Math.random() * window.innerHeight;
      
      snowflake.style.cssText = `
        position: fixed;
        left: ${startX}px;
        top: ${startY}px;
        width: ${5 + Math.random() * 10}px;
        height: ${5 + Math.random() * 10}px;
        pointer-events: none;
        z-index: 10004;
        background: radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(200,230,255,0.6) 100%);
        border-radius: 50%;
        animation: snowfall ${2 + Math.random() * 2}s linear;
        animation-delay: ${Math.random() * 0.5}s;
      `;
      containerRef.current.appendChild(snowflake);
    }
    
    // Cleanup after animation
    const cleanup = setTimeout(() => {
      console.log('SimpleIceNovaEffect cleanup');
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      if (onComplete) onComplete();
    }, 3500);
    
    return () => {
      clearTimeout(cleanup);
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [sourcePos, targets, onComplete]);
  
  return createPortal(
    <>
      <div ref={containerRef} />
      <style>{`
        @keyframes frostPulse {
          0% {
            opacity: 0;
            filter: blur(0px);
          }
          50% {
            opacity: 1;
            filter: blur(2px);
          }
          100% {
            opacity: 0;
            filter: blur(0px);
          }
        }
        
        @keyframes iceCrystals {
          0% {
            opacity: 0;
            transform: scale(0.8);
          }
          50% {
            opacity: 1;
            transform: scale(1);
          }
          100% {
            opacity: 0;
            transform: scale(1.1);
          }
        }
        
        @keyframes shockwaveExpand {
          0% {
            width: 100px;
            height: 100px;
            opacity: 1;
            border-width: 3px;
          }
          100% {
            width: 800px;
            height: 800px;
            opacity: 0;
            border-width: 1px;
          }
        }
        
        @keyframes iceBlockForm {
          0% {
            opacity: 0;
            transform: scale(0.5) rotate(0deg);
          }
          50% {
            opacity: 1;
            transform: scale(1.1) rotate(5deg);
          }
          100% {
            opacity: 0.9;
            transform: scale(1) rotate(0deg);
          }
        }
        
        @keyframes shimmer {
          0% {
            background-position: 0 0, 0 0;
          }
          100% {
            background-position: 20px 20px, -20px -20px;
          }
        }
        
        @keyframes snowfall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100px) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
    </>,
    document.body
  );
};

export default SimpleIceNovaEffect;