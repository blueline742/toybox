import React from 'react'
import ActiveCharacterGlow from './ActiveCharacterGlow'

const CharacterCard = ({ character, isActive, currentHealth, maxHealth, damageNumbers = [], teamColor = 'blue' }) => {
  const getRarityGradient = (rarity) => {
    switch (rarity) {
      case 'mythic': return 'from-red-600 via-orange-500 to-yellow-500'
      case 'legendary': return 'from-yellow-400 via-amber-500 to-orange-600'
      case 'epic': return 'from-purple-500 via-pink-500 to-indigo-500'
      case 'rare': return 'from-blue-400 via-cyan-500 to-teal-500'
      default: return 'from-gray-400 via-gray-500 to-gray-600'
    }
  }

  const getRarityBorder = (rarity) => {
    switch (rarity) {
      case 'mythic': return 'border-yellow-500 shadow-yellow-500/50'
      case 'legendary': return 'border-orange-500 shadow-orange-500/50'
      case 'epic': return 'border-purple-500 shadow-purple-500/50'
      case 'rare': return 'border-blue-500 shadow-blue-500/50'
      default: return 'border-gray-500 shadow-gray-500/50'
    }
  }

  const healthPercentage = (currentHealth / maxHealth) * 100
  const isDead = currentHealth <= 0

  return (
    <div className={`
      relative transition-all duration-300
      ${isActive ? 'scale-100 z-30' : 'scale-100'}
      ${isDead ? 'opacity-50 grayscale' : ''}
    `}>
      {/* Active Character Glow Effect */}
      <ActiveCharacterGlow isActive={isActive && !isDead} teamColor={teamColor} />
      
      {/* NFT Card Container */}
      <div className={`
        relative w-32 h-44 md:w-40 md:h-56
        border-2 ${getRarityBorder(character.rarity)}
        rounded-lg md:rounded-xl overflow-hidden
        bg-gradient-to-br ${getRarityGradient(character.rarity)}
        p-0.5
        ${isActive ? 'shadow-2xl' : 'shadow-lg'}
      `}>
        <div className="w-full h-full bg-gray-900 rounded-xl overflow-hidden relative">
          {/* Card Background Pattern */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/30" />
            <div 
              className="absolute inset-0"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='20' height='20' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 20 0 L 0 0 0 20' fill='none' stroke='white' stroke-width='0.5' opacity='0.1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23grid)'/%3E%3C/svg%3E")`
              }}
            />
          </div>
          
          {/* Character Display */}
          <div className="relative z-10 p-2 md:p-3 flex flex-col h-full">
            {/* Header with Name */}
            <div className="text-center mb-1 md:mb-2">
              <div className="text-white font-bold text-xs md:text-sm font-toy truncate">
                {character.name}
              </div>
              <div className={`
                text-[10px] md:text-xs font-bold uppercase
                bg-gradient-to-r ${getRarityGradient(character.rarity)}
                bg-clip-text text-transparent
              `}>
                {character.rarity}
              </div>
            </div>
            
            {/* Character Image/Emoji */}
            <div className="flex-1 flex items-center justify-center relative">
              {character.image ? (
                <img
                  src={character.image}
                  alt={character.name}
                  className="w-14 h-14 md:w-20 md:h-20 object-cover rounded-lg animate-float"
                  style={{ 
                    filter: isActive ? `drop-shadow(0 0 15px ${character.color || '#ffffff'})` : 'none'
                  }}
                  onError={(e) => {
                    // Hide image and show emoji fallback if image fails
                    e.target.style.display = 'none';
                    const emojiDiv = e.target.nextSibling;
                    if (emojiDiv) emojiDiv.style.display = 'block';
                  }}
                />
              ) : null}
              <div 
                className="text-3xl md:text-5xl animate-float"
                style={{ 
                  filter: isActive ? `drop-shadow(0 0 15px ${character.color || '#ffffff'})` : 'none',
                  display: character.image ? 'none' : 'block'
                }}
              >
                {character.emoji}
              </div>
              
            </div>
            
            {/* Stats Section */}
            <div className="space-y-1 mb-1 md:mb-2">
              {/* Health Bar */}
              <div className="relative">
                <div className="flex justify-between text-[10px] md:text-xs text-white/70 mb-1">
                  <span>HP</span>
                  <span>{currentHealth}/{maxHealth}</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      healthPercentage > 50 ? 'bg-green-500' :
                      healthPercentage > 25 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${healthPercentage}%` }}
                  />
                </div>
              </div>
              
              {/* Attack & Defense Stats */}
              <div className="flex justify-between text-[10px] md:text-xs">
                <div className="flex items-center gap-1">
                  <span className="text-red-400">⚔️</span>
                  <span className="text-white font-bold">{character.attack || 50}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-blue-400">🛡️</span>
                  <span className="text-white font-bold">{character.defense || 30}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-yellow-400">⚡</span>
                  <span className="text-white font-bold">{character.speed || 40}</span>
                </div>
              </div>
            </div>
            
            {/* Abilities Preview */}
            <div className="border-t border-gray-700 pt-1 md:pt-2">
              <div className="text-[10px] md:text-xs text-white/50 mb-1 hidden md:block">Abilities:</div>
              <div className="flex gap-1 flex-wrap">
                {character.abilities && character.abilities.slice(0, 3).map((ability, idx) => (
                  <div 
                    key={idx}
                    className="bg-gray-800 rounded px-1 py-0.5 text-[9px] md:text-xs text-white/70 hidden md:block"
                    title={ability.name}
                  >
                    {ability.name.length > 8 ? ability.name.substring(0, 8) + '...' : ability.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          
          {/* Death Overlay with Big Red X */}
          {isDead && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center animate-death-overlay">
              {/* Big Red X */}
              <svg 
                className="absolute inset-0 w-full h-full pointer-events-none animate-x-appear"
                viewBox="0 0 100 100"
              >
                <line 
                  x1="20" y1="20" 
                  x2="80" y2="80" 
                  stroke="red" 
                  strokeWidth="8" 
                  strokeLinecap="round"
                  opacity="0.9"
                />
                <line 
                  x1="80" y1="20" 
                  x2="20" y2="80" 
                  stroke="red" 
                  strokeWidth="8" 
                  strokeLinecap="round"
                  opacity="0.9"
                />
                {/* Shadow lines for depth */}
                <line 
                  x1="20" y1="20" 
                  x2="80" y2="80" 
                  stroke="darkred" 
                  strokeWidth="10" 
                  strokeLinecap="round"
                  opacity="0.4"
                  transform="translate(2, 2)"
                />
                <line 
                  x1="80" y1="20" 
                  x2="20" y2="80" 
                  stroke="darkred" 
                  strokeWidth="10" 
                  strokeLinecap="round"
                  opacity="0.4"
                  transform="translate(2, 2)"
                />
              </svg>
              
              {/* DEFEATED Text */}
              <div className="relative z-10 animate-defeated-text">
                <div className="text-red-500 text-xl md:text-2xl font-bold font-toy transform rotate-12 text-shadow-lg">
                  DEFEATED
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Damage Numbers */}
      {damageNumbers.map(number => (
        <div
          key={number.id}
          className={`
            absolute z-50
            ${number.type === 'damage' ? 'text-red-500' : 'text-green-500'}
            ${number.isCritical ? 'text-4xl text-yellow-400' : 'text-2xl'}
            font-bold animate-float-up pointer-events-none
            left-1/2 transform -translate-x-1/2
          `}
          style={{
            top: '-20px',
            textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
          }}
        >
          {number.type === 'damage' ? '-' : '+'}{number.amount}
          {number.isCritical && ' CRIT!'}
        </div>
      ))}
      
      
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        @keyframes float-up {
          0% {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
          100% {
            opacity: 0;
            transform: translateX(-50%) translateY(-60px);
          }
        }
        
        @keyframes death-overlay {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }
        
        @keyframes x-appear {
          0% {
            transform: scale(0) rotate(0deg);
            opacity: 0;
          }
          50% {
            transform: scale(1.2) rotate(180deg);
            opacity: 1;
          }
          100% {
            transform: scale(1) rotate(360deg);
            opacity: 0.9;
          }
        }
        
        @keyframes defeated-text {
          0% {
            transform: scale(0) rotate(12deg);
            opacity: 0;
          }
          50% {
            transform: scale(1.2) rotate(12deg);
          }
          100% {
            transform: scale(1) rotate(12deg);
            opacity: 1;
          }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-float-up {
          animation: float-up 2s ease-out forwards;
        }
        
        .animate-death-overlay {
          animation: death-overlay 0.3s ease-out forwards;
        }
        
        .animate-x-appear {
          animation: x-appear 0.5s ease-out forwards;
        }
        
        .animate-defeated-text {
          animation: defeated-text 0.6s ease-out forwards;
        }
        
        .text-shadow-lg {
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8), 0 0 20px rgba(255, 0, 0, 0.5);
        }
      `}</style>
    </div>
  )
}

export default CharacterCard