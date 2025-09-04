import React, { useEffect, useState } from 'react'

const PhoenixDragonEffects = ({ 
  activeSpell, 
  casterPosition, 
  targetPositions, 
  onComplete 
}) => {
  const [clawSlashes, setClawSlashes] = useState([])
  const [wingEffects, setWingEffects] = useState([])
  const [apocalypseActive, setApocalypseActive] = useState(false)
  const [dragonForm, setDragonForm] = useState(false)
  const [fireBreaths, setFireBreaths] = useState([])
  const [burnMarks, setBurnMarks] = useState([])
  
  useEffect(() => {
    if (!activeSpell) return
    
    // Check if we have valid target positions
    if (!targetPositions || targetPositions.length === 0) {
      // Still call onComplete to continue battle
      setTimeout(() => onComplete(), 1000)
      return
    }
    
    const abilityId = activeSpell.ability.id
    
    // Handle different Phoenix Dragon abilities
    switch (abilityId) {
      case 'dragon_claw_strike':
        executeClawStrike()
        break
      case 'inferno_wing_sweep':
        executeWingSweep()
        break
      case 'dragon_rebirth_apocalypse':
        executeApocalypse()
        break
      default:
        // Fallback to standard effects
        onComplete()
    }
  }, [activeSpell])
  
  const executeClawStrike = () => {
    // Create claw slash effects for each target
    const slashes = targetPositions.map((pos, idx) => ({
      id: `claw-${Date.now()}-${idx}`,
      x: pos.x,
      y: pos.y,
      delay: idx * 100
    }))
    
    setClawSlashes(slashes)
    
    // Clear after animation
    setTimeout(() => {
      setClawSlashes([])
      onComplete()
    }, 1500)
  }
  
  
  const executeWingSweep = () => {
    // Create wing sweep effect
    const wings = targetPositions.map((pos, idx) => ({
      id: `wing-${Date.now()}-${idx}`,
      x: pos.x,
      y: pos.y,
      side: idx % 2 === 0 ? 'left' : 'right'
    }))
    
    setWingEffects(wings)
    
    // Add burn marks for damage over time visual
    const burns = targetPositions.map((pos, idx) => ({
      id: `burn-${Date.now()}-${idx}`,
      x: pos.x,
      y: pos.y
    }))
    setBurnMarks(burns)
    
    setTimeout(() => {
      setWingEffects([])
      // Keep burn marks longer for DoT effect
      setTimeout(() => setBurnMarks([]), 3000)
      onComplete()
    }, 2000)
  }
  
  const executeApocalypse = () => {
    setApocalypseActive(true)
    setDragonForm(true)
    
    // Create massive fire effect
    const fireBlasts = []
    for (let i = 0; i < 30; i++) {
      targetPositions.forEach((pos, idx) => {
        fireBlasts.push({
          id: `apocalypse-${i}-${idx}`,
          x: pos.x + (Math.random() - 0.5) * 200,
          y: pos.y + (Math.random() - 0.5) * 200,
          size: Math.random() * 60 + 40,
          delay: Math.random() * 1500
        })
      })
    }
    setFireBreaths(fireBlasts)
    
    // Screen shake effect DISABLED
    // document.body.classList.add('apocalypse-shake')
    
    setTimeout(() => {
      setApocalypseActive(false)
      setDragonForm(false)
      setFireBreaths([])
      // document.body.classList.remove('apocalypse-shake')
      onComplete()
    }, 4000)
  }
  
  if (!activeSpell) return null
  
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {/* Dragon Transformation for Ultimate */}
      {dragonForm && (
        <div className="fixed inset-0 z-40">
          <div 
            className="absolute inset-0 bg-gradient-to-b from-red-900/50 via-orange-800/40 to-yellow-700/30"
            style={{
              animation: 'dragonPulse 0.5s ease-in-out infinite'
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-9xl animate-bounce" style={{ fontSize: '200px' }}>
              🐲
            </div>
          </div>
        </div>
      )}
      
      {/* Claw Slash Effects */}
      {clawSlashes.map(slash => (
        <div
          key={slash.id}
          className="absolute"
          style={{
            left: `${slash.x}px`,
            top: `${slash.y}px`,
            transform: 'translate(-50%, -50%)',
            animationDelay: `${slash.delay}ms`
          }}
        >
          {/* Three claw marks */}
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="absolute"
              style={{
                width: '80px',
                height: '4px',
                background: 'linear-gradient(90deg, transparent, #FF6B6B, #FFD700, transparent)',
                transform: `rotate(${-30 + i * 30}deg) translateX(-40px)`,
                animation: 'clawSlash 0.5s ease-out forwards',
                animationDelay: `${i * 50}ms`,
                boxShadow: '0 0 20px #FF6B6B'
              }}
            />
          ))}
          
          {/* Blood/Fire splatter */}
          <div
            className="absolute"
            style={{
              width: '100px',
              height: '100px',
              left: '-50px',
              top: '-50px',
              background: 'radial-gradient(circle, #FF4444 0%, transparent 70%)',
              animation: 'splatter 0.6s ease-out forwards',
              opacity: 0.8
            }}
          />
        </div>
      ))}
      
      {/* Wing Sweep Effects */}
      {wingEffects.map(wing => (
        <div
          key={wing.id}
          className="absolute"
          style={{
            left: `${wing.x}px`,
            top: `${wing.y}px`,
            transform: 'translate(-50%, -50%)'
          }}
        >
          {/* Wing sweep arc */}
          <div
            className="absolute"
            style={{
              width: '300px',
              height: '150px',
              left: '-150px',
              top: '-75px',
              background: `linear-gradient(${wing.side === 'left' ? '90deg' : '-90deg'}, transparent, #FF6B6B, #FFD700, transparent)`,
              clipPath: 'ellipse(150px 75px at center)',
              animation: `wingSweep${wing.side === 'left' ? 'Left' : 'Right'} 1s ease-out forwards`,
              opacity: 0.7
            }}
          />
          
          {/* Fire trail */}
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="absolute"
              style={{
                width: '30px',
                height: '30px',
                background: 'radial-gradient(circle, #FFD700 0%, #FF6B6B 50%, transparent 100%)',
                borderRadius: '50%',
                left: `${wing.side === 'left' ? -100 - i * 20 : 100 + i * 20}px`,
                top: '0',
                animation: 'fireTrail 0.8s ease-out forwards',
                animationDelay: `${i * 100}ms`
              }}
            />
          ))}
        </div>
      ))}
      
      {/* Burn Marks (DoT indicator) */}
      {burnMarks.map(burn => (
        <div
          key={burn.id}
          className="absolute"
          style={{
            left: `${burn.x}px`,
            top: `${burn.y}px`,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div
            className="absolute"
            style={{
              width: '60px',
              height: '60px',
              left: '-30px',
              top: '-30px',
              background: 'radial-gradient(circle, #FF4444 0%, #FF6B6B 40%, transparent 70%)',
              animation: 'burnPulse 0.5s ease-in-out infinite',
              borderRadius: '50%'
            }}
          />
          {/* Smoke effect */}
          <div
            className="absolute"
            style={{
              width: '40px',
              height: '80px',
              left: '-20px',
              top: '-40px',
              background: 'linear-gradient(180deg, transparent, #666666)',
              opacity: 0.3,
              animation: 'smokeRise 2s ease-out infinite',
              filter: 'blur(10px)'
            }}
          />
        </div>
      ))}
      
      {/* Apocalypse Fire Blasts */}
      {apocalypseActive && fireBreaths.map(fire => (
        <div
          key={fire.id}
          className="absolute"
          style={{
            left: `${fire.x}px`,
            top: `${fire.y}px`,
            width: `${fire.size}px`,
            height: `${fire.size}px`,
            transform: 'translate(-50%, -50%)',
            animationDelay: `${fire.delay}ms`
          }}
        >
          <div
            className="w-full h-full"
            style={{
              background: 'radial-gradient(circle, #FFFFFF 0%, #FFD700 20%, #FF6B6B 50%, #FF0000 80%, transparent 100%)',
              borderRadius: '50%',
              animation: 'apocalypseBlast 1.5s ease-out forwards',
              boxShadow: '0 0 60px #FFD700, 0 0 120px #FF6B6B'
            }}
          />
        </div>
      ))}
      
      {/* Fire Breath Particles */}
      {fireBreaths.map(particle => (
        <div
          key={particle.id}
          className="absolute"
          style={{
            left: `${particle.x}px`,
            top: `${particle.y}px`,
            transform: 'translate(-50%, -50%)',
            animationDelay: `${particle.delay}ms`
          }}
        >
          <div
            style={{
              width: '15px',
              height: '15px',
              background: 'radial-gradient(circle, #FFD700 0%, #FF6B6B 50%, transparent 100%)',
              borderRadius: '50%',
              animation: 'fireParticle 1s ease-out forwards',
              boxShadow: '0 0 20px #FFD700'
            }}
          />
        </div>
      ))}
      
      <style jsx>{`
        @keyframes dragonPulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
        
        @keyframes clawSlash {
          0% {
            width: 0;
            opacity: 0;
          }
          50% {
            width: 80px;
            opacity: 1;
          }
          100% {
            width: 100px;
            opacity: 0;
          }
        }
        
        @keyframes splatter {
          0% {
            transform: scale(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: scale(2) rotate(180deg);
            opacity: 0;
          }
        }
        
        
        @keyframes wingSweepLeft {
          0% {
            transform: translateX(100px) scaleX(0);
            opacity: 0;
          }
          50% {
            transform: translateX(0) scaleX(1);
            opacity: 1;
          }
          100% {
            transform: translateX(-100px) scaleX(0.5);
            opacity: 0;
          }
        }
        
        @keyframes wingSweepRight {
          0% {
            transform: translateX(-100px) scaleX(0);
            opacity: 0;
          }
          50% {
            transform: translateX(0) scaleX(1);
            opacity: 1;
          }
          100% {
            transform: translateX(100px) scaleX(0.5);
            opacity: 0;
          }
        }
        
        @keyframes fireTrail {
          0% {
            transform: scale(0);
            opacity: 1;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        
        @keyframes burnPulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.6;
          }
          50% {
            transform: scale(1.2);
            opacity: 1;
          }
        }
        
        @keyframes smokeRise {
          0% {
            transform: translateY(0) scale(1);
            opacity: 0.3;
          }
          100% {
            transform: translateY(-40px) scale(1.5);
            opacity: 0;
          }
        }
        
        @keyframes apocalypseBlast {
          0% {
            transform: scale(0) rotate(0deg);
            opacity: 0;
          }
          20% {
            transform: scale(1.5) rotate(180deg);
            opacity: 1;
          }
          100% {
            transform: scale(3) rotate(360deg);
            opacity: 0;
          }
        }
        
        @keyframes fireParticle {
          0% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(-50px) scale(0);
            opacity: 0;
          }
        }
        
        .apocalypse-shake {
          animation: screenShake 0.2s ease-in-out infinite;
        }
        
        @keyframes screenShake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px) rotate(-0.5deg); }
          75% { transform: translateX(5px) rotate(0.5deg); }
        }
      `}</style>
    </div>
  )
}

export default PhoenixDragonEffects