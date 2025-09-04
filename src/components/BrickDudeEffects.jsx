import React, { useState, useEffect, useRef } from 'react';

const BrickDudeEffects = ({ spell, positions, onComplete }) => {
  const [animationPhase, setAnimationPhase] = useState('start');
  const [slashPosition, setSlashPosition] = useState(null);
  const [shieldPositions, setShieldPositions] = useState([]);
  const [whirlwindAngle, setWhirlwindAngle] = useState(0);
  const attackerRef = useRef(null);

  useEffect(() => {
    if (!spell || !positions) return;

    const casterPos = positions.caster;
    const targetPositions = positions.targets || [];

    if (spell.ability?.animation === 'sword_slash') {
      // Sword Slash - Physical card attack Hearthstone style
      const target = targetPositions[0];
      if (!target) return;

      // Get the actual caster card element
      const casterElement = document.getElementById(`char-${spell.caster.instanceId}`);
      if (!casterElement) return;

      // Store original position and styles
      const originalTransform = casterElement.style.transform || '';
      const originalTransition = casterElement.style.transition || '';
      const originalZIndex = casterElement.style.zIndex || '';
      
      // Calculate movement distance
      const rect = casterElement.getBoundingClientRect();
      const startX = rect.left + rect.width / 2;
      const startY = rect.top + rect.height / 2;
      
      const moveX = target.x - casterPos.x;
      const moveY = target.y - casterPos.y;

      // Phase 1: Quick subtle wind-up (lift slightly backwards)
      casterElement.style.transition = 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)';
      casterElement.style.transform = `${originalTransform} translateX(-10px) translateY(-10px) scale(1.05)`;
      casterElement.style.zIndex = '100';
      
      // Phase 2: Smooth charge to near target (90% of distance)
      setTimeout(() => {
        const attackX = moveX * 0.9;
        const attackY = moveY * 0.9;
        casterElement.style.transition = 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)';
        casterElement.style.transform = `translate(${attackX}px, ${attackY}px) scale(1.1)`;
      }, 150);

      // Phase 3: Quick strike (complete the final 10% with impact)
      setTimeout(() => {
        // Final position for clean hit
        casterElement.style.transition = 'all 0.08s ease-out';
        casterElement.style.transform = `translate(${moveX}px, ${moveY}px) scale(1.15)`;
        
        // Play impact sound on contact
        const impactSound = new Audio('/impact.mp3');
        impactSound.volume = 0.5;
        impactSound.play().catch(err => console.log('Impact sound failed:', err));
        
        // Show slash effect at impact
        setSlashPosition({
          x: target.x,
          y: target.y
        });
        setAnimationPhase('impact');
        
        // Camera shake DISABLED
        // document.body.style.transition = 'transform 0.05s';
        // document.body.style.transform = 'translateX(2px)';
        // setTimeout(() => {
        //   document.body.style.transform = 'translateX(-2px)';
        //   setTimeout(() => {
        //     document.body.style.transform = 'translateX(0)';
        //   }, 50);
        // }, 50);
      }, 400);

      // Phase 4: Smooth elastic return
      setTimeout(() => {
        casterElement.style.transition = 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)';
        casterElement.style.transform = originalTransform;
        casterElement.style.zIndex = originalZIndex;
      }, 550);

      // Cleanup
      setTimeout(() => {
        casterElement.style.transition = originalTransition;
        onComplete();
      }, 900);

    } else if (spell.ability?.animation === 'block_shield') {
      // Block Defence - Shield all allies
      setShieldPositions(targetPositions);
      setAnimationPhase('shield');

      setTimeout(() => {
        onComplete();
      }, 2000);

    } else if (spell.ability?.animation === 'whirlwind') {
      // Whirlwind Slash - Move to center and spin
      setAnimationPhase('whirlwind');
      
      // Play ultimate sound effect
      const ultimateSound = new Audio('/brickdudeultimate.wav');
      ultimateSound.volume = 0.6;
      ultimateSound.play().catch(err => console.log('Ultimate sound failed:', err));
      
      // Get the caster card element
      const casterElement = document.getElementById(`char-${spell.caster.instanceId}`);
      if (!casterElement) return;

      // Store original position and styles
      const originalTransform = casterElement.style.transform || '';
      const originalTransition = casterElement.style.transition || '';
      const originalZIndex = casterElement.style.zIndex || '';
      
      // Calculate center of screen
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      const rect = casterElement.getBoundingClientRect();
      const centerX = screenWidth / 2 - rect.left - rect.width / 2;
      const centerY = screenHeight / 2 - rect.top - rect.height / 2;

      // Phase 1: Move to center with lift (500ms)
      casterElement.style.transition = 'all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      casterElement.style.transform = `translate(${centerX}px, ${centerY}px) scale(1.3)`;
      casterElement.style.zIndex = '200';
      
      // Phase 2: Start spinning after reaching center - 10 full spins
      setTimeout(() => {
        // Spin animation - 10 full rotations (3600 degrees)
        let angle = 0;
        const spinInterval = setInterval(() => {
          angle += 120; // 120 degrees per frame
          casterElement.style.transition = 'none';
          casterElement.style.transform = `translate(${centerX}px, ${centerY}px) scale(1.3) rotate(${angle}deg)`;
          setWhirlwindAngle(angle);
          
          if (angle >= 3600) { // 10 full spins
            clearInterval(spinInterval);
          }
        }, 20); // Very fast spin (20ms intervals)
      }, 500); // Start after move completes

      // Show cascading damage AFTER reaching center and starting to spin
      targetPositions.forEach((target, index) => {
        setTimeout(() => {
          // Play impact sound for each hit with decreasing volume
          const impactSound = new Audio('/impact.mp3');
          impactSound.volume = index === 0 ? 0.5 : index === 1 ? 0.3 : 0.2;
          impactSound.play().catch(err => console.log('Impact sound failed:', err));
          
          setSlashPosition({
            x: target.x,
            y: target.y,
            intensity: index === 0 ? 1.0 : index === 1 ? 0.6 : 0.3
          });
          
          // Clear slash effect after a moment
          setTimeout(() => {
            setSlashPosition(null);
          }, 300);
        }, 1100 + (100 * index)); // Start at 1100ms (after reaching center and ~5 spins)
      });

      // Phase 3: Return to original position after all spins complete
      setTimeout(() => {
        casterElement.style.transition = 'all 0.5s ease-in-out';
        casterElement.style.transform = originalTransform;
        casterElement.style.zIndex = originalZIndex;
      }, 1700); // Return after spins complete

      // Cleanup
      setTimeout(() => {
        casterElement.style.transition = originalTransition;
        onComplete();
      }, 2200); // Complete animation
    }
  }, [spell, positions, onComplete]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[60]">
      {/* Sword Slash - Impact Effects Only (card movement handled by DOM manipulation) */}
      {spell?.ability?.animation === 'sword_slash' && slashPosition && animationPhase === 'impact' && (
        <div
          className="absolute animate-slash"
          style={{
            left: slashPosition.x,
            top: slashPosition.y,
            transform: 'translate(-50%, -50%)'
          }}
        >
          {/* Slash Lines */}
          <div className="relative w-32 h-32">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="absolute w-40 h-1 bg-gradient-to-r from-transparent via-white to-transparent transform rotate-45 animate-expand" />
              <div className="absolute w-40 h-1 bg-gradient-to-r from-transparent via-white to-transparent transform -rotate-45 animate-expand" />
            </div>
            {/* Sparks */}
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-yellow-300 rounded-full animate-spark"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: `rotate(${i * 45}deg) translateY(-20px)`,
                  animationDelay: `${i * 50}ms`
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Block Defence - Shield Animation */}
      {spell?.ability?.animation === 'block_shield' && shieldPositions.map((pos, index) => (
        <div
          key={index}
          className="absolute"
          style={{
            left: pos.x,
            top: pos.y,
            transform: 'translate(-50%, -50%)'
          }}
        >
          {/* Shield Bubble */}
          <div className="relative">
            {/* Outer Shield */}
            <div className="absolute inset-0 w-32 h-32 animate-shield-grow">
              <div className="w-full h-full border-4 border-blue-400 rounded-full opacity-60 animate-pulse" />
            </div>
            {/* Inner Shield with Brick Pattern */}
            <div className="absolute inset-0 w-32 h-32 flex items-center justify-center">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-300 to-cyan-400 rounded-full opacity-40 animate-shield-rotate">
                {/* Brick Pattern Inside Shield */}
                <div className="w-full h-full rounded-full overflow-hidden">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex gap-1 p-1">
                      {[...Array(3)].map((_, j) => (
                        <div key={j} className="flex-1 h-3 bg-blue-600 opacity-50 rounded-sm" />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Shield Icon */}
            <div className="absolute inset-0 w-32 h-32 flex items-center justify-center text-4xl animate-bounce">
              🛡️
            </div>
          </div>
        </div>
      ))}

      {/* Whirlwind Slash - Spinning Attack */}
      {spell?.ability?.animation === 'whirlwind' && animationPhase === 'whirlwind' && (
        <>
          {/* Whirlwind Visual Effects at Center */}
          <div
            className="absolute"
            style={{
              left: '50%',
              top: '50%',
              transform: `translate(-50%, -50%)`,
              pointerEvents: 'none',
              zIndex: 150
            }}
          >
            <div className="relative w-64 h-64">
              {/* Whirlwind Effect Circles */}
              <div className="absolute inset-0 rounded-full border-4 border-red-400 opacity-30 animate-pulse" />
              <div className="absolute inset-4 rounded-full border-4 border-orange-400 opacity-40 animate-pulse animation-delay-100" />
              <div className="absolute inset-8 rounded-full border-4 border-yellow-400 opacity-50 animate-pulse animation-delay-200" />
              
              {/* Sword trail effects */}
              {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
                <div
                  key={angle}
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ 
                    transform: `rotate(${angle + whirlwindAngle}deg)`,
                    opacity: 0.3
                  }}
                >
                  <div className="absolute w-32 h-1 bg-gradient-to-r from-transparent via-white to-transparent" />
                </div>
              ))}
            </div>
          </div>

          {/* Cascading Slash Effects */}
          {slashPosition && (
            <div
              className="absolute"
              style={{
                left: slashPosition.x,
                top: slashPosition.y,
                transform: 'translate(-50%, -50%)',
                opacity: slashPosition.intensity
              }}
            >
              <div className="relative w-32 h-32">
                {/* Circular Slash */}
                <div className="absolute inset-0 rounded-full border-4 border-red-500 animate-expand" />
                <div className="absolute inset-0 flex items-center justify-center text-3xl animate-spin">
                  💥
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <style jsx>{`
        @keyframes spin-attack {
          0% {
            transform: translate(var(--center-x), var(--center-y)) scale(1.3) rotate(0deg);
          }
          100% {
            transform: translate(var(--center-x), var(--center-y)) scale(1.3) rotate(720deg);
          }
        }

        @keyframes spin-visual {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @keyframes spin-visual-reverse {
          0% {
            transform: rotate(360deg);
          }
          100% {
            transform: rotate(0deg);
          }
        }

        @keyframes expand {
          0% {
            width: 0;
            opacity: 1;
          }
          100% {
            width: 160px;
            opacity: 0;
          }
        }

        @keyframes spark {
          0% {
            transform: rotate(var(--rotation)) translateY(-20px) scale(1);
            opacity: 1;
          }
          100% {
            transform: rotate(var(--rotation)) translateY(-60px) scale(0);
            opacity: 0;
          }
        }

        @keyframes shield-grow {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.8;
          }
          100% {
            transform: scale(1);
            opacity: 0.6;
          }
        }

        @keyframes shield-rotate {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        .animate-slash {
          animation: slash-fade 0.5s ease-out;
        }

        @keyframes slash-fade {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.5);
          }
          50% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.2);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(1);
          }
        }

        .animate-expand {
          animation: expand 0.5s ease-out;
        }

        .animate-spark {
          animation: spark 0.6s ease-out;
        }

        .animate-shield-grow {
          animation: shield-grow 1s ease-out;
        }

        .animate-shield-rotate {
          animation: shield-rotate 2s linear infinite;
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

export default BrickDudeEffects;