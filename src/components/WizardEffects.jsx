import React, { useEffect, useState, useRef, lazy, Suspense } from 'react';
import musicManager from '../utils/musicManager';
import ImagePyroblastEffect from './ImagePyroblastEffect'; // NEW image-based effect
import ImageChainLightningEffect from './ImageChainLightningEffect'; // NEW epic lightning!
import ImageIceNovaEffect from './ImageIceNovaEffect'; // NEW epic ice effect!
import PersistentIceCubes from './PersistentIceCubes'; // Persistent ice cubes on frozen targets

// Lazy load Three.js components for performance
const PyroblastEffectOld = lazy(() => import('./ThreeJS/PyroblastEffect')); // Keep old one as backup
const ChainLightningEffectOld = lazy(() => import('./ThreeJS/ChainLightningEffect')); // Keep old one as backup
const IceNovaEffect = lazy(() => import('./ThreeJS/IceNovaEffect'));
const RealisticIceNovaEffect = lazy(() => import('./ThreeJS/RealisticIceNovaEffect'));
const SimpleIceNovaEffect = lazy(() => import('./ThreeJS/SimpleIceNovaEffect'));
const WorkingIceNovaEffect = lazy(() => import('./ThreeJS/WorkingIceNovaEffect'));
const TestIceNovaEffect = lazy(() => import('./ThreeJS/TestIceNovaEffect'));
const EpicIceNovaEffect = lazy(() => import('./ThreeJS/EpicIceNovaEffect'));

const WizardEffects = ({ 
  activeSpell, 
  spellPositions, 
  onComplete,
  playerPositions,
  opponentPositions,
  onIceNovaCast
}) => {
  const [fireEffects, setFireEffects] = useState([]);
  const [lightningEffects, setLightningEffects] = useState([]);
  const [iceEffects, setIceEffects] = useState([]);
  const [frozenTargets, setFrozenTargets] = useState([]);
  const [persistentFrozenTargets, setPersistentFrozenTargets] = useState([]); // Separate state for ice cubes
  const [threeJsPyroblast, setThreeJsPyroblast] = useState(null); // For Three.js pyroblast
  const [threeJsChainLightning, setThreeJsChainLightning] = useState(null); // For Three.js chain lightning
  const [threeJsIceNova, setThreeJsIceNova] = useState(null); // For Three.js ice nova
  const [threeJsIceNovaRendering, setThreeJsIceNovaRendering] = useState(false); // Prevent multiple renders
  const [useRealisticIceNova] = useState(true); // Use the new realistic version
  const lastSpellIdRef = useRef(null); // Track last spell to prevent duplicates
  
  // Debug logging
  useEffect(() => {
    console.log('🎯 threeJsIceNova state changed:', threeJsIceNova);
  }, [threeJsIceNova]);

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
      
      // Use IMAGE-BASED Pyroblast effect (not Three.js)
      setFireEffects([{
        id: Date.now(),
        casterPos: { x: casterPos.x, y: casterPos.y },
        targetPos: { x: targets[0]?.x || casterPos.x, y: targets[0]?.y || casterPos.y }
      }]);

    } else if (animationType === 'lightning_zap') {
      // Play chain lightning sound effect if not muted
      if (!musicManager.isMuted) {
        const lightningSound = new Audio('/chainlightning.wav');
        lightningSound.volume = 0.5;
        lightningSound.play().catch(err => console.log('Could not play chain lightning sound:', err));
      }
      
      // Use IMAGE-BASED Chain Lightning effect (not Three.js)
      setLightningEffects([{
        id: Date.now(),
        casterPos: { x: casterPos.x, y: casterPos.y },
        targets: targets.slice(0, 3) // Limit to 3 targets for performance
      }]);

    } else if (animationType === 'ice_nova') {
      // Play freeze sound effect if not muted
      if (!musicManager.isMuted) {
        const freezeSound = new Audio('/freeze.wav');
        freezeSound.volume = 0.5;
        freezeSound.play().catch(err => console.log('Could not play freeze sound:', err));
      }
      
      // Trigger frosty screen effect
      if (onIceNovaCast) {
        onIceNovaCast();
      }
      
      // Use IMAGE-BASED Ice Nova effect (not Three.js)
      // Only set if not already active
      if (iceEffects.length === 0) {
        console.log('🧊 Setting Ice Nova effect with:', { casterPos, targets });
        setIceEffects([{
          id: Date.now(),
          casterPos: { x: casterPos.x, y: casterPos.y },
          targets: targets.slice(0, 5) // Limit to 5 targets for performance
        }]);
      } else {
        console.log('⚠️ Ice Nova already active, skipping');
      }
      
      // Set frozen targets with their positions for persistent ice cubes
      const frozenData = targets.map(t => ({ 
        ...t, 
        id: t.id || Date.now(),
        x: t.x,
        y: t.y
      }));
      setFrozenTargets(frozenData);
      setPersistentFrozenTargets(frozenData); // Set persistent targets separately
      
      // Don't call onComplete immediately - let the effect play first
      // The ImageIceNovaEffect will handle calling onComplete
    }
  }, [activeSpell, spellPositions]); // Removed onComplete to prevent re-renders

  return (
    <>
      {/* NEW Image-based Pyroblast Effect - Uses your custom images! */}
      {fireEffects.map(effect => (
        <ImagePyroblastEffect
          key={effect.id}
          casterPos={effect.casterPos}
          targetPos={effect.targetPos}
          onComplete={() => {
            setFireEffects([]);
            onComplete();
          }}
        />
      ))}
      
      {/* NEW EPIC Image-based Chain Lightning Effect! */}
      {lightningEffects.map(effect => (
        <ImageChainLightningEffect
          key={effect.id}
          casterPos={effect.casterPos}
          targets={effect.targets}
          onComplete={() => {
            setLightningEffects([]);
            onComplete();
          }}
        />
      ))}
      
      {/* NEW EPIC Image-based Ice Nova Effect! */}
      {iceEffects.map(effect => (
        <ImageIceNovaEffect
          key={effect.id}
          casterPos={effect.casterPos}
          targets={effect.targets}
          onComplete={() => {
            // Let the animation finish naturally - don't clear immediately
            // The animation will run for its full duration (2 seconds)
            
            // Call onComplete to continue game flow
            if (onComplete) onComplete();
            
            // Clear the effect after animation completes
            setTimeout(() => {
              setIceEffects([]);
              setFrozenTargets([]);
            }, 3000); // 3 seconds for full animation
            
            // Keep ice cubes visible for the freeze duration
            setTimeout(() => {
              setPersistentFrozenTargets([]); // Clear ice cubes after freeze ends
            }, 10000); // 10 seconds for freeze duration
          }}
        />
      ))}
      
      {/* Persistent Ice Cubes on Frozen Targets */}
      {persistentFrozenTargets.length > 0 && (
        <PersistentIceCubes
          frozenTargets={persistentFrozenTargets}
          duration={10000} // 10 seconds to match freeze duration
        />
      )}
      
      {/* Three.js Ice Nova Effect - EPIC VERSION */}
      {threeJsIceNova && (
        <Suspense fallback={null}>
          <EpicIceNovaEffect 
            sourcePos={threeJsIceNova.sourcePos}
            targets={threeJsIceNova.targets}
            onComplete={() => {
              console.log('Ice Nova effect completed')
              setThreeJsIceNova(null)
            }}
          />
        </Suspense>
      )}
      
      {/* CSS Pyroblast Fireball - Disabled when using image-based effects */}
      {fireEffects.length === 0 && fireEffects.filter(e => e.type === 'fireball').map(effect => (
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

      {/* Ice Wave - DISABLED when using Three.js Ice Nova */}
      {!threeJsIceNova && iceEffects.filter(e => e.type === 'ice_wave').map(effect => (
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

      {/* Freeze Prison - DISABLED when using Three.js Ice Nova */}
      {!threeJsIceNova && iceEffects.filter(e => e.type === 'freeze_prison').map(effect => (
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

      {/* Ice Shards - DISABLED when using Three.js Ice Nova */}
      {!threeJsIceNova && iceEffects.filter(e => e.type === 'ice_shard').map(effect => (
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