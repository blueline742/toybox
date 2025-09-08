import React, { useState } from 'react';
import { castIceNova } from './IceNovaEffectEnhanced';

/**
 * Demo component showcasing the Ice Nova effect API
 * This demonstrates how to use the castIceNova function
 */
const IceNovaDemo = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  
  const handleCastIceNova = () => {
    if (isPlaying) return;
    
    setIsPlaying(true);
    
    // Define caster position (center of screen)
    const caster = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2
    };
    
    // Define enemy positions (in a circle around the caster)
    const enemies = [];
    const enemyCount = 6;
    const radius = 200;
    
    for (let i = 0; i < enemyCount; i++) {
      const angle = (i / enemyCount) * Math.PI * 2;
      enemies.push({
        x: caster.x + Math.cos(angle) * radius,
        y: caster.y + Math.sin(angle) * radius
      });
    }
    
    // Cast the Ice Nova effect
    const cleanup = castIceNova(caster, enemies, () => {
      console.log('Ice Nova effect completed!');
      setIsPlaying(false);
    });
    
    // Note: You can call cleanup() early to stop the effect if needed
    // For example: setTimeout(cleanup, 1000) would stop it after 1 second
  };
  
  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 10000
    }}>
      <button
        onClick={handleCastIceNova}
        disabled={isPlaying}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          fontWeight: 'bold',
          color: 'white',
          backgroundColor: isPlaying ? '#666' : '#4fc3f7',
          border: 'none',
          borderRadius: '8px',
          cursor: isPlaying ? 'not-allowed' : 'pointer',
          boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
          transition: 'all 0.3s'
        }}
        onMouseEnter={(e) => {
          if (!isPlaying) {
            e.target.style.backgroundColor = '#29b6f6';
            e.target.style.transform = 'scale(1.05)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isPlaying) {
            e.target.style.backgroundColor = '#4fc3f7';
            e.target.style.transform = 'scale(1)';
          }
        }}
      >
        {isPlaying ? 'Casting...' : 'Cast Ice Nova'}
      </button>
    </div>
  );
};

/**
 * Example usage in a battle component:
 * 
 * import { castIceNova } from './ThreeJS/IceNovaEffectEnhanced';
 * 
 * // When wizard casts Ice Nova spell
 * const handleIceNovaSpell = () => {
 *   const wizardPosition = getCharacterScreenPosition(wizard);
 *   const enemyPositions = enemies.map(enemy => getCharacterScreenPosition(enemy));
 *   
 *   // Play sound effect
 *   playSound('/freeze.wav');
 *   
 *   // Cast the spell
 *   castIceNova(wizardPosition, enemyPositions, () => {
 *     // Apply freeze status to enemies
 *     enemies.forEach(enemy => {
 *       enemy.status.frozen = true;
 *     });
 *   });
 * };
 */

export default IceNovaDemo;