import React from 'react'

const CardPreview = ({ character, isVisible, position, onClose }) => {
  if (!character || !isVisible) return null

  // Determine rarity based on stats or default
  const getRarity = (char) => {
    const totalStats = (char.stats?.attack || 0) + (char.stats?.defense || 0) + (char.stats?.speed || 0)
    if (totalStats >= 24) return 'legendary'
    if (totalStats >= 20) return 'epic'
    if (totalStats >= 16) return 'rare'
    return 'common'
  }

  const rarity = getRarity(character)

  // Always center the preview
  const style = {
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%) scale(0)',
    animation: isVisible ? 'card-preview-pop 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards' : ''
  }

  const rarityColors = {
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
                
                {/* Level Badge */}
                <div className="absolute -top-2 -right-2 w-14 h-14 rounded-full flex items-center justify-center"
                     style={{
                       background: 'linear-gradient(135deg, #f59e0b, #dc2626)',
                       boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
                     }}>
                  <div className="text-white font-bold text-lg">
                    {character.level || 1}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Stats Bar */}
            <div className="px-4 pb-3">
              <div className="grid grid-cols-4 gap-2">
                <div className="text-center bg-red-900/40 backdrop-blur rounded-lg py-2 border border-red-500/30">
                  <div className="text-red-400 text-xs mb-1">HEALTH</div>
                  <div className="text-white font-bold text-lg">{character.maxHealth || 100}</div>
                </div>
                <div className="text-center bg-orange-900/40 backdrop-blur rounded-lg py-2 border border-orange-500/30">
                  <div className="text-orange-400 text-xs mb-1">ATTACK</div>
                  <div className="text-white font-bold text-lg">{character.stats?.attack || 5}</div>
                </div>
                <div className="text-center bg-blue-900/40 backdrop-blur rounded-lg py-2 border border-blue-500/30">
                  <div className="text-blue-400 text-xs mb-1">DEFENSE</div>
                  <div className="text-white font-bold text-lg">{character.stats?.defense || 5}</div>
                </div>
                <div className="text-center bg-green-900/40 backdrop-blur rounded-lg py-2 border border-green-500/30">
                  <div className="text-green-400 text-xs mb-1">SPEED</div>
                  <div className="text-white font-bold text-lg">{character.stats?.speed || 5}</div>
                </div>
              </div>
            </div>
            
            {/* Abilities Section - Enhanced */}
            <div className="px-4 pb-3">
              <div className="bg-gradient-to-b from-purple-900/30 to-blue-900/30 backdrop-blur rounded-xl p-4 border border-purple-500/30">
                <h3 className="text-purple-300 font-bold text-sm mb-3 flex items-center gap-2">
                  <span className="text-xl">⚔️</span>
                  ABILITIES & ATTACKS
                </h3>
                
                <div className="space-y-3">
                  {character.abilities && character.abilities.length > 0 ? (
                    character.abilities.map((ability, idx) => (
                      <div key={idx} 
                           className="bg-black/30 rounded-lg p-3 border border-white/10 hover:border-purple-500/50 transition-all">
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">
                              {ability.effect === 'heal' ? '💚' : 
                               ability.effect === 'shield' ? '🛡️' : 
                               ability.damage >= 35 ? '💥' : '⚔️'}
                            </span>
                            <div>
                              <div className="text-white font-semibold text-sm">{ability.name}</div>
                              {idx === character.abilities.length - 1 && (
                                <span className="text-xs text-yellow-400 font-bold">ULTIMATE</span>
                              )}
                            </div>
                          </div>
                          {ability.cooldown > 0 && (
                            <div className="text-cyan-400 text-xs">
                              ⏱️ {ability.cooldown} turns
                            </div>
                          )}
                        </div>
                        
                        <div className="text-gray-400 text-xs mb-2">
                          {ability.description}
                        </div>
                        
                        <div className="flex items-center gap-3 text-xs">
                          {ability.damage && (
                            <div className="flex items-center gap-1">
                              <span className="text-red-400">⚡ Damage:</span>
                              <span className="text-white font-bold">{ability.damage}</span>
                            </div>
                          )}
                          {ability.heal && (
                            <div className="flex items-center gap-1">
                              <span className="text-green-400">❤️ Heal:</span>
                              <span className="text-white font-bold">{ability.heal}</span>
                            </div>
                          )}
                          {ability.manaCost && (
                            <div className="flex items-center gap-1">
                              <span className="text-blue-400">💎 Cost:</span>
                              <span className="text-white font-bold">{ability.manaCost}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-500 text-sm italic text-center py-2">
                      No special abilities available
                    </div>
                  )}
                </div>
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
      `}</style>
    </>
  )
}

export default CardPreview