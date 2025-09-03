import React from 'react'

const CastingBar = ({ caster, ability, progress }) => {
  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'mythic': return 'from-red-500 to-yellow-500'
      case 'legendary': return 'from-yellow-400 to-orange-500'
      case 'epic': return 'from-purple-400 to-pink-500'
      case 'rare': return 'from-blue-400 to-cyan-500'
      default: return 'from-gray-400 to-gray-600'
    }
  }

  return (
    <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 w-32 z-20">
      <div className="bg-black/80 backdrop-blur rounded-lg p-2">
        {/* Ability Name */}
        <div className="text-white text-xs font-bold text-center mb-1 truncate">
          {ability.name}
        </div>
        
        {/* Casting Bar */}
        <div className="h-3 bg-gray-800 rounded-full overflow-hidden relative">
          <div 
            className={`h-full bg-gradient-to-r ${getRarityColor(caster.rarity)} transition-all duration-300 relative`}
            style={{ width: `${progress}%` }}
          >
            {/* Shimmer Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          </div>
          
          {/* Pulse Effect at End */}
          {progress > 0 && (
            <div 
              className="absolute top-0 h-full w-1 bg-white/50 animate-pulse"
              style={{ left: `${progress}%` }}
            />
          )}
        </div>
        
        {/* Cast Time */}
        <div className="text-white/70 text-xs text-center mt-1">
          {(progress / 100 * 2).toFixed(1)}s
        </div>
      </div>
      
      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(200%);
          }
        }
        
        .animate-shimmer {
          animation: shimmer 2s linear infinite;
        }
      `}</style>
    </div>
  )
}

export default CastingBar