import React from 'react'

const CardPreview = ({ character, isVisible, position, onClose }) => {
  if (!character || !isVisible) return null

  // Use the character's actual rarity
  const rarity = character.rarity || 'common'

  // Always center the preview
  const style = {
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%) scale(0)',
    animation: isVisible ? 'card-preview-pop 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards' : ''
  }

  const rarityColors = {
    mythic: {
      border: 'linear-gradient(135deg, #FF006E, #8338EC, #3A86FF, #06FFB4, #FFBE0B)',
      glow: 'rgba(131, 56, 236, 0.8)',
      badge: 'bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500',
      text: '#FF006E'
    },
    legendary: {
      border: 'linear-gradient(135deg, #FFD700, #FFA500, #FFD700)',
      glow: 'rgba(255, 215, 0, 0.6)',
      badge: 'bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-400',
      text: '#FFD700'
    },
    epic: {
      border: 'linear-gradient(135deg, #B794F4, #9F7AEA, #B794F4)',
      glow: 'rgba(159, 122, 234, 0.6)',
      badge: 'bg-gradient-to-r from-purple-400 to-purple-600',
      text: '#B794F4'
    },
    rare: {
      border: 'linear-gradient(135deg, #63B3ED, #4299E1, #63B3ED)',
      glow: 'rgba(66, 153, 225, 0.6)',
      badge: 'bg-gradient-to-r from-blue-400 to-blue-600',
      text: '#63B3ED'
    },
    common: {
      border: 'linear-gradient(135deg, #CBD5E0, #A0AEC0, #CBD5E0)',
      glow: 'rgba(160, 174, 192, 0.6)',
      badge: 'bg-gradient-to-r from-gray-400 to-gray-600',
      text: '#CBD5E0'
    }
  }

  const currentRarity = rarityColors[rarity]

  return (
    <>
      {/* No backdrop for hover */}
      
      {/* Preview Card */}
      <div 
        className="fixed z-50 pointer-events-none"
        style={style}
      >
        <div className="relative w-[320px] md:w-[360px]"
             style={{
               filter: `drop-shadow(0 0 30px ${currentRarity.glow})`,
             }}>
          
          {/* Outer Glow Animation */}
          <div className="absolute -inset-4 rounded-3xl opacity-60 animate-pulse"
               style={{
                 background: currentRarity.border,
                 filter: 'blur(20px)'
               }} />
          
          {/* Main Card Container */}
          <div className="relative rounded-3xl overflow-hidden"
               style={{
                 background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
                 border: '3px solid transparent',
                 backgroundClip: 'padding-box',
                 borderImage: currentRarity.border,
                 borderImageSlice: 1,
               }}>
            
            {/* Top Section - Character Display */}
            <div className="relative">
              {/* Rarity Banner */}
              <div className={`absolute top-0 left-0 right-0 h-8 ${currentRarity.badge} opacity-90`}>
                <div className="flex items-center justify-center h-full">
                  <span className="text-white font-bold text-xs tracking-widest uppercase">
                    {rarity} • {character.type || 'TOY FIGHTER'}
                  </span>
                </div>
              </div>
              
              {/* Character Name */}
              <div className="pt-10 pb-2 px-4 text-center">
                <h2 className="text-2xl md:text-3xl font-bold font-toy tracking-wider"
                    style={{
                      color: currentRarity.text,
                      textShadow: `0 0 20px ${currentRarity.glow}, 2px 2px 4px rgba(0,0,0,0.8)`,
                      animation: 'glow-pulse 2s ease-in-out infinite'
                    }}>
                  {character.name}
                </h2>
              </div>
              
              {/* Character Model */}
              <div className="relative mx-auto w-32 h-32 md:w-40 md:h-40 mb-4">
                <div className="absolute inset-0 rounded-full"
                     style={{
                       background: `radial-gradient(circle, ${currentRarity.glow} 0%, transparent 70%)`,
                       animation: 'rotate-slow 10s linear infinite'
                     }} />
                <div className="relative flex items-center justify-center h-full">
                  {character.image ? (
                    <img
                      src={character.image}
                      alt={character.name}
                      className="w-28 h-28 md:w-36 md:h-36 object-cover rounded-2xl"
                      style={{
                        filter: `drop-shadow(0 10px 25px ${currentRarity.glow})`,
                        animation: 'float 3s ease-in-out infinite'
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        const emojiDiv = e.target.nextSibling;
                        if (emojiDiv) emojiDiv.style.display = 'block';
                      }}
                    />
                  ) : null}
                  <div className="text-5xl md:text-6xl"
                       style={{
                         filter: `drop-shadow(0 10px 25px ${currentRarity.glow})`,
                         animation: 'float 3s ease-in-out infinite',
                         display: character.image ? 'none' : 'block'
                       }}>
                    {character.emoji}
                  </div>
                </div>
                
              </div>
            </div>
            
            {/* Stats Section - Hidden for Legendary/Mythic */}
            {rarity !== 'legendary' && rarity !== 'mythic' && (
            <div className="px-4 pb-3">
              <div className="space-y-2">
                {/* HP Bar */}
                <div className="flex items-center gap-3">
                  <div className="text-2xl">❤️</div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-400 uppercase">HP</span>
                      <span className="text-white font-bold">{character.maxHealth || 100}</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-500"
                        style={{ 
                          width: `${Math.min((character.maxHealth || 100) / 200 * 100, 100)}%`,
                          boxShadow: '0 0 10px rgba(16, 185, 129, 0.5)'
                        }}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Attack Bar */}
                <div className="flex items-center gap-3">
                  <div className="text-2xl">⚔️</div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-400 uppercase">ATK</span>
                      <span className="text-white font-bold">{character.stats?.attack || 5}</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-red-500 to-orange-400 rounded-full transition-all duration-500"
                        style={{ 
                          width: `${(character.stats?.attack || 5) * 10}%`,
                          boxShadow: '0 0 10px rgba(239, 68, 68, 0.5)'
                        }}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Defense Bar */}
                <div className="flex items-center gap-3">
                  <div className="text-2xl">🛡️</div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-400 uppercase">DEF</span>
                      <span className="text-white font-bold">{character.stats?.defense || 5}</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500"
                        style={{ 
                          width: `${(character.stats?.defense || 5) * 10}%`,
                          boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)'
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            )}
            
            {/* Abilities Section - Compact & Cool */}
            <div className="px-4 pb-3">
              <div className="space-y-2">
                {character.abilities && character.abilities.slice(0, 3).map((ability, idx) => {
                  const isUltimate = ability.isUltimate || idx === 2
                  const bgColor = isUltimate 
                    ? 'bg-gradient-to-r from-purple-900/60 via-pink-900/60 to-red-900/60' 
                    : idx === 0 
                    ? 'bg-gradient-to-r from-blue-900/40 to-cyan-900/40'
                    : 'bg-gradient-to-r from-green-900/40 to-emerald-900/40'
                  
                  const borderColor = isUltimate 
                    ? 'border-purple-500/50' 
                    : idx === 0 
                    ? 'border-blue-500/30'
                    : 'border-green-500/30'
                    
                  const glowColor = isUltimate 
                    ? 'rgba(168, 85, 247, 0.4)' 
                    : idx === 0
                    ? 'rgba(59, 130, 246, 0.3)'
                    : 'rgba(34, 197, 94, 0.3)'
                  
                  return (
                    <div key={idx} 
                         className={`relative ${bgColor} backdrop-blur rounded-lg p-2 border ${borderColor} overflow-hidden transition-all hover:scale-[1.02]`}
                         style={{
                           boxShadow: `0 4px 20px ${glowColor}`
                         }}>
                      
                      {/* Background pattern for ultimate */}
                      {isUltimate && (
                        <div className="absolute inset-0 opacity-20">
                          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 animate-gradient-shift" />
                        </div>
                      )}
                      
                      <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {/* Icon */}
                          <div className={`text-2xl ${isUltimate ? 'animate-pulse' : ''}`}>
                            {ability.effect === 'heal' || ability.effect === 'heal_all' ? '💚' : 
                             ability.effect === 'shield' || ability.effect === 'shield_all' ? '🛡️' :
                             isUltimate ? '💥' : 
                             idx === 0 ? '⚔️' : '🎯'}
                          </div>
                          
                          {/* Name and Stats */}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className={`font-bold text-sm ${isUltimate ? 'text-yellow-400' : 'text-white'}`}>
                                {ability.name}
                              </span>
                              {isUltimate && (
                                <span className="text-xs px-2 py-0.5 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full text-white font-bold animate-pulse">
                                  ULTIMATE
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs">
                              <span className={`${isUltimate ? 'text-pink-300' : 'text-gray-300'}`}>
                                {Math.round((ability.chance || 0) * 100)}% chance
                              </span>
                              {ability.damage && (
                                <span className="text-orange-400">
                                  {ability.damage} DMG
                                </span>
                              )}
                              {ability.heal && (
                                <span className="text-green-400">
                                  {ability.heal} HEAL
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Chance Display */}
                        <div className={`text-right ${isUltimate ? 'animate-pulse' : ''}`}>
                          <div className={`text-2xl font-black ${
                            isUltimate ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-500' : 
                            'text-white/80'
                          }`}>
                            {Math.round((ability.chance || 0) * 100)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            
            {/* Description / Flavor Text */}
            {character.description && (
              <div className="px-6 pb-4">
                <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 rounded-lg p-3 border border-gray-700/30">
                  <p className="text-gray-300 text-xs italic text-center">
                    "{character.description}"
                  </p>
                </div>
              </div>
            )}
            
            {/* Bottom Actions */}
            <div className="px-6 pb-4">
              <p className="text-center text-gray-400 text-xs">
                Move away to close • Click to select
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes card-preview-pop {
          0% {
            transform: translate(-50%, -50%) scale(0) rotateY(90deg);
            opacity: 0;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.05) rotateY(0deg);
          }
          100% {
            transform: translate(-50%, -50%) scale(1) rotateY(0deg);
            opacity: 1;
          }
        }
        
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(5deg); }
        }
        
        @keyframes rotate-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes glow-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        .animate-gradient-shift {
          background-size: 200% 200%;
          animation: gradient-shift 3s ease infinite;
        }
      `}</style>
    </>
  )
}

export default CardPreview