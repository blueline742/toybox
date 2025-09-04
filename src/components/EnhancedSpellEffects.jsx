import React, { useEffect, useState } from 'react'

const EnhancedSpellEffects = ({ 
  activeSpell, 
  casterPosition, 
  targetPositions, 
  onComplete 
}) => {
  const [particles, setParticles] = useState([])
  const [beamProgress, setBeamProgress] = useState(0)
  const [impactEffects, setImpactEffects] = useState([])
  const [healingAuras, setHealingAuras] = useState([])
  
  useEffect(() => {
    if (!activeSpell || !targetPositions || targetPositions.length === 0) return
    
    // Initialize spell effect based on type
    const spellType = activeSpell.ability.effect
    const isHealing = spellType === 'heal' || spellType === 'heal_all' || spellType === 'shield'
    const isDamage = spellType === 'damage' || spellType === 'damage_all' || spellType === 'multi_damage'
    
    // Create particle trail - only for damage spells
    let particleId = 0
    const particleInterval = setInterval(() => {
      if (beamProgress >= 100) {
        clearInterval(particleInterval)
        return
      }
      
      // Only create particles for damage spells, healing has its own effect
      if (!isHealing) {
        const newParticles = targetPositions.map((targetPos, idx) => ({
          id: `particle-${particleId++}-${idx}`,
          startX: casterPosition.x,
          startY: casterPosition.y,
          endX: targetPos.x,
          endY: targetPos.y,
          progress: 0,
          type: 'damage',
          size: Math.random() * 15 + 10,
          delay: idx * 100
        }))
        
        setParticles(prev => [...prev, ...newParticles])
      }
    }, 50)
    
    // For healing spells, show auras immediately
    if (isHealing) {
      createHealingAuras()
      // Complete after healing animation
      setTimeout(() => {
        onComplete()
      }, 2000)
    } else {
      // Animate beam progress for damage spells
      const beamAnimation = setInterval(() => {
        setBeamProgress(prev => {
          if (prev >= 100) {
            clearInterval(beamAnimation)
            
            // Trigger impact effects for damage
            if (isDamage) {
              createImpactEffects()
            }
            
            // Complete after effects
            setTimeout(() => {
              onComplete()
            }, 1000)
            
            return 100
          }
          return prev + 5
        })
      }, 20)
    }
    
    return () => {
      clearInterval(particleInterval)
    }
  }, [activeSpell])
  
  // Animate particles
  useEffect(() => {
    const interval = setInterval(() => {
      setParticles(prev => 
        prev
          .map(p => ({ ...p, progress: p.progress + 3 }))
          .filter(p => p.progress < 100)
      )
    }, 16)
    
    return () => clearInterval(interval)
  }, [])
  
  const createImpactEffects = () => {
    if (!targetPositions || targetPositions.length === 0) return
    
    const effects = targetPositions.map((pos, idx) => ({
      id: `impact-${Date.now()}-${idx}`,
      x: pos.x,
      y: pos.y,
      type: activeSpell.ability.isUltimate ? 'ultimate' : 'normal'
    }))
    
    setImpactEffects(effects)
    
    // Clear impact effects after animation
    setTimeout(() => {
      setImpactEffects([])
    }, 1500)
  }
  
  const createHealingAuras = () => {
    if (!targetPositions || targetPositions.length === 0) return
    
    const auras = targetPositions.map((pos, idx) => ({
      id: `heal-${Date.now()}-${idx}`,
      x: pos.x,
      y: pos.y
    }))
    
    setHealingAuras(auras)
    
    // Clear healing auras after animation
    setTimeout(() => {
      setHealingAuras([])
    }, 2000)
  }
  
  const getSpellColor = () => {
    const effect = activeSpell?.ability?.effect
    switch (effect) {
      case 'damage':
      case 'damage_all':
        return activeSpell.ability.isUltimate ? '#FFD700' : '#FF4444'
      case 'multi_damage':
        return '#FF00FF'
      case 'heal':
      case 'heal_all':
      case 'shield':
        return '#00FF88'
      case 'chaos':
        return '#FF00FF'
      case 'supernova':
        return '#FFD700'
      default:
        return '#00DDFF'
    }
  }
  
  const isHealing = activeSpell?.ability?.effect === 'heal' || 
                    activeSpell?.ability?.effect === 'heal_all' || 
                    activeSpell?.ability?.effect === 'shield'
  
  if (!activeSpell) return null
  
  const spellColor = getSpellColor()
  
  return (
    <div className="fixed inset-0 pointer-events-none z-40">
      {/* Targeting Beams - Only for damage spells */}
      {!isHealing && targetPositions.map((targetPos, idx) => {
        const dx = targetPos.x - casterPosition.x
        const dy = targetPos.y - casterPosition.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        const angle = Math.atan2(dy, dx) * (180 / Math.PI)
        
        return (
          <div key={`beam-${idx}`}>
            {/* Beam effects DISABLED - no more lines
            <div
              className="absolute origin-left"
              style={{
                left: `${casterPosition.x}px`,
                top: `${casterPosition.y}px`,
                width: `${(distance * beamProgress) / 100}px`,
                height: '4px',
                background: `linear-gradient(90deg, ${spellColor}88 0%, ${spellColor} 50%, ${spellColor}88 100%)`,
                transform: `rotate(${angle}deg) translateY(-2px)`,
                boxShadow: `0 0 20px ${spellColor}, 0 0 40px ${spellColor}`,
                filter: 'blur(1px)',
                animation: 'pulse 0.5s ease-in-out infinite'
              }}
            />
            
            <div
              className="absolute origin-left"
              style={{
                left: `${casterPosition.x}px`,
                top: `${casterPosition.y}px`,
                width: `${(distance * beamProgress) / 100}px`,
                height: '2px',
                background: 'white',
                transform: `rotate(${angle}deg) translateY(-1px)`,
                opacity: 0.9
              }}
            />
            */}
            
            {/* Targeting Circle at End - keep this for visual feedback */}
            {beamProgress > 50 && (
              <div
                className="absolute animate-ping"
                style={{
                  left: `${targetPos.x - 30}px`,
                  top: `${targetPos.y - 30}px`,
                  width: '60px',
                  height: '60px',
                  border: `3px solid ${spellColor}`,
                  borderRadius: '50%',
                  boxShadow: `0 0 30px ${spellColor}`,
                  opacity: (100 - beamProgress) / 50
                }}
              />
            )}
          </div>
        )
      })}
      
      {/* Particle Effects - Only for damage spells */}
      {!isHealing && particles.map(particle => {
        const dx = particle.endX - particle.startX
        const dy = particle.endY - particle.startY
        const currentX = particle.startX + (dx * particle.progress) / 100
        const currentY = particle.startY + (dy * particle.progress) / 100
        
        return (
          <div
            key={particle.id}
            className="absolute animate-pulse"
            style={{
              left: `${currentX}px`,
              top: `${currentY}px`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              transform: 'translate(-50%, -50%)',
              opacity: 1 - particle.progress / 100
            }}
          >
            <div
              className="w-full h-full rounded-full"
              style={{
                background: `radial-gradient(circle, ${spellColor} 0%, transparent 70%)`,
                boxShadow: `0 0 ${particle.size}px ${spellColor}`,
                animation: 'sparkle 0.5s ease-in-out infinite'
              }}
            />
          </div>
        )
      })}
      
      {/* Impact Effects */}
      {impactEffects.map(impact => (
        <div
          key={impact.id}
          className="absolute"
          style={{
            left: `${impact.x}px`,
            top: `${impact.y}px`,
            transform: 'translate(-50%, -50%)'
          }}
        >
          {/* Explosion Ring */}
          <div
            className="absolute"
            style={{
              width: '100px',
              height: '100px',
              left: '-50px',
              top: '-50px',
              border: `4px solid ${spellColor}`,
              borderRadius: '50%',
              animation: 'explode 0.8s ease-out forwards'
            }}
          />
          
          {/* Impact Shockwave */}
          <div
            className="absolute"
            style={{
              width: '150px',
              height: '150px',
              left: '-75px',
              top: '-75px',
              background: `radial-gradient(circle, ${spellColor}44 0%, transparent 60%)`,
              borderRadius: '50%',
              animation: 'shockwave 1s ease-out forwards'
            }}
          />
          
          {/* Damage Sparks */}
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute"
              style={{
                width: '4px',
                height: '20px',
                background: spellColor,
                left: '0',
                top: '0',
                transformOrigin: 'center',
                transform: `rotate(${i * 45}deg) translateY(-30px)`,
                animation: 'spark-fly 0.6s ease-out forwards',
                animationDelay: `${i * 0.05}s`
              }}
            />
          ))}
        </div>
      ))}
      
      {/* Healing Auras */}
      {healingAuras.map(aura => (
        <div
          key={aura.id}
          className="absolute"
          style={{
            left: `${aura.x}px`,
            top: `${aura.y}px`,
            transform: 'translate(-50%, -50%)'
          }}
        >
          {/* Healing Circle */}
          <div
            className="absolute"
            style={{
              width: '120px',
              height: '120px',
              left: '-60px',
              top: '-60px',
              border: '3px solid #00FF88',
              borderRadius: '50%',
              animation: 'heal-pulse 2s ease-in-out infinite'
            }}
          />
          
          {/* Healing Particles */}
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute"
              style={{
                width: '8px',
                height: '8px',
                background: '#00FF88',
                borderRadius: '50%',
                left: '0',
                top: '0',
                transform: `rotate(${i * 30}deg) translateY(-40px)`,
                animation: 'heal-float 2s ease-in-out infinite',
                animationDelay: `${i * 0.1}s`,
                boxShadow: '0 0 10px #00FF88'
              }}
            />
          ))}
          
          {/* Plus Signs */}
          <div
            className="absolute text-4xl font-bold"
            style={{
              color: '#00FF88',
              left: '-20px',
              top: '-60px',
              textShadow: '0 0 20px #00FF88',
              animation: 'float-up 1.5s ease-out forwards'
            }}
          >
            +
          </div>
        </div>
      ))}
      
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 0.8;
          }
          50% {
            opacity: 1;
          }
        }
        
        @keyframes sparkle {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.8;
          }
        }
        
        @keyframes explode {
          0% {
            width: 0;
            height: 0;
            left: 0;
            top: 0;
            opacity: 1;
          }
          100% {
            width: 200px;
            height: 200px;
            left: -100px;
            top: -100px;
            opacity: 0;
          }
        }
        
        @keyframes shockwave {
          0% {
            transform: scale(0);
            opacity: 1;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        
        @keyframes spark-fly {
          0% {
            transform: rotate(var(--rotation)) translateY(-30px);
            opacity: 1;
          }
          100% {
            transform: rotate(var(--rotation)) translateY(-80px);
            opacity: 0;
          }
        }
        
        @keyframes heal-pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.6;
          }
          50% {
            transform: scale(1.2);
            opacity: 1;
          }
        }
        
        @keyframes heal-float {
          0%, 100% {
            transform: rotate(var(--rotation)) translateY(-40px);
            opacity: 0.4;
          }
          50% {
            transform: rotate(var(--rotation)) translateY(-50px);
            opacity: 1;
          }
        }
        
        @keyframes float-up {
          0% {
            transform: translateY(0);
            opacity: 1;
          }
          100% {
            transform: translateY(-40px);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}

export default EnhancedSpellEffects