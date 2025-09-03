import React, { useEffect, useState } from 'react';
import musicManager from '../utils/musicManager';

const RubberDuckieEffects = ({ 
  activeSpell, 
  spellPositions, 
  onComplete,
  playerPositions,
  opponentPositions
}) => {
  const [splashEffects, setSplashEffects] = useState([]);
  const [bubbleEffects, setBubbleEffects] = useState([]);
  const [duckSwarm, setDuckSwarm] = useState([]);
  const [waterWave, setWaterWave] = useState(false);

  useEffect(() => {
    if (!activeSpell || !spellPositions) return;

    const animationType = activeSpell.ability?.animation || activeSpell.ability?.id;
    const targets = spellPositions.targets || [];
    const casterPos = spellPositions.caster;

    if (animationType === 'splash_peck' || activeSpell.ability?.id === 'splash_peck') {
      // Play squeak sound
      if (!musicManager.isMuted) {
        const squeakSound = new Audio('/ducksqueak.wav');
        squeakSound.volume = 0.5;
        squeakSound.play().catch(() => {
          // Fallback to creating our own squeak
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.value = 800;
          oscillator.type = 'sine';
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
          
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.1);
        });
      }
      
      // SPLASH PECK - Water splash at target
      const splash = {
        id: Date.now(),
        x: targets[0]?.x || casterPos.x,
        y: targets[0]?.y || casterPos.y
      };
      
      setSplashEffects([splash]);

      setTimeout(() => {
        setSplashEffects([]);
        onComplete();
      }, 1500);

    } else if (animationType === 'soap_spray' || activeSpell.ability?.id === 'soap_spray') {
      // Play bubble sound
      if (!musicManager.isMuted) {
        const bubbleSound = new Audio('/bubblepop.wav');
        bubbleSound.volume = 0.3;
        bubbleSound.play().catch(() => {
          // Create bubble pop sound
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.value = 400;
          oscillator.type = 'sine';
          gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
          
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.2);
        });
      }
      
      // SOAP SPRAY - Create rainbow bubbles
      const bubbles = [];
      for (let i = 0; i < 15; i++) {
        bubbles.push({
          id: Date.now() + i,
          startX: casterPos.x,
          startY: casterPos.y,
          endX: targets[0]?.x || casterPos.x,
          endY: targets[0]?.y || casterPos.y,
          delay: i * 50,
          size: Math.random() * 30 + 20,
          color: `hsl(${Math.random() * 360}, 70%, 60%)`
        });
      }
      
      setBubbleEffects(bubbles);

      setTimeout(() => {
        setBubbleEffects([]);
        onComplete();
      }, 2000);

    } else if (animationType === 'duck_swarm' || activeSpell.ability?.id === 'duck_swarm') {
      // Play epic duck army sound
      if (!musicManager.isMuted) {
        // Play multiple squeaks
        for (let i = 0; i < 3; i++) {
          setTimeout(() => {
            const squeakSound = new Audio('/ducksqueak.wav');
            squeakSound.volume = 0.3;
            squeakSound.playbackRate = 0.8 + Math.random() * 0.4;
            squeakSound.play().catch(() => {
              // Create varied squeak sounds
              const audioContext = new (window.AudioContext || window.webkitAudioContext)();
              const oscillator = audioContext.createOscillator();
              const gainNode = audioContext.createGain();
              
              oscillator.connect(gainNode);
              gainNode.connect(audioContext.destination);
              
              oscillator.frequency.value = 600 + Math.random() * 400;
              oscillator.type = 'sine';
              gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
              gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
              
              oscillator.start(audioContext.currentTime);
              oscillator.stop(audioContext.currentTime + 0.15);
            });
          }, i * 200);
        }
      }
      
      // DUCK SWARM ULTIMATE - Army of rubber duckies!
      const duckies = [];
      const targetPositions = targets.length > 0 ? targets : opponentPositions?.map(p => ({ x: p.x || 0, y: p.y || 0 })) || [];
      
      for (let i = 0; i < 25; i++) {
        const target = targetPositions[Math.floor(Math.random() * targetPositions.length)] || { x: 0, y: 0 };
        duckies.push({
          id: Date.now() + i,
          startX: Math.random() * window.innerWidth,
          startY: -50,
          targetX: target.x,
          targetY: target.y,
          delay: Math.random() * 500,
          size: Math.random() * 20 + 25,
          speed: Math.random() * 2 + 1,
          wobble: Math.random() * 30 - 15
        });
      }
      
      setDuckSwarm(duckies);
      setWaterWave(true);

      setTimeout(() => {
        setDuckSwarm([]);
        setWaterWave(false);
        onComplete();
      }, 4000);

    } else {
      // Default completion
      setTimeout(onComplete, 1000);
    }
  }, [activeSpell, spellPositions, onComplete, opponentPositions]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {/* Water Wave Effect for Ultimate */}
      {waterWave && (
        <div 
          className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-blue-400/40 to-transparent"
          style={{
            animation: 'waterRise 2s ease-out forwards'
          }}
        >
          <div className="absolute inset-0">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="absolute w-full h-8 bg-blue-300/20"
                style={{
                  bottom: `${i * 15}px`,
                  animation: `wave ${1 + i * 0.2}s ease-in-out infinite`,
                  animationDelay: `${i * 0.1}s`
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Splash Effects */}
      {splashEffects.map(effect => (
        <div
          key={effect.id}
          className="absolute"
          style={{ left: effect.x - 50, top: effect.y - 50 }}
        >
          <div className="relative w-24 h-24">
            {/* Water splash circles */}
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="absolute inset-0 border-4 border-blue-400 rounded-full"
                style={{
                  animation: `splashRipple ${0.8 + i * 0.2}s ease-out forwards`,
                  animationDelay: `${i * 0.1}s`,
                  opacity: 1 - i * 0.3
                }}
              />
            ))}
            {/* Water droplets */}
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-3 h-3 bg-blue-400 rounded-full"
                style={{
                  left: '50%',
                  top: '50%',
                  animation: `waterDroplet 0.8s ease-out forwards`,
                  transform: `rotate(${i * 45}deg) translateX(0)`,
                  '--angle': `${i * 45}deg`
                }}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Soap Bubble Effects */}
      {bubbleEffects.map(bubble => (
        <div
          key={bubble.id}
          className="absolute animate-bubble-float"
          style={{
            left: bubble.startX,
            top: bubble.startY,
            '--end-x': `${bubble.endX - bubble.startX}px`,
            '--end-y': `${bubble.endY - bubble.startY}px`,
            animationDelay: `${bubble.delay}ms`,
            animation: 'bubbleFloat 2s ease-out forwards'
          }}
        >
          <div 
            className="rounded-full border-2"
            style={{
              width: `${bubble.size}px`,
              height: `${bubble.size}px`,
              background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8), transparent 50%)`,
              borderColor: bubble.color,
              boxShadow: `0 0 10px ${bubble.color}`,
              animation: 'bubbleShimmer 1s ease-in-out infinite'
            }}
          >
            <div 
              className="absolute w-2 h-2 bg-white rounded-full"
              style={{
                top: '20%',
                left: '25%',
                opacity: 0.8
              }}
            />
          </div>
        </div>
      ))}

      {/* Duck Swarm Ultimate */}
      {duckSwarm.map(duck => (
        <div
          key={duck.id}
          className="absolute"
          style={{
            left: duck.startX,
            top: duck.startY,
            animation: `duckAttack ${duck.speed}s ease-in-out forwards`,
            animationDelay: `${duck.delay}ms`,
            '--target-x': `${duck.targetX - duck.startX}px`,
            '--target-y': `${duck.targetY + 50}px`,
            '--wobble': `${duck.wobble}deg`
          }}
        >
          <div 
            className="text-3xl"
            style={{
              fontSize: `${duck.size}px`,
              animation: 'duckWobble 0.5s ease-in-out infinite',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
            }}
          >
            🦆
          </div>
        </div>
      ))}

      <style jsx>{`
        @keyframes waterRise {
          0% {
            transform: translateY(100%);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateY(0);
            opacity: 0.6;
          }
        }

        @keyframes wave {
          0%, 100% {
            transform: translateX(0) scaleY(1);
          }
          50% {
            transform: translateX(-20px) scaleY(1.2);
          }
        }

        @keyframes splashRipple {
          0% {
            transform: scale(0);
            opacity: 1;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }

        @keyframes waterDroplet {
          0% {
            transform: rotate(var(--angle)) translateX(0);
            opacity: 1;
          }
          100% {
            transform: rotate(var(--angle)) translateX(50px) translateY(20px);
            opacity: 0;
          }
        }

        @keyframes bubbleFloat {
          0% {
            transform: translate(0, 0) scale(0);
            opacity: 0;
          }
          20% {
            transform: translate(calc(var(--end-x) * 0.2), calc(var(--end-y) * 0.1)) scale(1);
            opacity: 1;
          }
          60% {
            transform: translate(calc(var(--end-x) * 0.7), calc(var(--end-y) * 0.6)) scale(1.1);
            opacity: 1;
          }
          90% {
            transform: translate(var(--end-x), var(--end-y)) scale(1.2);
            opacity: 1;
          }
          100% {
            transform: translate(var(--end-x), var(--end-y)) scale(0);
            opacity: 0;
          }
        }

        @keyframes bubbleShimmer {
          0%, 100% {
            transform: rotate(0deg);
          }
          50% {
            transform: rotate(180deg);
          }
        }

        @keyframes duckAttack {
          0% {
            transform: translate(0, 0) rotate(0deg);
          }
          30% {
            transform: translate(calc(var(--target-x) * 0.3), 200px) rotate(var(--wobble));
          }
          60% {
            transform: translate(calc(var(--target-x) * 0.7), 150px) rotate(calc(var(--wobble) * -1));
          }
          100% {
            transform: translate(var(--target-x), var(--target-y)) rotate(0deg) scale(1.2);
          }
        }

        @keyframes duckWobble {
          0%, 100% {
            transform: rotate(-10deg) scaleX(1);
          }
          50% {
            transform: rotate(10deg) scaleX(0.9);
          }
        }
      `}</style>
    </div>
  );
};

export default RubberDuckieEffects;