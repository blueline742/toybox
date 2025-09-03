import React, { useEffect, useState } from 'react';
import musicManager from '../utils/musicManager';

const PirateEffects = ({ 
  activeSpell, 
  spellPositions, 
  onComplete,
  playerPositions,
  opponentPositions
}) => {
  const [cannonEffects, setCannonEffects] = useState([]);
  const [krakenEffects, setKrakenEffects] = useState([]);
  const [grogEffects, setGrogEffects] = useState([]);

  useEffect(() => {
    if (!activeSpell || !spellPositions) return;

    const animationType = activeSpell.ability?.animation || activeSpell.ability?.id;
    const targets = spellPositions.targets || [];
    const casterPos = spellPositions.caster;

    if (animationType === 'explosion' || activeSpell.ability?.id === 'cannon_blast') {
      // Play pirate attack sound
      if (!musicManager.isMuted) {
        const pirateSound = new Audio('/pirate.mp3');
        pirateSound.volume = 0.5;
        pirateSound.play().catch(err => console.log('Could not play pirate sound:', err));
      }
      
      // CANNON BLAST - Explosive cannonball
      const cannonball = {
        id: Date.now(),
        type: 'cannonball',
        startX: casterPos.x,
        startY: casterPos.y,
        endX: targets[0]?.x || casterPos.x,
        endY: targets[0]?.y || casterPos.y
      };
      
      setCannonEffects([cannonball]);
      
      // Explosion on impact
      setTimeout(() => {
        setCannonEffects(prev => [...prev, {
          id: Date.now() + 1,
          type: 'explosion',
          x: targets[0]?.x || casterPos.x,
          y: targets[0]?.y || casterPos.y
        }]);
      }, 500);

      setTimeout(() => {
        setCannonEffects([]);
        onComplete();
      }, 2000);

    } else if (animationType === 'healing_aura' || activeSpell.ability?.id === 'grog_heal') {
      // Play pirate drinking sound
      if (!musicManager.isMuted) {
        const grogSound = new Audio('/pirate.mp3');
        grogSound.volume = 0.3; // Quieter for healing
        grogSound.play().catch(err => console.log('Could not play grog sound:', err));
      }
      
      // GROG HEAL - Drinking animation
      const grog = {
        id: Date.now(),
        x: casterPos.x,
        y: casterPos.y
      };
      
      setGrogEffects([grog]);

      setTimeout(() => {
        setGrogEffects([]);
        onComplete();
      }, 1500);

    } else if (animationType === 'poison_cloud' || activeSpell.ability?.id === 'kraken_summon') {
      // Play pirate ultimate sound
      if (!musicManager.isMuted) {
        const ultimateSound = new Audio('/pirateult.mp3');
        ultimateSound.volume = 0.7;
        ultimateSound.play().catch(err => console.log('Could not play pirate ultimate sound:', err));
      }
      
      // RELEASE THE KRAKEN - Tentacle attacks
      const tentacles = targets.map((target, index) => ({
        id: Date.now() + index,
        x: target.x,
        y: target.y,
        delay: index * 200
      }));
      
      setKrakenEffects(tentacles);

      setTimeout(() => {
        setKrakenEffects([]);
        onComplete();
      }, 3000);

    } else {
      // Default completion for unknown animations
      setTimeout(onComplete, 1000);
    }
  }, [activeSpell, spellPositions, onComplete]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {/* Cannon Ball Effects */}
      {cannonEffects.map(effect => (
        <div key={effect.id}>
          {effect.type === 'cannonball' && (
            <div
              className="absolute animate-cannon-fly"
              style={{
                left: effect.startX,
                top: effect.startY,
                '--end-x': `${effect.endX - effect.startX}px`,
                '--end-y': `${effect.endY - effect.startY}px`,
                animation: 'cannonFly 0.5s ease-out forwards'
              }}
            >
              <div className="w-12 h-12 bg-gray-800 rounded-full border-2 border-gray-600 shadow-xl">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-700 to-gray-900" />
              </div>
            </div>
          )}
          {effect.type === 'explosion' && (
            <div
              className="absolute"
              style={{ left: effect.x - 60, top: effect.y - 60 }}
            >
              <div className="w-32 h-32 animate-explosion">
                <div className="absolute inset-0 bg-orange-500 rounded-full animate-ping" />
                <div className="absolute inset-2 bg-yellow-400 rounded-full animate-ping animation-delay-100" />
                <div className="absolute inset-4 bg-red-500 rounded-full animate-ping animation-delay-200" />
                {/* Smoke particles */}
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-8 h-8 bg-gray-600 rounded-full opacity-60 animate-smoke-particle"
                    style={{
                      left: '50%',
                      top: '50%',
                      transform: `rotate(${i * 45}deg) translateX(40px)`,
                      animationDelay: `${i * 50}ms`
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Grog Heal Effects */}
      {grogEffects.map(effect => (
        <div
          key={effect.id}
          className="absolute"
          style={{ left: effect.x - 30, top: effect.y - 60 }}
        >
          <div className="animate-drink">
            {/* Bottle */}
            <div className="w-16 h-20 relative">
              <div className="absolute bottom-0 w-full h-14 bg-amber-700 rounded-b-lg" />
              <div className="absolute top-0 w-8 h-8 bg-amber-800 rounded-t-lg mx-auto left-0 right-0" />
              <div className="absolute bottom-2 left-2 right-2 h-10 bg-amber-500 rounded animate-liquid-drain" />
              {/* Bubbles */}
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 bg-white/40 rounded-full animate-bubble-rise"
                  style={{
                    bottom: '10px',
                    left: `${20 + i * 8}px`,
                    animationDelay: `${i * 200}ms`
                  }}
                />
              ))}
            </div>
            {/* Healing sparkles */}
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute w-3 h-3 bg-green-400 rounded-full animate-heal-sparkle"
                style={{
                  left: `${Math.random() * 60}px`,
                  top: `${Math.random() * 60}px`,
                  animationDelay: `${i * 150}ms`
                }}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Kraken Effects */}
      {krakenEffects.map(effect => (
        <div
          key={effect.id}
          className="absolute"
          style={{ 
            left: effect.x - 50, 
            top: effect.y - 50,
            animationDelay: `${effect.delay}ms`
          }}
        >
          <div className="w-24 h-32 animate-tentacle-attack">
            {/* Tentacle */}
            <svg viewBox="0 0 100 120" className="w-full h-full">
              <path
                d="M50 120 Q30 90 35 60 Q40 30 50 0 Q60 30 65 60 Q70 90 50 120"
                fill="url(#tentacleGradient)"
                stroke="#2d1b69"
                strokeWidth="2"
                className="animate-tentacle-wave"
              />
              <defs>
                <linearGradient id="tentacleGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#4a2d8a', stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: '#1a0d3a', stopOpacity: 1 }} />
                </linearGradient>
              </defs>
              {/* Suction cups */}
              {[20, 40, 60, 80].map(y => (
                <circle
                  key={y}
                  cx="50"
                  cy={y}
                  r="4"
                  fill="#8b5cf6"
                  opacity="0.6"
                />
              ))}
            </svg>
            {/* Water splash */}
            <div className="absolute -inset-4 animate-water-splash">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 bg-blue-400 rounded-full"
                  style={{
                    left: '50%',
                    top: '50%',
                    transform: `rotate(${i * 30}deg) translateX(30px)`,
                    animation: 'splashOut 0.8s ease-out forwards',
                    animationDelay: `${i * 30}ms`
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      ))}

      <style jsx>{`
        @keyframes cannonFly {
          0% {
            transform: translate(0, 0) rotate(0deg);
          }
          100% {
            transform: translate(var(--end-x), var(--end-y)) rotate(720deg);
          }
        }

        @keyframes explosion {
          0% {
            transform: scale(0.1);
            opacity: 1;
          }
          50% {
            transform: scale(1.5);
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }

        @keyframes smoke-particle {
          0% {
            opacity: 0.6;
            transform: rotate(inherit) translateX(40px) scale(0.5);
          }
          100% {
            opacity: 0;
            transform: rotate(inherit) translateX(80px) scale(1.5);
          }
        }

        @keyframes drink {
          0%, 100% {
            transform: rotate(0deg);
          }
          25% {
            transform: rotate(-30deg);
          }
          75% {
            transform: rotate(30deg);
          }
        }

        @keyframes liquid-drain {
          0% {
            height: 10px;
          }
          100% {
            height: 2px;
          }
        }

        @keyframes bubble-rise {
          0% {
            transform: translateY(0) scale(0.5);
            opacity: 0.4;
          }
          100% {
            transform: translateY(-30px) scale(1);
            opacity: 0;
          }
        }

        @keyframes heal-sparkle {
          0% {
            transform: scale(0) rotate(0deg);
            opacity: 1;
          }
          50% {
            transform: scale(1) rotate(180deg);
          }
          100% {
            transform: scale(0) rotate(360deg);
            opacity: 0;
          }
        }

        @keyframes tentacle-attack {
          0% {
            transform: translateY(100px) scale(0);
            opacity: 0;
          }
          30% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
          60% {
            transform: translateY(-10px) scale(1.1);
          }
          100% {
            transform: translateY(100px) scale(0);
            opacity: 0;
          }
        }

        @keyframes tentacle-wave {
          0%, 100% {
            d: path("M50 120 Q30 90 35 60 Q40 30 50 0 Q60 30 65 60 Q70 90 50 120");
          }
          50% {
            d: path("M50 120 Q70 90 65 60 Q60 30 50 0 Q40 30 35 60 Q30 90 50 120");
          }
        }

        @keyframes splashOut {
          0% {
            transform: rotate(inherit) translateX(30px) scale(1);
            opacity: 0.8;
          }
          100% {
            transform: rotate(inherit) translateX(60px) scale(0);
            opacity: 0;
          }
        }

        @keyframes water-splash {
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

        .animate-cannon-fly {
          animation: cannonFly 0.5s ease-out forwards;
        }

        .animate-explosion {
          animation: explosion 1s ease-out forwards;
        }

        .animate-smoke-particle {
          animation: smoke-particle 1s ease-out forwards;
        }

        .animate-drink {
          animation: drink 1.5s ease-in-out;
        }

        .animate-liquid-drain {
          animation: liquid-drain 1.5s ease-out forwards;
        }

        .animate-bubble-rise {
          animation: bubble-rise 1s ease-out infinite;
        }

        .animate-heal-sparkle {
          animation: heal-sparkle 1s ease-out forwards;
        }

        .animate-tentacle-attack {
          animation: tentacle-attack 2s ease-in-out forwards;
        }

        .animate-tentacle-wave {
          animation: tentacle-wave 2s ease-in-out infinite;
        }

        .animate-water-splash {
          animation: water-splash 1s ease-out forwards;
        }

        .animation-delay-100 {
          animation-delay: 100ms;
        }

        .animation-delay-200 {
          animation-delay: 200ms;
        }
      `}</style>
    </div>
  );
};

export default PirateEffects;