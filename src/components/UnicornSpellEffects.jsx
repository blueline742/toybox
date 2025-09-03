import React, { useEffect, useState } from 'react'

const UnicornSpellEffects = ({ spell, caster, target, isActive, onComplete }) => {
  const [effectPhase, setEffectPhase] = useState(0)
  
  useEffect(() => {
    if (!isActive) return
    
    // Progress through effect phases
    const phases = {
      'rainbow_blast': 3,
      'healing_aura': 2,
      'magic_shield': 2,
      'prismatic_storm': 4
    }
    
    const maxPhase = phases[spell] || 1
    let currentPhase = 0
    
    const interval = setInterval(() => {
      currentPhase++
      if (currentPhase <= maxPhase) {
        setEffectPhase(currentPhase)
      } else {
        clearInterval(interval)
        if (onComplete) onComplete()
      }
    }, 500)
    
    return () => clearInterval(interval)
  }, [isActive, spell, onComplete])
  
  if (!isActive) return null
  
  // Rainbow Blast Effect
  if (spell === 'rainbow_blast') {
    return (
      <div className="fixed inset-0 pointer-events-none z-50">
        {/* Rainbow Beam */}
        <svg className="absolute inset-0 w-full h-full">
          <defs>
            <linearGradient id="rainbow-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style={{ stopColor: '#FF0000' }} />
              <stop offset="16.66%" style={{ stopColor: '#FF8800' }} />
              <stop offset="33.33%" style={{ stopColor: '#FFFF00' }} />
              <stop offset="50%" style={{ stopColor: '#00FF00' }} />
              <stop offset="66.66%" style={{ stopColor: '#0088FF' }} />
              <stop offset="83.33%" style={{ stopColor: '#0000FF' }} />
              <stop offset="100%" style={{ stopColor: '#8800FF' }} />
            </linearGradient>
          </defs>
          
          {/* Animated Rainbow Beam */}
          {effectPhase >= 1 && (
            <path
              d={`M ${caster?.x || 200} ${caster?.y || 400} Q ${(caster?.x || 200) + 200} ${(caster?.y || 400) - 100} ${target?.x || 600} ${target?.y || 400}`}
              stroke="url(#rainbow-gradient)"
              strokeWidth="40"
              fill="none"
              opacity={effectPhase === 3 ? 0 : 1}
              style={{
                filter: 'blur(2px)',
                animation: 'rainbow-pulse 0.5s ease-in-out infinite'
              }}
            />
          )}
        </svg>
        
        {/* Rainbow Sparkles */}
        {effectPhase >= 2 && [...Array(20)].map((_, i) => (
          <div
            key={`sparkle-${i}`}
            className="absolute w-2 h-2 rounded-full"
            style={{
              left: `${target?.x || 50}%`,
              top: `${target?.y || 50}%`,
              background: ['#FF0000', '#FF8800', '#FFFF00', '#00FF00', '#0088FF', '#0000FF', '#8800FF'][i % 7],
              animation: `sparkle-explode-${i % 4} 1s ease-out forwards`,
              animationDelay: `${i * 0.05}s`,
              boxShadow: `0 0 10px ${['#FF0000', '#FF8800', '#FFFF00', '#00FF00', '#0088FF', '#0000FF', '#8800FF'][i % 7]}`
            }}
          />
        ))}
        
        {/* Rainbow Ring Explosion */}
        {effectPhase >= 2 && (
          <div
            className="absolute rounded-full"
            style={{
              left: `${target?.x || 50}%`,
              top: `${target?.y || 50}%`,
              width: '100px',
              height: '100px',
              transform: 'translate(-50%, -50%)',
              border: '4px solid transparent',
              borderImage: 'linear-gradient(45deg, #FF0000, #FF8800, #FFFF00, #00FF00, #0088FF, #0000FF, #8800FF) 1',
              animation: 'ring-expand 1s ease-out forwards'
            }}
          />
        )}
        
        <style jsx>{`
          @keyframes rainbow-pulse {
            0%, 100% {
              strokeWidth: 40;
              opacity: 0.8;
            }
            50% {
              strokeWidth: 60;
              opacity: 1;
            }
          }
          
          @keyframes sparkle-explode-0 {
            0% {
              transform: translate(0, 0) scale(1);
              opacity: 1;
            }
            100% {
              transform: translate(-50px, -50px) scale(0);
              opacity: 0;
            }
          }
          
          @keyframes sparkle-explode-1 {
            0% {
              transform: translate(0, 0) scale(1);
              opacity: 1;
            }
            100% {
              transform: translate(50px, -50px) scale(0);
              opacity: 0;
            }
          }
          
          @keyframes sparkle-explode-2 {
            0% {
              transform: translate(0, 0) scale(1);
              opacity: 1;
            }
            100% {
              transform: translate(-50px, 50px) scale(0);
              opacity: 0;
            }
          }
          
          @keyframes sparkle-explode-3 {
            0% {
              transform: translate(0, 0) scale(1);
              opacity: 1;
            }
            100% {
              transform: translate(50px, 50px) scale(0);
              opacity: 0;
            }
          }
          
          @keyframes ring-expand {
            0% {
              width: 50px;
              height: 50px;
              opacity: 1;
            }
            100% {
              width: 300px;
              height: 300px;
              opacity: 0;
            }
          }
        `}</style>
      </div>
    )
  }
  
  // Healing Aura Effect
  if (spell === 'healing_aura') {
    return (
      <div className="fixed inset-0 pointer-events-none z-50">
        {/* Healing Sparkles Rising */}
        {[...Array(30)].map((_, i) => (
          <div
            key={`heal-${i}`}
            className="absolute"
            style={{
              left: `${(target?.x || 50) + (Math.random() * 20 - 10)}%`,
              top: `${target?.y || 50}%`,
              animation: `heal-rise ${2 + Math.random()}s ease-out forwards`,
              animationDelay: `${Math.random() * 1}s`
            }}
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{
                background: i % 3 === 0 ? '#FF69B4' : i % 3 === 1 ? '#FFB6C1' : '#FFC0CB',
                boxShadow: `0 0 10px ${i % 3 === 0 ? '#FF69B4' : i % 3 === 1 ? '#FFB6C1' : '#FFC0CB'}`,
                animation: 'pulse 1s ease-in-out infinite'
              }}
            />
          </div>
        ))}
        
        {/* Healing Aura Ring */}
        {effectPhase >= 1 && (
          <div
            className="absolute rounded-full"
            style={{
              left: `${target?.x || 50}%`,
              top: `${target?.y || 50}%`,
              width: '150px',
              height: '150px',
              transform: 'translate(-50%, -50%)',
              background: 'radial-gradient(circle, rgba(255,105,180,0.3) 0%, transparent 70%)',
              filter: 'blur(20px)',
              animation: 'aura-pulse 2s ease-in-out infinite'
            }}
          />
        )}
        
        {/* Heart Icons */}
        {effectPhase >= 2 && [...Array(5)].map((_, i) => (
          <div
            key={`heart-${i}`}
            className="absolute text-4xl"
            style={{
              left: `${(target?.x || 50) + (Math.random() * 10 - 5)}%`,
              top: `${(target?.y || 50) + 5}%`,
              animation: `heart-float 2s ease-out forwards`,
              animationDelay: `${i * 0.2}s`
            }}
          >
            💖
          </div>
        ))}
        
        <style jsx>{`
          @keyframes heal-rise {
            0% {
              transform: translateY(0) scale(1);
              opacity: 0;
            }
            20% {
              opacity: 1;
            }
            100% {
              transform: translateY(-100px) scale(0);
              opacity: 0;
            }
          }
          
          @keyframes aura-pulse {
            0%, 100% {
              transform: translate(-50%, -50%) scale(1);
              opacity: 0.5;
            }
            50% {
              transform: translate(-50%, -50%) scale(1.3);
              opacity: 1;
            }
          }
          
          @keyframes heart-float {
            0% {
              transform: translateY(0) scale(0);
              opacity: 0;
            }
            50% {
              transform: translateY(-30px) scale(1);
              opacity: 1;
            }
            100% {
              transform: translateY(-60px) scale(0);
              opacity: 0;
            }
          }
          
          @keyframes pulse {
            0%, 100% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.2);
            }
          }
        `}</style>
      </div>
    )
  }
  
  // Magic Shield Effect
  if (spell === 'magic_shield') {
    return (
      <div className="fixed inset-0 pointer-events-none z-50">
        {/* Shield Bubble */}
        <div
          className="absolute"
          style={{
            left: `${target?.x || 50}%`,
            top: `${target?.y || 50}%`,
            width: '120px',
            height: '120px',
            transform: 'translate(-50%, -50%)',
            animation: effectPhase === 1 ? 'shield-form 0.5s ease-out' : 'shield-stable 3s ease-in-out infinite'
          }}
        >
          {/* Outer Shield */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'linear-gradient(135deg, rgba(255,0,255,0.3), rgba(138,43,226,0.3))',
              border: '3px solid',
              borderImage: 'linear-gradient(45deg, #FF00FF, #8A2BE2, #FF69B4) 1',
              filter: 'blur(1px)',
              animation: 'shield-rotate 4s linear infinite'
            }}
          />
          
          {/* Inner Shield Hexagon Pattern */}
          <svg className="absolute inset-0 w-full h-full">
            <defs>
              <pattern id="hexagon" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <polygon 
                  points="10,2 17,6 17,14 10,18 3,14 3,6" 
                  fill="none" 
                  stroke="rgba(255,0,255,0.5)" 
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>
            <circle cx="60" cy="60" r="55" fill="url(#hexagon)" opacity="0.5" />
          </svg>
          
          {/* Shield Sparkles */}
          {effectPhase >= 2 && [...Array(8)].map((_, i) => (
            <div
              key={`shield-sparkle-${i}`}
              className="absolute w-2 h-2 bg-purple-400 rounded-full"
              style={{
                left: '50%',
                top: '50%',
                transform: `rotate(${i * 45}deg) translateX(55px)`,
                boxShadow: '0 0 10px #FF00FF',
                animation: 'orbit-sparkle 2s linear infinite',
                animationDelay: `${i * 0.25}s`
              }}
            />
          ))}
        </div>
        
        <style jsx>{`
          @keyframes shield-form {
            0% {
              transform: translate(-50%, -50%) scale(0);
              opacity: 0;
            }
            100% {
              transform: translate(-50%, -50%) scale(1);
              opacity: 1;
            }
          }
          
          @keyframes shield-stable {
            0%, 100% {
              transform: translate(-50%, -50%) scale(1);
            }
            50% {
              transform: translate(-50%, -50%) scale(1.05);
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
          
          @keyframes orbit-sparkle {
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
      </div>
    )
  }
  
  // Prismatic Storm Ultimate Effect
  if (spell === 'prismatic_storm') {
    return (
      <div className="fixed inset-0 pointer-events-none z-50">
        {/* Screen Flash */}
        {effectPhase === 1 && (
          <div 
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(45deg, #FF00FF, #00FFFF, #FFFF00, #FF00FF)',
              animation: 'prismatic-flash 0.5s ease-out forwards'
            }}
          />
        )}
        
        {/* Prismatic Crystals Falling */}
        {effectPhase >= 2 && [...Array(50)].map((_, i) => (
          <div
            key={`crystal-${i}`}
            className="absolute"
            style={{
              left: `${Math.random() * 100}%`,
              top: '-50px',
              animation: `crystal-fall ${1 + Math.random()}s ease-in forwards`,
              animationDelay: `${Math.random() * 2}s`
            }}
          >
            <div
              className="w-0 h-0"
              style={{
                borderLeft: '10px solid transparent',
                borderRight: '10px solid transparent',
                borderTop: `20px solid ${['#FF00FF', '#00FFFF', '#FFFF00', '#FF69B4', '#8A2BE2'][i % 5]}`,
                filter: `drop-shadow(0 0 10px ${['#FF00FF', '#00FFFF', '#FFFF00', '#FF69B4', '#8A2BE2'][i % 5]})`,
                animation: 'crystal-spin 1s linear infinite'
              }}
            />
          </div>
        ))}
        
        {/* Rainbow Shockwaves */}
        {effectPhase >= 3 && [...Array(3)].map((_, i) => (
          <div
            key={`shockwave-${i}`}
            className="absolute left-1/2 top-1/2"
            style={{
              width: '100px',
              height: '100px',
              transform: 'translate(-50%, -50%)',
              border: '4px solid',
              borderImage: 'linear-gradient(45deg, #FF00FF, #00FFFF, #FFFF00) 1',
              borderRadius: '50%',
              animation: `shockwave-expand 2s ease-out forwards`,
              animationDelay: `${i * 0.3}s`
            }}
          />
        ))}
        
        {/* Unicorn Horn Lightning */}
        {effectPhase >= 4 && (
          <svg className="absolute inset-0 w-full h-full">
            {[...Array(5)].map((_, i) => (
              <path
                key={`lightning-${i}`}
                d={`M ${Math.random() * 800} 0 L ${Math.random() * 800} ${window.innerHeight}`}
                stroke={['#FF00FF', '#00FFFF', '#FFFF00'][i % 3]}
                strokeWidth="3"
                fill="none"
                opacity="0"
                style={{
                  filter: `blur(1px)`,
                  animation: `lightning-strike 0.3s ease-out forwards`,
                  animationDelay: `${i * 0.1}s`
                }}
              />
            ))}
          </svg>
        )}
        
        <style jsx>{`
          @keyframes prismatic-flash {
            0% {
              opacity: 0;
            }
            50% {
              opacity: 0.8;
            }
            100% {
              opacity: 0;
            }
          }
          
          @keyframes crystal-fall {
            0% {
              transform: translateY(0) rotate(0deg);
              opacity: 1;
            }
            100% {
              transform: translateY(${window.innerHeight + 100}px) rotate(720deg);
              opacity: 0;
            }
          }
          
          @keyframes crystal-spin {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }
          
          @keyframes shockwave-expand {
            0% {
              width: 100px;
              height: 100px;
              opacity: 1;
            }
            100% {
              width: ${window.innerWidth * 2}px;
              height: ${window.innerWidth * 2}px;
              opacity: 0;
            }
          }
          
          @keyframes lightning-strike {
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
      </div>
    )
  }
  
  return null
}

export default UnicornSpellEffects