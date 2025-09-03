import React, { useEffect, useState } from 'react';
import musicManager from '../utils/musicManager';

const RoboFighterEffects = ({ 
  activeSpell, 
  spellPositions, 
  onComplete,
  playerPositions,
  opponentPositions 
}) => {
  const [effects, setEffects] = useState([]);
  const [shieldEffects, setShieldEffects] = useState([]);
  const [batteryEffects, setBatteryEffects] = useState([]);

  useEffect(() => {
    if (!activeSpell || !spellPositions) return;

    const animationType = activeSpell.ability?.animation || activeSpell.ability?.id;
    const targetPos = spellPositions.targets?.[0] || spellPositions.target;
    const casterPos = spellPositions.caster;

    if (animationType === 'laser_blast') {
      // Play robot sound for laser blast
      if (!musicManager.isMuted) {
        const robotSound = new Audio('/robot.wav');
        robotSound.volume = 0.5;
        robotSound.play().catch(err => console.log('Could not play robot sound:', err));
      }
      
      // Keep existing laser blast effect
      const laserEffect = {
        id: Date.now(),
        type: 'laser',
        startX: casterPos.x,
        startY: casterPos.y,
        endX: targetPos.x,
        endY: targetPos.y
      };
      
      setEffects([laserEffect]);
      
      // Create impact effect at target
      setTimeout(() => {
        const impactEffect = {
          id: Date.now() + 1,
          type: 'laser_impact',
          x: targetPos.x,
          y: targetPos.y
        };
        setEffects(prev => [...prev, impactEffect]);
      }, 300);

      setTimeout(() => {
        setEffects([]);
        onComplete();
      }, 1500);

    } else if (animationType === 'shield') {
      // Play robot sound for shield boost
      if (!musicManager.isMuted) {
        const robotSound = new Audio('/robot.wav');
        robotSound.volume = 0.3; // Quieter for shield
        robotSound.play().catch(err => console.log('Could not play robot sound:', err));
      }
      // Create shield bubble effect on TARGET ally
      const shieldBubble = {
        id: Date.now(),
        type: 'shield_bubble',
        x: targetPos.x,  // Shield appears on target
        y: targetPos.y
      };
      
      setShieldEffects([shieldBubble]);
      
      // Energy beam from caster to target
      const beamEffect = {
        id: Date.now() + 100,
        type: 'energy_beam',
        startX: casterPos.x,
        startY: casterPos.y,
        endX: targetPos.x,
        endY: targetPos.y
      };
      setEffects([beamEffect]);
      
      // Energy particles flowing from caster to target
      const particles = [];
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        particles.push({
          id: Date.now() + i,
          type: 'shield_particle',
          x: casterPos.x + Math.cos(angle) * 50,
          y: casterPos.y + Math.sin(angle) * 50,
          targetX: targetPos.x,
          targetY: targetPos.y,
          delay: i * 50
        });
      }
      
      setEffects(particles);

      setTimeout(() => {
        setEffects([]);
        onComplete();
      }, 2000);

    } else if (animationType === 'recharge_batteries') {
      // Play robot sound for ultimate
      if (!musicManager.isMuted) {
        const robotSound = new Audio('/robot.wav');
        robotSound.volume = 0.7; // Louder for ultimate
        robotSound.play().catch(err => console.log('Could not play robot ultimate sound:', err));
      }
      
      // ULTIMATE: Recharge Batteries - heal all allies
      const allAllies = playerPositions || [];
      
      // Create lightning bolt effects from sky
      const lightningBolts = [];
      allAllies.forEach((ally, index) => {
        if (ally && ally.element) {
          const rect = ally.element.getBoundingClientRect();
          lightningBolts.push({
            id: Date.now() + index,
            type: 'lightning_bolt',
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
            delay: index * 200
          });
        }
      });
      
      setBatteryEffects(lightningBolts);
      
      // Electric surge effect
      setTimeout(() => {
        const surgeEffects = allAllies.map((ally, index) => {
          if (ally && ally.element) {
            const rect = ally.element.getBoundingClientRect();
            return {
              id: Date.now() + 100 + index,
              type: 'electric_surge',
              x: rect.left + rect.width / 2,
              y: rect.top + rect.height / 2
            };
          }
          return null;
        }).filter(Boolean);
        
        setBatteryEffects(prev => [...prev, ...surgeEffects]);
      }, 1000);
      
      // Screen flash effect
      setTimeout(() => {
        document.body.classList.add('electric-flash');
        setTimeout(() => {
          document.body.classList.remove('electric-flash');
        }, 300);
      }, 800);

      setTimeout(() => {
        setBatteryEffects([]);
        onComplete();
      }, 4000); // Extended for better visual effect
    }
  }, [activeSpell, spellPositions, onComplete, playerPositions, opponentPositions]);

  return (
    <>
      {/* Laser Blast Effect */}
      {effects.filter(e => e.type === 'laser').map(effect => (
        <div
          key={effect.id}
          className="absolute pointer-events-none"
          style={{
            left: Math.min(effect.startX, effect.endX),
            top: Math.min(effect.startY, effect.endY),
            width: Math.abs(effect.endX - effect.startX) || 2,
            height: Math.abs(effect.endY - effect.startY) || 2,
            zIndex: 45
          }}
        >
          <svg className="absolute inset-0" style={{ overflow: 'visible' }}>
            <defs>
              <linearGradient id="laserGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00ffff" stopOpacity="0.3" />
                <stop offset="50%" stopColor="#00ffff" stopOpacity="1" />
                <stop offset="100%" stopColor="#00ffff" stopOpacity="0.3" />
              </linearGradient>
              <filter id="laserGlow">
                <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <line
              x1={effect.startX > effect.endX ? effect.endX - effect.startX : 0}
              y1={effect.startY > effect.endY ? effect.endY - effect.startY : 0}
              x2={effect.startX > effect.endX ? 0 : effect.endX - effect.startX}
              y2={effect.startY > effect.endY ? 0 : effect.endY - effect.startY}
              stroke="url(#laserGradient)"
              strokeWidth="4"
              filter="url(#laserGlow)"
              className="animate-pulse"
            />
          </svg>
        </div>
      ))}

      {/* Laser Impact Effect */}
      {effects.filter(e => e.type === 'laser_impact').map(effect => (
        <div
          key={effect.id}
          className="absolute pointer-events-none animate-ping"
          style={{
            left: effect.x - 30,
            top: effect.y - 30,
            width: 60,
            height: 60,
            zIndex: 46
          }}
        >
          <div className="w-full h-full rounded-full bg-cyan-400 opacity-60" />
        </div>
      ))}

      {/* Shield Bubble Effect (Persistent) */}
      {shieldEffects.filter(e => e.type === 'shield_bubble').map(effect => (
        <div
          key={effect.id}
          className="absolute pointer-events-none"
          style={{
            left: effect.x - 60,
            top: effect.y - 60,
            width: 120,
            height: 120,
            zIndex: 44
          }}
        >
          <div 
            className="w-full h-full rounded-full animate-pulse"
            style={{
              background: 'radial-gradient(circle, rgba(83, 82, 237, 0.3) 0%, rgba(83, 82, 237, 0.1) 50%, transparent 70%)',
              border: '2px solid rgba(83, 82, 237, 0.6)',
              boxShadow: '0 0 30px rgba(83, 82, 237, 0.5), inset 0 0 20px rgba(83, 82, 237, 0.3)'
            }}
          />
          <div 
            className="absolute inset-0 rounded-full animate-spin-slow"
            style={{
              background: 'conic-gradient(from 0deg, transparent, rgba(83, 82, 237, 0.2), transparent)',
            }}
          />
        </div>
      ))}

      {/* Energy Beam for Shield Transfer */}
      {effects.filter(e => e.type === 'energy_beam').map(effect => (
        <div
          key={effect.id}
          className="absolute pointer-events-none"
          style={{
            left: Math.min(effect.startX, effect.endX),
            top: Math.min(effect.startY, effect.endY),
            width: Math.abs(effect.endX - effect.startX) || 2,
            height: Math.abs(effect.endY - effect.startY) || 2,
            zIndex: 44
          }}
        >
          <svg className="absolute inset-0" style={{ overflow: 'visible' }}>
            <defs>
              <linearGradient id="energyBeamGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#5352ED" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#00ffff" stopOpacity="1" />
                <stop offset="100%" stopColor="#5352ED" stopOpacity="0.8" />
              </linearGradient>
              <filter id="energyGlow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <line
              x1={effect.startX > effect.endX ? effect.endX - effect.startX : 0}
              y1={effect.startY > effect.endY ? effect.endY - effect.startY : 0}
              x2={effect.startX > effect.endX ? 0 : effect.endX - effect.startX}
              y2={effect.startY > effect.endY ? 0 : effect.endY - effect.startY}
              stroke="url(#energyBeamGradient)"
              strokeWidth="3"
              filter="url(#energyGlow)"
              className="animate-pulse"
              strokeDasharray="5 5"
              strokeDashoffset="0"
            >
              <animate attributeName="stroke-dashoffset" from="0" to="10" dur="0.5s" repeatCount="indefinite" />
            </line>
          </svg>
        </div>
      ))}

      {/* Shield Particles */}
      {effects.filter(e => e.type === 'shield_particle').map(effect => (
        <div
          key={effect.id}
          className="absolute pointer-events-none"
          style={{
            left: effect.x - 4,
            top: effect.y - 4,
            width: 8,
            height: 8,
            zIndex: 45,
            animation: `moveToCenter 1s ease-in ${effect.delay}ms forwards`
          }}
        >
          <div className="w-full h-full rounded-full bg-blue-400 opacity-80" />
        </div>
      ))}

      {/* Lightning Bolts for Recharge Batteries */}
      {batteryEffects.filter(e => e.type === 'lightning_bolt').map(effect => (
        <div
          key={effect.id}
          className="absolute pointer-events-none"
          style={{
            left: effect.x - 2,
            top: 0,
            width: 4,
            height: effect.y,
            zIndex: 47,
            animation: `lightningStrike 0.5s ease-out ${effect.delay}ms forwards`
          }}
        >
          <svg className="absolute inset-0" style={{ overflow: 'visible' }}>
            <defs>
              <filter id="electricGlow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <path
              d={`M 2 0 L 0 ${effect.y * 0.3} L 4 ${effect.y * 0.3} L 1 ${effect.y * 0.6} L 3 ${effect.y * 0.6} L 2 ${effect.y}`}
              fill="none"
              stroke="#ffff00"
              strokeWidth="2"
              filter="url(#electricGlow)"
            />
          </svg>
        </div>
      ))}

      {/* Electric Surge Effect */}
      {batteryEffects.filter(e => e.type === 'electric_surge').map(effect => (
        <div
          key={effect.id}
          className="absolute pointer-events-none"
          style={{
            left: effect.x - 50,
            top: effect.y - 50,
            width: 100,
            height: 100,
            zIndex: 46
          }}
        >
          <div 
            className="w-full h-full rounded-full animate-ping"
            style={{
              background: 'radial-gradient(circle, rgba(255, 255, 0, 0.6) 0%, rgba(255, 255, 0, 0.2) 50%, transparent 70%)',
              boxShadow: '0 0 40px rgba(255, 255, 0, 0.8)'
            }}
          />
          {/* Electric sparks */}
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute"
              style={{
                left: '50%',
                top: '50%',
                width: 2,
                height: 20,
                background: 'linear-gradient(to bottom, #ffff00, transparent)',
                transform: `translate(-50%, -50%) rotate(${i * 45}deg) translateY(-30px)`,
                animation: 'sparkOut 0.5s ease-out forwards'
              }}
            />
          ))}
        </div>
      ))}

      <style jsx>{`
        @keyframes moveToCenter {
          to {
            transform: translate(
              ${effects.find(e => e.type === 'shield_particle')?.targetX - effects.find(e => e.type === 'shield_particle')?.x}px,
              ${effects.find(e => e.type === 'shield_particle')?.targetY - effects.find(e => e.type === 'shield_particle')?.y}px
            );
            opacity: 0;
          }
        }
        
        @keyframes lightningStrike {
          0% {
            opacity: 0;
            transform: scaleY(0);
          }
          50% {
            opacity: 1;
            transform: scaleY(1);
          }
          100% {
            opacity: 0;
            transform: scaleY(1);
          }
        }
        
        @keyframes sparkOut {
          to {
            transform: translate(-50%, -50%) rotate(var(--rotation)) translateY(-60px);
            opacity: 0;
          }
        }
        
        .animate-spin-slow {
          animation: spin 8s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        :global(.electric-flash) {
          animation: electricFlash 0.3s ease-out;
        }
        
        @keyframes electricFlash {
          0%, 100% { background-color: transparent; }
          50% { background-color: rgba(255, 255, 0, 0.1); }
        }
      `}</style>
    </>
  );
};

export default RoboFighterEffects;