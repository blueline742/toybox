import React, { useEffect, useState } from 'react';
import musicManager from '../utils/musicManager';

const WizardEffects = ({ 
  activeSpell, 
  spellPositions, 
  onComplete,
  playerPositions,
  opponentPositions
}) => {
  const [fireEffects, setFireEffects] = useState([]);
  const [lightningEffects, setLightningEffects] = useState([]);
  const [iceEffects, setIceEffects] = useState([]);
  const [frozenTargets, setFrozenTargets] = useState([]);

  useEffect(() => {
    if (!activeSpell || !spellPositions) return;

    const animationType = activeSpell.ability?.animation || activeSpell.ability?.id;
    const targets = spellPositions.targets || [];
    const casterPos = spellPositions.caster;

    if (animationType === 'pyroblast') {
      // Play pyroblast sound effect if not muted
      if (!musicManager.isMuted) {
        const pyroblastSound = new Audio('/pyroblast.wav');
        pyroblastSound.volume = 0.5;
        pyroblastSound.play().catch(err => console.log('Could not play pyroblast sound:', err));
      }
      
      // PYROBLAST - Massive fireball
      const fireball = {
        id: Date.now(),
        type: 'fireball',
        startX: casterPos.x,
        startY: casterPos.y,
        endX: targets[0]?.x || casterPos.x,
        endY: targets[0]?.y || casterPos.y
      };
      
      setFireEffects([fireball]);
      
      // Explosion on impact
      setTimeout(() => {
        const explosion = {
          id: Date.now() + 1,
          type: 'explosion',
          x: targets[0]?.x || casterPos.x,
          y: targets[0]?.y || casterPos.y
        };
        setFireEffects(prev => [...prev, explosion]);
        
        // Add fire particles
        const particles = [];
        for (let i = 0; i < 20; i++) {
          const angle = (Math.PI * 2 * i) / 20;
          particles.push({
            id: Date.now() + 100 + i,
            type: 'fire_particle',
            x: targets[0]?.x || casterPos.x,
            y: targets[0]?.y || casterPos.y,
            vx: Math.cos(angle) * (3 + Math.random() * 3),
            vy: Math.sin(angle) * (3 + Math.random() * 3)
          });
        }
        setFireEffects(prev => [...prev, ...particles]);
      }, 500);

      setTimeout(() => {
        setFireEffects([]);
        onComplete();
      }, 2000);

    } else if (animationType === 'lightning_zap') {
      // Play chain lightning sound effect if not muted
      if (!musicManager.isMuted) {
        const lightningSound = new Audio('/chainlightning.wav');
        lightningSound.volume = 0.5;
        lightningSound.play().catch(err => console.log('Could not play chain lightning sound:', err));
      }
      
      // LIGHTNING ZAP - Chain lightning
      const bolts = [];
      
      // Create chain effect between targets
      for (let i = 0; i < Math.min(targets.length, 3); i++) {
        const startPos = i === 0 ? casterPos : targets[i - 1];
        const endPos = targets[i];
        
        if (endPos) {
          bolts.push({
            id: Date.now() + i,
            type: 'lightning_bolt',
            startX: startPos.x,
            startY: startPos.y,
            endX: endPos.x,
            endY: endPos.y,
            delay: i * 200
          });
        }
      }
      
      setLightningEffects(bolts);
      
      // Electric sparks at impact points
      targets.forEach((target, idx) => {
        setTimeout(() => {
          const sparks = [];
          for (let i = 0; i < 8; i++) {
            sparks.push({
              id: Date.now() + 1000 + idx * 10 + i,
              type: 'electric_spark',
              x: target.x,
              y: target.y,
              angle: (360 / 8) * i
            });
          }
          setLightningEffects(prev => [...prev, ...sparks]);
        }, 200 * idx);
      });

      setTimeout(() => {
        setLightningEffects([]);
        onComplete();
      }, 2000);

    } else if (animationType === 'ice_nova') {
      // ICE NOVA - Freeze all enemies
      
      // Create ice wave effect from caster
      const iceWave = {
        id: Date.now(),
        type: 'ice_wave',
        x: casterPos.x,
        y: casterPos.y
      };
      setIceEffects([iceWave]);
      
      // After wave reaches enemies, freeze them
      setTimeout(() => {
        const freezeEffects = targets.map((target, idx) => ({
          id: Date.now() + 100 + idx,
          type: 'freeze_prison',
          x: target.x,
          y: target.y
        }));
        
        setIceEffects(prev => [...prev, ...freezeEffects]);
        setFrozenTargets(targets);
        
        // Ice shards around frozen enemies
        targets.forEach((target, idx) => {
          const shards = [];
          for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 * i) / 12;
            shards.push({
              id: Date.now() + 200 + idx * 20 + i,
              type: 'ice_shard',
              x: target.x + Math.cos(angle) * 60,
              y: target.y + Math.sin(angle) * 60,
              targetX: target.x,
              targetY: target.y,
              delay: i * 30
            });
          }
          setIceEffects(prev => [...prev, ...shards]);
        });
      }, 500);
      
      // Screen frost effect
      setTimeout(() => {
        document.body.classList.add('frost-screen');
        setTimeout(() => {
          document.body.classList.remove('frost-screen');
        }, 1000);
      }, 300);

      setTimeout(() => {
        setIceEffects([]);
        setFrozenTargets([]);
        onComplete();
      }, 3000);
    }
  }, [activeSpell, spellPositions, onComplete]);

  return (
    <>
      {/* Pyroblast Fireball */}
      {fireEffects.filter(e => e.type === 'fireball').map(effect => (
        <div
          key={effect.id}
          className="absolute pointer-events-none"
          style={{
            left: effect.startX - 20,
            top: effect.startY - 20,
            width: 40,
            height: 40,
            zIndex: 47,
            animation: `fireballFly 0.5s ease-out forwards`
          }}
        >
          <div 
            className="w-full h-full rounded-full"
            style={{
              background: 'radial-gradient(circle, #ffff00 0%, #ff6600 40%, #ff0000 100%)',
              boxShadow: '0 0 30px #ff6600, 0 0 60px #ff0000',
              animation: 'fireballPulse 0.2s ease-in-out infinite'
            }}
          />
          {/* Fireball trail */}
          <div 
            className="absolute inset-0 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(255,100,0,0.8) 0%, transparent 70%)',
              transform: 'scale(2)',
              filter: 'blur(10px)'
            }}
          />
        </div>
      ))}

      {/* Fire Explosion */}
      {fireEffects.filter(e => e.type === 'explosion').map(effect => (
        <div
          key={effect.id}
          className="absolute pointer-events-none"
          style={{
            left: effect.x - 100,
            top: effect.y - 100,
            width: 200,
            height: 200,
            zIndex: 48
          }}
        >
          <div 
            className="w-full h-full rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(255,255,0,0.9) 0%, rgba(255,100,0,0.6) 40%, rgba(255,0,0,0.3) 70%, transparent 100%)',
              animation: 'explode 0.6s ease-out forwards'
            }}
          />
        </div>
      ))}

      {/* Fire Particles */}
      {fireEffects.filter(e => e.type === 'fire_particle').map(effect => (
        <div
          key={effect.id}
          className="absolute pointer-events-none"
          style={{
            left: effect.x - 3,
            top: effect.y - 3,
            width: 6,
            height: 6,
            zIndex: 46,
            animation: `particleFly 1s ease-out forwards`,
            '--vx': `${effect.vx}px`,
            '--vy': `${effect.vy}px`
          }}
        >
          <div 
            className="w-full h-full rounded-full"
            style={{
              background: `radial-gradient(circle, ${['#ffff00', '#ff6600', '#ff0000'][Math.floor(Math.random() * 3)]} 0%, transparent 70%)`
            }}
          />
        </div>
      ))}

      {/* Lightning Bolts */}
      {lightningEffects.filter(e => e.type === 'lightning_bolt').map(effect => (
        <div
          key={effect.id}
          className="absolute pointer-events-none"
          style={{
            left: Math.min(effect.startX, effect.endX),
            top: Math.min(effect.startY, effect.endY),
            width: Math.abs(effect.endX - effect.startX) || 2,
            height: Math.abs(effect.endY - effect.startY) || 2,
            zIndex: 47,
            animation: `lightningFlash 0.3s ease-out ${effect.delay}ms forwards`
          }}
        >
          <svg className="absolute inset-0" style={{ overflow: 'visible' }}>
            <defs>
              <filter id="lightningGlow">
                <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            {/* Main bolt */}
            <path
              d={`M ${effect.startX > effect.endX ? effect.endX - effect.startX : 0} ${effect.startY > effect.endY ? effect.endY - effect.startY : 0} 
                  L ${(effect.startX > effect.endX ? 0 : effect.endX - effect.startX) * 0.3} ${(effect.startY > effect.endY ? 0 : effect.endY - effect.startY) * 0.7}
                  L ${(effect.startX > effect.endX ? 0 : effect.endX - effect.startX) * 0.6} ${(effect.startY > effect.endY ? 0 : effect.endY - effect.startY) * 0.4}
                  L ${effect.startX > effect.endX ? 0 : effect.endX - effect.startX} ${effect.startY > effect.endY ? 0 : effect.endY - effect.startY}`}
              stroke="#00ffff"
              strokeWidth="3"
              fill="none"
              filter="url(#lightningGlow)"
            />
            {/* Secondary bolt for thickness */}
            <path
              d={`M ${effect.startX > effect.endX ? effect.endX - effect.startX : 0} ${effect.startY > effect.endY ? effect.endY - effect.startY : 0} 
                  L ${(effect.startX > effect.endX ? 0 : effect.endX - effect.startX) * 0.4} ${(effect.startY > effect.endY ? 0 : effect.endY - effect.startY) * 0.5}
                  L ${(effect.startX > effect.endX ? 0 : effect.endX - effect.startX) * 0.7} ${(effect.startY > effect.endY ? 0 : effect.endY - effect.startY) * 0.3}
                  L ${effect.startX > effect.endX ? 0 : effect.endX - effect.startX} ${effect.startY > effect.endY ? 0 : effect.endY - effect.startY}`}
              stroke="white"
              strokeWidth="1"
              fill="none"
              opacity="0.8"
            />
          </svg>
        </div>
      ))}

      {/* Electric Sparks */}
      {lightningEffects.filter(e => e.type === 'electric_spark').map(effect => (
        <div
          key={effect.id}
          className="absolute pointer-events-none"
          style={{
            left: effect.x,
            top: effect.y,
            width: 2,
            height: 30,
            zIndex: 46,
            transform: `translate(-50%, -50%) rotate(${effect.angle}deg)`,
            transformOrigin: 'center'
          }}
        >
          <div 
            className="w-full h-full"
            style={{
              background: 'linear-gradient(to bottom, #00ffff, transparent)',
              animation: 'sparkOut 0.5s ease-out forwards'
            }}
          />
        </div>
      ))}

      {/* Ice Wave */}
      {iceEffects.filter(e => e.type === 'ice_wave').map(effect => (
        <div
          key={effect.id}
          className="absolute pointer-events-none"
          style={{
            left: effect.x - 200,
            top: effect.y - 200,
            width: 400,
            height: 400,
            zIndex: 45
          }}
        >
          <div 
            className="w-full h-full rounded-full"
            style={{
              background: 'radial-gradient(circle, transparent 0%, rgba(173,216,230,0.6) 30%, rgba(135,206,235,0.4) 60%, transparent 100%)',
              border: '2px solid rgba(173,216,230,0.8)',
              animation: 'iceWaveExpand 1s ease-out forwards',
              boxShadow: '0 0 50px rgba(173,216,230,0.8), inset 0 0 50px rgba(135,206,235,0.4)'
            }}
          />
        </div>
      ))}

      {/* Freeze Prison */}
      {iceEffects.filter(e => e.type === 'freeze_prison').map(effect => (
        <div
          key={effect.id}
          className="absolute pointer-events-none"
          style={{
            left: effect.x - 60,
            top: effect.y - 80,
            width: 120,
            height: 160,
            zIndex: 46
          }}
        >
          {/* Ice crystal structure */}
          <svg className="absolute inset-0" viewBox="0 0 120 160">
            <defs>
              <linearGradient id="iceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#e0f7ff" stopOpacity="0.9" />
                <stop offset="50%" stopColor="#87ceeb" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#4682b4" stopOpacity="0.9" />
              </linearGradient>
              <filter id="frost">
                <feTurbulence baseFrequency="0.02" numOctaves="2" />
                <feColorMatrix values="0 0 0 0 0.5 0 0 0 0 0.8 0 0 0 0 1 0 0 0 0.8 0" />
              </filter>
            </defs>
            
            {/* Main ice crystal */}
            <polygon
              points="60,10 80,40 80,120 60,150 40,120 40,40"
              fill="url(#iceGradient)"
              stroke="#4682b4"
              strokeWidth="2"
              opacity="0.8"
            />
            
            {/* Ice shards */}
            <polygon points="60,10 70,30 50,30" fill="#e0f7ff" opacity="0.9" />
            <polygon points="40,40 30,60 40,80" fill="#87ceeb" opacity="0.7" />
            <polygon points="80,40 90,60 80,80" fill="#87ceeb" opacity="0.7" />
            <polygon points="60,150 70,130 50,130" fill="#4682b4" opacity="0.8" />
            
            {/* Frost texture */}
            <rect width="120" height="160" fill="white" opacity="0.3" filter="url(#frost)" />
          </svg>
          
          {/* Frozen shimmer */}
          <div 
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.5) 50%, transparent 70%)',
              animation: 'shimmer 2s ease-in-out infinite'
            }}
          />
        </div>
      ))}

      {/* Ice Shards */}
      {iceEffects.filter(e => e.type === 'ice_shard').map(effect => (
        <div
          key={effect.id}
          className="absolute pointer-events-none"
          style={{
            left: effect.x - 5,
            top: effect.y - 5,
            width: 10,
            height: 10,
            zIndex: 47,
            animation: `shardFly 0.8s ease-in ${effect.delay}ms forwards`,
            '--targetX': `${effect.targetX - effect.x}px`,
            '--targetY': `${effect.targetY - effect.y}px`
          }}
        >
          <div 
            className="w-full h-full"
            style={{
              background: 'linear-gradient(45deg, #e0f7ff, #87ceeb)',
              clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
              transform: 'rotate(45deg)'
            }}
          />
        </div>
      ))}

      <style jsx>{`
        @keyframes fireballFly {
          0% {
            transform: translate(0, 0) scale(0.5);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translate(
              ${fireEffects.find(e => e.type === 'fireball')?.endX - fireEffects.find(e => e.type === 'fireball')?.startX}px,
              ${fireEffects.find(e => e.type === 'fireball')?.endY - fireEffects.find(e => e.type === 'fireball')?.startY}px
            ) scale(1);
            opacity: 1;
          }
        }
        
        @keyframes fireballPulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.2);
          }
        }
        
        @keyframes explode {
          0% {
            transform: scale(0);
            opacity: 1;
          }
          50% {
            transform: scale(1.5);
            opacity: 0.8;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        
        @keyframes particleFly {
          0% {
            transform: translate(0, 0);
            opacity: 1;
          }
          100% {
            transform: translate(calc(var(--vx) * 10), calc(var(--vy) * 10));
            opacity: 0;
          }
        }
        
        @keyframes lightningFlash {
          0%, 100% {
            opacity: 0;
          }
          20%, 80% {
            opacity: 1;
          }
        }
        
        @keyframes sparkOut {
          0% {
            transform: translate(-50%, -50%) rotate(var(--rotation)) scaleY(0);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) rotate(var(--rotation)) scaleY(1) translateY(-30px);
            opacity: 0;
          }
        }
        
        @keyframes iceWaveExpand {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: scale(3);
            opacity: 0;
          }
        }
        
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        
        @keyframes shardFly {
          0% {
            transform: translate(0, 0) rotate(0deg);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translate(var(--targetX), var(--targetY)) rotate(360deg);
            opacity: 0;
          }
        }
        
        :global(.frost-screen) {
          position: relative;
        }
        
        :global(.frost-screen)::after {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(to bottom, 
            rgba(173,216,230,0.2) 0%, 
            transparent 30%, 
            transparent 70%, 
            rgba(173,216,230,0.2) 100%);
          pointer-events: none;
          z-index: 100;
          animation: frostPulse 1s ease-out;
        }
        
        @keyframes frostPulse {
          0% {
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }
      `}</style>
    </>
  );
};

export default WizardEffects;