import React, { useEffect, useState } from 'react'

const SpellNotification = ({ ability, caster, targets = [], onComplete }) => {
  const [casterImageError, setCasterImageError] = useState(false)
  const [targetImageErrors, setTargetImageErrors] = useState({})
  
  useEffect(() => {
    // Reset image errors when spell changes
    setCasterImageError(false)
    setTargetImageErrors({})
    console.log('🎭 SpellNotification received caster:', JSON.stringify(caster, null, 2))
    console.log('🎭 Caster has image?', !!caster?.image, 'Image path:', caster?.image)
    console.log('🎭 casterImageError state:', casterImageError)
  }, [caster, targets])
  
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete()
    }, 3000)
    return () => clearTimeout(timer)
  }, [onComplete])

  const getRarityGradient = (rarity) => {
    switch (rarity) {
      case 'mythic': return 'from-red-600 via-orange-500 to-yellow-500'
      case 'legendary': return 'from-yellow-400 via-amber-500 to-orange-600'
      case 'epic': return 'from-purple-500 via-pink-500 to-indigo-500'
      case 'rare': return 'from-blue-400 via-cyan-500 to-teal-500'
      default: return 'from-gray-400 via-gray-500 to-gray-600'
    }
  }

  const getAbilityTypeIcon = (effect) => {
    switch (effect) {
      case 'damage':
      case 'damage_all':
      case 'multi_damage': return '⚔️'
      case 'heal':
      case 'heal_all': return '💚'
      case 'both': return '⚡'
      case 'chaos':
      case 'supernova': return '💥'
      default: return '✨'
    }
  }

  return (
    <div className="fixed bottom-16 md:bottom-20 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
      <div className="animate-spell-appear scale-75 md:scale-100">
        {/* Main Card Container */}
        <div className={`
          relative bg-gradient-to-br ${getRarityGradient(caster.rarity)}
          p-1 rounded-2xl shadow-2xl
          transform animate-pulse shadow-2xl
        `}>
          <div className="bg-gray-900 rounded-lg md:rounded-xl p-3 md:p-6 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
            </div>
            
            {/* Content */}
            <div className="relative z-10">
              {/* Main Section - Spell Name and Targets */}
              <div className="flex items-center justify-center gap-3 md:gap-4 mb-3">
                {/* Spell Icon */}
                <span className="text-2xl md:text-4xl animate-bounce">
                  {getAbilityTypeIcon(ability.effect)}
                </span>
                
                {/* Spell Name */}
                <div className={`
                  text-2xl md:text-4xl font-black font-toy
                  bg-gradient-to-r ${getRarityGradient(caster.rarity)}
                  bg-clip-text text-transparent
                  animate-text-shimmer
                `}>
                  {ability.name}
                </div>
                
                {/* Arrow and Target Portraits */}
                {targets && targets.length > 0 && (
                  <>
                    <span className="text-white/70 text-xl md:text-2xl">→</span>
                    <div className="flex items-center gap-1">
                      {targets.slice(0, 4).map((target, idx) => (
                        <div key={idx} className="relative">
                          <div className={`
                            w-10 h-10 md:w-14 md:h-14 rounded-full 
                            bg-gradient-to-br ${target.team === 'player' ? 'from-blue-500 to-cyan-500' : 'from-red-500 to-orange-500'}
                            p-0.5 shadow-lg
                            ${ability.effect.includes('damage') ? 'animate-shake' : ability.effect.includes('heal') ? 'animate-pulse' : ''}
                          `}>
                            <div className="w-full h-full rounded-full bg-gray-800 overflow-hidden relative flex items-center justify-center">
                              {target.image ? (
                                <img 
                                  src={target.image} 
                                  alt={target.name}
                                  className="absolute inset-0 w-full h-full object-cover"
                                  onError={(e) => {
                                    console.error('❌ Target image failed to load:', target.image);
                                    e.target.style.display = 'none';
                                  }}
                                />
                              ) : (
                                <span className="text-base md:text-xl z-10">{target.emoji || '🎯'}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      {targets.length > 4 && (
                        <div className="text-sm text-white/60">
                          +{targets.length - 4}
                        </div>
                      )}
                    </div>
                  </>
                )}
                
                {/* Damage/Heal Amount */}
                {(ability.damage || ability.heal) && (
                  <div className={`
                    text-xl md:text-3xl font-bold
                    ${ability.damage ? 'text-red-400' : 'text-green-400'}
                  `}>
                    {ability.damage ? `-${ability.damage}` : `+${ability.heal}`}
                  </div>
                )}
              </div>
              
              {/* Description Section */}
              {ability.description && (
                <div className="text-center text-white/60 text-xs md:text-sm mb-2 italic">
                  "{ability.description}"
                </div>
              )}
              
              {/* Secondary Section - Caster Info (smaller, below) */}
              <div className="flex items-center justify-center gap-2 opacity-70">
                {/* Small Caster Portrait */}
                {caster && (
                  <div className={`
                    w-12 h-12 md:w-14 md:h-14 rounded-full
                    bg-gradient-to-br ${getRarityGradient(caster?.rarity || 'common')}
                    p-0.5
                  `}>
                    <div className="w-full h-full rounded-full bg-gray-800 overflow-hidden relative flex items-center justify-center">
                      {caster.image ? (
                        <img 
                          src={caster.image} 
                          alt={caster.name}
                          className="absolute inset-0 w-full h-full object-cover"
                          onLoad={(e) => {
                            console.log('✅ Image loaded:', caster.image, 'dimensions:', e.target.naturalWidth, 'x', e.target.naturalHeight);
                          }}
                          onError={(e) => {
                            console.error('❌ Image failed to load:', caster.image);
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <span className="text-lg md:text-xl z-10">{caster.emoji || '❄️'}</span>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Caster Name */}
                <div className="text-white/80 text-sm md:text-base font-toy">
                  {caster.name}
                </div>
                
                {/* Rarity Badge */}
                <div className={`
                  px-2 py-0.5 rounded-full text-xs font-bold uppercase
                  bg-gradient-to-r ${getRarityGradient(caster.rarity)}
                  text-white/90
                `}>
                  {caster.rarity}
                </div>
                
                {/* Chance Percentage */}
                {ability.chance && (
                  <div className="text-cyan-400/70 text-xs font-bold">
                    {(ability.chance * 100).toFixed(0)}% chance
                  </div>
                )}
                
                {/* Extra Stats */}
                {ability.hits && ability.hits > 1 && (
                  <div className="text-yellow-400/70 text-xs">
                    ×{ability.hits} hits
                  </div>
                )}
              </div>
            </div>
            
            {/* Ultimate Badge */}
            {ability.isUltimate && (
              <div className="absolute top-2 right-2">
                <div className="bg-gradient-to-r from-yellow-400 to-red-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">
                  ULTIMATE
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes spell-appear {
          0% {
            opacity: 0;
            transform: scale(0.5) rotate(-10deg);
          }
          50% {
            opacity: 1;
            transform: scale(1.1) rotate(5deg);
          }
          100% {
            opacity: 1;
            transform: scale(1) rotate(0deg);
          }
        }
        
        @keyframes text-glow {
          0%, 100% {
            text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
          }
          50% {
            text-shadow: 0 0 20px rgba(255, 255, 255, 0.8);
          }
        }
        
        @keyframes text-shimmer {
          0% {
            background-position: 0% 50%;
          }
          100% {
            background-position: 100% 50%;
          }
        }
        
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        .animate-spell-appear {
          animation: spell-appear 0.5s ease-out forwards;
        }
        
        .animate-text-glow {
          animation: text-glow 2s ease-in-out infinite;
        }
        
        .animate-text-shimmer {
          background-size: 200% 100%;
          animation: text-shimmer 3s linear infinite;
        }
        
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
        
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
        
        @keyframes shake {
          0%, 100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-2px);
          }
          75% {
            transform: translateX(2px);
          }
        }
        
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  )
}

export default SpellNotification